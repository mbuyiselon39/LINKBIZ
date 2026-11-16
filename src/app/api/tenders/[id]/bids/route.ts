import { db } from "@/db";
import { tenderBids, tenders, conversations, messages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rows = await db.select().from(tenderBids).where(and(eq(tenderBids.tenderId, Number(id)), eq(tenderBids.companyId, s.company.id)));
  return Response.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tenderId = Number(id);
  const [tender] = await db.select().from(tenders).where(eq(tenders.id, tenderId));
  if (!tender) return Response.json({ error: "Tender not found" }, { status: 404 });
  if (tender.companyId === s.company.id) return Response.json({ error: "You cannot bid on your own tender" }, { status: 400 });
  if (new Date(tender.deadline) < new Date()) return Response.json({ error: "This tender has closed" }, { status: 400 });
  const b = await req.json();
  if (!b.coverLetter?.trim()) return Response.json({ error: "A cover letter / proposal summary is required" }, { status: 400 });

  const [bid] = await db
    .insert(tenderBids)
    .values({
      tenderId,
      companyId: s.company.id,
      type: b.type === "eoi" ? "eoi" : "bid",
      amount: b.amount ? Number(b.amount) : null,
      coverLetter: b.coverLetter.trim(),
      attachments: b.attachments || [],
      includeProfile: b.includeProfile !== false,
      includePortfolio: b.includePortfolio !== false,
    })
    .returning();

  // Open a tender discussion deal room automatically
  const [conv] = await db
    .insert(conversations)
    .values({ companyAId: s.company.id, companyBId: tender.companyId, kind: "tender", tenderId, subject: `${bid.type === "eoi" ? "EOI" : "Bid"}: ${tender.title}` })
    .returning();
  await db.insert(messages).values({
    conversationId: conv.id,
    senderCompanyId: s.company.id,
    content: `${s.company.name} has submitted ${bid.type === "eoi" ? "an Expression of Interest" : "a bid"}${bid.amount ? ` of $${bid.amount.toLocaleString()}` : ""} for "${tender.title}".\n\n${bid.coverLetter}`,
    attachment: bid.attachments[0] ? { name: bid.attachments[0], size: "PDF" } : null,
  });
  return Response.json({ ok: true, bid, conversationId: conv.id });
}
