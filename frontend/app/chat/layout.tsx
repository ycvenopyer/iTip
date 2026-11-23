import { redirect } from "next/navigation";

import { WorkspaceSurface } from "@/components/WorkspaceSurface";
import { getSession } from "@/lib/auth/session";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  if (!await getSession()) redirect("/login");
  return <WorkspaceSurface className="chat-workspace">{children}</WorkspaceSurface>;
}
