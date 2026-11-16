import { db } from "@/db";
import { resources } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getResources } from "@/lib/data";

export async function GET() {
  return Response.json(await getResources());
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.title || !b.rate) return Response.json({ error: "Title and rate are required" }, { status: 400 });
  const [r] = await db.insert(resources).values({
    companyId: s.company.id,
    type: ["warehouse", "shipping", "executive", "equipment"].includes(b.type) ? b.type : "equipment",
    title: b.title, description: b.description || "", location: b.location || s.company.location,
    rate: Number(b.rate), unit: b.unit || "$/day",
  }).returning();
  return Response.json({ ok: true, resource: r });
}
