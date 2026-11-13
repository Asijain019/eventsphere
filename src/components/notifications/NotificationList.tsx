"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/client";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { cn } from "@/lib/utils";

type N = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };
type Res = { items: N[]; total: number; page: number; pageSize: number; unread: number };
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
function group(n: N) { const t = new Date(n.createdAt).getTime(), s = startOfDay(new Date()); return t >= s ? "Today" : t >= s - 6 * 864e5 ? "This week" : "Earlier"; }
const ago = (d: string) => { const m = Math.round((Date.now() - new Date(d).getTime()) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };

export function NotificationList() {
  const router = useRouter();
  const [d, setD] = useState<Res | null>(null); const [err, setErr] = useState<string | null>(null); const [page, setPage] = useState(1);
  const load = useCallback(async () => { try { setD(await api<Res>(`/api/v1/me/notifications?page=${page}&pageSize=30`)); setErr(null); } catch (e: any) { setErr(e.message); } }, [page]);
  useEffect(() => { load(); }, [load]);

  async function open(n: N) {
    if (!n.readAt) { setD((p) => p && { ...p, unread: Math.max(0, p.unread - 1), items: p.items.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x) }); api(`/api/v1/notifications/${n.id}/read`, { method: "PATCH" }).then(() => router.refresh()).catch(() => {}); }
    if (n.link) router.push(n.link);
  }
  async function readAll() { try { await api("/api/v1/notifications/read-all", { method: "POST" }); await load(); router.refresh(); } catch (e: any) { setErr(e.message); } }

  if (err && !d) return <ErrorState message={err} retry={load} />;
  if (!d) return <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (d.items.length === 0) return <EmptyState title="You're all caught up" body="Registration confirmations, connection requests, announcements and more will show up here." action={<Link href="/events" className="btn-primary">Explore events</Link>} />;
  const groups = ["Today", "This week", "Earlier"].map((g) => ({ g, items: d.items.filter((n) => group(n) === g) })).filter((x) => x.items.length);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><p className="text-sm text-white/60" aria-live="polite">{d.unread} unread</p><button className="btn-ghost" onClick={readAll} disabled={d.unread === 0}><CheckCheck size={16} />Mark all read</button></div>
      {groups.map(({ g, items }) => (
        <section key={g} aria-label={g}>
          <h2 className="label">{g}</h2>
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => open(n)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition hover:bg-white/10", n.readAt ? "border-white/10 bg-white/[.03]" : "border-lime/40 bg-lime/[.07]")}>
                  <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full", n.readAt ? "bg-white/10" : "bg-brand-gradient")}><Bell size={16} aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-3"><span className="font-semibold">{n.title}</span><span className="shrink-0 text-xs text-white/45">{ago(n.createdAt)}</span></span>{n.body && <span className="mt-0.5 block text-sm text-white/60">{n.body}</span>}</span>
                  {!n.readAt && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-lime" aria-label="Unread" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {d.total > d.pageSize && <div className="flex items-center justify-center gap-3"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Newer</button><button className="btn-ghost" disabled={page * d.pageSize >= d.total} onClick={() => setPage(page + 1)}>Older</button></div>}
    </div>
  );
}
