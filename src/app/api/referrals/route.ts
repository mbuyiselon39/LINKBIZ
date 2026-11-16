import { db } from "@/db";
import { referrals, companies, comments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getReferrals } from "@/lib/data";
import { eq } from "drizzle-orm";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getReferrals(s.company.id));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { companyId, note, postId, buyerCompanyId } = await req.json();
  const [target] = await db.select().from(companies).where(eq(companies.id, Number(companyId)));
  if (!target || target.id === s.company.id) return Response.json({ error: "Pick another business" }, { status: 400 });
  const [r] = await db.insert(referrals).values({
    referrerCompanyId: s.company.id, referredCompanyId: target.id, buyerCompanyId: buyerCompanyId ? Number(buyerCompanyId) : null,
    note: note || `Recommended ${target.name}.`, commissionPct: target.referralPct, postId: postId ? Number(postId) : null,
  }).returning();
  if (postId) {
    await db.insert(comments).values({ postId: Number(postId), companyId: s.company.id, content: `We recommend ${target.name} for this. Tracked referral${target.referralPct ? ` - ${target.referralPct}% commission on conversion` : ""}.` });
  }
  return Response.json({ ok: true, referral: r });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json();
  const [r] = await db.select().from(referrals).where(eq(referrals.id, Number(id)));
  if (!r || (r.referrerCompanyId !== s.company.id && r.referredCompanyId !== s.company.id)) return Response.json({ error: "Not found" }, { status: 404 });
  await db.update(referrals).set({ status: ["converted", "credited"].includes(status) ? status : "tracked" }).where(eq(referrals.id, r.id));
  return Response.json({ ok: true });
}
