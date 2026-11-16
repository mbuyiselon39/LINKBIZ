import { db } from "@/db";
import { reactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const postId = Number(id);
  const { type } = await req.json();
  const [existing] = await db.select().from(reactions).where(and(eq(reactions.postId, postId), eq(reactions.companyId, s.company.id)));
  if (existing && existing.type === type) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    return Response.json({ ok: true, reaction: null });
  }
  if (existing) {
    await db.update(reactions).set({ type }).where(eq(reactions.id, existing.id));
  } else {
    await db.insert(reactions).values({ postId, companyId: s.company.id, type });
  }
  return Response.json({ ok: true, reaction: type });
}
