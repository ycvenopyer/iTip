import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.email().max(256),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "请填写有效邮箱与密码" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1`
    )
    .get(email) as { id: string; email: string; password_hash: string } | undefined;
  if (!row) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  const ok = await compare(password, row.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  await createSessionCookie(row.id, row.email);
  return NextResponse.json({ ok: true });
}
