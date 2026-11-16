import { db } from "@/db";
import { users, companyMembers } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionCookieValue } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  await ensureSeeded();
  const { email, password } = await req.json();
  if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const [membership] = await db.select().from(companyMembers).where(eq(companyMembers.userId, user.id));
  if (!membership) return Response.json({ error: "No company linked to this account" }, { status: 403 });
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookieValue(user.id, membership.companyId), { httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return Response.json({ ok: true });
}
