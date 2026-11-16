import { db } from "@/db";
import { tenders, microRfps } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getCompaniesLite, getDemandSignals } from "@/lib/data";
import { eq } from "drizzle-orm";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const me = s.company;
  const comps = await getCompaniesLite();
  const competitors = comps.filter((c) => c.id !== me.id && c.industry === me.industry);
  const nearby = competitors.filter((c) => c.location.split(",").pop()?.trim() === me.location.split(",").pop()?.trim());
  const openT = await db.select().from(tenders).where(eq(tenders.status, "open"));
  const openM = await db.select().from(microRfps).where(eq(microRfps.status, "open"));
  const buyerIds = new Set([...openT.map((t) => t.companyId), ...openM.map((m) => m.companyId)].filter((id) => id !== me.id));
  const buyers = comps.filter((c) => buyerIds.has(c.id));
  const missing: string[] = [];
  if (!me.verified) missing.push("Business registration verification");
  if (!me.taxCompliant) missing.push("Tax compliance certificate");
  if (!me.insuranceVerified) missing.push("Insurance coverage verification");
  if (me.certifications.length === 0) missing.push("Industry certifications (ISO or equivalent)");
  if (!me.overview) missing.push("Company overview");
  const demand = await getDemandSignals();
  return Response.json({
    company: { name: me.name, industry: me.industry, location: me.location },
    competitors: nearby.length ? nearby : competitors,
    localCount: nearby.length,
    buyers,
    missing,
    trustScore: Math.round(((me.verified ? 30 : 0) + (me.taxCompliant ? 25 : 0) + (me.insuranceVerified ? 20 : 0) + Math.min(15, me.certifications.length * 5) + (me.overview ? 10 : 0))),
    demand: demand.filter((d) => d.industry.toLowerCase().includes(me.industry.split(" ")[0].toLowerCase()) || me.industry === "Construction" && d.industry === "Construction"),
    openOpportunities: openT.length + openM.length,
  });
}
