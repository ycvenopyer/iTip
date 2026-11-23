"use client";

import { useSyncExternalStore } from "react";
import { styleIds, styleProfiles } from "@/lib/visual-styles";

const appearanceOptions = {
  style: styleIds,
  mode: ["light", "dark", "system"],
  accent: ["cinnabar", "bamboo", "indigo", "bronze", "jade", "plum"],
  font: ["sans", "serif", "yahei", "dengxian", "kai"],
  radius: ["crisp", "soft", "round"],
  sidebar: ["left", "right"],
} as const;

export type Appearance = {
  [Key in keyof typeof appearanceOptions]: (typeof appearanceOptions)[Key][number];
} & { textSize: number };

export const textSizeRange = { min: 14, max: 22 };

const defaults: Appearance = {
  style: "classic",
  font: "sans",
  ...styleAppearance("classic"),
  textSize: 16,
};

function styleAppearance(style: Appearance["style"]): Pick<Appearance, "mode" | "accent" | "radius" | "sidebar"> {
  const { mode, accent, sidebar } = styleProfiles[style];
  return { mode, accent, sidebar, radius: style === "classic" ? "soft" : "crisp" };
}

const key = "itip-appearance";
const listeners = new Set<() => void>();
let cached: Appearance = defaults;
let cachedRaw: string | null | undefined;
let memoryOnly = false;

function readChoice<const Choices extends readonly string[]>(value: unknown, options: Choices, fallback: Choices[number]) {
  return typeof value === "string" && options.includes(value) ? value as Choices[number] : fallback;
}

function readAppearance(): Appearance {
  if (memoryOnly) return cached;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === cachedRaw) return cached;
    const value: Partial<Appearance> | null = raw ? JSON.parse(raw) : null;
    const textSize = value?.textSize;
    const style = readChoice(value?.style, appearanceOptions.style, defaults.style);
    const preset = styleAppearance(style);
    // Normalize legacy "style" values to the concrete choices they already displayed.
    cached = {
      style,
      mode: readChoice(value?.mode, appearanceOptions.mode, preset.mode),
      accent: readChoice(value?.accent, appearanceOptions.accent, preset.accent),
      font: readChoice(value?.font, appearanceOptions.font, defaults.font),
      radius: readChoice(value?.radius, appearanceOptions.radius, preset.radius),
      sidebar: readChoice(value?.sidebar, appearanceOptions.sidebar, preset.sidebar),
      textSize: typeof textSize === "number" && Number.isFinite(textSize)
        ? Math.round(Math.max(textSizeRange.min, Math.min(textSizeRange.max, textSize)))
        : defaults.textSize,
    };
    cachedRaw = raw;
  } catch {
    // Keep the in-memory settings when browser storage is unavailable.
  }
  return cached;
}

function subscribe(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) listener();
  }
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function applyAppearance(value: Appearance) {
  cached = value;
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(key, raw);
    cachedRaw = raw;
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  listeners.forEach((listener) => listener());
}

export function useAppearance() {
  return useSyncExternalStore(subscribe, readAppearance, () => defaults);
}

export function updateAppearance(changes: Partial<Appearance>) {
  applyAppearance({ ...readAppearance(), ...changes });
}

export function selectStyle(style: Appearance["style"]) {
  updateAppearance({ style, ...styleAppearance(style) });
}

export function resetAppearance() {
  const { style } = readAppearance();
  applyAppearance({ ...defaults, style, ...styleAppearance(style) });
}
