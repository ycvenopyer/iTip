"use client";

import { StyleArtwork } from "@/components/StyleArtwork";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import { useAppearance } from "@/lib/appearance";
import { styleProfiles } from "@/lib/visual-styles";

const quickPrompts = [
  { icon: "book", title: "选帖入门", detail: "零基础怎样选第一本毛笔楷书字帖？", text: "零基础，想练毛笔楷书，每天大概半小时，该从哪本帖入手？" },
  { icon: "pen", title: "执笔与用笔", detail: "找出硬笔执笔姿势的常见错误", text: "硬笔执笔姿势有哪些常见错误？怎么纠正？" },
  { icon: "grid", title: "结字分析", detail: "把松散的字练得更稳", text: "我的字结构总是散，怎么练习结字？请给具体的日课安排。" },
  { icon: "practice", title: "硬软笔兼修", detail: "了解两种行书的练习侧重点", text: "硬笔行书和毛笔行书，练习时要注意什么互相照应的点？" },
] as const;

export function ChatWelcome({ disabled, onPrompt }: { disabled: boolean; onPrompt: (text: string) => void }) {
  const { style } = useAppearance();
  const artwork = styleProfiles[style].artwork;
  const classic = style === "classic";
  const stele = style === "stele";
  const desk = style === "writing-desk";
  return (
    <div className={classic ? "chat-welcome ink-fade-in" : "style-welcome ink-fade-in"}>
      <div className="style-welcome-intro">
        {classic && <span className="brand-seal mx-auto" aria-hidden="true">书</span>}
        <h2>{stele ? "问笔于帖" : "今天想练哪一笔？"}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          {stele ? "看看古人的笔画怎么写，再想想自己的字哪里可以改。" : "问选帖、用笔和结字，或上传习字照片，一起看看从哪里改起。"}
        </p>
      </div>
      <div className="chat-prompts">
        {quickPrompts.map((prompt) => (
          <button key={prompt.title} type="button" className="chat-prompt" disabled={disabled} onClick={() => onPrompt(prompt.text)}>
            <span className="chat-prompt-icon"><WorkspaceIcon name={prompt.icon} className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink-900">{prompt.title}</span>
              <span className="mt-0.5 block text-xs leading-5 text-ink-500">{prompt.detail}</span>
            </span>
            {classic && <WorkspaceIcon name="diagonal" className="size-3.5 shrink-0 text-ink-400" />}
          </button>
        ))}
      </div>
      {artwork && (
        <div className="style-welcome-feature">
          {desk && (
            <>
              <h3 className="font-display text-xl font-semibold">看字练习</h3>
              <div className="practice-grid" role="img" aria-label="田字格中的永字示例和空白格">
                <span aria-hidden="true">永</span><span aria-hidden="true">永</span><span aria-hidden="true" />
              </div>
              <p className="my-3 text-sm text-ink-600">先找竖钩的位置，再看两侧笔画如何留出空白。</p>
            </>
          )}
          <StyleArtwork artwork={artwork} sizes="(max-width: 760px) 92vw, 540px" />
        </div>
      )}
    </div>
  );
}
