import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, companyMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TeamManager } from "@/components/TeamManager";
import { Avatar } from "@/components/Avatar";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const members = await db
    .select({ id: companyMembers.id, role: companyMembers.role, email: users.email, fullName: users.fullName, userId: users.id })
    .from(companyMembers).innerJoin(users, eq(users.id, companyMembers.userId)).where(eq(companyMembers.companyId, session.company.id));
  return (
    <div className="px-4 sm:px-0 space-y-3 max-w-5xl mx-auto">
      <div className="card p-5 flex items-center gap-4">
        <Avatar name={session.company.name} src={session.company.logoUrl} size={56} />
        <div className="flex-1"><h1 className="text-xl font-semibold">{session.company.name} - Team & Roles</h1><p className="text-sm text-muted">Multiple team members can manage this Company Page with role-based access.</p></div>
        <Link href={`/company/${session.company.slug}`} className="btn-outline hidden sm:inline-flex">View page</Link>
      </div>
      <TeamManager members={members} isAdmin={session.role === "admin"} myUserId={session.user.id} />
    </div>
  );
}
