export default function ChatLoading() {
  return (
    <div className="flex min-h-screen bg-paper-100">
      <aside className="w-72 border-r border-ink-200/25 bg-paper-50/80 p-4">
        <div className="mb-4 h-8 animate-pulse rounded-lg bg-ink-100/50" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-ink-100/40" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-ink-200/30 border-t-bamboo-500" />
          </div>
          <p className="font-body text-sm tracking-widest text-ink-400">铺纸研墨…</p>
        </div>
      </div>
    </div>
  );
}
