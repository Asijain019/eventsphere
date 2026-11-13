"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, X } from "lucide-react";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";

function useAction() {
  const router = useRouter(); const [busy, setBusy] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  async function run(key: string, url: string, init: Parameters<typeof api>[1], success?: string, after?: () => void) {
    setBusy(key); setErr(null); setOk(null);
    try { await api(url, init); if (success) setOk(success); after?.(); router.refresh(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }
  return { busy, err, ok, run, router };
}

/** Request-to-join button + modal. Redirects to login if logged out. */
export function JoinTeamButton({ teamId, teamName, loggedIn, disabledReason, className }: { teamId: string; teamName: string; loggedIn: boolean; disabledReason?: string; className?: string }) {
  const [open, setOpen] = useState(false); const [msg, setMsg] = useState(""); const path = usePathname();
  const { busy, err, run, router } = useAction(); const [sent, setSent] = useState(false);
  if (disabledReason) return <button type="button" className={`btn-ghost ${className ?? ""}`} disabled title={disabledReason}>{disabledReason}</button>;
  if (sent) return <button type="button" className={`btn-ghost ${className ?? ""}`} disabled>Request sent ✓</button>;
  return (
    <>
      <button type="button" className={`btn-lime ${className ?? ""}`} onClick={() => (loggedIn ? setOpen(true) : router.push(`/login?next=${encodeURIComponent(path)}`))}>Request to join</button>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`Join ${teamName}`}>
          <form className="card w-full max-w-md space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); run("join", `/api/v1/teams/${teamId}/join`, { method: "POST", json: { message: msg || undefined } }, undefined, () => { setSent(true); setOpen(false); }); }}>
            <div className="flex items-start justify-between"><h2 className="font-display text-2xl font-bold">Join {teamName}</h2><button type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={20} /></button></div>
            <div><label className="label" htmlFor="jm">Tell the captain why you&apos;re a fit (optional)</label>
              <textarea id="jm" className="input min-h-28" maxLength={400} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="I build React frontends and have done 3 hackathons…" /></div>
            {err && <Alert>{err}</Alert>}
            <div className="flex gap-2"><button className="btn-primary flex-1" disabled={busy === "join"}>{busy === "join" ? "Sending…" : "Send request"}</button><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export function RequestRow({ teamId, memberId, name, message, children }: { teamId: string; memberId: string; name: string; message: string | null; children?: React.ReactNode }) {
  const { busy, err, run } = useAction();
  const act = (action: "accept" | "reject") => run(action, `/api/v1/teams/${teamId}/requests/${memberId}`, { method: "POST", json: { action } });
  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0">{children}{message && <p className="mt-2 text-sm italic text-white/65">&ldquo;{message}&rdquo;</p>}</div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-lime !px-3 !py-2" aria-label={`Accept ${name}`} disabled={!!busy} onClick={() => act("accept")}><Check size={16} /></button>
          <button type="button" className="btn-danger !px-3 !py-2" aria-label={`Reject ${name}`} disabled={!!busy} onClick={() => act("reject")}><X size={16} /></button></div></div>
      {err && <div className="mt-2"><Alert>{err}</Alert></div>}
    </li>
  );
}

export function TeamOwnerActions({ teamId, eventId, status, canRegister, memberCount, minSize }: { teamId: string; eventId: string; status: string; canRegister: boolean; memberCount: number; minSize: number }) {
  const { busy, err, ok, run } = useAction();
  const tooSmall = memberCount < minSize;
  return (
    <div className="space-y-3">
      {status === "REGISTERED" ? <Alert kind="success">Your team is registered for this event. Tickets are in each member&apos;s My registrations.</Alert> : (
        <button type="button" className="btn-primary w-full" disabled={!canRegister || tooSmall || !!busy} title={tooSmall ? `Need at least ${minSize} members` : undefined}
          onClick={() => run("reg", `/api/v1/teams/${teamId}/register`, { method: "POST" }, "Team registered!")}>
          {busy === "reg" ? "Registering team…" : "Register team for event"}</button>
      )}
      {tooSmall && status !== "REGISTERED" && <p className="text-xs text-white/50">You need at least {minSize} members before you can register the team.</p>}
      {err && <Alert>{err}</Alert>}{ok && <Alert kind="success">{ok}</Alert>}
    </div>
  );
}

export function LeaveTeamButton({ teamId, isCaptain }: { teamId: string; isCaptain: boolean }) {
  const { busy, err, run, router } = useAction(); const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-2">
      {confirm ? <div className="flex gap-2"><button type="button" className="btn-danger flex-1" disabled={!!busy} onClick={() => run("leave", `/api/v1/teams/${teamId}/leave`, { method: "POST" }, undefined, () => router.push("/teams"))}>{busy ? "Leaving…" : isCaptain ? "Yes, hand over / disband" : "Yes, leave"}</button><button type="button" className="btn-ghost" onClick={() => setConfirm(false)}>Stay</button></div>
        : <button type="button" className="btn-ghost w-full" onClick={() => setConfirm(true)}>Leave team</button>}
      {err && <Alert>{err}</Alert>}
    </div>
  );
}

export function InviteResponse({ teamId, teamName }: { teamId: string; teamName: string }) {
  const { busy, err, run } = useAction();
  const act = (action: "accept" | "reject") => run(action, `/api/v1/teams/${teamId}/invite`, { method: "PATCH", json: { action } });
  return (
    <div className="rounded-2xl border border-lime/40 bg-lime/10 p-4"><p className="font-semibold text-lime">You&apos;ve been invited to join {teamName}</p>
      <div className="mt-3 flex gap-2"><button type="button" className="btn-lime" disabled={!!busy} onClick={() => act("accept")}>Accept</button><button type="button" className="btn-ghost" disabled={!!busy} onClick={() => act("reject")}>Decline</button></div>
      {err && <div className="mt-2"><Alert>{err}</Alert></div>}</div>
  );
}
