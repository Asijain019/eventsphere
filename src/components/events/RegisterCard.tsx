"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Ticket, Users, X } from "lucide-react";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";

type Props = {
  event: { id: string; title: string; slug: string; capacity: number; feePaise: number; startAt: string; registrationDeadline: string | null; status: string; teamsEnabled: boolean; confirmedCount: number; isOwner?: boolean };
  loggedIn: boolean;
  registration: { id: string; ticketReference: string; type: string } | null;
};

/** Sticky registration card: live seats, deadline, register / cancel, confirmation modal. */
export function RegisterCard({ event, loggedIn, registration: initialReg }: Props) {
  const router = useRouter(); const path = usePathname();
  const [reg, setReg] = useState(initialReg); const [count, setCount] = useState(event.confirmedCount);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<{ msg: string; code?: string } | null>(null);
  const [modal, setModal] = useState(false); const [confirmCancel, setConfirmCancel] = useState(false);

  const now = Date.now(); const start = new Date(event.startAt).getTime();
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline).getTime() : null;
  const left = Math.max(0, event.capacity - count); const pct = Math.min(100, Math.round((count / event.capacity) * 100));
  const closedReason = event.status === "CANCELLED" ? "This event has been cancelled." : event.status === "DRAFT" ? "Draft — not open for registration yet." : event.status === "COMPLETED" || start < now ? "This event has ended." : deadline && deadline < now ? "Registration has closed." : null;
  const full = left === 0;
  const days = deadline ? Math.ceil((deadline - now) / 864e5) : null;

  async function register() {
    if (!loggedIn) { router.push(`/login?next=${encodeURIComponent(path)}`); return; }
    setBusy(true); setErr(null);
    try {
      const r = await api<{ registration: { id: string; ticketReference: string; type: string } }>(`/api/v1/events/${event.id}/registrations`, { method: "POST", json: { type: "ATTENDEE" } });
      setReg(r.registration); setCount((c) => c + 1); setModal(true); router.refresh();
    } catch (e: any) {
      if (e.code === "ALREADY_REGISTERED") router.refresh();
      if (e.code === "EVENT_FULL") setCount(event.capacity);
      setErr({ msg: e.message, code: e.code });
    } finally { setBusy(false); }
  }
  async function cancel() {
    if (!reg) return; setBusy(true); setErr(null);
    try { await api(`/api/v1/registrations/${reg.id}`, { method: "DELETE" }); setReg(null); setCount((c) => Math.max(0, c - 1)); setConfirmCancel(false); router.refresh(); }
    catch (e: any) { setErr({ msg: e.message, code: e.code }); } finally { setBusy(false); }
  }

  return (
    <div className="card relative overflow-hidden p-6">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet/30 blur-3xl" aria-hidden />
      <div className="relative space-y-5">
        <div className="flex items-end justify-between">
          <div><p className="text-xs uppercase tracking-wider text-white/50">Entry</p><p className="font-display text-3xl font-bold">{formatPrice(event.feePaise)}</p></div>
          {days !== null && !closedReason && <span className="chip">{days <= 0 ? "Closes today" : `${days} day${days > 1 ? "s" : ""} to register`}</span>}
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-white/60"><span>{count} registered</span><span className={left <= 10 ? "font-semibold text-orange" : ""}>{full ? "Sold out" : `${left} seats left`}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Seats filled">
            <motion.div className="h-full rounded-full bg-brand-gradient" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
        {event.feePaise > 0 && <p className="text-xs text-white/50">Online payments are coming soon — your seat is reserved now and the fee is collected at entry.</p>}

        {event.isOwner && <Alert kind="info">You are viewing this as the organizer.</Alert>}
        {err && <Alert>{err.msg}</Alert>}

        {reg ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-lime/40 bg-lime/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-lime"><CheckCircle2 size={16} />You&apos;re registered</p>
              <p className="mt-1 font-mono text-lg tracking-widest">{reg.ticketReference}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/my/registrations" className="btn-ghost flex-1"><Ticket size={15} />My tickets</Link>
              {!closedReason && (confirmCancel
                ? <button type="button" className="btn-danger flex-1" disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Confirm cancel"}</button>
                : <button type="button" className="btn-ghost flex-1" onClick={() => setConfirmCancel(true)}>Cancel</button>)}
            </div>
            {confirmCancel && <button type="button" className="w-full text-center text-xs text-white/50 underline" onClick={() => setConfirmCancel(false)}>Keep my seat</button>}
          </div>
        ) : closedReason ? (
          <><button className="btn-ghost w-full" disabled>Registration unavailable</button><p className="text-center text-sm text-white/60">{closedReason}</p></>
        ) : full ? (
          <><button className="btn-ghost w-full" disabled>Sold out</button><p className="text-center text-sm text-white/60">All seats are taken. Check back — cancellations free up seats.</p></>
        ) : (
          <button type="button" className="btn-primary w-full !py-3.5 text-base" disabled={busy} onClick={register}>{busy ? "Reserving your seat…" : loggedIn ? "Register now" : "Log in to register"}</button>
        )}
        {event.teamsEnabled && !closedReason && (
          <Link href={`/teams?event=${event.id}`} className="btn-ghost w-full"><Users size={15} />Competing as a team? Find or build one</Link>
        )}
      </div>

      <AnimatePresence>
        {modal && reg && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Registration confirmed">
            <motion.div initial={{ scale: 0.85, y: 30, rotateX: 15 }} animate={{ scale: 1, y: 0, rotateX: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 18 }} className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-ink2 shadow-glow">
              <button type="button" aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10" onClick={() => setModal(false)}><X size={16} /></button>
              <div className="bg-brand-gradient p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-ink"><CheckCircle2 size={34} /></motion.div>
                <h2 className="mt-4 font-display text-3xl font-bold">You&apos;re in!</h2>
                <p className="mt-1 text-sm text-white/85">{event.title}</p>
              </div>
              <div className="relative p-6 text-center">
                <div className="absolute -top-3 left-0 right-0 flex justify-between px-0"><span className="-ml-3 h-6 w-6 rounded-full bg-black/80" /><span className="-mr-3 h-6 w-6 rounded-full bg-black/80" /></div>
                <p className="text-xs uppercase tracking-widest text-white/50">Ticket reference</p>
                <p className="my-2 font-mono text-3xl font-bold tracking-widest text-lime">{reg.ticketReference}</p>
                <p className="text-sm text-white/60">{formatDate(event.startAt, { weekday: "long", day: "numeric", month: "long" })} · {formatTime(event.startAt)}</p>
                <p className="mt-3 text-xs text-white/50">Show this reference at check-in. A copy is in your notifications.</p>
                <div className="mt-5 flex gap-2"><Link href="/my/registrations" className="btn-lime flex-1">View my tickets</Link><button type="button" className="btn-ghost flex-1" onClick={() => setModal(false)}>Done</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
