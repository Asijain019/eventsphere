"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatusChip } from "@/components/organizer/ui";
import { OPPORTUNITY_LABEL } from "@/modules/participation/schemas";
import { StatusTimeline, CONTESTANT_STEPS, VOLUNTEER_STEPS } from "./StatusTimeline";

type CApp = { id: string; status: string; pitch: string; reviewNote: string | null; submittedAt: string; opportunityId: string; opportunityTitle: string; type: string; eventTitle: string; eventSlug: string; eventStartAt: string };
type VApp = { id: string; status: string; motivation: string; appliedAt: string; roleId: string; roleTitle: string; eventTitle: string; eventSlug: string; eventStartAt: string; shiftLabel: string | null; completion: string | null };

export function MyApplications({ initialTab }: { initialTab: "contestant" | "volunteer" }) {
  const [tab, setTab] = useState(initialTab);
  const [c, setC] = useState<CApp[] | null>(null); const [v, setV] = useState<VApp[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try { const [a, b] = await Promise.all([api<{ items: CApp[] }>("/api/v1/me/participation-applications"), api<{ items: VApp[] }>("/api/v1/me/volunteer-applications")]); setC(a.items); setV(b.items); }
    catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function withdraw(kind: "participation" | "volunteer", id: string) {
    if (!confirm("Withdraw this application?")) return;
    setBusy(id); setMsg(null);
    try { await api(`/api/v1/me/${kind}-applications/${id}`, { method: "DELETE" }); await load(); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(null); }
  }
  const canWithdraw = (s: string) => s !== "WITHDRAWN" && s !== "REJECTED";

  return (
    <main className="container-x py-10">
      <h1 className="section-title !text-4xl sm:!text-5xl">My applications</h1>
      <p className="mt-3 text-white/60">Track every contest, performance and volunteer application in one place.</p>
      <div role="tablist" aria-label="Application type" className="mt-8 flex gap-2">
        {([["contestant", `Contestant${c ? ` (${c.length})` : ""}`], ["volunteer", `Volunteer${v ? ` (${v.length})` : ""}`]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("rounded-full border px-5 py-2 text-sm font-semibold transition", tab === id ? "border-lime bg-lime text-ink" : "border-white/15 bg-white/5 hover:bg-white/10")}>{label}</button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {msg && <Alert>{msg}</Alert>}
        {err && <ErrorState message={err} retry={load} />}
        {!err && (tab === "contestant" ? c : v) === null && <><Skeleton className="h-36" /><Skeleton className="h-36" /></>}

        {tab === "contestant" && c?.length === 0 && <EmptyState title="No contestant applications" body="Apply to hackathons, performances, quizzes and more." action={<Link href="/participate" className="btn-primary">Browse opportunities</Link>} />}
        {tab === "contestant" && c?.map((a) => (
          <article key={a.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex flex-wrap items-center gap-2"><StatusChip status={a.status} /><span className="chip">{OPPORTUNITY_LABEL[a.type as keyof typeof OPPORTUNITY_LABEL] ?? a.type}</span></div>
                <h2 className="mt-2 font-display text-xl font-bold">{a.opportunityTitle}</h2>
                <p className="text-sm text-white/60"><Link href={`/events/${a.eventSlug}`} className="hover:text-white hover:underline">{a.eventTitle}</Link> · {formatDate(a.eventStartAt)}</p></div>
              <div className="flex gap-2"><Link href={`/participate/${a.opportunityId}`} className="btn-ghost !py-1.5">View</Link>{canWithdraw(a.status) && <button className="btn-danger !py-1.5" disabled={busy === a.id} onClick={() => withdraw("participation", a.id)}>Withdraw</button>}</div>
            </div>
            <StatusTimeline status={a.status} steps={CONTESTANT_STEPS} />
            {a.reviewNote && <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><span className="text-xs uppercase tracking-wider text-white/50">Organizer note: </span>{a.reviewNote}</p>}
            <p className="text-xs text-white/45">Applied {formatDate(a.submittedAt)}, {formatTime(a.submittedAt)}</p>
          </article>
        ))}

        {tab === "volunteer" && v?.length === 0 && <EmptyState title="No volunteer applications" body="Help run an event and gain experience." action={<Link href="/volunteer" className="btn-primary">Find a role</Link>} />}
        {tab === "volunteer" && v?.map((a) => (
          <article key={a.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><StatusChip status={a.status} /><h2 className="mt-2 font-display text-xl font-bold">{a.roleTitle}</h2>
                <p className="text-sm text-white/60"><Link href={`/events/${a.eventSlug}`} className="hover:text-white hover:underline">{a.eventTitle}</Link> · {formatDate(a.eventStartAt)}</p></div>
              <div className="flex gap-2"><Link href={`/volunteer/${a.roleId}`} className="btn-ghost !py-1.5">View</Link>{canWithdraw(a.status) && <button className="btn-danger !py-1.5" disabled={busy === a.id} onClick={() => withdraw("volunteer", a.id)}>Withdraw</button>}</div>
            </div>
            <StatusTimeline status={a.status} steps={VOLUNTEER_STEPS} />
            {a.shiftLabel && <p className="rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm"><span className="text-xs uppercase tracking-wider text-lime">Your shift: </span><b>{a.shiftLabel}</b>{a.completion && a.completion !== "PENDING" ? ` · ${a.completion === "COMPLETED" ? "Completed" : "No show"}` : ""}</p>}
            <p className="text-xs text-white/45">Applied {formatDate(a.appliedAt)}, {formatTime(a.appliedAt)}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
