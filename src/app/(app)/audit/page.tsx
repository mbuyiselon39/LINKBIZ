import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuditView } from "@/components/AuditView";

export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <div className="max-w-4xl mx-auto px-4 sm:px-0"><AuditView /></div>;
}
