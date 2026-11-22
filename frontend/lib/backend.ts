import "server-only";

import { cookies } from "next/headers";

export function backendUrl(path: string) {
  const origin = process.env.FLASK_API_URL || "http://127.0.0.1:5000";
  return new URL(path, origin);
}

export function backendHeaders() {
  const headers = new Headers();
  const secret = process.env.BACKEND_PROXY_SECRET;
  if (secret) headers.set("X-iTip-Proxy-Secret", secret);
  const bypass = process.env.VERCEL_BACKEND_BYPASS_SECRET;
  if (bypass) headers.set("x-vercel-protection-bypass", bypass);
  return headers;
}

export async function backendJson<T>(path: string, method?: string): Promise<T>;
export async function backendJson<T>(path: string, method: string, allowMissing: true): Promise<T | null>;
export async function backendJson<T>(path: string, method = "GET", allowMissing = false): Promise<T | null> {
  const headers = backendHeaders();
  headers.set("Cookie", (await cookies()).toString());
  const response = await fetch(backendUrl(path), {
    method,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) throw new Error(`iTip API returned ${response.status}`);
  return response.json() as Promise<T>;
}
