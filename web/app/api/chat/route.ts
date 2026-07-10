import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, smoothStream, streamText, type ModelMessage, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { resolveLlmConnection, isZhipuProvider } from "@/lib/ai/config";
import { CALLIGRAPHY_FEW_SHOT_MESSAGES, CALLIGRAPHY_SYSTEM } from "@/lib/ai/prompts";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 120;
export const runtime = "nodejs";

function hasImageMessages(messages: UIMessage[]): boolean {
  return messages.some((m) =>
    m.parts.some((p) => p.type === "file")
  );
}

/**
 * 智谱 GLM-4V 兼容转换：AI SDK 产生 {type:"image", image:"data:..."}
 * 智谱只接受 {type:"image_url", image_url:{url:"data:..."}}
 */
function adaptImagesForZhipu(
  messages: Array<{ role: string; content: unknown }>
): Array<{ role: string; content: unknown }> {
  return messages.map((msg) => {
    if (!Array.isArray(msg.content)) return msg;
    return {
      ...msg,
      content: msg.content.map((part) => {
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          part.type === "image" &&
          "image" in part &&
          typeof part.image === "string"
        ) {
          return {
            type: "image_url" as const,
            image_url: { url: part.image },
          };
        }
        return part;
      }),
    };
  });
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

  const openai = createOpenAI({ baseURL, apiKey });
  const model = openai.chat(modelId);

  let modelMessages = await convertToModelMessages(uiMessages, {
    ignoreIncompleteToolCalls: true,
  });

  // 智谱只接受 image_url 格式
  if (hasImages && isZhipuProvider(baseURL)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modelMessages = adaptImagesForZhipu(modelMessages as any) as ModelMessage[];
  }

  const result = streamText({
    model,
    system: CALLIGRAPHY_SYSTEM,
    messages: [...CALLIGRAPHY_FEW_SHOT_MESSAGES, ...modelMessages],
    experimental_transform: smoothStream({
      chunking: new Intl.Segmenter("zh-Hans", { granularity: "word" }),
    }),
  });

  return result.toUIMessageStreamResponse();
}
