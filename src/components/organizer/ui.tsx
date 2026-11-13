"use client";
import { cn } from "@/lib/utils";

const STATUS: Record<string, string> = {
  DRAFT: "bg-white/15 text-white", PUBLISHED: "bg-lime text-ink", CANCELLED: "bg-red-500/90 text-white", POSTPONED: "bg-orange text-ink", COMPLETED: "bg-sky text-white",
  SUBMITTED: "bg-white/15 text-white", UNDER_REVIEW: "bg-sky/90 text-white", SHORTLISTED: "bg-violet text-white", ACCEPTED: "bg-lime text-ink", REJECTED: "bg-red-500/90 text-white", WITHDRAWN: "bg-white/10 text-white/60",
  OPEN: "bg-lime text-ink", CLOSED: "bg-white/15 text-white", CONFIRMED: "bg-lime text-ink", WAITLISTED: "bg-orange text-ink",
  PENDING: "bg-white/15 text-white", COMPLETED_V: "bg-lime text-ink", NO_SHOW: "bg-red-500/90 text-white",
};
export const labelOf = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
export function StatusChip({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", STATUS[status] ?? "bg-white/15", className)}>{labelOf(status)}</span>;
}
export function StatTile({ label, value, hint, accent = "#8B35FF" }: { label: string; value: React.ReactNode; hint?: string; accent?: string }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl" style={{ background: accent }} aria-hidden />
      <p className="text-xs font-semibold uppercase tracking-wider text-white/55">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}
export function Field({ label, error, hint, children, className }: { label: string; error?: string | null; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-white/45">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div role="status" aria-label={label} className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-lime" /></div>;
}
