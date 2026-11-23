import { cache } from "react";
import { cookies } from "next/headers";

import { backendJson } from "@/lib/backend";

export type Account = { id: string; email: string | null; username: string | null };

export const getSession = cache(async () => {
  if (!(await cookies()).has("itip_session")) return null;
  const { user } = await backendJson<{ user: Account | null }>("/api/auth/me");
  return user;
});
