/**
 * OpenAI 兼容通道：任何提供 /v1/chat/completions 的服务均可
 *（Ollama、vLLM、LiteLLM、OpenRouter、Groq、硅基流动等），不绑定美国 OpenAI 账号。
 */

function trimStr(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  const t = s.trim();
  return t.length ? t : undefined;
}

export type LlmConnection = {
  baseURL: string | undefined;
  /** 本地/自建接口常忽略校验，未配置时可为占位 */
  apiKey: string;
  modelId: string;
};

/**
 * 从环境变量解析 LLM 连接；`AI_*` 优先，其次兼容历史 `OPENAI_*`。
 * - 仅云 API：只配 `AI_API_KEY` 即可（走 OpenAI 兼容默认基址，或由提供方在文档中说明的变量）。
 * - 本机 Ollama：配 `AI_BASE_URL=http://127.0.0.1:11434/v1`，`AI_API_KEY` 可留空（将使用占位 key）。
 */
export function resolveLlmConnection(): { ok: true; data: LlmConnection } | { ok: false; message: string } {
  const baseURL = trimStr(process.env.AI_BASE_URL) || trimStr(process.env.OPENAI_BASE_URL);
  const rawKey = trimStr(process.env.AI_API_KEY) || trimStr(process.env.OPENAI_API_KEY);
  const explicitModel = trimStr(process.env.AI_MODEL) || trimStr(process.env.OPENAI_MODEL);

  if (!rawKey && !baseURL) {
    return {
      ok: false,
      message:
        "未配置模型接口：请设置 AI_BASE_URL（本机/兼容网关，如 Ollama）和/或 AI_API_KEY（云或自建密钥）。已弃用仅 OPENAI_ 命名时仍可读 OPENAI_API_KEY 作为兼容。详见 .env.example 与 docs/DEV.md。",
    };
  }

  const modelId = explicitModel || (baseURL ? "llama3.2" : "gpt-4o");
  const apiKey = rawKey || (baseURL ? "ollama" : "");

  return { ok: true, data: { baseURL, apiKey, modelId } };
}
