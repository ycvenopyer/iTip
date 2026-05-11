# 开发与环境

## 目录

- `web/`：Next 应用与全部源码、`.env.example`。
- `docs/`：需求、架构、本文档（与实现同步维护）。

## 环境变量

自 `web/.env.example` 复制为 `web/.env.local`。

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | 随机长字符串，用于 JWT 签名；**必填**（注册/登录会写入 Cookie）。 |
| `DATABASE_PATH` | 可选；默认 `web` 下 `data/itip.db`（已 `.gitignore`）。 |
| `AI_BASE_URL` | **OpenAI 兼容** API 根地址。**智谱直连**典型值：`https://open.bigmodel.cn/api/paas/v4`（套餐不同可能不同，以 [智谱文档](https://open.bigmodel.cn/dev/api) 为准）。本机 Ollama 一般为 `http://127.0.0.1:11434/v1`。`AI_*` 优先于旧名 `OPENAI_BASE_URL`。 |
| `AI_API_KEY` | 智谱等平台必填 **API Key**；**仅本机 Ollama** 时可留空（内部占位）。优先于 `OPENAI_API_KEY`。 |
| `AI_MODEL` | 模型名（控制台/服务商给出的 id）。未设置时：智谱域名默认 `glm-4-flash`，其它带 `AI_BASE_URL` 时默认 `llama3.2`，仅密钥走官方默认基址时默认 `gpt-4o`。附图须选**多模态**模型。 |
| `OPENAI_API_KEY` 等 | **兼容旧名**，行为与上面对应项相同，**AI\_\*** 优先。 |

在 `web/.env.local` 中**至少**配置 `AUTH_SECRET`；**对话**需配置 **`AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL`**（智谱直连）或本机 Ollama 等（见 `web/lib/ai/config.ts`）。

**智谱 GLM 直连（推荐，无需 Ollama）**：在 [智谱开放平台](https://open.bigmodel.cn) 创建 API Key，使用 [OpenAI 兼容](https://open.bigmodel.cn/dev/api) 方式对接。典型三项：

```env
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=<你的 Key>
AI_MODEL=glm-4-flash
```

`AI_MODEL` 以控制台实际模型名为准（如 `glm-4-plus` 等）。**Coding 订阅**等若 Base 不同，以官方文档替换 `AI_BASE_URL`。

**本机 Ollama（可选）**：安装 [Ollama](https://ollama.com) 后 `ollama pull` 模型并启动服务，`AI_BASE_URL=http://127.0.0.1:11434/v1`，`AI_API_KEY` 可留空。

仓库内不提交 `.env.local`（见 `web/.gitignore`）。

## 本地运行

```bash
cd web
# 若尚无 .env.local：cp .env.example .env.local 并填好各变量
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`，**注册/登录**后进入「对话」；若未配置任何 LLM 相关变量，会得到 **503** 与提示。

## 生产（私有部署）

1. 构建：

```bash
cd web
npm run build
```

2. 独立输出（`output: "standalone"`）产物在 `web/.next/standalone`，与官方 [Self-hosting](https://nextjs.org/docs/app/building-your-application/deploying#nodejs-server) 说明一致，需同时带上 `static` 等目录或按官方 Docker 样例组织。

3. 启动：

```bash
cd web
npm run start
```

默认端口 3000，可用环境变量 `PORT` 调整。

4. 反向代理（Nginx 等）若需 **SSE/流式**，请关闭对响应的缓冲，否则对话可能不流畅（见 [Self-hosting 流式](https://nextjs.org/docs/app/guides/self-hosting#streaming)）。

## 安全与维护

- 保持 `next` 在官方公告的**当前修复线**上（如 15.2.8+ 对 [2025-12-11 安全更新](https://nextjs.org/blog/security-update-2025-12-11) 的覆盖）；升级后运行 `npm run build` 并更新本文档中版本句。
- 鉴权在 API 中校验；勿仅信任中间件（参见 [App Router 认证](https://nextjs.org/docs/app/guides/authentication)）。

## 常见故障

- **`better-sqlite3` 编译失败**：需安装本机 C++ 构建环境（如 Windows 的 `windows-build-tools` 或 Visual Studio Build Tools）。
- **对话 503**：智谱未填 `AI_API_KEY` / Base 错误，或未配置任何 LLM 变量，或接口不可达（如 Ollama 未启动）。
- **附图无效**：当前模型需支持多模态；在 `.env` 中更换为带 vision 的模型名。
