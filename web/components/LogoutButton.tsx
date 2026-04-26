"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
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
      {loading ? "…" : "退出"}
    </button>
  );
}
