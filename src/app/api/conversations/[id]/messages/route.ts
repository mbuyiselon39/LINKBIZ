import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getMessages } from "@/lib/data";
import { eq } from "drizzle-orm";

async function authorized(id: number, companyId: number) {
  const [c] = await db.select().from(conversations).where(eq(conversations.id, id));
  return c && (c.companyAId === companyId || c.companyBId === companyId) ? c : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await authorized(Number(id), s.company.id))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await getMessages(Number(id)));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const conv = await authorized(Number(id), s.company.id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
  const { content, attachment } = await req.json();
  if (!content?.trim() && !attachment) return Response.json({ error: "Empty message" }, { status: 400 });
  const [m] = await db
    .insert(messages)
    .values({ conversationId: conv.id, senderCompanyId: s.company.id, content: content?.trim() || `Shared a file`, attachment: attachment || null })
    .returning();
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conv.id));
  return Response.json({ ok: true, message: m });
}
