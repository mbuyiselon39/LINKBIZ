import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getConversations } from "@/lib/data";
import { and, eq, or } from "drizzle-orm";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getConversations(s.company.id));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { companyId, kind, tenderId, subject, content } = await req.json();
  const other = Number(companyId);
  if (!other || other === s.company.id) return Response.json({ error: "Invalid company" }, { status: 400 });
  const k = kind === "tender" ? "tender" : "general";
  const pair = or(
    and(eq(conversations.companyAId, s.company.id), eq(conversations.companyBId, other)),
    and(eq(conversations.companyAId, other), eq(conversations.companyBId, s.company.id))
  );
  const conds = [pair!, eq(conversations.kind, k)];
  if (tenderId) conds.push(eq(conversations.tenderId, Number(tenderId)));
  let [conv] = await db.select().from(conversations).where(and(...conds));
  if (!conv) {
    [conv] = await db
      .insert(conversations)
      .values({ companyAId: s.company.id, companyBId: other, kind: k, tenderId: tenderId ? Number(tenderId) : null, subject: subject || (k === "tender" ? "Tender discussion" : "General inquiry") })
      .returning();
  }
  if (content?.trim()) {
    await db.insert(messages).values({ conversationId: conv.id, senderCompanyId: s.company.id, content: content.trim() });
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conv.id));
  }
  return Response.json({ ok: true, conversationId: conv.id });
}
