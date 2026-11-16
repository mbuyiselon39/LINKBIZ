import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ToolsView } from "@/components/ToolsView";

export default async function ToolsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const c = session.company;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <ToolsView company={{ id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, location: c.location, email: c.email, website: c.website, logoUrl: c.logoUrl, taxCompliant: c.taxCompliant, insuranceVerified: c.insuranceVerified, verified: c.verified, certifications: c.certifications, founded: c.founded }} />
    </div>
  );
}
