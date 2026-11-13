"use client";
import Link from "next/link";
import { Calendar, MapPin, Building2 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Tilt } from "@/components/ui/Tilt";
import { formatDate, formatPrice, formatTime, cn } from "@/lib/utils";
import { CATEGORY_POSTER } from "@/lib/images";
import { registrationState, type EventListItem } from "@/modules/events/types";

const TONE = { open: "bg-lime text-ink", few: "bg-orange text-ink", full: "bg-white/20 text-white", closed: "bg-white/20 text-white", cancelled: "bg-red-500 text-white" } as const;

/** Reusable 3D-tilt event card. `favourite` slot lets the parent inject a working favourite button. */
export function EventCard({ event: e, className, favourite }: { event: EventListItem; className?: string; favourite?: React.ReactNode }) {
  const st = registrationState(e);
  return (
    <Tilt className={className}>
      <article className="group card relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-glow">
        <Link href={`/events/${e.slug}`} className="relative block aspect-[16/10] overflow-hidden" aria-label={`View ${e.title}`}>
          <SmartImage src={e.posterUrl || CATEGORY_POSTER[e.categorySlug]} alt={`${e.title} poster`} className="h-full w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" fallbackLabel={e.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-ink" style={{ background: e.categoryColor }}>{e.categoryName}</span>
          <span className={cn("absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold", TONE[st.tone])}>{st.label}</span>
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold backdrop-blur">{formatPrice(e.feePaise)}</span>
          {e.isDemo && <span className="absolute right-3 top-3 rounded-full border border-white/30 bg-ink/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur">Sample</span>}
        </Link>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="font-display text-lg font-bold leading-tight"><Link href={`/events/${e.slug}`} className="hover:text-lime">{e.title}</Link></h3>
          <ul className="space-y-1.5 text-sm text-white/65">
            <li className="flex items-center gap-2"><Calendar size={14} className="shrink-0 text-violet-400" />{formatDate(e.startAt, { day: "numeric", month: "short", weekday: "short" })} · {formatTime(e.startAt)}</li>
            <li className="flex items-center gap-2"><MapPin size={14} className="shrink-0 text-magenta" /><span className="truncate">{e.mode === "ONLINE" ? "Online" : `${e.venueName ?? "Venue TBA"}${e.locality ? `, ${e.locality}` : ""}`} · {e.cityName}</span></li>
            <li className="flex items-center gap-2"><Building2 size={14} className="shrink-0 text-lime" /><span className="truncate">{e.collegeName ?? e.organizerName}</span></li>
          </ul>
          <div className="mt-auto flex items-center justify-between pt-2">
            <Link href={`/events/${e.slug}`} className="btn-ghost !px-4 !py-2">View details</Link>
            {favourite}
          </div>
        </div>
      </article>
    </Tilt>
  );
}
