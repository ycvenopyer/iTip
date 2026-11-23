"use client";

import { useState } from "react";
import { defaultModel, selectModel, useModelSettings } from "@/lib/custom-models";

export function ComposerModel({ accountId, defaultLabel, disabled, onConfigure }: {
  accountId: string;
  defaultLabel: string;
  disabled: boolean;
  onConfigure: () => void;
}) {
  const { models, selected } = useModelSettings(accountId);
  const [error, setError] = useState("");
  const label = defaultLabel ? `${defaultLabel}（默认）` : "默认模型";
  return (
    <>
      <select className="chat-model-select" aria-label="切换模型" title={models.find((model) => model.id === selected)?.label ?? label} value={selected}
        disabled={disabled} onChange={(event) => {
          setError("");
          if (event.target.value === "manage") {
            onConfigure();
            return;
          }
          try {
            selectModel(accountId, event.target.value);
          } catch {
            setError("无法保存模型选择，请检查浏览器存储设置");
          }
        }}>
        <option value={defaultModel}>{label}</option>
        {models.length > 0 && <optgroup label="自定义模型">
          {models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
        </optgroup>}
        <option value="manage">配置模型…</option>
      </select>
      {error && <span className="composer-model-error" role="alert">{error}</span>}
    </>
  );
}
