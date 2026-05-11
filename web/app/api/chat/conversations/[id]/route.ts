import type { UIMessage } from "ai";
import { NextResponse } from "next/server";

import {
  deleteChatConversation,
  getChatConversation,
  pinChatConversation,
  renameChatConversation,
  saveChatConversationMessages,
} from "@/lib/chat-store";
import { getSession } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const row = getChatConversation(session.userId, id);
  if (!row) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  return NextResponse.json({
    id: row.id,
    title: row.title,
    messages: row.messages,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { messages, title, pinned } = body as {
    messages?: unknown;
    title?: unknown;
    pinned?: unknown;
  };

  // 保存消息
  if (messages !== undefined) {
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages 须为数组" }, { status: 400 });
    }
    const ok = saveChatConversationMessages(session.userId, id, messages as UIMessage[]);
    if (!ok) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  // 重命名
  if (title !== undefined) {
    if (typeof title !== "string") {
      return NextResponse.json({ error: "title 须为字符串" }, { status: 400 });
    }
    const ok = renameChatConversation(session.userId, id, title);
    if (!ok) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  // 置顶/取消置顶
  if (pinned !== undefined) {
    if (typeof pinned !== "boolean") {
      return NextResponse.json({ error: "pinned 须为布尔值" }, { status: 400 });
    }
    const ok = pinChatConversation(session.userId, id, pinned);
    if (!ok) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = deleteChatConversation(session.userId, id);
  if (!ok) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
