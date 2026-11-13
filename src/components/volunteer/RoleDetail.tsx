"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Users, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime } from "@/lib/utils";
import { IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { Alert, ErrorState } from "@/components/ui/States";
import { StatusChip, Spinner, Field } from "@/components/organizer/ui";
import { StatusTimeline, VOLUNTEER_STEPS } from "@/components/applications/StatusTimeline";

type Role = {
  id: string; title: string; description: string; responsibilities: string | null; skillsRequired: string[]; openings: number; shiftLabel: string | null; shiftStart: string | null; shiftEnd: string | null;
  eligibility: string | null; deadline: string | null; acceptedCount: number; applicantCount: number; applyBlocker: string | null;
  eventTitle: string; eventSlug: string; eventStartAt: string; eventPoster: string | null; cityName: string; collegeName: string | null;
  application: { id: string; status: string; motivation: string; shiftLabel: string | null; shiftStart: string | null; completion: string | null } | null;
};

export function RoleDetail({ id }: { id: string }) {
  const [r, setR] = useState<Role | null>(null); const [loggedIn, setLoggedIn] = useState(false); const [err, setErr] = useState<{ m: string; s?: number } | null>(null);
  const [why, setWhy] = useState(""); const [fe, setFe] = useState<string | null>(null); const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const x = await api<{ role: Role; loggedIn: boolean }>(`/api/v1/volunteer-roles/${id}`); setR(x.role); setLoggedIn(x.loggedIn); setErr(null); }
    catch (e: any) { setErr({ m: e.message, s: e.status }); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function apply(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (why.trim().length < 20) return setFe("Tell us why you want to help: at least 20 characters");
    setFe(null); setBusy(true);
    try { await api(`/api/v1/volunteer-roles/${id}/apply`, { method: "POST", json: { motivation: why.trim() } }); setMsg({ kind: "success", text: "Application sent. The organizer will get back to you." }); setWhy(""); await load(); }
    catch (er) { setMsg({ kind: "error", text: (er as Error).message }); }
    finally { setBusy(false); }
  }
  async function withdraw() {
    if (!r?.application || !confirm("Withdraw your volunteer application?")) return;
    setBusy(true); setMsg(null);
    try { await api(`/api/v1/me/volunteer-applications/${r.application.id}`, { method: "DELETE" }); await load(); }
    catch (er) { setMsg({ kind: "error", text: (er as Error).message }); }
    finally { setBusy(false); }
  }

  if (err) return <div className="container-x py-16"><ErrorState message={err.s === 404 ? "This volunteer role does not exist or is no longer available." : err.m} retry={err.s ? undefined : load} /><div className="mt-4 text-center"><Link href="/volunteer" className="btn-ghost">Browse roles</Link></div></div>;
  if (!r) return <div className="container-x"><Spinner /></div>;
  const app = r.application; const active = app && app.status !== "WITHDRAWN"; const left = Math.max(0, r.openings - r.acceptedCount);

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <SmartImage src={r.eventPoster || IMG.megaphone} alt="" className="h-full w-full opacity-25" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" />
        <div className="container-x relative z-10 py-8 sm:py-10 lg:py-12">
          <Link href="/volunteer" className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={16} />All roles</Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink"><Sparkles size={12} />Volunteer</span>
          <h1 className="section-title mt-4 !text-3xl sm:!text-5xl lg:!text-6xl">{r.title}</h1>
          <p className="mt-3 text-lg text-white/70">at <Link href={`/events/${r.eventSlug}`} className="font-semibold text-white underline-offset-4 hover:underline">{r.eventTitle}</Link></p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{formatDate(r.eventStartAt)}, {formatTime(r.eventStartAt)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{r.collegeName ? `${r.collegeName}, ` : ""}{r.cityName}</span>
            <span className="inline-flex items-center gap-1.5"><Users size={15} />{left} of {r.openings} openings left</span>
            {r.shiftLabel && <span className="inline-flex items-center gap-1.5"><Clock size={15} />{r.shiftLabel}</span>}
          </div>
        </div>
      </section>
      <div className="container-x grid gap-5 py-8 sm:gap-8 sm:py-10 lg:grid-cols-3">
        <div className="order-last space-y-6 lg:col-span-2 lg:order-first">
          <div className="card space-y-6 p-6 sm:p-8">
            <div><h2 className="font-display text-2xl font-bold">About the role</h2><p className="mt-3 whitespace-pre-wrap text-white/75">{r.description}</p></div>
            {r.responsibilities && <div><h3 className="font-display text-lg font-bold">Responsibilities</h3><p className="mt-1 whitespace-pre-wrap text-white/70">{r.responsibilities}</p></div>}
            {r.skillsRequired.length > 0 && <div><h3 className="font-display text-lg font-bold">Skills</h3><div className="mt-2 flex flex-wrap gap-2">{r.skillsRequired.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>}
            {r.eligibility && <div><h3 className="font-display text-lg font-bold">Eligibility</h3><p className="mt-1 text-white/70">{r.eligibility}</p></div>}
            {r.deadline && <p className="text-sm text-white/55">Apply by {formatDate(r.deadline)}, {formatTime(r.deadline)}</p>}
          </div>
        </div>
        <aside className="order-first space-y-4 lg:order-last lg:sticky lg:top-24 lg:self-start" aria-label="Application">
          {active && app ? (
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your application</h2><StatusChip status={app.status} /></div>
              <StatusTimeline status={app.status} steps={VOLUNTEER_STEPS} />
              {app.shiftLabel && <div className="rounded-2xl border border-lime/30 bg-lime/10 p-3 text-sm"><p className="text-xs uppercase tracking-wider text-lime">Your shift</p><p className="mt-1 font-semibold">{app.shiftLabel}</p>{app.completion && app.completion !== "PENDING" && <p className="mt-1 text-xs text-white/60">Status: {app.completion === "COMPLETED" ? "Completed" : "No show"}</p>}</div>}
              <div><p className="label">Your motivation</p><p className="whitespace-pre-wrap text-sm text-white/70">{app.motivation}</p></div>
              {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
              {app.status !== "REJECTED" && <button className="btn-danger w-full" onClick={withdraw} disabled={busy}>Withdraw application</button>}
            </div>
          ) : !loggedIn ? (
            <div className="card p-6 text-center"><h2 className="font-display text-xl font-bold">Want to help out?</h2><p className="mt-2 text-sm text-white/65">Log in to apply for this role.</p><Link href={`/login?next=${encodeURIComponent(`/volunteer/${id}`)}`} className="btn-primary mt-4 w-full">Log in to apply</Link></div>
          ) : r.applyBlocker ? (
            <div className="card p-6"><h2 className="font-display text-xl font-bold">Applications closed</h2><p className="mt-2 text-sm text-white/65">{r.applyBlocker}.</p></div>
          ) : (
            <form onSubmit={apply} className="card space-y-4 p-6" noValidate>
              <h2 className="font-display text-xl font-bold">{app?.status === "WITHDRAWN" ? "Re-apply" : "Apply to volunteer"}</h2>
              <Field label="Why do you want to help?" error={fe} hint="Relevant experience and availability."><textarea className="input min-h-32" maxLength={2000} value={why} onChange={(e) => setWhy(e.target.value)} /></Field>
              {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending..." : "Submit application"}</button>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
