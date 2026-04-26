import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/auth/session";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-ink-200/25 bg-paper-50/80 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex items-baseline gap-4">
          <Link href="/" className="font-display text-lg tracking-tight text-ink-900">
            iTip
          </Link>
          <span className="hidden text-sm text-ink-500 sm:inline">书法助手</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-700">
          <span className="max-w-[12rem] truncate" title={s.email}>
            {s.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  );
}
