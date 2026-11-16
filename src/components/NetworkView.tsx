"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Store, Handshake, Users, Compass, MessageSquare } from "lucide-react";
import { Avatar } from "./Avatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { CompanyCard } from "./CompanyCard";
import type { CompanyLite } from "@/lib/data";

type Conn = { id: number; status: string; kind: string; incoming: boolean; company: CompanyLite };
type Data = { vendors: Conn[]; partners: Conn[]; pending: Conn[]; followers: CompanyLite[]; discover: CompanyLite[] };

const TABS = [
  { key: "discover", label: "Discover", icon: Compass },
  { key: "vendors", label: "Approved Vendors", icon: Store },
  { key: "partners", label: "Strategic Partners", icon: Handshake },
  { key: "followers", label: "Following You", icon: Users },
];

export function NetworkView({ data }: { data: Data }) {
  const router = useRouter();
  const [tab, setTab] = useState("discover");
  const [pending, setPending] = useState(data.pending);

  async function act(id: number, action: "accept" | "decline") {
    setPending((p) => p.filter((x) => x.id !== id));
    await fetch("/api/connections", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    router.refresh();
  }

  const Row = ({ c, sub, right }: { c: CompanyLite; sub: string; right?: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/company/${c.slug}`}><Avatar name={c.name} src={c.logoUrl} size={52} /></Link>
      <div className="min-w-0 flex-1">
        <Link href={`/company/${c.slug}`} className="font-semibold text-sm hover:underline flex items-center gap-1">{c.name} {c.verified && <VerifiedBadge size={13} />}</Link>
        <div className="text-xs text-muted truncate">{c.tagline}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      <div className="flex gap-1.5 shrink-0">{right ?? <Link href={`/messages?to=${c.id}`} className="btn-ghost !px-3 !text-xs"><MessageSquare size={12} /> Message</Link>}</div>
    </div>
  );

  const counts: Record<string, number> = { discover: data.discover.length, vendors: data.vendors.length, partners: data.partners.length, followers: data.followers.length };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-start">
      <aside className="space-y-2">
        <div className="card p-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wide">Manage my network</div>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-medium ${tab === t.key ? "bg-tint text-action" : "text-ink-70 hover:bg-hover"}`}>
              <span className="flex items-center gap-2"><t.icon size={16} /> {t.label}</span><span className="text-xs">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </aside>
      <section className="space-y-3 min-w-0">
        {pending.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-sm">Pending requests ({pending.length})</h2>
            <div className="divide-y divide-line">
              {pending.map((p) => (
                <Row key={p.id} c={p.company} sub={`${p.incoming ? "Wants to add you as" : "You requested to be"} ${p.kind === "vendor" ? "an approved vendor" : "a strategic partner"}`}
                  right={p.incoming ? <><button onClick={() => act(p.id, "accept")} className="btn-primary !px-3 !text-xs"><Check size={12} /> Accept</button><button onClick={() => act(p.id, "decline")} className="btn-ghost !px-3 !text-xs"><X size={12} /></button></> : <button onClick={() => act(p.id, "decline")} className="btn-ghost !px-3 !text-xs">Withdraw</button>} />
              ))}
            </div>
          </div>
        )}
        <div className="card p-4">
          <h2 className="font-semibold">{TABS.find((t) => t.key === tab)?.label}</h2>
          {tab === "discover" && (
            <>
              <p className="text-sm text-muted mt-0.5">Vetted suppliers, contractors and strategic partners you may want to work with.</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">{data.discover.map((c) => <CompanyCard key={c.id} company={c} />)}</div>
              {data.discover.length === 0 && <p className="text-sm text-muted mt-3">You&apos;re connected with every company on LinkBiz. Impressive.</p>}
            </>
          )}
          {tab === "vendors" && <div className="divide-y divide-line">{data.vendors.map((v) => <Row key={v.id} c={v.company} sub="Approved vendor" />)}{data.vendors.length === 0 && <p className="text-sm text-muted py-4">No approved vendors yet. Send vendor requests from the Discover tab.</p>}</div>}
          {tab === "partners" && <div className="divide-y divide-line">{data.partners.map((v) => <Row key={v.id} c={v.company} sub="Strategic partner" />)}{data.partners.length === 0 && <p className="text-sm text-muted py-4">No strategic partners yet.</p>}</div>}
          {tab === "followers" && <div className="divide-y divide-line">{data.followers.map((c) => <Row key={c.id} c={c} sub={`${c.industry} · ${c.location}`} />)}{data.followers.length === 0 && <p className="text-sm text-muted py-4">No companies are following you yet.</p>}</div>}
        </div>
      </section>
    </div>
  );
}
