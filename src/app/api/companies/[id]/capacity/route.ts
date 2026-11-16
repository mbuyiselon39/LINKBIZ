import { db } from "@/db";
import { companies } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  const { id } = await params;
  if (!s || s.company.id !== Number(id)) return Response.json({ error: "Only the company can update its capacity" }, { status: 403 });
  const b = await req.json();
  const patch: Record<string, unknown> = {};
  if (["available", "limited", "full"].includes(b.capacityStatus)) patch.capacityStatus = b.capacityStatus;
  if (typeof b.capacityNote === "string") patch.capacityNote = b.capacityNote;
  if (typeof b.leadTime === "string") patch.leadTime = b.leadTime;
  await db.update(companies).set(patch).where(eq(companies.id, s.company.id));
  return Response.json({ ok: true });
}
