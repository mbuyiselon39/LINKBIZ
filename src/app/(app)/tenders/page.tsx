import Link from "next/link";
import { getTenders } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { TenderBoard } from "@/components/TenderBoard";
import { TenderCard } from "@/components/TenderCard";
import { db } from "@/db";
import { tenderBids, tenders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { money } from "@/lib/format";
import { Zap } from "lucide-react";

export default async function TendersPage({ searchParams }: { searchParams: Promise<{ q?: string; mine?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();

  if (sp.mine && session) {
    const [issued, myBids] = await Promise.all([
      getTenders({ companyId: session.company.id }),
      db.select({ bid: tenderBids, tender: tenders }).from(tenderBids).innerJoin(tenders, eq(tenders.id, tenderBids.tenderId)).where(eq(tenderBids.companyId, session.company.id)).orderBy(desc(tenderBids.createdAt)),
    ]);
    return (
      <div className="max-w-3xl mx-auto space-y-4 px-4 sm:px-0">
        <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">My Tenders & Bids</h1><Link href="/tenders" className="btn-ghost">Browse marketplace</Link></div>
        <section className="space-y-2">
          <h2 className="font-semibold text-ink-70">Tenders issued by {session.company.name} ({issued.length})</h2>
          {issued.length === 0 && <div className="card p-6 text-sm text-muted">No open tenders yet. Publish one from the Home feed.</div>}
          {issued.map((t) => <TenderCard key={t.id} tender={t} />)}
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-ink-70">Bids & expressions of interest submitted ({myBids.length})</h2>
          {myBids.length === 0 && <div className="card p-6 text-sm text-muted">You haven&apos;t submitted any bids yet.</div>}
          {myBids.map(({ bid, tender }) => (
            <Link key={bid.id} href={`/tenders/${tender.id}`} className="card p-4 block hover:border-action/60">
              <div className="flex justify-between gap-3">
                <div><div className="font-semibold text-ink">{tender.title}</div><div className="text-xs text-muted mt-0.5">{bid.type === "eoi" ? "Expression of Interest" : `Bid${bid.amount ? ` · ${money(bid.amount)}` : ""}`} · {new Date(bid.createdAt).toLocaleDateString()}</div></div>
                <span className="chip h-fit capitalize">{bid.status}</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    );
  }

  const data = await getTenders({ q: sp.q });
  return (
    <div className="space-y-3 px-4 sm:px-0">
      <div className="flex items-end justify-between">
        <div><h1 className="text-xl font-semibold text-ink">Tender Marketplace</h1><p className="text-sm text-muted">Open tenders, RFQs and subcontracting opportunities from verified businesses.</p></div>
        <div className="flex gap-2">
          <Link href="/micro" className="btn-ghost hidden sm:inline-flex"><Zap size={14} /> Micro-RFPs</Link>
          {session && <Link href="/tenders?mine=1" className="btn-outline hidden sm:inline-flex">My tenders & bids</Link>}
        </div>
      </div>
      <TenderBoard initial={data} initialQuery={sp.q ?? ""} />
    </div>
  );
}
