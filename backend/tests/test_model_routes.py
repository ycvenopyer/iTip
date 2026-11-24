import json
import os
import socket
import unittest
from collections import deque
from unittest.mock import patch

import httpx
from openai import OpenAI

from app import app


def event_stream(*events):
    body = "".join(f"data: {json.dumps(event)}\n\n" for event in events)
    return httpx.Response(200, headers={"Content-Type": "text/event-stream"},
                          content=body + "data: [DONE]\n\n")


def text_chunk(text):
    return {"id": "test", "created": 0, "model": "demo", "object": "chat.completion.chunk",
            "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": "stop"}]}


def provider_error(status, code, **headers):
    return httpx.Response(status, headers=headers,
                          json={"error": {"code": code, "message": "Do not expose upstream text"}})


def message(id, role, text):
    return {"id": id, "role": role, "parts": [{"type": "text", "text": text}]}


class ModelRouteTests(unittest.TestCase):
    def setUp(self):
        self.enterContext(patch.dict(os.environ, {
            "AI_MODEL": "demo", "AI_BASE_URL": "https://model.example.com/v1",
            "AI_API_KEY": "synthetic-key", "BACKEND_PROXY_SECRET": "", "VERCEL": "",
        }))
        self.enterContext(patch("app.session_user", return_value={"id": "test-user"}))
        self.enterContext(patch("app.throttle"))
        self.enterContext(patch("agent.retrieve", return_value=([], [])))
        self.sleep = self.enterContext(patch("model_stream.time.sleep"))
        self.responses = deque()
        self.requests = []
        self.client = app.test_client()
        self.credentials = {"baseUrl": "https://model.example.com/v1/chat/completions/",
                            "apiKey": "synthetic-key", "model": "demo", "vision": False}

    def model_client(self):
        return OpenAI(base_url="https://model.example.com/v1", api_key="synthetic-key", max_retries=0,
                      http_client=httpx.Client(transport=httpx.MockTransport(self.respond)))

    def respond(self, request):
        self.requests.append(request)
        return self.responses.popleft()

    def chat(self, messages):
        response = self.client.post("/api/chat", json={"messages": messages}, buffered=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["x-vercel-ai-ui-message-stream"], "v1")
        events = response.get_data(as_text=True).strip().split("\n\n")
        self.assertEqual(events[-1], "data: [DONE]")
        return [json.loads(event.removeprefix("data: ")) for event in events[:-1]]

    def test_second_turn_recovers_from_provider_concurrency_limit(self):
        self.responses.extend([
            event_stream(text_chunk("First reply")),
            provider_error(429, 1302, **{"Retry-After": "3"}),
            event_stream(text_chunk("Second reply")),
        ])
        first = message("u1", "user", "First question")
        with patch("agent.get_model", side_effect=lambda **kwargs: (self.model_client(), "demo")):
            first_events = self.chat([first])
            second_events = self.chat([first, message("a1", "assistant", "First reply"),
                                       message("u2", "user", "Second question")])
        self.assertEqual(first_events[-1]["type"], "finish")
        self.assertEqual(second_events[-1]["type"], "finish")
        self.assertEqual([event["delta"] for event in second_events if event["type"] == "text-delta"],
                         ["Second reply"])
        self.assertEqual(len(self.requests), 3)
        retry_messages = json.loads(self.requests[-1].content)["messages"]
        self.assertEqual([item["content"] for item in retry_messages[1:]],
                         ["First question", "First reply", "Second question"])
        self.assertGreaterEqual(self.sleep.call_args.args[0], 3)
        self.sleep.assert_called_once()

    def test_known_quota_error_is_not_retried(self):
        self.responses.append(provider_error(429, "1113"))
        with patch("agent.get_model", return_value=(self.model_client(), "demo")):
            events = self.chat([message("u1", "user", "Question")])
        self.assertIn("额度", events[-1]["errorText"])
        self.assertEqual(len(self.requests), 1)
        self.sleep.assert_not_called()

    def test_stream_with_partial_text_is_not_replayed(self):
        self.responses.append(event_stream(text_chunk("Partial"), {"error": {"code": "1302"}}))
        with patch("agent.get_model", return_value=(self.model_client(), "demo")):
            events = self.chat([message("u1", "user", "Question")])
        self.assertEqual(events[-2]["type"], "text-end")
        self.assertIn("并发", events[-1]["errorText"])
        self.assertEqual(len(self.requests), 1)
        self.sleep.assert_not_called()

    def test_retry_after_beyond_budget_is_reported(self):
        self.responses.append(provider_error(429, "rate_limit_exceeded", **{"Retry-After": "60"}))
        with patch("agent.get_model", return_value=(self.model_client(), "demo")):
            events = self.chat([message("u1", "user", "Question")])
        self.assertIn("60 秒", events[-1]["errorText"])
        self.assertEqual(len(self.requests), 1)
        self.sleep.assert_not_called()

    def test_custom_connectivity_requires_streamed_text(self):
        self.responses.append(event_stream(text_chunk("OK")))
        with patch("custom_model.PublicModelTransport.handle_request", side_effect=self.respond):
            response = self.client.post("/api/models/test", json=self.credentials)
        self.assertEqual(response.json, {"ok": True})
        self.assertEqual(self.requests[0].url.path, "/v1/chat/completions")
        self.assertTrue(json.loads(self.requests[0].content)["stream"])

    def test_custom_connectivity_shows_actionable_errors(self):
        for upstream, expected in (
            (provider_error(401, "invalid_api_key"), "API Key"),
            (provider_error(400, "1211"), "模型 ID"),
            (provider_error(429, "insufficient_quota"), "用量额度"),
            (httpx.Response(200, json={"choices": []}), "流式"),
            (event_stream(), "正文"),
        ):
            with self.subTest(expected=expected):
                self.responses.append(upstream)
                with patch("custom_model.PublicModelTransport.handle_request", side_effect=self.respond):
                    response = self.client.post("/api/models/test", json=self.credentials)
                self.assertEqual(response.status_code, 502)
                self.assertIn(expected, response.json["error"])
                self.assertNotIn("Do not expose upstream text", response.json["error"])

    def test_custom_connectivity_reports_dns_failure(self):
        with patch("custom_model.socket.getaddrinfo", side_effect=socket.gaierror()):
            response = self.client.post("/api/models/test", json=self.credentials)
        self.assertEqual(response.status_code, 502)
        self.assertIn("无法解析 Base URL", response.json["error"])
