import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNetwork } from "@/lib/data";
import { NetworkView } from "@/components/NetworkView";

export default async function NetworkPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getNetwork(session.company.id);
  return (
    <div className="px-4 sm:px-0 space-y-3">
      <div><h1 className="text-xl font-semibold">Business Network</h1><p className="text-sm text-muted">Discover and connect with vetted suppliers, contractors and strategic partners.</p></div>
      <NetworkView data={data} />
    </div>
  );
}
