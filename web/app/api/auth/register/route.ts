import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.email().max(256),
  password: z.string().min(8).max(200),
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
    return NextResponse.json(
      { error: "请填写有效邮箱，密码至少 8 位" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;
  const passwordHash = await hash(password, 10);
  const id = randomUUID();
  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`
    ).run(id, email, passwordHash, Date.now());
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }
    throw e;
  }
  await createSessionCookie(id, email);
  return NextResponse.json({ ok: true });
}
