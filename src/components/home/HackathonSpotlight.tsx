import Link from "next/link";
import { Code2, Users, Trophy, ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/ui/Tilt";
import { IMG } from "@/lib/images";
import { formatDate } from "@/lib/utils";
import type { EventListItem } from "@/modules/events/types";

/** Blue/lime tech spotlight palette taken from the hackathon poster reference. */
export function HackathonSpotlight({ events, cityName }: { events: EventListItem[]; cityName: string }) {
  return (
    <section className="relative overflow-hidden bg-[#0A84F5] py-16 text-white">
      <div aria-hidden className="absolute inset-0 select-none overflow-hidden font-display text-[22vw] font-black leading-[.8] text-white/[.07]">HACKATHON HACKATHON HACKATHON</div>
      <svg aria-hidden className="absolute -right-16 top-10 h-72 w-72 animate-float text-lime" viewBox="0 0 100 100" fill="currentColor"><path d="M50 0l9 28 27-14-14 27 28 9-28 9 14 27-27-14-9 28-9-28-27 14 14-27-28-9 28-9-14-27 27 14z" /></svg>
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <Reveal>
          <Tilt max={7} className="mx-auto w-full max-w-sm">
            <SmartImage src={IMG.hackathon} alt="Hackathon poster: browser window with a pixel cursor" className="aspect-[9/16] w-full rounded-[2rem] shadow-[12px_12px_0_#D6FF55]" imgClassName="object-cover" priority={false} />
          </Tilt>
        </Reveal>
        <div>
          <Reveal>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-lime"><Code2 size={14} /> Hackathons &amp; tech</p>
            <h2 className="font-display text-5xl font-bold leading-[.92] sm:text-6xl lg:text-7xl">Build something<br /><span className="rounded-xl bg-lime px-3 text-ink">in 24 hours.</span></h2>
            <p className="mt-5 max-w-xl text-lg text-white/85">Hack nights, coding contests and tech summits at {cityName} colleges. Register solo, or post the skills you need and find a team.</p>
          </Reveal>
          <div className="mt-8 grid gap-3">
            {events.length ? events.map((e) => (
              <Reveal key={e.id}>
                <Link href={`/events/${e.slug}`} className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 text-ink transition hover:-translate-y-0.5 hover:shadow-pop">
                  <div className="min-w-0"><p className="truncate font-display text-lg font-bold">{e.title}</p><p className="truncate text-sm text-ink/60">{formatDate(e.startAt, { day: "numeric", month: "short" })} · {e.collegeName ?? e.organizerName}</p></div>
                  <ArrowUpRight className="shrink-0 transition group-hover:rotate-12" />
                </Link>
              </Reveal>
            )) : (
              <div className="rounded-2xl border-2 border-dashed border-white/40 p-6 text-center"><p className="font-display text-lg font-bold">No hackathons listed in {cityName} right now</p><p className="text-sm text-white/80">Organizers can publish one in minutes.</p></div>
            )}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/events?category=hackathons" className="btn bg-ink text-paper hover:bg-white hover:text-ink"><Trophy size={16} /> All hackathons</Link>
            <Link href="/teams" className="btn bg-lime text-ink hover:bg-white"><Users size={16} /> Find my team</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
