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
  instance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  db = instance;
  return db;
}
