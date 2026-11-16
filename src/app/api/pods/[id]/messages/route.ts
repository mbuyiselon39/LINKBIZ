import { db } from "@/db";
import { podMessages, podMembers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [member] = await db.select().from(podMembers).where(and(eq(podMembers.podId, Number(id)), eq(podMembers.companyId, s.company.id)));
  if (!member) return Response.json({ error: "Join the pod first" }, { status: 403 });
  const { content } = await req.json();
  if (!content?.trim()) return Response.json({ error: "Empty message" }, { status: 400 });
  const [m] = await db.insert(podMessages).values({ podId: Number(id), companyId: s.company.id, content: content.trim() }).returning();
  return Response.json({ ok: true, message: m });
}
