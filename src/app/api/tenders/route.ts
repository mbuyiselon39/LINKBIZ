import { getTenders } from "@/lib/data";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const n = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  const data = await getTenders({
    q: sp.get("q") || undefined,
    category: sp.get("category") || undefined,
    region: sp.get("region") || undefined,
    type: sp.get("type") || undefined,
    budgetMin: n("budgetMin"),
    budgetMax: n("budgetMax"),
    deadlineWithin: n("deadlineWithin"),
  });
  return Response.json(data);
}
