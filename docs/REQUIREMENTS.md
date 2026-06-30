# iTip 需求说明（与实现对齐）

## 产品范围

- **形态**：仅 Web 应用，代码在仓库 `web/` 目录（Next.js App Router）。
- **部署**：支持本地/内网 **私有部署**；生产构建使用 `output: "standalone"`，可由 `node` 或容器运行。
- **账号**：需要 **注册、登录** 后才可使用核心对话；会话以 HttpOnly Cookie（JWT）维持。
- **知识侧重**：**硬笔、软笔、兼修**；系统提示与 **few-shot 示例轮**（`lib/ai/prompts.ts`）以传统书学用语、应答结构与边界示范为纲（非鉴定、非生成作品图）。

## 本阶段已实现

1. 首页、登录、注册、退出。
2. 书法主题对话流（流式输出），服务端领域系统提示 + **few-shot** 前缀轮（含 `lib/ai/prompts.ts`），再拼接用户多轮消息。
3. 对接 **OpenAI 兼容 API**（环境变量以 `AI_*` 为主，如 `AI_BASE_URL` + `AI_MODEL` + 可选 `AI_API_KEY`；仍兼容 `OPENAI_*`）。
4. **图片附件**：在对话中上传图片，由支持视觉的模型（如 `gpt-4o`）参与理解；不单独做「鉴定」类承诺。
5. **多会话管理**：
   - 创建、列表、读取、删除对话会话（`chat_conversations` 表）
   - 重命名对话、置顶/取消置顶
   - 侧边栏历史列表，支持搜索过滤
   - 消息自动保存与恢复
6. **SEO 基础**：`robots.ts`、`sitemap.ts`、Open Graph / Twitter Card 元数据。
7. **PWA 支持**：`manifest.json`、SVG 图标，可安装到桌面。
8. **用户体验**：全路由 loading 状态、error 边界、自定义 404 页面、跳过导航链接。
9. **可访问性**：表单标签关联、ARIA 属性（role、aria-label、aria-current、aria-expanded）、键盘导航支持。

## 明确延后

- **生成完整书法作品图**：不在本阶段实现；在系统提示与首页文案中已说明。

## 非功能

- 鉴权在 **Route Handler 内** 校验会话，不以中间件作为唯一安全边界（与 [Next.js 数据安全建议](https://nextjs.org/docs/app/guides/data-security) 一致）。
- 参考安全版本线：见 `docs/DEV.md` 中 Next.js 与依赖版本说明。

## 任务优先级与依赖（回顾）

| 顺序  | 内容       | 依赖         |
| --- | -------- | ---------- |
| P0  | 项目骨架、构建 | —         |
| P0  | 注册/登录/会话 | SQLite、JWT |
| P0  | 对话 + 流式  | 模型 API     |
| P1  | 附图对话     | 多模态模型     |
| P1  | 多会话管理   | 对话功能       |
| P1  | SEO + PWA | —         |
| P2  | 错误处理 + UX | —         |
| 后  | 书作图生成   | 产品/合规      |

并行关系：UI 与 API 可分工并行；数据库与鉴权需先于受保护页与 `/api/chat`；多会话管理需对话功能稳定后实现。
