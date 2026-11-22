CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at BIGINT NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
    ON chat_conversations (user_id, updated_at DESC);
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
