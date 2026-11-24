import { backendHeaders, backendUrl } from "@/lib/backend";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BODY_BYTES = 4_000_000;

async function proxy(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path;
  const pathname = "/api/" + path.map(encodeURIComponent).join("/");
  const requestUrl = new URL(request.url);
  const changesData = request.method !== "GET";
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (changesData && (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && requestUrl.origin !== origin &&
        origin !== `https://${host}` && origin !== `http://${host}`))) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }

  const headers = backendHeaders();
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (ip) headers.set("X-iTip-Client-IP", ip);
  for (const name of ["cookie", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let deadline: AbortSignal | undefined;
  try {
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
      return Response.json({ error: "消息或附图过大，请缩小图片或开启新对话" }, { status: 413 });
    }
    const body = changesData && request.body ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "消息或附图过大，请缩小图片或开启新对话" }, { status: 413 });
    }
    deadline = AbortSignal.timeout(105000);
    const upstream = await fetch(backendUrl(pathname + requestUrl.search), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, deadline]),
    });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "x-vercel-ai-ui-message-stream", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("Set-Cookie", cookie);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    if (deadline?.aborted) return Response.json({ error: "等待 iTip 后端响应超时，请重试" }, { status: 504 });
    return Response.json({ error: "无法连接 iTip 后端" }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
