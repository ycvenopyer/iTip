"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    if (p.type === "text")
      return (
        <p key={i} className="whitespace-pre-wrap leading-relaxed">
          {p.text}
        </p>
      );
    if (p.type === "file" && p.url)
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
    return null;
  });
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="ink-scroll min-h-0 flex-1 space-y-5 overflow-y-auto rounded-2xl border border-ink-200/20 bg-ink-50/40 p-4 md:p-6">
        {messages.length === 0 && (
          <p className="text-ink-500/80">
            你好。可问选帖、用笔、结字、日课安排；也可上传单字/局部照片做书体与用笔讨论（非专业鉴定）。本版暂不生成整幅作品图。
          </p>
        )}
        {messages.map((m) => (
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
            {m.role === "user" && !textFromParts(m) && (
              <p className="text-sm text-ink-500/70">（仅附件）</p>
            )}
          </div>
        ))}
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
