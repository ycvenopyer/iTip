# 需求说明

与 `web/` 当前实现保持对齐。变更功能时请同步更新本文档。

## 目录

- [产品范围](#产品范围)
- [已实现功能](#已实现功能)
- [已知限制](#已知限制)
- [非功能需求](#非功能需求)
- [路线图](#路线图)

## 产品范围

| 维度 | 说明 |
|------|------|
| **形态** | 仅 Web 应用，源码位于仓库 `web/`（Next.js App Router） |
| **部署** | 支持本地 / 内网私有部署；生产构建 `output: "standalone"`，可用 Node 或容器运行 |
| **账号** | 注册、登录后使用核心功能；会话以 HttpOnly Cookie（JWT）维持 |
| **知识侧重** | 硬笔、软笔、兼修；系统提示与 few-shot（`web/lib/ai/prompts.ts`）以传统书学用语与应答结构为纲 |

## 已实现功能

### 账号与鉴权

- [x] 首页、登录、注册、退出
- [x] JWT 会话（Cookie 名 `itip_session`，有效期 7 天）
- [x] 设置页修改密码（`PUT /api/auth/password`）
- [x] 登录 / 注册 / 改密 / 图片生成 API 限速

### 书法对话

- [x] 流式对话（Vercel AI SDK `streamText`）
- [x] 服务端领域 system prompt + few-shot 前缀轮
- [x] 中文流式分词（`Intl.Segmenter` + `smoothStream`）
- [x] 对接 OpenAI 兼容 API（`AI_*` 环境变量，兼容 `OPENAI_*`）

### 多会话管理

- [x] 创建、列表、读取、删除对话（`chat_conversations` 表）
- [x] 重命名、置顶 / 取消置顶
- [x] 侧边栏历史列表与标题搜索
- [x] 消息 JSON 持久化；首条用户消息自动推导标题
- [x] URL 路由 `/chat?c=<id>`

### 多模态与图片

- [x] 对话中上传图片（需多模态模型，如 `glm-4-flash`）
- [x] 书法参考图生成（`POST /api/images/generate`，智谱默认 `cogview-3-flash`）
- [x] 聊天区「星光」入口生成「墨图」卡片

### 体验与可访问性

- [x] 纸墨色系 UI、书法展示字体
- [x] 全路由 `loading` / `error` / `not-found`
- [x] 表单 `useId`、`role="alert"`、`aria-*` 等可访问性增强
- [x] 跳过导航链接、landmark 语义

### SEO 与 PWA

- [x] `robots.ts`、`sitemap.ts`、根布局 Open Graph / Twitter Card
- [x] `public/manifest.json` + JPEG 图标（`icon-192.jpg`、`icon-512.jpg`），支持安装到主屏幕
- [x] Next.js 元数据图标（`app/icon.jpg`、`app/apple-icon.jpg`）
- [x] 对话页 `noindex`（`/chat?*` 不纳入 sitemap）

## 已知限制

以下行为与代码一致，非文档遗漏：

| 限制 | 说明 |
|------|------|
| **生成图不入库** | AI 生成的参考图仅存于客户端状态，刷新或切换会话后不会恢复 |
| **无离线 PWA** | 已链接 manifest，但 **未注册 Service Worker**，不提供离线缓存 |
| **不做鉴定** | 附图与生成图仅供临习参考，不作文物鉴定或估价结论 |
| **系统提示边界** | prompt 中说明「不提供完整书法作品图」指非专业成书交付；参考图生成功能仍可用作辅助 |
| **消息工具栏** | 复制、重新生成、投票、编辑等部分交互为客户端行为，投票结果不持久化 |
| **对话无限速** | 仅 auth / 图片生成等端点限速，`POST /api/chat` 当前未限速 |

## 非功能需求

- 鉴权在 **Route Handler 内** 校验会话，不以 Middleware 作为唯一安全边界（参见 [Next.js 数据安全建议](https://nextjs.org/docs/app/guides/data-security)）
- Middleware 为页面注入 CSP 等安全响应头
- 依赖版本与安全公告：见 [DEV.md](./DEV.md#安全与维护)
- 单机私有部署场景下，速率限制使用内存 Map 实现

## 路线图

| 优先级 | 内容 | 状态 | 依赖 |
|--------|------|------|------|
| P0 | 项目骨架、构建 | ✅ 完成 | — |
| P0 | 注册 / 登录 / 会话 | ✅ 完成 | SQLite、JWT |
| P0 | 对话 + 流式 | ✅ 完成 | 模型 API |
| P1 | 附图对话 | ✅ 完成 | 多模态模型 |
| P1 | 多会话管理 | ✅ 完成 | 对话功能 |
| P1 | 书法参考图生成 | ✅ 完成 | `/v1/images/generations` |
| P1 | SEO + PWA 基础 | ✅ 完成 | — |
| P2 | 错误处理与 UX polish | ✅ 完成 | — |
| 后续 | 生成图持久化、Service Worker 离线 | 📋 待定 | 存储方案 |
| 后续 | 完整书法作品图 / 专业成书输出 | 📋 待定 | 产品、合规 |
