"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export type Membership = { status: string; role: string } | null;
export function JoinButton({ slug, policy, membership, onChange, size = "md", allowLeave = false }: {
  slug: string; policy: string; membership: Membership; onChange?: (m: Membership) => void; size?: "sm" | "md"; allowLeave?: boolean;
}) {
  const router = useRouter();
  const [m, setM] = useState<Membership>(membership);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const cls = size === "sm" ? "!px-4 !py-1.5 !text-xs" : "";
  const upd = (n: Membership) => { setM(n); onChange?.(n); };
  async function join() {
    setBusy(true); setErr(null);
    try { const r = await api<{ status: string }>(`/api/v1/communities/${slug}/join`, { method: "POST" }); upd({ status: r.status, role: "MEMBER" }); router.refresh(); }
    catch (e: any) { if (e.status === 401) router.push(`/login?next=${encodeURIComponent(location.pathname)}`); else setErr(e.message); }
    finally { setBusy(false); }
  }
  async function leave() {
    if (!confirm("Leave this community?")) return;
    setBusy(true); setErr(null);
    try { await api(`/api/v1/communities/${slug}/join`, { method: "DELETE" }); upd(null); router.refresh(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  let btn: React.ReactNode;
  if (m?.status === "ACTIVE") btn = allowLeave && m.role !== "OWNER" ? <button className={`btn-ghost ${cls}`} onClick={leave} disabled={busy}>Leave</button> : <span className={`btn-ghost pointer-events-none ${cls}`}>{m.role === "OWNER" ? "Owner" : "Joined"}</span>;
  else if (m?.status === "PENDING") btn = <button className={`btn-ghost ${cls}`} disabled title="Waiting for a moderator to approve">Requested</button>;
  else if (m?.status === "REMOVED") btn = <button className={`btn-ghost ${cls}`} disabled title="You were removed from this community">Unavailable</button>;
  else btn = <button className={`btn-lime ${cls}`} onClick={join} disabled={busy}>{busy ? "..." : policy === "APPROVAL" ? "Request to join" : policy === "REGISTERED_ONLY" ? "Join (attendees)" : "Join"}</button>;
  return <div className="inline-flex flex-col items-start gap-1">{btn}{err && <span role="alert" className="max-w-[260px] text-xs text-red-300">{err}</span>}</div>;
}
