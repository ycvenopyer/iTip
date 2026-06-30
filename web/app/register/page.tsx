import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/RegisterForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "注册",
  description: "注册 iTip 书法助手账号，数据存于本地数据库，支持私有部署。",
};

export default async function RegisterPage() {
  const s = await getSession();
  if (s) redirect("/chat");
  return (
    <div className="min-h-screen bg-paper-100 px-4 py-16 text-ink-900">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-ink-200/30 bg-paper-50/90 p-8 shadow-2xl shadow-ink-900/5">
        <h1 className="font-display text-2xl">注册</h1>
        <p className="text-ink-500/80 mt-2 text-sm">在本地环境创建账号，数据存于本机数据库</p>
        <div className="mt-8">
          <RegisterForm />
        </div>
        <p className="text-ink-500/80 mt-6 text-sm">
          已有账号？{" "}
          <Link href="/login" className="text-cinnabar hover:underline">
            登录
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
