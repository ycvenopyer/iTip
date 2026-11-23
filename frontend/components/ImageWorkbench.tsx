"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";

const sizes = [
  { value: "1024x1024", label: "方幅" },
  { value: "768x1024", label: "竖幅" },
  { value: "1024x768", label: "横幅" },
] as const;

type ImageSize = (typeof sizes)[number]["value"];
export type ImageDraft = { prompt: string; size: ImageSize };
export type CalligraphyImage = ImageDraft & { url: string; model: string };
export const imagePartType = "data-calligraphy-image";

export function readCalligraphyImage(data: unknown): CalligraphyImage | null {
  if (!data || typeof data !== "object") return null;
  const { url, prompt, size, model } = data as Partial<CalligraphyImage>;
  if (typeof url !== "string" || !/^(?:https:\/\/|data:image\/png;base64,)/.test(url) ||
      typeof prompt !== "string" || typeof model !== "string") return null;
  const dimensions = sizes.find((item) => item.value === size);
  return dimensions ? { url, prompt, size: dimensions.value, model } : null;
}

export function ImageWorkbench({ open, generating, onClose, onGenerating, onGenerated, latest, draft, onDraft }: {
  open: boolean;
  generating: boolean;
  onClose: () => void;
  onGenerating: (active: boolean) => void;
  onGenerated: (image: CalligraphyImage) => void;
  latest?: CalligraphyImage;
  draft: ImageDraft;
  onDraft: (draft: ImageDraft) => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const { prompt, size } = draft;
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function generate() {
    const text = prompt.trim();
    if (!text || controller.current) return;
    const request = new AbortController();
    controller.current = request;
    onGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, size }),
        signal: request.signal,
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const result = await response.json().catch(() => null);
      const image = readCalligraphyImage({ ...result, prompt: text });
      if (!response.ok || !image) throw new Error(result?.error || "生成失败，请稍后重试");
      onGenerated(image);
    } catch (error) {
      if (!request.signal.aborted) setError(error instanceof Error ? error.message : "生成失败");
    } finally {
      controller.current = null;
      if (!request.signal.aborted) onGenerating(false);
    }
  }

  return (
    <WorkspaceDialog titleId={titleId} open={open} onClose={onClose} className="image-workbench">
      <div className="image-workbench-frame">
        <header className="settings-head">
          <div className="flex items-center gap-2.5">
            <WorkspaceIcon name="sparkle" className="size-5 shrink-0 text-bamboo-700" />
            <h2 id={titleId} className="font-display text-xl font-semibold">AI 生成书法参考图</h2>
          </div>
          <button type="button" aria-label="关闭书法参考图工作台" className="workspace-icon-button" onClick={onClose}><WorkspaceIcon name="close" /></button>
        </header>
        <div className="image-workbench-content ink-scroll" onPaste={(event) => event.stopPropagation()}>
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void generate(); }}>
            <label className="settings-field">描述想生成的参考图
              <textarea rows={4} maxLength={1000} required data-dialog-focus value={prompt} disabled={generating}
                placeholder="例如：欧体楷书「永」字，白底黑字"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                onChange={(event) => onDraft({ prompt: event.target.value, size })} />
            </label>
            <fieldset disabled={generating}>
              <legend className="mb-2 text-sm font-medium">画幅</legend>
              <div className="settings-choices">
                {sizes.map((item) => (
                  <label key={item.value} className="settings-choice">
                    <input type="radio" name={titleId} value={item.value} className="sr-only" checked={size === item.value} onChange={() => onDraft({ prompt, size: item.value })} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error && <p className="text-sm text-cinnabar" role="alert">{error}</p>}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs tabular-nums text-ink-500">{prompt.length}/1000</span>
              <button type="submit" className="workspace-primary settings-action" disabled={generating || !prompt.trim()}>{generating ? "正在生成…" : "生成图片"}</button>
            </div>
          </form>
          {latest && (
            <section className="grid gap-3 border-t border-ink-200 pt-4" aria-label="生成预览">
              <h3 className="text-sm font-medium">生成预览</h3>
              <CalligraphyImageCard image={latest} />
            </section>
          )}
        </div>
      </div>
    </WorkspaceDialog>
  );
}

export function CalligraphyImageCard({ image, onRegenerate, onCopy, copied }: {
  image: CalligraphyImage;
  onRegenerate?: () => void;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <figure className="calligraphy-image-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={image.prompt} loading="lazy" />
      <figcaption className="grid gap-2 p-3 text-left">
        <p className="break-words text-sm text-ink-800">{image.prompt}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
          <span>{image.model} · {image.size.replace("x", " × ")}</span>
          <div className="flex flex-wrap gap-3 text-bamboo-700">
            <a href={image.url} target="_blank" rel="noreferrer" download="itip-calligraphy.png" className="hover:underline">下载图片</a>
            {onRegenerate && <button type="button" className="hover:underline" onClick={onRegenerate}>重新生成</button>}
            {onCopy && <button type="button" className="hover:underline" onClick={onCopy}>{copied ? "已复制" : "复制链接"}</button>}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
