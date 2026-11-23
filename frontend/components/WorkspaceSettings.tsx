"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { SettingsForm } from "@/components/SettingsForm";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import { resetAppearance, textSizeRange, updateAppearance, useAppearance } from "@/lib/appearance";
import { styleIds, styleProfiles } from "@/lib/visual-styles";

function Choices<Value extends string>({ title, value, options, onChange }: {
  title: string;
  value: Value;
  options: readonly { value: Value; label: string; swatch?: string }[];
  onChange: (value: Value) => void;
}) {
  const name = useId();
  return (
    <fieldset className="settings-section">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="settings-choices">
        {options.map((option) => (
          <label key={option.value} className="settings-choice">
            <input className="sr-only" type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>
              {option.swatch && <i className="size-2.5 rounded-full" style={{ background: option.swatch }} aria-hidden="true" />}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AppearanceSettings() {
  const value = useAppearance();
  const sizeId = useId();
  return (
    <div className="grid gap-4">
      <p className="text-xs leading-5 text-ink-500">调整会立即生效，并保存在当前浏览器。</p>
      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
        <Choices title="显示模式" value={value.mode} options={[
          { value: "style", label: "随风格" },
          { value: "light", label: "浅色" }, { value: "dark", label: "深色" }, { value: "system", label: "跟随系统" },
        ]} onChange={(mode) => updateAppearance({ mode })} />
        <Choices title="主题配色" value={value.accent} options={[
          { value: "style", label: "随风格" },
          { value: "cinnabar", label: "朱砂", swatch: "#a0473d" }, { value: "bamboo", label: "竹青", swatch: "#527050" },
          { value: "indigo", label: "靛蓝", swatch: "#506b94" },
        ]} onChange={(accent) => updateAppearance({ accent })} />
        <Choices title="阅读字体" value={value.font} options={[
          { value: "sans", label: "黑体" }, { value: "serif", label: "宋体" },
        ]} onChange={(font) => updateAppearance({ font })} />
        <Choices title="界面圆角" value={value.radius} options={[
          { value: "style", label: "随风格" },
          { value: "crisp", label: "方正" }, { value: "soft", label: "柔和" }, { value: "round", label: "圆润" },
        ]} onChange={(radius) => updateAppearance({ radius })} />
        <Choices title="侧栏位置" value={value.sidebar} options={[
          { value: "style", label: "随风格" },
          { value: "left", label: "左侧" }, { value: "right", label: "右侧" },
        ]} onChange={(sidebar) => updateAppearance({ sidebar })} />
        <Choices title="对话宽度" value={value.width} options={[
          { value: "standard", label: "标准" }, { value: "wide", label: "宽屏" },
        ]} onChange={(width) => updateAppearance({ width })} />
      </div>
      <label htmlFor={sizeId} className="grid gap-2 text-sm font-medium">
        <span className="flex justify-between gap-2">
          阅读字号 <output htmlFor={sizeId} className="text-xs tabular-nums text-ink-500">{value.textSize} px</output>
        </span>
        <input id={sizeId} type="range" min={textSizeRange.min} max={textSizeRange.max} value={value.textSize} className="w-full accent-bamboo-500" onChange={(event) => updateAppearance({ textSize: event.currentTarget.valueAsNumber })} />
      </label>
      <div className="chat-reading chat-message-surface border border-ink-200 bg-ink-50 px-3 py-2 text-ink-700" aria-label="阅读预览">
        临帖先看结字，再体会提按与转折。
      </div>
      <button type="button" onClick={resetAppearance} className="w-fit rounded px-1 py-1 text-xs font-medium text-bamboo-700 hover:underline">
        恢复默认外观
      </button>
    </div>
  );
}

function StyleSettings() {
  const { style } = useAppearance();
  const name = useId();
  return (
    <fieldset className="style-picker">
      <legend className="text-sm font-semibold">页面风格</legend>
      <p className="my-2 text-xs leading-5 text-ink-500">登录页和对话页同步切换。选择会保存在当前浏览器。</p>
      <div className="style-picker-grid">
        {styleIds.map((id) => {
          const { label, description, artwork } = styleProfiles[id];
          return (
            <label key={id} className="style-option">
              <input className="sr-only" type="radio" name={name} checked={style === id} onChange={() => updateAppearance({ style: id })} aria-label={label} />
              <span className="style-option-content">
                <span className="style-option-preview" data-preview-style={id} aria-hidden="true">
                  {artwork
                    ? <Image src={artwork.src} alt="" width={artwork.width} height={artwork.height} sizes="220px" />
                    : <span className="brand-seal">书</span>}
                </span>
                <span className="style-option-label">
                  <span className="min-w-0">
                    <strong className="block text-sm">{label}</strong>
                    <small className="block text-xs text-ink-500">{description}</small>
                  </span>
                  {style === id && <span className="style-option-check" aria-hidden="true">✓</span>}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const sections = [
  { id: "appearance", label: "界面外观", icon: "appearance" },
  { id: "style", label: "风格", icon: "book" },
  { id: "account", label: "账号安全", icon: "account" },
] as const;

function SettingsPanel({ email, titleId, onClose }: { email: string; titleId: string; onClose?: () => void }) {
  const [section, setSection] = useState<(typeof sections)[number]["id"]>("appearance");
  return (
    <div className="settings-frame">
      <header className="settings-head">
        <h1 id={titleId} className="font-display text-xl font-semibold">设置</h1>
        {onClose ? (
          <button type="button" aria-label="关闭设置" className="workspace-icon-button" onClick={onClose}>
            <WorkspaceIcon name="close" />
          </button>
        ) : (
          <Link href="/chat" className="rounded px-2 py-1 text-sm text-bamboo-700 hover:underline">返回对话</Link>
        )}
      </header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="设置分类">
          {sections.map((item) => (
            <button type="button" key={item.id} aria-pressed={section === item.id} onClick={() => setSection(item.id)}>
              <WorkspaceIcon name={item.icon} className="size-4" />{item.label}
            </button>
          ))}
        </nav>
        <div className="settings-content ink-scroll">
          {section === "appearance" && <AppearanceSettings />}
          {section === "style" && <StyleSettings />}
          {section === "account" && (
            <section className="max-w-sm space-y-5" aria-labelledby={`${titleId}-account`}>
              <div>
                <h2 id={`${titleId}-account`} className="text-base font-semibold">修改密码</h2>
                <p className="mt-1 break-all text-sm text-ink-500">{email}</p>
              </div>
              <SettingsForm />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSettingsPage({ email }: { email: string }) {
  const titleId = useId();
  return <div className="settings-page-card"><SettingsPanel email={email} titleId={titleId} /></div>;
}

export function WorkspaceSettingsDialog({ email, open, onClose }: { email: string; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="settings-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <SettingsPanel email={email} titleId={titleId} onClose={onClose} />
    </dialog>
  );
}
