"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { api } from "@/lib/client";
import { ConnectButton, type ConnState } from "./ConnectButton";
import { PersonCard, type PersonLite } from "./PersonCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";

type Item = PersonLite & { connection: ConnState };
type Res = { items: Item[]; total: number; page: number; pageSize: number };

/** Opted-in attendees of an event. Privacy and registration gate are enforced by the API; this just renders states. */
export function AttendeeDiscovery({ eventId, eventTitle }: { eventId: string; eventTitle?: string }) {
  const [data, setData] = useState<Res | null>(null);
  const [err, setErr] = useState<{ message: string; status?: number } | null>(null);
  const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    setErr(null);
    try { setData(await api<Res>(`/api/v1/events/${eventId}/attendees?page=${page}&pageSize=12${q ? `&q=${encodeURIComponent(q)}` : ""}`)); }
    catch (e: any) { setErr({ message: e.message, status: e.status }); }
  }, [eventId, page, q]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);

  if (err?.status === 401) return <EmptyState title="Log in to meet attendees" body="Sign in and register for this event to see who else is going." action={<Link className="btn-primary" href={`/login?next=${encodeURIComponent(typeof location !== "undefined" ? location.pathname : "/events")}`}>Log in</Link>} />;
  if (err?.status === 403) return <EmptyState title="Register to meet attendees" body={err.message} action={<Link className="btn-primary" href="/events">Browse events</Link>} />;
  if (err) return <ErrorState message={err.message} retry={load} />;
  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden />
        <label htmlFor="att-q" className="sr-only">Search attendees</label>
        <input id="att-q" className="input !pl-10" placeholder="Search by name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : data.items.length === 0 ? (
        <EmptyState title="No one to show yet" body={`Only attendees who opted in to discovery appear here${eventTitle ? ` for ${eventTitle}` : ""}. You can opt in from your profile privacy settings.`} action={<Link href="/profile" className="btn-ghost">Privacy settings</Link>} />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => <li key={p.id}><PersonCard person={p} action={<ConnectButton userId={p.id} state={p.connection} size="sm" />} /></li>)}
          </ul>
          {data.total > data.pageSize && (
            <div className="flex items-center justify-center gap-3">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="text-sm text-white/60">Page {data.page} of {Math.ceil(data.total / data.pageSize)}</span>
              <button className="btn-ghost" disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
