"use client";

import { useId, useState, type ReactNode } from "react";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import type { ChatConversationSummary, ChatProject } from "@/lib/chat-store";

export type SidebarDialog =
  | { kind: "search" }
  | { kind: "create" }
  | { kind: "move"; conversation: ChatConversationSummary }
  | { kind: "delete"; project: ChatProject };

const titles = { search: "搜索对话", create: "新建项目", move: "移动对话", delete: "删除项目" };

export function conversationTitle(summary: ChatConversationSummary | undefined) {
  return summary?.title.trim() || "新对话";
}

export function ChatSidebarDialog({ view, summaries, projects, onClose, onSelect, onCreate, onMove, onDelete }: {
  view: SidebarDialog | null;
  summaries: ChatConversationSummary[];
  projects: ChatProject[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  onMove: (id: string, projectId: string | null) => Promise<void>;
  onDelete: (project: ChatProject) => Promise<void>;
}) {
  const titleId = useId();
  const title = view ? titles[view.kind] : "";
  return (
    <WorkspaceDialog titleId={titleId} open={!!view} onClose={onClose} className="sidebar-dialog">
      {view && (
        <div className="settings-frame">
          <header className="settings-head">
            <h2 id={titleId} className="font-display text-xl font-semibold">{title}</h2>
            <button type="button" aria-label={`关闭${title}`} className="workspace-icon-button" onClick={onClose}><WorkspaceIcon name="close" /></button>
          </header>
          <div className="settings-content ink-scroll">
            {view.kind === "search" && <ConversationSearch summaries={summaries} projects={projects} onSelect={(id) => { onClose(); onSelect(id); }} />}
            {view.kind === "create" && (
              <ProjectAction label="创建项目" onClose={onClose} onSubmit={(data) => onCreate(String(data.get("name") ?? "").trim())}>
                <label className="settings-field">项目名称
                  <input name="name" placeholder="例如：楷书临习" data-dialog-focus required maxLength={60} />
                </label>
              </ProjectAction>
            )}
            {view.kind === "move" && (
              <ProjectAction label="确认移动" onClose={onClose} onSubmit={(data) => onMove(view.conversation.id, String(data.get("projectId") || "") || null)}>
                <p className="break-words text-sm text-ink-500">{conversationTitle(view.conversation)}</p>
                <label className="settings-field">移动到
                  <select name="projectId" defaultValue={view.conversation.projectId ?? ""} data-dialog-focus>
                    <option value="">历史对话</option>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </label>
              </ProjectAction>
            )}
            {view.kind === "delete" && (
              <ProjectAction label="删除项目" danger onClose={onClose} onSubmit={() => onDelete(view.project)}>
                <p className="break-words text-sm leading-6 text-ink-600">删除「{view.project.name}」后，其中的对话会移回历史列表，已置顶的对话会出现在置顶分组。</p>
              </ProjectAction>
            )}
          </div>
        </div>
      )}
    </WorkspaceDialog>
  );
}

function ConversationSearch({ summaries, projects, onSelect }: {
  summaries: ChatConversationSummary[];
  projects: ChatProject[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const results = keyword ? summaries.filter((summary) => conversationTitle(summary).toLowerCase().includes(keyword)) : summaries;
  return (
    <div className="grid gap-3">
      <form className="sidebar-search" onSubmit={(event) => {
        event.preventDefault();
        if (results[0]) onSelect(results[0].id);
      }}>
        <WorkspaceIcon name="search" className="size-4 shrink-0" />
        <input type="search" data-dialog-focus aria-label="按标题搜索对话" placeholder="输入对话标题…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink-900 placeholder:text-ink-500" />
      </form>
      {results.length ? (
        <ul className="search-results ink-scroll" aria-label="搜索结果">
          {results.map((summary) => (
            <li key={summary.id}>
              <button type="button" onClick={() => onSelect(summary.id)}>
                <WorkspaceIcon name={summary.pinned ? "pin" : "chat"} className="size-4 shrink-0 text-ink-500" />
                <span className="min-w-0 flex-1 truncate text-left">{conversationTitle(summary)}</span>
                {summary.projectId && <span className="max-w-1/3 truncate text-xs text-ink-500">{projectNames.get(summary.projectId)}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : <p role="status" className="px-2 py-3 text-sm text-ink-500">{keyword ? "未找到匹配的对话" : "暂无对话"}</p>}
    </div>
  );
}

function ProjectAction({ children, label, danger = false, onSubmit, onClose }: {
  children: ReactNode;
  label: string;
  danger?: boolean;
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form className="grid gap-4" onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const data = new FormData(event.currentTarget);
      setBusy(true);
      setError("");
      try {
        await onSubmit(data);
        onClose();
      } catch (error) {
        setError(error instanceof Error ? error.message : "操作失败，请重试");
      } finally {
        setBusy(false);
      }
    }}>
      <fieldset disabled={busy} className="grid gap-4">{children}</fieldset>
      {error && <p role="alert" className="text-xs text-cinnabar">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="settings-action settings-secondary" onClick={onClose}>取消</button>
        <button type="submit" className={`settings-action ${danger ? "workspace-danger" : "workspace-primary"}`} disabled={busy}>{busy ? "处理中…" : label}</button>
      </div>
    </form>
  );
}
