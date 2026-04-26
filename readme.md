# iTip

面向书法学习者的 **Web 书法助手**：对话、领域提示（硬笔 / 软笔 / 兼修）、可附图讨论；**注册登录** 后使用；**本地私有部署** 友好。成图生成在后续阶段。

## 仓库结构

| 路径 | 说明 |
|------|------|
| `web/` | Next.js 应用（全栈、源码与 `.env.example`） |
| `docs/` | 需求、架构、开发说明（**与实现同步**） |

## 快速开始

1. 进入 `web/` 目录，将 `.env.example` 复制为 `.env.local` 并配置 `AUTH_SECRET`、`OPENAI_API_KEY` 等。  
2. 执行 `npm install`、`npm run dev`。  
3. 浏览器打开首页，**注册** 后使用 **对话**。

详细说明见 [docs/DEV.md](docs/DEV.md)、方案见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)、需求与范围见 [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)。

## 技术要点（摘要）

- Next.js 15.2.8+（App Router）、Vercel AI SDK、OpenAI 兼容 API。  
- SQLite 用户表、JWT 会话（HttpOnly Cookie）、Zod 校验。  
- 设计：纸墨色系与书法展示字体，**未使用**蓝紫渐变类通用 AI 风配色。

## 文档维护约定

- 功能或环境变量有变更时，**同时**更新 `docs/` 下对应文档与本 `readme.md` 的指向说明。
