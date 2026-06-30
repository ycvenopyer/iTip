"use client";

import type { UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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
  const [collapsed, setCollapsed] = useState(true); // 默认折叠，移动端优先
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchId = useId();

  // 桌面端自动展开侧边栏
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setDesktopOpen(true);
        setCollapsed(false);
      } else {
        setDesktopOpen(false);
        setCollapsed(true);
      }
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const onPersisted = useCallback(() => {
    router.refresh();
  }, [router]);

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

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // 移动端选择对话后自动收起侧边栏
  const select = (id: string) => {
    if (id === activeId) return;
    router.push(`/chat?c=${id}`);
    if (!desktopOpen) setCollapsed(true);
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
      if (!desktopOpen) setCollapsed(true);
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
        {isEditing ? (
          <form
            className="flex items-center gap-1 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitRename(s.id);
            }}
          >
            <input
              ref={editInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => handleSubmitRename(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditingId(null);
                  e.stopPropagation();
                }
              }}
              className="flex-1 rounded-lg border border-bamboo-200/40 bg-paper-50 px-2 py-1 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-bamboo-400/40"
              aria-label="重命名对话"
            />
          </form>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            onClick={() => select(s.id)}
            aria-current={active ? "page" : undefined}
          >
            <span className="flex-1 truncate text-sm text-ink-700 group-hover:text-ink-900">
              {s.pinned ? (
                <span className="mr-1 inline-flex align-middle" aria-label="已置顶">
                  <svg className="h-3 w-3 text-bamboo-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16 9V4h1V2H7v2h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
                  </svg>
                </span>
              ) : null}
              {label}
            </span>
          </button>
        )}

        {!isEditing && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2" ref={isMenuOpen ? menuRef : undefined}>
            <button
              type="button"
              aria-label="对话操作菜单"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                isMenuOpen
                  ? "bg-ink-200/50 text-ink-700"
                  : "text-ink-400 opacity-0 group-hover:opacity-100 hover:bg-ink-200/40 hover:text-ink-600"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(isMenuOpen ? null : s.id);
              }}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-ink-200/30 bg-paper-50 py-1 shadow-lg ink-fade-in"
                role="menu"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink-600 transition-colors hover:bg-ink-100/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(s);
                  }}
                  role="menuitem"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  重命名
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink-600 transition-colors hover:bg-ink-100/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    pin(s.id, !s.pinned);
                    setOpenMenuId(null);
                  }}
                  role="menuitem"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 9V4h1V2H7v2h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
                  </svg>
                  {s.pinned ? "取消置顶" : "置顶"}
                </button>
                <hr className="my-1 border-ink-200/20" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-cinnabar transition-colors hover:bg-cinnabar/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    del(s.id);
                    setOpenMenuId(null);
                  }}
                  role="menuitem"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* 移动端遮罩层 */}
      {!collapsed && !desktopOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`flex-shrink-0 flex flex-col border-r border-ink-200/25 bg-paper-50/95 backdrop-blur transition-all
          ${collapsed && !desktopOpen ? "w-0 overflow-hidden border-r-0" : ""}
          ${desktopOpen ? "w-72" : "fixed left-0 top-0 z-30 h-full w-72 shadow-2xl lg:relative lg:shadow-none"}
        `}
        aria-label="对话历史"
        role="navigation"
      >
        <div className="flex items-center justify-between border-b border-ink-200/20 px-3 py-3">
          <button
            type="button"
            disabled={busyNew}
            onClick={newChat}
            aria-label="新建对话"
            className="flex items-center gap-1.5 rounded-xl bg-ink-800 px-4 py-1.5 text-xs tracking-widest text-paper-50 transition-all hover:bg-ink-700 hover:shadow-md disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            新对话
          </button>
          <button
            type="button"
            aria-label="收起侧边栏"
            title="收起侧边栏"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-all hover:bg-ink-100 hover:text-ink-600"
            onClick={() => setCollapsed(true)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5 5-5M19 17l-5-5 5-5" />
            </svg>
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="border-b border-ink-200/15 px-3 py-2">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all ${
              isSearchFocused
                ? "border-bamboo-300/50 bg-paper-50 shadow-sm"
                : "border-ink-200/20 bg-ink-50/50 hover:border-ink-200/50"
            }`}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="搜索对话…"
              className="flex-1 bg-transparent text-xs text-ink-700 placeholder:text-ink-400/60 focus:outline-none"
              aria-label="搜索对话"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="清除搜索"
                className="flex-shrink-0 rounded p-0.5 text-ink-400 hover:text-ink-600"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 历史列表 */}
        <div className="ink-scroll flex-1 space-y-1 overflow-y-auto p-3">
          {searchQuery && filteredSummaries.length === 0 ? (
            <div className="px-3 py-8 text-center ink-fade-in">
              <svg className="mx-auto h-12 w-12 text-ink-200/60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-ink-500/80">未找到匹配的对话</p>
              <p className="mt-1 text-xs text-ink-400">尝试其他关键词</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="px-3 py-8 text-center ink-fade-in">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ink-50/80 border border-ink-200/30" aria-hidden="true">
                <svg className="h-8 w-8 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.962 2.25 5.356 2.25 6.957V9m16.5 0a48.416 48.416 0 00-3.143-.048M15 9.75v6m0 0l-3-1.5m3 1.5l3-1.5" />
                </svg>
              </div>
              <p className="text-sm text-ink-500/80">暂无历史对话</p>
              <p className="mt-1 text-xs text-ink-400">点击上方「新对话」开始</p>
            </div>
          ) : (
            <>
              {pinnedItems.length > 0 && (
                <div className="mb-3">
                  {!searchQuery && (
                    <div className="mb-2 flex items-center gap-2 px-2">
                      <span className="h-px w-3 bg-bamboo-500/40" aria-hidden="true" />
                      <span className="text-xs font-medium text-bamboo-600/80 tracking-wide">置顶</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-bamboo-500/20 to-transparent" aria-hidden="true" />
                    </div>
                  )}
                  <div className="space-y-1">{pinnedItems.map(renderItem)}</div>
                </div>
              )}
              {unpinnedItems.length > 0 && (
                <div>
                  {!searchQuery && pinnedItems.length > 0 && (
                    <div className="mb-2 flex items-center gap-2 px-2">
                      <span className="h-px w-3 bg-ink-300/40" aria-hidden="true" />
                      <span className="text-xs font-medium text-ink-400/80 tracking-wide">历史</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-ink-300/20 to-transparent" aria-hidden="true" />
                    </div>
                  )}
                  <div className="space-y-1">{unpinnedItems.map(renderItem)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* 展开侧边栏按钮 - 移动端 & 桌面折叠时 */}
      {collapsed && (
        <button
          type="button"
          aria-label="展开侧边栏"
          title="展开侧边栏"
          onClick={() => setCollapsed(false)}
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink-300/40 bg-paper-50/95 text-ink-600 shadow-md backdrop-blur transition-all hover:border-bamboo-500/40 hover:text-bamboo-600 hover:shadow-lg lg:left-4"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {/* 主聊天区域 */}
      <div className="flex min-w-0 flex-1 flex-col bg-paper-50" role="main" aria-label="聊天">
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
