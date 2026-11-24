import math
import random
import ssl
import time
from email.utils import parsedate_to_datetime

import httpx
from openai import APIConnectionError, APIError, APIStatusError, APITimeoutError

from custom_model import ModelAddressError, ModelDNSError


class EmptyModelReply(Exception):
    pass


class UnsupportedModelStream(Exception):
    pass


# Providers can report a business error in either an HTTP response or an SSE event.
ERROR_CODES = {
    "quota": {"insufficient_quota", "billing_hard_limit_reached", "insufficient_balance",
              "1113", "1304", "1308", "1309", "1310"},
    "concurrency": {"1302"},
    "rate": {"rate_limit_exceeded", "1303", "1305", "1312"},
    "auth": {"invalid_api_key", "invalid_authentication", "permission_denied", "1311"},
    "policy": {"1313"},
    "model": {"model_not_found", "1211"},
    "unsupported": {"unsupported_model", "1212"},
    "context": {"context_length_exceeded", "1261"},
}
HTTP_ERRORS = {
    400: "request", 401: "auth", 402: "quota", 403: "auth", 404: "endpoint",
    405: "endpoint", 408: "timeout", 422: "request", 429: "rate_or_quota", 504: "timeout",
}


def model_error_details(error):
    status = error.status_code if isinstance(error, APIStatusError) else None
    if isinstance(error, APIError):
        body = error.body if isinstance(error.body, dict) else {}
        codes = {str(body.get(field)) for field in ("code", "type")}
        for kind, known_codes in ERROR_CODES.items():
            if codes & known_codes:
                return kind, status
    if status is not None:
        if 300 <= status < 400:
            return "endpoint", status
        return HTTP_ERRORS.get(status, "upstream"), status
    if isinstance(error, (APITimeoutError, httpx.TimeoutException)):
        return "timeout", None
    if isinstance(error, (APIConnectionError, httpx.RequestError)):
        cause = error
        while cause is not None:
            if isinstance(cause, ModelDNSError):
                return "dns", None
            if isinstance(cause, ModelAddressError):
                return "address", None
            if isinstance(cause, ssl.SSLError):
                return "tls", None
            cause = cause.__cause__
        return "connection", None
    if isinstance(error, UnsupportedModelStream):
        return "unsupported", None
    if isinstance(error, EmptyModelReply):
        return "empty", None
    return "upstream", None


def retry_after(error):
    if not isinstance(error, APIStatusError):
        return None
    headers = error.response.headers
    for name, scale in (("retry-after-ms", 0.001), ("retry-after", 1)):
        try:
            seconds = float(headers.get(name, "")) * scale
        except ValueError:
            continue
        if math.isfinite(seconds) and seconds >= 0:
            return seconds
    try:
        return max(0, parsedate_to_datetime(headers["retry-after"]).timestamp() - time.time())
    except (KeyError, ValueError, TypeError, OverflowError):
        return None


def stream_choices(client, model, messages, retries=0):
    emitted_text = False
    wait_budget = 10
    for attempt in range(retries + 1):
        try:
            with client.chat.completions.create(model=model, stream=True, messages=messages) as stream:
                has_choices = False
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    has_choices = True
                    choice = chunk.choices[0]
                    if choice.delta and choice.delta.content:
                        emitted_text = True
                    if emitted_text:
                        yield choice
                content_type = stream.response.headers.get("content-type", "").partition(";")[0].strip().lower()
                if not has_choices and content_type != "text/event-stream":
                    raise UnsupportedModelStream()
            return
        except APIError as error:
            kind, _ = model_error_details(error)
            if emitted_text or attempt >= retries or kind not in {"concurrency", "rate", "rate_or_quota"}:
                raise
            if isinstance(error, APIStatusError) and error.response.headers.get("x-should-retry") == "false":
                raise
            delay = max(2 ** attempt, retry_after(error) or 0) + random.uniform(0, 0.25)
            if delay > wait_budget:
                raise
            time.sleep(delay)
            wait_budget -= delay
