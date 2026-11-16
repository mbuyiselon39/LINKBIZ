// Demo helper: switch the active session to another seeded company (acts as that company's admin).
import { db } from "@/db";
import { companyMembers } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieValue } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  await ensureSeeded();
  const { companyId } = await req.json();
  const [m] = await db.select().from(companyMembers).where(eq(companyMembers.companyId, Number(companyId)));
  if (!m) return Response.json({ error: "Company not found" }, { status: 404 });
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookieValue(m.userId, m.companyId), { httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return Response.json({ ok: true });
}
