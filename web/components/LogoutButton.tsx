"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const labelId = useId();
  return (
    <button
      type="button"
      disabled={loading}
      aria-labelledby={labelId}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          router.push("/");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className="text-sm text-ink-500 underline-offset-2 hover:underline"
    >
      <span id={labelId}>{loading ? "…" : "退出"}</span>
    </button>
  );
}
