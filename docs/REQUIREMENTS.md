# 需求说明

与 `frontend/` 和 `backend/` 的实现同步。

## 目录

- [产品范围](#产品范围)
- [已实现功能](#已实现功能)
- [已知限制](#已知限制)
- [非功能需求](#非功能需求)
- [路线图](#路线图)

## 产品范围

| 维度 | 说明 |
|------|------|
| 形态 | Web 应用，Next.js 前端和 Flask 后端 |
| 部署 | 本地开发 / Vercel 双项目部署 |
| 存储 | PostgreSQL，存放账号、会话、知识图谱和限速计数 |
| 账号 | 注册登录；HttpOnly JWT Cookie |
| 领域 | 硬笔、软笔、兼修，书法知识图谱见 `backend/knowledge_seed.json` |

## 已实现功能

### 账号

- [x] 首页、登录、注册、退出、改密（`PUT /api/auth/password`）
- [x] JWT 会话（`itip_session`，7 天）
- [x] 登录 / 注册 / 改密 / 图片生成 API 限速

### 对话与会话

- [x] LangGraph 流式对话、GraphRAG 关系检索和出处引用
- [x] OpenAI 兼容 API（`AI_*`）
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
| 生成图保存 | 会话保存图片引用，服务商链接可能过期 |
| 无离线 PWA | 无 Service Worker |
| 不做鉴定 | 附图与生成图仅供临习参考，不作估价 |
| 系统提示 | 不交付完整成书；参考图生成仍可用 |
| 消息工具栏 | 投票等不持久化 |

## 非功能需求

- Flask 校验登录与会话归属
- Middleware 注入 CSP 等安全头
- 多实例通过数据库共享限速，部署见 [DEV.md](./DEV.md)

## 路线图

| 优先级 | 内容 | 状态 |
|--------|------|------|
| P0 | 骨架、账号、流式对话 | ✅ |
| P1 | 附图、多会话、参考图、SEO/PWA | ✅ |
| P2 | 错误处理与 UX | ✅ |
| 后续 | 生成图持久化、Service Worker | 📋 |
| 后续 | 专业成书输出 | 📋 |
