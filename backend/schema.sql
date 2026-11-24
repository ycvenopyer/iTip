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

CREATE TABLE IF NOT EXISTS study_dictionary (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('calligraphy', 'character', 'word', 'seal', 'idiom')),
    title TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    reading TEXT NOT NULL DEFAULT '',
    radical TEXT NOT NULL DEFAULT '',
    strokes SMALLINT CHECK (strokes BETWEEN 1 AND 99),
    summary TEXT NOT NULL,
    example TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%')
);
CREATE INDEX IF NOT EXISTS idx_study_dictionary_kind_title ON study_dictionary (kind, title);

CREATE TABLE IF NOT EXISTS study_people (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    era TEXT NOT NULL,
    styles TEXT[] NOT NULL DEFAULT '{}',
    summary TEXT NOT NULL,
    source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%')
);

CREATE TABLE IF NOT EXISTS study_works (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL REFERENCES study_people(id),
    title TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    era TEXT NOT NULL,
    script TEXT NOT NULL,
    edition TEXT NOT NULL,
    summary TEXT NOT NULL,
    practice TEXT NOT NULL,
    image_path TEXT CHECK (image_path LIKE '/style-art/%'),
    image_credit TEXT,
    source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%'),
    CHECK ((image_path IS NULL) = (image_credit IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_study_works_person ON study_works (person_id);

CREATE TABLE IF NOT EXISTS study_glyphs (
    id TEXT PRIMARY KEY,
    character TEXT NOT NULL CHECK (char_length(character) = 1),
    aliases TEXT[] NOT NULL DEFAULT '{}',
    work_id TEXT NOT NULL REFERENCES study_works(id),
    crop_x INTEGER NOT NULL CHECK (crop_x >= 0),
    crop_y INTEGER NOT NULL CHECK (crop_y >= 0),
    crop_width INTEGER NOT NULL CHECK (crop_width > 0),
    crop_height INTEGER NOT NULL CHECK (crop_height > 0)
);
CREATE INDEX IF NOT EXISTS idx_study_glyphs_character ON study_glyphs (character);

CREATE TABLE IF NOT EXISTS study_poems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    author TEXT NOT NULL,
    genre TEXT NOT NULL CHECK (genre IN ('唐诗', '宋词')),
    content TEXT NOT NULL,
    source_url TEXT NOT NULL CHECK (source_url LIKE 'https://%')
);

CREATE TABLE IF NOT EXISTS study_favorites (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id TEXT REFERENCES study_people(id) ON DELETE CASCADE,
    work_id TEXT REFERENCES study_works(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((person_id IS NULL) <> (work_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_favorites_person
    ON study_favorites (user_id, person_id) WHERE person_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_favorites_work
    ON study_favorites (user_id, work_id) WHERE work_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_study_favorites_time ON study_favorites (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS study_calendar (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL,
    task TEXT NOT NULL CHECK (char_length(btrim(task)) BETWEEN 1 AND 200),
    completed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, practice_date)
);
