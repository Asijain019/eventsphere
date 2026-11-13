"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { EmptyState, Alert } from "@/components/ui/States";
import { IMG, CATEGORY_POSTER } from "@/lib/images";
import { api } from "@/lib/client";
import { cn, formatDate, formatTime, formatPrice } from "@/lib/utils";

export type RegRow = {
  id: string; status: string; type: string; ticketReference: string; teamName: string | null;
  event: { slug: string; title: string; posterUrl: string | null; startAt: string | Date; status: string; mode: string; feePaise: number; categorySlug: string; categoryName: string; categoryColor: string; venueName: string | null; locality: string | null; cityName: string };
};

function Ticket({ r, canCancel, onCancel, busy }: { r: RegRow; canCancel: boolean; onCancel: (id: string) => void; busy: boolean }) {
  const [confirm, setConfirm] = useState(false); const e = r.event;
  const cancelled = r.status === "CANCELLED" || e.status === "CANCELLED";
  return (
    <article className={cn("card relative flex flex-col overflow-hidden sm:flex-row", cancelled && "opacity-60")}>
      <Link href={`/events/${e.slug}`} className="relative block h-44 shrink-0 sm:h-auto sm:w-52" aria-label={e.title}>
        <SmartImage src={e.posterUrl || CATEGORY_POSTER[e.categorySlug]} alt={`${e.title} poster`} className="h-full w-full" fallbackLabel={e.title} />
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-ink" style={{ background: e.categoryColor }}>{e.categoryName}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl font-bold"><Link href={`/events/${e.slug}`} className="hover:text-lime">{e.title}</Link></h3>
        <ul className="space-y-1 text-sm text-white/65">
          <li className="flex items-center gap-2"><Calendar size={14} className="text-violet-400" />{formatDate(e.startAt, { weekday: "short", day: "numeric", month: "short" })} · {formatTime(e.startAt)}</li>
          <li className="flex items-center gap-2"><MapPin size={14} className="text-magenta" />{e.mode === "ONLINE" ? "Online" : `${e.venueName ?? "Venue TBA"}${e.locality ? `, ${e.locality}` : ""}`} · {e.cityName}</li>
          {r.teamName && <li className="flex items-center gap-2"><Users size={14} className="text-lime" />Team {r.teamName}</li>}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <span className="chip">{r.type === "TEAM" ? "Team" : "Attendee"}</span><span className="chip">{formatPrice(e.feePaise)}</span>
          {cancelled && <span className="chip border-red-500/40 text-red-300">{r.status === "CANCELLED" ? "Cancelled" : "Event cancelled"}</span>}
          {canCancel && !cancelled && (confirm
            ? <><button type="button" className="btn-danger !px-4 !py-1.5" disabled={busy} onClick={() => onCancel(r.id)}>{busy ? "Cancelling…" : "Yes, cancel"}</button><button type="button" className="text-xs text-white/50 underline" onClick={() => setConfirm(false)}>Keep</button></>
            : <button type="button" className="btn-ghost !px-4 !py-1.5" onClick={() => setConfirm(true)}>Cancel registration</button>)}
        </div>
      </div>
      {/* perforated stub */}
      <div className="relative flex shrink-0 flex-row items-center justify-between gap-3 border-t border-dashed border-white/20 bg-white/[.04] px-5 py-4 sm:w-44 sm:flex-col sm:justify-center sm:border-l sm:border-t-0">
        <span className="absolute -left-3 top-0 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-ink sm:block sm:left-0 sm:-translate-x-1/2" aria-hidden />
        <div className="text-center"><p className="text-[10px] uppercase tracking-widest text-white/50">Ticket</p><p className="font-mono text-base font-bold tracking-widest text-lime">{r.ticketReference}</p></div>
        <div className="hidden h-14 w-full opacity-70 sm:block" aria-hidden style={{ background: "repeating-linear-gradient(90deg,#F8F7F2 0 2px,transparent 2px 5px,#F8F7F2 5px 6px,transparent 6px 10px)" }} />
      </div>
    </article>
  );
}

export function MyRegistrations({ upcoming, past, cancelled }: { upcoming: RegRow[]; past: RegRow[]; cancelled: RegRow[] }) {
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [busy, setBusy] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const lists = { upcoming, past, cancelled }; const rows = lists[tab];
  async function cancel(id: string) {
    setBusy(id); setErr(null);
    try { await api(`/api/v1/registrations/${id}`, { method: "DELETE" }); router.refresh(); } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }
  return (
    <div>
      <div role="tablist" className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
        {(["upcoming", "past", "cancelled"] as const).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-5 py-2 text-sm font-semibold capitalize transition", tab === t ? "bg-lime text-ink" : "text-white/70 hover:text-white")}>{t} <span className="opacity-60">({lists[t].length})</span></button>
        ))}
      </div>
      {err && <div className="mb-4"><Alert>{err}</Alert></div>}
      {rows.length === 0 ? (
        <EmptyState title={tab === "upcoming" ? "No upcoming events yet" : tab === "past" ? "Nothing here yet" : "No cancelled registrations"}
          body={tab === "upcoming" ? "Find something exciting happening near you and grab your ticket." : "Events you attend will show up here."}
          action={tab === "upcoming" ? <Link href="/events" className="btn-primary">Explore events</Link> : undefined} />
      ) : <div className="space-y-5">{rows.map((r) => <Ticket key={r.id} r={r} canCancel={tab === "upcoming"} onCancel={cancel} busy={busy === r.id} />)}</div>}
    </div>
  );
}
