"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import {
  deleteModel, modelCredentials, readModelKey, saveModel, useModelSettings, type CustomModel,
} from "@/lib/custom-models";
import { findPresetModel, modelPresets } from "@/lib/model-presets";

function newModel(): CustomModel {
  const preset = modelPresets[0];
  return { id: crypto.randomUUID(), label: "", baseUrl: preset.url, model: preset.defaultModel.id, vision: !!preset.defaultModel.vision };
}

function normalize(draft: CustomModel) {
  let url: URL;
  try {
    url = new URL(draft.baseUrl.trim());
  } catch {
    throw new Error("请输入有效的 HTTPS Base URL");
  }
  if (url.protocol !== "https:" || !/\.[a-z]/i.test(url.hostname) || url.port || url.username || url.password || /[?#@\\]/.test(draft.baseUrl)) {
    throw new Error("Base URL 须为公网 HTTPS 域名，使用默认端口，且不带账号、查询参数或片段");
  }
  return {
    ...draft,
    baseUrl: url.href.replace(/\/+$/, "").replace(/\/chat\/completions$/, ""),
    model: draft.model.trim(),
    label: draft.label.trim() || draft.model.trim(),
  };
}

export function ModelConfigDialog({ accountId, open, onClose }: { accountId: string; open: boolean; onClose: () => void }) {
  const titleId = useId();
  return (
    <WorkspaceDialog titleId={titleId} open={open} onClose={onClose}>
      <div className="settings-frame">
        <header className="settings-head">
          <h2 id={titleId} className="font-display text-xl font-semibold">模型配置</h2>
          <button type="button" aria-label="关闭模型配置" className="workspace-icon-button" onClick={onClose}><WorkspaceIcon name="close" /></button>
        </header>
        {open && <div className="settings-content ink-scroll"><ModelSettings accountId={accountId} /></div>}
      </div>
    </WorkspaceDialog>
  );
}

function ModelSettings({ accountId }: { accountId: string }) {
  const { models, selected } = useModelSettings(accountId);
  const [draft, setDraft] = useState<CustomModel | null>(null);
  const [providerName, setProviderName] = useState("");
  const [manualModel, setManualModel] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const provider = modelPresets.find((item) => item.name === providerName);

  useEffect(() => () => request.current?.abort(), []);

  function edit(model: CustomModel | null) {
    const preset = modelPresets.find((item) => item.url === model?.baseUrl);
    setDraft(model);
    setProviderName(preset?.name ?? "");
    setManualModel(!findPresetModel(preset, model?.model ?? ""));
    setApiKey("");
    setNotice("");
    setError("");
  }

  function update(changes: Partial<CustomModel>) {
    setDraft((model) => model && { ...model, ...changes });
    setNotice("");
    setError("");
  }

  function changeProvider(name: string) {
    if (name === providerName) return;
    const next = modelPresets.find((item) => item.name === name);
    setProviderName(name);
    setManualModel(!next);
    setApiKey("");
    update({ baseUrl: next?.url ?? "", model: next?.defaultModel.id ?? "", label: "", vision: !!next?.defaultModel.vision });
  }

  function changePresetModel(id: string) {
    const next = findPresetModel(provider, id);
    setManualModel(!next);
    update({ model: next?.id ?? "", label: "", vision: !!next?.vision });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const testing = submitter instanceof HTMLButtonElement && submitter.value === "test";
    setNotice("");
    setError("");
    try {
      const presetModel = findPresetModel(provider, draft.model);
      const model = normalize({ ...draft, label: draft.label.trim() || presetModel?.label || "" });
      const key = apiKey.trim() || readModelKey(accountId, model);
      if (!model.model) throw new Error("请填写模型 ID");
      if (!/^[!-~]{1,1024}$/.test(key)) throw new Error("请填写有效的 API Key");
      if (testing) {
        setBusy(true);
        const controller = new AbortController();
        request.current = controller;
        const response = await fetch("/api/models/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modelCredentials(model, key)),
          signal: controller.signal,
        });
        const result = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "连通测试失败");
        setNotice("连接成功，模型返回了流式回复。");
      } else {
        saveModel(accountId, model, key);
        edit(null);
        setNotice(`已保存「${model.label}」，可在发送按钮旁切换。`);
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setError(error instanceof Error ? error.message : "操作失败，请重试");
      }
    } finally {
      request.current = null;
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">自定义模型</h2>
        <button type="button" className="workspace-primary settings-action inline-flex items-center gap-1.5" disabled={busy} onClick={() => edit(newModel())}>
          <WorkspaceIcon name="plus" className="size-4" />添加模型
        </button>
      </div>
      <p className="text-xs leading-5 text-ink-500">
        支持 OpenAI 兼容的流式对话接口。模型配置保存在当前浏览器，API Key 保留在当前标签页。使用自定义模型时，对话内容会发送给所填服务商。
      </p>
      {models.length > 0 && (
        <ul className="model-settings-list">
          {models.map((model) => (
            <li key={model.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{model.label}{selected === model.id && <span className="ml-2 text-xs text-bamboo-700">使用中</span>}</p>
                <p className="truncate text-xs text-ink-500" title={model.model}>{modelPresets.find((item) => item.url === model.baseUrl)?.name ?? "自定义"} · {model.model}{model.vision ? " · 支持图片" : ""}</p>
              </div>
              <button type="button" aria-label={`编辑 ${model.label}`} className="settings-action text-bamboo-700 hover:underline" disabled={busy} onClick={() => edit(model)}>编辑</button>
              <button type="button" aria-label={`删除 ${model.label}`} className="settings-action text-cinnabar hover:underline" disabled={busy} onClick={() => {
                if (!window.confirm(`删除自定义模型「${model.label}」？`)) return;
                try {
                  deleteModel(accountId, model.id);
                  if (draft?.id === model.id) edit(null);
                  setError("");
                  setNotice(`已删除「${model.label}」。`);
                } catch {
                  setError("模型删除失败，请检查浏览器存储设置");
                }
              }}>删除</button>
            </li>
          ))}
        </ul>
      )}
      {draft && (
        <form className="model-settings-form grid gap-3" onSubmit={submit}>
          <fieldset disabled={busy} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="settings-field">模型厂商
                <select value={providerName} onChange={(event) => changeProvider(event.target.value)}>
                  {modelPresets.map((preset) => <option key={preset.name}>{preset.name}</option>)}
                  <option value="">自定义厂商</option>
                </select>
              </label>
              <label className="settings-field">显示名称（选填）
                <input maxLength={80} value={draft.label} placeholder="默认使用模型 ID" onChange={(event) => update({ label: event.target.value })} />
              </label>
            </div>
            <label className="settings-field">Base URL
              <input type="url" required readOnly={!!provider} maxLength={500} spellCheck={false} value={draft.baseUrl} placeholder="https://api.example.com/v1" onChange={(event) => update({ baseUrl: event.target.value })} />
            </label>
            {provider && (
              <label className="settings-field">厂商模型
                <select value={manualModel ? "" : draft.model} onChange={(event) => changePresetModel(event.target.value)}>
                  {provider.groups.map((group) => <optgroup key={group.label} label={group.label}>
                    {group.models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
                  </optgroup>)}
                  <option value="">手动填写模型 ID</option>
                </select>
              </label>
            )}
            {manualModel && <label className="settings-field">模型 ID
              <input required maxLength={200} spellCheck={false} value={draft.model} onChange={(event) => update({ model: event.target.value })} />
            </label>}
            <label className="settings-field">API Key
              <input type="password" maxLength={1024} autoComplete="off" spellCheck={false} value={apiKey} placeholder={readModelKey(accountId, draft) ? "留空沿用当前标签页的 Key" : "输入服务商提供的 API Key"} onChange={(event) => {
                setApiKey(event.target.value);
                setNotice("");
                setError("");
              }} />
            </label>
            {provider && <a href={provider.docs} target="_blank" rel="noreferrer" className="w-fit text-xs text-bamboo-700 hover:underline">查看{provider.name}接口文档</a>}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-bamboo-500" checked={draft.vision} onChange={(event) => update({ vision: event.target.checked })} />支持图片
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="workspace-primary settings-action" disabled={busy}>保存模型</button>
            <button type="submit" value="test" className="settings-action settings-secondary" disabled={busy}>{busy ? "正在测试…" : "测试连接"}</button>
            <button type="button" className="settings-action settings-secondary" disabled={busy} onClick={() => edit(null)}>取消</button>
          </div>
        </form>
      )}
      {notice && <p role="status" className="text-xs text-bamboo-700">{notice}</p>}
      {error && <p role="alert" className="text-xs text-cinnabar">{error}</p>}
    </section>
  );
}
