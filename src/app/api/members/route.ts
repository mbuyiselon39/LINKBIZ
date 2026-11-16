import { db } from "@/db";
import { users, companyMembers } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select({ id: companyMembers.id, role: companyMembers.role, email: users.email, fullName: users.fullName, userId: users.id })
    .from(companyMembers)
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companyMembers.companyId, s.company.id));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "admin") return Response.json({ error: "Only admins can invite team members" }, { status: 403 });
  const { email, fullName, role, password } = await req.json();
  if (!email || !fullName || !role) return Response.json({ error: "Missing fields" }, { status: 400 });
  let [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (!user) {
    [user] = await db.insert(users).values({ email: email.toLowerCase(), fullName, passwordHash: hashPassword(password || "welcome123") }).returning();
  }
  const [exists] = await db.select().from(companyMembers).where(and(eq(companyMembers.userId, user.id), eq(companyMembers.companyId, s.company.id)));
  if (exists) {
    await db.update(companyMembers).set({ role }).where(eq(companyMembers.id, exists.id));
  } else {
    await db.insert(companyMembers).values({ userId: user.id, companyId: s.company.id, role });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (s.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  await db.delete(companyMembers).where(and(eq(companyMembers.id, Number(id)), eq(companyMembers.companyId, s.company.id)));
  return Response.json({ ok: true });
}
