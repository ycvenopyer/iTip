import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, smoothStream, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { resolveLlmConnection } from "@/lib/ai/config";
import { CALLIGRAPHY_FEW_SHOT_MESSAGES, CALLIGRAPHY_SYSTEM } from "@/lib/ai/prompts";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 120;
export const runtime = "nodejs";

/** 检测消息列表中是否包含图片/文件附件 */
function hasImageMessages(messages: UIMessage[]): boolean {
  return messages.some((m) =>
    m.parts.some((p) => p.type === "file")
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
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
  const hasImages = hasImageMessages(uiMessages);

  const llm = resolveLlmConnection(hasImages);
  if (!llm.ok) {
    return NextResponse.json({ error: llm.message }, { status: 503 });
  }
  const { baseURL, apiKey, modelId } = llm.data;

  // 含图片时提示用户当前使用的视觉模型
  const systemMessage = hasImages
    ? CALLIGRAPHY_SYSTEM + "\n\n（当前对话含图片，已自动切换至视觉模型：" + modelId + "）"
    : CALLIGRAPHY_SYSTEM;

  const openai = createOpenAI({
    baseURL,
    apiKey,
  });
  const model = openai.chat(modelId);

  const modelMessages = await convertToModelMessages(uiMessages, {
    ignoreIncompleteToolCalls: true,
  });

  const result = streamText({
    model,
    system: systemMessage,
    messages: [...CALLIGRAPHY_FEW_SHOT_MESSAGES, ...modelMessages],
    experimental_transform: smoothStream({
      chunking: new Intl.Segmenter("zh-Hans", { granularity: "word" }),
    }),
  });

  return result.toUIMessageStreamResponse();
}
