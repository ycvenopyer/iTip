"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { MessageAvatar } from "@/components/SealAvatar";

type Vote = "up" | "down";

const assistantMarkdownComponents: Components = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-6 border-b-2 border-ink-200/30 pb-2 text-xl font-semibold text-ink-950 first:mt-0 font-display">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-5 text-lg font-semibold text-ink-900 first:mt-0 relative">
        <span className="relative">
          {children}
          <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-bamboo-500/40 to-transparent" />
        </span>
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-base font-semibold text-ink-800 first:mt-0 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-bamboo-500/60" />
        {children}
      </h3>
    ),
    p: ({ children }) => <p className="mb-4 leading-7 last:mb-0 text-ink-700">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 space-y-2 pl-4">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 space-y-2 pl-4">{children}</ol>,
    li: ({ children }) => (
      <li className="leading-7 text-ink-700 relative pl-3 before:content-['·'] before:absolute before:left-0 before:text-bamboo-500 before:font-bold">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-cinnabar/40 bg-ink-50/50 pl-4 pr-3 py-2 text-ink-600 italic rounded-r">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="font-medium text-bamboo-600 underline decoration-bamboo-500/40 underline-offset-4 hover:text-bamboo-500 hover:decoration-bamboo-500 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-6 border-ink-200/30 brush-divider" />,
    code: ({ className, children, ...props }) => {
      const isFenced = Boolean(className?.startsWith("language-"));
      if (isFenced) {
        return (
          <code className={`font-mono text-sm text-paper-100 ${className ?? ""}`} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded-md bg-ink-100/70 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-700 border border-ink-200/30"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-4 overflow-x-auto rounded-lg border border-ink-200/30 bg-ink-900/95 p-4 text-paper-50 shadow-inner [&>code]:bg-transparent">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="mb-4 overflow-x-auto rounded-lg border border-ink-200/30">
        <table className="w-full min-w-[12rem] border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-ink-100/60 border-b border-ink-200/40">{children}</thead>,
    th: ({ children }) => (
      <th className="border-b border-ink-200/30 px-3 py-2 text-left font-semibold text-ink-800">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border-b border-ink-200/20 px-3 py-2 text-ink-700">{children}</td>
    ),
    strong: ({ children }) => <strong className="font-semibold text-ink-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-ink-600">{children}</em>,
  };

function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="chat-markdown max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} components={assistantMarkdownComponents}>
        {text}
      </Markdown>
    </div>
  );
}

function roleLabel(role: UIMessage["role"]) {
  if (role === "user") return "我";
  if (role === "assistant") return "iTip";
  return role;
}

function textFromParts(m: UIMessage) {
  return m.parts
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "file") return "";
      return "";
    })
    .join("");
}

function renderParts(m: UIMessage) {
  return m.parts.map((p, i) => {
    if (p.type === "text") {
      if (m.role === "assistant") {
        return <AssistantMarkdown key={i} text={p.text} />;
      }
      return (
        <p key={i} className="whitespace-pre-wrap leading-relaxed">
          {p.text}
        </p>
      );
    }
    if (p.type === "file" && p.url) {
      return (
        <figure key={i} className="mt-2 max-w-sm">
          {/* 用户本地上传，数据 URL 不适合 next/image 域名白名单 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt="上传图片"
            className="max-h-48 rounded border border-ink-200/20 object-contain"
          />
        </figure>
      );
    }
    return null;
  });
}

function MessageToolbar({
  plainText,
  vote,
  onVote,
  copyDone,
  onCopy,
  onRegenerate,
  isAssistant,
  onEdit,
}: {
  plainText: string;
  vote: Vote | undefined;
  onVote: (v: Vote) => void;
  copyDone: boolean;
  onCopy: () => void;
  onRegenerate?: () => void;
  isAssistant: boolean;
  onEdit?: () => void;
}) {
  const hasText = plainText.trim().length > 0;
  const isLikeSelected = vote === "up";
  const isDislikeSelected = vote === "down";

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1"
      role="group"
      aria-label="本条消息操作"
    >
      {/* 编辑 - 仅用户消息显示 */}
      {!isAssistant && onEdit && (
        <button
          type="button"
          title="编辑"
          aria-label="编辑消息"
          disabled={!hasText}
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded text-ink-400 transition-colors hover:bg-ink-200/30 hover:text-ink-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      )}

      {/* 复制 - 两个重叠方框 */}
      <button
        type="button"
        title={copyDone ? "已复制" : "复制"}
        aria-label={copyDone ? "已复制到剪贴板" : "复制"}
        disabled={!hasText}
        onClick={onCopy}
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          copyDone
            ? "text-bamboo-600"
            : "text-ink-400 hover:bg-ink-200/30 hover:text-ink-600 disabled:cursor-not-allowed disabled:opacity-40"
        }`}
      >
        {copyDone ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {/* 重新生成/刷新 - 仅 AI 消息显示 */}
      {isAssistant && onRegenerate && (
        <button
          type="button"
          title="重新生成"
          aria-label="重新生成"
          disabled={!hasText}
          onClick={onRegenerate}
          className="flex h-7 w-7 items-center justify-center rounded text-ink-400 transition-colors hover:bg-ink-200/30 hover:text-ink-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {/* 点赞/点踩 - 仅 AI 消息显示 */}
      {isAssistant && (
        <>
          {/* 点赞 - 空心大拇指 */}
          <button
            type="button"
            title="点赞"
            aria-label={isLikeSelected ? "点赞（已选），点击取消" : "点赞"}
            onClick={() => onVote("up")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isLikeSelected
                ? "text-bamboo-600"
                : "text-ink-400 hover:bg-ink-200/30 hover:text-ink-600"
            }`}
          >
            <svg className="h-4 w-4" fill={isLikeSelected ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>

          {/* 点踩 - 空心大拇指向下 */}
          <button
            type="button"
            title="点踩"
            aria-label={isDislikeSelected ? "点踩（已选），点击取消" : "点踩"}
            onClick={() => onVote("down")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isDislikeSelected
                ? "text-cinnabar"
                : "text-ink-400 hover:bg-ink-200/30 hover:text-ink-600"
            }`}
          >
            <svg className="h-4 w-4" fill={isDislikeSelected ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

export type CalligraphyChatProps = {
  conversationId: string;
  initialMessages: UIMessage[];
  onPersisted?: () => void;
};

export function CalligraphyChat({
  conversationId,
  initialMessages,
  onPersisted,
}: CalligraphyChatProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const hydratedRef = useRef(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        credentials: "include",
        fetch: async (url, init) => {
          const res = await fetch(url, init);
          if (res.status === 401) {
            router.push("/login");
            throw new Error("未登录或会话已过期");
          }
          if (!res.ok) {
            const t = await res.text();
            throw new Error(t || "请求失败");
          }
          return res;
        },
      }),
    [router]
  );
  const {
    messages,
    sendMessage,
    regenerate,
    status,
    stop,
    error,
    clearError,
  } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
  });
  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    hydratedRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (busy) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/chat/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ messages }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) onPersisted?.();
      })();
    }, 450);
    return () => clearTimeout(t);
  }, [messages, busy, conversationId, onPersisted, router]);

  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 内联编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleVote = (messageId: string, v: Vote) => {
    setVotes((prev) => {
      if (prev[messageId] === v) {
        const next = { ...prev };
        delete next[messageId];
        return next;
      }
      return { ...prev, [messageId]: v };
    });
  };

  const handleCopy = async (messageId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedId(messageId);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        setCopiedId(messageId);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="flex h-full flex-col relative">
      {/* 装饰性墨点 - 左上角 */}
      <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-ink-200/20 to-transparent blur-xl pointer-events-none" />
      {/* 装饰性墨点 - 右下角 */}
      <div className="absolute bottom-20 right-8 w-24 h-24 rounded-full bg-gradient-to-tl from-bamboo-500/10 to-transparent blur-2xl pointer-events-none" />

      {/* 消息区域 - 占据剩余空间并可滚动 */}
      <div className="ink-scroll flex-1 overflow-y-auto relative">
        {messages.length === 0 ? (
          /* 空状态 - 居中显示欢迎语 - 书法风格 */
          <div className="flex h-full flex-col items-center justify-center px-6 ink-fade-in">
            <div className="max-w-md text-center">
              {/* 印章式标题 */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-sm border-4 border-[#9a2c2c] bg-[#fdf6f6] flex items-center justify-center shadow-md">
                    <span className="text-3xl font-bold text-[#9a2c2c] font-display tracking-widest">iTip</span>
                  </div>
                </div>
              </div>

              <h2 className="font-display mb-4 text-2xl text-ink-900">
                笔墨相随，问道书法
              </h2>

              <div className="brush-divider my-4" />

              <p className="mb-6 text-ink-600/90 leading-relaxed">
                可问选帖、用笔、结字、日课安排
                <br />
                也可上传单字/局部照片做书体与用笔讨论
              </p>

              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <span className="px-4 py-2 rounded-full border border-bamboo-500/30 bg-bamboo-50/50 text-bamboo-700">
                  硬笔
                </span>
                <span className="px-4 py-2 rounded-full border border-ink-300/30 bg-ink-50/50 text-ink-600">
                  软笔
                </span>
                <span className="px-4 py-2 rounded-full border border-cinnabar/30 bg-cinnabar/5 text-cinnabar">
                  兼修
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 消息列表 - 书法卷轴风格 */
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
            {messages.map((m, index) => {
              const plain = textFromParts(m);
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""} ink-fade-in`}
                  data-delay={index}
                >
                  {/* 印章头像 */}
                  <div className="shrink-0 pt-1">
                    <MessageAvatar role={isUser ? "user" : "assistant"} />
                  </div>

                  {/* 内容区域 */}
                  <div
                    className={`flex-1 space-y-2 min-w-0 ${
                      isUser ? "items-end text-right" : ""
                    }`}
                  >
                    {/* 角色名 - 书法风格 */}
                    <div className={`flex items-center gap-2 text-xs ${isUser ? "flex-row-reverse" : ""}`}>
                      <span className="font-medium text-ink-500 tracking-wide">
                        {roleLabel(m.role)}
                      </span>
                      <span className="h-px w-4 bg-ink-200/50" />
                    </div>

                    {/* 消息气泡 - 宣纸质感 / 编辑模式 */}
                    {editingId === m.id ? (
                      // 内联编辑模式
                      <div className="w-full max-w-full">
                        <textarea
                          ref={editTextareaRef}
                          value={editText}
                          placeholder="编辑消息内容..."
                          title="编辑消息内容"
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              // 保存编辑：发送新消息
                              const trimmed = editText.trim();
                              if (trimmed) {
                                void sendMessage({ text: trimmed });
                              }
                              setEditingId(null);
                              setEditText("");
                            } else if (e.key === "Escape") {
                              // 取消编辑
                              setEditingId(null);
                              setEditText("");
                            }
                          }}
                          className={`w-full min-h-[80px] resize-y rounded-2xl border px-4 py-3 text-left font-body focus:outline-none focus:ring-2 ${
                            isUser
                              ? "border-bamboo-300 bg-bamboo-50/80 focus:ring-bamboo-400"
                              : "border-ink-300 bg-paper-50 focus:ring-ink-400"
                          }`}
                          autoFocus
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = editText.trim();
                              if (trimmed) {
                                void sendMessage({ text: trimmed });
                              }
                              setEditingId(null);
                              setEditText("");
                            }}
                            className="rounded-lg bg-bamboo-500 px-4 py-1.5 text-sm text-white transition-colors hover:bg-bamboo-600"
                          >
                            发送
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditText("");
                            }}
                            className="rounded-lg px-4 py-1.5 text-sm text-ink-500 transition-colors hover:bg-ink-100"
                          >
                            取消
                          </button>
                          <span className="text-xs text-ink-400">
                            Enter 发送，Esc 取消
                          </span>
                        </div>
                      </div>
                    ) : (
                      // 正常显示模式
                      <>
                        <div
                          className={`inline-block max-w-full text-left ${
                            isUser
                              ? "bg-bamboo-50/60 border border-bamboo-200/20 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm"
                              : "bg-paper-50/80 border border-ink-200/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"
                          }`}
                        >
                          {renderParts(m)}
                        </div>

                        {isUser && !plain && (
                          <p className="text-xs text-ink-500/70">（仅附件）</p>
                        )}

                        {/* 工具栏 */}
                        <MessageToolbar
                          plainText={plain}
                          vote={votes[m.id]}
                          onVote={(v) => handleVote(m.id, v)}
                          copyDone={copiedId === m.id}
                          onCopy={() => void handleCopy(m.id, plain)}
                          isAssistant={!isUser}
                          onRegenerate={
                            !isUser
                              ? () => {
                                  void regenerate();
                                }
                              : undefined
                          }
                          onEdit={
                            isUser
                              ? () => {
                                  setEditingId(m.id);
                                  setEditText(plain);
                                  // 下一帧聚焦
                                  setTimeout(() => {
                                    editTextareaRef.current?.focus();
                                  }, 0);
                                }
                              : undefined
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 错误提示 - 书法风格 */}
        {error && (
          <div className="mx-auto max-w-3xl px-4 pb-4 md:px-6">
            <div className="flex items-center gap-3 rounded-lg border border-cinnabar/20 bg-cinnabar/5 px-4 py-3 text-sm text-cinnabar">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="flex-1">{error.message}</span>
              <button
                type="button"
                onClick={() => clearError()}
                className="rounded px-2 py-1 text-cinnabar/70 hover:bg-cinnabar/10 hover:text-cinnabar transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 输入框区域 - 书法卷轴风格 */}
      <div className="relative border-t border-ink-200/20 bg-gradient-to-b from-paper-50 to-paper-100 px-4 py-4 md:px-6">
        {/* 装饰线条 */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-ink-200/30 to-transparent" />

        <form
          className="mx-auto max-w-3xl"
          onSubmit={async (e) => {
            e.preventDefault();
            const el = inputRef.current;
            const text = el?.value?.trim() ?? "";
            if (!text && !file) return;
            if (file) {
              const list = new DataTransfer();
              list.items.add(file);
              if (text)
                await sendMessage({ text, files: list.files });
              else await sendMessage({ files: list.files });
              setFile(null);
            } else {
              await sendMessage({ text });
            }
            if (el) el.value = "";
          }}
        >
          {/* 主输入容器 - 宣纸卷轴风格 */}
          <div className="relative rounded-2xl border border-ink-200/40 bg-paper-50 shadow-sm transition-all focus-within:border-bamboo-500/40 focus-within:shadow-md focus-within:ring-1 focus-within:ring-bamboo-500/10 ink-ripple">
            {/* 卷轴装饰角 */}
            <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-bamboo-500/30 rounded-tl-2xl" />
            <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-bamboo-500/30 rounded-tr-2xl" />
            <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-bamboo-500/30 rounded-bl-2xl" />
            <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-bamboo-500/30 rounded-br-2xl" />

            {/* 文本输入区域 */}
            <textarea
              ref={inputRef}
              rows={1}
              disabled={busy}
              placeholder="在此书写您的书法问题…"
              className="max-h-40 min-h-[3.5rem] w-full resize-none rounded-2xl bg-transparent px-5 py-4 pr-28 text-ink-800 placeholder:text-ink-400/70 focus:outline-none font-body"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />

            {/* 底部工具栏 */}
            <div className="flex items-center justify-between px-3 pb-3">
              {/* 左侧：附件按钮 + 提示文字 */}
              <div className="flex items-center gap-3">
                <label
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-400 transition-all hover:bg-ink-100 hover:text-ink-600 hover-ink-wash"
                  aria-label="上传图片"
                  title="上传图片"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <span className="text-xs text-ink-400/60 hidden sm:inline">
                  支持上传书法习作图片
                </span>
              </div>

              {/* 右侧：发送/停止按钮 - 印章风格 */}
              <div className="flex items-center gap-2">
                {busy ? (
                  <button
                    type="button"
                    aria-label="停止生成"
                    title="停止生成"
                    onClick={() => void stop()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-200/60 text-ink-600 transition-all hover:bg-ink-300/60"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label="发送消息"
                    title="发送消息 (Enter)"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-bamboo-500 text-white shadow-sm transition-all hover:bg-bamboo-600 hover:shadow-md disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 文件显示 - 标签风格 */}
          {file && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-bamboo-200/30 bg-bamboo-50/30 px-3 py-2 text-sm">
              <svg className="h-4 w-4 text-bamboo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="flex-1 truncate text-ink-600">{file.name}</span>
              <button
                type="button"
                aria-label="移除图片"
                title="移除图片"
                className="rounded p-1 text-ink-400 hover:bg-ink-200/50 hover:text-ink-600"
                onClick={() => setFile(null)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
