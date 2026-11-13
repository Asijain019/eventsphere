import type { Metadata } from "next";
import { guardOrganizerPage } from "@/modules/organizer/guard";
import { AccessRequired } from "@/components/organizer/AccessRequired";
import { EventForm } from "@/components/organizer/EventForm";

export const metadata: Metadata = { title: "Edit event | EventSphere" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const { user, allowed } = await guardOrganizerPage(`/organizer/events/${params.id}/edit`);
  if (!allowed) return <AccessRequired role={user.role} />;
  return <EventForm eventId={params.id} />;
}
