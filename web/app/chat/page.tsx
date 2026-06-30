import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChatShell } from "@/components/ChatShell";
import {
  createChatConversation,
  getChatConversation,
  listChatConversations,
} from "@/lib/chat-store";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "对话",
  description: "与 iTip 书法助手对话，探讨硬笔、软笔、兼修之法。",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ c?: string }> };

export default async function ChatPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { c } = await searchParams;
  const list = listChatConversations(session.userId);

  let activeId = c ?? null;
  if (!activeId || !list.some((x) => x.id === activeId)) {
    if (list.length > 0) {
      activeId = list[0].id;
    } else {
      activeId = createChatConversation(session.userId);
    }
    if (c !== activeId) {
      redirect(`/chat?c=${activeId}`);
    }
  }

  const convo = getChatConversation(session.userId, activeId);
  if (!convo) {
    const fresh = createChatConversation(session.userId);
    redirect(`/chat?c=${fresh}`);
  }

  return (
    <ChatShell
      summaries={list}
      activeId={convo.id}
      initialMessages={convo.messages}
    />
  );
}
