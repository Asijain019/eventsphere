"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/client";
import { Alert } from "@/components/ui/States";

/** Shown to signed-in users without an organizer role. MVP: one-click self-serve upgrade (stands in for verification). */
export function AccessRequired({ role }: { role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const canUpgrade = role === "STUDENT" || role === "GENERAL";
  async function upgrade() {
    setBusy(true); setErr(null);
    try { await api("/api/v1/me/become-organizer", { method: "POST" }); router.refresh(); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  return (
    <main className="container-x grid min-h-[60vh] place-items-center py-16">
      <div className="card max-w-xl p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient shadow-glow"><ShieldCheck /></div>
        <h1 className="font-display text-3xl font-bold">Organizer access required</h1>
        <p className="mt-3 text-sm text-white/65">The organizer dashboard is for people who host events, run contests and recruit volunteers. Your account is currently a <b>{role.toLowerCase().replace("_", " ")}</b> account.</p>
        {canUpgrade ? (
          <>
            <p className="mt-3 text-xs text-white/50">In this MVP, organizer access is self-serve. A production deployment would add a verification step (college email, club approval) before granting it.</p>
            {err && <div className="mt-4"><Alert>{err}</Alert></div>}
            <button onClick={upgrade} disabled={busy} className="btn-primary mt-6">{busy ? "Enabling..." : "Become an organizer"}</button>
          </>
        ) : <p className="mt-3 text-sm text-white/60">Please contact a platform administrator to change your role.</p>}
        <div className="mt-4"><Link href="/events" className="text-sm text-lime underline-offset-4 hover:underline">Back to events</Link></div>
      </div>
    </main>
  );
}
