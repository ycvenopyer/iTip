"use client";

import type { UIMessage } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { CalligraphyChat } from "@/components/CalligraphyChat";
import { ChatSidebarDialog, conversationTitle, type SidebarDialog } from "@/components/ChatSidebarDialog";
import { useConversationActivities, useConversationRuntime } from "@/components/ConversationRuntime";
import { LogoutButton } from "@/components/LogoutButton";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import { WorkspaceHelpDialog, WorkspaceSettingsDialog } from "@/components/WorkspaceSettings";
import type { Account } from "@/lib/auth/session";
import type { ChatConversationSummary, ChatProject } from "@/lib/chat-store";

type Props = {
  summaries: ChatConversationSummary[];
  projects: ChatProject[];
  defaultModel: string;
  activeId: string;
  initialMessages: UIMessage[];
  account: Account;
};

export function ChatShell({ summaries, projects, defaultModel, activeId, initialMessages, account }: Props) {
  const router = useRouter();
  const runtime = useConversationRuntime();
  const activities = useConversationActivities();
  const sidebarId = useId();
  const [busyNew, setBusyNew] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<CSSProperties>({});
  const [sidebarDialog, setSidebarDialog] = useState<SidebarDialog | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const accountLabel = account.username || account.email || "我的账号";

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
      if (event.key !== "Escape" || settingsOpen || helpOpen || sidebarDialog || document.querySelector("dialog[open]")) return;
      if (openMenuId) {
        menuRef.current?.querySelector("button")?.focus();
        setOpenMenuId(null);
      } else if (accountMenuRef.current?.open) {
        accountMenuRef.current.open = false;
        accountMenuRef.current.querySelector("summary")?.focus();
      } else if (mobileOpen) closeMobile();
    }

    function closeOnResize() {
      setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [closeMobile, helpOpen, mobileOpen, openMenuId, settingsOpen, sidebarDialog]);

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
    const project = summaries.find((summary) => summary.id === id)?.projectId;
    if (project) setExpandedProjects((current) => ({ ...current, [project]: true }));
    setMobileOpen(false);
    if (id !== activeId) router.push(`/chat?c=${id}`);
  }

  async function request<T>(path: string, method: string, data?: object): Promise<T> {
    const response = await fetch(`/api/chat/${path}`, {
      method,
      ...(data && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    });
    const payload = await response.json().catch(() => null) as (T & { error?: string }) | null;
    if (response.status === 401) router.push("/login");
    if (!response.ok || !payload) throw new Error(payload?.error || "操作失败，请稍后重试");
    return payload;
  }

  async function newChat(projectId?: string) {
    if (busyNew) return;
    setBusyNew(true);
    setNotice("");
    try {
      const { id } = await request<{ id: string }>("conversations", "POST", projectId ? { projectId } : undefined);
      if (projectId) setExpandedProjects((current) => ({ ...current, [projectId]: true }));
      select(id);
      router.refresh();
    } catch {
      setNotice("新建对话失败，请稍后重试");
    } finally {
      setBusyNew(false);
    }
  }

  async function patchConversation(id: string, changes: { title?: string; pinned?: boolean; projectId?: string | null }) {
    await request(`conversations/${encodeURIComponent(id)}`, "PATCH", changes);
    router.refresh();
  }

  async function updateConversation(id: string, changes: { title?: string; pinned?: boolean }) {
    setNotice("");
    try {
      await patchConversation(id, changes);
    } catch {
      setNotice("更新对话失败，请稍后重试");
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm("确定删除这个对话吗？此操作不可撤销。")) return;
    setNotice("");
    try {
      await request(`conversations/${encodeURIComponent(id)}`, "DELETE");
      runtime.discard(id);
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

  const active = summaries.find((summary) => summary.id === activeId);
  const projectList = new Set(projects.map((project) => project.id));
  const unfiled = summaries.filter((summary) => !summary.projectId || !projectList.has(summary.projectId));
  const groups = [
    { title: "已置顶", items: unfiled.filter((summary) => summary.pinned) },
    { title: "历史对话", items: unfiled.filter((summary) => !summary.pinned) },
  ];
  const activeTitle = conversationTitle(active);

  function toggleMenu(id: string, button: HTMLButtonElement) {
    const bounds = button.getBoundingClientRect();
    const right = window.innerWidth - bounds.right;
    setMenuPosition(bounds.bottom + 150 > window.innerHeight
      ? { right, bottom: window.innerHeight - bounds.top + 3 }
      : { right, top: bounds.bottom + 3 });
    setOpenMenuId(openMenuId === id ? null : id);
  }

  function renderItem(summary: ChatConversationSummary) {
    const { id, pinned } = summary;
    const title = conversationTitle(summary);
    const current = id === activeId;
    const menuOpen = id === openMenuId;
    const activity = activities.get(id);
    const status = activity?.generating ? "正在回复" : activity?.error ? "回复失败" : activity?.saveError ? "对话未保存" : "";
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
            <button type="button" onClick={() => select(id)} aria-label={title} aria-describedby={status ? `activity-${id}` : undefined}
              aria-current={current ? "page" : undefined} className="flex min-h-9 w-full items-center gap-2 px-2.5 py-1.5 pr-9 text-left text-[13px]">
              <WorkspaceIcon name={pinned ? "pin" : "chat"} className="size-3.5 shrink-0" />
              <span className="truncate" title={title}>{title}</span>
              {status && <span className="conversation-indicator ml-auto" data-running={!!activity?.generating} title={status}>
                <span id={`activity-${id}`} className="sr-only">{status}</span>
              </span>}
            </button>
            <div ref={menuOpen ? menuRef : undefined}>
              <button type="button" aria-label={`对话操作：${title}`} aria-expanded={menuOpen} className="workspace-icon-button history-actions" onClick={(event) => toggleMenu(id, event.currentTarget)}>
                <WorkspaceIcon name="more" />
              </button>
              {menuOpen && (
                <div className="sidebar-menu sidebar-flyout" style={menuPosition}>
                  <button type="button" onClick={() => { setEditingId(id); setEditingTitle(title); setOpenMenuId(null); }}>重命名</button>
                  <button type="button" onClick={() => { setOpenMenuId(null); void updateConversation(id, { pinned: !pinned }); }}>{pinned ? "取消置顶" : "置顶"}</button>
                  <button type="button" onClick={() => { setOpenMenuId(null); setSidebarDialog({ kind: "move", conversation: summary }); }}>移动到项目</button>
                  <button type="button" className="text-cinnabar" onClick={() => { setOpenMenuId(null); void deleteConversation(id); }}>删除</button>
                </div>
              )}
            </div>
          </>
        )}
      </li>
    );
  }

  function renderProject(project: ChatProject) {
    const menuId = `project-${project.id}`;
    const menuOpen = openMenuId === menuId;
    const expanded = expandedProjects[project.id] ?? (active?.projectId === project.id);
    const items = summaries.filter((summary) => summary.projectId === project.id);
    return (
      <li key={project.id}>
        <div className="sidebar-item sidebar-project" data-project-active={active?.projectId === project.id}>
          <button type="button" aria-expanded={expanded} className="sidebar-project-name" title={project.name} onClick={() => setExpandedProjects((current) => ({ ...current, [project.id]: !expanded }))}>
            <WorkspaceIcon name="chevron" className="project-chevron size-3 shrink-0" />
            <WorkspaceIcon name="folder" className="size-4 shrink-0" />
            <span className="truncate">{project.name}</span>
          </button>
          <div ref={menuOpen ? menuRef : undefined}>
            <button type="button" aria-label={`项目操作：${project.name}`} aria-expanded={menuOpen} className="workspace-icon-button history-actions" onClick={(event) => toggleMenu(menuId, event.currentTarget)}>
              <WorkspaceIcon name="more" />
            </button>
            {menuOpen && (
              <div className="sidebar-menu sidebar-flyout" style={menuPosition}>
                <button type="button" disabled={busyNew} onClick={() => { setOpenMenuId(null); void newChat(project.id); }}>在项目中新建对话</button>
                <button type="button" className="text-cinnabar" onClick={() => { setOpenMenuId(null); setSidebarDialog({ kind: "delete", project }); }}>删除项目</button>
              </div>
            )}
          </div>
        </div>
        {expanded && (
          <ul className="sidebar-project-chats">
            {items.map(renderItem)}
            {items.length === 0 && <li><button type="button" className="sidebar-project-empty" disabled={busyNew} onClick={() => void newChat(project.id)}>
              <WorkspaceIcon name="plus" className="size-3.5 shrink-0" />在项目中新建对话
            </button></li>}
          </ul>
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
          <div className="flex items-center gap-0.5">
            <button type="button" className="workspace-icon-button" aria-label="搜索对话" title="搜索对话" aria-haspopup="dialog" onClick={() => setSidebarDialog({ kind: "search" })}><WorkspaceIcon name="search" /></button>
            <button ref={sidebarCloseRef} type="button" className="workspace-icon-button sidebar-direction" aria-label="收起侧栏" onClick={() => { if (window.matchMedia("(min-width: 1024px)").matches) setDesktopCollapsed(true); else closeMobile(); }}>
              <WorkspaceIcon name="panel" />
            </button>
          </div>
        </div>

        <div className="grid gap-2 px-3 pb-4">
          <button type="button" className="workspace-primary sidebar-new" disabled={busyNew} onClick={() => void newChat()}>
            <WorkspaceIcon name="plus" className="size-4" />{busyNew ? "正在新建…" : "新建对话"}
          </button>
          <button type="button" className="sidebar-new sidebar-new-project" aria-haspopup="dialog" onClick={() => setSidebarDialog({ kind: "create" })}>
            <WorkspaceIcon name="folderPlus" className="size-4" />新建项目
          </button>
        </div>

        <nav aria-label="对话历史" className="ink-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4" onScroll={() => setOpenMenuId(null)}>
          {projects.length > 0 && <section aria-label="项目">
            <h2 className="mb-1.5 px-2 text-xs font-medium text-ink-500">项目</h2>
            <ul className="space-y-1">{projects.map(renderProject)}</ul>
          </section>}
          {groups.filter((group) => group.items.length).map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2 className="mb-1.5 px-2 text-xs font-medium text-ink-500">{group.title}</h2>
              <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <details ref={accountMenuRef} className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg p-1.5 hover:bg-ink-100 [&::-webkit-details-marker]:hidden" aria-label="账号菜单">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bamboo-50 text-xs font-semibold text-bamboo-700" aria-hidden="true">{accountLabel.slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-800" title={accountLabel}>{accountLabel}</span>
              <WorkspaceIcon name="more" className="size-4 text-ink-500" />
            </summary>
            <div className="sidebar-menu absolute inset-x-0 bottom-full mb-2">
              <button type="button" onClick={() => setSettingsOpen(true)}><WorkspaceIcon name="settings" className="size-4" />设置</button>
              <button type="button" onClick={() => setHelpOpen(true)}><WorkspaceIcon name="help" className="size-4" />帮助</button>
              <LogoutButton accountId={account.id} className="text-cinnabar" />
            </div>
          </details>
        </div>
      </aside>

      <main className="chat-main" aria-label="聊天">
        <header className="chat-header">
          <button ref={mobileToggleRef} type="button" className="workspace-icon-button sidebar-direction chat-mobile-toggle" aria-label="展开侧栏" aria-controls={sidebarId} aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><WorkspaceIcon name="panel" /></button>
          {desktopCollapsed && <button type="button" className="workspace-icon-button sidebar-direction chat-desktop-toggle" aria-label="展开侧栏" aria-controls={sidebarId} aria-expanded={false} onClick={() => setDesktopCollapsed(false)}><WorkspaceIcon name="panel" /></button>}
          <span className="shrink-0 font-display text-lg font-semibold">书法对话</span>
          <span className="chat-header-title min-w-0 truncate border-l border-ink-200 pl-3 text-xs text-ink-500" title={activeTitle}>
            {activeTitle}
          </span>
          <button type="button" className="workspace-icon-button ml-auto" title="帮助" aria-label="帮助" onClick={() => setHelpOpen(true)}><WorkspaceIcon name="help" /></button>
        </header>
        {notice && <p role="alert" className="border-b border-cinnabar/20 bg-cinnabar/5 px-4 py-2 text-sm text-cinnabar">{notice}</p>}
        <CalligraphyChat key={activeId} accountId={account.id} conversationId={activeId} initialMessages={initialMessages} defaultModelLabel={defaultModel} />
      </main>

      <WorkspaceSettingsDialog account={account} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <WorkspaceHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ChatSidebarDialog view={sidebarDialog} projects={projects} summaries={summaries}
        onClose={() => setSidebarDialog((current) => current === sidebarDialog ? null : current)}
        onSelect={select}
        onCreate={async (name) => {
          const project = await request<ChatProject>("projects", "POST", { name });
          setExpandedProjects((current) => ({ ...current, [project.id]: true }));
          router.refresh();
        }}
        onMove={async (id, projectId) => {
          await patchConversation(id, { projectId });
          if (projectId) setExpandedProjects((current) => ({ ...current, [projectId]: true }));
        }}
        onDelete={async (project) => {
          await request(`projects/${encodeURIComponent(project.id)}`, "DELETE");
          router.refresh();
        }}
      />
    </div>
  );
}
