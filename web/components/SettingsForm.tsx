"use client";

import { useId, useState } from "react";

export function SettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const curId = useId();
  const newId = useId();
  const confirmId = useId();
  const msgId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }

    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "新密码至少需要 8 位" });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!r.ok) {
        setMsg({ type: "error", text: j.error ?? "修改失败" });
        return;
      }
      setMsg({ type: "success", text: "密码修改成功！" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor={curId} className="text-ink-600/90 block text-sm">当前密码</label>
        <input
          id={curId} type="password" required autoComplete="current-password"
          value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
          className="border-ink-200/50 bg-paper-100/80 focus:ring-bamboo-400/40 mt-1 w-full rounded-xl border px-3 py-2 text-ink-900 focus:outline-none focus:ring-2"
        />
      </div>

      <hr className="border-ink-200/30" />

      <div>
        <label htmlFor={newId} className="text-ink-600/90 block text-sm">新密码（至少 8 位）</label>
        <input
          id={newId} type="password" required autoComplete="new-password" minLength={8}
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          className="border-ink-200/50 bg-paper-100/80 focus:ring-bamboo-400/40 mt-1 w-full rounded-xl border px-3 py-2 text-ink-900 focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor={confirmId} className="text-ink-600/90 block text-sm">确认新密码</label>
        <input
          id={confirmId} type="password" required autoComplete="new-password" minLength={8}
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="border-ink-200/50 bg-paper-100/80 focus:ring-bamboo-400/40 mt-1 w-full rounded-xl border px-3 py-2 text-ink-900 focus:outline-none focus:ring-2"
        />
      </div>

      {msg && (
        <p
          id={msgId}
          role="alert"
          className={`rounded-lg px-4 py-2.5 text-sm ${
            msg.type === "success"
              ? "bg-bamboo-50 text-bamboo-700 border border-bamboo-200/40"
              : "bg-cinnabar/5 text-cinnabar border border-cinnabar/20"
          }`}
        >
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-paper-50 transition-all hover:bg-ink-800 disabled:opacity-60"
      >
        {loading ? "…" : "修改密码"}
      </button>
    </form>
  );
}
