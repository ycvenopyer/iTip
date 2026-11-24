"use client";

import { useChat } from "@ai-sdk/react";
import type { DataUIPart, UIMessage } from "ai";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MessageAvatar } from "@/components/SealAvatar";
import { ChatWelcome } from "@/components/ChatWelcome";
import { ComposerModel } from "@/components/ComposerModel";
import { useConversationActivities, useConversationRuntime } from "@/components/ConversationRuntime";
import { CalligraphyImageCard, ImageWorkbench, imagePartType, readCalligraphyImage, type ImageDraft } from "@/components/ImageWorkbench";
import { ModelConfigDialog } from "@/components/ModelSettings";
import { StudyWorkbench, studySections } from "@/components/StudyWorkbench";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import type { StudyNavigation } from "@/lib/study";

type Vote = "up" | "down";

function isImagePart(part: UIMessage["parts"][number]): part is DataUIPart<{ "calligraphy-image": unknown }> {
  return part.type === imagePartType;
}

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

const AssistantMarkdown = memo(function AssistantMarkdown({ text }: { text: string }) {
  return (
    <div className="chat-markdown max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} components={assistantMarkdownComponents}>
        {text}
      </Markdown>
    </div>
  );
});

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
      className={`mt-2 flex flex-wrap items-center gap-1 ${isAssistant ? "" : "justify-end"}`}
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
  accountId: string;
  conversationId: string;
  defaultModelLabel: string;
  initialMessages: UIMessage[];
};

export function CalligraphyChat({
  accountId,
  conversationId,
  defaultModelLabel,
  initialMessages,
}: CalligraphyChatProps) {
  const runtime = useConversationRuntime();
  const [session] = useState(() => runtime.getSession(conversationId, initialMessages));
  const activity = useConversationActivities().get(conversationId);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);


  const [modelConfigOpen, setModelConfigOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [studyView, setStudyView] = useState<(StudyNavigation & { version: number }) | null>(null);

  function openStudy(view: StudyNavigation) {
    setStudyView((current) => ({ ...view, version: (current?.version ?? 0) + 1 }));
  }
  const [genLoading, setGenLoading] = useState(false);
  const [imageDraft, setImageDraft] = useState<ImageDraft>({ prompt: "", size: "1024x1024" });
  /* ---- 文件上传辅助 ---- */
  const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];

  const validateAndAddFiles = useCallback((newFiles: FileList | File[]) => {
    setFileError(null);
    const arr = Array.from(newFiles);
    const valid = [];
    for (const f of arr) {
      if (!ACCEPTED_TYPES.includes(f.type)) { setFileError("不支持的文件类型：" + f.name); continue; }
      if (f.size > MAX_ATTACHMENT_BYTES) { setFileError("图片过大，请缩小至 2 MiB 以内"); continue; }
      valid.push(f);
    }
    const total = [...files, ...valid].slice(0, 5);
    if (total.reduce((bytes, file) => bytes + file.size, 0) > MAX_ATTACHMENT_BYTES) {
      setFileError("本次附图合计最多 2 MiB，请减少图片或压缩后重试");
      return;
    }
    setFiles(total);
   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const removeFile = useCallback((index: number) => { setFiles((prev: File[]) => prev.filter((_: File, i: number) => i !== index)); }, []);
  const clearFiles = useCallback(() => { setFiles([]); setFileError(null); }, []);

  // 预览 URL 通过记忆函数直接生成，避免 src="" 问题
  const getPreviewUrl = useCallback((f: File) => URL.createObjectURL(f), []);
  const previewUrls = useMemo(() => files.map(getPreviewUrl), [files, getPreviewUrl]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); if (e.dataTransfer.files.length > 0) validateAndAddFiles(e.dataTransfer.files); }, [validateAndAddFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) { const f = items[i].getAsFile(); if (f) imageFiles.push(f); }
    }
    if (imageFiles.length > 0) { e.preventDefault(); validateAndAddFiles(imageFiles); }
  }, [validateAndAddFiles]);

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    status,
    stop,
  } = useChat({ chat: session.chat, experimental_throttle: 45 });
  const busy = !!activity?.generating;
  const retry = () => { void runtime.run(session, () => regenerate()); };

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

  const latestImagePart = messages.findLast((message) => message.parts.some(isImagePart))?.parts.find(isImagePart);
  const latestImage = readCalligraphyImage(latestImagePart?.data);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onPaste={handlePaste}>
      {/* 拖拽放置覆盖层 */}
      {dragOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-bamboo-400/60 bg-paper-50/90 px-8 py-6 shadow-2xl">
            <svg className="h-10 w-10 text-bamboo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="font-body text-sm text-ink-700">释放以上传图片</p>
            <p className="text-xs text-ink-400">支持 PNG / JPEG / WebP 等，合计 ≤ 2 MiB</p>
          </div>
        </div>
      )}
      <div className="ink-scroll relative min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <ChatWelcome disabled={busy || genLoading} onPrompt={(text) => {
            if (inputRef.current) {
              inputRef.current.value = text;
              inputRef.current.focus();
            }
          }} />
        ) : (
          <div className="chat-column space-y-7 px-4 py-7 md:px-6">
            {/* 对话消息 */}
            {messages.map((m) => {
              const part = m.parts.find(isImagePart);
              const image = readCalligraphyImage(part?.data);
              if (image) {
                return (
                  <div key={m.id} className="flex gap-4">
                    <div className="shrink-0 pt-1"><MessageAvatar role="assistant" /></div>
                    <div className="min-w-0 space-y-2">
                      <p className="text-xs font-medium text-ink-500">iTip · 墨图</p>
                      <CalligraphyImageCard image={image} copied={copiedId === m.id} onCopy={() => void handleCopy(m.id, image.url)}
                        onRegenerate={busy || genLoading ? undefined : () => {
                          setImageDraft({ prompt: image.prompt, size: image.size });
                          setImageOpen(true);
                        }} />
                    </div>
                  </div>
                );
              }
              const plain = textFromParts(m);
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}
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
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              // 保存编辑：发送新消息
                              const trimmed = editText.trim();
                              if (trimmed) {
                                void runtime.run(session, () => sendMessage({ text: trimmed }));
                              }
                              setEditingId(null);
                              setEditText("");
                            } else if (e.key === "Escape") {
                              // 取消编辑
                              setEditingId(null);
                              setEditText("");
                            }
                          }}
                          className={`chat-reading chat-message-surface w-full min-h-[80px] resize-y border px-4 py-3 text-left focus:outline-none focus:ring-2 ${
                            isUser
                              ? "border-bamboo-300 bg-bamboo-50/80 focus:ring-bamboo-400"
                              : "border-ink-300 bg-paper-50 focus:ring-ink-400"
                          }`}
                          autoFocus
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = editText.trim();
                              if (trimmed) {
                                void runtime.run(session, () => sendMessage({ text: trimmed }));
                              }
                              setEditingId(null);
                              setEditText("");
                            }}
                            className="workspace-primary rounded-lg px-4 py-1.5 text-sm transition-colors"
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
                          className={`chat-reading chat-message-surface inline-block max-w-full text-left ${
                            isUser
                              ? "border border-bamboo-200 bg-bamboo-50 px-4 py-3"
                              : "border border-ink-200 bg-paper-50 px-4 py-3"
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
                            !isUser && !busy && !genLoading ? retry : undefined
                          }
                          onEdit={
                            isUser && !busy && !genLoading
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
        {activity?.error && (
          <div className="chat-column px-4 pb-4 md:px-6">
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
              <span className="flex-1" role="alert">{activity.error}</span>
              {messages.length > 0 && <button type="button" onClick={retry} disabled={busy || genLoading}
                className="rounded px-2 py-1 hover:bg-cinnabar/10 disabled:opacity-50">重试</button>}
              <button
                type="button"
                onClick={() => runtime.clearError(session)}
                className="rounded px-2 py-1 text-cinnabar/70 hover:bg-cinnabar/10 hover:text-cinnabar transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pt-2 pb-3 md:px-6">
        <div className="chat-column composer-workflows">
          {studySections.map((section) => <button key={section.label} type="button" className="composer-workflow"
            aria-haspopup="dialog" aria-expanded={section.tools.some((tool) => tool.tab === studyView?.tab)}
            onClick={() => openStudy({ tab: section.tools[0].tab })}>
            <WorkspaceIcon name={section.icon} className="size-4 shrink-0" />{section.label}
          </button>)}
          <button type="button" className="composer-workflow" aria-haspopup="dialog" aria-expanded={imageOpen} disabled={busy}
            onClick={() => setImageOpen(true)}>
            <WorkspaceIcon name="sparkle" className="size-4 shrink-0" />AI 生成书法参考图
          </button>
          {genLoading && <span className="text-xs text-ink-500" role="status">正在生成参考图…</span>}
          {busy && <span className="conversation-status" role="status">
            <span aria-hidden="true" />{status === "streaming" ? "正在回复，可切换对话" : "正在准备回复，可切换对话"}
          </span>}
        </div>
        {activity?.saveError && <p className="chat-column mb-2 text-xs text-cinnabar" role="alert">{activity.saveError}</p>}
        <form
          className="chat-column"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || genLoading) return;
            const el = inputRef.current;
            const text = el?.value?.trim() ?? "";
            if (!text && files.length === 0) return;
            const attachments = files;
            const list = new DataTransfer();
            for (const file of attachments) list.items.add(file);
            const pending = runtime.run(session, () => sendMessage({ text: text || undefined, files: list.files }));
            if (el) el.value = "";
            clearFiles();
            if (!(await pending) && el?.isConnected && !el.value) {
              el.value = text;
              setFiles(attachments);
            }
          }}
        >
          <div className="chat-composer">
            <textarea
              ref={inputRef}
              rows={1}
              disabled={busy || genLoading}
              placeholder="写下你的书法问题，或贴一张习字照片…"
              aria-label="书法问题"
              className="chat-reading min-h-14 w-full resize-none bg-transparent px-4 py-3 text-ink-800 placeholder:text-ink-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />

            {/* 底部工具栏 */}
            <div className="flex items-center justify-between px-3 pb-3">
              {/* 左侧：附件按钮 + 提示文字 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="workspace-icon-button disabled:opacity-60"
                  aria-label="上传图片"
                  title="上传图片"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
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
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={busy}
                  onChange={(event) => {
                    if (event.currentTarget.files) validateAndAddFiles(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
                <span className="hidden text-xs text-ink-500 sm:inline">支持拖拽或粘贴图片</span>
              </div>

              {/* 右侧：发送/停止按钮 - 印章风格 */}
              <div className="relative flex min-w-0 items-center gap-2">
                <ComposerModel accountId={accountId} defaultLabel={defaultModelLabel} disabled={busy || genLoading} onConfigure={() => setModelConfigOpen(true)} />
                {busy ? (
                  <button
                    type="button"
                    aria-label="停止生成"
                    title="停止生成"
                    onClick={() => void stop()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-200/60 text-ink-600 transition-all hover:bg-ink-300/60"
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
                    disabled={genLoading}
                    className="workspace-primary flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          
          {/* 图片预览缩略图 */}
          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              {fileError && (<p className="text-xs text-cinnabar" role="alert">{fileError}</p>)}
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-ink-200/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrls[i]} alt={f.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink-900/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="truncate px-1 pb-1 text-[10px] text-paper-50">{f.name}</span>
                    </div>
                    <button type="button" aria-label={"移除 " + f.name}
                      className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-700 text-paper-50 opacity-0 shadow transition-opacity group-hover:opacity-100"
                      onClick={() => removeFile(i)}>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="text-xs text-ink-400 hover:text-ink-600" onClick={clearFiles}>
                清除全部 ({files.length} 张)
              </button>
            </div>
          )}

        </form>
        <p className="mt-2 hidden text-center text-xs text-ink-500 sm:block">Enter 发送 · Shift + Enter 换行</p>
      </div>
      <ModelConfigDialog accountId={accountId} open={modelConfigOpen} onClose={() => setModelConfigOpen(false)} />
      <StudyWorkbench view={studyView} navigate={openStudy} close={() => setStudyView(null)} />
      <ImageWorkbench open={imageOpen} onClose={() => setImageOpen(false)} generating={genLoading}
        onGenerating={setGenLoading} draft={imageDraft} onDraft={setImageDraft} latest={latestImage ?? undefined}
        onGenerated={(image) => {
          setMessages((current) => [...current, {
            id: crypto.randomUUID(), role: "assistant", parts: [{ type: imagePartType, data: image }],
          }]);
          runtime.saveMessages(session);
        }} />
    </div>
  );
}
