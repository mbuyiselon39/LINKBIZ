import { db } from "@/db";
import { agentMatches, tenders, microRfps, posts, services, achievements } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getCompaniesLite } from "@/lib/data";
import { scoreMatch, buildPitch, buildProposalOutline } from "@/lib/ai";
import { and, eq, ne } from "drizzle-orm";
import { money } from "@/lib/format";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const me = s.company;
  const [svc, ach, openT, openM, buyPosts, comps] = await Promise.all([
    db.select().from(services).where(eq(services.companyId, me.id)),
    db.select().from(achievements).where(eq(achievements.companyId, me.id)),
    db.select().from(tenders).where(and(eq(tenders.status, "open"), ne(tenders.companyId, me.id))),
    db.select().from(microRfps).where(and(eq(microRfps.status, "open"), ne(microRfps.companyId, me.id))),
    db.select().from(posts).where(and(eq(posts.type, "buy"), ne(posts.companyId, me.id))),
    getCompaniesLite(),
  ]);
  const tags = svc.flatMap((x) => x.tags);
  const targets = [
    ...openT.map((t) => ({ sourceType: "tender" as const, sourceId: t.id, ownerId: t.companyId, title: t.title, category: t.category, region: t.region, text: `${t.title} ${t.summary} ${t.scope}`, budget: `${money(t.budgetMin, t.currency)}-${money(t.budgetMax, t.currency)}`, tender: t })),
    ...openM.map((m) => ({ sourceType: "micro" as const, sourceId: m.id, ownerId: m.companyId, title: m.title, category: m.category, region: m.location, text: `${m.title} ${m.description}`, budget: money(m.budget), tender: null })),
    ...buyPosts.map((p) => ({ sourceType: "buy" as const, sourceId: p.id, ownerId: p.companyId, title: p.content.slice(0, 90), category: comps.find((c) => c.id === p.companyId)?.industry ?? "Professional Services", region: "Global", text: p.content, budget: undefined, tender: null })),
  ];
  const scored = targets
    .map((t) => ({ ...t, score: scoreMatch(me, tags, t) }))
    .filter((t) => t.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  for (const t of scored) {
    const owner = comps.find((c) => c.id === t.ownerId);
    const pitch = buildPitch(me, svc.map((x) => x.title), { title: t.title, company: owner?.name ?? "team", budget: t.budget });
    const outline = t.tender ? buildProposalOutline(me, svc, ach, t.tender) : null;
    const [existing] = await db.select().from(agentMatches).where(and(eq(agentMatches.companyId, me.id), eq(agentMatches.sourceType, t.sourceType), eq(agentMatches.sourceId, t.sourceId)));
    if (existing) {
      await db.update(agentMatches).set({ score: t.score, pitch, outline }).where(eq(agentMatches.id, existing.id));
    } else {
      await db.insert(agentMatches).values({ companyId: me.id, sourceType: t.sourceType, sourceId: t.sourceId, score: t.score, pitch, outline });
    }
  }
  const rows = await db.select().from(agentMatches).where(eq(agentMatches.companyId, me.id));
  const live = rows
    .map((r) => {
      const t = scored.find((x) => x.sourceType === r.sourceType && x.sourceId === r.sourceId);
      const owner = t ? comps.find((c) => c.id === t.ownerId) : comps.find((c) => c.id === (openT.find((x) => x.id === r.sourceId)?.companyId ?? openM.find((x) => x.id === r.sourceId)?.companyId ?? buyPosts.find((x) => x.id === r.sourceId)?.companyId));
      return t || r.status !== "new" ? { ...r, title: t?.title ?? r.pitch.split('"')[1] ?? "Match", owner, category: t?.category ?? "", budget: t?.budget ?? null, live: !!t } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score);
  return Response.json(live);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, action } = await req.json();
  const [m] = await db.select().from(agentMatches).where(and(eq(agentMatches.id, Number(id)), eq(agentMatches.companyId, s.company.id)));
  if (!m) return Response.json({ error: "Match not found" }, { status: 404 });
  if (action === "dismiss") {
    await db.update(agentMatches).set({ status: "dismissed" }).where(eq(agentMatches.id, m.id));
    return Response.json({ ok: true });
  }
  if (action === "pitch") {
    const ownerId =
      m.sourceType === "tender" ? (await db.select().from(tenders).where(eq(tenders.id, m.sourceId)))[0]?.companyId
      : m.sourceType === "micro" ? (await db.select().from(microRfps).where(eq(microRfps.id, m.sourceId)))[0]?.companyId
      : (await db.select().from(posts).where(eq(posts.id, m.sourceId)))[0]?.companyId;
    if (!ownerId) return Response.json({ error: "Source no longer available" }, { status: 404 });
    const { conversations, messages } = await import("@/db/schema");
    const [conv] = await db.insert(conversations).values({ companyAId: s.company.id, companyBId: ownerId, kind: "general", subject: `AI Agent intro: ${m.pitch.split('"')[1]?.slice(0, 60) ?? "opportunity"}` }).returning();
    await db.insert(messages).values({ conversationId: conv.id, senderCompanyId: s.company.id, content: m.pitch });
    await db.update(agentMatches).set({ status: "pitched" }).where(eq(agentMatches.id, m.id));
    return Response.json({ ok: true, conversationId: conv.id });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
