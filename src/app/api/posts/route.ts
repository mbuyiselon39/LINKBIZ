import { db } from "@/db";
import { posts, tenders } from "@/db/schema";
import { getSession, can } from "@/lib/auth";
import { getFeed } from "@/lib/data";

export async function GET(req: Request) {
  const s = await getSession();
  const { searchParams } = new URL(req.url);
  const feed = await getFeed({ type: searchParams.get("type") ?? "all", viewerId: s?.company.id ?? null });
  return Response.json(feed);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();

  if (b.kind === "tender") {
    if (!can(s.role, "tender")) return Response.json({ error: "Your role cannot publish tenders" }, { status: 403 });
    const t = b.tender;
    if (!t?.title || !t?.scope || !t?.deadline) return Response.json({ error: "Tender title, scope and deadline are required" }, { status: 400 });
    const [tender] = await db
      .insert(tenders)
      .values({
        companyId: s.company.id,
        title: t.title,
        category: t.category || s.company.industry,
        type: t.type || "open_tender",
        region: t.region || "Global",
        budgetMin: Number(t.budgetMin) || 0,
        budgetMax: Number(t.budgetMax) || Number(t.budgetMin) || 0,
        summary: t.summary || t.scope.slice(0, 160),
        scope: t.scope,
        eligibility: (t.eligibility || "").split("\n").map((x: string) => x.trim()).filter(Boolean),
        documents: (t.documents || []).map((name: string) => ({ name, size: "PDF", url: "#" })),
        deadline: new Date(t.deadline),
      })
      .returning();
    const [post] = await db
      .insert(posts)
      .values({ companyId: s.company.id, type: "tender", content: b.content || `📋 Tender Notice: ${tender.title}`, tenderId: tender.id })
      .returning();
    return Response.json({ ok: true, post, tender });
  }

  if (!can(s.role, "post")) return Response.json({ error: "Your role cannot publish posts" }, { status: 403 });
  if (!b.content?.trim()) return Response.json({ error: "Content is required" }, { status: 400 });
  const [post] = await db
    .insert(posts)
    .values({
      companyId: s.company.id,
      type: ["update", "milestone", "partnership", "buy", "event", "benchmark"].includes(b.type) ? b.type : "update",
      content: b.content.trim(),
      imageUrl: b.imageUrl || null,
      attachments: b.attachments || [],
      repostOfId: b.repostOfId || null,
      syncedTo: Array.isArray(b.syncedTo) ? b.syncedTo.filter((x: string) => ["LinkedIn", "Facebook", "Google Business"].includes(x)) : [],
    })
    .returning();
  return Response.json({ ok: true, post });
}
