import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/SettingsForm";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "设置",
  description: "管理 iTip 账户设置，修改密码。",
};

export default async function SettingsPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <div className="min-h-screen bg-paper-100 px-4 py-16 text-ink-900">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-ink-200/30 bg-paper-50/90 p-8 shadow-2xl shadow-ink-900/5">
        <h1 className="font-display text-2xl">设置</h1>
        <p className="text-ink-500/80 mt-2 text-sm">
          当前账号：<span className="font-medium text-ink-700">{s.email}</span>
        </p>
        <div className="mt-8">
          <SettingsForm />
        </div>
        <p className="text-ink-500/60 mt-6 text-sm">
          <a href="/chat" className="hover:underline">
            ← 返回对话
          </a>
        </p>
      </div>
    </div>
  );
}
