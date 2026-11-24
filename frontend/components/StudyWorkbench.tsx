"use client";

import { useId, useRef } from "react";
import { StudyCanvas } from "@/components/StudyCanvas";
import { StudyCatalog } from "@/components/StudyCatalog";
import { StudyCalendar, StudyTextTool } from "@/components/StudyPractice";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import type { StudyNavigation } from "@/lib/study";

export const studySections = [
  {
    label: "字典与工具", icon: "book",
    tools: [
      { tab: "calligraphy", label: "书法字典" }, { tab: "character", label: "汉语字典" },
      { tab: "word", label: "汉语词典" }, { tab: "seal", label: "篆刻印典" }, { tab: "idiom", label: "成语词典" },
    ],
  },
  {
    label: "练习与创作", icon: "pen",
    tools: [
      { tab: "select", label: "选帖学习" }, { tab: "collage", label: "集字拼图" },
      { tab: "convert", label: "繁简转换" }, { tab: "ocr", label: "看图识字" },
      { tab: "count", label: "字数统计" }, { tab: "poems", label: "唐诗宋词" },
      { tab: "layout", label: "章法排版" }, { tab: "calendar", label: "书法日历" },
    ],
  },
  {
    label: "书法家和作品", icon: "grid",
    tools: [{ tab: "people", label: "书法家" }, { tab: "works", label: "代表作品" }, { tab: "favorites", label: "收藏" }],
  },
] as const;

export function StudyWorkbench({ view, navigate, close }: {
  view: (StudyNavigation & { version: number }) | null;
  navigate: (view: StudyNavigation) => void;
  close: () => void;
}) {
  const titleId = useId();
  const toolId = useId();
  const toolHeading = useRef<HTMLHeadingElement>(null);
  const section = studySections.find((section) => section.tools.some((tool) => tool.tab === view?.tab));
  const active = section?.tools.find((tool) => tool.tab === view?.tab);

  function follow(next: StudyNavigation) {
    navigate(next);
    requestAnimationFrame(() => toolHeading.current?.focus());
  }

  function content() {
    if (!view) return null;
    if (view.tab === "calendar") return <StudyCalendar initial={view.text ?? ""} />;
    if (view.tab === "layout" || view.tab === "collage") return <StudyCanvas collage={view.tab === "collage"} initial={view.text ?? ""} />;
    if (["convert", "ocr", "count"].includes(view.tab)) return <StudyTextTool view={view} navigate={follow} />;
    return <StudyCatalog view={view} navigate={follow} />;
  }

  return <WorkspaceDialog titleId={titleId} open={!!view} onClose={close} className="image-workbench study-workbench">
    {view && section && active && <div className="image-workbench-frame">
      <header className="settings-head">
        <div className="study-title">
          <WorkspaceIcon name={section.icon} className="size-5 shrink-0" />
          <h2 id={titleId} className="font-display text-xl font-semibold">{section.label}</h2>
        </div>
        <button type="button" className="workspace-icon-button" aria-label={`关闭${section.label}`} data-dialog-focus onClick={close}>
          <WorkspaceIcon name="close" />
        </button>
      </header>
      <nav className="study-nav" aria-label={section.label}>
        {section.tools.map((tool) => <button key={tool.tab} type="button" aria-pressed={active.tab === tool.tab}
          onClick={() => { if (tool.tab !== view.tab) navigate({ tab: tool.tab }); }}>{tool.label}</button>)}
      </nav>
      <section key={view.version} aria-labelledby={toolId} className="study-content ink-scroll" onPaste={(event) => event.stopPropagation()}>
        <h3 id={toolId} ref={toolHeading} tabIndex={-1} className="study-current font-display">{active.label}</h3>
        {content()}
      </section>
    </div>}
  </WorkspaceDialog>;
}
