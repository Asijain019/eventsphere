import Link from "next/link";
import { Users } from "lucide-react";
import { formatDate, initials, cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";

export type TeamListItem = {
  id: string; name: string; description: string | null; openRoles: string[]; maxSize: number; status: string; memberCount: number;
  eventSlug: string; eventTitle: string; eventStartAt: Date | string; captain: { id: string; name: string; avatarUrl: string | null };
};
export function TeamCard({ t, action }: { t: TeamListItem; action?: React.ReactNode }) {
  const open = t.status === "FORMING" && t.memberCount < t.maxSize;
  return (
    <article className="card flex h-full flex-col gap-3 p-4 transition hover:border-violet/50 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><Link href={`/events/${t.eventSlug}`} className="truncate text-xs uppercase tracking-wider text-violet-400 hover:text-lime">{t.eventTitle}</Link>
          <h3 className="font-display text-lg font-bold"><Link href={`/teams/${t.id}`} className="hover:text-lime">{t.name}</Link></h3></div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold", open ? "bg-lime text-ink" : "bg-white/15 text-white/70")}>{open ? `${t.maxSize - t.memberCount} spot${t.maxSize - t.memberCount > 1 ? "s" : ""} open` : t.status === "REGISTERED" ? "Registered" : "Full"}</span>
      </div>
      {t.description && <p className="line-clamp-2 text-sm text-white/65">{t.description}</p>}
      {t.openRoles.length > 0 && <div><p className="mb-1.5 text-xs uppercase tracking-wider text-white/45">Looking for</p><div className="flex flex-wrap gap-1.5">{t.openRoles.map((r) => <span key={r} className="chip !border-magenta/40 !text-magenta">{r}</span>)}</div></div>}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <Link href={`/u/${t.captain.id}`} className="flex min-w-0 items-center gap-2 text-sm text-white/70 hover:text-white">
          {t.captain.avatarUrl ? <SmartImage src={t.captain.avatarUrl} alt="" className="h-7 w-7 rounded-full" /> : <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-[10px] font-bold">{initials(t.captain.name)}</span>}
          <span className="truncate">{t.captain.name}</span></Link>
        <span className="flex shrink-0 items-center gap-1 text-sm text-white/60"><Users size={14} />{t.memberCount}/{t.maxSize}</span>
      </div>
      {action}
      <p className="sr-only">Event date {formatDate(t.eventStartAt)}</p>
    </article>
  );
}
