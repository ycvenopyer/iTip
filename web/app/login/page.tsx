import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect("/chat");
  return (
    <div className="min-h-screen bg-paper-100 px-4 py-16 text-ink-900">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-ink-200/30 bg-paper-50/90 p-8 shadow-2xl shadow-ink-900/5">
        <h1 className="font-display text-2xl">登录</h1>
        <p className="text-ink-500/80 mt-2 text-sm">进入你的书法册页</p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="text-ink-500/80 mt-6 text-sm">
          没有账号？{" "}
          <Link href="/register" className="text-cinnabar hover:underline">
            注册
          </Link>
        </p>
        <p className="text-ink-500/60 mt-4 text-sm">
          <Link href="/" className="hover:underline">
            ← 返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
