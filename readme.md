# iTip

> 面向书法学习者的 Web 书法助手 — 硬笔、软笔、兼修对话，支持本地私有部署。

<!-- 品牌 · Shields.io static badge：https://shields.io/ -->
[![iTip](https://img.shields.io/static/v1?style=for-the-badge&label=iTip&message=书法助手&color=9a2c2c&labelColor=1e1b18)](https://github.com/ycvenopyer/iTip)
[![Deploy](https://img.shields.io/static/v1?style=for-the-badge&label=deploy&message=私有部署&color=4f6a42&labelColor=3d5236)](docs/DEV.md#生产部署)
[![OpenAI Compatible](https://img.shields.io/static/v1?style=for-the-badge&label=LLM&message=OpenAI%20Compatible&color=524b41&labelColor=1e1b18)](docs/DEV.md#环境变量)

<!-- GitHub · dynamic badge -->
[![GitHub Repo](https://img.shields.io/badge/GitHub-ycvenopyer%2FiTip-1e1b18?style=flat-square&logo=github)](https://github.com/ycvenopyer/iTip)
[![GitHub stars](https://img.shields.io/github/stars/ycvenopyer/iTip?style=social&label=Star)](https://github.com/ycvenopyer/iTip)

<!-- 技术栈 · flat-square 统一风格 -->
[![Next.js](https://img.shields.io/badge/Next.js-15.2+-1e1b18?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-1e1b18?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-1e1b18?style=flat-square&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-1e1b18?style=flat-square&logo=tailwindcss&logoColor=38B2AC)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-本地存储-1e1b18?style=flat-square&logo=sqlite&logoColor=003B57)](https://www.sqlite.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-6-1e1b18?style=flat-square&logo=vercel&logoColor=white)](https://sdk.vercel.ai/)

<!-- 能力标签 · 项目配色 -->
[![PWA](https://img.shields.io/static/v1?style=flat-square&label=PWA&message=可安装&color=f2eadc&labelColor=524b41)](web/public/manifest.json)
[![SEO](https://img.shields.io/static/v1?style=flat-square&label=SEO&message=robots%20%2B%20sitemap&color=f2eadc&labelColor=524b41)](web/app/sitemap.ts)
[![JWT Auth](https://img.shields.io/static/v1?style=flat-square&label=Auth&message=JWT%20Cookie&color=f2eadc&labelColor=9a2c2c)](docs/ARCHITECTURE.md#认证与会话)

## 目录

- [简介](#简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [文档](#文档)
- [项目结构](#项目结构)
- [文档维护](#文档维护)

## 简介

iTip 是一款面向当代学书者的 **Web 书法助手**。用户注册登录后，可与面向硬笔、软笔与兼修场景调优的 AI 对话；支持多会话历史、附图讨论与书法参考图生成。应用基于 Next.js 全栈实现，使用 SQLite 存储用户与对话数据，对接 **OpenAI 兼容 API**（默认文档示例为智谱 GLM 直连），适合本地或内网 **私有部署**。

品牌标识为朱文「書」印章 + **iTip** 字标，图标文件位于 `web/app/` 与 `web/public/icons/`。

## 功能特性

| 类别 | 能力 |
|------|------|
| **账号** | 邮箱注册 / 登录、JWT 会话（HttpOnly Cookie）、修改密码 |
| **对话** | 流式输出、书法领域 system prompt + few-shot、中文分词优化 |
| **多会话** | 新建、切换、搜索、重命名、置顶、删除；消息自动持久化 |
| **多模态** | 对话中上传图片，由支持视觉的模型参与理解 |
| **图片生成** | 基于 OpenAI 兼容 `/v1/images/generations` 生成书法参考图（客户端展示，不入库） |
| **体验** | 纸墨色系 UI、全路由 loading / error / 404、可访问性增强 |
| **SEO** | `robots.txt`、`sitemap.xml`、Open Graph / Twitter Card |
| **PWA** | Web App Manifest + JPEG 图标，可安装到主屏幕（当前无 Service Worker，不提供离线缓存） |
| **安全** | Middleware 安全响应头、鉴权类 API 内存限速 |

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 15（App Router）、React 19、TypeScript |
| 样式 | Tailwind CSS v4 |
| AI | Vercel AI SDK 6、`@ai-sdk/openai`、`@ai-sdk/react` |
| 数据 | SQLite（`better-sqlite3`）、JWT（`jose`）、密码哈希（`bcryptjs`） |
| 校验 | Zod 4 |
| 渲染 | `react-markdown` + `remark-gfm` |

版本以 `web/package-lock.json` 为准。

## 快速开始

### 环境要求

- **Node.js** 20+
- **npm** 9+
- 本机 C++ 构建环境（`better-sqlite3` 原生模块；Windows 需 Visual Studio Build Tools）

### 安装与运行

```bash
git clone <repo-url> iTip
cd iTip/web
cp .env.example .env.local   # Windows: copy .env.example .env.local
# 编辑 .env.local，至少填写 AUTH_SECRET 与 AI_* 三项
npm install
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)，注册账号后进入 **对话** 页。

未配置 LLM 相关环境变量时，对话接口返回 **503** 并提示配置方式。完整变量说明见 [docs/DEV.md](docs/DEV.md)。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发（Turbopack） |
| `npm run build` | 生产构建（`output: "standalone"`） |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 检查 |

## 文档

| 文档 | 说明 |
|------|------|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | 产品范围、已实现功能、边界与路线图 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术架构、数据模型、API 与关键代码路径 |
| [docs/DEV.md](docs/DEV.md) | 环境变量、本地开发、生产部署、故障排查 |
| [docs/BADGES.md](docs/BADGES.md) | Shields.io Badge 与图标设计规范 |

## 项目结构

```
iTip/
├── web/                 # Next.js 全栈应用（源码、依赖、环境配置）
│   ├── app/
│   │   ├── icon.jpg、apple-icon.jpg  # Next.js 元数据图标
│   │   └── …            # 页面、布局、Route Handlers（API）
│   ├── components/      # React 客户端组件
│   ├── lib/             # 数据库、鉴权、会话、AI 配置
│   ├── public/
│   │   ├── favicon.jpg、favicon.ico
│   │   ├── manifest.json
│   │   └── icons/       # PWA 图标（icon-192/512.jpg 等）
│   ├── data/            # SQLite 数据库（运行时生成，已 .gitignore）
│   └── .env.example     # 环境变量模板
├── docs/                # 项目文档（与实现同步维护）
└── README.md
```

`web/` 目录的页面路由、API 端点、组件与模块说明见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#目录结构)。图标规范见 [docs/BADGES.md](docs/BADGES.md#图标文件)。

## 文档维护

功能、API、环境变量或品牌图标有变更时，请同步更新 `docs/` 下对应文档与本 README 中的摘要说明。更换图标时直接替换 `web/` 下对应 JPEG / ICO 文件，详见 [docs/BADGES.md](docs/BADGES.md#图标文件)。
