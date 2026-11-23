import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/LoginScreen";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 iTip 书法助手，进入你的书法册页。",
};

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect("/chat");
  return <LoginScreen />;
}
