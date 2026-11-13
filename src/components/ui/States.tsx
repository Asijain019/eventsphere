import { cn } from "@/lib/utils";
export function EmptyState({ title, body, action, className }: { title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card flex flex-col items-center gap-3 px-6 py-14 text-center", className)}>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-2xl shadow-glow">✦</div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {body && <p className="max-w-md text-sm text-white/60">{body}</p>}
      {action}
    </div>
  );
}
export function ErrorState({ message = "Something went wrong.", retry }: { message?: string; retry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 border-red-500/30 px-6 py-10 text-center">
      <p className="text-sm text-red-300">{message}</p>
      {retry && <button className="btn-ghost" onClick={retry}>Try again</button>}
    </div>
  );
}
export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton", className)} aria-hidden />;
export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const c = kind === "error" ? "border-red-500/40 bg-red-500/10 text-red-200" : kind === "success" ? "border-lime/40 bg-lime/10 text-lime" : "border-violet/40 bg-violet/10 text-violet-400";
  return <div role={kind === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", c)}>{children}</div>;
}
