"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const errId = useId();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") ?? "");
        const password = String(fd.get("password") ?? "");
        setLoading(true);
        try {
          const r = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          if (!r.ok) {
            setErr(j.error ?? "登录失败");
            return;
          }
          router.push("/chat");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor={emailId} className="text-ink-600/90 block text-sm">
          邮箱
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-describedby={err ? errId : undefined}
          className="border-ink-200/50 bg-paper-100/80 focus:ring-bamboo-400/40 mt-1 w-full rounded-xl border px-3 py-2 text-ink-900 focus:outline-none focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor={passwordId} className="text-ink-600/90 block text-sm">
          密码
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-describedby={err ? errId : undefined}
          className="border-ink-200/50 bg-paper-100/80 focus:ring-bamboo-400/40 mt-1 w-full rounded-xl border px-3 py-2 text-ink-900 focus:outline-none focus:ring-2"
        />
      </div>
      {err && (
        <p id={errId} className="text-cinnabar text-sm" role="alert">
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-paper-50 disabled:opacity-60"
      >
        {loading ? "…" : "登录"}
      </button>
    </form>
  );
}
