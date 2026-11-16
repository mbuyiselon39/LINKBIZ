import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ResourcesView } from "@/components/ResourcesView";

export default async function ResourcesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <div className="max-w-4xl mx-auto px-4 sm:px-0"><ResourcesView me={session.company.id} /></div>;
}
