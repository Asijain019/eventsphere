import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { cities, eventCategories, registrations, notifications, communities, communityPosts, eventCheckIns } from "@/db";
import { flushNotifications } from "@/lib/notify";
import { createEventSchema } from "@/modules/organizer/schemas";
import {
  createEvent, updateEvent, publishEvent, unpublishEvent, cancelEvent, getManagedEvent, listMyEvents, listRegistrations, registrationsCsv,
  eventAnalytics, checkIn, publishAnnouncement, becomeOrganizer,
} from "@/modules/organizer/service";

let d: Awaited<ReturnType<typeof setupTestDb>>;
let city: { id: string }, cat: { id: string };
const future = (days: number) => new Date(Date.now() + days * 864e5).toISOString();
const input = (over: Record<string, unknown> = {}) => createEventSchema.parse({
  title: "Jaipur Code Sprint", description: "A 24 hour sprint for builders across colleges.", categoryId: cat.id, cityId: city.id,
  venue: { name: "Hall A", address: "JLN Marg", locality: "Malviya Nagar" }, startAt: future(10), endAt: future(11), registrationDeadline: future(9), capacity: 5, ...over,
});
async function register(eventId: string, userId: string, ref: string, status: "CONFIRMED" | "WAITLISTED" = "CONFIRMED") {
  await d.insert(registrations).values({ eventId, userId, ticketReference: ref, status });
}
const actor = (u: { id: string; role: any }) => ({ id: u.id, role: u.role });

beforeAll(async () => {
  d = await setupTestDb();
  [city] = await d.insert(cities).values({ name: "Jaipur", slug: "jaipur", state: "Rajasthan" }).returning();
  [cat] = await d.insert(eventCategories).values({ name: "Hackathons", slug: "hackathons" }).returning();
});

describe("event validation (zod)", () => {
  it("rejects end before start", () => {
    expect(() => input({ startAt: future(5), endAt: future(4) })).toThrow(/End time must be after/);
  });
  it("rejects registration deadline after start", () => {
    expect(() => input({ startAt: future(5), endAt: future(6), registrationDeadline: future(7) })).toThrow(/deadline/i);
  });
  it("rejects short description and bad capacity", () => {
    expect(() => input({ description: "short" })).toThrow();
    expect(() => input({ capacity: 0 })).toThrow();
  });
  it("rejects min team size above max", () => {
    expect(() => input({ minTeamSize: 5, maxTeamSize: 2 })).toThrow(/team size/i);
  });
});

describe("create, venue reuse and slugs", () => {
  it("creates a DRAFT, reuses the venue row and generates unique slugs", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const a = await createEvent(actor(org), input());
    const b = await createEvent(actor(org), input());
    expect(a.status).toBe("DRAFT");
    expect(a.slug).toBe("jaipur-code-sprint");
    expect(b.slug).not.toBe(a.slug);
    expect(b.venueId).toBe(a.venueId);
  });
});

describe("authorization", () => {
  it("forbids a different organizer from managing, but allows the owner and platform admin", async () => {
    const owner = await makeUser(d, { role: "ORGANIZER" });
    const other = await makeUser(d, { role: "ORGANIZER" });
    const admin = await makeUser(d, { role: "PLATFORM_ADMIN" });
    const ev = await createEvent(actor(owner), input());
    await expect(getManagedEvent(actor(other), ev.id)).rejects.toMatchObject({ status: 403 });
    await expect(updateEvent(actor(other), ev.id, { title: "Hacked" })).rejects.toMatchObject({ status: 403 });
    await expect(publishEvent(actor(other), ev.id)).rejects.toMatchObject({ status: 403 });
    await expect(cancelEvent(actor(other), ev.id)).rejects.toMatchObject({ status: 403 });
    await expect(checkIn(actor(other), ev.id, "ES-XXXX")).rejects.toMatchObject({ status: 403 });
    await expect(publishAnnouncement(actor(other), ev.id, { title: "x y z", body: "hello world" })).rejects.toMatchObject({ status: 403 });
    await expect(getManagedEvent(actor(owner), ev.id)).resolves.toMatchObject({ title: ev.title });
    await expect(getManagedEvent(actor(admin), ev.id)).resolves.toBeTruthy();
    expect((await listMyEvents(actor(other), { page: 1, pageSize: 50 })).items.find((e) => e.id === ev.id)).toBeUndefined();
  });
  it("lets a college admin of the event's college manage it", async () => {
    const { colleges, userProfiles } = await import("@/db");
    const [col] = await d.insert(colleges).values({ name: "JECRC", slug: "jecrc", cityId: city.id }).returning();
    const owner = await makeUser(d, { role: "ORGANIZER" });
    const ca = await makeUser(d, { role: "COLLEGE_ADMIN" });
    const ca2 = await makeUser(d, { role: "COLLEGE_ADMIN" });
    await d.update(userProfiles).set({ collegeId: col.id }).where(eq(userProfiles.userId, ca.id));
    const ev = await createEvent(actor(owner), input({ collegeId: col.id }));
    await expect(getManagedEvent(actor(ca), ev.id)).resolves.toBeTruthy();
    await expect(getManagedEvent(actor(ca2), ev.id)).rejects.toMatchObject({ status: 403 });
  });
});

describe("update / publish / cancel lifecycle + notifications", () => {
  it("validates completeness before publishing", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const ev = await createEvent(actor(org), input({ venue: null }));
    await expect(publishEvent(actor(org), ev.id)).rejects.toMatchObject({ status: 400, details: { problems: expect.arrayContaining([expect.stringMatching(/venue/i)]) } });
    await updateEvent(actor(org), ev.id, { venue: { name: "Hall B", address: "Tonk Road" } });
    expect((await publishEvent(actor(org), ev.id)).status).toBe("PUBLISHED");
    expect((await unpublishEvent(actor(org), ev.id)).status).toBe("DRAFT");
  });

  it("refuses to unpublish once registrations exist", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" }); const s = await makeUser(d);
    const ev = await makeEvent(d, org.id, { confirmedCount: 1 });
    await register(ev.id, s.id, "ES-UNPUB1");
    await expect(unpublishEvent(actor(org), ev.id)).rejects.toMatchObject({ status: 409 });
  });

  it("notifies confirmed registrants when date/venue/deadline of a published event change, not for cosmetic edits", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const s1 = await makeUser(d), s2 = await makeUser(d), s3 = await makeUser(d);
    const created = await createEvent(actor(org), input());
    await publishEvent(actor(org), created.id);
    await register(created.id, s1.id, "ES-UPD001"); await register(created.id, s2.id, "ES-UPD002");
    await d.insert(registrations).values({ eventId: created.id, userId: s3.id, ticketReference: "ES-UPD003", status: "CANCELLED" });
    await d.update((await import("@/db")).events).set({ confirmedCount: 2 }).where(eq((await import("@/db")).events.id, created.id));

    await updateEvent(actor(org), created.id, { eligibility: "Open to all" });
    await flushNotifications();
    expect(await d.select().from(notifications).where(eq(notifications.type, "EVENT_UPDATED"))).toHaveLength(0);

    await updateEvent(actor(org), created.id, { startAt: new Date(Date.now() + 12 * 864e5), endAt: new Date(Date.now() + 13 * 864e5) });
    await flushNotifications();
    const n = await d.select().from(notifications).where(eq(notifications.type, "EVENT_UPDATED"));
    expect(n.map((x) => x.userId).sort()).toEqual([s1.id, s2.id].sort());
  });

  it("does not let capacity drop below confirmed count", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const ev = await makeEvent(d, org.id, { confirmedCount: 6, capacity: 10 });
    await expect(updateEvent(actor(org), ev.id, { capacity: 5 })).rejects.toMatchObject({ status: 400 });
    expect((await updateEvent(actor(org), ev.id, { capacity: 6 })).capacity).toBe(6);
  });

  it("rejects invalid merged dates on update", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const ev = await makeEvent(d, org.id);
    await expect(updateEvent(actor(org), ev.id, { endAt: new Date(ev.startAt.getTime() - 1000) })).rejects.toMatchObject({ status: 400 });
  });

  it("cancels, notifies confirmed and waitlisted registrants, and blocks further edits", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const a = await makeUser(d), b = await makeUser(d);
    const ev = await makeEvent(d, org.id);
    await register(ev.id, a.id, "ES-CAN001"); await register(ev.id, b.id, "ES-CAN002", "WAITLISTED");
    const row = await cancelEvent(actor(org), ev.id, "Venue unavailable");
    expect(row.status).toBe("CANCELLED");
    await flushNotifications();
    const n = await d.select().from(notifications).where(and(eq(notifications.type, "EVENT_CANCELLED")));
    expect(n.filter((x) => [a.id, b.id].includes(x.userId))).toHaveLength(2);
    expect(n[0].body).toBe("Venue unavailable");
    await expect(cancelEvent(actor(org), ev.id)).rejects.toMatchObject({ status: 409 });
    await expect(updateEvent(actor(org), ev.id, { title: "New title" })).rejects.toMatchObject({ status: 409 });
  });
});

describe("registrations, csv, analytics and check-in", () => {
  it("lists, searches and exports CSV (formula-injection safe)", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const s = await makeUser(d, { name: "=cmd|calc" });
    const t = await makeUser(d, { name: "Tara, \"T\" Singh" });
    const ev = await makeEvent(d, org.id);
    await register(ev.id, s.id, "ES-CSV001"); await register(ev.id, t.id, "ES-CSV002");
    const list = await listRegistrations(actor(org), ev.id, { page: 1, pageSize: 10, q: "tara" });
    expect(list.total).toBe(1);
    const csv = await registrationsCsv(actor(org), ev.id);
    expect(csv.split("\r\n")[0]).toBe("Ticket,Name,Email,College,Status,Type,Registered at,Checked in at");
    expect(csv).toContain("'=cmd|calc");
    expect(csv).toContain('"Tara, ""T"" Singh"');
  });

  it("check-in works once, 409 on repeat, 404 on unknown, 409 for non-confirmed", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" }); const other = await makeUser(d, { role: "ORGANIZER" });
    const s = await makeUser(d), w = await makeUser(d);
    const ev = await makeEvent(d, org.id);
    await register(ev.id, s.id, "ES-CHK001"); await register(ev.id, w.id, "ES-CHK002", "WAITLISTED");
    const r = await checkIn(actor(org), ev.id, " es-chk001 ");
    expect(r.name).toBe(s.name);
    await expect(checkIn(actor(org), ev.id, "ES-CHK001")).rejects.toMatchObject({ status: 409, code: "ALREADY_CHECKED_IN" });
    await expect(checkIn(actor(org), ev.id, "ES-NOPE99")).rejects.toMatchObject({ status: 404 });
    await expect(checkIn(actor(org), ev.id, "ES-CHK002")).rejects.toMatchObject({ status: 409 });
    expect(await d.select().from(eventCheckIns).where(eq(eventCheckIns.eventId, ev.id))).toHaveLength(1);
    // ticket of another event cannot be used
    const ev2 = await makeEvent(d, other.id);
    await expect(checkIn(actor(other), ev2.id, "ES-CHK001")).rejects.toMatchObject({ status: 404 });
  });

  it("computes analytics", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const a = await makeUser(d), b = await makeUser(d);
    const ev = await makeEvent(d, org.id, { capacity: 4, confirmedCount: 2 });
    await register(ev.id, a.id, "ES-AN0001"); await register(ev.id, b.id, "ES-AN0002");
    await checkIn(actor(org), ev.id, "ES-AN0001");
    const an = await eventAnalytics(actor(org), ev.id);
    expect(an).toMatchObject({ capacity: 4, confirmed: 2, fillRate: 50, checkIns: 1, checkInRate: 50, favourites: 0 });
    expect(an.registrationsByDay.reduce((s, x) => s + x.count, 0)).toBe(2);
  });
});

describe("announcements", () => {
  it("stores the announcement, notifies registrants and posts to the event community", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" }); const s = await makeUser(d);
    const ev = await makeEvent(d, org.id);
    await register(ev.id, s.id, "ES-ANN001");
    const [c] = await d.insert(communities).values({ slug: `c-${ev.id}`, name: "Event community", description: "x", type: "EVENT", ownerId: org.id, eventId: ev.id }).returning();
    const res = await publishAnnouncement(actor(org), ev.id, { title: "Doors open at 9", body: "Please bring your ticket." });
    expect(res.notified).toBe(1);
    await flushNotifications();
    expect((await d.select().from(notifications).where(and(eq(notifications.userId, s.id), eq(notifications.type, "ANNOUNCEMENT")))).length).toBe(1);
    const posts = await d.select().from(communityPosts).where(eq(communityPosts.communityId, c.id));
    expect(posts).toHaveLength(1); expect(posts[0].isAnnouncement).toBe(true);
  });
});

describe("becomeOrganizer", () => {
  it("upgrades students but never touches admins", async () => {
    const s = await makeUser(d); const a = await makeUser(d, { role: "PLATFORM_ADMIN" });
    expect((await becomeOrganizer(s.id)).role).toBe("ORGANIZER");
    expect((await becomeOrganizer(a.id)).role).toBe("PLATFORM_ADMIN");
  });
});
