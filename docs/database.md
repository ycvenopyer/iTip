# 数据库设计

iTip 使用 PostgreSQL。表结构由 [schema.sql](../backend/schema.sql) 维护，连接与事务由 [db.py](../backend/db.py) 管理。从仓库根目录执行 `python -m flask --app backend/app.py init-db`，可重复运行并扩充已有数据库。初始化后可分别用 `ingest backend/knowledge_seed.json` 和 `ingest-study` 导入知识库与工作台目录。详见[开发与部署](dev.md)。

## 账号、对话与知识库

| 表 | 字段与关系 |
| --- | --- |
| `users` | `id TEXT` 主键。可选的 `email` 和 `username` 分别保持唯一。`password_hash` 保存 bcrypt 散列，`created_at BIGINT` 为毫秒时间戳。 |
| `chat_projects` | `(user_id, id)` 复合主键，另有 `name`、`created_at`。 |
| `chat_conversations` | `id` 主键及 `user_id`、`project_id`、`title`、`messages_json`、`pinned`、时间戳。项目引用同时匹配 `user_id`，历史按用户与更新时间查询。 |
| `rate_limits` | `key` 是作用域和 HMAC 身份标识的组合，`hits` 和 `reset_at` 记录固定窗口，过期记录按 `reset_at` 清理。 |
| `kb_sources`、`kb_entities` | 分别存资料正文摘要、HTTPS 链接与具名实体。 |
| `kb_terms`、`kb_source_entities`、`kb_edges` | 将别名、出处和有向关系关联到资料与实体。由 RAG 查询使用。 |

## 书法工作台

目录使用稳定的文本 ID。展示数据由 [study_seed.json](../backend/study_seed.json) 导入，目录和个人数据处在同一数据库。个人请求只使用会话中的用户 ID，工作台目录读取无需调用模型。

| 表 | 字段与约束 |
| --- | --- |
| `study_dictionary` | `id TEXT` 主键。 `kind` 取 `calligraphy`、`character`、`word`、`seal`、`idiom`。`title` 是词头，`aliases TEXT[]` 保存变体，`reading` 保存读音，`radical` 和可空 `strokes SMALLINT` 保存单字检索信息。`summary`、`example`、`source_url` 用于展示。 |
| `study_people` | `id` 主键，`title` 姓名，`aliases` 字号或异写，`era` 朝代，`styles TEXT[]` 书体，另含 `summary`、`source_url`。 |
| `study_works` | `id` 主键，`person_id` 外键。 `title`、`aliases`、`era`、`script` 用于检索，`edition` 说明原作或传本，`summary` 和 `practice` 解释作品与练法。可空的 `image_path`、`image_credit` 成对保存，`source_url` 指向可核对的资料。 |
| `study_glyphs` | `id` 主键，`character` 为单一 Unicode 字符，`aliases` 保存简繁异写。 `work_id` 外键指向有图作品，`crop_x`、`crop_y`、`crop_width`、`crop_height` 使用原图片素坐标。 |
| `study_poems` | `id` 主键，`title`、`aliases`、`author`、`genre`、`content`、`source_url`。 `genre` 限唐诗、宋词，原文保留分行。 |
| `study_favorites` | `user_id` 外键，`person_id` 和 `work_id` 恰填其一。两个分部唯一索引保证每个用户只收藏同一对象一次。`created_at TIMESTAMPTZ` 用于倒序展示。 |
| `study_calendar` | `(user_id, practice_date DATE)` 主键。 `task` 保存 1–200 字的练习安排，`completed BOOLEAN` 记录完成情况，`updated_at TIMESTAMPTZ` 记录写入时间。 |

导入在一笔事务中按人物、作品、字形、字词、诗词的依赖顺序提交。同一 ID 更新已有行，避免重建收藏引用。目录按精确项和别名优先，其余按包含匹配。小语料使用参数化的子串查询，字典类型、作品书家和字形字头各有索引。相关作品、收藏和日历均使用稳定排序和账号隔离。

## 图片与临时数据

目录仅保存已审核的本地图片路径、裁切坐标和图像署名。「看图识字」临时提交图片给默认视觉模型，结果返回浏览器。临摹任务的文本可以由用户保存到日历。拼图、排版、计数和繁简转换没有独立的用户数据表。
