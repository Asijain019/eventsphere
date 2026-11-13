"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, ChevronDown, ExternalLink } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { OPPORTUNITY_TYPES, OPPORTUNITY_LABEL, APPLICATION_TRANSITIONS } from "@/modules/participation/schemas";
import { toISTInput, fromISTInput } from "@/modules/organizer/datetime";
import { Field, StatusChip, labelOf } from "../ui";
import type { ManagedEvent } from "../ManageEvent";

type Opp = { id: string; type: string; title: string; description: string; capacity: number; deadline: string | null; status: string; acceptedCount: number; applicantCount: number };
type Applicant = { id: string; status: string; pitch: string; portfolioUrl: string | null; reviewNote: string | null; submittedAt: string; userId: string; name: string; email: string; collegeName: string | null; skills: string[] | null };

function Applicants({ opp, onChange }: { opp: Opp; onChange: () => void }) {
  const [items, setItems] = useState<Applicant[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, { status: string; note: string }>>({}); const [msg, setMsg] = useState<{ id: string; text: string } | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => { setErr(null); api<{ items: Applicant[] }>(`/api/v1/organizer/opportunities/${opp.id}/applications`).then((r) => setItems(r.items)).catch((e) => setErr(e.message)); }, [opp.id]);
  useEffect(load, [load]);
  async function update(a: Applicant) {
    const e = edit[a.id]; if (!e?.status) return;
    setBusy(a.id); setMsg(null);
    try { await api(`/api/v1/organizer/applications/${a.id}/status`, { method: "PATCH", json: { status: e.status, reviewNote: e.note || null } }); setEdit((p) => { const n = { ...p }; delete n[a.id]; return n; }); load(); onChange(); }
    catch (er) { setMsg({ id: a.id, text: (er as Error).message }); }
    finally { setBusy(null); }
  }
  if (err) return <ErrorState message={err} retry={load} />;
  if (!items) return <Skeleton className="h-20" />;
  if (!items.length) return <p className="py-4 text-sm text-white/50">No applications yet.</p>;
  return (
    <ul className="divide-y divide-white/10">
      {items.map((a) => {
        const next = APPLICATION_TRANSITIONS[a.status] ?? []; const e = edit[a.id];
        return (
          <li key={a.id} className="py-4">
            <div className="flex flex-wrap items-center gap-2"><b>{a.name}</b><StatusChip status={a.status} /><span className="text-xs text-white/50">{a.collegeName ?? a.email}</span></div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{a.pitch}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/50">
              {a.portfolioUrl && <a href={a.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-lime hover:underline"><ExternalLink size={12} />Portfolio</a>}
              <span>Applied {formatDate(a.submittedAt)}</span>{a.skills?.length ? <span>Skills: {a.skills.join(", ")}</span> : null}
            </div>
            {a.reviewNote && <p className="mt-2 text-xs text-white/60">Note: {a.reviewNote}</p>}
            {a.status === "WITHDRAWN" ? <p className="mt-2 text-xs text-white/40">The applicant withdrew; status cannot be changed.</p> : next.length === 0 ? <p className="mt-2 text-xs text-white/40">Final status: {labelOf(a.status)}.</p> : (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select aria-label={`New status for ${a.name}`} className="input !w-full !py-2 sm:!w-48" value={e?.status ?? ""} onChange={(ev) => setEdit((p) => ({ ...p, [a.id]: { status: ev.target.value, note: p[a.id]?.note ?? "" } }))}>
                  <option value="">Change status...</option>{next.map((s) => <option key={s} value={s}>{labelOf(s)}</option>)}
                </select>
                <input aria-label={`Note to ${a.name}`} className="input !py-2 sm:flex-1" placeholder="Optional note to the applicant" maxLength={1000} value={e?.note ?? ""} onChange={(ev) => setEdit((p) => ({ ...p, [a.id]: { status: p[a.id]?.status ?? "", note: ev.target.value } }))} />
                <button className="btn-primary !py-2" disabled={!e?.status || busy === a.id} onClick={() => update(a)}>{busy === a.id ? "Saving..." : "Update"}</button>
              </div>
            )}
            {msg?.id === a.id && <div className="mt-2"><Alert>{msg.text}</Alert></div>}
          </li>
        );
      })}
    </ul>
  );
}

export function ApplicationsTab({ ev }: { ev: ManagedEvent }) {
  const [opps, setOpps] = useState<Opp[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null); const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ type: "HACKATHON", title: "", description: "", eligibility: "", capacity: "50", deadline: "" });
  const [fe, setFe] = useState<Record<string, string>>({}); const [formErr, setFormErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setErr(null); api<{ items: Opp[] }>(`/api/v1/organizer/events/${ev.id}/opportunities`).then((r) => setOpps(r.items)).catch((e) => setErr(e.message)); }, [ev.id]);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setFormErr(null);
    const v: Record<string, string> = {};
    if (f.title.trim().length < 3) v.title = "Title must be at least 3 characters";
    if (f.description.trim().length < 20) v.description = "Description must be at least 20 characters";
    if (!(Number(f.capacity) >= 1)) v.capacity = "Capacity must be at least 1";
    if (f.deadline && new Date(fromISTInput(f.deadline)!) > new Date(ev.startAt)) v.deadline = "Deadline must be before the event starts";
    setFe(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await api(`/api/v1/organizer/events/${ev.id}/opportunities`, { method: "POST", json: { type: f.type, title: f.title, description: f.description, eligibility: f.eligibility || null, capacity: Number(f.capacity), deadline: fromISTInput(f.deadline) } }); setCreating(false); setF({ type: "HACKATHON", title: "", description: "", eligibility: "", capacity: "50", deadline: "" }); load(); }
    catch (er) { setFormErr((er as Error).message); }
    finally { setBusy(false); }
  }
  async function toggle(o: Opp) { try { await api(`/api/v1/organizer/opportunities/${o.id}`, { method: "PATCH", json: { status: o.status === "OPEN" ? "CLOSED" : "OPEN" } }); load(); } catch (e) { setErr((e as Error).message); } }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold">Contestants and performers</h2><p className="text-sm text-white/60">Open slots for competitions, performances and talks. Review applications and shortlist the best.</p></div>
        <button className="btn-lime" onClick={() => setCreating((v) => !v)} aria-expanded={creating} disabled={ev.status === "CANCELLED"}><Plus size={16} />New opportunity</button>
      </div>
      {creating && (
        <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-2" noValidate>
          <Field label="Type"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{OPPORTUNITY_TYPES.map((t) => <option key={t} value={t}>{OPPORTUNITY_LABEL[t]}</option>)}</select></Field>
          <Field label="Title" error={fe.title}><input className="input" value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Solo classical dance" /></Field>
          <Field label="Description" error={fe.description} className="sm:col-span-2"><textarea className="input min-h-24" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What will participants do? Format, rules, judging..." /></Field>
          <Field label="Eligibility (optional)" className="sm:col-span-2"><input className="input" value={f.eligibility} onChange={(e) => setF({ ...f, eligibility: e.target.value })} /></Field>
          <Field label="Spots (accepted participants)" error={fe.capacity}><input inputMode="numeric" className="input" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Field label="Application deadline (IST, optional)" error={fe.deadline}><input type="datetime-local" className="input" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
          {formErr && <div className="sm:col-span-2"><Alert>{formErr}</Alert></div>}
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create opportunity"}</button><button type="button" className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button></div>
        </form>
      )}
      {err && <ErrorState message={err} retry={load} />}
      {!opps && !err && <Skeleton className="h-32" />}
      {opps?.length === 0 && !creating && <EmptyState title="No opportunities yet" body="Create a competition slot or performance spot and people can start applying." />}
      {opps?.map((o) => (
        <section key={o.id} className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-5">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusChip status={o.status} /><span className="chip">{OPPORTUNITY_LABEL[o.type as keyof typeof OPPORTUNITY_LABEL] ?? o.type}</span></div>
              <h3 className="mt-2 font-display text-xl font-bold">{o.title}</h3>
              <p className="mt-1 text-xs text-white/55">{o.acceptedCount}/{o.capacity} accepted · {o.applicantCount} applicant{o.applicantCount === 1 ? "" : "s"}{o.deadline ? ` · closes ${formatDate(o.deadline)} ${formatTime(o.deadline)}` : ""}</p></div>
            <button className="btn-ghost !py-2" onClick={() => toggle(o)}>{o.status === "OPEN" ? "Close applications" : "Reopen"}</button>
            <button className="btn-primary !py-2" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>Applicants<ChevronDown size={15} className={cn("transition", open === o.id && "rotate-180")} /></button>
          </div>
          {open === o.id && <div className="border-t border-white/10 bg-ink/40 px-5"><Applicants opp={o} onChange={load} /></div>}
        </section>
      ))}
    </div>
  );
}
