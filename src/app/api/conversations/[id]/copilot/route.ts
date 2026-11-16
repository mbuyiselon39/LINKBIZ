import { db } from "@/db";
import { conversations, messages, tenders, benchmarks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { copilotAnalysis } from "@/lib/ai";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [c] = await db.select().from(conversations).where(eq(conversations.id, Number(id)));
  if (!c || (c.companyAId !== s.company.id && c.companyBId !== s.company.id)) return Response.json({ error: "Not found" }, { status: 404 });
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, c.id));
  const tender = c.tenderId ? (await db.select().from(tenders).where(eq(tenders.id, c.tenderId)))[0] : null;
  const bm = await db.select().from(benchmarks).where(eq(benchmarks.industry, s.company.industry));
  const terms = bm.find((b) => b.metric === "Avg payment terms")?.median ?? 30;
  const margin = bm.find((b) => b.metric === "Gross margin")?.median ?? 20;
  const analysis = copilotAnalysis(msgs.map((m) => m.content), { budgetMax: tender?.budgetMax, medianTerms: terms, medianMargin: margin });
  return Response.json(analysis);
}
