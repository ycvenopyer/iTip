# iTip

[English](README.md) · [GitHub 仓库](https://github.com/ycvenopyer/iTip) · [问题反馈](https://github.com/ycvenopyer/iTip/issues) · [Apache 2.0](LICENSE)

iTip 是面向毛笔和硬笔学习者的中文书法助手。你可以咨询书体、用笔、章法和临习方法，上传习作讨论，生成参考图，并查看历史会话。

## 项目功能

- 流式回答书法问题，并附上检索到的资料链接。
- 生成回复时可以切换或新建对话，完成的回复保存到原对话。
- 支持看图讨论和生成书法参考图，分别使用配置的视觉模型和出图模型。
- 可用邮箱或账号名注册和登录。已有邮箱账号可绑定账号名，继续使用原有会话。支持搜索、重命名、置顶和删除会话。
- 在设置中修改密码，并选择六种主题配色和五种阅读字体。外观偏好保存在当前浏览器。
- 在「设置 → 风格」选择默认、展卷、碑拓或日课。登录与对话使用同一套风格，外观设置可独立调整。 [素材来源](docs/architecture.md#图像与署名)
- 从发送键左侧切换默认模型和自定义模型。菜单中的「配置模型」支持七家厂商预设或自定义 OpenAI 兼容接口。
- 在侧栏新建项目、移动及置顶对话，点击放大镜按标题搜索。
- 从输入框上方打开字典与工具、练习与创作、书法家和作品、AI 生成书法参考图。可查字组字、导出排版、识别书迹和安排练习。
- 收藏书家和作品，收藏与练习计划随账号保存。目录从精选条目和馆藏资料开始。
- 支持本地运行，也可将前后端部署到 Vercel。

本地访问地址为 `http://localhost:3000`。部署后通过 Vercel 前端项目的生产域名访问。

## 项目架构

| 层级 | 实现 |
| --- | --- |
| 前端 | Next.js App Router、React、TypeScript、Tailwind CSS、AI SDK UI，位于 [`frontend/`](frontend/) |
| 后端 | Python 3.12、Flask，位于 [`backend/`](backend/) |
| Agent | LangGraph 编排基于有出处关系的 GraphRAG 工作流 |
| 数据库 | PostgreSQL，通过 psycopg 存储账号、会话、限速计数、知识图谱、工作台目录、收藏和练习计划 |

浏览器通过前端域名访问 `/api/*`。Next.js 将请求转给 Flask，并转发流式回答。Flask 负责鉴权、数据库和模型调用。

### Agent 工作流

1. **准备检索问题。** 提取用户本轮问题，保留上一轮问题供检索回退。
2. **检索图谱证据。** 匹配简繁体名称与别名，沿有出处的关系扩展一跳，再对关联资料排序。
3. **生成回答。** 将证据交给配置的模型，流式输出答案并附上来源链接。

### 模型与数据

按 [`backend/.env.example`](backend/.env.example) 设置 `AI_BASE_URL` 和 `AI_API_KEY`，连接 OpenAI 兼容服务。`AI_MODEL` 用于文字对话，`AI_VISION_MODEL` 用于含图片的对话和看图识字，`AI_IMAGE_MODEL` 用于生成参考图。示例使用智谱模型 ID，部署时请填入账号可调用的模型。

自定义对话模型使用公网 HTTPS Base URL、模型 ID 和 API Key。模型配置保存在当前浏览器，API Key 保存在当前标签页的会话存储。

[知识库种子](backend/knowledge_seed.json) 包含 13 条可追溯资料，涵盖法帖、碑刻、书法文献、展览网页和字典，并关联书家、作品、书体或技法。可用 `ingest` 扩充。聊天和附图存储在 PostgreSQL，模型调用会将请求所需的内容发送给配置的服务商。 [架构与数据处理](docs/architecture.md)

## 快速开始

安装 Python 3.12 和 Node.js 22。可使用已有 PostgreSQL，或用 Docker 启动本地数据库。在仓库根目录运行以下 PowerShell 命令。

```powershell
git clone https://github.com/ycvenopyer/iTip.git
Set-Location iTip
docker run -d --name itip-postgres -p 127.0.0.1:5432:5432 -e POSTGRES_USER=itip -e POSTGRES_PASSWORD=itip-local-password -e POSTGRES_DB=itip -v itip-postgres:/var/lib/postgresql/data postgres:17
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
python -m venv .venv
.venv/Scripts/python -m pip install -r backend/requirements.txt
```

生成登录签名密钥，将输出填入 `backend/.env` 的 `AUTH_SECRET`。使用已有数据库时，把开发库连接串填入 `DATABASE_URL`。需要测试对话和出图时，再填写模型配置。

```powershell
.venv/Scripts/python -c "import secrets; print(secrets.token_urlsafe(32))"
```

在第一个终端初始化表、导入知识库和工作台目录并启动 Flask。

```powershell
.venv/Scripts/python -m flask --app backend/app.py init-db
.venv/Scripts/python -m flask --app backend/app.py ingest backend/knowledge_seed.json
.venv/Scripts/python -m flask --app backend/app.py ingest-study
.venv/Scripts/python -m flask --app backend/app.py run --port 5000
```

在另一个终端从仓库根目录启动 Next.js。

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

打开 [http://localhost:3000](http://localhost:3000)。`/api/health` 返回数据库状态和资料数量。 [开发指南](docs/dev.md)

## 部署到 Vercel

从同一个 GitHub 仓库创建两个 Vercel 项目，根目录分别选 `backend` 和 `frontend`。在后端连接并初始化 PostgreSQL。分别生成登录签名密钥和代理密钥，把同一份生产代理密钥填入前后端两个项目，再让前端指向 Flask 生产地址。 [Vercel 部署与排查](docs/dev.md#vercel-部署)

发布包含数据库结构变更的版本前，对该环境实际使用的 PostgreSQL 数据库运行 `init-db`。用 `ingest-study` 导入或更新工作台目录。

## 文档

- [开发与部署](docs/dev.md)
- [架构与数据处理](docs/architecture.md)
- [功能与限制](docs/demand.md)
- [数据库设计](docs/database.md)
- [字典与工具](docs/more-function/dictionary-and-tool.md)、[练习与创作](docs/more-function/exercise-and-create.md)和[书法家和作品](docs/more-function/calligrapher-and-work.md)

## 贡献代码与反馈问题

1. Fork 仓库并新建分支。
2. 在 `frontend/` 运行 `npm run lint` 和 `npm run build`。界面改动应在桌面端和移动端检查登录前后的布局。后端改动应在开发库上检查 `/api/health` 并验证相关接口。
3. 创建 [Pull Request](https://github.com/ycvenopyer/iTip/pulls)，说明改动原因和验证方式。贡献知识资料时附上原始来源链接与摘要。

提交 [Issue](https://github.com/ycvenopyer/iTip/issues/new) 时，请提供复现步骤、预期结果、实际结果和相关版本或脱敏日志。请从报告中移除密钥、数据库连接串和私人会话内容。

## 许可证

本仓库使用 [Apache License 2.0](LICENSE)。外部引用资料和模型服务各自适用其条款。
