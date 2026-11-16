import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AgentView } from "@/components/AgentView";

export default async function AgentPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <div className="max-w-3xl mx-auto px-4 sm:px-0"><AgentView companyName={session.company.name} /></div>;
}
