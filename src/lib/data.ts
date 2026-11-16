import { db } from "@/db";
import {
  companies,
  posts,
  tenders,
  reactions,
  comments,
  connections,
  services,
  achievements,
  tenderBids,
  conversations,
  messages,
  alerts,
  reviews,
  microRfps,
  microBids,
  benchmarks,
  benchmarkSubmissions,
  pods,
  podMembers,
  podMessages,
  resources,
  referrals,
  invoices,
  agentMatches,
} from "@/db/schema";
import { and, desc, eq, inArray, or, sql, gte, lte, ilike } from "drizzle-orm";
import { ensureSeeded } from "@/db/seed";

export type Company = typeof companies.$inferSelect;
export type Tender = typeof tenders.$inferSelect;
export type Post = typeof posts.$inferSelect;

export type CompanyLite = Pick<
  Company,
  "id" | "slug" | "name" | "logoUrl" | "industry" | "location" | "verified" | "tagline" | "followerCount"
>;

export type FeedPost = Post & {
  company: CompanyLite;
  tender: Tender | null;
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  commentCount: number;
  comments: { id: number; content: string; createdAt: Date; company: CompanyLite }[];
};

export type TenderWithCompany = Tender & { company: CompanyLite; bidCount: number };

const liteCols = {
  id: companies.id,
  slug: companies.slug,
  name: companies.name,
  logoUrl: companies.logoUrl,
  industry: companies.industry,
  location: companies.location,
  verified: companies.verified,
  tagline: companies.tagline,
  followerCount: companies.followerCount,
};

export async function getCompaniesLite(ids?: number[]): Promise<CompanyLite[]> {
  await ensureSeeded();
  if (ids && ids.length === 0) return [];
  const q = db.select(liteCols).from(companies);
  return ids ? q.where(inArray(companies.id, ids)) : q.orderBy(desc(companies.followerCount));
}

export async function getFeed(opts: { type?: string; companyId?: number; viewerId?: number | null }): Promise<FeedPost[]> {
  await ensureSeeded();
  const conds = [];
  if (opts.type && opts.type !== "all") conds.push(eq(posts.type, opts.type));
  if (opts.companyId) conds.push(eq(posts.companyId, opts.companyId));
  const rows = await db
    .select()
    .from(posts)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(50);
  if (rows.length === 0) return [];
  const postIds = rows.map((p) => p.id);
  const tenderIds = rows.map((p) => p.tenderId).filter((x): x is number => !!x);

  const [rx, cm, tn] = await Promise.all([
    db.select().from(reactions).where(inArray(reactions.postId, postIds)),
    db.select().from(comments).where(inArray(comments.postId, postIds)).orderBy(comments.createdAt),
    tenderIds.length ? db.select().from(tenders).where(inArray(tenders.id, tenderIds)) : Promise.resolve([] as Tender[]),
  ]);
  const compIds = Array.from(new Set([...rows.map((p) => p.companyId), ...cm.map((c) => c.companyId)]));
  const comps = await getCompaniesLite(compIds);
  const cmap = new Map(comps.map((c) => [c.id, c]));

  return rows.map((p) => {
    const prx = rx.filter((r) => r.postId === p.id);
    const counts: Record<string, number> = {};
    for (const r of prx) counts[r.type] = (counts[r.type] ?? 0) + 1;
    const pc = cm.filter((c) => c.postId === p.id);
    return {
      ...p,
      company: cmap.get(p.companyId)!,
      tender: tn.find((t) => t.id === p.tenderId) ?? null,
      reactionCounts: counts,
      myReaction: opts.viewerId ? prx.find((r) => r.companyId === opts.viewerId)?.type ?? null : null,
      commentCount: pc.length,
      comments: pc.map((c) => ({ id: c.id, content: c.content, createdAt: c.createdAt, company: cmap.get(c.companyId)! })),
    };
  });
}

export type TenderFilters = {
  q?: string;
  category?: string;
  region?: string;
  type?: string;
  budgetMin?: number;
  budgetMax?: number;
  deadlineWithin?: number; // days
  companyId?: number;
};

export async function getTenders(f: TenderFilters = {}): Promise<TenderWithCompany[]> {
  await ensureSeeded();
  const conds = [eq(tenders.status, "open")];
  if (f.q) conds.push(or(ilike(tenders.title, `%${f.q}%`), ilike(tenders.summary, `%${f.q}%`))!);
  if (f.category) conds.push(eq(tenders.category, f.category));
  if (f.region) conds.push(eq(tenders.region, f.region));
  if (f.type) conds.push(eq(tenders.type, f.type));
  if (f.budgetMin) conds.push(gte(tenders.budgetMax, f.budgetMin));
  if (f.budgetMax) conds.push(lte(tenders.budgetMin, f.budgetMax));
  if (f.deadlineWithin) conds.push(lte(tenders.deadline, new Date(Date.now() + f.deadlineWithin * 86400000)));
  if (f.companyId) conds.push(eq(tenders.companyId, f.companyId));
  const rows = await db.select().from(tenders).where(and(...conds)).orderBy(tenders.deadline);
  if (!rows.length) return [];
  const comps = await getCompaniesLite(Array.from(new Set(rows.map((r) => r.companyId))));
  const bids = await db
    .select({ tenderId: tenderBids.tenderId, c: sql<number>`count(*)::int` })
    .from(tenderBids)
    .where(inArray(tenderBids.tenderId, rows.map((r) => r.id)))
    .groupBy(tenderBids.tenderId);
  return rows.map((t) => ({
    ...t,
    company: comps.find((c) => c.id === t.companyId)!,
    bidCount: bids.find((b) => b.tenderId === t.id)?.c ?? 0,
  }));
}

export async function getTender(id: number) {
  const [t] = await getTenders({}).then((all) => all.filter((x) => x.id === id));
  if (t) return t;
  // closed tenders
  const [row] = await db.select().from(tenders).where(eq(tenders.id, id));
  if (!row) return null;
  const [c] = await getCompaniesLite([row.companyId]);
  return { ...row, company: c, bidCount: 0 } as TenderWithCompany;
}

export async function getCompanyBySlug(slug: string) {
  await ensureSeeded();
  const [c] = await db.select().from(companies).where(eq(companies.slug, slug));
  return c ?? null;
}

export async function getCompanyProfile(slug: string, viewerId?: number | null) {
  const c = await getCompanyBySlug(slug);
  if (!c) return null;
  const [svc, ach, tnd, isFollowing, followerIds] = await Promise.all([
    db.select().from(services).where(eq(services.companyId, c.id)),
    db.select().from(achievements).where(eq(achievements.companyId, c.id)).orderBy(desc(achievements.year)),
    getTenders({ companyId: c.id }),
    viewerId
      ? db
          .select({ id: connections.id })
          .from(connections)
          .where(and(eq(connections.requesterId, viewerId), eq(connections.receiverId, c.id), eq(connections.kind, "follow")))
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(connections)
      .where(and(eq(connections.receiverId, c.id), eq(connections.kind, "follow"))),
  ]);
  return { company: c, services: svc, achievements: ach, tenders: tnd, isFollowing, followers: c.followerCount + (followerIds[0]?.c ?? 0) };
}

export async function getCompanyStats(companyId: number) {
  const [postCount, tenderCount, bidCount, followers, connCount] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(posts).where(eq(posts.companyId, companyId)),
    db.select({ c: sql<number>`count(*)::int` }).from(tenders).where(and(eq(tenders.companyId, companyId), eq(tenders.status, "open"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tenderBids).where(eq(tenderBids.companyId, companyId)),
    db.select({ c: sql<number>`count(*)::int` }).from(connections).where(and(eq(connections.receiverId, companyId), eq(connections.kind, "follow"))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(connections)
      .where(and(or(eq(connections.receiverId, companyId), eq(connections.requesterId, companyId)), eq(connections.status, "accepted"), inArray(connections.kind, ["vendor", "partner"]))),
  ]);
  return {
    posts: postCount[0].c,
    openTenders: tenderCount[0].c,
    bids: bidCount[0].c,
    followers: followers[0].c,
    connections: connCount[0].c,
  };
}

export async function getNetwork(companyId: number) {
  await ensureSeeded();
  const all = await db
    .select()
    .from(connections)
    .where(or(eq(connections.requesterId, companyId), eq(connections.receiverId, companyId)));
  const otherId = (c: typeof all[number]) => (c.requesterId === companyId ? c.receiverId : c.requesterId);
  const ids = Array.from(new Set(all.map(otherId)));
  const comps = await getCompaniesLite(ids);
  const cm = new Map(comps.map((c) => [c.id, c]));
  const build = (kind: string, status?: string) =>
    all
      .filter((c) => c.kind === kind && (!status || c.status === status))
      .map((c) => ({ ...c, company: cm.get(otherId(c))!, incoming: c.receiverId === companyId }))
      .filter((c) => c.company);
  const vendors = build("vendor", "accepted");
  const partners = build("partner", "accepted");
  const pending = [...build("vendor", "pending"), ...build("partner", "pending")];
  const followers = all
    .filter((c) => c.kind === "follow" && c.receiverId === companyId)
    .map((c) => cm.get(c.requesterId)!)
    .filter(Boolean);
  const connectedIds = new Set([...ids, companyId]);
  const discover = (await getCompaniesLite()).filter((c) => !connectedIds.has(c.id) || (!vendors.some((v) => v.company.id === c.id) && !partners.some((p) => p.company.id === c.id) && !pending.some((p) => p.company.id === c.id) && c.id !== companyId));
  return { vendors, partners, pending, followers, discover };
}

export async function getConversations(companyId: number) {
  await ensureSeeded();
  const convs = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.companyAId, companyId), eq(conversations.companyBId, companyId)))
    .orderBy(desc(conversations.updatedAt));
  if (!convs.length) return [];
  const otherIds = convs.map((c) => (c.companyAId === companyId ? c.companyBId : c.companyAId));
  const comps = await getCompaniesLite(Array.from(new Set(otherIds)));
  const lastMsgs = await db
    .select()
    .from(messages)
    .where(inArray(messages.conversationId, convs.map((c) => c.id)))
    .orderBy(desc(messages.createdAt));
  return convs.map((c) => ({
    ...c,
    other: comps.find((x) => x.id === (c.companyAId === companyId ? c.companyBId : c.companyAId))!,
    lastMessage: lastMsgs.find((m) => m.conversationId === c.id) ?? null,
  }));
}

export async function getMessages(conversationId: number) {
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

/* ───────────── Trust, deal flow, intelligence, community ───────────── */

export async function getReviews(companyId: number) {
  await ensureSeeded();
  const rows = await db.select().from(reviews).where(eq(reviews.companyId, companyId)).orderBy(desc(reviews.createdAt));
  const comps = await getCompaniesLite(Array.from(new Set(rows.map((r) => r.reviewerCompanyId))));
  return rows.map((r) => ({ ...r, reviewer: comps.find((c) => c.id === r.reviewerCompanyId)! }));
}

export async function getMicroRfps(companyId?: number) {
  await ensureSeeded();
  const rows = await db.select().from(microRfps).orderBy(desc(microRfps.createdAt));
  const comps = await getCompaniesLite(Array.from(new Set(rows.map((r) => r.companyId))));
  const bids = await db.select().from(microBids);
  const bidderComps = await getCompaniesLite(Array.from(new Set(bids.map((b) => b.companyId))));
  return rows
    .filter((r) => !companyId || r.companyId === companyId || r.status === "open")
    .map((r) => ({
      ...r,
      company: comps.find((c) => c.id === r.companyId)!,
      bids: bids.filter((b) => b.microRfpId === r.id).map((b) => ({ ...b, company: bidderComps.find((c) => c.id === b.companyId)! })),
    }));
}

export async function getAlerts(industry?: string) {
  await ensureSeeded();
  const rows = await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  return industry ? rows.filter((a) => a.industry === industry) : rows;
}

export async function getBenchmarkData(company: { id: number; industry: string; size: string; location: string; benchmarkOptIn: boolean }) {
  await ensureSeeded();
  const rows = await db.select().from(benchmarks).where(eq(benchmarks.industry, company.industry));
  const subs = await db.select().from(benchmarkSubmissions).where(eq(benchmarkSubmissions.companyId, company.id));
  return rows.map((b) => ({ ...b, mine: subs.find((s) => s.metric === b.metric)?.value ?? null }));
}

export async function getPods(companyId: number) {
  await ensureSeeded();
  const allPods = await db.select().from(pods);
  const members = await db.select().from(podMembers);
  const msgs = await db.select().from(podMessages).orderBy(podMessages.createdAt);
  const comps = await getCompaniesLite();
  return allPods.map((p) => {
    const pm = members.filter((m) => m.podId === p.id);
    return {
      ...p,
      members: pm.map((m) => comps.find((c) => c.id === m.companyId)!).filter(Boolean),
      isMember: pm.some((m) => m.companyId === companyId),
      messages: msgs.filter((m) => m.podId === p.id).map((m) => ({ ...m, company: comps.find((c) => c.id === m.companyId)! })),
    };
  });
}

export async function getResources() {
  await ensureSeeded();
  const rows = await db.select().from(resources).orderBy(desc(resources.createdAt));
  const comps = await getCompaniesLite(Array.from(new Set(rows.map((r) => r.companyId))));
  return rows.map((r) => ({ ...r, company: comps.find((c) => c.id === r.companyId)! }));
}

export async function getReferrals(companyId: number) {
  await ensureSeeded();
  const rows = await db.select().from(referrals).where(or(eq(referrals.referrerCompanyId, companyId), eq(referrals.referredCompanyId, companyId))).orderBy(desc(referrals.createdAt));
  const comps = await getCompaniesLite();
  return rows.map((r) => ({
    ...r,
    referrer: comps.find((c) => c.id === r.referrerCompanyId)!,
    referred: comps.find((c) => c.id === r.referredCompanyId)!,
    buyer: r.buyerCompanyId ? comps.find((c) => c.id === r.buyerCompanyId) ?? null : null,
    outgoing: r.referrerCompanyId === companyId,
  }));
}

export async function getInvoices(companyId: number) {
  await ensureSeeded();
  return db.select().from(invoices).where(eq(invoices.companyId, companyId)).orderBy(desc(invoices.createdAt));
}

export async function getAgentMatches(companyId: number) {
  await ensureSeeded();
  return db.select().from(agentMatches).where(eq(agentMatches.companyId, companyId)).orderBy(desc(agentMatches.score));
}

/** Public, anonymised demand signals for reverse lead-gen. */
export async function getDemandSignals() {
  await ensureSeeded();
  const t = await db.select({ industry: tenders.category, region: tenders.region, c: sql<number>`count(*)::int` }).from(tenders).where(eq(tenders.status, "open")).groupBy(tenders.category, tenders.region);
  const m = await db.select({ industry: microRfps.category, region: microRfps.location, c: sql<number>`count(*)::int` }).from(microRfps).where(eq(microRfps.status, "open")).groupBy(microRfps.category, microRfps.location);
  const map = new Map<string, { industry: string; region: string; count: number }>();
  for (const r of t) {
    const k = `${r.industry}|${r.region}`;
    map.set(k, { industry: r.industry, region: r.region, count: (map.get(k)?.count ?? 0) + r.c });
  }
  for (const r of m) {
    const region = r.region.includes(",") ? r.region.split(",").pop()!.trim() : r.region;
    const k = `${r.industry}|${region}`;
    map.set(k, { industry: r.industry, region, count: (map.get(k)?.count ?? 0) + r.c });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
