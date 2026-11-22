import type { UIMessage } from "ai";

import { backendJson } from "@/lib/backend";

export type ChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: number;
  pinned: number;
};

export async function listChatConversations() {
  const result = await backendJson<{ conversations: ChatConversationSummary[] }>("/api/chat/conversations");
  return result.conversations;
}

export async function createChatConversation() {
  const result = await backendJson<{ id: string }>("/api/chat/conversations", "POST");
  return result.id;
}

export function getChatConversation(id: string) {
  return backendJson<{ id: string; title: string; messages: UIMessage[] }>(
    `/api/chat/conversations/${encodeURIComponent(id)}`,
    "GET",
    true,
  );
}
