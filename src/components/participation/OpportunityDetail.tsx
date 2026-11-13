"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Users, Clock, ExternalLink } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime } from "@/lib/utils";
import { CATEGORY_POSTER, IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { Alert, ErrorState } from "@/components/ui/States";
import { StatusChip, Spinner, Field, labelOf } from "@/components/organizer/ui";
import { StatusTimeline, CONTESTANT_STEPS } from "@/components/applications/StatusTimeline";
import { OPPORTUNITY_LABEL } from "@/modules/participation/schemas";

type Opp = {
  id: string; type: string; title: string; description: string; eligibility: string | null; capacity: number; deadline: string | null; status: string; acceptedCount: number; applicantCount: number;
  eventTitle: string; eventSlug: string; eventStartAt: string; eventPoster: string | null; categorySlug: string; cityName: string; collegeName: string | null; applyBlocker: string | null;
  application: { id: string; status: string; pitch: string; portfolioUrl: string | null; reviewNote: string | null; submittedAt: string } | null;
};

export function OpportunityDetail({ id }: { id: string }) {
  const [o, setO] = useState<Opp | null>(null); const [loggedIn, setLoggedIn] = useState(false); const [err, setErr] = useState<{ m: string; s?: number } | null>(null);
  const [pitch, setPitch] = useState(""); const [url, setUrl] = useState(""); const [fe, setFe] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const r = await api<{ opportunity: Opp; loggedIn: boolean }>(`/api/v1/opportunities/${id}`); setO(r.opportunity); setLoggedIn(r.loggedIn); setErr(null); }
    catch (e: any) { setErr({ m: e.message, s: e.status }); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function apply(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const v: Record<string, string> = {};
    if (pitch.trim().length < 20) v.pitch = "Tell us a bit more: at least 20 characters";
    if (url.trim() && !/^https?:\/\/\S+\.\S+/.test(url.trim())) v.url = "Enter a valid URL starting with https://";
    setFe(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await api(`/api/v1/opportunities/${id}/apply`, { method: "POST", json: { pitch: pitch.trim(), portfolioUrl: url.trim() || null } }); setMsg({ kind: "success", text: "Application submitted. You will be notified when the organizer reviews it." }); setPitch(""); setUrl(""); await load(); }
    catch (er) { setMsg({ kind: "error", text: (er as Error).message }); }
    finally { setBusy(false); }
  }
  async function withdraw() {
    if (!o?.application || !confirm("Withdraw your application?")) return;
    setBusy(true); setMsg(null);
    try { await api(`/api/v1/me/participation-applications/${o.application.id}`, { method: "DELETE" }); await load(); }
    catch (er) { setMsg({ kind: "error", text: (er as Error).message }); }
    finally { setBusy(false); }
  }

  if (err) return <div className="container-x py-16"><ErrorState message={err.s === 404 ? "This opportunity does not exist or is no longer available." : err.m} retry={err.s ? undefined : load} /><div className="mt-4 text-center"><Link href="/participate" className="btn-ghost">Browse opportunities</Link></div></div>;
  if (!o) return <div className="container-x"><Spinner /></div>;
  const app = o.application; const active = app && app.status !== "WITHDRAWN";
  const left = Math.max(0, o.capacity - o.acceptedCount);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <SmartImage src={o.eventPoster || CATEGORY_POSTER[o.categorySlug] || IMG.stageBW} alt="" className="absolute inset-0 h-full w-full opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" />
        <div className="container-x relative py-12">
          <Link href="/participate" className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={16} />All opportunities</Link>
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">{OPPORTUNITY_LABEL[o.type as keyof typeof OPPORTUNITY_LABEL] ?? o.type}</span>
          <h1 className="section-title mt-4 !text-4xl sm:!text-6xl">{o.title}</h1>
          <p className="mt-3 text-lg text-white/70">at <Link href={`/events/${o.eventSlug}`} className="font-semibold text-white underline-offset-4 hover:underline">{o.eventTitle}</Link></p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{formatDate(o.eventStartAt)}, {formatTime(o.eventStartAt)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{o.collegeName ? `${o.collegeName}, ` : ""}{o.cityName}</span>
            <span className="inline-flex items-center gap-1.5"><Users size={15} />{left} of {o.capacity} spots left</span>
            {o.deadline && <span className="inline-flex items-center gap-1.5"><Clock size={15} />Apply by {formatDate(o.deadline)}, {formatTime(o.deadline)}</span>}
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6 sm:p-8"><h2 className="font-display text-2xl font-bold">About this opportunity</h2><p className="mt-3 whitespace-pre-wrap text-white/75">{o.description}</p>
            {o.eligibility && <><h3 className="mt-6 font-display text-lg font-bold">Eligibility</h3><p className="mt-1 text-white/70">{o.eligibility}</p></>}</div>
        </div>

        <aside className="space-y-4" aria-label="Application">
          {active && app ? (
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your application</h2><StatusChip status={app.status} /></div>
              <StatusTimeline status={app.status} steps={CONTESTANT_STEPS} />
              {app.reviewNote && <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"><p className="text-xs uppercase tracking-wider text-white/50">Note from organizer</p><p className="mt-1">{app.reviewNote}</p></div>}
              <div><p className="label">Your pitch</p><p className="whitespace-pre-wrap text-sm text-white/70">{app.pitch}</p>{app.portfolioUrl && <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1 text-xs text-lime hover:underline"><ExternalLink size={12} />Portfolio</a>}</div>
              {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
              {app.status !== "REJECTED" ? <button className="btn-danger w-full" onClick={withdraw} disabled={busy}>Withdraw application</button> : <p className="text-xs text-white/50">Thanks for applying. Keep an eye out for more opportunities.</p>}
            </div>
          ) : !loggedIn ? (
            <div className="card p-6 text-center"><h2 className="font-display text-xl font-bold">Ready to apply?</h2><p className="mt-2 text-sm text-white/65">Log in to submit your application and track its status.</p><Link href={`/login?next=${encodeURIComponent(`/participate/${id}`)}`} className="btn-primary mt-4 w-full">Log in to apply</Link></div>
          ) : o.applyBlocker ? (
            <div className="card p-6"><h2 className="font-display text-xl font-bold">Applications closed</h2><p className="mt-2 text-sm text-white/65">{o.applyBlocker}.</p>{app?.status === "WITHDRAWN" && <p className="mt-2 text-xs text-white/50">You previously withdrew your application.</p>}</div>
          ) : (
            <form onSubmit={apply} className="card space-y-4 p-6" noValidate>
              <h2 className="font-display text-xl font-bold">{app?.status === "WITHDRAWN" ? "Re-apply" : "Apply now"}</h2>
              <Field label="Your pitch" error={fe.pitch} hint="Experience, what you will bring, links to past work."><textarea className="input min-h-32" maxLength={3000} value={pitch} onChange={(e) => setPitch(e.target.value)} /></Field>
              <Field label="Portfolio link (optional)" error={fe.url}><input type="url" className="input" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
              {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Submitting..." : "Submit application"}</button>
            </form>
          )}
          {app && app.status === "WITHDRAWN" && <p className="text-center text-xs text-white/40">Status: {labelOf(app.status)}</p>}
        </aside>
      </div>
    </main>
  );
}
