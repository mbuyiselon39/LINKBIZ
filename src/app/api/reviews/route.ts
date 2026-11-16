import { db } from "@/db";
import { reviews, conversations } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getReviews } from "@/lib/data";
import { and, eq, or } from "drizzle-orm";

export async function GET(req: Request) {
  const companyId = Number(new URL(req.url).searchParams.get("companyId"));
  if (!companyId) return Response.json({ error: "companyId required" }, { status: 400 });
  return Response.json(await getReviews(companyId));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const target = Number(b.companyId);
  // Transaction gate: only companies with a released-escrow deal can review
  const [deal] = await db.select().from(conversations).where(and(
    eq(conversations.escrowStatus, "released"),
    or(and(eq(conversations.companyAId, s.company.id), eq(conversations.companyBId, target)), and(eq(conversations.companyAId, target), eq(conversations.companyBId, s.company.id)))
  ));
  if (!deal) return Response.json({ error: "Reviews are locked to completed contracts. Process a deal with escrow release through LinkBiz first." }, { status: 403 });
  const [r] = await db.insert(reviews).values({
    companyId: target, reviewerCompanyId: s.company.id, rating: Math.min(5, Math.max(1, Number(b.rating) || 5)),
    content: b.content || "", contractRef: `LB-CTR-${new Date().getFullYear()}-${String(deal.id).padStart(4, "0")}`, invoiceAmount: deal.escrowAmount,
  }).returning();
  return Response.json({ ok: true, review: r });
}
