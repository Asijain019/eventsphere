"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Settings2, Eye, EyeOff, CalendarDays, MapPin, Search } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { IMG, CATEGORY_POSTER } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { EmptyState, ErrorState, Alert, Skeleton } from "@/components/ui/States";
import { Reveal } from "@/components/ui/Reveal";
import { StatTile, StatusChip } from "./ui";

type Row = {
  id: string; slug: string; title: string; status: string; posterUrl: string | null; startAt: string; endAt: string; capacity: number; confirmedCount: number; feePaise: number;
  categoryName: string; categorySlug: string; categoryColor: string; cityName: string; checkIns: number; applications: number; volunteerApplications: number;
};
const FILTERS = ["ALL", "DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] as const;

export function OrganizerDashboard({ name }: { name: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<{ title: string; problems?: string[] } | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try { const r = await api<{ items: Row[] }>("/api/v1/organizer/events?pageSize=50"); setRows(r.items); }
    catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function toggle(r: Row) {
    setBusy(r.id); setActionErr(null);
    try { await api(`/api/v1/organizer/events/${r.id}/${r.status === "PUBLISHED" ? "unpublish" : "publish"}`, { method: "POST" }); await load(); }
    catch (e: any) { setActionErr({ title: `${r.title}: ${e.message}`, problems: undefined }); if (e.details?.problems) setActionErr({ title: `${r.title}: ${e.message}`, problems: e.details.problems }); }
    finally { setBusy(null); }
  }

  const stats = useMemo(() => {
    const r = rows ?? [];
    return {
      total: r.length, published: r.filter((x) => x.status === "PUBLISHED").length,
      regs: r.reduce((s, x) => s + x.confirmedCount, 0), apps: r.reduce((s, x) => s + x.applications + x.volunteerApplications, 0),
      checkIns: r.reduce((s, x) => s + x.checkIns, 0),
    };
  }, [rows]);
  const shown = (rows ?? []).filter((r) => (filter === "ALL" || r.status === filter) && (!q || r.title.toLowerCase().includes(q.toLowerCase())));

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <SmartImage src={IMG.stageBW} alt="" className="absolute inset-0 h-full w-full opacity-25" imgClassName="grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
        <div className="container-x relative flex flex-col gap-6 py-12 sm:py-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="chip mb-4 border-lime/40 text-lime">Organizer dashboard</p>
            <h1 className="section-title">Welcome back,<br /><span className="text-lime">{name.split(" ")[0]}.</span></h1>
            <p className="mt-4 max-w-xl text-white/65">Create events, review contestants, staff your volunteers and keep your attendees in the loop.</p>
          </div>
          <Link href="/organizer/events/new" className="btn-lime self-start md:self-end"><Plus size={18} />Create event</Link>
        </div>
      </section>

      <div className="container-x space-y-8 py-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {rows === null && !err ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (<>
            <StatTile label="Events" value={stats.total} hint={`${stats.published} published`} />
            <StatTile label="Registrations" value={stats.regs} hint="confirmed" accent="#E83EAB" />
            <StatTile label="Check-ins" value={stats.checkIns} accent="#D6FF55" />
            <StatTile label="Applications" value={stats.apps} hint="contestants + volunteers" accent="#2F8CFF" />
            <StatTile label="Drafts" value={(rows ?? []).filter((x) => x.status === "DRAFT").length} hint="not yet public" accent="#FF7A1A" />
          </>)}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold">My events</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input className="input !w-48 !py-2 !pl-9" placeholder="Search events" aria-label="Search my events" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={cn("chip transition", filter === f && "border-lime bg-lime text-ink")}>{f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}</button>)}
          </div>
        </div>

        {actionErr && <Alert>{actionErr.title}{actionErr.problems && <ul className="mt-1 list-disc pl-5">{actionErr.problems.map((p) => <li key={p}>{p}</li>)}</ul>}</Alert>}
        {err && <ErrorState message={err} retry={load} />}
        {rows === null && !err && <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>}
        {rows && rows.length === 0 && <EmptyState title="No events yet" body="Create your first event, save it as a draft, and publish it when you are ready." action={<Link href="/organizer/events/new" className="btn-primary">Create your first event</Link>} />}
        {rows && rows.length > 0 && shown.length === 0 && <EmptyState title="Nothing matches" body="Try a different status filter or search term." />}

        <div className="grid gap-4">
          {shown.map((r, i) => (
            <Reveal key={r.id} delay={Math.min(i, 5) * 0.04} y={14}>
              <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <SmartImage src={r.posterUrl || CATEGORY_POSTER[r.categorySlug] || IMG.venue} alt={`${r.title} poster`} className="h-36 w-full shrink-0 rounded-2xl sm:h-28 sm:w-44" fallbackLabel={r.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><StatusChip status={r.status} /><span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink" style={{ background: r.categoryColor }}>{r.categoryName}</span></div>
                  <h3 className="mt-2 truncate font-display text-xl font-bold">{r.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{formatDate(r.startAt)}, {formatTime(r.startAt)}</span><span className="inline-flex items-center gap-1"><MapPin size={13} />{r.cityName}</span></p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
                    <span><b className="text-white">{r.confirmedCount}</b>/{r.capacity} registered</span><span><b className="text-white">{r.checkIns}</b> checked in</span>
                    <span><b className="text-white">{r.applications}</b> contestants</span><span><b className="text-white">{r.volunteerApplications}</b> volunteers</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10" aria-hidden><div className="h-full bg-brand-gradient" style={{ width: `${Math.min(100, (r.confirmedCount / Math.max(1, r.capacity)) * 100)}%` }} /></div>
                </div>
                <div className="flex flex-wrap gap-2 sm:w-44 sm:flex-col">
                  <Link href={`/organizer/events/${r.id}`} className="btn-primary !py-2"><Settings2 size={15} />Manage</Link>
                  {!["CANCELLED", "COMPLETED"].includes(r.status) && <Link href={`/organizer/events/${r.id}/edit`} className="btn-ghost !py-2"><Pencil size={15} />Edit</Link>}
                  {(r.status === "DRAFT" || r.status === "PUBLISHED") && (
                    <button onClick={() => toggle(r)} disabled={busy === r.id} className="btn-ghost !py-2">{r.status === "PUBLISHED" ? <><EyeOff size={15} />Unpublish</> : <><Eye size={15} />Publish</>}</button>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
