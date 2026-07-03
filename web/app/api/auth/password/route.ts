import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "127.0.0.1";
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "需要登录" }, { status: 401 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`password:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `请求过于频繁，请 ${rl.retryAfterSec} 秒后重试` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请填写当前密码，新密码至少 8 位" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const db = getDb();

  const row = db
    .prepare(`SELECT password_hash FROM users WHERE id = ?`)
    .get(session.userId) as { password_hash: string } | undefined;

  if (!row) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const valid = await compare(currentPassword, row.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "当前密码错误" }, { status: 401 });
  }

  const newHash = await hash(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(
    newHash,
    session.userId
  );

  return NextResponse.json({ ok: true });
}
