/**
 * OpenAI 兼容通道：任何提供 /v1/chat/completions 的服务均可
 *（Ollama、vLLM、LiteLLM、OpenRouter、Groq、智谱流动等），不绑定美国 OpenAI 账号。
 */

function trimStr(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  const t = s.trim();
  return t.length ? t : undefined;
}

export type LlmConnection = {
  baseURL: string | undefined;
  apiKey: string;
  modelId: string;
};

/**
 * 从环境变量解析 LLM 连接；支持根据是否有图片自动切换视觉模型。
 * - AI_MODEL: 默认文本模型
 * - AI_VISION_MODEL: 视觉模型（可选，含图片时自动切换）
 */
export function resolveLlmConnection(
  hasImages?: boolean
): { ok: true; data: LlmConnection } | { ok: false; message: string } {
  const baseURL = trimStr(process.env.AI_BASE_URL) || trimStr(process.env.OPENAI_BASE_URL);
  const rawKey = trimStr(process.env.AI_API_KEY) || trimStr(process.env.OPENAI_API_KEY);
  const explicitModel = trimStr(process.env.AI_MODEL) || trimStr(process.env.OPENAI_MODEL);
  const visionModel = trimStr(process.env.AI_VISION_MODEL);

  if (!rawKey && !baseURL) {
    return {
      ok: false,
      message:
        "未配置模型接口：请设置 AI_BASE_URL + AI_API_KEY。详见 .env.example 与 docs/DEV.md。",
    };
  }

  const isZhipu = isZhipuProvider(baseURL);

  // 含图片时优先使用视觉模型
  let modelId: string;
  if (hasImages && visionModel) {
    modelId = visionModel;
  } else if (hasImages && isZhipu) {
    modelId = "glm-4v-flash";
  } else if (hasImages) {
    modelId = "gpt-4o";
  } else if (explicitModel) {
    modelId = explicitModel;
  } else if (baseURL) {
    modelId = isZhipu ? "glm-4-flash" : "llama3.2";
  } else {
    modelId = "gpt-4o";
  }

  const apiKey = rawKey || (baseURL ? "ollama" : "");

  return { ok: true, data: { baseURL, apiKey, modelId } };
}

export function isZhipuProvider(baseURL: string | undefined): boolean {
  return !!(baseURL && /bigmodel\.cn|zhipu/i.test(baseURL));
}

export type ImageGenConnection = {
  baseURL: string | undefined;
  apiKey: string;
  modelId: string;
};

export function resolveImageGenConnection(): { ok: true; data: ImageGenConnection } | { ok: false; message: string } {
  const baseURL = trimStr(process.env.AI_BASE_URL) || trimStr(process.env.OPENAI_BASE_URL);
  const rawKey = trimStr(process.env.AI_API_KEY) || trimStr(process.env.OPENAI_API_KEY);
  const explicitModel = trimStr(process.env.AI_IMAGE_MODEL);

  if (!rawKey && !baseURL) {
    return {
      ok: false,
      message: "未配置模型接口：请设置 AI_BASE_URL + AI_API_KEY。详见 .env.example。",
    };
  }

  const modelId =
    explicitModel ||
    (isZhipuProvider(baseURL) ? "cogview-3-flash" : "dall-e-3");

  const apiKey = rawKey || (baseURL ? "ollama" : "");

  return { ok: true, data: { baseURL, apiKey, modelId } };
}
