"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function UsernameForm({ username }: { username: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.get("username"), currentPassword: data.get("password") }),
      });
      const result = await response.json().catch(() => ({})) as { username?: string; error?: string };
      if (!response.ok || !result.username) throw new Error(result.error || "账号名保存失败");
      form.reset();
      setNotice(`已保存账号名「${result.username}」。`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "账号名保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={save}>
      <label className="settings-field">账号名
        <input name="username" defaultValue={username ?? ""} minLength={3} maxLength={32} required autoComplete="username" spellCheck={false} autoCapitalize="none" />
      </label>
      <p className="text-xs text-ink-500">支持 3–32 位汉字、英文字母、数字、下划线或连字符。</p>
      <label className="settings-field">当前密码
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {error && <p className="text-xs text-cinnabar" role="alert">{error}</p>}
      {notice && <p className="text-xs text-bamboo-700" role="status">{notice}</p>}
      <button type="submit" className="workspace-primary settings-action justify-self-start" disabled={busy}>{busy ? "正在保存…" : "保存账号名"}</button>
    </form>
  );
}
