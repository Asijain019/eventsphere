"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Users, X } from "lucide-react";
import { api } from "@/lib/client";
import { INTERESTS } from "@/lib/constants";
import { IMG } from "@/lib/images";
import { SmartImage } from "@/components/ui/SmartImage";
import { EmptyState, ErrorState, Skeleton, Alert } from "@/components/ui/States";
import { JoinButton, type Membership } from "./JoinButton";
import { cn } from "@/lib/utils";

type Item = { id: string; slug: string; name: string; description: string; type: string; topic: string | null; joinPolicy: string; coverUrl: string | null; memberCount: number; viewerMembership: Membership };
type Res = { items: Item[]; total: number; page: number; pageSize: number };
const COVERS = [IMG.typography, IMG.megaphone, IMG.djConsole, IMG.sportsIllustration, IMG.hackathon, IMG.venue, IMG.calligraphyWorkshop, IMG.urbanPhotography, IMG.collaborativePuzzle];

export function CommunityBrowser({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<"INTEREST" | "EVENT">("INTEREST");
  const [topic, setTopic] = useState(""); const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const [data, setData] = useState<Res | null>(null); const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const load = useCallback(async () => {
    setErr(null); setData(null);
    const p = new URLSearchParams({ type, page: String(page), pageSize: "9" }); if (topic) p.set("topic", topic); if (q) p.set("q", q);
    try { setData(await api<Res>(`/api/v1/communities?${p}`)); } catch (e: any) { setErr(e.message); }
  }, [type, topic, q, page]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);

  const usedCovers = new Set<string>();
  const covers = data?.items.map((community, i) => {
    const fallback = COVERS.find((cover) => !usedCovers.has(cover)) ?? COVERS[i % COVERS.length];
    const cover = community.coverUrl && !usedCovers.has(community.coverUrl) ? community.coverUrl : fallback;
    usedCovers.add(cover);
    return cover;
  }) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Community type" className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          {([["INTEREST", "Interest communities"], ["EVENT", "Event communities"]] as const).map(([v, l]) => (
            <button key={v} role="tab" aria-selected={type === v} onClick={() => { setType(v); setPage(1); setTopic(""); }} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", type === v ? "bg-lime text-ink" : "text-white/70 hover:text-white")}>{l}</button>
          ))}
        </div>
        {loggedIn
          ? <button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} />Create community</button>
          : <Link href="/login?next=/communities" className="btn-ghost">Log in to create</Link>}
      </div>
      <div className="relative mt-5 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden />
        <label htmlFor="c-q" className="sr-only">Search communities</label>
        <input id="c-q" className="input !pl-10" placeholder="Search communities" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      {type === "INTEREST" && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter by topic">
          {["", ...INTERESTS].map((t) => <button key={t || "all"} aria-pressed={topic === t} onClick={() => { setTopic(t); setPage(1); }} className={cn("chip transition", topic === t && "!border-lime !bg-lime !text-ink")}>{t || "All topics"}</button>)}
        </div>
      )}
      <div className="mt-8">
        {err ? <ErrorState message={err} retry={load} /> : !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
        ) : data.items.length === 0 ? (
          <EmptyState title="No communities found" body={type === "EVENT" ? "Event communities appear when organizers create them for their events." : "Try another topic, or start the first one."} action={loggedIn && type === "INTEREST" ? <button className="btn-primary" onClick={() => setModal(true)}>Create community</button> : undefined} />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((c, i) => (
                <li key={c.id} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-lime/40">
                  <Link href={`/communities/${c.slug}`} className="block" aria-label={`Open ${c.name}`}>
                    <SmartImage src={covers[i]} alt="" className="h-32" imgClassName="transition duration-500 group-hover:scale-105" fallbackLabel={c.name} />
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-center gap-2 text-xs text-white/55">{c.topic && <span className="chip !py-0.5">{c.topic}</span>}<span className="inline-flex items-center gap-1"><Users size={13} />{c.memberCount} member{c.memberCount === 1 ? "" : "s"}</span></div>
                    <Link href={`/communities/${c.slug}`}><h3 className="font-display text-lg font-bold leading-tight hover:text-lime">{c.name}</h3></Link>
                    <p className="line-clamp-2 text-sm text-white/60">{c.description}</p>
                    <div className="mt-auto pt-1"><JoinButton slug={c.slug} policy={c.joinPolicy} membership={c.viewerMembership} size="sm" /></div>
                  </div>
                </li>
              ))}
            </ul>
            {data.total > data.pageSize && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span className="text-sm text-white/60">Page {data.page} of {Math.ceil(data.total / data.pageSize)}</span>
                <button className="btn-ghost" disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
      {modal && <CreateModal onClose={() => setModal(false)} onCreated={(slug) => router.push(`/communities/${slug}`)} />}
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const [f, setF] = useState({ name: "", description: "", topic: "", joinPolicy: "OPEN" });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (f.name.trim().length < 3) return setErr("Name must be at least 3 characters");
    if (f.description.trim().length < 10) return setErr("Describe the community in at least 10 characters");
    setBusy(true);
    try { const r = await api<{ community: { slug: string } }>("/api/v1/communities", { method: "POST", json: { ...f, type: "INTEREST", topic: f.topic || undefined } }); onCreated(r.community.slug); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="cc-h" onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card w-full max-w-lg space-y-4 p-6">
        <div className="flex items-center justify-between"><h2 id="cc-h" className="font-display text-2xl font-bold">Start a community</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10"><X size={18} /></button></div>
        {err && <Alert>{err}</Alert>}
        <div><label className="label" htmlFor="cc-n">Name</label><input id="cc-n" className="input" maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></div>
        <div><label className="label" htmlFor="cc-d">Description</label><textarea id="cc-d" className="input min-h-24" maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="cc-t">Topic</label><select id="cc-t" className="input" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}><option value="">No topic</option>{INTERESTS.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label" htmlFor="cc-p">Who can join</label><select id="cc-p" className="input" value={f.joinPolicy} onChange={(e) => setF({ ...f, joinPolicy: e.target.value })}><option value="OPEN">Anyone</option><option value="APPROVAL">Approval required</option></select></div>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create"}</button></div>
      </form>
    </div>
  );
}
