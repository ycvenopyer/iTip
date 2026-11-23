import { redirect } from "next/navigation";

import { ConversationRuntimeProvider } from "@/components/ConversationRuntime";
import { WorkspaceSurface } from "@/components/WorkspaceSurface";
import { getSession } from "@/lib/auth/session";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <WorkspaceSurface className="chat-workspace">
      <ConversationRuntimeProvider key={session.id} accountId={session.id}>{children}</ConversationRuntimeProvider>
    </WorkspaceSurface>
  );
}
