"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Lock, Megaphone, MessageSquare, Trash2, CalendarDays } from "lucide-react";
import { api } from "@/lib/client";
import { Avatar } from "@/components/social/Avatar";
import { ConnectButton, type ConnState } from "@/components/social/ConnectButton";
import { EmptyState, ErrorState, Skeleton, Alert } from "@/components/ui/States";
import { JoinButton, type Membership } from "./JoinButton";
import { formatDate, cn } from "@/lib/utils";

type C = {
  id: string; slug: string; name: string; description: string; type: string; joinPolicy: string; topic: string | null; memberCount: number;
  event: { slug: string; title: string } | null; viewerMembership: Membership; viewerRegistered: boolean; canModerate: boolean; canReadPosts: boolean; canPost: boolean;
};
type Post = { id: string; title: string | null; body: string; isAnnouncement: boolean; createdAt: string; authorId: string; authorName: string; authorAvatar: string | null; commentCount: number };
type Member = { id: string; name: string; avatarUrl: string | null; collegeName: string | null; role: string; status: string };
type Similar = { id: string; name: string; avatarUrl: string | null; sharedInterests: string[]; connection: ConnState };

const POLICY_TEXT: Record<string, string> = { OPEN: "Anyone can join.", APPROVAL: "Join requests are approved by moderators.", REGISTERED_ONLY: "Only people registered for the linked event can join." };

export function CommunityView({ community, viewerId }: { community: C; viewerId: string | null }) {
  const [c, setC] = useState(community);
  const [tab, setTab] = useState<"feed" | "members">("feed");
  const [similar, setSimilar] = useState<Similar[]>([]);
  const active = c.viewerMembership?.status === "ACTIVE";
  useEffect(() => { if (viewerId) api<{ items: Similar[] }>("/api/v1/communities/people").then((r) => setSimilar(r.items)).catch(() => {}); }, [viewerId]);
  // membership change => refresh derived permissions from server
  async function refresh() { try { const r = await api<{ community: C }>(`/api/v1/communities/${c.slug}`); setC(r.community); } catch { /* keep */ } }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <div role="tablist" className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          {(["feed", "members"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-5 py-2 text-sm font-semibold capitalize transition", tab === t ? "bg-lime text-ink" : "text-white/70 hover:text-white")}>{t === "feed" ? "Discussion" : `Members (${c.memberCount})`}</button>)}
        </div>
        {tab === "feed" ? <Feed c={c} viewerId={viewerId} /> : <Members c={c} viewerId={viewerId} />}
      </div>
      <aside className="space-y-5">
        <div className="card space-y-4 p-5">
          <JoinButton slug={c.slug} policy={c.joinPolicy} membership={c.viewerMembership} allowLeave onChange={() => setTimeout(refresh, 50)} />
          <p className="text-sm text-white/60">{POLICY_TEXT[c.joinPolicy]}</p>
          {c.type === "EVENT" && c.joinPolicy === "REGISTERED_ONLY" && !active && viewerId && !c.viewerRegistered && c.event && <Alert kind="info">Register for <Link className="underline" href={`/events/${c.event.slug}`}>{c.event.title}</Link> to unlock this community.</Alert>}
          {c.event && <Link href={`/events/${c.event.slug}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm hover:bg-white/10"><CalendarDays size={16} aria-hidden /><span className="line-clamp-1">{c.event.title}</span></Link>}
          {c.event && <Link href={`/people/${c.event.slug}`} className="btn-ghost w-full">Meet attendees</Link>}
        </div>
        {viewerId && (
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold">People like you</h2>
            <p className="mb-3 text-xs text-white/50">Open to connect, with shared interests.</p>
            {similar.length === 0 ? <p className="text-sm text-white/50">Add interests to your <Link href="/profile" className="underline">profile</Link> to see suggestions.</p> : (
              <ul className="space-y-3">
                {similar.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <Link href={`/u/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={p.name} src={p.avatarUrl} size={38} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="block truncate text-xs text-white/50">{p.sharedInterests.join(", ")}</span></span></Link>
                    <ConnectButton userId={p.id} state={p.connection} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function Feed({ c, viewerId }: { c: C; viewerId: string | null }) {
  const [posts, setPosts] = useState<Post[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!c.canReadPosts) return;
    try { setErr(null); setPosts((await api<{ items: Post[] }>(`/api/v1/communities/${c.slug}/posts?pageSize=30`)).items); } catch (e: any) { setErr(e.message); }
  }, [c.slug, c.canReadPosts]);
  useEffect(() => { load(); }, [load]);

  if (!c.canReadPosts) return <EmptyState title="Members only" body="Posts in event communities are visible to members. Join to read and take part." action={<Lock size={20} aria-hidden />} />;
  return (
    <div className="space-y-5">
      {c.canPost ? <Composer c={c} onPosted={load} /> : <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">{viewerId ? "Join this community to post and comment." : <><Link href={`/login?next=/communities/${c.slug}`} className="underline">Log in</Link> and join to post and comment.</>}</p>}
      {err ? <ErrorState message={err} retry={load} /> : !posts ? <><Skeleton className="h-32" /><Skeleton className="h-32" /></> : posts.length === 0 ? <EmptyState title="No posts yet" body="Start the conversation with the first post." /> : (
        <ul className="space-y-4">{posts.map((p) => <PostCard key={p.id} p={p} c={c} viewerId={viewerId} onDeleted={load} />)}</ul>
      )}
    </div>
  );
}

function Composer({ c, onPosted }: { c: C; onPosted: () => void }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [ann, setAnn] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!body.trim()) return setErr("Write something first");
    setBusy(true); setErr(null);
    try { await api(`/api/v1/communities/${c.slug}/posts`, { method: "POST", json: { title: title || undefined, body, isAnnouncement: ann } }); setTitle(""); setBody(""); setAnn(false); onPosted(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const mod = c.viewerMembership && (c.viewerMembership.role === "OWNER" || c.viewerMembership.role === "MODERATOR");
  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      {err && <Alert>{err}</Alert>}
      <label className="sr-only" htmlFor="post-title">Title (optional)</label>
      <input id="post-title" className="input" placeholder="Title (optional)" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="sr-only" htmlFor="post-body">Post</label>
      <textarea id="post-body" className="input min-h-24" placeholder="Share something with the community..." maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {mod ? <label className="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-lime" checked={ann} onChange={(e) => setAnn(e.target.checked)} /><Megaphone size={15} aria-hidden />Announcement (notifies all members)</label> : <span />}
        <button className="btn-primary" disabled={busy}>{busy ? "Posting..." : ann ? "Announce" : "Post"}</button>
      </div>
    </form>
  );
}

type Cm = { id: string; body: string; createdAt: string; authorId: string; authorName: string; authorAvatar: string | null };
function PostCard({ p, c, viewerId, onDeleted }: { p: Post; c: C; viewerId: string | null; onDeleted: () => void }) {
  const [open, setOpen] = useState(false); const [list, setList] = useState<Cm[] | null>(null); const [text, setText] = useState(""); const [count, setCount] = useState(p.commentCount); const [err, setErr] = useState<string | null>(null);
  const loadC = useCallback(async () => { try { setList((await api<{ items: Cm[] }>(`/api/v1/communities/${c.slug}/posts/${p.id}/comments`)).items); } catch (e: any) { setErr(e.message); } }, [c.slug, p.id]);
  useEffect(() => { if (open && !list) loadC(); }, [open, list, loadC]);
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!text.trim()) return;
    try { await api(`/api/v1/communities/${c.slug}/posts/${p.id}/comments`, { method: "POST", json: { body: text } }); setText(""); setCount((n) => n + 1); loadC(); } catch (e: any) { setErr(e.message); }
  }
  async function delPost() { if (!confirm("Delete this post?")) return; try { await api(`/api/v1/communities/${c.slug}/posts/${p.id}`, { method: "DELETE" }); onDeleted(); } catch (e: any) { setErr(e.message); } }
  async function delC(id: string) { try { await api(`/api/v1/communities/${c.slug}/comments/${id}`, { method: "DELETE" }); setCount((n) => Math.max(0, n - 1)); loadC(); } catch (e: any) { setErr(e.message); } }
  return (
    <li className={cn("card p-5", p.isAnnouncement && "border-lime/50 bg-lime/[.06]")}>
      {p.isAnnouncement && <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-lime"><Megaphone size={14} aria-hidden />Announcement</p>}
      <div className="flex items-start gap-3">
        <Link href={`/u/${p.authorId}`}><Avatar name={p.authorName} src={p.authorAvatar} size={40} /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm"><Link href={`/u/${p.authorId}`} className="font-semibold hover:text-lime">{p.authorName}</Link><span className="text-white/45"> · {formatDate(p.createdAt)}</span></p>
          {p.title && <h3 className="mt-1 font-display text-xl font-bold">{p.title}</h3>}
          <p className="mt-1 whitespace-pre-line break-words text-white/80">{p.body}</p>
        </div>
        {(p.authorId === viewerId || c.canModerate) && <button onClick={delPost} aria-label="Delete post" className="rounded-full p-2 text-white/40 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button>}
      </div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"><MessageSquare size={15} />{count} comment{count === 1 ? "" : "s"}</button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          {err && <Alert>{err}</Alert>}
          {!list ? <Skeleton className="h-10" /> : list.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5">
              <Avatar name={m.authorName} src={m.authorAvatar} size={28} />
              <div className="min-w-0 flex-1 rounded-2xl bg-white/5 px-3 py-2 text-sm"><Link href={`/u/${m.authorId}`} className="font-semibold hover:text-lime">{m.authorName}</Link><p className="whitespace-pre-line break-words text-white/75">{m.body}</p></div>
              {(m.authorId === viewerId || c.canModerate) && <button onClick={() => delC(m.id)} aria-label="Delete comment" className="p-1 text-white/35 hover:text-red-300"><Trash2 size={14} /></button>}
            </div>
          ))}
          {c.canPost && <form onSubmit={add} className="flex gap-2"><label htmlFor={`cm-${p.id}`} className="sr-only">Add a comment</label><input id={`cm-${p.id}`} className="input" placeholder="Add a comment" maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} /><button className="btn-primary" disabled={!text.trim()}>Send</button></form>}
        </div>
      )}
    </li>
  );
}

function Members({ c, viewerId }: { c: C; viewerId: string | null }) {
  const [items, setItems] = useState<Member[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => { try { setItems((await api<{ items: Member[] }>(`/api/v1/communities/${c.slug}/members?pageSize=50`)).items); } catch (e: any) { setErr(e.message); } }, [c.slug]);
  useEffect(() => { load(); }, [load]);
  async function act(userId: string, action: string) { try { await api(`/api/v1/communities/${c.slug}/members`, { method: "PATCH", json: { userId, action } }); load(); } catch (e: any) { setErr(e.message); } }
  if (err) return <ErrorState message={err} retry={load} />;
  if (!items) return <Skeleton className="h-40" />;
  const owner = c.viewerMembership?.role === "OWNER";
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((m) => (
        <li key={m.id} className="card flex items-center gap-3 p-4">
          <Link href={`/u/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={m.name} src={m.avatarUrl} size={44} /><span className="min-w-0"><span className="block truncate font-semibold">{m.name}</span><span className="block truncate text-xs text-white/50">{m.status === "PENDING" ? "Awaiting approval" : m.role === "MEMBER" ? m.collegeName ?? "Member" : m.role.toLowerCase()}</span></span></Link>
          {c.canModerate && m.role !== "OWNER" && m.id !== viewerId && (
            <div className="flex flex-wrap justify-end gap-1">
              {m.status === "PENDING" && <button className="btn-lime !px-3 !py-1 !text-xs" onClick={() => act(m.id, "approve")}>Approve</button>}
              {owner && m.status === "ACTIVE" && <button className="btn-ghost !px-3 !py-1 !text-xs" onClick={() => act(m.id, m.role === "MODERATOR" ? "demote" : "promote")}>{m.role === "MODERATOR" ? "Demote" : "Make mod"}</button>}
              <button className="btn-danger !px-3 !py-1 !text-xs" onClick={() => confirm(`Remove ${m.name}?`) && act(m.id, "remove")}>{m.status === "PENDING" ? "Decline" : "Remove"}</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
