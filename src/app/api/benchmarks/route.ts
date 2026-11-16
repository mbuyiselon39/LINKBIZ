import { db } from "@/db";
import { companies, benchmarkSubmissions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getBenchmarkData } from "@/lib/data";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ optIn: s.company.benchmarkOptIn, rows: await getBenchmarkData(s.company) });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (typeof b.optIn === "boolean") {
    await db.update(companies).set({ benchmarkOptIn: b.optIn }).where(eq(companies.id, s.company.id));
  }
  if (b.metric && b.value !== undefined) {
    const [existing] = await db.select().from(benchmarkSubmissions).where(and(eq(benchmarkSubmissions.companyId, s.company.id), eq(benchmarkSubmissions.metric, b.metric)));
    if (existing) await db.update(benchmarkSubmissions).set({ value: Number(b.value), updatedAt: new Date() }).where(eq(benchmarkSubmissions.id, existing.id));
    else await db.insert(benchmarkSubmissions).values({ companyId: s.company.id, metric: b.metric, value: Number(b.value) });
  }
  return Response.json({ ok: true });
}
