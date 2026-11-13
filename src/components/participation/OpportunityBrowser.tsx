"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, CalendarDays, MapPin, Users, Clock } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";
import { CATEGORY_POSTER, IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { Tilt } from "@/components/ui/Tilt";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { OPPORTUNITY_TYPES, OPPORTUNITY_LABEL } from "@/modules/participation/schemas";

export type OppItem = {
  id: string; type: string; title: string; description: string; capacity: number; deadline: string | null; acceptedCount: number; applicantCount: number;
  eventTitle: string; eventSlug: string; eventStartAt: string; eventPoster: string | null; categorySlug: string; cityName: string; collegeName: string | null;
};
export function OpportunityCard({ o }: { o: OppItem }) {
  const left = Math.max(0, o.capacity - o.acceptedCount);
  return (
    <Tilt max={6}>
      <Link href={`/participate/${o.id}`} className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-glow">
        <div className="relative aspect-[16/10]">
          <SmartImage src={o.eventPoster || CATEGORY_POSTER[o.categorySlug] || IMG.stageBW} alt={`${o.eventTitle} poster`} className="h-full w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" fallbackLabel={o.eventTitle} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">{OPPORTUNITY_LABEL[o.type as keyof typeof OPPORTUNITY_LABEL] ?? o.type}</span>
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold backdrop-blur">{left} spot{left === 1 ? "" : "s"} left</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="font-display text-xl font-bold leading-tight">{o.title}</h3>
          <p className="text-sm text-white/65">at {o.eventTitle}</p>
          <p className="line-clamp-2 text-sm text-white/55">{o.description}</p>
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{formatDate(o.eventStartAt)}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={13} />{o.collegeName ?? o.cityName}</span>
            <span className="inline-flex items-center gap-1"><Users size={13} />{o.applicantCount} applied</span>
            {o.deadline && <span className="inline-flex items-center gap-1"><Clock size={13} />Apply by {formatDate(o.deadline)}</span>}
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function OpportunityBrowser({ initialType, city }: { initialType?: string; city?: string }) {
  const [type, setType] = useState(initialType ?? ""); const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: OppItem[]; total: number; pageSize: number } | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const load = useCallback(async () => {
    setErr(null); setData(null);
    const p = new URLSearchParams({ page: String(page), pageSize: "9" }); if (type) p.set("type", type); if (dq) p.set("q", dq); if (city) p.set("city", city);
    try { setData(await api(`/api/v1/opportunities?${p}`)); } catch (e) { setErr((e as Error).message); }
  }, [type, dq, page, city]);
  useEffect(() => { void load(); }, [load]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <section className="container-x py-12" id="opportunities">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          <button aria-pressed={!type} onClick={() => { setType(""); setPage(1); }} className={cn("chip transition", !type && "border-lime bg-lime text-ink")}>All</button>
          {OPPORTUNITY_TYPES.map((t) => <button key={t} aria-pressed={type === t} onClick={() => { setType(t); setPage(1); }} className={cn("chip transition", type === t && "border-lime bg-lime text-ink")}>{OPPORTUNITY_LABEL[t]}</button>)}
        </div>
        <div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input className="input !w-full !pl-9 lg:!w-72" aria-label="Search opportunities" placeholder="Search opportunities or events" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="mt-8">
        {err && <ErrorState message={err} retry={load} />}
        {!data && !err && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}</div>}
        {data && data.items.length === 0 && <EmptyState title="No open opportunities" body={type || dq ? "Nothing matches your filters. Try clearing them." : "Organizers have not posted any competition slots yet. Check back soon."} action={(type || dq) ? <button className="btn-ghost" onClick={() => { setType(""); setQ(""); }}>Clear filters</button> : undefined} />}
        {data && data.items.length > 0 && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((o, i) => <Reveal key={o.id} delay={(i % 3) * 0.06}><OpportunityCard o={o} /></Reveal>)}</div>}
        {data && data.total > data.pageSize && (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-white/60">Page {page} of {pages}</span><button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>
        )}
      </div>
    </section>
  );
}
