"use client";
import Link from "next/link";
import { useState } from "react";
import { Users, ExternalLink } from "lucide-react";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";
import { Field } from "../ui";
import type { ManagedEvent } from "../ManageEvent";

export function CommunityTab({ ev, onChanged }: { ev: ManagedEvent; onChanged: () => void }) {
  const [name, setName] = useState(`${ev.title} Community`); const [description, setDescription] = useState(`Meet other attendees of ${ev.title}, get updates and find teammates.`);
  const [joinPolicy, setJoinPolicy] = useState("REGISTERED_ONLY");
  const [err, setErr] = useState<string | null>(null); const [fe, setFe] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const v: Record<string, string> = {};
    if (name.trim().length < 3) v.name = "Name must be at least 3 characters";
    if (description.trim().length < 10) v.description = "Add a short description";
    setFe(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await api("/api/v1/communities", { method: "POST", json: { type: "EVENT", eventId: ev.id, name: name.trim(), description: description.trim(), joinPolicy } }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  if (ev.communitySlug) return (
    <div className="card flex flex-col items-start gap-4 p-8">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient"><Users /></div>
      <h3 className="font-display text-2xl font-bold">Your event community is live</h3>
      <p className="max-w-xl text-sm text-white/65">Attendees can discuss, meet each other and see your announcements there. Announcements you publish from the dashboard are posted to it automatically.</p>
      <Link href={`/communities/${ev.communitySlug}`} className="btn-primary"><ExternalLink size={15} />Open community</Link>
    </div>
  );
  return (
    <form onSubmit={create} className="card max-w-2xl space-y-4 p-6 sm:p-8" noValidate>
      <h3 className="font-display text-2xl font-bold">Create an event community</h3>
      <p className="text-sm text-white/65">A dedicated space for attendees: discussions, announcements and networking.</p>
      <Field label="Community name" error={fe.name}><input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Description" error={fe.description}><textarea className="input min-h-24" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Who can join?"><select className="input" value={joinPolicy} onChange={(e) => setJoinPolicy(e.target.value)}><option value="REGISTERED_ONLY">Registered attendees only</option><option value="OPEN">Anyone</option><option value="APPROVAL">Anyone, with my approval</option></select></Field>
      {err && <Alert>{err}</Alert>}
      <button className="btn-primary" disabled={busy || ev.status === "CANCELLED"}><Users size={15} />{busy ? "Creating..." : "Create community"}</button>
    </form>
  );
}
