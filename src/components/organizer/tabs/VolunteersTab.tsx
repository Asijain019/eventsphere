"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { fromISTInput } from "@/modules/organizer/datetime";
import { Field, StatusChip } from "../ui";
import type { ManagedEvent } from "../ManageEvent";

type Role = { id: string; title: string; description: string; skillsRequired: string[]; openings: number; shiftLabel: string | null; deadline: string | null; status: string; acceptedCount: number; applicantCount: number };
type Applicant = { id: string; status: string; motivation: string; appliedAt: string; name: string; email: string; collegeName: string | null; skills: string[] | null; shiftLabel: string | null; completion: string | null; assignmentId: string | null };

function Applicants({ role, onChange }: { role: Role; onChange: () => void }) {
  const [items, setItems] = useState<Applicant[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const [shift, setShift] = useState<Record<string, string>>({}); const [msg, setMsg] = useState<{ id: string; text: string } | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => { setErr(null); api<{ items: Applicant[] }>(`/api/v1/organizer/volunteer-roles/${role.id}/applications`).then((r) => setItems(r.items)).catch((e) => setErr(e.message)); }, [role.id]);
  useEffect(load, [load]);
  async function patch(a: Applicant, body: Record<string, unknown>) {
    setBusy(a.id); setMsg(null);
    try { await api(`/api/v1/organizer/volunteer-applications/${a.id}`, { method: "PATCH", json: body }); load(); onChange(); }
    catch (e) { setMsg({ id: a.id, text: (e as Error).message }); }
    finally { setBusy(null); }
  }
  if (err) return <ErrorState message={err} retry={load} />;
  if (!items) return <Skeleton className="h-20" />;
  if (!items.length) return <p className="py-4 text-sm text-white/50">No volunteer applications yet.</p>;
  return (
    <ul className="divide-y divide-white/10">
      {items.map((a) => (
        <li key={a.id} className="py-4">
          <div className="flex flex-wrap items-center gap-2"><b>{a.name}</b><StatusChip status={a.status} />{a.completion && <StatusChip status={a.completion === "COMPLETED" ? "COMPLETED_V" : a.completion} className={a.completion === "COMPLETED" ? "!bg-lime !text-ink" : ""} />}<span className="text-xs text-white/50">{a.collegeName ?? a.email}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{a.motivation}</p>
          {a.skills?.length ? <p className="mt-1 text-xs text-white/50">Skills: {a.skills.join(", ")}</p> : null}
          {a.status === "WITHDRAWN" && <p className="mt-2 text-xs text-white/40">The applicant withdrew.</p>}
          {a.status !== "WITHDRAWN" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {a.status !== "ACCEPTED" && <button className="btn-lime !py-1.5" disabled={busy === a.id} onClick={() => patch(a, { action: "ACCEPT" })}>Accept</button>}
              {a.status !== "REJECTED" && <button className="btn-danger !py-1.5" disabled={busy === a.id} onClick={() => patch(a, { action: "REJECT" })}>Reject</button>}
              {a.status === "ACCEPTED" && (<>
                <input aria-label={`Shift for ${a.name}`} className="input !w-52 !py-1.5" placeholder="Shift, e.g. Day 1, 9am-1pm" maxLength={80} value={shift[a.id] ?? a.shiftLabel ?? ""} onChange={(e) => setShift({ ...shift, [a.id]: e.target.value })} />
                <button className="btn-ghost !py-1.5" disabled={busy === a.id || !(shift[a.id] ?? a.shiftLabel ?? "").trim()} onClick={() => patch(a, { action: "ASSIGN_SHIFT", shiftLabel: (shift[a.id] ?? a.shiftLabel ?? "").trim() })}>{a.assignmentId ? "Update shift" : "Assign shift"}</button>
                {a.assignmentId && <select aria-label={`Completion for ${a.name}`} className="input !w-40 !py-1.5" value={a.completion ?? "PENDING"} onChange={(e) => patch(a, { action: "SET_COMPLETION", completion: e.target.value })}><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="NO_SHOW">No show</option></select>}
              </>)}
            </div>
          )}
          {msg?.id === a.id && <div className="mt-2"><Alert>{msg.text}</Alert></div>}
        </li>
      ))}
    </ul>
  );
}

const BLANK = { title: "", description: "", responsibilities: "", skills: "", openings: "5", shiftLabel: "", shiftStart: "", shiftEnd: "", eligibility: "", deadline: "" };
export function VolunteersTab({ ev }: { ev: ManagedEvent }) {
  const [roles, setRoles] = useState<Role[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null); const [creating, setCreating] = useState(false);
  const [f, setF] = useState(BLANK); const [fe, setFe] = useState<Record<string, string>>({}); const [formErr, setFormErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setErr(null); api<{ items: Role[] }>(`/api/v1/organizer/events/${ev.id}/volunteer-roles`).then((r) => setRoles(r.items)).catch((e) => setErr(e.message)); }, [ev.id]);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setFormErr(null);
    const v: Record<string, string> = {};
    if (f.title.trim().length < 3) v.title = "Role name must be at least 3 characters";
    if (f.description.trim().length < 10) v.description = "Description must be at least 10 characters";
    if (!(Number(f.openings) >= 1)) v.openings = "At least one opening";
    if (f.shiftStart && f.shiftEnd && f.shiftEnd <= f.shiftStart) v.shiftEnd = "Shift end must be after start";
    if (f.deadline && new Date(fromISTInput(f.deadline)!) > new Date(ev.startAt)) v.deadline = "Deadline must be before the event starts";
    setFe(v); if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await api(`/api/v1/organizer/events/${ev.id}/volunteer-roles`, { method: "POST", json: {
        title: f.title, description: f.description, responsibilities: f.responsibilities || null, skillsRequired: f.skills.split(",").map((s) => s.trim()).filter(Boolean),
        openings: Number(f.openings), shiftLabel: f.shiftLabel || null, shiftStart: fromISTInput(f.shiftStart), shiftEnd: fromISTInput(f.shiftEnd), eligibility: f.eligibility || null, deadline: fromISTInput(f.deadline),
      } });
      setCreating(false); setF(BLANK); load();
    } catch (er) { setFormErr((er as Error).message); }
    finally { setBusy(false); }
  }
  async function toggle(r: Role) { try { await api(`/api/v1/organizer/volunteer-roles/${r.id}`, { method: "PATCH", json: { status: r.status === "OPEN" ? "CLOSED" : "OPEN" } }); load(); } catch (e) { setErr((e as Error).message); } }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-bold">Volunteer roles</h2><p className="text-sm text-white/60">Post what you need help with, accept volunteers, assign shifts and track completion.</p></div>
        <button className="btn-lime" onClick={() => setCreating((v) => !v)} aria-expanded={creating} disabled={ev.status === "CANCELLED"}><Plus size={16} />New role</button>
      </div>
      {creating && (
        <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-2" noValidate>
          <Field label="Role name" error={fe.title}><input className="input" value={f.title} maxLength={100} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Registration desk" /></Field>
          <Field label="Openings" error={fe.openings}><input inputMode="numeric" className="input" value={f.openings} onChange={(e) => setF({ ...f, openings: e.target.value })} /></Field>
          <Field label="Description" error={fe.description} className="sm:col-span-2"><textarea className="input min-h-20" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Responsibilities" className="sm:col-span-2"><textarea className="input min-h-20" value={f.responsibilities} onChange={(e) => setF({ ...f, responsibilities: e.target.value })} placeholder="Check tickets, guide attendees..." /></Field>
          <Field label="Skills required" hint="Comma separated"><input className="input" value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} placeholder="Communication, Photography" /></Field>
          <Field label="Eligibility"><input className="input" value={f.eligibility} onChange={(e) => setF({ ...f, eligibility: e.target.value })} /></Field>
          <Field label="Shift label"><input className="input" maxLength={80} value={f.shiftLabel} onChange={(e) => setF({ ...f, shiftLabel: e.target.value })} placeholder="Day 1, 9am-1pm" /></Field>
          <Field label="Application deadline (IST)" error={fe.deadline}><input type="datetime-local" className="input" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
          <Field label="Shift start (IST)"><input type="datetime-local" className="input" value={f.shiftStart} onChange={(e) => setF({ ...f, shiftStart: e.target.value })} /></Field>
          <Field label="Shift end (IST)" error={fe.shiftEnd}><input type="datetime-local" className="input" value={f.shiftEnd} onChange={(e) => setF({ ...f, shiftEnd: e.target.value })} /></Field>
          {formErr && <div className="sm:col-span-2"><Alert>{formErr}</Alert></div>}
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create role"}</button><button type="button" className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button></div>
        </form>
      )}
      {err && <ErrorState message={err} retry={load} />}
      {!roles && !err && <Skeleton className="h-32" />}
      {roles?.length === 0 && !creating && <EmptyState title="No volunteer roles yet" body="Add roles like ushers, registration desk or social media crew." />}
      {roles?.map((r) => (
        <section key={r.id} className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-5">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusChip status={r.status} />{r.skillsRequired.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{r.title}</h3>
              <p className="mt-1 text-xs text-white/55">{r.acceptedCount}/{r.openings} filled · {r.applicantCount} applicant{r.applicantCount === 1 ? "" : "s"}{r.shiftLabel ? ` · ${r.shiftLabel}` : ""}{r.deadline ? ` · closes ${formatDate(r.deadline)} ${formatTime(r.deadline)}` : ""}</p></div>
            <button className="btn-ghost !py-2" onClick={() => toggle(r)}>{r.status === "OPEN" ? "Close role" : "Reopen"}</button>
            <button className="btn-primary !py-2" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>Applicants<ChevronDown size={15} className={cn("transition", open === r.id && "rotate-180")} /></button>
          </div>
          {open === r.id && <div className="border-t border-white/10 bg-ink/40 px-5"><Applicants role={r} onChange={load} /></div>}
        </section>
      ))}
    </div>
  );
}
