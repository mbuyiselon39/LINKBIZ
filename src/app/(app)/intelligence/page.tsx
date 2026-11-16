import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { IntelligenceView } from "@/components/IntelligenceView";

export default async function IntelligencePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <div className="px-4 sm:px-0"><IntelligenceView industry={session.company.industry} region={session.company.location} /></div>;
}
