import { Suspense } from "react";
import { getSession, can } from "@/lib/auth";
import { getFeed, getTenders, getCompaniesLite, getCompanyStats } from "@/lib/data";
import { LeftSidebar, RightSidebar } from "@/components/Sidebars";
import { CreatePostBox } from "@/components/CreatePostBox";
import { Feed } from "@/components/Feed";
import { PostSkeleton } from "@/components/Skeleton";

export default async function HomePage() {
  const session = await getSession();
  const [posts, tenders, companies, stats] = await Promise.all([
    getFeed({ viewerId: session?.company.id ?? null }),
    getTenders(),
    getCompaniesLite(),
    session ? getCompanyStats(session.company.id) : Promise.resolve(null),
  ]);
  const suppliers = companies.filter((c) => c.id !== session?.company.id);

  return (
    /* Holy-grail grid: 225 | 555 (fluid) | 300 - right rail collapses <992px, sidebar stacks <768px */
    <div className="grid grid-cols-1 md:grid-cols-[225px_minmax(0,1fr)] lg:grid-cols-[225px_minmax(0,555px)_300px] gap-6 justify-center items-start px-2 md:px-0">
      <aside className="md:sticky md:top-[76px] space-y-2">
        <LeftSidebar session={session} stats={stats} />
      </aside>

      <section className="space-y-2 min-w-0">
        {session && (
          <CreatePostBox
            session={{ company: { id: session.company.id, slug: session.company.slug, name: session.company.name, logoUrl: session.company.logoUrl, industry: session.company.industry, location: session.company.location, verified: session.company.verified, tagline: session.company.tagline, followerCount: session.company.followerCount }, role: session.role, user: session.user }}
            canPost={can(session.role, "post")}
            canTender={can(session.role, "tender")}
          />
        )}
        <Suspense fallback={<><PostSkeleton /><PostSkeleton /></>}>
          <Feed posts={posts} loggedIn={!!session} />
        </Suspense>
      </section>

      <aside className="hidden lg:block lg:sticky lg:top-[76px]">
        <RightSidebar tenders={tenders} suppliers={suppliers} loggedIn={!!session} />
      </aside>
    </div>
  );
}
