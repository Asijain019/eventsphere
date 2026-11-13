import { and, desc, eq, ilike, gt, or, isNull, sql, count } from "drizzle-orm";
import { db, events, cities, colleges, eventCategories, participationOpportunities as opps, participationApplications as apps, users, userProfiles } from "@/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";
import { loadManagedEvent, canManageEvent, type Actor } from "@/modules/organizer/access";
import { APPLICATION_TRANSITIONS, type OPPORTUNITY_TYPES } from "./schemas";
import type { z } from "zod";
import type { applySchema, createOpportunitySchema, updateOpportunitySchema } from "./schemas";

type OppInput = z.infer<typeof createOpportunitySchema>;
type OppPatch = z.infer<typeof updateOpportunitySchema>;
type Apply = z.infer<typeof applySchema>;

const acceptedCount = sql<number>`(select count(*)::int from participation_applications a where a.opportunity_id = ${opps.id} and a.status = 'ACCEPTED')`;
const totalCount = sql<number>`(select count(*)::int from participation_applications a where a.opportunity_id = ${opps.id} and a.status <> 'WITHDRAWN')`;

const oppSelect = {
  id: opps.id, eventId: opps.eventId, type: opps.type, title: opps.title, description: opps.description, eligibility: opps.eligibility,
  capacity: opps.capacity, deadline: opps.deadline, status: opps.status, createdAt: opps.createdAt,
  acceptedCount, applicantCount: totalCount,
  eventTitle: events.title, eventSlug: events.slug, eventStartAt: events.startAt, eventStatus: events.status, eventPoster: events.posterUrl,
  cityName: cities.name, citySlug: cities.slug, collegeName: colleges.name, categorySlug: eventCategories.slug,
};
const oppFrom = () => db.select(oppSelect).from(opps)
  .innerJoin(events, eq(events.id, opps.eventId)).innerJoin(cities, eq(cities.id, events.cityId))
  .innerJoin(eventCategories, eq(eventCategories.id, events.categoryId)).leftJoin(colleges, eq(colleges.id, events.collegeId));

/** Why can't one apply right now? null = can apply. */
export function applyBlocker(o: { status: string; deadline: Date | null; eventStatus: string; eventStartAt: Date; acceptedCount: number; capacity: number }): string | null {
  if (o.eventStatus !== "PUBLISHED") return "This event is not open";
  if (o.status !== "OPEN") return "Applications for this opportunity are closed";
  if (o.deadline && o.deadline.getTime() < Date.now()) return "The application deadline has passed";
  if (o.eventStartAt.getTime() < Date.now()) return "This event has already started";
  if (o.acceptedCount >= o.capacity) return "All spots have been filled";
  return null;
}

// ---------------------------------------------------------------- organizer side
export async function createOpportunity(actor: Actor, eventId: string, input: OppInput) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "CANCELLED" || ev.status === "COMPLETED") throw conflict("Cannot add opportunities to this event");
  if (input.deadline && input.deadline > ev.startAt) throw badRequest("Deadline must be on or before the event start");
  const [row] = await db.insert(opps).values({ eventId, type: input.type, title: input.title, description: input.description, eligibility: input.eligibility ?? null, capacity: input.capacity, deadline: input.deadline ?? null }).returning();
  return row;
}

async function loadManagedOpp(actor: Actor, id: string) {
  const [o] = await db.select().from(opps).where(eq(opps.id, id)).limit(1);
  if (!o) throw notFound("Opportunity not found");
  const [ev] = await db.select().from(events).where(eq(events.id, o.eventId)).limit(1);
  if (!ev || !(await canManageEvent(actor, ev))) throw forbidden("You can only manage opportunities for your own events");
  return { o, ev };
}

export async function updateOpportunity(actor: Actor, id: string, patch: OppPatch) {
  const { o, ev } = await loadManagedOpp(actor, id);
  if (patch.deadline && patch.deadline > ev.startAt) throw badRequest("Deadline must be on or before the event start");
  const set: Partial<typeof opps.$inferInsert> = {};
  for (const k of ["type", "title", "description", "capacity", "status"] as const) if (patch[k] !== undefined) (set as any)[k] = patch[k];
  if (patch.eligibility !== undefined) set.eligibility = patch.eligibility ?? null;
  if (patch.deadline !== undefined) set.deadline = patch.deadline ?? null;
  if (!Object.keys(set).length) return o;
  const [row] = await db.update(opps).set(set).where(eq(opps.id, id)).returning();
  return row;
}

export async function listEventOpportunities(actor: Actor, eventId: string) {
  await loadManagedEvent(actor, eventId);
  return db.select(oppSelect).from(opps)
    .innerJoin(events, eq(events.id, opps.eventId)).innerJoin(cities, eq(cities.id, events.cityId))
    .innerJoin(eventCategories, eq(eventCategories.id, events.categoryId)).leftJoin(colleges, eq(colleges.id, events.collegeId))
    .where(eq(opps.eventId, eventId)).orderBy(desc(opps.createdAt));
}

export async function listApplicants(actor: Actor, opportunityId: string) {
  await loadManagedOpp(actor, opportunityId);
  return db.select({
    id: apps.id, status: apps.status, pitch: apps.pitch, portfolioUrl: apps.portfolioUrl, reviewNote: apps.reviewNote, submittedAt: apps.submittedAt, updatedAt: apps.updatedAt,
    userId: users.id, name: users.name, email: users.email, collegeName: colleges.name, skills: userProfiles.skills,
  }).from(apps).innerJoin(users, eq(users.id, apps.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .where(eq(apps.opportunityId, opportunityId)).orderBy(desc(apps.submittedAt));
}

export async function updateApplicationStatus(actor: Actor, applicationId: string, status: string, reviewNote?: string | null) {
  const [a0] = await db.select().from(apps).where(eq(apps.id, applicationId)).limit(1);
  if (!a0) throw notFound("Application not found");
  const { o } = await loadManagedOpp(actor, a0.opportunityId);
  const updated = await db.transaction(async (tx) => {
    // lock the opportunity row so concurrent acceptances cannot exceed capacity
    await tx.select({ id: opps.id }).from(opps).where(eq(opps.id, o.id)).for("update");
    const [a] = await tx.select().from(apps).where(eq(apps.id, applicationId)).limit(1);
    if (a.status === "WITHDRAWN") throw conflict("The applicant has withdrawn this application");
    if (!(APPLICATION_TRANSITIONS[a.status] ?? []).includes(status))
      throw conflict(`Cannot move an application from ${a.status} to ${status}`, "ILLEGAL_TRANSITION");
    if (status === "ACCEPTED") {
      const [{ n }] = await tx.select({ n: count() }).from(apps).where(and(eq(apps.opportunityId, o.id), eq(apps.status, "ACCEPTED")));
      if (Number(n) >= o.capacity) throw conflict("All spots for this opportunity are already filled", "CAPACITY_FULL");
    }
    const [row] = await tx.update(apps).set({ status: status as any, reviewNote: reviewNote ?? a.reviewNote, updatedAt: new Date() }).where(eq(apps.id, applicationId)).returning();
    return row;
  });
  notify({
    userId: updated.userId, type: "APPLICATION_STATUS", title: `Application ${status.replace("_", " ").toLowerCase()}: ${o.title}`,
    body: reviewNote?.trim() || undefined, link: "/my/applications",
  });
  return updated;
}

// ---------------------------------------------------------------- public
export async function listOpportunities(q: { page: number; pageSize: number; type?: string; city?: string; eventId?: string; q?: string }) {
  const conds = [
    eq(events.status, "PUBLISHED"), eq(opps.status, "OPEN"), gt(events.endAt, new Date()),
    or(isNull(opps.deadline), gt(opps.deadline, new Date())),
  ];
  if (q.type) conds.push(eq(opps.type, q.type as (typeof OPPORTUNITY_TYPES)[number]));
  if (q.city) conds.push(eq(cities.slug, q.city));
  if (q.eventId) conds.push(eq(opps.eventId, q.eventId));
  if (q.q) conds.push(or(ilike(opps.title, `%${q.q.replace(/[%_]/g, "")}%`), ilike(events.title, `%${q.q.replace(/[%_]/g, "")}%`))!);
  const where = and(...conds);
  const [{ total }] = await db.select({ total: count() }).from(opps).innerJoin(events, eq(events.id, opps.eventId)).innerJoin(cities, eq(cities.id, events.cityId)).where(where);
  const items = await oppFrom().where(where).orderBy(events.startAt).limit(q.pageSize).offset((q.page - 1) * q.pageSize);
  return { items, total: Number(total), page: q.page, pageSize: q.pageSize };
}

export async function getOpportunity(id: string, viewerId?: string | null) {
  const [o] = await oppFrom().where(eq(opps.id, id)).limit(1);
  if (!o) throw notFound("Opportunity not found");
  let application = null;
  if (viewerId) {
    const [a] = await db.select().from(apps).where(and(eq(apps.opportunityId, id), eq(apps.userId, viewerId))).limit(1);
    application = a ?? null;
  }
  if (o.eventStatus === "DRAFT" && !application) throw notFound("Opportunity not found");
  return { ...o, applyBlocker: applyBlocker(o), application };
}

// ---------------------------------------------------------------- applicant side
export async function applyToOpportunity(userId: string, opportunityId: string, input: Apply) {
  const o = await getOpportunity(opportunityId, userId);
  if (o.application && o.application.status !== "WITHDRAWN") throw conflict("You have already applied to this opportunity", "ALREADY_APPLIED");
  if (o.applyBlocker) throw badRequest(o.applyBlocker, { code: "CLOSED" });
  return db.transaction(async (tx) => {
    await tx.select({ id: opps.id }).from(opps).where(eq(opps.id, opportunityId)).for("update");
    if (o.application) { // re-apply after withdrawing
      const [row] = await tx.update(apps).set({ status: "SUBMITTED", pitch: input.pitch, portfolioUrl: input.portfolioUrl ?? null, reviewNote: null, submittedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(apps.id, o.application.id), eq(apps.status, "WITHDRAWN"))).returning();
      if (!row) throw conflict("You have already applied to this opportunity", "ALREADY_APPLIED");
      return row;
    }
    const [row] = await tx.insert(apps).values({ opportunityId, userId, pitch: input.pitch, portfolioUrl: input.portfolioUrl ?? null }).onConflictDoNothing().returning();
    if (!row) throw conflict("You have already applied to this opportunity", "ALREADY_APPLIED");
    return row;
  });
}

export async function withdrawApplication(userId: string, applicationId: string) {
  const [a] = await db.select().from(apps).where(eq(apps.id, applicationId)).limit(1);
  if (!a) throw notFound("Application not found");
  if (a.userId !== userId) throw forbidden("This is not your application");
  if (a.status === "WITHDRAWN" || a.status === "REJECTED") throw conflict(`A ${a.status.toLowerCase()} application cannot be withdrawn`);
  const [row] = await db.update(apps).set({ status: "WITHDRAWN", updatedAt: new Date() }).where(eq(apps.id, applicationId)).returning();
  return row;
}

export async function myApplications(userId: string) {
  return db.select({
    id: apps.id, status: apps.status, pitch: apps.pitch, portfolioUrl: apps.portfolioUrl, reviewNote: apps.reviewNote, submittedAt: apps.submittedAt, updatedAt: apps.updatedAt,
    opportunityId: opps.id, opportunityTitle: opps.title, type: opps.type, eventTitle: events.title, eventSlug: events.slug, eventStartAt: events.startAt, eventStatus: events.status,
  }).from(apps).innerJoin(opps, eq(opps.id, apps.opportunityId)).innerJoin(events, eq(events.id, opps.eventId))
    .where(eq(apps.userId, userId)).orderBy(desc(apps.submittedAt));
}
