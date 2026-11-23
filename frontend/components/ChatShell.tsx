"use client";

import type { UIMessage } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { CalligraphyChat } from "@/components/CalligraphyChat";
import { LogoutButton } from "@/components/LogoutButton";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import { WorkspaceSettingsDialog } from "@/components/WorkspaceSettings";
import type { ChatConversationSummary } from "@/lib/chat-store";

type Props = {
  summaries: ChatConversationSummary[];
  activeId: string;
  initialMessages: UIMessage[];
  email: string;
};

function conversationTitle(conversation: ChatConversationSummary | undefined) {
  return conversation?.title.trim() || "新对话";
}

export function ChatShell({ summaries, activeId, initialMessages, email }: Props) {
  const router = useRouter();
  const sidebarId = useId();
  const [busyNew, setBusyNew] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);

  const onPersisted = useCallback(() => router.refresh(), [router]);
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    mobileToggleRef.current?.focus();
  }, []);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenuId(null);
      if (accountMenuRef.current?.open && !accountMenuRef.current.contains(event.target as Node)) {
        accountMenuRef.current.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || settingsOpen) return;
      if (openMenuId) {
        menuRef.current?.querySelector("button")?.focus();
        setOpenMenuId(null);
      } else if (accountMenuRef.current?.open) {
        accountMenuRef.current.open = false;
        accountMenuRef.current.querySelector("summary")?.focus();
      } else if (mobileOpen) closeMobile();
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMobile, mobileOpen, openMenuId, settingsOpen]);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (mobileOpen) sidebarCloseRef.current?.focus();
  }, [mobileOpen]);

  function select(id: string) {
    setMobileOpen(false);
    if (id !== activeId) router.push(`/chat?c=${id}`);
  }

  async function newChat() {
    setBusyNew(true);
    setNotice("");
    try {
      const response = await fetch("/api/chat/conversations", { method: "POST" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) throw new Error();
      const { id } = (await response.json()) as { id: string };
      select(id);
      router.refresh();
    } catch {
      setNotice("新建对话失败，请稍后重试");
    } finally {
      setBusyNew(false);
    }
  }

  async function updateConversation(id: string, changes: { title?: string; pinned?: boolean }) {
    setNotice("");
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setNotice("更新对话失败，请稍后重试");
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm("确定删除这个对话吗？此操作不可撤销。")) return;
    setNotice("");
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      if (id === activeId) {
        const next = summaries.find((summary) => summary.id !== id);
        router.push(next ? `/chat?c=${next.id}` : "/chat");
      }
      router.refresh();
    } catch {
      setNotice("删除对话失败，请稍后重试");
    }
  }

  function finishRename(id: string) {
    const title = editingTitle.trim();
    setEditingId(null);
    if (title && title !== conversationTitle(summaries.find((summary) => summary.id === id))) {
      void updateConversation(id, { title });
    }
  }

  const query = searchQuery.trim().toLowerCase();
  const filtered = summaries.filter((summary) => conversationTitle(summary).toLowerCase().includes(query));
  const groups = [
    { title: "已置顶", items: filtered.filter((summary) => summary.pinned) },
    { title: "历史对话", items: filtered.filter((summary) => !summary.pinned) },
  ];
  const activeTitle = conversationTitle(summaries.find((summary) => summary.id === activeId));

  function renderItem(summary: ChatConversationSummary) {
    const { id, pinned } = summary;
    const title = conversationTitle(summary);
    const current = id === activeId;
    const menuOpen = id === openMenuId;
    return (
      <li key={id} data-current={current} className="sidebar-item">
        {id === editingId ? (
          <form className="p-1.5" onSubmit={(event) => { event.preventDefault(); finishRename(id); }}>
            <input
              ref={editInputRef}
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onBlur={() => finishRename(id)}
              onKeyDown={(event) => { if (event.key === "Escape") setEditingId(null); }}
              aria-label="重命名对话"
              className="w-full rounded border border-bamboo-300 bg-paper-50 px-2 py-1.5 text-[13px] text-ink-900"
            />
          </form>
        ) : (
          <>
            <button type="button" onClick={() => select(id)} aria-current={current ? "page" : undefined} className="flex min-h-9 w-full items-center gap-2 px-2.5 py-1.5 pr-9 text-left text-[13px]">
              <WorkspaceIcon name={pinned ? "pin" : "chat"} className="size-3.5 shrink-0" />
              <span className="truncate" title={title}>{title}</span>
            </button>
            <div ref={menuOpen ? menuRef : undefined}>
              <button type="button" aria-label={`对话操作：${title}`} aria-expanded={menuOpen} className="workspace-icon-button history-actions" onClick={() => setOpenMenuId(menuOpen ? null : id)}>
                <WorkspaceIcon name="more" />
              </button>
              {menuOpen && (
                <div className="sidebar-menu absolute right-1 top-full min-w-28">
                  <button type="button" onClick={() => { setEditingId(id); setEditingTitle(title); setOpenMenuId(null); }}>重命名</button>
                  <button type="button" onClick={() => { setOpenMenuId(null); void updateConversation(id, { pinned: !pinned }); }}>{pinned ? "取消置顶" : "置顶"}</button>
                  <button type="button" className="text-cinnabar" onClick={() => { setOpenMenuId(null); void deleteConversation(id); }}>删除</button>
                </div>
              )}
            </div>
          </>
        )}
      </li>
    );
  }

  return (
    <div className="chat-shell">
      {mobileOpen && <div className="chat-scrim" onClick={closeMobile} aria-hidden="true" />}
      <aside id={sidebarId} aria-label="对话侧栏" className="chat-sidebar" data-mobile-open={mobileOpen} data-desktop-collapsed={desktopCollapsed}>
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <Link href="/" className="sidebar-brand" aria-label="iTip 首页">
            <span className="brand-seal" aria-hidden="true">书</span>
            <span className="font-display text-xl leading-tight font-semibold">iTip</span>
          </Link>
          <button ref={sidebarCloseRef} type="button" className="workspace-icon-button sidebar-direction" aria-label="收起侧栏" onClick={() => { if (window.matchMedia("(min-width: 1024px)").matches) setDesktopCollapsed(true); else closeMobile(); }}>
            <WorkspaceIcon name="panel" />
          </button>
        </div>

        <div className="grid gap-2 px-3 pb-4">
          <button type="button" className="workspace-primary sidebar-new" disabled={busyNew} onClick={() => void newChat()}>
            <WorkspaceIcon name="plus" className="size-4" />{busyNew ? "正在新建…" : "新建对话"}
          </button>
          <div className="sidebar-search">
            <WorkspaceIcon name="search" className="size-3.5 shrink-0" />
            <input ref={searchInputRef} type="search" aria-label="搜索对话" placeholder="搜索对话…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-1 text-xs text-ink-900 placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden" />
            {searchQuery && <button type="button" aria-label="清除搜索" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}><WorkspaceIcon name="close" className="size-3.5" /></button>}
          </div>
        </div>

        <nav aria-label="对话历史" className="ink-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {filtered.length ? groups.filter((group) => group.items.length).map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2 className="mb-1.5 px-2 text-xs font-medium text-ink-500">{group.title}</h2>
              <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
            </section>
          )) : <p className="px-2 py-2 text-sm text-ink-500">{query ? "未找到匹配的对话" : "暂无历史对话"}</p>}
        </nav>

        <div className="sidebar-footer">
          <details ref={accountMenuRef} className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg p-1.5 hover:bg-ink-100 [&::-webkit-details-marker]:hidden" aria-label="账号菜单">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bamboo-50 text-xs font-semibold text-bamboo-700" aria-hidden="true">{email.slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-800" title={email}>{email}</span>
              <WorkspaceIcon name="more" className="size-4 text-ink-500" />
            </summary>
            <div className="sidebar-menu absolute inset-x-0 bottom-full mb-2">
              <button type="button" onClick={() => { setSettingsOpen(true); }}><WorkspaceIcon name="settings" className="size-4" />设置</button>
              <LogoutButton className="text-cinnabar" />
            </div>
          </details>
        </div>
      </aside>

      <main className="chat-main" aria-label="聊天">
        <header className="chat-header">
          <button ref={mobileToggleRef} type="button" className="workspace-icon-button sidebar-direction chat-mobile-toggle" aria-label="展开侧栏" aria-controls={sidebarId} aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><WorkspaceIcon name="panel" /></button>
          {desktopCollapsed && <button type="button" className="workspace-icon-button sidebar-direction chat-desktop-toggle" aria-label="展开侧栏" aria-controls={sidebarId} aria-expanded={false} onClick={() => setDesktopCollapsed(false)}><WorkspaceIcon name="panel" /></button>}
          <span className="shrink-0 font-display text-lg font-semibold">书法对话</span>
          <span className="min-w-0 truncate border-l border-ink-200 pl-3 text-xs text-ink-500" title={activeTitle}>
            {activeTitle}
          </span>
          <button type="button" className="workspace-icon-button ml-auto" aria-label="设置" onClick={() => setSettingsOpen(true)}><WorkspaceIcon name="settings" /></button>
        </header>
        {notice && <p role="alert" className="border-b border-cinnabar/20 bg-cinnabar/5 px-4 py-2 text-sm text-cinnabar">{notice}</p>}
        <CalligraphyChat key={activeId} conversationId={activeId} initialMessages={initialMessages} onPersisted={onPersisted} />
      </main>

      <WorkspaceSettingsDialog email={email} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
