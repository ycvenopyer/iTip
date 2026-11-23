"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { clearModelKeys } from "@/lib/custom-models";

export function LogoutButton({ accountId, className = "text-sm text-ink-500 underline-offset-2 hover:underline" }: { accountId: string; className?: string }) {
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
          clearModelKeys(accountId);
          router.push("/");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className={className}
    >
      <span id={labelId}>{loading ? "正在退出…" : "退出登录"}</span>
    </button>
  );
}
