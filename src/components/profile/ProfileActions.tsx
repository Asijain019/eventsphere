"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flag, ShieldBan } from "lucide-react";
import { api } from "@/lib/client";
import { ConnectButton, type ConnState } from "@/components/social/ConnectButton";
import { Alert } from "@/components/ui/States";

export function ProfileActions({ userId, state, loggedIn }: { userId: string; state: ConnState; loggedIn: boolean }) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false); const [reason, setReason] = useState("");
  const [note, setNote] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  if (!loggedIn) return <a className="btn-primary" href={`/login?next=${encodeURIComponent(`/u/${userId}`)}`}>Log in to connect</a>;
  async function block() {
    if (!confirm("Block this person? They won't be able to contact you and any connection will be removed.")) return;
    try { await api(`/api/v1/users/${userId}/block`, { method: "POST" }); router.refresh(); } catch (e: any) { setNote({ kind: "error", text: e.message }); }
  }
  async function report(e: React.FormEvent) {
    e.preventDefault();
    try { await api("/api/v1/reports", { method: "POST", json: { targetType: "USER", targetId: userId, reason } }); setNote({ kind: "success", text: "Thanks, our team will review your report." }); setReporting(false); setReason(""); }
    catch (err: any) { setNote({ kind: "error", text: err.message }); }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ConnectButton userId={userId} state={state} />
        {state !== "SELF" && state !== "BLOCKED" && state !== "BLOCKED_BY" && <button className="btn-ghost" onClick={block}><ShieldBan size={15} />Block</button>}
        {state !== "SELF" && <button className="btn-ghost" onClick={() => setReporting(!reporting)} aria-expanded={reporting}><Flag size={15} />Report</button>}
      </div>
      {reporting && (
        <form onSubmit={report} className="card space-y-3 p-4">
          <label className="label" htmlFor="rep">What's wrong?</label>
          <textarea id="rep" className="input min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} maxLength={1000} required />
          <div className="flex gap-2"><button className="btn-primary">Submit report</button><button type="button" className="btn-ghost" onClick={() => setReporting(false)}>Cancel</button></div>
        </form>
      )}
      {note && <Alert kind={note.kind}>{note.text}</Alert>}
    </div>
  );
}
