"use client";
import { useCallback, useEffect, useState } from "react";
import { Download, ScanLine, Search, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/client";
import { formatDate, formatTime } from "@/lib/utils";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { StatusChip } from "../ui";
import type { ManagedEvent } from "../ManageEvent";

type Row = { id: string; ticketReference: string; status: string; type: string; registeredAt: string; userId: string; name: string; email: string; collegeName: string | null; checkedInAt: string | null };
const PAGE = 20;

export function RegistrationsTab({ ev }: { ev: ManagedEvent }) {
  const [rows, setRows] = useState<Row[] | null>(null); const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1); const [q, setQ] = useState(""); const [dq, setDq] = useState(""); const [status, setStatus] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState(""); const [scan, setScan] = useState<{ kind: "success" | "error"; msg: string } | null>(null); const [scanning, setScanning] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const load = useCallback(async () => {
    setErr(null);
    const p = new URLSearchParams({ page: String(page), pageSize: String(PAGE) }); if (dq) p.set("q", dq); if (status) p.set("status", status);
    try { const r = await api<{ items: Row[]; total: number }>(`/api/v1/organizer/events/${ev.id}/registrations?${p}`); setRows(r.items); setTotal(r.total); }
    catch (e) { setErr((e as Error).message); }
  }, [ev.id, page, dq, status]);
  useEffect(() => { void load(); }, [load]);

  async function checkIn(e: React.FormEvent) {
    e.preventDefault(); setScan(null);
    if (!code.trim()) return setScan({ kind: "error", msg: "Enter a ticket code such as ES-AB12CD." });
    setScanning(true);
    try { const r = await api<{ name: string }>(`/api/v1/organizer/events/${ev.id}/checkin`, { method: "POST", json: { ticketReference: code } }); setScan({ kind: "success", msg: `${r.name} is checked in.` }); setCode(""); void load(); }
    catch (e) { setScan({ kind: "error", msg: (e as Error).message }); }
    finally { setScanning(false); }
  }
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-6">
      <form onSubmit={checkIn} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end" aria-label="Check in an attendee">
        <div className="flex-1"><label htmlFor="ticket" className="label">Check in by ticket code</label>
          <div className="relative"><ScanLine size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input id="ticket" className="input !pl-10 font-mono uppercase" placeholder="ES-AB12CD" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" /></div></div>
        <button className="btn-lime" disabled={scanning}><CheckCircle2 size={16} />{scanning ? "Checking..." : "Check in"}</button>
        {scan && <div className="sm:basis-full"><Alert kind={scan.kind}>{scan.msg}</Alert></div>}
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" /><input aria-label="Search registrations" className="input !w-60 !py-2 !pl-9" placeholder="Search name, email or code" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select aria-label="Filter by status" className="input !w-40 !py-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="CONFIRMED">Confirmed</option><option value="WAITLISTED">Waitlisted</option><option value="CANCELLED">Cancelled</option></select>
        </div>
        <a className="btn-ghost" href={`/api/v1/organizer/events/${ev.id}/registrations?format=csv`} download><Download size={15} />Export CSV</a>
      </div>

      {err && <ErrorState message={err} retry={load} />}
      {!rows && !err && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}
      {rows && rows.length === 0 && <EmptyState title={dq || status ? "No matching registrations" : "No registrations yet"} body={dq || status ? "Try clearing the filters." : "Once people register they will appear here with their ticket codes."} />}
      {rows && rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50"><tr><th className="p-4">Attendee</th><th className="p-4">College</th><th className="p-4">Ticket</th><th className="p-4">Status</th><th className="p-4">Registered</th><th className="p-4">Check-in</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className="p-4"><p className="font-semibold">{r.name}</p><p className="text-xs text-white/50">{r.email}</p></td>
                <td className="p-4 text-white/70">{r.collegeName ?? "-"}</td>
                <td className="p-4 font-mono text-xs">{r.ticketReference}</td>
                <td className="p-4"><StatusChip status={r.status} /></td>
                <td className="p-4 text-xs text-white/60">{formatDate(r.registeredAt)}<br />{formatTime(r.registeredAt)}</td>
                <td className="p-4 text-xs">{r.checkedInAt ? <span className="text-lime">{formatTime(r.checkedInAt)}</span> : <span className="text-white/40">Not yet</span>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {total > PAGE && (
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>{total} registrations</span>
          <div className="flex items-center gap-2"><button className="btn-ghost !py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="btn-ghost !py-1.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>
        </div>
      )}
    </div>
  );
}
