export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-ink-200/30 border-t-ink-600" />
          <div className="absolute inset-3 animate-spin rounded-full border-2 border-ink-200/40 border-t-bamboo-500" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-6 rounded-full bg-ink-800/10" />
        </div>
        <p className="font-body text-sm tracking-widest text-ink-400">研墨中…</p>
      </div>
    </div>
  );
}
