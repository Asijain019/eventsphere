import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { listTeamEvents } from "@/modules/events/teams";
import { NewTeamForm } from "@/components/events/NewTeamForm";
import { EmptyState, ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create a team" };

export default async function NewTeamPage({ searchParams }: { searchParams: { event?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/teams/new" + (searchParams.event ? `?event=${searchParams.event}` : ""))}`);
  let events: Awaited<ReturnType<typeof listTeamEvents>> | null = null;
  try { events = await listTeamEvents(); } catch (e) { console.error("[teams/new]", e); }
  return (
    <div className="container-x max-w-2xl py-12">
      <Link href="/teams" className="text-sm text-white/60 hover:text-lime">← All teams</Link>
      <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Create a team</h1>
      <p className="mb-8 mt-2 text-white/65">You become the captain. Publish the skills you need and review join requests.</p>
      {!events ? <ErrorState message="Couldn't load events. Please refresh." /> : events.length === 0
        ? <EmptyState title="No team events open right now" body="Team formation is available for events that allow teams, like hackathons." action={<Link href="/events" className="btn-primary">Explore events</Link>} />
        : <NewTeamForm events={events.map((e) => ({ id: e.id, title: e.title, minTeamSize: e.minTeamSize, maxTeamSize: e.maxTeamSize }))} initialEventId={searchParams.event} />}
    </div>
  );
}
