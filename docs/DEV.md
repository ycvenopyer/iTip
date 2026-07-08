# 开发指南

## 目录

- [前置要求](#前置要求)
- [环境变量](#环境变量)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [API 速查](#api-速查)
- [安全与维护](#安全与维护)
- [故障排查](#故障排查)

## 前置要求

| 依赖 | 说明 |
|------|------|
| Node.js 20+、npm 9+ | — |
| C++ 构建工具 | `better-sqlite3`；Windows 见 [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| LLM 端点 | 智谱 GLM、Ollama 或其它 OpenAI 兼容服务 |

源码与依赖均在 `web/` 目录操作；目录说明见 [ARCHITECTURE.md](./ARCHITECTURE.md#目录结构)。

## 环境变量

```bash
cd web
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

`.env.local` 已 gitignore，勿提交密钥。

| 变量 | 必填 | 说明 |
|------|------|------|
| `AUTH_SECRET` | 是 | JWT 密钥（≥ 16 字符） |
| `AI_BASE_URL` | 对话时 | OpenAI 兼容根地址 |
| `AI_API_KEY` | 对话时 | API Key；Ollama 可留空 |
| `AI_MODEL` | 对话时 | 对话模型 ID |
| `AI_IMAGE_MODEL` | 否 | 图片模型，智谱默认 `cogview-3-flash` |
| `SITE_URL` | 否 | 生产站点 URL（SEO）；默认 `https://itip.example.com` |
| `DATABASE_PATH` | 否 | SQLite 路径，默认 `web/data/itip.db` |
| `OPENAI_*` | 否 | 旧名；**`AI_*` 优先** |

### 智谱 GLM（推荐）

在 [智谱开放平台](https://open.bigmodel.cn) 创建 Key，参考 [OpenAI 兼容文档](https://open.bigmodel.cn/dev/api)：

```env
AUTH_SECRET=your-random-secret-at-least-16-chars
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=<Key>
AI_MODEL=glm-4-flash
```

附图需多模态模型；`AI_MODEL` 以控制台为准。

### Ollama（可选）

```env
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_MODEL=llama3.2
```

生产环境设置 `SITE_URL`，并将 `web/app/robots.ts` 中 sitemap URL 改为一致。

## 本地开发

```bash
cd web
npm install && npm run dev
```

默认 [http://localhost:3000](http://localhost:3000)（Turbopack）。

| 脚本 | 说明 |
|------|------|
| `dev` | 开发服务器 |
| `build` | 生产构建 |
| `start` | 启动生产 |
| `lint` | ESLint |

## 生产部署

```bash
cd web && npm run build && npm run start
```

- 构建为 **standalone**（`next.config.ts`）
- 默认端口 3000，可用 `PORT` 覆盖
- 反向代理需关闭 SSE 缓冲，见 [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting#streaming)
- SQLite 默认 `web/data/itip.db`；容器部署请挂载或设置 `DATABASE_PATH`

## API 速查

完整字段见 [ARCHITECTURE.md#api-参考](./ARCHITECTURE.md#api-参考)。对话页：`/chat?c=<id>`。

| 方法 | 路径 | 鉴权 |
|------|------|------|
| POST | `/api/auth/register`、`login`、`logout` | 否 |
| GET | `/api/auth/me` | 可选 |
| PUT | `/api/auth/password` | 是 |
| POST | `/api/chat` | 是 |
| GET/POST | `/api/chat/conversations` | 是 |
| GET/PATCH/DELETE | `/api/chat/conversations/[id]` | 是 |
| POST | `/api/images/generate` | 是 |

## 安全与维护

- 保持 `next` 在官方修复线（如 15.2.8+）；升级后 `npm run build` 并更新文档版本号
- 鉴权在 Route Handler 内完成，不依赖 Middleware 拦截
- 限速为进程内 Map；多实例部署各实例独立计数

## 故障排查

| 现象 | 处理 |
|------|------|
| `better-sqlite3` 编译失败 | 安装 C++ 构建工具后重装依赖 |
| 对话 503 | 检查 `AI_*`；Ollama 是否运行 |
| 附图无响应 | 换多模态模型 |
| 图片生成失败 | 配置 `AI_IMAGE_MODEL`；确认支持 `/v1/images/generations` |
| 会话列表异常 | 检查 `pinned` 列迁移（`lib/db.ts`） |
| 流式卡顿 | 关闭反向代理 `proxy_buffering` |
| PWA 无离线 | 预期：无 Service Worker |
| sitemap 域名错误 | 设置 `SITE_URL` 并改 `robots.ts` |
