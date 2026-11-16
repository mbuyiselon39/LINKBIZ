import { db } from "@/db";
import { microRfps } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getMicroRfps } from "@/lib/data";

export async function GET() {
  const s = await getSession();
  return Response.json(await getMicroRfps(s?.company.id));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.title || !b.description || !b.budget) return Response.json({ error: "Title, description and budget are required" }, { status: 400 });
  const [row] = await db.insert(microRfps).values({
    companyId: s.company.id,
    title: b.title,
    category: b.category || s.company.industry,
    location: b.location || s.company.location,
    budget: Number(b.budget),
    durationDays: Number(b.durationDays) || 7,
    description: b.description,
    expiresAt: new Date(Date.now() + (Number(b.expiresInDays) || 7) * 86400000),
  }).returning();
  return Response.json({ ok: true, micro: row });
}
