import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const CONTESTANT_STEPS = [["SUBMITTED", "Submitted"], ["UNDER_REVIEW", "Under review"], ["SHORTLISTED", "Shortlisted"], ["ACCEPTED", "Accepted"]] as const;
export const VOLUNTEER_STEPS = [["SUBMITTED", "Submitted"], ["ACCEPTED", "Accepted"]] as const;

/** Horizontal progress timeline; REJECTED / WITHDRAWN render as a terminal state. */
export function StatusTimeline({ status, steps }: { status: string; steps: readonly (readonly [string, string])[] }) {
  const idx = steps.findIndex(([s]) => s === status);
  const terminal = status === "REJECTED" || status === "WITHDRAWN";
  return (
    <ol className="flex items-center gap-1 overflow-x-auto py-1" aria-label={`Application status: ${status.replace("_", " ").toLowerCase()}`}>
      {steps.map(([s, label], i) => {
        const done = !terminal && idx >= i;
        return (
          <li key={s} className="flex items-center gap-1">
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", done ? "bg-lime text-ink" : "bg-white/10 text-white/40")}>{done ? <Check size={13} /> : i + 1}</span>
            <span className={cn("whitespace-nowrap text-xs", done ? "text-white" : "text-white/40")}>{label}</span>
            {i < steps.length - 1 && <span className={cn("mx-1 h-px w-6 sm:w-10", done && idx > i ? "bg-lime" : "bg-white/15")} />}
          </li>
        );
      })}
      {terminal && (
        <li className="ml-2 flex items-center gap-1">
          <span className={cn("grid h-6 w-6 place-items-center rounded-full", status === "REJECTED" ? "bg-red-500 text-white" : "bg-white/20 text-white")}>{status === "REJECTED" ? <X size={13} /> : <Minus size={13} />}</span>
          <span className="text-xs font-semibold">{status === "REJECTED" ? "Not selected" : "Withdrawn"}</span>
        </li>
      )}
    </ol>
  );
}
