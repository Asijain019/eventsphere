import { and, desc, eq, ilike, or, sql, count, inArray } from "drizzle-orm";
import {
  db, events, eventMedia, venues, cities, colleges, eventCategories, registrations, eventCheckIns, users, userProfiles, favourites,
  announcements, communities, communityPosts, participationOpportunities, participationApplications, volunteerRoles, volunteerApplications,
} from "@/db";
import { badRequest, conflict, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";
import { slugify } from "@/lib/utils";
import { loadManagedEvent, type Actor } from "./access";
import { eventInvariantProblems, type CreateEventInput, type UpdateEventInput } from "./schemas";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type VenueInput = NonNullable<CreateEventInput["venue"]>;

async function uniqueSlug(title: string, tx: Pick<typeof db, "select"> = db) {
  const base = slugify(title) || "event";
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const [hit] = await tx.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
    if (!hit) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Reuse an existing venue row (same name+address+city) or create one. */
async function resolveVenue(tx: Tx, v: VenueInput, cityId: string): Promise<string> {
  const [hit] = await tx.select({ id: venues.id }).from(venues)
    .where(and(eq(venues.cityId, cityId), eq(venues.name, v.name), eq(venues.address, v.address))).limit(1);
  if (hit) return hit.id;
  const [row] = await tx.insert(venues).values({ name: v.name, address: v.address, locality: v.locality ?? null, cityId, latitude: v.lat ?? null, longitude: v.lng ?? null }).returning({ id: venues.id });
  return row.id;
}

async function assertRefs(cityId?: string, categoryId?: string, collegeId?: string | null) {
  if (cityId) { const [c] = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, cityId)).limit(1); if (!c) throw badRequest("Unknown city"); }
  if (categoryId) { const [c] = await db.select({ id: eventCategories.id }).from(eventCategories).where(eq(eventCategories.id, categoryId)).limit(1); if (!c) throw badRequest("Unknown category"); }
  if (collegeId) { const [c] = await db.select({ id: colleges.id }).from(colleges).where(eq(colleges.id, collegeId)).limit(1); if (!c) throw badRequest("Unknown college"); }
}

export async function formOptions() {
  const [c, k, cat] = await Promise.all([
    db.select({ id: cities.id, name: cities.name, slug: cities.slug }).from(cities).orderBy(cities.name),
    db.select({ id: colleges.id, name: colleges.name, cityId: colleges.cityId }).from(colleges).orderBy(colleges.name),
    db.select({ id: eventCategories.id, name: eventCategories.name, slug: eventCategories.slug }).from(eventCategories).orderBy(eventCategories.name),
  ]);
  return { cities: c, colleges: k, categories: cat };
}

// ---------------------------------------------------------------- create / update
export async function createEvent(actor: Actor, input: CreateEventInput) {
  await assertRefs(input.cityId, input.categoryId, input.collegeId);
  return db.transaction(async (tx) => {
    const venueId = input.venue ? await resolveVenue(tx, input.venue, input.cityId) : null;
    const slug = await uniqueSlug(input.title, tx);
    const [ev] = await tx.insert(events).values({
      slug, title: input.title, description: input.description, organizerId: actor.id, collegeId: input.collegeId ?? null,
      categoryId: input.categoryId, cityId: input.cityId, venueId, mode: input.mode,
      startAt: input.startAt, endAt: input.endAt, registrationDeadline: input.registrationDeadline ?? null,
      capacity: input.capacity, feePaise: input.feePaise, eligibility: input.eligibility ?? null, posterUrl: input.posterUrl ?? null,
      schedule: input.schedule, tags: input.tags, teamsEnabled: input.teamsEnabled, minTeamSize: input.minTeamSize, maxTeamSize: input.maxTeamSize,
      status: "DRAFT",
    }).returning();
    if (input.gallery.length) await tx.insert(eventMedia).values(input.gallery.map((url, order) => ({ eventId: ev.id, url, order })));
    return ev;
  });
}

export async function updateEvent(actor: Actor, eventId: string, patch: UpdateEventInput) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "CANCELLED" || ev.status === "COMPLETED") throw conflict(`A ${ev.status.toLowerCase()} event can no longer be edited`);
  const merged = {
    startAt: patch.startAt ?? ev.startAt, endAt: patch.endAt ?? ev.endAt,
    registrationDeadline: patch.registrationDeadline === undefined ? ev.registrationDeadline : patch.registrationDeadline,
    minTeamSize: patch.minTeamSize ?? ev.minTeamSize, maxTeamSize: patch.maxTeamSize ?? ev.maxTeamSize,
  };
  const problems = eventInvariantProblems(merged);
  if (problems.length) throw badRequest(problems[0], { problems });
  if (patch.capacity !== undefined && patch.capacity < ev.confirmedCount)
    throw badRequest(`Capacity cannot be lower than the ${ev.confirmedCount} confirmed registrations`);
  await assertRefs(patch.cityId, patch.categoryId, patch.collegeId);

  const cityId = patch.cityId ?? ev.cityId;
  const updated = await db.transaction(async (tx) => {
    let venueId = ev.venueId;
    if (patch.venue === null) venueId = null;
    else if (patch.venue) venueId = await resolveVenue(tx, patch.venue, cityId);
    const set: Partial<typeof events.$inferInsert> = { updatedAt: new Date(), venueId };
    const keys = ["title", "description", "categoryId", "cityId", "mode", "startAt", "endAt", "capacity", "feePaise", "schedule", "tags", "teamsEnabled", "minTeamSize", "maxTeamSize"] as const;
    for (const k of keys) if (patch[k] !== undefined) (set as any)[k] = patch[k];
    for (const k of ["registrationDeadline", "eligibility", "posterUrl", "collegeId"] as const) if (patch[k] !== undefined) (set as any)[k] = patch[k] ?? null;
    // capacity guard is enforced in the WHERE clause too, so a concurrent registration cannot slip below it
    const where = patch.capacity !== undefined
      ? and(eq(events.id, eventId), sql`${events.confirmedCount} <= ${patch.capacity}`)
      : eq(events.id, eventId);
    const [row] = await tx.update(events).set(set).where(where).returning();
    if (!row) throw conflict("New registrations arrived; capacity cannot go below the confirmed count");
    if (patch.gallery) {
      await tx.delete(eventMedia).where(eq(eventMedia.eventId, eventId));
      if (patch.gallery.length) await tx.insert(eventMedia).values(patch.gallery.map((url, order) => ({ eventId, url, order })));
    }
    return row;
  });

  if (ev.status === "PUBLISHED") {
    const changes: string[] = [];
    if (updated.startAt.getTime() !== ev.startAt.getTime() || updated.endAt.getTime() !== ev.endAt.getTime()) changes.push("date/time");
    if (updated.venueId !== ev.venueId || updated.mode !== ev.mode) changes.push("venue");
    if ((updated.registrationDeadline?.getTime() ?? null) !== (ev.registrationDeadline?.getTime() ?? null)) changes.push("registration deadline");
    if (changes.length) await notifyRegistrants(eventId, ["CONFIRMED"], { type: "EVENT_UPDATED", title: `Update: ${updated.title}`, body: `The ${changes.join(" and ")} for this event changed. Please review the latest details.`, link: `/events/${updated.slug}` });
  }
  return updated;
}

async function notifyRegistrants(eventId: string, statuses: ("CONFIRMED" | "WAITLISTED")[], n: { type: "EVENT_UPDATED" | "EVENT_CANCELLED" | "ANNOUNCEMENT"; title: string; body?: string; link?: string }) {
  const rows = await db.select({ userId: registrations.userId }).from(registrations).where(and(eq(registrations.eventId, eventId), inArray(registrations.status, statuses)));
  if (rows.length) notify(rows.map((r) => ({ userId: r.userId, ...n })));
  return rows.length;
}

// ---------------------------------------------------------------- publish / cancel
export async function publishEvent(actor: Actor, eventId: string) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "PUBLISHED") return ev;
  if (ev.status !== "DRAFT") throw conflict(`A ${ev.status.toLowerCase()} event cannot be published`);
  const problems: string[] = [];
  if (ev.title.trim().length < 3) problems.push("Add a title");
  if (ev.description.trim().length < 20) problems.push("Add a description of at least 20 characters");
  if (ev.startAt.getTime() <= Date.now()) problems.push("Start date must be in the future");
  if (ev.mode !== "ONLINE" && !ev.venueId) problems.push("Add a venue for offline/hybrid events");
  if (ev.capacity < 1) problems.push("Capacity must be at least 1");
  problems.push(...eventInvariantProblems(ev));
  if (problems.length) throw badRequest("This event is not ready to publish", { problems });
  const [row] = await db.update(events).set({ status: "PUBLISHED", updatedAt: new Date() }).where(eq(events.id, eventId)).returning();
  return row;
}

export async function unpublishEvent(actor: Actor, eventId: string) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "DRAFT") return ev;
  if (ev.status !== "PUBLISHED") throw conflict(`A ${ev.status.toLowerCase()} event cannot be unpublished`);
  if (ev.confirmedCount > 0) throw conflict("This event already has registrations. Cancel it instead of unpublishing.");
  const [row] = await db.update(events).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(events.id, eventId)).returning();
  return row;
}

export async function cancelEvent(actor: Actor, eventId: string, reason?: string) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "CANCELLED") throw conflict("This event is already cancelled");
  if (ev.status === "COMPLETED") throw conflict("A completed event cannot be cancelled");
  const [row] = await db.update(events).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(events.id, eventId)).returning();
  await notifyRegistrants(eventId, ["CONFIRMED", "WAITLISTED"], {
    type: "EVENT_CANCELLED", title: `Cancelled: ${ev.title}`, body: reason?.trim() || "The organizer has cancelled this event.", link: `/events/${ev.slug}`,
  });
  return row;
}

// ---------------------------------------------------------------- reads
export async function listMyEvents(actor: Actor, q: { page: number; pageSize: number; status?: string; q?: string }) {
  const conds = [actor.role === "PLATFORM_ADMIN" ? undefined : eq(events.organizerId, actor.id)];
  if (q.status) conds.push(eq(events.status, q.status as any));
  if (q.q) conds.push(ilike(events.title, `%${q.q.replace(/[%_]/g, "")}%`));
  const where = and(...conds);
  const [{ total }] = await db.select({ total: count() }).from(events).where(where);
  const rows = await db.select({
    id: events.id, slug: events.slug, title: events.title, status: events.status, posterUrl: events.posterUrl,
    startAt: events.startAt, endAt: events.endAt, capacity: events.capacity, confirmedCount: events.confirmedCount, feePaise: events.feePaise,
    categoryName: eventCategories.name, categorySlug: eventCategories.slug, categoryColor: eventCategories.color, cityName: cities.name,
    checkIns: sql<number>`(select count(*)::int from event_check_ins c where c.event_id = ${events.id})`,
    applications: sql<number>`(select count(*)::int from participation_applications pa join participation_opportunities po on po.id = pa.opportunity_id where po.event_id = ${events.id})`,
    volunteerApplications: sql<number>`(select count(*)::int from volunteer_applications va join volunteer_roles vr on vr.id = va.role_id where vr.event_id = ${events.id})`,
  }).from(events)
    .innerJoin(eventCategories, eq(eventCategories.id, events.categoryId))
    .innerJoin(cities, eq(cities.id, events.cityId))
    .where(where).orderBy(desc(events.startAt)).limit(q.pageSize).offset((q.page - 1) * q.pageSize);
  return { items: rows, total: Number(total), page: q.page, pageSize: q.pageSize };
}

export async function getManagedEvent(actor: Actor, eventId: string) {
  const ev = await loadManagedEvent(actor, eventId);
  const [[cat], [city], venue, media, comm] = await Promise.all([
    db.select({ id: eventCategories.id, name: eventCategories.name, slug: eventCategories.slug, color: eventCategories.color }).from(eventCategories).where(eq(eventCategories.id, ev.categoryId)).limit(1),
    db.select({ id: cities.id, name: cities.name, slug: cities.slug }).from(cities).where(eq(cities.id, ev.cityId)).limit(1),
    ev.venueId ? db.select().from(venues).where(eq(venues.id, ev.venueId)).limit(1) : Promise.resolve([]),
    db.select({ url: eventMedia.url }).from(eventMedia).where(eq(eventMedia.eventId, eventId)).orderBy(eventMedia.order),
    db.select({ slug: communities.slug, id: communities.id }).from(communities).where(eq(communities.eventId, eventId)).limit(1),
  ]);
  const v = venue[0];
  return {
    ...ev, category: cat ?? null, city: city ?? null,
    venue: v ? { id: v.id, name: v.name, address: v.address, locality: v.locality, lat: v.latitude, lng: v.longitude } : null,
    gallery: media.map((m) => m.url), communitySlug: comm[0]?.slug ?? null,
  };
}

function csvCell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function listRegistrations(actor: Actor, eventId: string, q: { page: number; pageSize: number; q?: string; status?: string }, all = false) {
  await loadManagedEvent(actor, eventId);
  const conds = [eq(registrations.eventId, eventId)];
  if (q.status) conds.push(eq(registrations.status, q.status as any));
  if (q.q) { const s = `%${q.q.replace(/[%_]/g, "")}%`; conds.push(or(ilike(users.name, s), ilike(users.email, s), ilike(registrations.ticketReference, s))!); }
  const where = and(...conds);
  const [{ total }] = await db.select({ total: count() }).from(registrations).innerJoin(users, eq(users.id, registrations.userId)).where(where);
  let query = db.select({
    id: registrations.id, ticketReference: registrations.ticketReference, status: registrations.status, type: registrations.type, registeredAt: registrations.registeredAt,
    userId: users.id, name: users.name, email: users.email, collegeName: colleges.name, checkedInAt: eventCheckIns.checkedInAt,
  }).from(registrations)
    .innerJoin(users, eq(users.id, registrations.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .leftJoin(eventCheckIns, eq(eventCheckIns.registrationId, registrations.id))
    .where(where).orderBy(desc(registrations.registeredAt)).$dynamic();
  if (!all) query = query.limit(q.pageSize).offset((q.page - 1) * q.pageSize);
  const rows = await query;
  return { items: rows, total: Number(total), page: q.page, pageSize: q.pageSize };
}

export async function registrationsCsv(actor: Actor, eventId: string) {
  const { items } = await listRegistrations(actor, eventId, { page: 1, pageSize: 1 }, true);
  const head = ["Ticket", "Name", "Email", "College", "Status", "Type", "Registered at", "Checked in at"];
  const lines = items.map((r) => [r.ticketReference, r.name, r.email, r.collegeName, r.status, r.type, r.registeredAt.toISOString(), r.checkedInAt?.toISOString() ?? ""].map(csvCell).join(","));
  return [head.join(","), ...lines].join("\r\n") + "\r\n";
}

export async function eventAnalytics(actor: Actor, eventId: string) {
  const ev = await loadManagedEvent(actor, eventId);
  const regs = await db.select({ status: registrations.status, at: registrations.registeredAt }).from(registrations).where(eq(registrations.eventId, eventId));
  const confirmed = regs.filter((r) => r.status === "CONFIRMED");
  const day = (d: Date) => new Date(d.getTime() + 19800000).toISOString().slice(0, 10); // IST day
  const perDay = new Map<string, number>();
  for (const r of confirmed) perDay.set(day(r.at), (perDay.get(day(r.at)) ?? 0) + 1);
  const series: { date: string; count: number }[] = [];
  if (perDay.size) {
    const keys = [...perDay.keys()].sort();
    const end = new Date(Math.max(Date.parse(keys[keys.length - 1]), Math.min(Date.now(), ev.startAt.getTime())));
    let cur = new Date(keys[0]);
    for (let i = 0; i < 90 && cur <= end; i++, cur = new Date(cur.getTime() + 864e5)) { const k = cur.toISOString().slice(0, 10); series.push({ date: k, count: perDay.get(k) ?? 0 }); }
  }
  const [[ci], [fav], appRows, volRows, [opps], [roles]] = await Promise.all([
    db.select({ n: count() }).from(eventCheckIns).where(eq(eventCheckIns.eventId, eventId)),
    db.select({ n: count() }).from(favourites).where(eq(favourites.eventId, eventId)),
    db.select({ status: participationApplications.status, n: count() }).from(participationApplications)
      .innerJoin(participationOpportunities, eq(participationOpportunities.id, participationApplications.opportunityId))
      .where(eq(participationOpportunities.eventId, eventId)).groupBy(participationApplications.status),
    db.select({ status: volunteerApplications.status, n: count() }).from(volunteerApplications)
      .innerJoin(volunteerRoles, eq(volunteerRoles.id, volunteerApplications.roleId))
      .where(eq(volunteerRoles.eventId, eventId)).groupBy(volunteerApplications.status),
    db.select({ n: count() }).from(participationOpportunities).where(eq(participationOpportunities.eventId, eventId)),
    db.select({ n: count(), openings: sql<number>`coalesce(sum(${volunteerRoles.openings}),0)::int` }).from(volunteerRoles).where(eq(volunteerRoles.eventId, eventId)),
  ]);
  const toMap = (rows: { status: string; n: number }[]) => Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  const appBy = toMap(appRows), volBy = toMap(volRows);
  const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
  return {
    capacity: ev.capacity, confirmed: confirmed.length, waitlisted: regs.filter((r) => r.status === "WAITLISTED").length, cancelled: regs.filter((r) => r.status === "CANCELLED").length,
    fillRate: ev.capacity ? Math.round((ev.confirmedCount / ev.capacity) * 100) : 0,
    checkIns: Number(ci.n), checkInRate: confirmed.length ? Math.round((Number(ci.n) / confirmed.length) * 100) : 0,
    registrationsByDay: series, favourites: Number(fav.n),
    participation: { opportunities: Number(opps.n), total: sum(appBy), byStatus: appBy },
    volunteers: { roles: Number(roles.n), openings: Number(roles.openings), total: sum(volBy), accepted: volBy.ACCEPTED ?? 0, byStatus: volBy },
  };
}

// ---------------------------------------------------------------- check-in
export async function checkIn(actor: Actor, eventId: string, ticketReference: string) {
  const ev = await loadManagedEvent(actor, eventId);
  if (ev.status === "CANCELLED") throw conflict("This event is cancelled");
  const ref = ticketReference.trim().toUpperCase();
  const [reg] = await db.select({ id: registrations.id, status: registrations.status, name: users.name, userId: users.id })
    .from(registrations).innerJoin(users, eq(users.id, registrations.userId))
    .where(and(eq(registrations.eventId, eventId), eq(registrations.ticketReference, ref))).limit(1);
  if (!reg) throw notFound("No registration with that ticket code for this event");
  if (reg.status !== "CONFIRMED") throw conflict(`Registration is ${reg.status.toLowerCase()}; cannot check in`, "NOT_CONFIRMED");
  const [row] = await db.insert(eventCheckIns).values({ registrationId: reg.id, eventId, checkedInById: actor.id }).onConflictDoNothing().returning();
  if (!row) throw conflict(`${reg.name} has already been checked in`, "ALREADY_CHECKED_IN");
  return { ticketReference: ref, name: reg.name, userId: reg.userId, checkedInAt: row.checkedInAt };
}

// ---------------------------------------------------------------- announcements
export async function publishAnnouncement(actor: Actor, eventId: string, input: { title: string; body: string }) {
  const ev = await loadManagedEvent(actor, eventId);
  const [a] = await db.insert(announcements).values({ eventId, authorId: actor.id, title: input.title, body: input.body }).returning();
  const notified = await notifyRegistrants(eventId, ["CONFIRMED"], { type: "ANNOUNCEMENT", title: `${ev.title}: ${input.title}`, body: input.body.slice(0, 200), link: `/events/${ev.slug}` });
  const comms = await db.select({ id: communities.id }).from(communities).where(eq(communities.eventId, eventId));
  for (const c of comms) await db.insert(communityPosts).values({ communityId: c.id, authorId: actor.id, title: input.title, body: input.body, isAnnouncement: true });
  return { announcement: a, notified, communityPosts: comms.length };
}

export async function listAnnouncements(actor: Actor, eventId: string) {
  await loadManagedEvent(actor, eventId);
  return db.select().from(announcements).where(eq(announcements.eventId, eventId)).orderBy(desc(announcements.createdAt));
}

// ---------------------------------------------------------------- role self-serve (MVP)
/** MVP: self-serve upgrade to ORGANIZER in lieu of a verification workflow. Admin roles are never changed. */
export async function becomeOrganizer(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) throw notFound("User not found");
  if (u.role === "STUDENT" || u.role === "GENERAL") await db.update(users).set({ role: "ORGANIZER", updatedAt: new Date() }).where(eq(users.id, userId));
  return { role: u.role === "STUDENT" || u.role === "GENERAL" ? "ORGANIZER" : u.role };
}
