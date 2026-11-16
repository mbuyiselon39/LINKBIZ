import { getAlerts } from "@/lib/data";
export async function GET(req: Request) {
  const industry = new URL(req.url).searchParams.get("industry") ?? undefined;
  return Response.json(await getAlerts(industry));
}
