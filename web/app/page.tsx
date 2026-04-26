import Link from "next/link";

import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const s = await getSession();
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper-100 text-ink-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 22px,
            rgba(25, 22, 18, 0.05) 22px,
            rgba(25, 22, 18, 0.05) 23px
          )`,
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-20 md:px-10 md:py-24">
        <p className="text-cinnabar/90 font-display text-sm tracking-[0.35em]">私人家塾 · 数字册页</p>
        <h1 className="font-display mt-6 max-w-2xl text-5xl leading-[1.1] text-ink-950 md:text-6xl">
          iTip
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-700/90 md:text-xl">
          为硬笔、毛笔与兼修而设的书法对话助手。问技法、比书家、理日课；可附图讨论笔性（非专业鉴定）。作品成图将后续开放。
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          {s ? (
            <Link
              href="/chat"
              className="inline-flex rounded-2xl bg-ink-900 px-7 py-3 text-sm font-medium text-paper-50 shadow-[0_8px_30px_rgba(25,22,18,0.2)]"
            >
              进入对话
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex rounded-2xl bg-ink-900 px-7 py-3 text-sm font-medium text-paper-50 shadow-[0_8px_30px_rgba(25,22,18,0.2)]"
              >
                注册
              </Link>
              <Link
                href="/login"
                className="inline-flex rounded-2xl border border-ink-300/50 bg-paper-50/80 px-7 py-3 text-sm text-ink-800"
              >
                登录
              </Link>
            </>
          )}
        </div>
        {s && (
          <p className="text-ink-500/80 mt-6 text-sm">
            已以 <span className="text-ink-700">{s.email}</span> 登录。
          </p>
        )}
        <div className="mt-20 grid gap-3 border-t border-ink-200/30 pt-10 md:grid-cols-3">
          {[
            {
              t: "域",
              d: "硬笔、软笔、兼修：用笔、结体与节奏。",
            },
            {
              t: "用",
              d: "选帖、日课、对比分析；可上传图片做讨论。",
            },
            {
              t: "界",
              d: "不冒充鉴定。模型回答仅供参考。",
            },
          ].map((x) => (
            <div key={x.t} className="bg-paper-50/60 rounded-2xl border border-ink-200/25 p-5">
              <p className="text-cinnabar font-display text-3xl leading-none opacity-80">{x.t}</p>
              <p className="text-ink-600/90 mt-2 text-sm leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
