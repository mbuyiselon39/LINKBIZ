import { db } from "@/db";
import { connections } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { companyId, kind } = await req.json();
  if (!companyId || !["vendor", "partner"].includes(kind)) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (Number(companyId) === s.company.id) return Response.json({ error: "Cannot connect to yourself" }, { status: 400 });
  const [existing] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.requesterId, s.company.id), eq(connections.receiverId, Number(companyId)), eq(connections.kind, kind)));
  if (existing) return Response.json({ ok: true, connection: existing });
  const [c] = await db.insert(connections).values({ requesterId: s.company.id, receiverId: Number(companyId), kind, status: "pending" }).returning();
  return Response.json({ ok: true, connection: c });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, action } = await req.json();
  const [c] = await db.select().from(connections).where(eq(connections.id, Number(id)));
  if (!c || (c.receiverId !== s.company.id && c.requesterId !== s.company.id)) return Response.json({ error: "Not found" }, { status: 404 });
  if (action === "accept" && c.receiverId === s.company.id) {
    await db.update(connections).set({ status: "accepted" }).where(eq(connections.id, c.id));
  } else {
    await db.delete(connections).where(eq(connections.id, c.id));
  }
  return Response.json({ ok: true });
}
