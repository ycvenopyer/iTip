# 开发与环境

## 目录

- `web/`：Next 应用与全部源码、`.env.example`。
- `docs/`：需求、架构、本文档（与实现同步维护）。

## 推送到 GitHub

在仓库根目录（含 `web/` 与 `docs/`）已初始化 **Git**；在 GitHub 上**新建空仓库**（建议名：`iTip` 或 `itip`），**不要**勾选自动添加 README，然后：

```bash
cd /path/to/iTip
git remote add origin https://github.com/ycvenopyer/iTip.git
git branch -M main
git push -u origin main
```

`https://ycvenopyer.github.io/` 对应 **用户站点** 仓库 [ycvenopyer/ycvenopyer.github.io](https://github.com/ycvenopyer/ycvenopyer.github.io)（你当前是 Hexo 等静态站）。**不要把本项目的代码强行推到该仓库** unless 你准备替换该站点。iTip 为带 **API、SQLite、Node 运行时** 的 Next 应用，**不能**原样用 GitHub Pages 托管整站；可：

- 把**源码**托管到独立仓库 `iTip`；线上用自有服务器、Docker、或 PaaS（如 Vercel 等）运行 `web/`，或  
- 若仅需「在 GitHub 展示代码」：用上面的 `git push` 即可。

## 环境变量

自 `web/.env.example` 复制为 `web/.env.local`：

| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | 随机长字符串，用于 JWT 签名；**必填**（注册/登录会写入 Cookie）。 |
| `DATABASE_PATH` | 可选；默认 `web` 下 `data/itip.db`（已 `.gitignore`）。 |
| `OPENAI_API_KEY` | 必填以使用对话；可对接任意 OpenAI 兼容端点。 |
| `OPENAI_BASE_URL` | 可选；不填则使用提供方默认根路径。 |
| `OPENAI_MODEL` | 默认 `gpt-4o`；需附图时请使用支持**视觉**的模型。 |

## 本地运行

```bash
cd web
cp .env.example .env.local
# 编辑 .env.local
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`，注册后进入「对话」。

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
- **对话 503**：未配置 `OPENAI_API_KEY` 或 API 不可达。
- **附图无效**：当前模型需支持多模态；在 `.env` 中更换为带 vision 的模型名。
