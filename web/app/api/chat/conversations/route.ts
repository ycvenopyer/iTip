import { NextResponse } from "next/server";

import { createChatConversation, listChatConversations } from "@/lib/chat-store";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }
  const items = listChatConversations(session.userId);
  return NextResponse.json({ conversations: items });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }
  const id = createChatConversation(session.userId);
  return NextResponse.json({ id });
}
