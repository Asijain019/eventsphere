import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/States";
import { Reveal } from "@/components/ui/Reveal";
import { withDistinctEventPosters } from "@/lib/event-card-images";
import type { EventListItem } from "@/modules/events/types";

/** Staggered grid of real DB events, with a designed empty state when the city has none. */
export function EventGrid({ events, cityName, cols = 3 }: { events: EventListItem[]; cityName: string; cols?: 3 | 4 }) {
  if (!events.length)
    return <EmptyState title={`No upcoming events in ${cityName} yet`} body="Try another city, or be the first to host something here." action={<Link href="/organizer/events/new" className="btn-lime">Host an event</Link>} />;
  const cardEvents = withDistinctEventPosters(events);
  return (
    <div className={cols === 4 ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-4" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"}>
      {cardEvents.map((e, i) => <Reveal key={e.id} delay={(i % 3) * 0.08}><EventCard event={e} /></Reveal>)}
    </div>
  );
}
