import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MicroBoard } from "@/components/MicroBoard";

export default async function MicroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <div className="max-w-3xl mx-auto px-4 sm:px-0"><MicroBoard me={session.company.id} /></div>;
}
