"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Vote = "up" | "down";

function insertQuoteIntoTextarea(
  el: HTMLTextAreaElement,
  role: UIMessage["role"],
  text: string
) {
  const label = role === "user" ? "我" : role === "assistant" ? "iTip" : String(role);
  const block = `「引用·${label}」\n${text.trim()}\n\n`;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = before + block + after;
  const pos = start + block.length;
  el.focus();
  requestAnimationFrame(() => el.setSelectionRange(pos, pos));
}

const assistantMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 border-b border-ink-200/40 pb-1 text-xl font-semibold text-ink-950 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold text-ink-950 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-ink-900 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed [&>p]:mb-1 [&>p]:last:mb-0">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-bamboo-500/70 pl-3 text-ink-700">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-bamboo-600 underline decoration-bamboo-500/50 underline-offset-2 hover:text-bamboo-500"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-ink-200/50" />,
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
        className="rounded bg-ink-200/40 px-1.5 py-0.5 font-mono text-[0.9em] text-ink-900"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-ink-200/40 bg-ink-900 p-3 text-paper-50 [&>code]:bg-transparent">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full min-w-[12rem] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-ink-100/80">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-ink-200/50 px-2 py-1.5 text-left font-semibold text-ink-900">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-ink-200/40 px-2 py-1.5 text-ink-800">{children}</td>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink-950">{children}</strong>,
  em: ({ children }) => <em className="italic text-ink-800">{children}</em>,
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
  onQuote,
}: {
  plainText: string;
  vote: Vote | undefined;
  onVote: (v: Vote) => void;
  copyDone: boolean;
  onCopy: () => void;
  onQuote: () => void;
}) {
  const hasText = plainText.trim().length > 0;
  const isLikeSelected = vote === "up";
  const isDislikeSelected = vote === "down";
  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-ink-200/25 pt-2"
      role="group"
      aria-label="本条消息操作"
    >
      <button
        type="button"
        title="点赞"
        aria-label={isLikeSelected ? "点赞（已选），点击取消" : "点赞"}
        className={`rounded-md px-2 py-1 text-sm leading-none transition-colors ${
          isLikeSelected
            ? "bg-bamboo-500/25 text-bamboo-600"
            : "text-ink-600 hover:bg-ink-200/40 hover:text-ink-900"
        }`}
        onClick={() => onVote("up")}
      >
        <span aria-hidden>👍</span>
      </button>
      <button
        type="button"
        title="点踩（贬低反馈）"
        aria-label={isDislikeSelected ? "点踩（已选），点击取消" : "点踩"}
        className={`rounded-md px-2 py-1 text-sm leading-none transition-colors ${
          isDislikeSelected
            ? "bg-cinnabar/15 text-cinnabar"
            : "text-ink-600 hover:bg-ink-200/40 hover:text-ink-900"
        }`}
        onClick={() => onVote("down")}
      >
        <span aria-hidden>👎</span>
      </button>
      <button
        type="button"
        title={copyDone ? "已复制" : "复制全文"}
        aria-label={copyDone ? "已复制到剪贴板" : "复制全文"}
        disabled={!hasText}
        className="rounded-md px-2 py-1 text-sm leading-none text-ink-600 transition-colors hover:bg-ink-200/40 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onCopy}
      >
        <span aria-hidden>{copyDone ? "✅" : "📋"}</span>
      </button>
      <button
        type="button"
        title="引用到输入框"
        disabled={!hasText}
        className="rounded-md px-2 py-1 text-sm leading-none text-ink-600 transition-colors hover:bg-ink-200/40 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onQuote}
      >
        <span aria-hidden>💬</span>
      </button>
    </div>
  );
}

export function CalligraphyChat() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
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
  const { messages, sendMessage, status, stop, error, clearError } = useChat({ transport });
  const busy = status === "streaming" || status === "submitted";

  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="ink-scroll min-h-0 flex-1 space-y-5 overflow-y-auto rounded-2xl border border-ink-200/20 bg-ink-50/40 p-4 md:p-6">
        {messages.length === 0 && (
          <p className="text-ink-500/80">
            你好。可问选帖、用笔、结字、日课安排；也可上传单字/局部照片做书体与用笔讨论（非专业鉴定）。本版暂不生成整幅作品图。
          </p>
        )}
        {messages.map((m) => {
          const plain = textFromParts(m);
          return (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "border-l-2 border-cinnabar pl-3"
                  : "border-l-2 border-ink-300/40 pl-3"
              }
            >
              <div className="text-xs font-medium uppercase tracking-widest text-ink-500/70">
                {roleLabel(m.role)}
              </div>
              <div className="mt-1 text-ink-900">{renderParts(m)}</div>
              {m.role === "user" && !plain && (
                <p className="text-sm text-ink-500/70">（仅附件）</p>
              )}
              <MessageToolbar
                plainText={plain}
                vote={votes[m.id]}
                onVote={(v) => handleVote(m.id, v)}
                copyDone={copiedId === m.id}
                onCopy={() => void handleCopy(m.id, plain)}
                onQuote={() => {
                  const el = inputRef.current;
                  if (el && plain.trim()) insertQuoteIntoTextarea(el, m.role, plain);
                }}
              />
            </div>
          );
        })}
        {error && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-cinnabar">
            <span>{error.message}</span>
            <button
              type="button"
              onClick={() => clearError()}
              className="underline"
            >
              关闭
            </button>
          </div>
        )}
      </div>
      <form
        className="flex shrink-0 flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const el = inputRef.current;
          const text = el?.value?.trim() ?? "";
          if (!text && !file) return;
          if (file) {
            const list = new DataTransfer();
            list.items.add(file);
            if (text) await sendMessage({ text, files: list.files });
            else await sendMessage({ files: list.files });
            setFile(null);
          } else {
            await sendMessage({ text });
          }
          if (el) el.value = "";
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            ref={inputRef}
            rows={2}
            disabled={busy}
            placeholder="用中文或英文提出你的问题…"
            className="min-h-[3rem] w-full flex-1 resize-y rounded-xl border border-ink-200/30 bg-paper-100/80 px-3 py-2 text-ink-900 shadow-inner shadow-ink-900/5 placeholder:text-ink-500/50 focus:outline-none focus:ring-2 focus:ring-bamboo-400/30"
          />
          <div className="flex gap-2">
            <label className="cursor-pointer rounded-xl border border-ink-200/30 bg-paper-50 px-3 py-2 text-center text-sm text-ink-800 hover:border-bamboo-500/50">
              附图
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {busy ? (
              <button
                type="button"
                onClick={() => void stop()}
                className="rounded-xl bg-ink-800 px-4 py-2 text-sm text-paper-50"
              >
                停止
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-xl bg-ink-900 px-4 py-2 text-sm text-paper-50 shadow-lg shadow-ink-900/20"
              >
                发送
              </button>
            )}
          </div>
        </div>
        {file && (
          <p className="text-xs text-ink-600">
            已选：{file.name}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setFile(null)}
            >
              移除
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
