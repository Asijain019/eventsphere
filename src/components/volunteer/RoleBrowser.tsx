"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, CalendarDays, MapPin, Users, Clock } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";
import { CATEGORY_POSTER, IMG } from "@/lib/images";
import { SKILLS } from "@/lib/constants";
import { SmartImage } from "@/components/ui/SmartImage";
import { Tilt } from "@/components/ui/Tilt";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";

export type RoleItem = {
  id: string; title: string; description: string; skillsRequired: string[]; openings: number; shiftLabel: string | null; deadline: string | null; acceptedCount: number; applicantCount: number;
  eventTitle: string; eventSlug: string; eventStartAt: string; eventPoster: string | null; cityName: string; collegeName: string | null;
};
export function RoleCard({ r }: { r: RoleItem }) {
  const left = Math.max(0, r.openings - r.acceptedCount);
  return (
    <Tilt max={6}>
      <Link href={`/volunteer/${r.id}`} className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-glow">
        <div className="relative aspect-[16/9]">
          <SmartImage src={r.eventPoster || CATEGORY_POSTER["social-impact"] || IMG.megaphone} alt={`${r.eventTitle} poster`} className="h-full w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" fallbackLabel={r.eventTitle} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          <span className="absolute bottom-3 right-3 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">{left} opening{left === 1 ? "" : "s"}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="font-display text-xl font-bold leading-tight">{r.title}</h3>
          <p className="text-sm text-white/65">at {r.eventTitle}</p>
          <p className="line-clamp-2 text-sm text-white/55">{r.description}</p>
          {r.skillsRequired.length > 0 && <div className="flex flex-wrap gap-1.5">{r.skillsRequired.slice(0, 3).map((s) => <span key={s} className="chip !py-0.5 !text-[11px]">{s}</span>)}</div>}
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{formatDate(r.eventStartAt)}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={13} />{r.collegeName ?? r.cityName}</span>
            {r.shiftLabel && <span className="inline-flex items-center gap-1"><Clock size={13} />{r.shiftLabel}</span>}
            <span className="inline-flex items-center gap-1"><Users size={13} />{r.applicantCount} applied</span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function RoleBrowser({ city }: { city?: string }) {
  const [skill, setSkill] = useState(""); const [q, setQ] = useState(""); const [dq, setDq] = useState(""); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: RoleItem[]; total: number; pageSize: number } | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const load = useCallback(async () => {
    setErr(null); setData(null);
    const p = new URLSearchParams({ page: String(page), pageSize: "9" }); if (skill) p.set("skill", skill); if (dq) p.set("q", dq); if (city) p.set("city", city);
    try { setData(await api(`/api/v1/volunteer-roles?${p}`)); } catch (e) { setErr((e as Error).message); }
  }, [skill, dq, page, city]);
  useEffect(() => { void load(); }, [load]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <section className="container-x py-12" id="roles">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by skill">
          <button aria-pressed={!skill} onClick={() => { setSkill(""); setPage(1); }} className={cn("chip transition", !skill && "border-lime bg-lime text-ink")}>Any skill</button>
          {SKILLS.map((s) => <button key={s} aria-pressed={skill === s} onClick={() => { setSkill(s); setPage(1); }} className={cn("chip transition", skill === s && "border-lime bg-lime text-ink")}>{s}</button>)}
        </div>
        <div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input className="input !w-full !pl-9 lg:!w-72" aria-label="Search volunteer roles" placeholder="Search roles or events" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="mt-8">
        {err && <ErrorState message={err} retry={load} />}
        {!data && !err && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}</div>}
        {data && data.items.length === 0 && <EmptyState title="No open volunteer roles" body={skill || dq ? "Nothing matches your filters." : "No organizer is looking for volunteers right now. Check back soon."} action={(skill || dq) ? <button className="btn-ghost" onClick={() => { setSkill(""); setQ(""); }}>Clear filters</button> : undefined} />}
        {data && data.items.length > 0 && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((r, i) => <Reveal key={r.id} delay={(i % 3) * 0.06}><RoleCard r={r} /></Reveal>)}</div>}
        {data && data.total > data.pageSize && <div className="mt-8 flex items-center justify-center gap-3 text-sm"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-white/60">Page {page} of {pages}</span><button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>}
      </div>
    </section>
  );
}
