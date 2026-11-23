"use client";

import { useSyncExternalStore } from "react";
import { styleIds } from "@/lib/visual-styles";

const appearanceOptions = {
  style: styleIds,
  mode: ["style", "light", "dark", "system"],
  accent: ["style", "cinnabar", "bamboo", "indigo"],
  font: ["sans", "serif"],
  radius: ["style", "crisp", "soft", "round"],
  sidebar: ["style", "left", "right"],
  width: ["standard", "wide"],
} as const;

export type Appearance = {
  [Key in keyof typeof appearanceOptions]: (typeof appearanceOptions)[Key][number];
} & { textSize: number };

export const textSizeRange = { min: 14, max: 22 };

const defaults: Appearance = {
  style: "classic",
  mode: "style",
  accent: "style",
  font: "sans",
  radius: "style",
  sidebar: "style",
  width: "standard",
  textSize: 16,
};

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
    const fromPreviousVersion = value?.style === undefined;
    // Carry forward custom choices while letting the old defaults follow a style.
    cached = {
      style: readChoice(value?.style, appearanceOptions.style, defaults.style),
      mode: fromPreviousVersion && value?.mode === "light" ? "style" : readChoice(value?.mode, appearanceOptions.mode, defaults.mode),
      accent: fromPreviousVersion && value?.accent === "cinnabar" ? "style" : readChoice(value?.accent, appearanceOptions.accent, defaults.accent),
      font: readChoice(value?.font, appearanceOptions.font, defaults.font),
      radius: fromPreviousVersion && value?.radius === "soft" ? "style" : readChoice(value?.radius, appearanceOptions.radius, defaults.radius),
      sidebar: fromPreviousVersion && value?.sidebar === "left" ? "style" : readChoice(value?.sidebar, appearanceOptions.sidebar, defaults.sidebar),
      width: readChoice(value?.width, appearanceOptions.width, defaults.width),
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

export function resetAppearance() {
  applyAppearance({ ...defaults, style: readAppearance().style });
}
