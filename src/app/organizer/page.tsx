import type { Metadata } from "next";
import { guardOrganizerPage } from "@/modules/organizer/guard";
import { AccessRequired } from "@/components/organizer/AccessRequired";
import { OrganizerDashboard } from "@/components/organizer/Dashboard";

export const metadata: Metadata = { title: "Organizer dashboard | EventSphere" };
export const dynamic = "force-dynamic";

export default async function OrganizerPage() {
  const { user, allowed } = await guardOrganizerPage("/organizer");
  if (!allowed) return <AccessRequired role={user.role} />;
  return <OrganizerDashboard name={user.name} />;
}
