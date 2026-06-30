import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-ink-200/40 bg-paper-50">
          <span className="font-display text-4xl text-ink-300">404</span>
        </div>
        <h1 className="font-display text-3xl text-ink-900">此页无墨</h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-500">
          砚台已干，此处并无你寻找的内容。不如回到首页继续笔墨之趣。
        </p>
        <Link
          href="/"
          className="rounded-lg bg-ink-800 px-8 py-3 text-sm tracking-widest text-paper-50 transition-all hover:bg-ink-700 hover:shadow-lg"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
