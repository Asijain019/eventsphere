import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { events, registrations } from "@/db";
import { registerForEvent, cancelRegistration, listMyRegistrations } from "@/modules/events/registration";

let d: Awaited<ReturnType<typeof setupTestDb>>;
let org: Awaited<ReturnType<typeof makeUser>>;
beforeAll(async () => { d = await setupTestDb(); org = await makeUser(d, { role: "ORGANIZER" }); });
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => e.code);

describe("registration", () => {
  it("never exceeds capacity under concurrency", async () => {
    const ev = await makeEvent(d, org.id, { capacity: 5 });
    const users = await Promise.all(Array.from({ length: 12 }, () => makeUser(d)));
    const res = await Promise.all(users.map((u) => code(registerForEvent(u.id, ev.id))));
    expect(res.filter((r) => r === "ok")).toHaveLength(5);
    expect(res.filter((r) => r === "EVENT_FULL")).toHaveLength(7);
    const [row] = await d.select().from(events).where(eq(events.id, ev.id));
    expect(row.confirmedCount).toBe(5);
    expect((await d.select().from(registrations).where(eq(registrations.eventId, ev.id))).length).toBe(5);
  });
  it("rejects duplicates and issues unique tickets", async () => {
    const ev = await makeEvent(d, org.id);
    const [a, b] = await Promise.all([makeUser(d), makeUser(d)]);
    const r1 = await registerForEvent(a.id, ev.id);
    const r2 = await registerForEvent(b.id, ev.id);
    expect(r1.registration.ticketReference).not.toBe(r2.registration.ticketReference);
    expect(await code(registerForEvent(a.id, ev.id))).toBe("ALREADY_REGISTERED");
    const [row] = await d.select().from(events).where(eq(events.id, ev.id));
    expect(row.confirmedCount).toBe(2);
  });
  it("cancel frees a seat, can re-register, only own", async () => {
    const ev = await makeEvent(d, org.id, { capacity: 1 });
    const [a, b] = await Promise.all([makeUser(d), makeUser(d)]);
    const { registration } = await registerForEvent(a.id, ev.id);
    expect(await code(registerForEvent(b.id, ev.id))).toBe("EVENT_FULL");
    expect(await code(cancelRegistration(b.id, registration.id))).toBe("FORBIDDEN");
    await cancelRegistration(a.id, registration.id);
    expect(await code(cancelRegistration(a.id, registration.id))).toBe("ALREADY_CANCELLED");
    await registerForEvent(b.id, ev.id);
    await expect(registerForEvent(a.id, ev.id)).rejects.toMatchObject({ code: "EVENT_FULL" });
    const [row] = await d.select().from(events).where(eq(events.id, ev.id));
    expect(row.confirmedCount).toBe(1);
  });
  it("enforces deadline, started, status", async () => {
    const u = await makeUser(d);
    const past = await makeEvent(d, org.id, { registrationDeadline: new Date(Date.now() - 1000) });
    expect(await code(registerForEvent(u.id, past.id))).toBe("REGISTRATION_CLOSED");
    const started = await makeEvent(d, org.id, { startAt: new Date(Date.now() - 3600e3) });
    expect(await code(registerForEvent(u.id, started.id))).toBe("EVENT_STARTED");
    const draft = await makeEvent(d, org.id, { status: "DRAFT" });
    expect(await code(registerForEvent(u.id, draft.id))).toBe("REGISTRATION_CLOSED");
    expect(await code(registerForEvent(u.id, "nope"))).toBe("NOT_FOUND");
  });
  it("lists my registrations as upcoming/past", async () => {
    const u = await makeUser(d);
    const up = await makeEvent(d, org.id);
    await registerForEvent(u.id, up.id);
    const r = await listMyRegistrations(u.id);
    expect(r.upcoming).toHaveLength(1);
    expect(r.past).toHaveLength(0);
  });
});
