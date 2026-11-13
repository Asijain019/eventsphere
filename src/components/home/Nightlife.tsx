import Link from "next/link";
import { Ticket, MapPin, Music2, ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/ui/Tilt";
import { IMG, CATEGORY_POSTER } from "@/lib/images";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import type { EventListItem } from "@/modules/events/types";
import { Countdown } from "./Countdown";

/** Immersive dark neon section inspired by the DJ website reference. Countdown targets the real next music event. */
export function Nightlife({ events, cityName }: { events: EventListItem[]; cityName: string }) {
  const next = events[0];
  return (
    <section className="relative overflow-hidden bg-black py-20 sm:py-28">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,53,255,.35),transparent_40%),radial-gradient(circle_at_85%_70%,rgba(232,62,171,.3),transparent_45%)]" />
      <div className="container-x relative">
        <Reveal><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-lime"><Music2 size={14} /> Live music &amp; nightlife</p></Reveal>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative">
            <Reveal>
              <h2 className="font-display text-[clamp(2.6rem,7vw,5.5rem)] font-bold uppercase leading-[.9]">
                <span className="relative inline-block border-2 border-sky px-3 py-1 text-sky [text-shadow:0_0_18px_#2F8CFF] shadow-[0_0_24px_#2F8CFF66,inset_0_0_24px_#2F8CFF33]">Music is</span><br />
                <span className="ml-6 inline-block border-2 border-magenta px-3 py-1 text-magenta [text-shadow:0_0_18px_#E83EAB] shadow-[0_0_24px_#E83EAB66,inset_0_0_24px_#E83EAB33] sm:ml-16">not just</span><br />
                <span className="text-white">to hear.</span> <span className="text-lime">Feel it.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}><p className="mt-6 max-w-lg text-white/65">Fest headliners, DJ nights, open mics and campus gigs across {cityName}. Grab a pass, bring your people, and get close to the stage.</p></Reveal>

            <Reveal delay={0.15}>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-xl sm:p-5">
                {next ? (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl font-bold leading-none">NEXT<br />LIVE</p>
                      </div>
                      <div className="min-w-0 flex-1 sm:pl-6">
                        <p className="truncate font-display text-lg font-bold">{next.title}</p>
                        <p className="flex items-center gap-1.5 text-sm text-white/60"><MapPin size={13} className="text-magenta" />{next.venueName ?? "Venue TBA"} · {formatDate(next.startAt, { day: "numeric", month: "short" })}, {formatTime(next.startAt)}</p>
                      </div>
                    </div>
                    <Countdown to={new Date(next.startAt).toISOString()} />
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link href={`/events/${next.slug}`} className="btn bg-gradient-to-r from-violet to-sky text-white shadow-glow hover:brightness-110"><Ticket size={16} /> {next.feePaise > 0 ? `Get tickets · ${formatPrice(next.feePaise)}` : "Reserve free spot"}</Link>
                      <Link href="/events?category=music-concerts" className="btn-ghost">Check all music events <ArrowRight size={16} /></Link>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="font-display text-xl font-bold">No music events scheduled in {cityName} yet</p>
                    <p className="mt-1 text-sm text-white/60">When an organizer publishes one, the countdown starts here.</p>
                    <Link href="/organizer/events/new" className="btn-lime mt-4">Host a gig</Link>
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          {/* photo stack */}
          <Tilt max={5} className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-violet via-magenta to-orange opacity-50 blur-2xl" aria-hidden />
            <SmartImage src={IMG.djHands} alt="DJ hands working a controller under warm light" className="absolute inset-x-0 top-0 h-[68%] rounded-[2rem] ring-1 ring-white/20" />
            <SmartImage src={IMG.djWebsite} alt="Neon DJ website design reference" className="absolute bottom-0 right-[-4%] h-[42%] w-[52%] rounded-2xl rotate-3 border-2 border-magenta shadow-[0_0_30px_#E83EAB88]" imgClassName="object-top" />
            <SmartImage src={IMG.djConsole} alt="Orange halftone DJ on a giant console" className="absolute bottom-[4%] left-[-4%] h-[34%] w-[42%] rounded-2xl -rotate-3 ring-2 ring-lime" />
          </Tilt>
        </div>

        {events.length > 1 && (
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {events.slice(1, 3).map((e) => (
              <Reveal key={e.id}>
                <Link href={`/events/${e.slug}`} className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] p-3 transition hover:border-magenta/60 hover:bg-white/[.08]">
                  <SmartImage src={e.posterUrl || CATEGORY_POSTER[e.categorySlug]} alt={`${e.title} poster`} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0"><p className="truncate font-display font-bold group-hover:text-lime">{e.title}</p><p className="truncate text-sm text-white/55">{formatDate(e.startAt, { day: "numeric", month: "short" })} · {e.venueName ?? e.cityName}</p></div>
                  <ArrowRight className="ml-auto shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-lime" size={18} />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
