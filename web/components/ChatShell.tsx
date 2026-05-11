"use client";

import type { UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CalligraphyChat } from "@/components/CalligraphyChat";
import type { ChatConversationSummary } from "@/lib/chat-store";

type Props = {
  summaries: ChatConversationSummary[];
  activeId: string;
  initialMessages: UIMessage[];
};

export function ChatShell({ summaries, activeId, initialMessages }: Props) {
  const router = useRouter();
  const [busyNew, setBusyNew] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const onPersisted = useCallback(() => {
    router.refresh();
  }, [router]);

  // 点击外部关闭菜单
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [openMenuId]);

  // 聚焦编辑输入框
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const select = (id: string) => {
    if (id === activeId) return;
    router.push(`/chat?c=${id}`);
  };

  const newChat = async () => {
    setBusyNew(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const { id } = (await res.json()) as { id: string };
      router.push(`/chat?c=${id}`);
      router.refresh();
    } finally {
      setBusyNew(false);
    }
  };

  const rename = async (id: string, title: string) => {
    const res = await fetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    if (res.ok) router.refresh();
  };

  const pin = async (id: string, pinned: boolean) => {
    const res = await fetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pinned }),
    });
    if (res.ok) router.refresh();
  };

  const del = async (id: string) => {
    if (!confirm("确定要删除这个对话吗？此操作不可撤销。")) return;
    const res = await fetch(`/api/chat/conversations/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      if (id === activeId) {
        // 删除当前对话，跳转到其他对话或新建
        const remaining = summaries.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          router.push(`/chat?c=${remaining[0].id}`);
        } else {
          router.push("/chat");
        }
      }
      router.refresh();
    }
  };

  const handleStartEdit = (s: ChatConversationSummary) => {
    setEditingId(s.id);
    setEditingTitle(s.title.trim() || "新对话");
    setOpenMenuId(null);
  };

  const handleSubmitRename = async (id: string) => {
    const title = editingTitle.trim();
    if (title) await rename(id, title);
    setEditingId(null);
  };

  // 根据搜索查询过滤对话
  const filteredSummaries = searchQuery.trim()
    ? summaries.filter((s) =>
        (s.title || "新对话").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : summaries;

  const pinnedItems = filteredSummaries.filter((s) => s.pinned);
  const unpinnedItems = filteredSummaries.filter((s) => !s.pinned);

  const renderItem = (s: ChatConversationSummary) => {
    const label = s.title.trim() || "新对话";
    const active = s.id === activeId;
    const isEditing = editingId === s.id;
    const isMenuOpen = openMenuId === s.id;

    return (
      <div
        key={s.id}
        className={`group relative rounded-xl transition-all ${
          active
            ? "bg-bamboo-50/70 border border-bamboo-200/30 shadow-sm"
            : "hover:bg-ink-100/40 border border-transparent"
        }`}
      >
        {/* 编辑模式 */}
        {isEditing ? (
          <div className="flex items-center gap-1 px-3 py-2.5">
            <input
              ref={editInputRef}
              type="text"
              aria-label="对话标题"
              placeholder="输入对话标题"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmitRename(s.id);
                } else if (e.key === "Escape") {
                  setEditingId(null);
                }
              }}
              onBlur={() => void handleSubmitRename(s.id)}
              className="w-full rounded-lg border border-bamboo-400/50 bg-paper-50 px-2.5 py-1 text-sm text-ink-900 outline-none shadow-inner"
            />
          </div>
        ) : (
          /* 普通模式 */
          <>
            <button
              type="button"
              title={label}
              onClick={() => select(s.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm ${
                active
                  ? "font-medium text-ink-900"
                  : "text-ink-600 hover:text-ink-800"
              }`}
            >
              {/* 卷轴图标 */}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                active ? "bg-bamboo-100/60" : "bg-ink-100/50"
              }`}>
                <svg
                  className={`h-3.5 w-3.5 ${active ? "text-bamboo-600" : "text-ink-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <span className="flex-1 truncate">{label}</span>
              {/* 置顶标记 */}
              {s.pinned === 1 && (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-bamboo-500/80"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                </svg>
              )}
            </button>

            {/* 操作菜单按钮 */}
            <button
              type="button"
              aria-label="操作"
              title="操作"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(isMenuOpen ? null : s.id);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 opacity-0 transition-all hover:bg-ink-200/40 group-hover:opacity-100 ${
                isMenuOpen ? "opacity-100 bg-ink-200/40" : ""
              }`}
            >
              <svg
                className="h-4 w-4 text-ink-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </button>

            {/* 下拉菜单 */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-ink-200/30 bg-paper-50/95 py-1.5 shadow-lg backdrop-blur-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100/60 transition-colors"
                  onClick={() => handleStartEdit(s)}
                >
                  <svg className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  重命名
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100/60 transition-colors"
                  onClick={() => {
                    void pin(s.id, s.pinned !== 1);
                    setOpenMenuId(null);
                  }}
                >
                  <svg className="h-4 w-4 text-ink-500" fill={s.pinned === 1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z" />
                  </svg>
                  {s.pinned === 1 ? "取消置顶" : "置顶"}
                </button>
                <div className="my-1 border-t border-ink-200/20" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-cinnabar/90 hover:bg-cinnabar/5 transition-colors"
                  onClick={() => {
                    void del(s.id);
                    setOpenMenuId(null);
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  删除
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 top-14 flex overflow-hidden">
      {/* 左侧边栏 - 书法卷轴风格 */}
      <aside
        className={`flex shrink-0 flex-col border-r border-ink-200/20 bg-gradient-to-r from-paper-50 to-paper-100/80 transition-[width,opacity] duration-150 ease-out will-change-[width,opacity] relative ${
          collapsed ? "w-0 opacity-0" : "w-72 opacity-100"
        }`}
      >
        {/* 卷轴装饰 */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ink-200/30 to-transparent" />
        <div className="absolute top-8 left-2 w-1 h-16 rounded-full bg-gradient-to-b from-bamboo-500/20 to-transparent" />

        {/* 头部：搜索框 */}
        <div className="border-b border-ink-200/20 p-3">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-paper-50 px-3 py-2 transition-all shadow-sm ${
              isSearchFocused
                ? "border-bamboo-500/40 ring-1 ring-bamboo-500/20 shadow-inner"
                : "border-ink-200/40"
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0 text-ink-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索对话…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-400/70 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="清除搜索"
                title="清除搜索"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full text-ink-400 hover:bg-ink-200/50 hover:text-ink-600 active:scale-90 transition-transform"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 新建对话按钮 - 印章风格 */}
        <div className="flex items-center gap-2 border-b border-ink-200/20 px-3 py-3">
          <button
            type="button"
            disabled={busyNew}
            onClick={() => void newChat()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cinnabar/90 px-4 py-2.5 text-sm text-paper-50 shadow-sm transition-all hover:bg-cinnabar hover:shadow-md disabled:opacity-50 font-medium tracking-wide"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {busyNew ? "创建中…" : "新对话"}
          </button>
          <button
            type="button"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink-200/40 text-ink-500 transition-all hover:bg-ink-100 hover:text-ink-700 hover:border-ink-300/60"
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
                d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 17l-5-5 5-5M19 17l-5-5 5-5"}
              />
            </svg>
          </button>
        </div>

        {/* 历史列表 */}
        <div className="ink-scroll flex-1 space-y-1 overflow-y-auto p-3">
          {searchQuery && filteredSummaries.length === 0 ? (
            <div className="px-3 py-8 text-center ink-fade-in">
              <svg className="mx-auto h-12 w-12 text-ink-200/60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-ink-500/80">未找到匹配的对话</p>
              <p className="mt-1 text-xs text-ink-400">尝试其他关键词</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="px-3 py-8 text-center ink-fade-in">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ink-50/80 border border-ink-200/30">
                <svg className="h-8 w-8 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.962 2.25 5.356 2.25 6.957V9m16.5 0a48.416 48.416 0 00-3.143-.048M15 9.75v6m0 0l-3-1.5m3 1.5l3-1.5" />
                </svg>
              </div>
              <p className="text-sm text-ink-500/80">暂无历史对话</p>
              <p className="mt-1 text-xs text-ink-400">点击上方「新对话」开始</p>
            </div>
          ) : (
            <>
              {/* 置顶区 */}
              {pinnedItems.length > 0 && (
                <div className="mb-3">
                  {!searchQuery && (
                    <div className="mb-2 flex items-center gap-2 px-2">
                      <span className="h-px w-3 bg-bamboo-500/40" />
                      <span className="text-xs font-medium text-bamboo-600/80 tracking-wide">
                        置顶
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-bamboo-500/20 to-transparent" />
                    </div>
                  )}
                  <div className="space-y-1">{pinnedItems.map(renderItem)}</div>
                </div>
              )}

              {/* 普通区 */}
              {unpinnedItems.length > 0 && (
                <div>
                  {!searchQuery && pinnedItems.length > 0 && (
                    <div className="mb-2 flex items-center gap-2 px-2">
                      <span className="h-px w-3 bg-ink-300/40" />
                      <span className="text-xs font-medium text-ink-400/80 tracking-wide">
                        历史
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-ink-300/20 to-transparent" />
                    </div>
                  )}
                  <div className="space-y-1">{unpinnedItems.map(renderItem)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* 折叠状态下的展开按钮 - 印章风格 */}
      {collapsed && (
        <button
          type="button"
          aria-label="展开侧边栏"
          title="展开侧边栏"
          onClick={() => setCollapsed(false)}
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink-300/40 bg-paper-50/95 text-ink-600 shadow-md backdrop-blur transition-all hover:border-bamboo-500/40 hover:text-bamboo-600 hover:shadow-lg"
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
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      )}

      {/* 主聊天区域 */}
      <div className="flex min-w-0 flex-1 flex-col bg-paper-50">
        <CalligraphyChat
          key={activeId}
          conversationId={activeId}
          initialMessages={initialMessages}
          onPersisted={onPersisted}
        />
      </div>
    </div>
  );
}
