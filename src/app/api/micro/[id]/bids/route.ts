import { db } from "@/db";
import { microBids, microRfps, conversations, messages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [rfp] = await db.select().from(microRfps).where(eq(microRfps.id, Number(id)));
  if (!rfp || rfp.status !== "open") return Response.json({ error: "Micro-RFP not found or closed" }, { status: 404 });
  if (rfp.companyId === s.company.id) return Response.json({ error: "You cannot bid on your own request" }, { status: 400 });
  const b = await req.json();
  if (!b.amount || !b.message) return Response.json({ error: "Amount and message are required" }, { status: 400 });
  const [bid] = await db.insert(microBids).values({
    microRfpId: rfp.id, companyId: s.company.id, amount: Number(b.amount), timelineDays: Number(b.timelineDays) || rfp.durationDays, message: b.message,
  }).returning();
  const [conv] = await db.insert(conversations).values({ companyAId: s.company.id, companyBId: rfp.companyId, kind: "tender", subject: `Micro-RFP: ${rfp.title}` }).returning();
  await db.insert(messages).values({ conversationId: conv.id, senderCompanyId: s.company.id, content: `Structured bid for "${rfp.title}": $${Number(b.amount).toLocaleString()}, ${bid.timelineDays} days.\n\n${b.message}` });
  return Response.json({ ok: true, bid, conversationId: conv.id });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [rfp] = await db.select().from(microRfps).where(eq(microRfps.id, Number(id)));
  if (!rfp || rfp.companyId !== s.company.id) return Response.json({ error: "Not your request" }, { status: 403 });
  const { bidId, action } = await req.json();
  await db.update(microBids).set({ status: action === "accept" ? "accepted" : "declined" }).where(eq(microBids.id, Number(bidId)));
  if (action === "accept") await db.update(microRfps).set({ status: "awarded" }).where(eq(microRfps.id, rfp.id));
  return Response.json({ ok: true });
}
