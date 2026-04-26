# 开发与环境

## 目录

- `web/`：Next 应用与全部源码、`.env.example`。
- `docs/`：需求、架构、本文档（与实现同步维护）。

## 推送到 GitHub（账号 [ycvenopyer](https://github.com/ycvenopyer)）

目标：把本仓库推到你 **GitHub 用户名下** 的某仓库，例如 `https://github.com/ycvenopyer/iTip`（**不是** 博客源站仓库 [ycvenopyer.github.io](https://github.com/ycvenopyer/ycvenopyer.github.io)）。

1. 打开 [github.com/new](https://github.com/new)，**Owner** 选 `ycvenopyer`，**Repository name** 填 `iTip`（与下面远程 URL 一致即可），**不要**勾选 “Add a README / .gitignore / license”（保持空仓库），创建。
2. 在本地 iTip 根目录执行（若已配置 `origin` 可省略 `git remote add` 一行）：

```bash
cd /path/to/iTip
git remote add origin https://github.com/ycvenopyer/iTip.git
git branch -M main
git push -u origin main
```

说明：`ycvenopyer.github.io` 是 **个人主页站**；`iTip` 是**独立项目仓库**。本应用带 **API、SQLite、Node**，**不能**整站用 GitHub Pages 托管，代码在 GitHub 上即可，线上用自有服务或 PaaS 跑 `web/`。

## 环境变量

自 `web/.env.example` 复制为 `web/.env.local`。

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | 随机长字符串，用于 JWT 签名；**必填**（注册/登录会写入 Cookie）。 |
| `DATABASE_PATH` | 可选；默认 `web` 下 `data/itip.db`（已 `.gitignore`）。 |
| `AI_BASE_URL` | **可选**；**OpenAI 兼容** API 根路径（以 `/v1` 结尾）。本机 Ollama 见下。`AI_*` 优先于旧名 `OPENAI_BASE_URL`。 |
| `AI_API_KEY` | **按提供方要求**：云/自建若需要密钥则填；**本机 Ollama 可留空**（内部使用占位）。优先于 `OPENAI_API_KEY`。 |
| `AI_MODEL` | 模型名；未设置时：若已配置 `AI_BASE_URL` 则默认 `llama3.2`（Ollama 常见名），否则默认 `gpt-4o`。需附图时须选带**多模态**的模型。 |
| `OPENAI_API_KEY` 等 | **兼容旧名**，行为与上面对应项相同，**AI\_\*** 优先。 |

在 `web/.env.local` 中**至少**配置 `AUTH_SECRET`；**对话**需再配置 **「本机/网关 Base + 模型」** 或 **云 API 密钥**（二选一或组合，见 `resolveLlmConnection`）。**不限制使用美国 OpenAI**：任意提供 OpenAI 兼容协议的服务即可（Ollama 本地、OpenRouter、Groq、vLLM、部分国内云「OpenAI 兼容」等）。

**本机 Ollama（开源、离线、无区号限制）**：安装 [Ollama](https://ollama.com) 后执行 `ollama pull llama3.2`（或自选模型），启动服务，再设 `AI_BASE_URL=http://127.0.0.1:11434/v1` 与 `AI_MODEL=你的模型名`。

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
- **对话 503**：未配置 `AI_BASE_URL` / `AI_API_KEY`（或旧名 `OPENAI_*`）或接口不可达（如 Ollama 未启动）。
- **附图无效**：当前模型需支持多模态；在 `.env` 中更换为带 vision 的模型名。
