"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";
import { SKILLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Ev = { id: string; title: string; minTeamSize: number; maxTeamSize: number };
export function NewTeamForm({ events, initialEventId }: { events: Ev[]; initialEventId?: string }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events.find((e) => e.id === initialEventId)?.id ?? events[0]?.id ?? "");
  const ev = events.find((e) => e.id === eventId);
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [roles, setRoles] = useState<string[]>([]);
  const [maxSize, setMaxSize] = useState<number | "">(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const toggle = (s: string) => setRoles((r) => (r.includes(s) ? r.filter((x) => x !== s) : [...r, s]));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { const r = await api<{ team: { id: string } }>(`/api/v1/events/${eventId}/teams`, { method: "POST", json: { name, description: description || undefined, openRoles: roles, maxSize: maxSize || undefined } }); router.push(`/teams/${r.team.id}`); router.refresh(); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8">
      <div><label className="label" htmlFor="ev">Event</label>
        <select id="ev" className="input" value={eventId} onChange={(e) => { setEventId(e.target.value); setMaxSize(""); }} required>{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
        {ev && <p className="mt-1 text-xs text-white/50">Teams of {ev.minTeamSize === ev.maxTeamSize ? ev.maxTeamSize : `${ev.minTeamSize}–${ev.maxTeamSize}`} members.</p>}</div>
      <div><label className="label" htmlFor="tn">Team name</label><input id="tn" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} placeholder="e.g. Byte Me" /></div>
      <div><label className="label" htmlFor="td">What are you building / aiming for?</label><textarea id="td" className="input min-h-28" maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div><label className="label" htmlFor="ts">Team size (max {ev?.maxTeamSize ?? "—"})</label><input id="ts" type="number" className="input !w-32" min={1} max={ev?.maxTeamSize} value={maxSize} placeholder={String(ev?.maxTeamSize ?? "")} onChange={(e) => setMaxSize(e.target.value ? Number(e.target.value) : "")} /></div>
      <fieldset><legend className="label">Skills you need</legend>
        <div className="mt-2 flex flex-wrap gap-2">{SKILLS.map((s) => <button type="button" key={s} aria-pressed={roles.includes(s)} onClick={() => toggle(s)} className={cn("rounded-full border px-3 py-1.5 text-sm transition", roles.includes(s) ? "border-lime bg-lime text-ink" : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10")}>{s}</button>)}</div></fieldset>
      {err && <Alert>{err}</Alert>}
      <button className="btn-primary w-full !py-3.5" disabled={busy || !eventId}>{busy ? "Creating…" : "Create team"}</button>
    </form>
  );
}
