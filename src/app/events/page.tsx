import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { DEFAULT_CITY } from "@/lib/constants";
import { IMG } from "@/lib/images";
import { listEvents, getMeta } from "@/modules/events/queries";
import { cleanParams, eventFiltersSchema } from "@/modules/events/schemas";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { FavouriteButton } from "@/components/events/FavouriteButton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explore events" };

export default async function EventsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const raw = cleanParams(searchParams);
  const parsed = eventFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : eventFiltersSchema.parse({});
  const user = await getCurrentUser().catch(() => null);
  let data: Awaited<ReturnType<typeof listEvents>> | null = null; let meta: Awaited<ReturnType<typeof getMeta>> | null = null; let failed = false;
  try { [data, meta] = await Promise.all([listEvents(filters, user), getMeta(filters.city ?? DEFAULT_CITY)]); } catch (e) { console.error("[events page]", e); failed = true; }
  const city = meta?.cities.find((c) => c.slug === (filters.city ?? DEFAULT_CITY))?.name ?? (filters.city === "all" ? "All cities" : "your city");

  const href = (page: number) => { const p = new URLSearchParams(raw); p.set("page", String(page)); return `/events?${p.toString()}`; };

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <SmartImage src={IMG.crowd} alt="" className="absolute inset-0 h-full w-full opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container-x relative py-14 sm:py-20">
          <Reveal><p className="chip mb-4 !border-lime/40 !text-lime">Explore · {city}</p></Reveal>
          <Reveal delay={0.05}><h1 className="font-display text-5xl font-bold leading-[.95] sm:text-7xl">Find your next <span className="text-gradient bg-brand-gradient bg-clip-text text-transparent">experience.</span></h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 max-w-xl text-white/70">Concerts, hackathons, fests, workshops and more from colleges and organisers across {city}. Filter by what you love.</p></Reveal>
        </div>
      </section>

      <div className="container-x py-8">
        {failed || !meta || !data ? (
          <ErrorState message="We couldn't load events right now. Please refresh in a moment." />
        ) : (
          <EventFilters meta={meta} defaultCity={DEFAULT_CITY}>
            <p className="mb-4 text-sm text-white/60" aria-live="polite"><span className="font-semibold text-white">{data.total}</span> event{data.total === 1 ? "" : "s"} found{filters.q ? <> for &ldquo;{filters.q}&rdquo;</> : null}</p>
            {data.items.length === 0 ? (
              <EmptyState title="No events match these filters" body="Try removing a filter, widening the dates or switching city." action={<Link href="/events" className="btn-primary">Reset filters</Link>} />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((e, i) => (
                    <Reveal key={e.id} delay={(i % 3) * 0.06}><EventCard event={e} className="h-full" favourite={<FavouriteButton eventId={e.id} initial={!!e.favourited} loggedIn={!!user} />} /></Reveal>
                  ))}
                </div>
                {data.totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
                    {data.page > 1 ? <Link className="btn-ghost" href={href(data.page - 1)} rel="prev">← Previous</Link> : <span className="btn-ghost pointer-events-none opacity-40" aria-disabled>← Previous</span>}
                    <span className="text-sm text-white/60">Page {data.page} of {data.totalPages}</span>
                    {data.page < data.totalPages ? <Link className="btn-ghost" href={href(data.page + 1)} rel="next">Next →</Link> : <span className="btn-ghost pointer-events-none opacity-40" aria-disabled>Next →</span>}
                  </nav>
                )}
              </>
            )}
          </EventFilters>
        )}
      </div>
    </>
  );
}
