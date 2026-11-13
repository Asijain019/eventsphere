"use client";
import { useEffect, useState } from "react";

/** Live countdown to a real event start time. Renders placeholders until mounted to avoid hydration mismatch. */
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = now === null ? null : Math.max(0, new Date(to).getTime() - now);
  const parts = diff === null ? ["--", "--", "--", "--"] : [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60].map((n) => String(n).padStart(2, "0"));
  const labels = ["Days", "Hours", "Mins", "Secs"];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Countdown to the next live music event">
      {parts.map((p, i) => (
        <div key={labels[i]} className="rounded-xl border border-white/10 bg-black/70 px-2 py-3 text-center shadow-[inset_0_0_20px_rgba(139,53,255,.25)]">
          <div className="font-display text-3xl font-bold tabular-nums sm:text-4xl">{p}</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
