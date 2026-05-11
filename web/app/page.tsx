"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InkCursor } from "@/components/InkCursor";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && <InkCursor />}
      <main className="relative min-h-screen overflow-hidden bg-paper-100">
        {/* 宣纸纹理背景 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 24px,
              rgba(25, 22, 18, 0.03) 24px,
              rgba(25, 22, 18, 0.03) 25px
            )`,
          }}
        />

        {/* 水墨晕染装饰 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="ink-wash-1 absolute -left-20 top-20 h-96 w-96 rounded-full opacity-20" />
          <div className="ink-wash-2 absolute -right-32 bottom-32 h-[500px] w-[500px] rounded-full opacity-15" />
          <div className="ink-wash-3 absolute left-1/3 top-1/2 h-64 w-64 rounded-full opacity-10" />
        </div>

        {/* 主内容 */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
          {/* 标题区域 */}
          <div className="text-center">
            {/* 印章 */}
            <div
              className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded border-2 border-cinnabar transition-all duration-1000 ${
                mounted ? "opacity-100 scale-100" : "opacity-0 scale-150"
              }`}
              style={{
                boxShadow: "inset 0 0 0 2px rgba(154, 44, 44, 0.3)",
              }}
            >
              <span className="font-display text-3xl text-cinnabar">书</span>
            </div>

            {/* 主标题 */}
            <h1
              className={`font-display text-6xl tracking-widest text-ink-900 transition-all duration-1000 delay-200 md:text-7xl ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              iTip
            </h1>

            {/* 副标题 */}
            <p
              className={`font-body mt-6 text-lg tracking-[0.3em] text-ink-500 transition-all duration-1000 delay-500 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            >
              笔墨之间 · 自有天地
            </p>

            {/* 分隔线 */}
            <div
              className={`mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-ink-300 to-transparent transition-all duration-1000 delay-700 ${
                mounted ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
              }`}
            />

            {/* 简介 - 精简 */}
            <p
              className={`font-body mx-auto mt-8 max-w-md text-base leading-loose text-ink-600 transition-all duration-1000 delay-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              以笔墨为伴，探书法之趣。
              <br />
              问技法、赏碑帖、论笔性。
            </p>

            {/* 按钮组 */}
            <div
              className={`mt-12 flex items-center justify-center gap-6 transition-all duration-1000 delay-[1200ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link
                href="/chat"
                className="group relative overflow-hidden rounded bg-ink-800 px-8 py-3 text-sm tracking-widest text-paper-50 transition-all duration-300 hover:bg-ink-700 hover:shadow-lg"
              >
                <span className="relative z-10">开始对话</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
              <Link
                href="/login"
                className="text-sm tracking-widest text-ink-500 transition-colors duration-300 hover:text-ink-700"
              >
                登录
              </Link>
            </div>
          </div>

          {/* 底部三诀 - 极简 */}
          <div
            className={`absolute bottom-12 left-0 right-0 px-6 transition-all duration-1000 delay-[1400ms] ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="mx-auto flex max-w-2xl justify-center gap-12 text-center">
              {[
                { char: "法", desc: "用笔结体" },
                { char: "意", desc: "气韵生动" },
                { char: "境", desc: "自成一格" },
              ].map((item) => (
                <div key={item.char} className="group cursor-default">
                  <span className="font-display text-2xl text-ink-300 transition-colors duration-300 group-hover:text-cinnabar">
                    {item.char}
                  </span>
                  <p className="font-body mt-1 text-xs tracking-wider text-ink-400">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 角落装饰 */}
        <div className="pointer-events-none absolute bottom-6 left-6 text-xs text-ink-300">
          <span className="writing-vertical font-body tracking-widest">
            翰墨千秋
          </span>
        </div>
        <div className="pointer-events-none absolute right-6 top-6 text-xs text-ink-300">
          <span className="writing-vertical font-body tracking-widest">
            文房四宝
          </span>
        </div>
      </main>
    </>
  );
}
