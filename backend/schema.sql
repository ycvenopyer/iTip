CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE,
    username TEXT,
    password_hash TEXT NOT NULL,
    created_at BIGINT NOT NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE TABLE IF NOT EXISTS chat_projects (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, id)
);
CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    messages_json TEXT NOT NULL DEFAULT '[]',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS project_id TEXT;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conrelid = 'chat_conversations'::regclass AND conname = 'chat_conversation_project_fkey') THEN
        ALTER TABLE chat_conversations ADD CONSTRAINT chat_conversation_project_fkey
            FOREIGN KEY (user_id, project_id) REFERENCES chat_projects (user_id, id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
    ON chat_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project
    ON chat_conversations (user_id, project_id) WHERE project_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    hits INTEGER NOT NULL,
    reset_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits (reset_at);
CREATE TABLE IF NOT EXISTS kb_sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    kind TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kb_entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kb_terms (
    entity_id TEXT NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    PRIMARY KEY (term, entity_id)
);
CREATE TABLE IF NOT EXISTS kb_source_entities (
    source_id TEXT NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
    PRIMARY KEY (source_id, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_kb_source_entities_entity ON kb_source_entities (entity_id);
CREATE TABLE IF NOT EXISTS kb_edges (
    source_id TEXT NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
    predicate TEXT NOT NULL,
    object_id TEXT NOT NULL REFERENCES kb_entities(id) ON DELETE CASCADE,
    PRIMARY KEY (source_id, subject_id, predicate, object_id)
);
CREATE INDEX IF NOT EXISTS idx_kb_edges_subject ON kb_edges (subject_id);
CREATE INDEX IF NOT EXISTS idx_kb_edges_object ON kb_edges (object_id);
