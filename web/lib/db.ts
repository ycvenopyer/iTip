import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;
  const file =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "itip.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const instance = new Database(file);
  instance.pragma("foreign_keys = ON");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      messages_json TEXT NOT NULL DEFAULT '[]',
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
      ON chat_conversations (user_id, updated_at DESC);
  `);
  // 兼容旧表：添加 pinned 列（如果尚不存在）
  try {
    instance.exec(`ALTER TABLE chat_conversations ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // 列已存在或其他错误，忽略
  }
  db = instance;
  return db;
}
