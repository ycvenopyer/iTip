<div align="center">

# iTip

> 面向书法学习者的 Web 书法助手 — 硬笔、软笔、兼修对话，支持本地私有部署。

<!-- 品牌 · Shields.io：https://shields.io/ -->
[![iTip](https://img.shields.io/static/v1?style=for-the-badge&label=iTip&message=书法助手&color=9a2c2c&labelColor=1e1b18)](https://github.com/ycvenopyer/iTip)
[![Deploy](https://img.shields.io/static/v1?style=for-the-badge&label=deploy&message=私有部署&color=4f6a42&labelColor=3d5236)](docs/DEV.md#生产部署)
[![OpenAI Compatible](https://img.shields.io/static/v1?style=for-the-badge&label=LLM&message=OpenAI%20Compatible&color=524b41&labelColor=1e1b18)](docs/DEV.md#环境变量)

[![GitHub Repo](https://img.shields.io/badge/GitHub-ycvenopyer%2FiTip-1e1b18?style=flat-square&logo=github)](https://github.com/ycvenopyer/iTip)
[![GitHub stars](https://img.shields.io/github/stars/ycvenopyer/iTip?style=social&label=Star)](https://github.com/ycvenopyer/iTip)

[![Next.js](https://img.shields.io/badge/Next.js-15.2+-1e1b18?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-1e1b18?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-1e1b18?style=flat-square&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-1e1b18?style=flat-square&logo=tailwindcss&logoColor=38B2AC)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-本地存储-1e1b18?style=flat-square&logo=sqlite&logoColor=003B57)](https://www.sqlite.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-6-1e1b18?style=flat-square&logo=vercel&logoColor=white)](https://sdk.vercel.ai/)

[![PWA](https://img.shields.io/static/v1?style=flat-square&label=PWA&message=可安装&color=f2eadc&labelColor=524b41)](web/public/manifest.json)
[![SEO](https://img.shields.io/static/v1?style=flat-square&label=SEO&message=robots%20%2B%20sitemap&color=f2eadc&labelColor=524b41)](web/app/sitemap.ts)
[![JWT Auth](https://img.shields.io/static/v1?style=flat-square&label=Auth&message=JWT%20Cookie&color=f2eadc&labelColor=9a2c2c)](docs/ARCHITECTURE.md#认证与会话)

</div>

## 目录

- [简介](#简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [前后端边界](#前后端边界)
- [快速开始](#快速开始)
- [文档](#文档)
- [项目结构](#项目结构)

## 简介

iTip 是面向学书者的 **Web 书法助手**：注册登录后可进行书法主题 AI 对话，支持多会话、附图与参考图生成。基于 Next.js 全栈 + SQLite，对接 **OpenAI 兼容 API**（文档示例为智谱 GLM），可本地或内网私有部署。

## 功能特性

| 类别 | 能力 |
|------|------|
| **账号** | 注册 / 登录、JWT（HttpOnly Cookie）、修改密码 |
| **对话** | 流式输出、领域 prompt + few-shot、中文分词优化 |
| **多会话** | 新建、搜索、重命名、置顶、删除；消息持久化 |
| **多模态** | 附图讨论（需视觉模型） |
| **图片生成** | OpenAI 兼容 `/v1/images/generations`（客户端展示，不入库） |
| **体验** | 纸墨 UI、loading / error / 404、可访问性 |
| **SEO / PWA** | robots、sitemap、Open Graph；Manifest 可安装（无离线缓存） |
| **安全** | Middleware 安全头、鉴权 API 内存限速 |

## 技术栈

Next.js 15（App Router）、React 19、TypeScript、Tailwind v4、Vercel AI SDK 6、SQLite（`better-sqlite3`）、JWT（`jose`）、Zod 4。版本以 `web/package-lock.json` 为准。

## 前后端边界

`web/` 为 **Next.js 全栈单体**（非前后端分离仓库）：前端在浏览器运行 UI（`components/`、`public/`），后端在 Node 运行 API 与业务逻辑（`app/api/`、`lib/`）。`app/` 内页面路由与 API 路由并存，属 App Router 约定。

详见 [docs/ARCHITECTURE.md#前后端边界](docs/ARCHITECTURE.md#前后端边界)。

## 快速开始

**要求**：Node.js 20+、npm 9+、C++ 构建环境（`better-sqlite3`；Windows 需 VS Build Tools）。

```bash
git clone <repo-url> iTip
cd iTip/web
cp .env.example .env.local   # Windows: copy .env.example .env.local
# 至少配置 AUTH_SECRET 与 AI_* 三项
npm install && npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。未配置 LLM 时对话接口返回 503。环境变量见 [docs/DEV.md](docs/DEV.md)。

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发（Turbopack） |
| `npm run build` | 生产构建（standalone） |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint |

## 文档

| 文档 | 内容 |
|------|------|
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | 产品范围、功能清单、限制与路线图 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构、前后端边界、数据模型、API |
| [DEV.md](docs/DEV.md) | 环境变量、开发、部署、故障排查 |
| [BADGES.md](docs/BADGES.md) | Badge 与图标规范 |

## 项目结构

```
iTip/
├── web/              # Next.js 全栈应用
│   ├── app/          # 页面 + app/api/ 接口
│   ├── components/   # 客户端组件
│   ├── lib/          # 服务端逻辑（DB、鉴权、AI）
│   ├── public/       # 静态资源与 PWA 图标
│   └── data/         # SQLite（运行时，已 gitignore）
└── docs/
```

细节见 [ARCHITECTURE.md](docs/ARCHITECTURE.md)。功能或 API 变更时请同步更新 `docs/` 与本文档。
