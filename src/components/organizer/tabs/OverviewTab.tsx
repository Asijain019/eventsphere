"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { StatTile, labelOf } from "../ui";
import type { ManagedEvent } from "../ManageEvent";

type Analytics = {
  capacity: number; confirmed: number; waitlisted: number; cancelled: number; fillRate: number; checkIns: number; checkInRate: number; favourites: number;
  registrationsByDay: { date: string; count: number }[];
  participation: { opportunities: number; total: number; byStatus: Record<string, number> };
  volunteers: { roles: number; openings: number; total: number; accepted: number; byStatus: Record<string, number> };
};

/** Accessible SVG bar chart: one series, labelled axes, value labels on bars when few, title/desc for screen readers. */
function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 640, H = 220, P = { l: 34, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.count));
  const top = Math.ceil(max / 5) * 5 || 5;
  const bw = (W - P.l - P.r) / data.length;
  const ticks = [0, top / 2, top].map((v) => Math.round(v));
  const lab = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const every = Math.ceil(data.length / 7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="chart-t chart-d" className="h-auto w-full">
      <title id="chart-t">Registrations per day</title>
      <desc id="chart-d">Bar chart of confirmed registrations per day. Total {data.reduce((s, d) => s + d.count, 0)} over {data.length} days.</desc>
      {ticks.map((t) => { const y = P.t + (H - P.t - P.b) * (1 - t / top); return <g key={t}><line x1={P.l} x2={W - P.r} y1={y} y2={y} stroke="rgba(255,255,255,.1)" /><text x={P.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,.55)">{t}</text></g>; })}
      {data.map((d, i) => {
        const h = (H - P.t - P.b) * (d.count / top); const x = P.l + i * bw + bw * 0.15;
        return (
          <g key={d.date}>
            <rect x={x} y={H - P.b - h} width={bw * 0.7} height={Math.max(h, d.count ? 2 : 0)} rx={3} fill="#8B35FF"><title>{`${lab(d.date)}: ${d.count} registration${d.count === 1 ? "" : "s"}`}</title></rect>
            {i % every === 0 && <text x={x + bw * 0.35} y={H - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.55)">{lab(d.date)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
function StatusBars({ title, by, empty }: { title: string; by: Record<string, number>; empty: string }) {
  const entries = Object.entries(by); const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {entries.length === 0 ? <p className="mt-3 text-sm text-white/50">{empty}</p> : (
        <ul className="mt-4 space-y-2.5">{entries.map(([k, n]) => (
          <li key={k} className="text-xs"><div className="mb-1 flex justify-between text-white/70"><span>{labelOf(k)}</span><b className="text-white">{n}</b></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-magenta" style={{ width: `${(n / max) * 100}%` }} /></div></li>
        ))}</ul>
      )}
    </div>
  );
}

export function OverviewTab({ ev }: { ev: ManagedEvent }) {
  const [a, setA] = useState<Analytics | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = () => { setErr(null); api<Analytics>(`/api/v1/organizer/events/${ev.id}/analytics`).then(setA).catch((e) => setErr(e.message)); };
  useEffect(load, [ev.id, ev.confirmedCount]);
  if (err) return <ErrorState message={err} retry={load} />;
  if (!a) return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Registered" value={`${a.confirmed}/${a.capacity}`} hint={`${a.fillRate}% full${a.waitlisted ? ` · ${a.waitlisted} waitlisted` : ""}`} />
        <StatTile label="Checked in" value={a.checkIns} hint={`${a.checkInRate}% of registered`} accent="#D6FF55" />
        <StatTile label="Favourites" value={a.favourites} hint="people saved this event" accent="#E83EAB" />
        <StatTile label="Applications" value={a.participation.total + a.volunteers.total} hint={`${a.participation.total} contestants · ${a.volunteers.total} volunteers`} accent="#2F8CFF" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display text-lg font-bold">Registrations over time</h3>
          {a.registrationsByDay.length === 0 ? <p className="mt-6 pb-6 text-sm text-white/50">No registrations yet. Share your event link to get started.</p> : <div className="mt-3"><DailyChart data={a.registrationsByDay} /></div>}
          <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-white/60"><span>Capacity filled</span><b className="text-white">{a.fillRate}%</b></div><div className="h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={a.fillRate} aria-valuemin={0} aria-valuemax={100} aria-label="Capacity filled"><div className="h-full bg-brand-gradient" style={{ width: `${Math.min(100, a.fillRate)}%` }} /></div></div>
        </div>
        <div className="space-y-6">
          <div className="card p-5 text-sm">
            <h3 className="font-display text-lg font-bold">Event details</h3>
            <dl className="mt-3 space-y-2 text-white/70">
              <div className="flex justify-between gap-4"><dt>Starts</dt><dd className="text-right text-white">{formatDate(ev.startAt)} {formatTime(ev.startAt)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Ends</dt><dd className="text-right text-white">{formatDate(ev.endAt)} {formatTime(ev.endAt)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Deadline</dt><dd className="text-right text-white">{ev.registrationDeadline ? `${formatDate(ev.registrationDeadline)} ${formatTime(ev.registrationDeadline)}` : "None"}</dd></div>
              <div className="flex justify-between gap-4"><dt>Price</dt><dd className="text-white">{formatPrice(ev.feePaise)}</dd></div>
            </dl>
          </div>
          <StatusBars title="Contestant applications" by={a.participation.byStatus} empty="No contestant applications yet." />
        </div>
      </div>
      <StatusBars title={`Volunteer applications (${a.volunteers.accepted}/${a.volunteers.openings} spots filled)`} by={a.volunteers.byStatus} empty="No volunteer applications yet." />
    </div>
  );
}
