"use client";

import Link from "next/link";
import Image from "next/image";
import { useId, useState } from "react";
import { SettingsForm } from "@/components/SettingsForm";
import { UsernameForm } from "@/components/UsernameForm";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { resetAppearance, selectStyle, textSizeRange, updateAppearance, useAppearance } from "@/lib/appearance";
import type { Account } from "@/lib/auth/session";
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
          { value: "light", label: "浅色" }, { value: "dark", label: "深色" }, { value: "system", label: "跟随系统" },
        ]} onChange={(mode) => updateAppearance({ mode })} />
        <Choices title="主题配色" value={value.accent} options={[
          { value: "cinnabar", label: "朱砂", swatch: "#a0473d" }, { value: "bamboo", label: "竹青", swatch: "#527050" },
          { value: "indigo", label: "靛蓝", swatch: "#506b94" }, { value: "bronze", label: "古铜", swatch: "#8b6133" },
          { value: "jade", label: "青玉", swatch: "#3b7063" }, { value: "plum", label: "梅紫", swatch: "#885078" },
        ]} onChange={(accent) => updateAppearance({ accent })} />
        <Choices title="阅读字体" value={value.font} options={[
          { value: "sans", label: "黑体" }, { value: "serif", label: "宋体" },
          { value: "yahei", label: "微软雅黑" }, { value: "dengxian", label: "等线" }, { value: "kai", label: "楷体" },
        ]} onChange={(font) => updateAppearance({ font })} />
        <Choices title="界面圆角" value={value.radius} options={[
          { value: "crisp", label: "方正" }, { value: "soft", label: "柔和" }, { value: "round", label: "圆润" },
        ]} onChange={(radius) => updateAppearance({ radius })} />
        <Choices title="侧栏位置" value={value.sidebar} options={[
          { value: "left", label: "左侧" }, { value: "right", label: "右侧" },
        ]} onChange={(sidebar) => updateAppearance({ sidebar })} />
      </div>
      <label htmlFor={sizeId} className="grid gap-2 text-sm font-medium">
        <span className="flex justify-between gap-2">
          阅读字号 <output htmlFor={sizeId} className="text-xs tabular-nums text-ink-500">{value.textSize} px</output>
        </span>
        <input id={sizeId} type="range" min={textSizeRange.min} max={textSizeRange.max} value={value.textSize} className="w-full accent-bamboo-500" onChange={(event) => updateAppearance({ textSize: event.currentTarget.valueAsNumber })} />
      </label>
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
      <p className="my-2 text-xs leading-5 text-ink-500">登录页和对话页同步切换。选择风格会应用预设的明暗、配色、圆角和侧栏位置，之后可在界面外观中调整。</p>
      <div className="style-picker-grid">
        {styleIds.map((id) => {
          const { label, description, artwork } = styleProfiles[id];
          return (
            <label key={id} className="style-option">
              <input className="sr-only" type="radio" name={name} checked={style === id} onChange={() => selectStyle(id)} aria-label={label} />
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

function SettingsPanel({ account, titleId, onClose }: {
  account: Account; titleId: string; onClose?: () => void;
}) {
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
                <h2 id={`${titleId}-account`} className="text-base font-semibold">{account.username ? "修改账号名" : "绑定账号名"}</h2>
                {account.email && <p className="mt-1 break-all text-sm text-ink-500">{account.email}</p>}
              </div>
              <UsernameForm username={account.username} />
              <h2 className="border-t border-ink-200 pt-4 text-base font-semibold">修改密码</h2>
              <SettingsForm />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSettingsPage({ account }: { account: Account }) {
  const titleId = useId();
  return <div className="settings-page-card"><SettingsPanel account={account} titleId={titleId} /></div>;
}

export function WorkspaceSettingsDialog({ account, open, onClose }: {
  account: Account; open: boolean; onClose: () => void;
}) {
  const titleId = useId();
  return (
    <WorkspaceDialog titleId={titleId} open={open} onClose={onClose}>
      {open && <SettingsPanel account={account} titleId={titleId} onClose={onClose} />}
    </WorkspaceDialog>
  );
}

export function WorkspaceHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  return (
    <WorkspaceDialog titleId={titleId} open={open} onClose={onClose}>
      <div className="settings-frame">
        <header className="settings-head">
          <h2 id={titleId} className="font-display text-xl font-semibold">帮助</h2>
          <button type="button" aria-label="关闭帮助" className="workspace-icon-button" onClick={onClose}><WorkspaceIcon name="close" /></button>
        </header>
        <dl className="settings-content workspace-help ink-scroll">
          <div><dt>开始书法对话</dt><dd>输入书法问题，或上传习字照片。按 Enter 发送，按 Shift + Enter 换行。</dd></div>
          <div><dt>配置与切换模型</dt><dd>点击发送按钮旁的模型名称，可切换模型或配置厂商和 API Key。换到新标签页后，可能需要重新填写 API Key。</dd></div>
          <div><dt>整理对话</dt><dd>在侧栏新建项目，使用对话的「更多」菜单置顶、移动或删除。点击侧栏顶部的放大镜按标题搜索对话。</dd></div>
          <div><dt>管理账号名</dt><dd>可以用邮箱或账号名登录。已有邮箱账号可在「设置 → 账号安全」绑定账号名，继续使用原有对话。</dd></div>
          <div><dt>调整界面</dt><dd>在「设置 → 风格」切换整体版式，也可在「界面外观」调整配色、字体和字号。</dd></div>
        </dl>
      </div>
    </WorkspaceDialog>
  );
}
