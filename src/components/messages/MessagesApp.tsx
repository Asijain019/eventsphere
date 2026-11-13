"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { api } from "@/lib/client";
import { Avatar } from "@/components/social/Avatar";
import { EmptyState, ErrorState, Skeleton, Alert } from "@/components/ui/States";
import { cn } from "@/lib/utils";

type Conv = { id: string; other: { id: string; name: string; avatarUrl: string | null }; lastMessage: { body: string; senderId: string; createdAt: string } | null; unread: number };
type Msg = { id: string; senderId: string; body: string; createdAt: string };
type Thread = { items: Msg[]; hasMore: boolean; nextBefore: string | null; other: { id: string; name: string; avatarUrl: string | null }; canSend: boolean };
const POLL_MS = 5000;
const time = (d: string) => new Date(d).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

export function MessagesApp({ activeId, withUser, viewerId }: { activeId?: string; withUser?: string; viewerId: string }) {
  const router = useRouter();
  const [convs, setConvs] = useState<Conv[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const loadList = useCallback(async () => { try { setConvs((await api<{ items: Conv[] }>("/api/v1/conversations")).items); setErr(null); } catch (e: any) { setErr(e.message); } }, []);
  useEffect(() => { loadList(); const t = setInterval(loadList, POLL_MS); return () => clearInterval(t); }, [loadList]);

  const [startErr, setStartErr] = useState<string | null>(null);
  useEffect(() => { // /messages?with=<userId>: open or create conversation (403 NOT_CONNECTED if not allowed)
    if (!withUser || activeId) return;
    api<{ id: string }>("/api/v1/conversations", { method: "POST", json: { userId: withUser } }).then((c) => router.replace(`/messages/${c.id}`)).catch((e) => setStartErr(e.message));
  }, [withUser, activeId, router]);

  return (
    <div className="grid h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-ink2/80 md:grid-cols-[320px_1fr]">
      <section aria-label="Conversations" className={cn("flex min-h-0 flex-col border-white/10 md:border-r", activeId && "hidden md:flex")}>
        <div className="border-b border-white/10 p-4"><h1 className="font-display text-2xl font-bold">Messages</h1></div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {startErr && <div className="p-3"><Alert>{startErr}</Alert></div>}
          {err ? <div className="p-3"><ErrorState message={err} retry={loadList} /></div> : !convs ? <div className="space-y-2 p-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : convs.length === 0 ? (
            <div className="p-4 text-sm text-white/60">No conversations yet. Connect with people, then message them from <Link href="/my/network" className="underline">your network</Link>.</div>
          ) : (
            <ul>
              {convs.map((c) => (
                <li key={c.id}>
                  <Link href={`/messages/${c.id}`} aria-current={c.id === activeId ? "page" : undefined} className={cn("flex items-center gap-3 px-4 py-3 transition hover:bg-white/5", c.id === activeId && "bg-white/10")}>
                    <Avatar name={c.other.name} src={c.other.avatarUrl} size={44} />
                    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{c.other.name}</span>{c.lastMessage && <span className="shrink-0 text-[11px] text-white/40">{time(c.lastMessage.createdAt)}</span>}</span>
                      <span className="block truncate text-sm text-white/55">{c.lastMessage ? `${c.lastMessage.senderId === viewerId ? "You: " : ""}${c.lastMessage.body}` : "Say hello"}</span></span>
                    {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-magenta px-1.5 text-[11px] font-bold" aria-label={`${c.unread} unread`}>{c.unread}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section aria-label="Conversation" className={cn("flex min-h-0 flex-col", !activeId && "hidden md:flex")}>
        {activeId ? <ThreadView key={activeId} id={activeId} viewerId={viewerId} onActivity={loadList} /> : (
          <div className="grid flex-1 place-items-center p-8"><EmptyState title="Pick a conversation" body="Your messages with connections will show up here." /></div>
        )}
      </section>
    </div>
  );
}

function ThreadView({ id, viewerId, onActivity }: { id: string; viewerId: string; onActivity: () => void }) {
  const [t, setT] = useState<Thread | null>(null); const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState(""); const [sending, setSending] = useState(false); const [sendErr, setSendErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null); const lastId = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<Thread>(`/api/v1/conversations/${id}/messages?limit=60`);
      setT(r); setErr(null);
      const newest = r.items[r.items.length - 1]?.id ?? null;
      if (newest !== lastId.current) { lastId.current = newest; api(`/api/v1/conversations/${id}/read`, { method: "POST" }).then(onActivity).catch(() => {}); }
    } catch (e: any) { setErr(e.message); }
  }, [id, onActivity]);
  useEffect(() => { load(); const i = setInterval(load, POLL_MS); return () => clearInterval(i); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [t?.items.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = text.trim(); if (!body) return;
    setSending(true); setSendErr(null);
    try { await api(`/api/v1/conversations/${id}/messages`, { method: "POST", json: { body } }); setText(""); await load(); onActivity(); }
    catch (e: any) { setSendErr(e.message); } finally { setSending(false); }
  }
  if (err && !t) return <div className="p-6"><ErrorState message={err} retry={load} /></div>;
  if (!t) return <div className="space-y-3 p-6"><Skeleton className="h-10" /><Skeleton className="h-10 w-2/3" /></div>;
  return (
    <>
      <header className="flex items-center gap-3 border-b border-white/10 p-4">
        <Link href="/messages" className="rounded-full p-2 hover:bg-white/10 md:hidden" aria-label="Back to conversations"><ArrowLeft size={18} /></Link>
        <Link href={`/u/${t.other.id}`} className="flex items-center gap-3"><Avatar name={t.other.name} src={t.other.avatarUrl} size={40} /><span className="font-display text-lg font-bold">{t.other.name}</span></Link>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Messages">
        {t.items.length === 0 && <p className="py-10 text-center text-sm text-white/50">No messages yet. Say hi!</p>}
        {t.items.map((m) => { const mine = m.senderId === viewerId; return (
          <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[78%] rounded-2xl px-4 py-2 text-sm", mine ? "rounded-br-md bg-brand-gradient" : "rounded-bl-md bg-white/10")}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p><p className="mt-0.5 text-right text-[10px] text-white/55">{time(m.createdAt)}</p>
            </div>
          </div>
        ); })}
        <div ref={endRef} />
      </div>
      {t.canSend ? (
        <form onSubmit={send} className="border-t border-white/10 p-3">
          {sendErr && <p role="alert" className="mb-2 text-xs text-red-300">{sendErr}</p>}
          <div className="flex gap-2">
            <label htmlFor="msg" className="sr-only">Message</label>
            <input id="msg" className="input" placeholder="Type a message" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
            <button className="btn-primary" disabled={sending || !text.trim()} aria-label="Send message"><Send size={16} /></button>
          </div>
        </form>
      ) : <p className="border-t border-white/10 p-4 text-center text-sm text-white/55">You can no longer message this person (the connection was removed or blocked).</p>}
    </>
  );
}
