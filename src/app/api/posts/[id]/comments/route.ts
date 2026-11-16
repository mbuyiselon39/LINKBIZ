import { db } from "@/db";
import { comments } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return Response.json({ error: "Empty comment" }, { status: 400 });
  const [c] = await db.insert(comments).values({ postId: Number(id), companyId: s.company.id, content: content.trim() }).returning();
  return Response.json({
    ok: true,
    comment: {
      ...c,
      company: { id: s.company.id, slug: s.company.slug, name: s.company.name, logoUrl: s.company.logoUrl, industry: s.company.industry, location: s.company.location, verified: s.company.verified, tagline: s.company.tagline, followerCount: s.company.followerCount },
    },
  });
}
