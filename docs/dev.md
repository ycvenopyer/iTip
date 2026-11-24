# 开发与部署指南

## 本地开发

准备 Python 3.12、Node.js 22 和 PostgreSQL。已有 PostgreSQL 时，创建一个开发库并取得连接串。也可以用 Docker 启动下面的实例，示例密码仅用于本机开发。 [PostgreSQL Docker 镜像](https://hub.docker.com/_/postgres)

```powershell
docker run -d --name itip-postgres -p 127.0.0.1:5432:5432 -e POSTGRES_USER=itip -e POSTGRES_PASSWORD=itip-local-password -e POSTGRES_DB=itip -v itip-postgres:/var/lib/postgresql/data postgres:17
```

从仓库根目录运行以下 PowerShell 命令。首次配置时复制模板，已有环境文件时按模板补充变量。macOS/Linux 使用 `cp` 和 `npm`，并将 `.venv/Scripts/python` 换成 `.venv/bin/python`。

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
python -m venv .venv
.venv/Scripts/python -m pip install -r backend/requirements.txt
```

编辑 `backend/.env`。Docker 示例对应模板中的 `DATABASE_URL`，使用已有库时替换连接串。用下方命令生成 `AUTH_SECRET`，按环境变量表填写模型地址、密钥和模型 ID。纯本地开发时，两边的代理密钥都可留空。模型暂未配置时仍可验证账号和数据库。

```powershell
.venv/Scripts/python -c "import secrets; print(secrets.token_urlsafe(32))"
```

把生成的签名密钥填入 `backend/.env`，再初始化数据库并启动 Flask。

```powershell
.venv/Scripts/python -m flask --app backend/app.py init-db
.venv/Scripts/python -m flask --app backend/app.py ingest backend/knowledge_seed.json
.venv/Scripts/python -m flask --app backend/app.py ingest-study
.venv/Scripts/python -m flask --app backend/app.py run --port 5000
```

在第二个终端从仓库根目录启动前端。

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

访问 `http://localhost:3000`。首次导入种子后，`http://localhost:3000/api/health` 应返回 `{"ok":true,"knowledgeSources":13}`。在 `frontend/` 运行 `npm run lint` 和 `npm run build` 验证前端生产构建，也可用 `npm start` 启动生产构建。

检查界面时，先在未登录状态打开 `/login` 和 `/register`，再使用开发库的测试账号打开 `/chat` 和 `/settings`。用窄屏和桌面窗口验证键盘焦点、账号表单、侧栏收起、快捷提问、图片选择和设置保存。测试记录应区分真实后端与模拟数据。

在对话页从侧栏底部账号菜单进入「设置 → 风格」，逐个切换风格并刷新，确认已选风格与打开的会话均保留，且每套风格切换时预设左侧侧栏。退出后检查登录页的版式和素材，再切回「默认」检查原版。

用测试账号验证邮箱和账号名注册、登录，以及「设置 → 账号安全」中的账号名绑定。从发送键左侧的模型菜单进入「配置模型」，选择厂商或填写自定义 Base URL、模型 ID 和 API Key，测试连接后切换并发起对话。新标签页通常需要重新填写 API Key。

在侧栏新建项目，将已有对话移入项目，再验证置顶和搜索弹窗。删除项目后确认原对话仍在。点击输入框上方的「AI 生成书法参考图」，从右侧工作台生成图片并确认刷新后仍可查看对话中的结果。

打开输入框上方的三个学习面板。用「東」检索书法字典并带入集字拼图，下载 PNG。用「書法與臨摹」验证繁简转换。将一首诗带入章法排版，检查竖排列序和图片导出。给书家加入收藏，从选帖卡加入练习计划并标记完成。用另一账号验证收藏与日期数据隔离。桌面和移动端都应能用键盘打开面板，按 Escape 关闭并继续编辑对话。

在一条对话开始生成回复后立即新建或打开另一条对话。确认两条对话可独立收发、侧栏标出正在生成的会话，且原回复完成后刷新仍可查看。用模拟模型流验证慢响应、超时和输出截断。

## Vercel 部署

### 1. 导入 Flask 项目

1. 将代码推送到待部署的 GitHub 分支。在 Vercel 进入 **Add New → Project**，选择 `ycvenopyer/iTip`。
2. **Root Directory** 选 `backend`，**Framework Preset** 选 **Flask**，保留默认安装和构建设置。入口是 `backend/app.py`，`.python-version` 指定 Python 3.12。
3. 在 **Settings → Environments → Production → Branch Tracking** 检查生产分支，按仓库默认部署 `main`。若导入时已产生首次部署，配置完数据库和变量后重新部署。 [Git 项目导入](https://vercel.com/docs/git#production-branch) · [Monorepo 设置](https://vercel.com/docs/monorepos) · [Flask 部署](https://vercel.com/docs/frameworks/backend/flask)

### 2. 创建并初始化生产 PostgreSQL

1. 在后端项目中打开 **Storage**，通过 Marketplace 连接 **Neon**，或使用已有的 PostgreSQL。数据库只需连接到后端项目。
2. 在 **Settings → Environment Variables** 检查 **Production** 环境里的 `DATABASE_URL`。如果集成生成了带前缀的变量，或你使用自建数据库，手动添加 `DATABASE_URL`。Neon 运行时可使用池化连接串，保留服务商附带的 TLS 参数。
3. 用同一个生产数据库的连接串在本机执行下列命令。可在当前终端设置 `DATABASE_URL`，或暂写进 Git 忽略的 `backend/.env`。如果服务商提供直连串，可用同库的直连串初始化。执行完成后恢复本地开发配置。 [Vercel PostgreSQL](https://vercel.com/docs/postgres) · [Neon 连接信息](https://neon.com/docs/connect/connect-from-any-app)

```powershell
.venv/Scripts/python -m flask --app backend/app.py init-db
.venv/Scripts/python -m flask --app backend/app.py ingest backend/knowledge_seed.json
.venv/Scripts/python -m flask --app backend/app.py ingest-study
```

每次发布包含数据库结构变更的 Flask 版本前，对目标环境运行 `init-db`。它在一个事务中创建缺少的表和索引，并迁移已有账号及对话表，可重复执行。`ingest` 按来源 ID 更新知识库，`ingest-study [路径]` 按稳定 ID 更新工作台目录。省略路径时使用 [study_seed.json](../backend/study_seed.json)。两种导入命令可在安装了后端依赖的环境中单独执行。 [数据库表与字段](database.md)

#### 在 Vercel Query 执行迁移

Vercel 的数据库 Query 每次接收一条 SQL。如果直接粘贴 [schema.sql](../backend/schema.sql) 后收到 `cannot insert multiple commands into a prepared statement`，在仓库根目录运行以下 PowerShell 命令，将整个迁移包装成一个 PostgreSQL `DO` 语句并复制到剪贴板。

```powershell
$itipSchema = Get-Content -Raw -Encoding UTF8 backend/schema.sql
(@('DO $itip_migration$', 'BEGIN', $itipSchema, 'END;', '$itip_migration$;') -join "`n") | Set-Clipboard
```

确认 Query 连接的是后端实际使用的数据库和分支，再粘贴并整段运行。迁移全部成功后才会提交。

### 3. 配置并部署 Flask

在后端项目的 **Settings → Environment Variables** 选择 **Production**。运行本地开发一节的随机值生成命令两次，分别为登录签名和前后端代理准备独立密钥。配置后 Deploy 或 Redeploy，记下稳定的后端生产域名，例如 `https://itip-api.vercel.app`。

| 变量 | 生产值 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL。Neon 池化连接地址通常包含 `-pooler` |
| `AUTH_SECRET` | Flask 的 JWT 签名密钥。填写以 32 字节随机值生成的字符串 |
| `BACKEND_PROXY_SECRET` | 前端调用 Flask 的共享密钥。保存生成的第二份随机值，前端需要使用同一份 |
| `COOKIE_SECURE` | `1`，生产 Cookie 仅通过 HTTPS 发送 |
| `AI_BASE_URL` | 云端可访问的 OpenAI 兼容 API 地址，智谱示例为 `https://open.bigmodel.cn/api/paas/v4` |
| `AI_API_KEY` | 模型服务商的 API Key |
| `AI_MODEL` | 文本模型的实际可用 ID |
| `AI_VISION_MODEL` | 对话附图和看图识字使用的视觉模型 ID |
| `AI_IMAGE_MODEL` | 出图模型的实际可用 ID |

参见 [后端变量模板](../backend/.env.example)。

### 4. 导入和配置 Next.js

从同一仓库创建前端项目，或在已有前端项目的 **Settings → Build and Deployment** 更新配置。**Root Directory** 选 **`frontend`**，**Framework Preset** 选 **Next.js**，**Node.js Version** 选 **22.x**。保留默认的构建命令、安装命令和输出目录。检查生产分支与后端一致，填好变量后部署。复用前端项目可以保留已配置的域名。

| 变量 | 生产值 |
| --- | --- |
| `FLASK_API_URL` | 第 3 步的 Flask HTTPS 源地址，填写协议和域名 |
| `BACKEND_PROXY_SECRET` | 与 Flask 项目中的值完全相同 |
| `SITE_URL` | 用户实际访问的前端 HTTPS 地址，用于 sitemap 和站点元数据 |
| `VERCEL_BACKEND_BYPASS_SECRET` | 可选。Flask 域名启用 Vercel Deployment Protection 时使用 |

需要绕过部署保护时，在 Flask 项目的 **Settings → Deployment Protection → Protection Bypass for Automation** 生成密钥，把它填入前端项目的 `VERCEL_BACKEND_BYPASS_SECRET`。前端服务端会把密钥放入 Vercel 要求的请求头。应用的 `BACKEND_PROXY_SECRET` 仍需配置。若首次部署前无法确定 `SITE_URL`，先部署，填入稳定的前端生产域名后再 Redeploy。 [前端变量模板](../frontend/.env.example) · [Vercel 环境变量](https://vercel.com/docs/environment-variables) · [部署保护绕过](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)

### 5. 验收与排查

- 打开前端域名的 `/api/health`，应返回 `ok: true` 和 `knowledgeSources: 13` 或更多。
- 注册、登录并询问“神龙本和定武本有什么区别？”。检查流式输出、来源链接和刷新后恢复历史，再测试附图和出图。
- 健康检查通过后仍应测试注册或登录。`/api/health` 用于检查数据库，因此不会检验登录签名或前后端代理密钥。
- 如果 Flask 日志出现 `column "username" does not exist`、`column "project_id" does not exist` 或 `Database schema mismatch`，先确认部署实际使用的 `DATABASE_URL` 指向哪个数据库和分支，再用有修改表结构权限的同库连接执行 `init-db`，或[在 Vercel Query 执行迁移](#在-vercel-query-执行迁移)。迁移保留已有账号和对话，旧邮箱账号的 `username` 默认留空。迁移成功后检查前端域名的 `/api/health`，再用已有账号访问 `/api/auth/me` 或刷新页面。仅补数据库迁移时，迁移完成即可生效。
- 注册或登录返回 **503** 且提示「登录服务尚未配置」时，确认后端 Production 的 `AUTH_SECRET` 有有效值且已重新部署。「后端代理尚未配置」时，检查后端 Production 的 `BACKEND_PROXY_SECRET`。
- **401** 时检查登录状态。**403** 时检查两边的代理密钥是否一致，以及 Flask 的部署保护。前端返回 **502** 且提示「无法连接 iTip 后端」时，核对 `FLASK_API_URL` 和后端生产域名。**500** 时检查 Flask 日志、连接串和初始化步骤。
- 自定义模型的连接测试会发送一条简短的流式对话请求，并按失败原因提示检查域名、接口地址、密钥、模型权限或服务商额度。Base URL 可以填写服务商公布的 OpenAI 兼容 API 根路径，也可以粘贴以 `/chat/completions` 结尾的完整地址。
- 外观可在对话页的设置中调整，刷新后应保留在当前浏览器。
- 修改变量后重新部署对应项目。使用 Preview 时，给 Preview 后端独立的 PostgreSQL 分支，给两边配置匹配的代理密钥，并让前端 Preview 指向相应的 Flask 域名。
- 单次选择的附图合计上限为 2 MiB。应用的消息请求上限为 4 MB，累计图片较多而遇到 `413` 时可压缩图片或新开对话。 [Vercel 请求体限制](https://vercel.com/docs/functions/limitations#request-body-size)

### 回复时间与长度

- 模型 HTTP 客户端的网络超时为 55 秒。流式读取中，这是等待下一块网络数据的时间，连接等其他网络阶段也使用该超时配置。 [HTTPX 超时](https://www.python-httpx.org/advanced/timeouts/)
- 聊天遇到服务商临时限流或原因不明的 HTTP 429 时，会在正文开始前退避重试最多两次。重试遵循服务商的 `Retry-After`，两次累计等待最多 10 秒。已知额度耗尽、权限错误和已输出正文的请求直接报告错误。默认模型的额度由部署所用的服务商账号提供，多名用户共用该账号的限额。
- Next.js 代理发往 Flask 的请求在 105 秒时中止。前后端的 Vercel 函数均配置了 120 秒运行上限。 [Vercel 函数运行时长](https://vercel.com/docs/functions/configuring-functions/duration)
- 聊天请求没有显式指定 `max_tokens` 或 `max_completion_tokens`，回复上限由模型和服务商决定。模型报告达到上限时会在回复末尾提示。4,000,000 字节是接口请求体限制，适用于对话记录及附图等输入。
- Flask 将慢请求的 `retrieval_ms`、`model_first_text_ms` 和 `total_ms` 记在 `Chat timing` 日志中。用它区分知识库检索、模型返回首段正文和整轮生成耗时。长历史、图片和推理模型可能增加请求处理时间。

## 扩充书法知识库

以 [种子文件](../backend/knowledge_seed.json) 为模板制作 UTF-8 JSON，将资料整理成条目、摘要和带出处的关系，再运行 `python -m flask --app backend/app.py ingest <文件路径>`。

- `entities` 记录实体的 `id`、`name`、`kind` 和 `aliases`。可通过 ID 关联已有实体。
- `sources` 记录 `id`、`title`、`kind`、`url`、`summary`、相关 `entities` 和 `edges`。每条边按 `["源实体 ID", "关系", "目标实体 ID"]` 编写。
- 支持帖碑、文献、网站、字典四类来源。使用可回查的 HTTPS URL，保留获授权的内容或自行编写的摘要。
- 重复导入同一个来源 ID 会更新内容和关系。本次未列出的来源继续保留。

参见 [架构与接口](architecture.md)。
