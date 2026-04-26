import { CalligraphyChat } from "@/components/CalligraphyChat";

export default function ChatPage() {
  return (
    <div className="mx-auto flex h-[min(85vh,880px)] max-w-3xl flex-col">
      <h1 className="font-display mb-2 text-2xl text-ink-900 md:text-3xl">对话</h1>
      <p className="text-ink-600/90 mb-4 text-sm">
        领域：硬笔 · 软笔 · 兼修。上传作品局部图时可辅助讨论用笔与体势（非鉴定）。
      </p>
      <CalligraphyChat />
    </div>
  );
}
