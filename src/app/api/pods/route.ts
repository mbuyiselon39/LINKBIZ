import { db } from "@/db";
import { podMembers, pods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPods } from "@/lib/data";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getPods(s.company.id));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { podId, action } = await req.json();
  const [pod] = await db.select().from(pods).where(eq(pods.id, Number(podId)));
  if (!pod) return Response.json({ error: "Pod not found" }, { status: 404 });
  const [member] = await db.select().from(podMembers).where(and(eq(podMembers.podId, pod.id), eq(podMembers.companyId, s.company.id)));
  if (action === "leave") {
    if (member) await db.delete(podMembers).where(eq(podMembers.id, member.id));
    return Response.json({ ok: true });
  }
  if (member) return Response.json({ ok: true });
  const all = await db.select().from(podMembers).where(eq(podMembers.podId, pod.id));
  if (all.length >= pod.memberLimit) return Response.json({ error: "Pod is full (vetted, capped membership)" }, { status: 400 });
  const clash = await db.select().from(podMembers).innerJoin(pods, eq(pods.id, podMembers.podId)).where(and(eq(podMembers.companyId, s.company.id), eq(pods.industry, pod.industry)));
  if (clash.length) return Response.json({ error: "Non-competing rule: you already sit in a pod for this industry" }, { status: 400 });
  await db.insert(podMembers).values({ podId: pod.id, companyId: s.company.id });
  return Response.json({ ok: true });
}
