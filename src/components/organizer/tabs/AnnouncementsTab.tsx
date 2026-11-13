"use client";
import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime } from "@/lib/utils";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Field } from "../ui";
import type { ManagedEvent } from "../ManageEvent";

type A = { id: string; title: string; body: string; createdAt: string };

export function AnnouncementsTab({ ev }: { ev: ManagedEvent }) {
  const [items, setItems] = useState<A[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({}); const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setErr(null); api<{ items: A[] }>(`/api/v1/organizer/events/${ev.id}/announcements`).then((r) => setItems(r.items)).catch((e) => setErr(e.message)); }, [ev.id]);
  useEffect(load, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const v: Record<string, string> = {};
    if (title.trim().length < 3) v.title = "Title must be at least 3 characters";
    if (body.trim().length < 5) v.body = "Write a short message";
    setFe(v); if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const r = await api<{ notified: number; communityPosts: number }>(`/api/v1/organizer/events/${ev.id}/announcements`, { method: "POST", json: { title, body } });
      setMsg({ kind: "success", text: `Sent to ${r.notified} registered attendee${r.notified === 1 ? "" : "s"}${r.communityPosts ? " and posted in the event community" : ""}.` });
      setTitle(""); setBody(""); load();
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={send} className="card space-y-4 p-6 lg:col-span-2" noValidate>
        <h3 className="font-display text-xl font-bold">New announcement</h3>
        <p className="text-sm text-white/60">Registered attendees get an in-app notification{ev.communitySlug ? ", and it is pinned in the event community" : ""}.</p>
        <Field label="Title" error={fe.title}><input className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Doors open at 9:00 AM" /></Field>
        <Field label="Message" error={fe.body}><textarea className="input min-h-32" maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share schedule changes, entry instructions, reminders..." /></Field>
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button className="btn-primary" disabled={busy || ev.status === "CANCELLED"}><Send size={15} />{busy ? "Sending..." : "Publish announcement"}</button>
        {ev.status === "CANCELLED" && <p className="text-xs text-white/50">Announcements are disabled for cancelled events.</p>}
      </form>
      <div className="space-y-3 lg:col-span-3">
        <h3 className="font-display text-xl font-bold">History</h3>
        {err && <ErrorState message={err} retry={load} />}
        {!items && !err && <><Skeleton className="h-24" /><Skeleton className="h-24" /></>}
        {items?.length === 0 && <EmptyState title="No announcements yet" body="Your published announcements will be listed here." />}
        {items?.map((a) => (
          <article key={a.id} className="card p-5"><div className="flex items-start justify-between gap-3"><h4 className="font-display text-lg font-bold">{a.title}</h4><time className="shrink-0 text-xs text-white/50" dateTime={a.createdAt}>{formatDate(a.createdAt)}, {formatTime(a.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{a.body}</p></article>
        ))}
      </div>
    </div>
  );
}
