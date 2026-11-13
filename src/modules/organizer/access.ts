import { and, eq, or } from "drizzle-orm";
import { db, events, userRoles, collegeMembers, userProfiles } from "@/db";
import { forbidden, notFound } from "@/lib/api";
import type { SessionUser } from "@/lib/session";

export type Actor = { id: string; role: SessionUser["role"] };
type EventRow = typeof events.$inferSelect;

/** Is this user a college admin for the given college? (userRoles scope, collegeMembers ADMIN, or profile college) */
export async function isCollegeAdminOf(actor: Actor, collegeId: string | null): Promise<boolean> {
  if (!collegeId || actor.role !== "COLLEGE_ADMIN") return false;
  const [r] = await db.select({ id: userRoles.id }).from(userRoles)
    .where(and(eq(userRoles.userId, actor.id), eq(userRoles.role, "COLLEGE_ADMIN"), eq(userRoles.scopeId, collegeId))).limit(1);
  if (r) return true;
  const [m] = await db.select({ id: collegeMembers.id }).from(collegeMembers)
    .where(and(eq(collegeMembers.userId, actor.id), eq(collegeMembers.collegeId, collegeId), or(eq(collegeMembers.role, "ADMIN"), eq(collegeMembers.role, "COLLEGE_ADMIN")))).limit(1);
  if (m) return true;
  const [p] = await db.select({ c: userProfiles.collegeId }).from(userProfiles).where(eq(userProfiles.userId, actor.id)).limit(1);
  return p?.c === collegeId;
}

/** Resource-level authorization: organizer owns event, OR platform admin, OR college admin of the event's college. */
export async function canManageEvent(actor: Actor, ev: Pick<EventRow, "organizerId" | "collegeId">): Promise<boolean> {
  if (actor.role === "PLATFORM_ADMIN") return true;
  if (ev.organizerId === actor.id && ["ORGANIZER", "COLLEGE_ADMIN"].includes(actor.role)) return true;
  return isCollegeAdminOf(actor, ev.collegeId);
}

export async function loadManagedEvent(actor: Actor, eventId: string): Promise<EventRow> {
  const [ev] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!ev) throw notFound("Event not found");
  if (!(await canManageEvent(actor, ev))) throw forbidden("You can only manage your own events");
  return ev;
}
