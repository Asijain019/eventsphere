import type { Metadata } from "next";
import { guardOrganizerPage } from "@/modules/organizer/guard";
import { AccessRequired } from "@/components/organizer/AccessRequired";
import { EventForm } from "@/components/organizer/EventForm";

export const metadata: Metadata = { title: "Create event | EventSphere" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const { user, allowed } = await guardOrganizerPage("/organizer/events/new");
  if (!allowed) return <AccessRequired role={user.role} />;
  return <EventForm />;
}
