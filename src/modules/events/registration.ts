import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db, events, favourites, registrations, teams, teamMembers, users, eventCategories, venues, cities, colleges,
} from "@/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";
import { ticketRef, formatDate } from "@/lib/utils";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lockEvent(tx: Tx, eventId: string) {
  const [ev] = await tx.select().from(events).where(eq(events.id, eventId)).for("update");
  if (!ev) throw notFound("Event not found");
  return ev;
}

function assertOpen(ev: typeof events.$inferSelect) {
  const now = Date.now();
  if (ev.status !== "PUBLISHED") throw conflict(ev.status === "CANCELLED" ? "This event has been cancelled" : "Registration is not open for this event", "REGISTRATION_CLOSED");
  if (ev.startAt.getTime() <= now) throw conflict("This event has already started", "EVENT_STARTED");
  if (ev.registrationDeadline && ev.registrationDeadline.getTime() < now) throw conflict("The registration deadline has passed", "REGISTRATION_CLOSED");
}

async function uniqueTicket(tx: Tx) {
  for (let i = 0; i < 8; i++) {
    const ref = ticketRef();
    const [hit] = await tx.select({ id: registrations.id }).from(registrations).where(eq(registrations.ticketReference, ref)).limit(1);
    if (!hit) return ref;
  }
  return `ES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

/** Create (or re-activate a cancelled) registration. Caller must hold the event row lock and have checked capacity. */
async function upsertRegistration(tx: Tx, eventId: string, userId: string, type: "ATTENDEE" | "TEAM", teamId: string | null) {
  const [existing] = await tx.select().from(registrations).where(and(eq(registrations.eventId, eventId), eq(registrations.userId, userId))).limit(1);
  if (existing && existing.status !== "CANCELLED") throw conflict("You are already registered for this event", "ALREADY_REGISTERED");
  const ticketReference = await uniqueTicket(tx);
  if (existing) {
    const [r] = await tx.update(registrations).set({ status: "CONFIRMED", type, teamId, ticketReference, registeredAt: new Date() }).where(eq(registrations.id, existing.id)).returning();
    return r;
  }
  const [r] = await tx.insert(registrations).values({ eventId, userId, type, teamId, ticketReference }).returning();
  return r;
}

export async function registerForEvent(userId: string, eventId: string, input: { type?: "ATTENDEE" | "TEAM"; teamId?: string } = {}) {
  const type = input.type ?? "ATTENDEE";
  if (type === "TEAM") {
    if (!input.teamId) throw badRequest("teamId is required for team registration");
    return registerTeam(userId, input.teamId, eventId);
  }
  const result = await db.transaction(async (tx) => {
    const ev = await lockEvent(tx, eventId); // serialises concurrent registrations for this event
    assertOpen(ev);
    // duplicate check first so a duplicate on a full event reports ALREADY_REGISTERED
    const [dup] = await tx.select({ id: registrations.id }).from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.userId, userId), inArray(registrations.status, ["CONFIRMED", "WAITLISTED"]))).limit(1);
    if (dup) throw conflict("You are already registered for this event", "ALREADY_REGISTERED");
    if (ev.confirmedCount >= ev.capacity) throw conflict("Sorry, this event is full", "EVENT_FULL");
    const reg = await upsertRegistration(tx, eventId, userId, "ATTENDEE", null);
    await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} + 1`, updatedAt: new Date() }).where(eq(events.id, eventId));
    return { reg, ev };
  });
  notify({
    userId, type: "REGISTRATION_CONFIRMED", title: `You're in! ${result.ev.title}`,
    body: `Ticket ${result.reg.ticketReference} · ${formatDate(result.ev.startAt, { day: "numeric", month: "short", year: "numeric" })}`, link: "/my/registrations",
  });
  return { registration: result.reg, seatsLeft: Math.max(0, result.ev.capacity - result.ev.confirmedCount - 1) };
}

/** Captain registers their whole team. All accepted members get a TEAM registration. */
export async function registerTeam(captainId: string, teamId: string, expectedEventId?: string) {
  const [pre] = await db.select({ eventId: teams.eventId }).from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!pre) throw notFound("Team not found");
  const result = await db.transaction(async (tx) => {
    const ev = await lockEvent(tx, pre.eventId);
    const [team] = await tx.select().from(teams).where(eq(teams.id, teamId)).for("update");
    if (!team) throw notFound("Team not found");
    if (expectedEventId && team.eventId !== expectedEventId) throw badRequest("This team does not belong to the requested event");
    if (team.captainId !== captainId) throw forbidden("Only the team captain can register the team");
    if (!ev.teamsEnabled) throw badRequest("This event does not use teams");
    if (team.status === "REGISTERED") throw conflict("This team is already registered", "ALREADY_REGISTERED");
    if (team.status === "DISBANDED") throw conflict("This team was disbanded");
    assertOpen(ev);
    const members = await tx.select({ userId: teamMembers.userId, name: users.name }).from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.userId)).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "ACCEPTED")));
    if (members.length < ev.minTeamSize) throw conflict(`Teams need at least ${ev.minTeamSize} member${ev.minTeamSize > 1 ? "s" : ""} (you have ${members.length})`, "TEAM_TOO_SMALL");
    if (members.length > ev.maxTeamSize) throw conflict(`Teams can have at most ${ev.maxTeamSize} members`, "TEAM_TOO_LARGE");
    const ids = members.map((m) => m.userId);
    const existing = await tx.select({ userId: registrations.userId }).from(registrations)
      .where(and(eq(registrations.eventId, ev.id), inArray(registrations.userId, ids), inArray(registrations.status, ["CONFIRMED", "WAITLISTED"])));
    if (existing.length) {
      const names = members.filter((m) => existing.some((x) => x.userId === m.userId)).map((m) => m.name).join(", ");
      throw conflict(`Already registered for this event: ${names}`, "MEMBER_ALREADY_REGISTERED");
    }
    if (ev.confirmedCount + members.length > ev.capacity) throw conflict("Not enough seats left for the whole team", "EVENT_FULL");
    const regs = [];
    for (const m of members) regs.push(await upsertRegistration(tx, ev.id, m.userId, "TEAM", teamId));
    await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} + ${members.length}`, updatedAt: new Date() }).where(eq(events.id, ev.id));
    await tx.update(teams).set({ status: "REGISTERED" }).where(eq(teams.id, teamId));
    return { regs, ev, team };
  });
  notify(result.regs.map((r) => ({
    userId: r.userId, type: "REGISTRATION_CONFIRMED" as const, title: `Team registered: ${result.ev.title}`,
    body: `Team ${result.team.name} · Ticket ${r.ticketReference}`, link: "/my/registrations",
  })));
  const mine = result.regs.find((r) => r.userId === captainId)!;
  return { registration: mine, registrations: result.regs.length, seatsLeft: Math.max(0, result.ev.capacity - result.ev.confirmedCount - result.regs.length) };
}

export async function cancelRegistration(userId: string, registrationId: string) {
  await db.transaction(async (tx) => {
    const [reg] = await tx.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1);
    if (!reg) throw notFound("Registration not found");
    if (reg.userId !== userId) throw forbidden("You can only cancel your own registration");
    const ev = await lockEvent(tx, reg.eventId);
    const [fresh] = await tx.select().from(registrations).where(eq(registrations.id, registrationId)).for("update");
    if (fresh.status === "CANCELLED") throw conflict("Registration is already cancelled", "ALREADY_CANCELLED");
    if (ev.startAt.getTime() <= Date.now()) throw conflict("The event has already started; registrations can no longer be cancelled", "EVENT_STARTED");
    await tx.update(registrations).set({ status: "CANCELLED" }).where(eq(registrations.id, registrationId));
    if (fresh.status === "CONFIRMED") await tx.update(events).set({ confirmedCount: sql`greatest(${events.confirmedCount} - 1, 0)`, updatedAt: new Date() }).where(eq(events.id, ev.id));
    if (fresh.teamId) {
      // the member leaves their registered team so it can re-form
      await tx.delete(teamMembers).where(and(eq(teamMembers.teamId, fresh.teamId), eq(teamMembers.userId, userId)));
      await tx.update(teams).set({ status: "FORMING" }).where(and(eq(teams.id, fresh.teamId), eq(teams.status, "REGISTERED")));
    }
  });
  return { ok: true };
}

export async function listMyRegistrations(userId: string) {
  const rows = await db.select({
    id: registrations.id, status: registrations.status, type: registrations.type, ticketReference: registrations.ticketReference,
    registeredAt: registrations.registeredAt, teamId: registrations.teamId, teamName: teams.name,
    event: {
      id: events.id, slug: events.slug, title: events.title, posterUrl: events.posterUrl, startAt: events.startAt, endAt: events.endAt,
      status: events.status, mode: events.mode, feePaise: events.feePaise, categorySlug: eventCategories.slug, categoryName: eventCategories.name,
      categoryColor: eventCategories.color, venueName: venues.name, locality: venues.locality, cityName: cities.name, collegeName: colleges.name,
    },
  }).from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .innerJoin(cities, eq(events.cityId, cities.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(colleges, eq(events.collegeId, colleges.id))
    .leftJoin(teams, eq(registrations.teamId, teams.id))
    .where(eq(registrations.userId, userId)).orderBy(asc(events.startAt));
  const now = Date.now();
  const isPast = (r: (typeof rows)[number]) => r.event.endAt.getTime() < now || r.event.status === "COMPLETED";
  const active = rows.filter((r) => r.status !== "CANCELLED");
  return {
    upcoming: active.filter((r) => !isPast(r)),
    past: active.filter(isPast).reverse(),
    cancelled: rows.filter((r) => r.status === "CANCELLED"),
    items: rows,
  };
}
export type MyRegistrations = Awaited<ReturnType<typeof listMyRegistrations>>;

export async function setFavourite(userId: string, eventId: string, on: boolean) {
  const [ev] = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!ev) throw notFound("Event not found");
  if (on) await db.insert(favourites).values({ userId, eventId }).onConflictDoNothing();
  else await db.delete(favourites).where(and(eq(favourites.userId, userId), eq(favourites.eventId, eventId)));
  return { favourited: on };
}
