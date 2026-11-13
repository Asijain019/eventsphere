import type { Metadata } from "next";
import { guardOrganizerPage } from "@/modules/organizer/guard";
import { AccessRequired } from "@/components/organizer/AccessRequired";
import { ManageEvent } from "@/components/organizer/ManageEvent";

export const metadata: Metadata = { title: "Manage event | EventSphere" };
export const dynamic = "force-dynamic";

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const { user, allowed } = await guardOrganizerPage(`/organizer/events/${params.id}`);
  if (!allowed) return <AccessRequired role={user.role} />;
  return <ManageEvent eventId={params.id} />;
}
