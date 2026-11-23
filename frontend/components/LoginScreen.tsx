"use client";

import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { StyleArtwork } from "@/components/StyleArtwork";
import { WorkspaceSurface } from "@/components/WorkspaceSurface";
import { useAppearance } from "@/lib/appearance";
import { styleProfiles } from "@/lib/visual-styles";

const intros = {
  handscroll: "回到你的书法册页。",
  stele: "读帖、问笔、练字，从一笔一画开始。",
  "writing-desk": "回到你的习字案，从一笔开始。",
};

function RegisterLink() {
  return (
    <p className="mt-6 text-sm text-ink-500/80">
      没有账号？{" "}
      <Link href="/register" className="text-cinnabar hover:underline">注册</Link>
    </p>
  );
}

export function LoginScreen() {
  const { style } = useAppearance();
  if (style === "classic") {
    return (
      <main className="min-h-screen bg-paper-100 px-4 py-16 text-ink-900">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-ink-200/30 bg-paper-50/90 p-8 shadow-2xl shadow-ink-900/5">
          <h1 className="font-display text-2xl">登录</h1>
          <p className="mt-2 text-sm text-ink-500/80">进入你的书法册页</p>
          <div className="mt-8"><LoginForm /></div>
          <RegisterLink />
          <p className="mt-4 text-sm text-ink-500/60">
            <Link href="/" className="hover:underline">← 返回首页</Link>
          </p>
        </div>
      </main>
    );
  }

  const artwork = styleProfiles[style].artwork;
  return (
    <WorkspaceSurface className="styled-login">
      <header className="styled-login-header">
        <Link href="/" className="sidebar-brand" aria-label="iTip 首页">
          <span className="brand-seal" aria-hidden="true">{style === "stele" ? "書" : "習"}</span>
          <span className="font-display text-xl font-semibold">iTip</span>
          <span className="styled-login-wordmark">书法助手</span>
        </Link>
        <Link href="/" className="styled-login-back">返回首页</Link>
      </header>
      <main className="styled-login-layout">
        <section className="styled-login-form" aria-labelledby="login-title">
          <h1 id="login-title" className="font-display">登录{style === "stele" ? " iTip" : ""}</h1>
          <p className="styled-login-intro">{intros[style]}</p>
          <LoginForm />
          <RegisterLink />
        </section>
        {artwork && (
          <div className="styled-login-feature">
            {style === "handscroll" && <p className="scroll-inscription font-display">从一笔开始</p>}
            {style === "stele" && <span className="stele-inscription font-display" aria-hidden="true">顏氏家廟碑</span>}
            <StyleArtwork artwork={artwork} sizes="(max-width: 760px) 94vw, 57vw" priority />
          </div>
        )}
      </main>
    </WorkspaceSurface>
  );
}
