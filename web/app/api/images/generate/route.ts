import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveImageGenConnection } from "@/lib/ai/config";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;
export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().min(1).max(1000),
  size: z.enum(["1024x1024", "768x1024", "1024x768"]).optional().default("1024x1024"),
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "127.0.0.1";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`image-gen:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${rl.retryAfterSec} 秒后重试` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "请提供有效的 prompt（1-1000 字符）" }, { status: 400 });
  }

  const { prompt, size } = parsed.data;

  const conn = resolveImageGenConnection();
  if (!conn.ok) {
    return NextResponse.json({ error: conn.message }, { status: 503 });
  }

  const { baseURL, apiKey, modelId } = conn.data;
  const url = `${baseURL || "https://api.openai.com/v1"}/images/generations`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        n: 1,
        size,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      let errMsg = `图片生成失败 (${res.status})`;
      try {
        const ej = JSON.parse(errBody) as { error?: { message?: string } };
        if (ej.error?.message) errMsg = ej.error.message;
      } catch { /* use default */ }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = (await res.json()) as {
      data?: { url?: string; b64_json?: string }[];
    };

    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
    if (!imageUrl) {
      return NextResponse.json({ error: "模型未返回图片" }, { status: 502 });
    }

    return NextResponse.json({
      url: imageUrl,
      model: modelId,
      size,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: `生成请求失败：${msg}` }, { status: 502 });
  }
}
