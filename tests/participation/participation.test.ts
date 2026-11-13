import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { notifications, participationApplications as apps } from "@/db";
import { flushNotifications } from "@/lib/notify";
import { applySchema, createOpportunitySchema, APPLICATION_TRANSITIONS } from "@/modules/participation/schemas";
import {
  createOpportunity, listOpportunities, getOpportunity, applyToOpportunity, withdrawApplication, myApplications, listApplicants, updateApplicationStatus, updateOpportunity,
} from "@/modules/participation/service";

let d: Awaited<ReturnType<typeof setupTestDb>>;
beforeAll(async () => { d = await setupTestDb(); });
const A = (u: { id: string; role: any }) => ({ id: u.id, role: u.role });
const pitch = "I have built three hackathon projects and love shipping fast.";
async function setup(over: { capacity?: number; deadline?: Date | null } = {}) {
  const org = await makeUser(d, { role: "ORGANIZER" });
  const ev = await makeEvent(d, org.id);
  const o = await createOpportunity(A(org), ev.id, createOpportunitySchema.parse({ type: "HACKATHON", title: "Main hackathon track", description: "Build something in 24 hours with a team.", capacity: over.capacity ?? 2, deadline: over.deadline ?? undefined }));
  return { org, ev, o };
}

describe("validation", () => {
  it("requires a pitch of at least 20 chars and a valid portfolio url", () => {
    expect(() => applySchema.parse({ pitch: "too short" })).toThrow();
    expect(() => applySchema.parse({ pitch, portfolioUrl: "not a url" })).toThrow();
    expect(applySchema.parse({ pitch, portfolioUrl: "" }).portfolioUrl).toBeNull();
    expect(applySchema.parse({ pitch, portfolioUrl: "https://github.com/x" }).portfolioUrl).toBe("https://github.com/x");
  });
  it("rejects unknown type", () => { expect(() => createOpportunitySchema.parse({ type: "CHESS", title: "abc", description: "x".repeat(30) })).toThrow(); });
});

describe("organizer authorization", () => {
  it("only the event owner (or admin) can create/update opportunities and view/review applicants", async () => {
    const { org, ev, o } = await setup();
    const other = await makeUser(d, { role: "ORGANIZER" }); const admin = await makeUser(d, { role: "PLATFORM_ADMIN" });
    const stu = await makeUser(d);
    const body = createOpportunitySchema.parse({ type: "QUIZ", title: "Quiz night", description: "A general knowledge quiz for all." });
    await expect(createOpportunity(A(other), ev.id, body)).rejects.toMatchObject({ status: 403 });
    await expect(updateOpportunity(A(other), o.id, { status: "CLOSED" })).rejects.toMatchObject({ status: 403 });
    await expect(listApplicants(A(other), o.id)).rejects.toMatchObject({ status: 403 });
    const app = await applyToOpportunity(stu.id, o.id, { pitch, portfolioUrl: null });
    await expect(updateApplicationStatus(A(other), app.id, "UNDER_REVIEW")).rejects.toMatchObject({ status: 403 });
    await expect(updateApplicationStatus(A(admin), app.id, "UNDER_REVIEW")).resolves.toBeTruthy();
    expect((await listApplicants(A(org), o.id))).toHaveLength(1);
  });
});

describe("applying", () => {
  it("prevents duplicates, allows re-apply after withdrawal", async () => {
    const { o } = await setup(); const u = await makeUser(d);
    const a = await applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null });
    expect(a.status).toBe("SUBMITTED");
    await expect(applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null })).rejects.toMatchObject({ status: 409, code: "ALREADY_APPLIED" });
    await withdrawApplication(u.id, a.id);
    const again = await applyToOpportunity(u.id, o.id, { pitch: pitch + " Second try.", portfolioUrl: null });
    expect(again.id).toBe(a.id); expect(again.status).toBe("SUBMITTED");
  });
  it("rejects after the deadline or when closed", async () => {
    const s = await setup(); await d.update((await import("@/db")).participationOpportunities).set({ deadline: new Date(Date.now() - 60_000) }).where(eq((await import("@/db")).participationOpportunities.id, s.o.id));
    const u = await makeUser(d);
    await expect(applyToOpportunity(u.id, s.o.id, { pitch, portfolioUrl: null })).rejects.toMatchObject({ status: 400, message: /deadline/i });
    const c = await setup(); await updateOpportunity(A(c.org), c.o.id, { status: "CLOSED" });
    await expect(applyToOpportunity(u.id, c.o.id, { pitch, portfolioUrl: null })).rejects.toMatchObject({ status: 400, message: /closed/i });
  });
  it("rejects applications to unpublished/cancelled events", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" }); const u = await makeUser(d);
    const ev = await makeEvent(d, org.id, { status: "PUBLISHED" });
    const o = await createOpportunity(A(org), ev.id, createOpportunitySchema.parse({ type: "SINGING", title: "Solo singing", description: "Sing your heart out on stage." }));
    await d.update((await import("@/db")).events).set({ status: "CANCELLED" }).where(eq((await import("@/db")).events.id, ev.id));
    await expect(applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null })).rejects.toMatchObject({ status: 400 });
  });
  it("lists public open opportunities with filters and viewer application", async () => {
    const { o, ev } = await setup(); const u = await makeUser(d);
    expect((await listOpportunities({ page: 1, pageSize: 50, type: "HACKATHON", eventId: ev.id })).items.map((i) => i.id)).toContain(o.id);
    expect((await listOpportunities({ page: 1, pageSize: 50, type: "DANCE", eventId: ev.id })).items).toHaveLength(0);
    await applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null });
    expect((await getOpportunity(o.id, u.id)).application?.status).toBe("SUBMITTED");
    expect((await getOpportunity(o.id)).application).toBeNull();
    expect((await myApplications(u.id))[0].opportunityId).toBe(o.id);
  });
});

describe("status transitions", () => {
  it("walks SUBMITTED -> UNDER_REVIEW -> SHORTLISTED -> ACCEPTED, notifying each time, and blocks illegal moves", async () => {
    const { org, o } = await setup(); const u = await makeUser(d);
    const a = await applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null });
    await expect(updateApplicationStatus(A(org), a.id, "ACCEPTED")).rejects.toMatchObject({ status: 409, code: "ILLEGAL_TRANSITION" });
    await expect(updateApplicationStatus(A(org), a.id, "SHORTLISTED")).rejects.toMatchObject({ status: 409 });
    for (const s of ["UNDER_REVIEW", "SHORTLISTED", "ACCEPTED"]) expect((await updateApplicationStatus(A(org), a.id, s, s === "ACCEPTED" ? "Welcome aboard" : null)).status).toBe(s);
    await flushNotifications();
    const n = await d.select().from(notifications).where(eq(notifications.userId, u.id));
    expect(n.filter((x) => x.type === "APPLICATION_STATUS")).toHaveLength(3);
    expect((await d.select().from(apps).where(eq(apps.id, a.id)))[0].reviewNote).toBe("Welcome aboard");
    await expect(updateApplicationStatus(A(org), a.id, "UNDER_REVIEW")).rejects.toMatchObject({ status: 409 });
  });
  it("cannot change a withdrawn application; rejected is terminal", async () => {
    const { org, o } = await setup(); const u = await makeUser(d), v = await makeUser(d);
    const a = await applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null });
    await withdrawApplication(u.id, a.id);
    await expect(updateApplicationStatus(A(org), a.id, "UNDER_REVIEW")).rejects.toMatchObject({ status: 409, message: /withdrawn/i });
    await expect(withdrawApplication(u.id, a.id)).rejects.toMatchObject({ status: 409 });
    const b = await applyToOpportunity(v.id, o.id, { pitch, portfolioUrl: null });
    await updateApplicationStatus(A(org), b.id, "REJECTED");
    await expect(updateApplicationStatus(A(org), b.id, "UNDER_REVIEW")).rejects.toMatchObject({ status: 409 });
    await expect(withdrawApplication(v.id, b.id)).rejects.toMatchObject({ status: 409 });
  });
  it("enforces ACCEPTED capacity", async () => {
    const { org, o } = await setup({ capacity: 1 }); const u = await makeUser(d), v = await makeUser(d);
    const ids: string[] = [];
    for (const x of [u, v]) { const a = await applyToOpportunity(x.id, o.id, { pitch, portfolioUrl: null }); for (const s of ["UNDER_REVIEW", "SHORTLISTED"]) await updateApplicationStatus(A(org), a.id, s); ids.push(a.id); }
    await updateApplicationStatus(A(org), ids[0], "ACCEPTED");
    await expect(updateApplicationStatus(A(org), ids[1], "ACCEPTED")).rejects.toMatchObject({ status: 409, code: "CAPACITY_FULL" });
    // once full, new applications are blocked too
    const w = await makeUser(d);
    await expect(applyToOpportunity(w.id, o.id, { pitch, portfolioUrl: null })).rejects.toMatchObject({ status: 400, message: /filled/i });
  });
  it("a user cannot withdraw someone else's application", async () => {
    const { o } = await setup(); const u = await makeUser(d), v = await makeUser(d);
    const a = await applyToOpportunity(u.id, o.id, { pitch, portfolioUrl: null });
    await expect(withdrawApplication(v.id, a.id)).rejects.toMatchObject({ status: 403 });
  });
  it("transition table has no way out of WITHDRAWN", () => { expect(APPLICATION_TRANSITIONS.WITHDRAWN).toEqual([]); });
});
