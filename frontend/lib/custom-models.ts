"use client";

import { useMemo, useSyncExternalStore } from "react";

export type CustomModel = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  vision: boolean;
};

type ModelSettings = { models: CustomModel[]; selected: string };
export const defaultModel = "default";
const emptySettings: ModelSettings = { models: [], selected: defaultModel };
const emptySnapshot = JSON.stringify(emptySettings);
const changeEvent = "itip-models-changed";
const storageKey = (accountId: string) => `itip-models:${accountId}`;
const keyPrefix = (accountId: string) => `itip-model-key:${accountId}:`;

function snapshot(accountId: string) {
  try {
    return localStorage.getItem(storageKey(accountId)) ?? emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

function parse(raw: string): ModelSettings {
  try {
    const { models, selected } = JSON.parse(raw) as ModelSettings;
    if (Array.isArray(models)) return { models, selected: models.some((model) => model.id === selected) ? selected : defaultModel };
  } catch {
    // Invalid browser data falls back to the built-in model.
  }
  return emptySettings;
}

function commit(accountId: string, settings: ModelSettings) {
  localStorage.setItem(storageKey(accountId), JSON.stringify(settings));
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(notify: () => void) {
  window.addEventListener(changeEvent, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(changeEvent, notify);
    window.removeEventListener("storage", notify);
  };
}

export function useModelSettings(accountId: string) {
  const raw = useSyncExternalStore(subscribe, () => snapshot(accountId), () => emptySnapshot);
  return useMemo(() => parse(raw), [raw]);
}

export function selectModel(accountId: string, id: string) {
  const settings = parse(snapshot(accountId));
  commit(accountId, { ...settings, selected: id });
}

export function readModelKey(accountId: string, model: CustomModel) {
  try {
    const prefix = model.baseUrl + "\n";
    const value = sessionStorage.getItem(keyPrefix(accountId) + model.id);
    return value?.startsWith(prefix) ? value.slice(prefix.length) : "";
  } catch {
    return "";
  }
}

export function saveModel(accountId: string, model: CustomModel, key: string) {
  const settings = parse(snapshot(accountId));
  const found = settings.models.some((item) => item.id === model.id);
  const models = found ? settings.models.map((item) => item.id === model.id ? model : item) : [...settings.models, model];
  if (models.length > 20) throw new Error("最多可以保存 20 个自定义模型");
  const slot = keyPrefix(accountId) + model.id;
  const previous = sessionStorage.getItem(slot);
  sessionStorage.setItem(slot, model.baseUrl + "\n" + key);
  try {
    commit(accountId, { ...settings, models });
  } catch (error) {
    if (previous === null) sessionStorage.removeItem(slot);
    else sessionStorage.setItem(slot, previous);
    throw error;
  }
}

export function deleteModel(accountId: string, id: string) {
  const { models, selected } = parse(snapshot(accountId));
  commit(accountId, {
    models: models.filter((model) => model.id !== id),
    selected: selected === id ? defaultModel : selected,
  });
  sessionStorage.removeItem(keyPrefix(accountId) + id);
}

export function clearModelKeys(accountId: string) {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(keyPrefix(accountId))) sessionStorage.removeItem(key);
    }
  } catch {
    // Storage may be blocked by the browser.
  }
}

export function modelCredentials({ baseUrl, model, vision }: CustomModel, apiKey: string) {
  return { baseUrl, model, vision, apiKey };
}

export function chatModelBody(accountId: string) {
  const { models, selected } = parse(snapshot(accountId));
  const model = models.find((item) => item.id === selected);
  if (!model) return {};
  const key = readModelKey(accountId, model);
  if (!key) throw new Error(`请从发送按钮旁打开模型配置，为「${model.label}」重新填写 API Key，或切回默认模型。`);
  return { customModel: modelCredentials(model, key) };
}
