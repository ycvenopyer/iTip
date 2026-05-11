import { randomUUID } from "node:crypto";

import type { UIMessage } from "ai";

import { getDb } from "@/lib/db";

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: number;
  pinned: number; // 0 or 1
};

function textFromUserMessage(m: UIMessage): string {
  return m.parts
    .map((p) => {
      if (p.type === "text") return p.text;
      return "";
    })
    .join("")
    .trim();
}

export function deriveChatTitle(messages: UIMessage[]): string {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const t = textFromUserMessage(m);
    if (t) {
      const oneLine = t.replace(/\s+/g, " ");
      return oneLine.length > 48 ? `${oneLine.slice(0, 47)}…` : oneLine;
    }
  }
  return "新对话";
}

export function listChatConversations(userId: string): ChatConversationSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, updated_at AS updatedAt, pinned
       FROM chat_conversations
       WHERE user_id = ?
       ORDER BY pinned DESC, updated_at DESC`
    )
    .all(userId) as ChatConversationSummary[];
  return rows;
}

export function getChatConversation(
  userId: string,
  id: string
): { id: string; title: string; messages: UIMessage[] } | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, title, messages_json AS messagesJson
       FROM chat_conversations
       WHERE user_id = ? AND id = ?`
    )
    .get(userId, id) as { id: string; title: string; messagesJson: string } | undefined;
  if (!row) return null;
  let messages: UIMessage[] = [];
  try {
    const parsed = JSON.parse(row.messagesJson) as unknown;
    if (Array.isArray(parsed)) messages = parsed as UIMessage[];
  } catch {
    messages = [];
  }
  return { id: row.id, title: row.title, messages };
}

export function createChatConversation(userId: string): string {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO chat_conversations (id, user_id, title, messages_json, created_at, updated_at)
     VALUES (?, ?, '', '[]', ?, ?)`
  ).run(id, userId, now, now);
  return id;
}

export function saveChatConversationMessages(
  userId: string,
  id: string,
  messages: UIMessage[]
): boolean {
  const db = getDb();
  const existing = db
    .prepare(`SELECT title FROM chat_conversations WHERE user_id = ? AND id = ?`)
    .get(userId, id) as { title: string } | undefined;
  if (!existing) return false;
  const title =
    existing.title.trim().length > 0 ? existing.title : deriveChatTitle(messages);
  const now = Date.now();
  const result = db
    .prepare(
      `UPDATE chat_conversations
       SET messages_json = ?, title = ?, updated_at = ?
       WHERE user_id = ? AND id = ?`
    )
    .run(JSON.stringify(messages), title, now, userId, id);
  return result.changes > 0;
}

export function renameChatConversation(
  userId: string,
  id: string,
  title: string
): boolean {
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare(
      `UPDATE chat_conversations
       SET title = ?, updated_at = ?
       WHERE user_id = ? AND id = ?`
    )
    .run(title.trim(), now, userId, id);
  return result.changes > 0;
}

export function pinChatConversation(
  userId: string,
  id: string,
  pinned: boolean
): boolean {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE chat_conversations
       SET pinned = ?
       WHERE user_id = ? AND id = ?`
    )
    .run(pinned ? 1 : 0, userId, id);
  return result.changes > 0;
}

export function deleteChatConversation(userId: string, id: string): boolean {
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM chat_conversations WHERE user_id = ? AND id = ?`)
    .run(userId, id);
  return result.changes > 0;
}
