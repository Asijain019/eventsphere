import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getEventBySlugOrId } from "@/modules/connections/service";
import { AttendeeDiscovery } from "@/components/social/AttendeeDiscovery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meet attendees" };

export default async function PeoplePage({ params }: { params: { eventSlug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/people/${params.eventSlug}`)}`);
  const event = await getEventBySlugOrId(params.eventSlug);
  if (!event) notFound();
  return (
    <div className="container-x py-10">
      <Link href={`/events/${event.slug}`} className="text-sm text-white/60 hover:text-white">&larr; Back to event</Link>
      <h1 className="section-title mt-3">Meet the <span className="text-lime">crowd</span></h1>
      <p className="mt-3 max-w-2xl text-white/65">People attending <strong>{event.title}</strong> who opted in to be discovered. Send a connection request; messaging unlocks once they accept. Contact details are never shared.</p>
      <div className="mt-8"><AttendeeDiscovery eventId={event.id} eventTitle={event.title} /></div>
    </div>
  );
}
