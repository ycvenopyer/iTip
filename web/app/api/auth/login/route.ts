import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.email().max(256),
  password: z.string().max(200),
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "127.0.0.1";
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  const rl = rateLimit(`login:${ip}`, 10, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${rl.retryAfterSec} 秒后重试` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请填写有效邮箱与密码" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  // 邮箱级别限速（防止针对特定邮箱的爆破）
  const emailRl = rateLimit(`login-email:${email.toLowerCase()}`, 5, 5 * 60 * 1000);
  if (!emailRl.allowed) {
    return NextResponse.json(
      { error: "该邮箱登录尝试过于频繁，请稍后重试" },
      { status: 429, headers: { "Retry-After": String(emailRl.retryAfterSec) } }
    );
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT id, email, password_hash FROM users WHERE email = ?`)
    .get(email) as { id: string; email: string; password_hash: string } | undefined;

  if (!row) {
    return NextResponse.json(
      { error: "邮箱或密码错误" },
      { status: 401 }
    );
  }

  const valid = await compare(password, row.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "邮箱或密码错误" },
      { status: 401 }
    );
  }

  await createSessionCookie(row.id, row.email);
  return NextResponse.json({ ok: true });
}
