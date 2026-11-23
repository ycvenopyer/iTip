"use client";

import { useSyncExternalStore } from "react";

const appearanceOptions = {
  mode: ["light", "dark", "system"],
  accent: ["cinnabar", "bamboo", "indigo"],
  font: ["sans", "serif"],
  radius: ["crisp", "soft", "round"],
  sidebar: ["left", "right"],
  width: ["standard", "wide"],
} as const;

export type Appearance = {
  [Key in keyof typeof appearanceOptions]: (typeof appearanceOptions)[Key][number];
} & { textSize: number };

export const textSizeRange = { min: 14, max: 22 };

const defaults: Appearance = {
  mode: "light",
  accent: "cinnabar",
  font: "sans",
  radius: "soft",
  sidebar: "left",
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
    cached = {
      mode: readChoice(value?.mode, appearanceOptions.mode, defaults.mode),
      accent: readChoice(value?.accent, appearanceOptions.accent, defaults.accent),
      font: readChoice(value?.font, appearanceOptions.font, defaults.font),
      radius: readChoice(value?.radius, appearanceOptions.radius, defaults.radius),
      sidebar: readChoice(value?.sidebar, appearanceOptions.sidebar, defaults.sidebar),
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
  applyAppearance(defaults);
}
