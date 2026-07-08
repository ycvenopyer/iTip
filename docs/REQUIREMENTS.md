# 需求说明

与 `web/` 实现同步；功能变更时请更新本文档。

## 目录

- [产品范围](#产品范围)
- [已实现功能](#已实现功能)
- [已知限制](#已知限制)
- [非功能需求](#非功能需求)
- [路线图](#路线图)

## 产品范围

| 维度 | 说明 |
|------|------|
| 形态 | Web 应用（Next.js App Router，`web/`） |
| 部署 | 本地 / 内网私有；`standalone` 构建 |
| 账号 | 注册登录；HttpOnly JWT Cookie |
| 领域 | 硬笔、软笔、兼修；prompt 见 `lib/ai/prompts.ts` |

## 已实现功能

### 账号

- [x] 首页、登录、注册、退出、改密（`PUT /api/auth/password`）
- [x] JWT 会话（`itip_session`，7 天）
- [x] 登录 / 注册 / 改密 / 图片生成 API 限速

### 对话与会话

- [x] 流式对话（`streamText`）、领域 prompt + few-shot、中文分词
- [x] OpenAI 兼容 API（`AI_*`，兼容 `OPENAI_*`）
- [x] 多会话 CRUD、重命名、置顶、侧栏搜索
- [x] 消息持久化、首条消息推导标题、`/chat?c=<id>`

### 多模态

- [x] 附图对话（需 vision 模型）
- [x] 参考图生成（`POST /api/images/generate`）
- [x] 聊天区「墨图」入口

### 体验与 SEO / PWA

- [x] 纸墨 UI、全路由 loading / error / 404、可访问性
- [x] robots、sitemap、Open Graph / Twitter Card
- [x] Manifest + JPEG 图标、Next 元数据图标；对话页 `noindex`

## 已知限制

| 限制 | 说明 |
|------|------|
| 生成图不入库 | 刷新或切会话后不保留 |
| 无离线 PWA | 无 Service Worker |
| 不做鉴定 | 附图与生成图仅供临习参考，不作估价 |
| 系统提示 | 不交付完整成书；参考图生成仍可用 |
| 消息工具栏 | 投票等不持久化 |
| 对话无限速 | 仅 auth / 图片等端点限速 |

## 非功能需求

- 鉴权在 Route Handler 内校验（参见 [Next.js 数据安全](https://nextjs.org/docs/app/guides/data-security)）
- Middleware 注入 CSP 等安全头
- 单机部署使用内存限速；版本维护见 [DEV.md](./DEV.md#安全与维护)

## 路线图

| 优先级 | 内容 | 状态 |
|--------|------|------|
| P0 | 骨架、账号、流式对话 | ✅ |
| P1 | 附图、多会话、参考图、SEO/PWA | ✅ |
| P2 | 错误处理与 UX | ✅ |
| 后续 | 生成图持久化、Service Worker | 📋 |
| 后续 | 专业成书输出 | 📋 |
