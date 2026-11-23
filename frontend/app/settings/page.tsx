import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorkspaceSettingsPage } from "@/components/WorkspaceSettings";
import { WorkspaceSurface } from "@/components/WorkspaceSurface";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "设置",
  description: "管理 iTip 的界面外观和账号安全设置。",
};

export default async function SettingsPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <WorkspaceSurface className="min-h-dvh py-6 sm:py-14">
      <main><WorkspaceSettingsPage email={s.email} /></main>
    </WorkspaceSurface>
  );
}
