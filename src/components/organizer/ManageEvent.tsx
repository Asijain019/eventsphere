"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil, ExternalLink, Eye, EyeOff, XCircle, Ticket, BarChart3, ClipboardList, HandHeart, Megaphone, Users } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Alert, ErrorState } from "@/components/ui/States";
import { StatusChip, Spinner } from "./ui";
import { OverviewTab } from "./tabs/OverviewTab";
import { RegistrationsTab } from "./tabs/RegistrationsTab";
import { ApplicationsTab } from "./tabs/ApplicationsTab";
import { VolunteersTab } from "./tabs/VolunteersTab";
import { AnnouncementsTab } from "./tabs/AnnouncementsTab";
import { CommunityTab } from "./tabs/CommunityTab";

export type ManagedEvent = {
  id: string; slug: string; title: string; status: string; description: string; startAt: string; endAt: string; capacity: number; confirmedCount: number;
  registrationDeadline: string | null; feePaise: number; posterUrl: string | null; mode: string; communitySlug: string | null;
  category: { name: string; color: string } | null; city: { name: string } | null; venue: { name: string; address: string } | null;
};
const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 }, { id: "registrations", label: "Registrations", icon: Ticket }, { id: "applications", label: "Contestants", icon: ClipboardList },
  { id: "volunteers", label: "Volunteers", icon: HandHeart }, { id: "announcements", label: "Announcements", icon: Megaphone }, { id: "community", label: "Community", icon: Users },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function ManageEvent({ eventId }: { eventId: string }) {
  const [ev, setEv] = useState<ManagedEvent | null>(null);
  const [err, setErr] = useState<{ message: string; status?: number } | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [notice, setNotice] = useState<{ kind: "error" | "success"; msg: string; problems?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false); const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try { const r = await api<{ event: ManagedEvent }>(`/api/v1/organizer/events/${eventId}`); setEv(r.event); setErr(null); }
    catch (e: any) { setErr({ message: e.message, status: e.status }); }
  }, [eventId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const h = location.hash.slice(1) as TabId; if (TABS.some((t) => t.id === h)) setTab(h); }, []);
  const pick = (t: TabId) => { setTab(t); history.replaceState(null, "", `#${t}`); };

  async function act(kind: "publish" | "unpublish" | "cancel") {
    setBusy(true); setNotice(null);
    try {
      await api(`/api/v1/organizer/events/${eventId}/${kind}`, { method: "POST", json: kind === "cancel" ? { reason } : undefined });
      setNotice({ kind: "success", msg: kind === "publish" ? "Event published. It is now visible to everyone." : kind === "unpublish" ? "Event moved back to draft." : "Event cancelled and registrants have been notified." });
      setCancelOpen(false); await load();
    } catch (e: any) { setNotice({ kind: "error", msg: e.message, problems: e.details?.problems }); }
    finally { setBusy(false); }
  }

  if (err) return <div className="container-x py-12"><ErrorState message={err.status === 403 ? "You do not have permission to manage this event." : err.status === 404 ? "Event not found." : err.message} retry={err.status ? undefined : load} /><div className="mt-4 text-center"><Link href="/organizer" className="btn-ghost">Back to dashboard</Link></div></div>;
  if (!ev) return <div className="container-x"><Spinner /></div>;
  const closed = ev.status === "CANCELLED" || ev.status === "COMPLETED";

  return (
    <main className="container-x py-8">
      <Link href="/organizer" className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16} />All events</Link>
      <header className="card flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><StatusChip status={ev.status} />{ev.category && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink" style={{ background: ev.category.color }}>{ev.category.name}</span>}</div>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{ev.title}</h1>
          <p className="mt-2 text-sm text-white/60">{formatDate(ev.startAt, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}, {formatTime(ev.startAt)} · {ev.venue ? `${ev.venue.name}, ` : ""}{ev.mode === "ONLINE" ? "Online" : ev.city?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ev.status === "PUBLISHED" && <Link href={`/events/${ev.slug}`} className="btn-ghost"><ExternalLink size={15} />View public page</Link>}
          {!closed && <Link href={`/organizer/events/${ev.id}/edit`} className="btn-ghost"><Pencil size={15} />Edit</Link>}
          {ev.status === "DRAFT" && <button disabled={busy} onClick={() => act("publish")} className="btn-lime"><Eye size={15} />Publish</button>}
          {ev.status === "PUBLISHED" && <button disabled={busy} onClick={() => act("unpublish")} className="btn-ghost" title={ev.confirmedCount > 0 ? "Events with registrations must be cancelled instead" : undefined}><EyeOff size={15} />Unpublish</button>}
          {!closed && <button disabled={busy} onClick={() => setCancelOpen(true)} className="btn-danger"><XCircle size={15} />Cancel event</button>}
        </div>
      </header>

      {notice && <div className="mt-4"><Alert kind={notice.kind}>{notice.msg}{notice.problems && <ul className="mt-1 list-disc pl-5">{notice.problems.map((p) => <li key={p}>{p}</li>)}</ul>}</Alert></div>}
      {ev.status === "DRAFT" && <div className="mt-4"><Alert kind="info">This event is a draft. It is only visible to you until you publish it.</Alert></div>}

      {cancelOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onKeyDown={(e) => e.key === "Escape" && setCancelOpen(false)}>
          <div className="card w-full max-w-md p-6">
            <h2 id="cancel-title" className="font-display text-xl font-bold">Cancel this event?</h2>
            <p className="mt-2 text-sm text-white/65">All registered attendees will be notified. This cannot be undone.</p>
            <label className="label mt-4" htmlFor="reason">Reason (shared with attendees)</label>
            <textarea id="reason" autoFocus className="input min-h-24" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setCancelOpen(false)}>Keep event</button><button className="btn-danger" disabled={busy} onClick={() => act("cancel")}>{busy ? "Cancelling..." : "Yes, cancel event"}</button></div>
          </div>
        </div>
      )}

      <div role="tablist" aria-label="Event management sections" className="[scrollbar-width:none] mt-8 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => pick(t.id)}
            className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition", tab === t.id ? "border-lime bg-lime text-ink" : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10")}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "overview" && <OverviewTab ev={ev} />}
        {tab === "registrations" && <RegistrationsTab ev={ev} />}
        {tab === "applications" && <ApplicationsTab ev={ev} />}
        {tab === "volunteers" && <VolunteersTab ev={ev} />}
        {tab === "announcements" && <AnnouncementsTab ev={ev} />}
        {tab === "community" && <CommunityTab ev={ev} onChanged={load} />}
      </div>
    </main>
  );
}
