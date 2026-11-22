import { cache } from "react";
import { cookies } from "next/headers";

import { backendJson } from "@/lib/backend";

export const getSession = cache(async () => {
  if (!(await cookies()).has("itip_session")) return null;
  const { user } = await backendJson<{ user: { id: string; email: string } | null }>("/api/auth/me");
  return user && { userId: user.id, email: user.email };
});
