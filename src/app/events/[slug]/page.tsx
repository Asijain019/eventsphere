import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Calendar, Clock, ExternalLink, GraduationCap, MapPin, MessageSquare, Mic2, HandHeart, Users, Laptop, FileEdit } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { CATEGORY_POSTER, IMG } from "@/lib/images";
import { formatDate, formatTime, initials } from "@/lib/utils";
import { getEvent, getRelatedEvents } from "@/modules/events/queries";
import { EventCard } from "@/components/events/EventCard";
import { FavouriteButton } from "@/components/events/FavouriteButton";
import { RegisterCard } from "@/components/events/RegisterCard";
import { Gallery } from "@/components/events/Gallery";
import { Countdown } from "@/components/events/Countdown";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";
import { ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const user = await getCurrentUser().catch(() => null);
  try { return { user, event: await getEvent(slug, user) }; }
  catch (e) { if (e instanceof ApiError && e.status === 404) return { user, event: null, notFound: true }; throw e; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try { const { event } = await load(params.slug); return event ? { title: event.title, description: event.description.slice(0, 150) } : { title: "Event not found" }; }
  catch { return { title: "Event" }; }
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  let res: Awaited<ReturnType<typeof load>>;
  try { res = await load(params.slug); } catch (e) { console.error("[event page]", e); return <div className="container-x py-20"><ErrorState message="We couldn't load this event. Please try again shortly." /></div>; }
  const { user, event: e } = res;
  if (!e) notFound();
  const related = await getRelatedEvents(e.id, 3, user).catch(() => []);
  const images = [e.posterUrl || CATEGORY_POSTER[e.category.slug], ...e.media.filter((m) => m.type === "IMAGE").map((m) => m.url)].filter(Boolean) as string[];
  const v = e.venue; const hasMap = v?.latitude != null && v?.longitude != null && e.mode !== "ONLINE";
  const bbox = hasMap ? `${v!.longitude! - 0.008},${v!.latitude! - 0.005},${v!.longitude! + 0.008},${v!.latitude! + 0.005}` : "";
  const sameDay = formatDate(e.startAt) === formatDate(e.endAt);
  const descriptionSummary = e.description.trim().split(/\n\s*\n/)[0];
  const banner = e.status === "DRAFT" ? ["Draft — only you can see this event. Publish it from your organizer dashboard.", "border-orange/50 bg-orange/15 text-orange"]
    : e.status === "CANCELLED" ? ["This event has been cancelled.", "border-red-500/40 bg-red-500/10 text-red-200"]
    : e.status === "POSTPONED" ? ["This event has been postponed. Check announcements for the new date.", "border-orange/50 bg-orange/15 text-orange"] : null;

  return (
    <article>
      {banner && <div className={`border-b px-4 py-3 text-center text-sm font-medium ${banner[1]}`} role="status"><FileEdit size={14} className="mr-2 inline" />{banner[0]}{e.isOwner && <Link href="/organizer" className="ml-3 underline">Open dashboard</Link>}</div>}
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 scale-110 bg-cover bg-center opacity-25 blur-2xl" style={images[0] ? { backgroundImage: `url(${JSON.stringify(images[0])})` } : undefined} />
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-ink/40 via-ink/80 to-ink" />
        <div className="container-x relative z-10 grid grid-cols-1 gap-4 py-4 sm:gap-8 sm:py-7 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-10 lg:py-14">
          <div className="min-w-0 space-y-3 sm:space-y-4 lg:order-last">
            <nav aria-label="Breadcrumb" className="text-xs text-white/50"><Link href="/events" className="hover:text-lime">Events</Link> / <Link href={`/events?category=${e.category.slug}`} className="hover:text-lime">{e.category.name}</Link></nav>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-bold text-ink" style={{ background: e.category.color }}>{e.category.name}</span>
              <span className="chip">{e.mode === "ONLINE" ? <><Laptop size={12} />Online</> : e.mode === "HYBRID" ? "Hybrid" : "In person"}</span>
              {e.isDemo && <span className="chip">Sample event</span>}
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-6xl lg:leading-[.98]">{e.title}</h1>
            <ul className="space-y-1.5 text-sm text-white/80 sm:space-y-2">
              <li className="flex items-start gap-3"><Calendar size={18} className="mt-0.5 shrink-0 text-violet-400" /><span>{formatDate(e.startAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}{!sameDay && <> – {formatDate(e.endAt, { day: "numeric", month: "long" })}</>}</span></li>
              <li className="flex items-start gap-3"><Clock size={18} className="mt-0.5 shrink-0 text-lime" /><span>{formatTime(e.startAt)} – {formatTime(e.endAt)} IST</span></li>
              <li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-magenta" /><span>{e.mode === "ONLINE" ? "Online event" : <>{v?.name ?? "Venue TBA"}{v?.locality ? `, ${v.locality}` : ""}, {e.city.name}</>}</span></li>
            </ul>
            <div className="[&>div:first-child]:!p-4 [&>div:first-child>div.relative]:!space-y-3">
              <RegisterCard loggedIn={!!user} registration={e.registration}
                event={{ id: e.id, slug: e.slug, title: e.title, capacity: e.capacity, confirmedCount: e.confirmedCount, feePaise: e.feePaise, status: e.status, teamsEnabled: e.teamsEnabled, isOwner: e.isOwner,
                  startAt: new Date(e.startAt).toISOString(), registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline).toISOString() : null }} />
            </div>
            <div>
              <p className="line-clamp-2 leading-relaxed text-white/70 sm:line-clamp-3">{descriptionSummary}</p>
              <Link href="#about" className="mt-1 inline-block text-sm font-semibold text-lime hover:underline">Full event details</Link>
            </div>
            {e.registrationDeadline && e.status === "PUBLISHED" && new Date(e.startAt) > new Date() && <div className="card p-5"><Countdown to={new Date(e.registrationDeadline).toISOString()} /></div>}
            <div className="flex items-center gap-3"><FavouriteButton eventId={e.id} initial={e.favourited} loggedIn={!!user} className="!h-12 !w-12" /><span className="text-sm text-white/60">Save for later</span></div>
          </div>
          <div className="min-w-0 lg:order-first [&>div>div:first-child]:!aspect-[16/9]">
            <Gallery images={images} title={e.title} />
          </div>
        </div>
      </section>

      <div className="container-x py-10">
        <div className="min-w-0 space-y-12 lg:max-w-4xl">
          <Reveal><h2 id="about" className="font-display text-2xl font-bold">About this event</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-white/75">{e.description}</p>
            {e.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{e.tags.map((t) => <Link key={t} href={`/events?q=${encodeURIComponent(t)}`} className="chip hover:bg-white/10">#{t}</Link>)}</div>}
          </Reveal>

          <Reveal><div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5"><p className="mb-3 text-xs uppercase tracking-wider text-white/50">Organised by</p>
              <div className="flex items-center gap-3">
                {e.organizer.avatarUrl ? <SmartImage src={e.organizer.avatarUrl} alt={e.organizer.name} className="h-12 w-12 rounded-full" /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient font-display font-bold">{initials(e.organizer.name)}</span>}
                <div className="min-w-0"><Link href={`/u/${e.organizer.id}`} className="block truncate font-semibold hover:text-lime">{e.organizationName ?? e.organizer.name}</Link>
                  {e.college ? <p className="flex items-center gap-1 truncate text-sm text-white/60">{e.college.name}{e.college.verified && <BadgeCheck size={14} className="shrink-0 text-lime" aria-label="Verified college" />}</p> : <p className="text-sm text-white/60">Independent organiser</p>}</div>
              </div></div>
            <div className="card p-5"><p className="mb-3 text-xs uppercase tracking-wider text-white/50">Who can join</p>
              <p className="flex items-start gap-2 text-sm text-white/80"><GraduationCap size={16} className="mt-0.5 shrink-0 text-violet-400" />{e.eligibility || "Open to everyone."}</p></div>
          </div></Reveal>

          {hasMap && (
            <Reveal><h2 className="font-display text-2xl font-bold">Venue &amp; location</h2>
              <div className="card mt-4 overflow-hidden">
                <iframe title={`Map of ${v!.name}`} loading="lazy" className="h-72 w-full border-0 grayscale-[.3] invert-[.9] hue-rotate-180" src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${v!.latitude},${v!.longitude}`} />
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div><p className="font-semibold">{v!.name}</p><p className="text-sm text-white/60">{v!.address}</p></div>
                  <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/?mlat=${v!.latitude}&mlon=${v!.longitude}#map=16/${v!.latitude}/${v!.longitude}`}>Open in maps <ExternalLink size={14} /></a>
                </div></div></Reveal>
          )}
          {!hasMap && v && e.mode !== "ONLINE" && <Reveal><h2 className="font-display text-2xl font-bold">Venue</h2><p className="mt-2 text-white/70">{v.name} — {v.address}</p></Reveal>}

          {e.schedule && e.schedule.length > 0 && (
            <Reveal><h2 className="font-display text-2xl font-bold">Schedule</h2>
              <ol className="mt-5 space-y-0 border-l border-white/15 pl-6">
                {e.schedule.map((s, i) => (
                  <li key={i} className="relative pb-6 last:pb-0"><span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-lime ring-4 ring-ink" aria-hidden />
                    <p className="font-mono text-sm text-lime">{s.time}</p><p className="font-semibold">{s.title}</p>{s.description && <p className="text-sm text-white/60">{s.description}</p>}</li>
                ))}</ol></Reveal>
          )}

          {(e.opportunities.length > 0 || e.volunteerRoles.length > 0) && (
            <Reveal><h2 className="font-display text-2xl font-bold">Get involved</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {e.opportunities.map((o) => (
                  <Link key={o.id} href={`/participate/${o.id}`} className="card group p-5 transition hover:border-violet/60 hover:shadow-glow">
                    <Mic2 size={20} className="text-magenta" /><p className="mt-3 text-xs uppercase tracking-wider text-white/50">Participate · {o.type.replace("_", " ").toLowerCase()}</p>
                    <p className="font-display text-lg font-bold group-hover:text-lime">{o.title}</p><p className="mt-1 line-clamp-2 text-sm text-white/60">{o.description}</p></Link>
                ))}
                {e.volunteerRoles.map((r) => (
                  <Link key={r.id} href={`/volunteer/${r.id}`} className="card group p-5 transition hover:border-lime/50 hover:shadow-glow">
                    <HandHeart size={20} className="text-lime" /><p className="mt-3 text-xs uppercase tracking-wider text-white/50">Volunteer · {r.openings} openings</p>
                    <p className="font-display text-lg font-bold group-hover:text-lime">{r.title}</p><p className="mt-1 line-clamp-2 text-sm text-white/60">{r.description}</p></Link>
                ))}
              </div></Reveal>
          )}

          {e.teamsEnabled && (
            <Reveal><div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-violet/20 to-magenta/10 p-6">
              <div><p className="flex items-center gap-2 font-display text-xl font-bold"><Users size={20} className="text-lime" />Team event</p>
                <p className="mt-1 text-sm text-white/70">Teams of {e.minTeamSize === e.maxTeamSize ? e.maxTeamSize : `${e.minTeamSize}–${e.maxTeamSize}`}. Build your squad or join one that needs your skills.</p></div>
              <div className="flex gap-2"><Link href={`/teams?event=${e.id}`} className="btn-ghost">Browse teams</Link><Link href={`/teams/new?event=${e.id}`} className="btn-lime">Create a team</Link></div>
            </div></Reveal>
          )}

          {e.community && (
            <Reveal><Link href={`/communities/${e.community.slug}`} className="card group flex items-center gap-4 p-5 transition hover:border-violet/60">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient"><MessageSquare size={22} /></span>
              <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wider text-white/50">Event community</p><p className="font-display text-lg font-bold group-hover:text-lime">{e.community.name}</p><p className="line-clamp-1 text-sm text-white/60">{e.community.description}</p></div>
              <span className="btn-ghost shrink-0">Join the conversation</span></Link></Reveal>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-white/10 py-14"><div className="container-x">
          <h2 className="section-title !text-3xl sm:!text-4xl">You might also like</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <EventCard key={r.id} event={r} favourite={<FavouriteButton eventId={r.id} initial={!!r.favourited} loggedIn={!!user} />} />)}</div>
        </div></section>
      )}
    </article>
  );
}
