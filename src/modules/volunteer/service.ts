import { and, desc, eq, gt, ilike, isNull, or, sql, count } from "drizzle-orm";
import { db, events, cities, colleges, volunteerRoles as roles, volunteerApplications as vapps, volunteerAssignments as assigns, users, userProfiles } from "@/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";
import { loadManagedEvent, canManageEvent, type Actor } from "@/modules/organizer/access";
import type { z } from "zod";
import type { createRoleSchema, updateRoleSchema, volunteerApplySchema, volunteerReviewSchema } from "./schemas";

type RoleInput = z.infer<typeof createRoleSchema>;
type RolePatch = z.infer<typeof updateRoleSchema>;
type Review = z.infer<typeof volunteerReviewSchema>;

const acceptedCount = sql<number>`(select count(*)::int from volunteer_applications a where a.role_id = ${roles.id} and a.status = 'ACCEPTED')`;
const applicantCount = sql<number>`(select count(*)::int from volunteer_applications a where a.role_id = ${roles.id} and a.status <> 'WITHDRAWN')`;
const roleSelect = {
  id: roles.id, eventId: roles.eventId, title: roles.title, description: roles.description, responsibilities: roles.responsibilities,
  skillsRequired: roles.skillsRequired, openings: roles.openings, shiftStart: roles.shiftStart, shiftEnd: roles.shiftEnd, shiftLabel: roles.shiftLabel,
  eligibility: roles.eligibility, deadline: roles.deadline, status: roles.status, acceptedCount, applicantCount,
  eventTitle: events.title, eventSlug: events.slug, eventStartAt: events.startAt, eventStatus: events.status, eventPoster: events.posterUrl,
  cityName: cities.name, citySlug: cities.slug, collegeName: colleges.name,
};
const roleFrom = () => db.select(roleSelect).from(roles).innerJoin(events, eq(events.id, roles.eventId)).innerJoin(cities, eq(cities.id, events.cityId)).leftJoin(colleges, eq(colleges.id, events.collegeId));

export function volunteerBlocker(r: { status: string; deadline: Date | null; eventStatus: string; eventStartAt: Date; acceptedCount: number; openings: number }): string | null {
  if (r.eventStatus !== "PUBLISHED") return "This event is not open";
  if (r.status !== "OPEN") return "This volunteer role is closed";
  if (r.deadline && r.deadline.getTime() < Date.now()) return "The application deadline has passed";
  if (r.eventStartAt.getTime() < Date.now()) return "This event has already started";
  if (r.acceptedCount >= r.openings) return "All volunteer spots have been filled";
  return null;
}

// ---------------------------------------------------------------- organizer
export async function createRole(actor: Actor, eventId: string, input: RoleInput) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "CANCELLED" || ev.status === "COMPLETED") throw conflict("Cannot add volunteer roles to this event");
  if (input.deadline && input.deadline > ev.startAt) throw badRequest("Deadline must be on or before the event start");
  const [row] = await db.insert(roles).values({
    eventId, title: input.title, description: input.description, responsibilities: input.responsibilities ?? null, skillsRequired: input.skillsRequired,
    openings: input.openings, shiftStart: input.shiftStart ?? null, shiftEnd: input.shiftEnd ?? null, shiftLabel: input.shiftLabel ?? null,
    eligibility: input.eligibility ?? null, deadline: input.deadline ?? null,
  }).returning();
  return row;
}

async function loadManagedRole(actor: Actor, id: string) {
  const [r] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!r) throw notFound("Volunteer role not found");
  const [ev] = await db.select().from(events).where(eq(events.id, r.eventId)).limit(1);
  if (!ev || !(await canManageEvent(actor, ev))) throw forbidden("You can only manage volunteer roles for your own events");
  return { r, ev };
}

export async function updateRole(actor: Actor, id: string, patch: RolePatch) {
  const { r, ev } = await loadManagedRole(actor, id);
  if (patch.deadline && patch.deadline > ev.startAt) throw badRequest("Deadline must be on or before the event start");
  if (patch.openings !== undefined) {
    const [{ n }] = await db.select({ n: count() }).from(vapps).where(and(eq(vapps.roleId, id), eq(vapps.status, "ACCEPTED")));
    if (patch.openings < Number(n)) throw badRequest(`Openings cannot be lower than the ${n} volunteers already accepted`);
  }
  const set: Partial<typeof roles.$inferInsert> = {};
  for (const k of ["title", "description", "skillsRequired", "openings", "status"] as const) if (patch[k] !== undefined) (set as any)[k] = patch[k];
  for (const k of ["responsibilities", "shiftStart", "shiftEnd", "shiftLabel", "eligibility", "deadline"] as const) if (patch[k] !== undefined) (set as any)[k] = patch[k] ?? null;
  if (!Object.keys(set).length) return r;
  const [row] = await db.update(roles).set(set).where(eq(roles.id, id)).returning();
  return row;
}

export async function listEventRoles(actor: Actor, eventId: string) {
  await loadManagedEvent(actor, eventId);
  return roleFrom().where(eq(roles.eventId, eventId)).orderBy(roles.title);
}

export async function listRoleApplicants(actor: Actor, roleId: string) {
  await loadManagedRole(actor, roleId);
  return db.select({
    id: vapps.id, status: vapps.status, motivation: vapps.motivation, appliedAt: vapps.appliedAt,
    userId: users.id, name: users.name, email: users.email, collegeName: colleges.name, skills: userProfiles.skills,
    assignmentId: assigns.id, shiftLabel: assigns.shiftLabel, shiftStart: assigns.shiftStart, shiftEnd: assigns.shiftEnd, completion: assigns.completion,
  }).from(vapps).innerJoin(users, eq(users.id, vapps.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .leftJoin(assigns, eq(assigns.applicationId, vapps.id))
    .where(eq(vapps.roleId, roleId)).orderBy(desc(vapps.appliedAt));
}

export async function reviewVolunteerApplication(actor: Actor, applicationId: string, input: Review) {
  const [a0] = await db.select().from(vapps).where(eq(vapps.id, applicationId)).limit(1);
  if (!a0) throw notFound("Application not found");
  const { r } = await loadManagedRole(actor, a0.roleId);
  const link = "/my/applications";

  if (input.action === "ACCEPT" || input.action === "REJECT") {
    const row = await db.transaction(async (tx) => {
      await tx.select({ id: roles.id }).from(roles).where(eq(roles.id, r.id)).for("update");
      const [a] = await tx.select().from(vapps).where(eq(vapps.id, applicationId)).limit(1);
      if (a.status === "WITHDRAWN") throw conflict("The applicant has withdrawn this application");
      const target = input.action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
      if (a.status === target) throw conflict(`Application is already ${target.toLowerCase()}`);
      if (target === "ACCEPTED") {
        const [{ n }] = await tx.select({ n: count() }).from(vapps).where(and(eq(vapps.roleId, r.id), eq(vapps.status, "ACCEPTED")));
        if (Number(n) >= r.openings) throw conflict("All openings for this role are already filled", "OPENINGS_FULL");
      } else {
        await tx.delete(assigns).where(eq(assigns.applicationId, applicationId)); // rejecting an accepted volunteer clears their shift
      }
      const [u] = await tx.update(vapps).set({ status: target }).where(eq(vapps.id, applicationId)).returning();
      return u;
    });
    notify({ userId: row.userId, type: "APPLICATION_STATUS", title: `Volunteer application ${row.status.toLowerCase()}: ${r.title}`, link });
    return { application: row };
  }

  if (input.action === "ASSIGN_SHIFT") {
    if (a0.status !== "ACCEPTED") throw conflict("Accept the volunteer before assigning a shift", "NOT_ACCEPTED");
    if (input.shiftStart && input.shiftEnd && input.shiftEnd <= input.shiftStart) throw badRequest("Shift end must be after shift start");
    const vals = { shiftLabel: input.shiftLabel, shiftStart: input.shiftStart ?? r.shiftStart, shiftEnd: input.shiftEnd ?? r.shiftEnd };
    const [asg] = await db.insert(assigns).values({ applicationId, ...vals })
      .onConflictDoUpdate({ target: assigns.applicationId, set: { ...vals, assignedAt: new Date() } }).returning();
    notify({ userId: a0.userId, type: "VOLUNTEER_ASSIGNED", title: `Shift assigned: ${r.title}`, body: `Your shift: ${input.shiftLabel}`, link });
    return { application: a0, assignment: asg };
  }

  // SET_COMPLETION
  const [asg] = await db.update(assigns).set({ completion: input.completion }).where(eq(assigns.applicationId, applicationId)).returning();
  if (!asg) throw conflict("Assign a shift before recording completion", "NO_ASSIGNMENT");
  return { application: a0, assignment: asg };
}

// ---------------------------------------------------------------- public
export async function listRoles(q: { page: number; pageSize: number; city?: string; eventId?: string; skill?: string; q?: string }) {
  const conds = [eq(events.status, "PUBLISHED"), eq(roles.status, "OPEN"), gt(events.endAt, new Date()), or(isNull(roles.deadline), gt(roles.deadline, new Date()))];
  if (q.city) conds.push(eq(cities.slug, q.city));
  if (q.eventId) conds.push(eq(roles.eventId, q.eventId));
  if (q.skill) conds.push(sql`${q.skill} = any(${roles.skillsRequired})`);
  if (q.q) { const s = `%${q.q.replace(/[%_]/g, "")}%`; conds.push(or(ilike(roles.title, s), ilike(events.title, s))!); }
  const where = and(...conds);
  const [{ total }] = await db.select({ total: count() }).from(roles).innerJoin(events, eq(events.id, roles.eventId)).innerJoin(cities, eq(cities.id, events.cityId)).where(where);
  const items = await roleFrom().where(where).orderBy(events.startAt).limit(q.pageSize).offset((q.page - 1) * q.pageSize);
  return { items, total: Number(total), page: q.page, pageSize: q.pageSize };
}

export async function getRole(id: string, viewerId?: string | null) {
  const [r] = await roleFrom().where(eq(roles.id, id)).limit(1);
  if (!r) throw notFound("Volunteer role not found");
  let application = null;
  if (viewerId) {
    const [a] = await db.select({ id: vapps.id, status: vapps.status, motivation: vapps.motivation, appliedAt: vapps.appliedAt, shiftLabel: assigns.shiftLabel, shiftStart: assigns.shiftStart, shiftEnd: assigns.shiftEnd, completion: assigns.completion })
      .from(vapps).leftJoin(assigns, eq(assigns.applicationId, vapps.id)).where(and(eq(vapps.roleId, id), eq(vapps.userId, viewerId))).limit(1);
    application = a ?? null;
  }
  if (r.eventStatus === "DRAFT" && !application) throw notFound("Volunteer role not found");
  return { ...r, applyBlocker: volunteerBlocker(r), application };
}

// ---------------------------------------------------------------- volunteer side
export async function applyForRole(userId: string, roleId: string, input: z.infer<typeof volunteerApplySchema>) {
  const r = await getRole(roleId, userId);
  if (r.application && r.application.status !== "WITHDRAWN") throw conflict("You have already applied for this role", "ALREADY_APPLIED");
  if (r.applyBlocker) throw badRequest(r.applyBlocker, { code: "CLOSED" });
  if (r.application) {
    const [row] = await db.update(vapps).set({ status: "SUBMITTED", motivation: input.motivation, appliedAt: new Date() })
      .where(and(eq(vapps.id, r.application.id), eq(vapps.status, "WITHDRAWN"))).returning();
    if (!row) throw conflict("You have already applied for this role", "ALREADY_APPLIED");
    return row;
  }
  const [row] = await db.insert(vapps).values({ roleId, userId, motivation: input.motivation }).onConflictDoNothing().returning();
  if (!row) throw conflict("You have already applied for this role", "ALREADY_APPLIED");
  return row;
}

export async function withdrawVolunteerApplication(userId: string, applicationId: string) {
  const [a] = await db.select().from(vapps).where(eq(vapps.id, applicationId)).limit(1);
  if (!a) throw notFound("Application not found");
  if (a.userId !== userId) throw forbidden("This is not your application");
  if (a.status === "WITHDRAWN" || a.status === "REJECTED") throw conflict(`A ${a.status.toLowerCase()} application cannot be withdrawn`);
  const [row] = await db.update(vapps).set({ status: "WITHDRAWN" }).where(eq(vapps.id, applicationId)).returning();
  await db.delete(assigns).where(eq(assigns.applicationId, applicationId));
  return row;
}

export async function myVolunteerApplications(userId: string) {
  return db.select({
    id: vapps.id, status: vapps.status, motivation: vapps.motivation, appliedAt: vapps.appliedAt,
    roleId: roles.id, roleTitle: roles.title, eventTitle: events.title, eventSlug: events.slug, eventStartAt: events.startAt, eventStatus: events.status,
    shiftLabel: assigns.shiftLabel, shiftStart: assigns.shiftStart, shiftEnd: assigns.shiftEnd, completion: assigns.completion,
  }).from(vapps).innerJoin(roles, eq(roles.id, vapps.roleId)).innerJoin(events, eq(events.id, roles.eventId))
    .leftJoin(assigns, eq(assigns.applicationId, vapps.id)).where(eq(vapps.userId, userId)).orderBy(desc(vapps.appliedAt));
}
