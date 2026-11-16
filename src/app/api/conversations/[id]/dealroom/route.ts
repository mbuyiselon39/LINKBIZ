import { db } from "@/db";
import { conversations, messages, type Milestone, type RoomDoc } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

async function room(id: number, companyId: number) {
  const [c] = await db.select().from(conversations).where(eq(conversations.id, id));
  return c && (c.companyAId === companyId || c.companyBId === companyId) ? c : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const c = await room(Number(id), s.company.id);
  if (!c) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ isDealRoom: c.isDealRoom, ndaStatus: c.ndaStatus, milestones: c.milestones, documents: c.documents, escrowAmount: c.escrowAmount, escrowStatus: c.escrowStatus });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const c = await room(Number(id), s.company.id);
  if (!c) return Response.json({ error: "Not found" }, { status: 404 });
  const b = await req.json();
  const log = async (text: string) => {
    await db.insert(messages).values({ conversationId: c.id, senderCompanyId: s.company.id, content: text });
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, c.id));
  };

  if (b.action === "convert") {
    await db.update(conversations).set({ isDealRoom: true }).where(eq(conversations.id, c.id));
    await log(`[Deal Room] ${s.company.name} converted this thread into a structured Deal Room.`);
  } else if (b.action === "nda") {
    const next = c.ndaStatus === "none" ? "sent" : c.ndaStatus === "sent" ? "signed" : "signed";
    await db.update(conversations).set({ ndaStatus: next }).where(eq(conversations.id, c.id));
    await log(next === "sent" ? `[NDA] ${s.company.name} sent the mutual NDA for e-signature.` : `[NDA] ${s.company.name} e-signed the NDA. Both parties are now covered.`);
  } else if (b.action === "doc") {
    const doc: RoomDoc = { name: b.name, size: b.size || "PDF", by: s.company.id, at: new Date().toISOString() };
    await db.update(conversations).set({ documents: [...c.documents, doc] }).where(eq(conversations.id, c.id));
    await log(`[Docs] ${s.company.name} added "${doc.name}" to the shared folder.`);
  } else if (b.action === "milestone") {
    const ms: Milestone[] = c.milestones.map((m, i) => (i === Number(b.index) ? { ...m, done: !m.done } : m));
    await db.update(conversations).set({ milestones: ms }).where(eq(conversations.id, c.id));
    const m = ms[Number(b.index)];
    await log(`[Milestone] "${m.title}" marked ${m.done ? "complete" : "in progress"} by ${s.company.name}.`);
  } else if (b.action === "addMilestone") {
    const ms: Milestone[] = [...c.milestones, { title: b.title, amount: Number(b.amount) || 0, done: false }];
    await db.update(conversations).set({ milestones: ms }).where(eq(conversations.id, c.id));
  } else if (b.action === "escrow") {
    if (b.op === "fund") {
      await db.update(conversations).set({ escrowAmount: Number(b.amount) || c.escrowAmount, escrowStatus: "funded" }).where(eq(conversations.id, c.id));
      await log(`[Escrow] ${s.company.name} funded $${(Number(b.amount) || c.escrowAmount).toLocaleString()} into LinkBiz escrow. Funds are held until milestones are verified.`);
    } else if (b.op === "release" && c.escrowStatus === "funded") {
      await db.update(conversations).set({ escrowStatus: "released" }).where(eq(conversations.id, c.id));
      await log(`[Escrow] $${c.escrowAmount.toLocaleString()} released to the supplier. Payout lands in 1 business day. A transaction-verified review can now be left.`);
    }
  }
  const [updated] = await db.select().from(conversations).where(eq(conversations.id, c.id));
  return Response.json({ ok: true, room: updated });
}
