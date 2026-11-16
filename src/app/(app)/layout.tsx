import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import { getCompaniesLite } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [session, companies] = await Promise.all([getSession(), getCompaniesLite()]);
  const nav = session
    ? {
        company: { id: session.company.id, slug: session.company.slug, name: session.company.name, logoUrl: session.company.logoUrl, industry: session.company.industry, location: session.company.location, verified: session.company.verified, tagline: session.company.tagline, followerCount: session.company.followerCount },
        role: session.role,
        user: session.user,
      }
    : null;
  return (
    <>
      <Navbar session={nav} companies={companies} />
      <main className="mx-auto w-full max-w-[1128px] px-0 md:px-4 lg:px-6 mt-0 md:mt-6 pb-20 md:pb-8">{children}</main>
    </>
  );
}
