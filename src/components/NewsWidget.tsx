"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Info, TrendingUp } from "lucide-react";

type Item = { t: string; m: string; href?: string; urgent?: boolean };

export function NewsWidget({ title, items, trending }: { title: string; items: Item[]; trending?: Item[] }) {
  const [more, setMore] = useState(false);
  const visible = more ? items : items.slice(0, 5);
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-ink">{title}</h3>
        <Info size={16} className="text-muted" />
      </div>
      <div className="text-xs text-muted mt-0.5">Top stories</div>
      <ul className="mt-2">
        {visible.map((n) => (
          <li key={n.t} className="flex gap-2 py-1.5 -mx-1 px-1 rounded row-hover cursor-pointer">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-muted shrink-0" />
            <div className="min-w-0"><div className="text-sm font-semibold text-ink leading-snug line-clamp-2">{n.t}</div><div className="text-xs text-muted mt-0.5">{n.m}</div></div>
          </li>
        ))}
      </ul>
      {items.length > 5 && (
        <button onClick={() => setMore((m) => !m)} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-muted rounded px-1 py-1 row-hover">
          {more ? <>Show less <ChevronUp size={16} /></> : <>Show more <ChevronDown size={16} /></>}
        </button>
      )}
      {trending && trending.length > 0 && (
        <>
          <div className="hairline mt-2 pt-3" />
          <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5"><TrendingUp size={14} className="text-action" /> Trending tenders</h4>
          <ul className="mt-1">
            {trending.map((n) => (
              <li key={n.t}>
                <Link href={n.href ?? "#"} className="block py-1.5 -mx-1 px-1 rounded row-hover">
                  <div className="text-sm font-semibold text-ink leading-snug line-clamp-2">{n.t}</div>
                  <div className={`text-xs mt-0.5 ${n.urgent ? "text-red-700" : "text-muted"}`}>{n.m}</div>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/tenders" className="inline-flex items-center gap-1 text-sm font-semibold text-muted rounded px-1 py-1 row-hover">View all tenders</Link>
        </>
      )}
    </div>
  );
}
