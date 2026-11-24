import re
import socket
from dataclasses import dataclass, field
from ipaddress import IPv4Address, IPv4Network

import httpx
from openai import OpenAI


HOST = re.compile(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}")
RESERVED = (IPv4Network("192.0.0.0/24"), IPv4Network("192.88.99.0/24"))
URL_ERROR = "Base URL 须为公网 HTTPS 域名，使用默认端口，且不带账号、查询参数或片段"


class ModelDNSError(httpx.ConnectError):
    pass


class ModelAddressError(httpx.ConnectError):
    pass


class PublicModelTransport(httpx.HTTPTransport):
    def handle_request(self, request):
        url = request.url
        try:
            records = socket.getaddrinfo(url.host + ".", 443, socket.AF_INET, socket.SOCK_STREAM)
        except OSError:
            raise ModelDNSError("模型域名无法解析", request=request) from None
        addresses = list(dict.fromkeys(IPv4Address(record[4][0]) for record in records))
        if not addresses or any(not address.is_global or address.is_multicast or address.is_reserved
                                or any(address in subnet for subnet in RESERVED) for address in addresses):
            raise ModelAddressError("模型域名须解析到公网 IPv4 地址", request=request)

        # Pin the checked address for TCP and keep the provider hostname for TLS and HTTP.
        request.url = url.copy_with(host=str(addresses[0]))
        request.headers["Host"] = url.host
        request.headers.pop("OpenAI-Organization", None)
        request.headers.pop("OpenAI-Project", None)
        request.extensions["sni_hostname"] = url.host
        try:
            return super().handle_request(request)
        finally:
            request.url = url


@dataclass(frozen=True)
class CustomModel:
    base_url: str
    model: str
    api_key: str = field(repr=False)
    vision: bool

    @classmethod
    def parse(cls, data):
        if not isinstance(data, dict):
            raise ValueError("自定义模型配置无效")
        base, model, key, vision = (data.get(name) for name in ("baseUrl", "model", "apiKey", "vision"))
        if not isinstance(base, str) or len(base) > 500 or any(char in base for char in "\\?#@"):
            raise ValueError(URL_ERROR)
        try:
            url = httpx.URL(base.strip())
        except httpx.InvalidURL:
            raise ValueError(URL_ERROR) from None
        if (url.scheme != "https" or url.port is not None or url.userinfo or
                not HOST.fullmatch(url.raw_host.decode("ascii")) or
                url.host.endswith((".localhost", ".local", ".internal", ".home.arpa"))):
            raise ValueError(URL_ERROR)
        if not isinstance(model, str) or not 1 <= len(model.strip()) <= 200 or not isinstance(vision, bool):
            raise ValueError("请填写有效的模型 ID 和图片支持选项")
        if not isinstance(key, str) or not re.fullmatch(r"[!-~]{1,1024}", key.strip()):
            raise ValueError("请填写有效的 API Key")
        normalized = str(url).rstrip("/").removesuffix("/chat/completions")
        return cls(normalized, model.strip(), key.strip(), vision)

    def client(self, timeout=55):
        http_client = httpx.Client(timeout=timeout, follow_redirects=False, trust_env=False,
                                   transport=PublicModelTransport(trust_env=False))
        return OpenAI(base_url=self.base_url, api_key=self.api_key, timeout=timeout,
                      max_retries=0, http_client=http_client)
