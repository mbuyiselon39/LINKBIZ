import { cookies } from "next/headers";
import { db } from "@/db";
import { users, companies, companyMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";

export const SESSION_COOKIE = "linkbiz_session";

export type Role = "admin" | "tender_manager" | "content_editor";

export type Session = {
  user: { id: number; email: string; fullName: string };
  company: typeof companies.$inferSelect;
  role: Role;
};

export async function getSession(): Promise<Session | null> {
  await ensureSeeded();
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [userIdStr, companyIdStr] = raw.split(":");
  const userId = Number(userIdStr);
  const companyId = Number(companyIdStr);
  if (!userId || !companyId) return null;

  const rows = await db
    .select({ user: users, company: companies, role: companyMembers.role })
    .from(companyMembers)
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .innerJoin(companies, eq(companies.id, companyMembers.companyId))
    .where(and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId)))
    .limit(1);
  if (!rows[0]) return null;
  return {
    user: { id: rows[0].user.id, email: rows[0].user.email, fullName: rows[0].user.fullName },
    company: rows[0].company,
    role: rows[0].role as Role,
  };
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  return s;
}

export function can(role: Role, action: "post" | "tender" | "manage") {
  if (role === "admin") return true;
  if (action === "tender") return role === "tender_manager";
  if (action === "post") return role === "content_editor" || role === "tender_manager";
  return false;
}

export function sessionCookieValue(userId: number, companyId: number) {
  return `${userId}:${companyId}`;
}
