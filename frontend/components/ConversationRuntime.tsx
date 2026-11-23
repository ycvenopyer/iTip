"use client";

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { chatModelBody } from "@/lib/custom-models";

type Activity = { generating: boolean; error: string; saveError: string };
type Session = Activity & {
  chat: Chat<UIMessage>;
  saves: Promise<void>;
  pendingSaves: number;
};

const idle: Activity = { generating: false, error: "", saveError: "" };
const emptyActivities = new Map<string, Activity>();
const cachedConversations = 8;

class ConversationRuntime {
  private sessions = new Map<string, Session>();
  private activities = emptyActivities;
  private listeners = new Set<() => void>();

  constructor(private accountId: string, private onSaved: () => void, private onUnauthorized: () => void) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  getActivities = () => this.activities;

  private publish(session: Session) {
    const { generating, error, saveError } = session;
    const id = session.chat.id;
    const next = new Map(this.activities);
    if (generating || error || saveError) next.set(id, { generating, error, saveError });
    else next.delete(id);
    this.activities = next;
    this.listeners.forEach((listener) => listener());
  }

  private remember(session: Session) {
    const id = session.chat.id;
    this.sessions.delete(id);
    this.sessions.set(id, session);
    for (const [key, entry] of this.sessions) {
      if (this.sessions.size <= cachedConversations) break;
      if (key !== id && !entry.generating && !entry.pendingSaves && !entry.error && !entry.saveError) {
        this.sessions.delete(key);
      }
    }
  }

  getSession(id: string, messages: UIMessage[]): Session {
    const existing = this.sessions.get(id);
    if (existing) return existing;

    const session: Session = {
      ...idle,
      saves: Promise.resolve(),
      pendingSaves: 0,
      chat: new Chat({
        id,
        messages,
        transport: new DefaultChatTransport({
          api: "/api/chat",
          body: () => chatModelBody(this.accountId),
          prepareSendMessagesRequest: ({ id, body, messages, trigger, messageId }) => {
            if (trigger === "submit-message" && messages.at(-1)?.role === "user") {
              this.save(session, messages);
            }
            return {
              body: { ...body, id, trigger, messageId, messages: messages.filter(
                (message) => !message.parts.some((part) => part.type === "data-calligraphy-image"),
              ) },
            };
          },
          fetch: async (url, init) => {
            const response = await fetch(url, init);
            if (response.status === 401) this.onUnauthorized();
            if (!response.ok) {
              const result = await response.json().catch(() => ({})) as { error?: string };
              throw new Error(result.error || "回复请求失败，请重试");
            }
            return response;
          },
        }),
      }),
    };
    return session;
  }

  async run(session: Session, task: () => Promise<void>) {
    if (session.generating) return false;
    this.remember(session);
    const before = session.chat.messages;
    session.generating = true;
    session.error = "";
    this.publish(session);
    let accepted = true;
    try {
      await task();
      const error = session.chat.error;
      session.error = error instanceof TypeError ? "与回复服务的连接中断，请重试。" : error?.message ?? "";
    } catch {
      accepted = false;
      session.error = "无法发送这条消息，请重试";
    } finally {
      if (this.sessions.get(session.chat.id) === session) {
        if (session.chat.messages !== before && session.chat.messages.length) {
          this.save(session, session.chat.messages, true);
        }
        session.generating = false;
        this.publish(session);
      }
    }
    return accepted;
  }

  saveMessages(session: Session) {
    this.remember(session);
    this.save(session, session.chat.messages, true);
  }

  clearError(session: Session) {
    session.chat.clearError();
    session.error = "";
    this.publish(session);
  }

  discard(id: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    this.sessions.delete(id);
    void session.chat.stop();
    Object.assign(session, idle);
    this.publish(session);
  }

  stopAll() {
    for (const id of this.sessions.keys()) this.discard(id);
  }

  private save(session: Session, messages: UIMessage[], refresh = false) {
    const id = session.chat.id;
    session.pendingSaves += 1;
    session.saves = session.saves.then(async () => {
      if (this.sessions.get(id) !== session) return;
      try {
        const response = await fetch(`/api/chat/conversations/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
        if (response.status === 401) this.onUnauthorized();
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || "请稍后重试");
        }
        session.saveError = "";
        if (refresh && this.sessions.get(id) === session) this.onSaved();
      } catch (error) {
        session.saveError = `对话未保存。${error instanceof Error ? error.message : "请稍后重试"}`;
      }
    }).finally(() => {
      session.pendingSaves -= 1;
      if (this.sessions.get(id) === session) this.publish(session);
    });
  }
}

const RuntimeContext = createContext<ConversationRuntime | null>(null);

export function ConversationRuntimeProvider({ accountId, children }: { accountId: string; children: ReactNode }) {
  const router = useRouter();
  const [runtime] = useState(() => new ConversationRuntime(accountId, () => router.refresh(), () => router.push("/login")));
  useEffect(() => () => runtime.stopAll(), [runtime]);
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useConversationRuntime() {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error("Conversation runtime unavailable");
  return runtime;
}

export function useConversationActivities() {
  const runtime = useConversationRuntime();
  return useSyncExternalStore(runtime.subscribe, runtime.getActivities, () => emptyActivities);
}
