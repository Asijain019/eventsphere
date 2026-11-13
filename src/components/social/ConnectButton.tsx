"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, UserCheck, UserPlus, Clock, Ban } from "lucide-react";
import { api } from "@/lib/client";

export type ConnState = "SELF" | "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "CONNECTED" | "BLOCKED" | "BLOCKED_BY";

/** State-aware social action button. Every state either performs a real API call, navigates, or is disabled with a reason. */
export function ConnectButton({ userId, state, onChange, size = "md" }: { userId: string; state: ConnState; onChange?: (s: ConnState) => void; size?: "sm" | "md" }) {
  const router = useRouter();
  const [s, setS] = useState<ConnState>(state);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const cls = size === "sm" ? "!px-3 !py-1.5 !text-xs" : "";
  const set = (n: ConnState) => { setS(n); onChange?.(n); };
  async function run(fn: () => Promise<void>) {
    setBusy(true); setErr(null);
    try { await fn(); } catch (e: any) {
      if (e.status === 401) { router.push(`/login?next=${encodeURIComponent(location.pathname)}`); return; }
      setErr(e.message);
    } finally { setBusy(false); }
  }
  const connect = () => run(async () => { const r = await api<{ status: string }>("/api/v1/connections", { method: "POST", json: { recipientId: userId } }); set(r.status === "ACCEPTED" ? "CONNECTED" : "PENDING_SENT"); });
  const message = () => run(async () => { const c = await api<{ id: string }>("/api/v1/conversations", { method: "POST", json: { userId } }); router.push(`/messages/${c.id}`); });
  const unblock = () => run(async () => { await api(`/api/v1/users/${userId}/block`, { method: "DELETE" }); set("NONE"); router.refresh(); });

  let btn: React.ReactNode = null;
  if (s === "SELF") btn = <Link href="/profile" className={`btn-ghost ${cls}`}>Edit profile</Link>;
  else if (s === "NONE") btn = <button className={`btn-primary ${cls}`} onClick={connect} disabled={busy}><UserPlus size={15} />{busy ? "Sending..." : "Connect"}</button>;
  else if (s === "PENDING_SENT") btn = <button className={`btn-ghost ${cls}`} disabled title="Waiting for them to accept"><Clock size={15} />Request sent</button>;
  else if (s === "PENDING_RECEIVED") btn = <button className={`btn-lime ${cls}`} onClick={connect} disabled={busy}><UserCheck size={15} />Accept request</button>;
  else if (s === "CONNECTED") btn = <button className={`btn-lime ${cls}`} onClick={message} disabled={busy}><MessageCircle size={15} />Message</button>;
  else if (s === "BLOCKED") btn = <button className={`btn-ghost ${cls}`} onClick={unblock} disabled={busy}><Ban size={15} />Unblock</button>;
  else btn = <button className={`btn-ghost ${cls}`} disabled title="Unavailable"><Ban size={15} />Unavailable</button>;
  return <div className="inline-flex flex-col items-start gap-1">{btn}{err && <span role="alert" className="max-w-[220px] text-xs text-red-300">{err}</span>}</div>;
}
