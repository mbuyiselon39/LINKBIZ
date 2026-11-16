import { db } from "@/db";
import { users, companies, companyMembers, services } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionCookieValue } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  await ensureSeeded();
  const b = await req.json();
  const required = ["companyName", "registrationId", "industry", "size", "location", "email", "password", "fullName"];
  for (const k of required) if (!b[k]) return Response.json({ error: `${k} is required` }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.email, b.email));
  if (existing.length) return Response.json({ error: "An account with this email already exists" }, { status: 409 });

  let slug = slugify(b.companyName);
  const clash = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug));
  if (clash.length) slug = `${slug}-${Date.now().toString(36)}`;

  const [user] = await db
    .insert(users)
    .values({ email: b.email, passwordHash: hashPassword(b.password), fullName: b.fullName })
    .returning();
  const [company] = await db
    .insert(companies)
    .values({
      slug,
      name: b.companyName,
      registrationId: b.registrationId,
      industry: b.industry,
      size: b.size,
      location: b.location,
      email: b.email,
      website: b.website || null,
      tagline: b.tagline || `${b.industry} company based in ${b.location}`,
      overview: b.overview || null,
      coverUrl: "/covers/default.jpg",
    })
    .returning();
  await db.insert(companyMembers).values({ companyId: company.id, userId: user.id, role: "admin" });
  if (Array.isArray(b.services) && b.services.length) {
    await db.insert(services).values(b.services.slice(0, 6).map((sv: { title: string; category: string; description: string; tags?: string[] }) => ({
      companyId: company.id, title: sv.title, category: sv.category, description: sv.description, tags: sv.tags ?? [],
    })));
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookieValue(user.id, company.id), { httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return Response.json({ ok: true, companySlug: company.slug });
}
