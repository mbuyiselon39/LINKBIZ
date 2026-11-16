import { db } from "@/db";
import { connections } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const target = Number(id);
  if (target === s.company.id) return Response.json({ error: "Cannot follow yourself" }, { status: 400 });
  const [existing] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.requesterId, s.company.id), eq(connections.receiverId, target), eq(connections.kind, "follow")));
  if (existing) {
    await db.delete(connections).where(eq(connections.id, existing.id));
    return Response.json({ ok: true, following: false });
  }
  await db.insert(connections).values({ requesterId: s.company.id, receiverId: target, kind: "follow", status: "accepted" });
  return Response.json({ ok: true, following: true });
}
