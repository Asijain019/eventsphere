"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

/** Live countdown to a deadline. */
export function Countdown({ to, label = "Registration closes in" }: { to: string; label?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now === null) return <div className="h-16" aria-hidden />;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return <p className="flex items-center gap-2 text-sm text-white/60"><Timer size={16} />Registration deadline has passed</p>;
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50"><Timer size={14} />{label}</p>
      <div className="flex gap-2" role="timer" aria-label={`${d} days ${h} hours ${m} minutes`}>
        {[[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]].map(([v, l]) => (
          <div key={l as string} className="min-w-[3.5rem] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center"><div className="font-display text-2xl font-bold tabular-nums">{String(v).padStart(2, "0")}</div><div className="text-[10px] uppercase text-white/50">{l}</div></div>
        ))}
      </div>
    </div>
  );
}
