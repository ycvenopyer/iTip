"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded border-2 border-cinnabar/60 bg-paper-50">
          <span className="font-display text-2xl text-cinnabar">误</span>
        </div>
        <h1 className="font-display text-3xl text-ink-900">页面出错了</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-500">
          墨迹未干，请稍后重试。若持续出现，可返回首页或检查环境配置。
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-ink-800 px-6 py-2.5 text-sm tracking-widest text-paper-50 transition-all hover:bg-ink-700"
          >
            重新尝试
          </button>
          <Link
            href="/"
            className="rounded-lg border border-ink-200/50 px-6 py-2.5 text-sm tracking-widest text-ink-600 transition-all hover:bg-ink-50"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
