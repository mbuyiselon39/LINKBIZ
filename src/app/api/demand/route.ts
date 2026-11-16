import { getDemandSignals } from "@/lib/data";
export async function GET() {
  return Response.json(await getDemandSignals());
}
