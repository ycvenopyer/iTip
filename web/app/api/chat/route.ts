import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { CALLIGRAPHY_SYSTEM } from "@/lib/ai/prompts";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "未配置 OPENAI_API_KEY。请在 .env 中设置（可配合 OPENAI_BASE_URL 指向兼容网关）。" },
      { status: 503 }
    );
  }

  let body: { messages: UIMessage[] };
  try {
    const raw = (await req.json()) as { messages: UIMessage[] };
    if (!raw.messages || !Array.isArray(raw.messages)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    body = { messages: raw.messages };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages: uiMessages } = body;
  const modelId = process.env.OPENAI_MODEL || "gpt-4o";
  const openai = createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  });
  const model = openai(modelId);

  const modelMessages = await convertToModelMessages(uiMessages, {
    ignoreIncompleteToolCalls: true,
  });

  const result = streamText({
    model,
    system: CALLIGRAPHY_SYSTEM,
    messages: modelMessages,
    experimental_transform: smoothStream({
      chunking: new Intl.Segmenter("zh-Hans", { granularity: "word" }),
    }),
  });

  return result.toUIMessageStreamResponse();
}
