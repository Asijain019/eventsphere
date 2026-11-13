import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { notifications, volunteerRoles } from "@/db";
import { flushNotifications } from "@/lib/notify";
import { createRoleSchema, volunteerApplySchema, volunteerReviewSchema } from "@/modules/volunteer/schemas";
import {
  createRole, updateRole, listRoles, getRole, applyForRole, withdrawVolunteerApplication, myVolunteerApplications, listRoleApplicants, reviewVolunteerApplication,
} from "@/modules/volunteer/service";

let d: Awaited<ReturnType<typeof setupTestDb>>;
beforeAll(async () => { d = await setupTestDb(); });
const A = (u: { id: string; role: any }) => ({ id: u.id, role: u.role });
const why = "I volunteered at two college fests and enjoy managing crowds.";
async function setup(openings = 1) {
  const org = await makeUser(d, { role: "ORGANIZER" });
  const ev = await makeEvent(d, org.id);
  const role = await createRole(A(org), ev.id, createRoleSchema.parse({ title: "Registration desk", description: "Greet and check in attendees.", skillsRequired: ["Communication"], openings, shiftLabel: "Day 1, 9am-1pm" }));
  return { org, ev, role };
}
const review = (x: unknown) => volunteerReviewSchema.parse(x);

describe("validation", () => {
  it("validates role and application input", () => {
    expect(() => createRoleSchema.parse({ title: "ab", description: "long enough description" })).toThrow();
    expect(() => createRoleSchema.parse({ title: "Usher", description: "long enough description", openings: 0 })).toThrow();
    expect(() => createRoleSchema.parse({ title: "Usher", description: "long enough description", shiftStart: "2030-01-02T10:00:00Z", shiftEnd: "2030-01-02T09:00:00Z" })).toThrow(/Shift end/);
    expect(() => volunteerApplySchema.parse({ motivation: "short" })).toThrow();
    expect(() => volunteerReviewSchema.parse({ action: "ASSIGN_SHIFT" })).toThrow();
  });
});

describe("authorization", () => {
  it("only the event owner/admin can manage roles and applicants", async () => {
    const { org, ev, role } = await setup(); const other = await makeUser(d, { role: "ORGANIZER" }); const stu = await makeUser(d);
    await expect(createRole(A(other), ev.id, createRoleSchema.parse({ title: "Usher", description: "Guide people to seats." }))).rejects.toMatchObject({ status: 403 });
    await expect(updateRole(A(other), role.id, { openings: 9 })).rejects.toMatchObject({ status: 403 });
    await expect(listRoleApplicants(A(other), role.id)).rejects.toMatchObject({ status: 403 });
    const a = await applyForRole(stu.id, role.id, { motivation: why });
    await expect(reviewVolunteerApplication(A(other), a.id, review({ action: "ACCEPT" }))).rejects.toMatchObject({ status: 403 });
    await expect(reviewVolunteerApplication(A(org), a.id, review({ action: "ACCEPT" }))).resolves.toBeTruthy();
  });
});

describe("applying", () => {
  it("prevents duplicates, supports withdraw + re-apply, shows in my applications", async () => {
    const { role } = await setup(2); const u = await makeUser(d);
    const a = await applyForRole(u.id, role.id, { motivation: why });
    await expect(applyForRole(u.id, role.id, { motivation: why })).rejects.toMatchObject({ status: 409, code: "ALREADY_APPLIED" });
    expect((await myVolunteerApplications(u.id))[0].roleId).toBe(role.id);
    await withdrawVolunteerApplication(u.id, a.id);
    await expect(withdrawVolunteerApplication(u.id, a.id)).rejects.toMatchObject({ status: 409 });
    expect((await applyForRole(u.id, role.id, { motivation: why + " again" })).status).toBe("SUBMITTED");
  });
  it("blocks after deadline, when closed and when openings are filled", async () => {
    const { org, role } = await setup(1); const u = await makeUser(d), v = await makeUser(d);
    await d.update(volunteerRoles).set({ deadline: new Date(Date.now() - 1000) }).where(eq(volunteerRoles.id, role.id));
    await expect(applyForRole(u.id, role.id, { motivation: why })).rejects.toMatchObject({ status: 400, message: /deadline/i });
    await d.update(volunteerRoles).set({ deadline: null }).where(eq(volunteerRoles.id, role.id));
    await updateRole(A(org), role.id, { status: "CLOSED" });
    await expect(applyForRole(u.id, role.id, { motivation: why })).rejects.toMatchObject({ status: 400, message: /closed/i });
    await updateRole(A(org), role.id, { status: "OPEN" });
    const a = await applyForRole(u.id, role.id, { motivation: why });
    await reviewVolunteerApplication(A(org), a.id, review({ action: "ACCEPT" }));
    await expect(applyForRole(v.id, role.id, { motivation: why })).rejects.toMatchObject({ status: 400, message: /filled/i });
  });
  it("lists open roles publicly with filters", async () => {
    const { ev, role } = await setup();
    expect((await listRoles({ page: 1, pageSize: 50, eventId: ev.id, skill: "Communication" })).items.map((r) => r.id)).toContain(role.id);
    expect((await listRoles({ page: 1, pageSize: 50, eventId: ev.id, skill: "Welding" })).items).toHaveLength(0);
    expect((await getRole(role.id)).application).toBeNull();
  });
});

describe("review workflow", () => {
  it("enforces openings on accept, allows reject, notifies", async () => {
    const { org, role } = await setup(1); const u = await makeUser(d), v = await makeUser(d);
    const a = await applyForRole(u.id, role.id, { motivation: why }); const b = await applyForRole(v.id, role.id, { motivation: why });
    await reviewVolunteerApplication(A(org), a.id, review({ action: "ACCEPT" }));
    await expect(reviewVolunteerApplication(A(org), b.id, review({ action: "ACCEPT" }))).rejects.toMatchObject({ status: 409, code: "OPENINGS_FULL" });
    await expect(reviewVolunteerApplication(A(org), a.id, review({ action: "ACCEPT" }))).rejects.toMatchObject({ status: 409 });
    expect((await reviewVolunteerApplication(A(org), b.id, review({ action: "REJECT" }))).application.status).toBe("REJECTED");
    // raising openings frees a spot, but you cannot lower below accepted
    await expect(updateRole(A(org), role.id, { openings: 1 })).resolves.toBeTruthy();
    await updateRole(A(org), role.id, { openings: 2 });
    await flushNotifications();
    expect((await d.select().from(notifications).where(eq(notifications.userId, u.id))).some((n) => n.type === "APPLICATION_STATUS")).toBe(true);
  });
  it("cannot accept a withdrawn application", async () => {
    const { org, role } = await setup(3); const u = await makeUser(d);
    const a = await applyForRole(u.id, role.id, { motivation: why }); await withdrawVolunteerApplication(u.id, a.id);
    await expect(reviewVolunteerApplication(A(org), a.id, review({ action: "ACCEPT" }))).rejects.toMatchObject({ status: 409, message: /withdrawn/i });
  });
  it("assigns a shift only for accepted volunteers, notifies, and tracks completion", async () => {
    const { org, role } = await setup(2); const u = await makeUser(d);
    const a = await applyForRole(u.id, role.id, { motivation: why });
    await expect(reviewVolunteerApplication(A(org), a.id, review({ action: "ASSIGN_SHIFT", shiftLabel: "Day 1 morning" }))).rejects.toMatchObject({ status: 409, code: "NOT_ACCEPTED" });
    await expect(reviewVolunteerApplication(A(org), a.id, review({ action: "SET_COMPLETION", completion: "COMPLETED" }))).rejects.toMatchObject({ status: 409 });
    await reviewVolunteerApplication(A(org), a.id, review({ action: "ACCEPT" }));
    const res = await reviewVolunteerApplication(A(org), a.id, review({ action: "ASSIGN_SHIFT", shiftLabel: "Day 1 morning" }));
    expect(res.assignment?.shiftLabel).toBe("Day 1 morning"); expect(res.assignment?.completion).toBe("PENDING");
    await reviewVolunteerApplication(A(org), a.id, review({ action: "ASSIGN_SHIFT", shiftLabel: "Day 1 evening" })); // re-assign = update
    expect((await reviewVolunteerApplication(A(org), a.id, review({ action: "SET_COMPLETION", completion: "NO_SHOW" }))).assignment?.completion).toBe("NO_SHOW");
    const [mine] = await myVolunteerApplications(u.id);
    expect(mine).toMatchObject({ shiftLabel: "Day 1 evening", completion: "NO_SHOW" });
    expect((await listRoleApplicants(A(org), role.id))[0].shiftLabel).toBe("Day 1 evening");
    await flushNotifications();
    expect((await d.select().from(notifications).where(eq(notifications.userId, u.id))).filter((n) => n.type === "VOLUNTEER_ASSIGNED")).toHaveLength(2);
  });
});
