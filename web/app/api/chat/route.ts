import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { resolveLlmConnection } from "@/lib/ai/config";
import { CALLIGRAPHY_SYSTEM } from "@/lib/ai/prompts";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }

  const llm = resolveLlmConnection();
  if (!llm.ok) {
    return NextResponse.json({ error: llm.message }, { status: 503 });
  }
  const { baseURL, apiKey, modelId } = llm.data;

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

  const openai = createOpenAI({
    baseURL,
    apiKey,
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
