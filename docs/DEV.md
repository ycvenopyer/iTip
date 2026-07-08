# 开发指南

本地开发、环境配置与生产部署说明。

## 目录

- [前置要求](#前置要求)
- [仓库布局](#仓库布局)
- [环境变量](#环境变量)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [API 速查](#api-速查)
- [安全与维护](#安全与维护)
- [故障排查](#故障排查)

## 前置要求

| 依赖 | 版本 / 说明 |
|------|-------------|
| Node.js | 20+ |
| npm | 9+ |
| C++ 构建工具 | `better-sqlite3` 需要；Windows 安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| LLM 服务 | 智谱 GLM、Ollama 或其它 OpenAI 兼容端点 |

## 仓库布局

```
iTip/
├── web/          # Next.js 应用（全部源码在此）
│   ├── .env.example
│   ├── app/icon.jpg、apple-icon.jpg
│   ├── public/favicon.jpg、favicon.ico
│   ├── public/icons/   # icon-192.jpg、icon-512.jpg 等
│   └── data/     # SQLite（运行时生成，已 .gitignore）
└── docs/         # 本文档及需求、架构说明
```

应用代码、依赖与环境配置均在 `web/` 目录下操作。

## 环境变量

复制模板并编辑：

```bash
cd web
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

`.env.local` 已加入 `web/.gitignore`，**勿提交真实密钥**。

### 变量一览

| 变量 | 必填 | 说明 |
|------|------|------|
| `AUTH_SECRET` | **是** | JWT 签名密钥，随机长字符串（≥ 16 字符） |
| `AI_BASE_URL` | 对话时 | OpenAI 兼容 API 根地址；智谱典型值见下方 |
| `AI_API_KEY` | 对话时 | API Key；本机 Ollama 可留空 |
| `AI_MODEL` | 对话时 | 对话模型 ID；未设置时按域名推断默认值 |
| `AI_IMAGE_MODEL` | 否 | 图片生成模型；智谱默认 `cogview-3-flash` |
| `SITE_URL` | 否 | 生产站点 URL，用于 SEO 元数据；默认 `https://itip.example.com` |
| `DATABASE_PATH` | 否 | SQLite 路径；默认 `web/data/itip.db` |
| `OPENAI_*` | 否 | 旧名兼容；**`AI_*` 优先** |

### 智谱 GLM 直连（推荐）

在 [智谱开放平台](https://open.bigmodel.cn) 创建 API Key，参考 [OpenAI 兼容文档](https://open.bigmodel.cn/dev/api)：

```env
AUTH_SECRET=your-random-secret-at-least-16-chars
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=<你的 Key>
AI_MODEL=glm-4-flash
# AI_IMAGE_MODEL=cogview-3-flash
```

- `AI_MODEL` 以控制台实际模型名为准（如 `glm-4-plus`）
- 附图对话需选用 **多模态** 模型
- Coding 订阅等若 Base 不同，以官方文档替换 `AI_BASE_URL`

### 本机 Ollama（可选）

```env
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_MODEL=llama3.2
# AI_API_KEY 可留空
```

需先 `ollama pull` 对应模型并启动服务。

### 生产 SEO

```env
SITE_URL=https://your-domain.example.com
```

同时建议将 `web/app/robots.ts` 中的 `sitemap` URL 改为与 `SITE_URL` 一致（当前为硬编码）。

## 本地开发

```bash
cd web
npm install
npm run dev
```

- 默认地址：[http://localhost:3000](http://localhost:3000)
- 开发模式使用 Turbopack（`next dev --turbopack`）
- 注册 / 登录后进入 `/chat` 使用对话

### npm 脚本

| 脚本 | 命令 | 说明 |
|------|------|------|
| `dev` | `next dev --turbopack` | 开发服务器 |
| `build` | `next build` | 生产构建 |
| `start` | `next start` | 启动生产服务 |
| `lint` | `next lint` | ESLint |

## 生产部署

### 1. 构建

```bash
cd web
npm run build
```

构建产物为 **standalone** 模式（见 `web/next.config.ts`）。

### 2. 启动

```bash
cd web
npm run start
```

- 默认端口 **3000**，可通过环境变量 `PORT` 调整
- standalone 输出位于 `web/.next/standalone`，部署方式参见 Next.js [Self-hosting](https://nextjs.org/docs/app/building-your-application/deploying#nodejs-server)

### 3. 反向代理

若使用 Nginx 等反向代理，**SSE / 流式对话** 需关闭响应缓冲，否则输出可能卡顿。参见 [Self-hosting 流式说明](https://nextjs.org/docs/app/guides/self-hosting#streaming)。

### 4. 数据持久化

SQLite 文件默认位于 `web/data/itip.db`。容器部署时挂载该目录或设置 `DATABASE_PATH` 指向持久卷。

## API 速查

完整说明见 [ARCHITECTURE.md](./ARCHITECTURE.md#api-参考)。

| 方法 | 路径 | 鉴权 |
|------|------|------|
| POST | `/api/auth/register` | 否 |
| POST | `/api/auth/login` | 否 |
| POST | `/api/auth/logout` | 否 |
| GET | `/api/auth/me` | 可选 |
| PUT | `/api/auth/password` | 是 |
| POST | `/api/chat` | 是 |
| GET / POST | `/api/chat/conversations` | 是 |
| GET / PATCH / DELETE | `/api/chat/conversations/[id]` | 是 |
| POST | `/api/images/generate` | 是 |

对话页路由：`/chat?c=<conversationId>`；无 `c` 时跳转最近会话或自动新建。

品牌图标为 `web/` 下 JPEG / ICO 静态资源，路径与更换方式见 [BADGES.md](./BADGES.md#图标文件)。

## 安全与维护

- 保持 `next` 在官方公告的当前修复线（如 15.2.8+）；升级后执行 `npm run build` 并更新文档中的版本描述
- 鉴权逻辑在 API Route Handler 内校验，不依赖 Middleware 拦截
- 速率限制为进程内内存实现；多实例部署时各实例独立计数，高并发场景可替换为 Redis / Upstash

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| `better-sqlite3` 编译失败 | 缺少 C++ 构建环境 | 安装 Visual Studio Build Tools 后重试 `npm install` |
| 对话 **503** | 未配置 LLM 或 Key / Base 错误 | 检查 `AI_*` 变量；Ollama 是否已启动 |
| 附图无响应 | 模型不支持多模态 | 更换为带 vision 能力的模型 |
| 图片生成失败 | 未配置图片模型或端点不支持 | 设置 `AI_IMAGE_MODEL`；确认服务商支持 `/v1/images/generations` |
| 会话列表异常 | 旧库缺少 `pinned` 列 | `lib/db.ts` 启动时会尝试迁移；必要时手动 `ALTER TABLE` |
| 流式输出卡顿 | 反向代理缓冲 SSE | 关闭 Nginx 等 `proxy_buffering` |
| PWA 无法离线 | 预期行为 | 当前无 Service Worker，仅支持安装到主屏幕 |
| SEO sitemap 域名不对 | `robots.ts` 硬编码 | 设置 `SITE_URL` 并修改 `robots.ts` 中 sitemap 地址 |
