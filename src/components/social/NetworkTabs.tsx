"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PersonCard, type PersonLite } from "./PersonCard";
import { EmptyState, ErrorState, Skeleton, Alert } from "@/components/ui/States";
import { cn } from "@/lib/utils";

type Tab = "connections" | "received" | "sent" | "blocked";
type Row = { requestId?: string; message?: string | null; user?: PersonLite } & Partial<PersonLite>;
const TABS: { v: Tab; label: string; empty: string }[] = [
  { v: "connections", label: "Connections", empty: "No connections yet. Meet people from events you attend or from communities." },
  { v: "received", label: "Requests received", empty: "No pending requests." },
  { v: "sent", label: "Sent", empty: "You have no pending requests." },
  { v: "blocked", label: "Blocked", empty: "You haven't blocked anyone." },
];

export function NetworkTabs({ initial }: { initial: Tab }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initial);
  const [rows, setRows] = useState<Row[] | null>(null); const [err, setErr] = useState<string | null>(null); const [note, setNote] = useState<string | null>(null);
  const load = useCallback(async () => {
    setRows(null); setErr(null);
    try { setRows((await api<{ items: Row[] }>(`/api/v1/me/connections?type=${tab}`)).items); } catch (e: any) { setErr(e.message); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  async function run(fn: () => Promise<unknown>) { setNote(null); try { await fn(); await load(); router.refresh(); } catch (e: any) { setNote(e.message); } }
  const person = (r: Row) => (r.user ?? r) as PersonLite;

  return (
    <div>
      <div role="tablist" aria-label="Network" className="mb-6 flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/5 p-1 w-fit">
        {TABS.map((t) => <button key={t.v} role="tab" aria-selected={tab === t.v} onClick={() => setTab(t.v)} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", tab === t.v ? "bg-lime text-ink" : "text-white/70 hover:text-white")}>{t.label}</button>)}
      </div>
      {note && <div className="mb-4"><Alert>{note}</Alert></div>}
      {err ? <ErrorState message={err} retry={load} /> : !rows ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : rows.length === 0 ? <EmptyState title="Nothing here" body={TABS.find((t) => t.v === tab)!.empty} /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const p = person(r);
            return (
              <li key={r.requestId ?? p.id}>
                <PersonCard person={p}
                  extra={r.message ? <p className="rounded-xl bg-white/5 p-3 text-sm italic text-white/70">&ldquo;{r.message}&rdquo;</p> : undefined}
                  action={
                    <div className="flex flex-wrap gap-2">
                      {tab === "connections" && <>
                        <button className="btn-lime !px-4 !py-1.5 !text-xs" onClick={() => run(async () => { const c = await api<{ id: string }>("/api/v1/conversations", { method: "POST", json: { userId: p.id } }); router.push(`/messages/${c.id}`); })}>Message</button>
                        <button className="btn-ghost !px-4 !py-1.5 !text-xs" onClick={() => confirm(`Remove ${p.name} from your connections?`) && run(() => api(`/api/v1/connections/user/${p.id}`, { method: "DELETE" }))}>Remove</button>
                      </>}
                      {tab === "received" && <>
                        <button className="btn-lime !px-4 !py-1.5 !text-xs" onClick={() => run(() => api(`/api/v1/connections/${r.requestId}`, { method: "PATCH", json: { action: "accept" } }))}>Accept</button>
                        <button className="btn-ghost !px-4 !py-1.5 !text-xs" onClick={() => run(() => api(`/api/v1/connections/${r.requestId}`, { method: "PATCH", json: { action: "decline" } }))}>Decline</button>
                      </>}
                      {tab === "sent" && <button className="btn-ghost !px-4 !py-1.5 !text-xs" onClick={() => run(() => api(`/api/v1/connections/${r.requestId}`, { method: "DELETE" }))}>Cancel request</button>}
                      {tab === "blocked" && <button className="btn-ghost !px-4 !py-1.5 !text-xs" onClick={() => run(() => api(`/api/v1/users/${p.id}/block`, { method: "DELETE" }))}>Unblock</button>}
                    </div>
                  } />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
