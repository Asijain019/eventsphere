import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ORGANIZER_ROLES } from "@/lib/api";

/** Server-side page guard. Redirects anonymous visitors to /login?next=…; returns `allowed=false` for signed-in non-organizers. */
export async function guardOrganizerPage(path: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return { user, allowed: ORGANIZER_ROLES.includes(user.role) };
}
export async function requireLogin(path: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}
