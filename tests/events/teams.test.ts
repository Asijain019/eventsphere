import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { createTeam, requestToJoin, respondToRequest, getTeam, listTeams, leaveTeam, inviteUser, respondToInvite } from "@/modules/events/teams";
import { registerForEvent, registerTeam } from "@/modules/events/registration";

let d: Awaited<ReturnType<typeof setupTestDb>>;
let org: Awaited<ReturnType<typeof makeUser>>;
let ev: Awaited<ReturnType<typeof makeEvent>>;
beforeAll(async () => {
  d = await setupTestDb(); org = await makeUser(d, { role: "ORGANIZER" });
  ev = await makeEvent(d, org.id, { teamsEnabled: true, minTeamSize: 2, maxTeamSize: 3, capacity: 50 });
});
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => e.code ?? e.message);

describe("teams", () => {
  it("lifecycle: create, request, accept, max size enforced, register", async () => {
    const [cap, a, b, c] = await Promise.all([1, 2, 3, 4].map(() => makeUser(d)));
    const noTeams = await makeEvent(d, org.id);
    await expect(createTeam(cap.id, noTeams.id, { name: "X1" })).rejects.toMatchObject({ status: 400 });
    await expect(createTeam(cap.id, ev.id, { name: "Too big", maxSize: 9 })).rejects.toMatchObject({ status: 400 });
    const team = await createTeam(cap.id, ev.id, { name: "Hack Pack", openRoles: ["Frontend"] });
    expect(team.maxSize).toBe(3);
    expect(await code(createTeam(a.id, ev.id, { name: "hack pack" }))).toBe("TEAM_NAME_TAKEN");
    expect(await code(createTeam(cap.id, ev.id, { name: "Another" }))).toBe("ALREADY_IN_TEAM");

    await requestToJoin(a.id, team.id, "I do React");
    expect(await code(requestToJoin(a.id, team.id))).toBe("ALREADY_REQUESTED");
    await requestToJoin(b.id, team.id);
    await requestToJoin(c.id, team.id);
    let t = await getTeam(team.id, cap.id);
    expect(t.requests).toHaveLength(3);
    expect(JSON.stringify(t)).not.toMatch(/@test\.dev/);
    expect(await code(respondToRequest(a.id, team.id, t.requests[0].memberId, "accept"))).toBe("FORBIDDEN");

    await respondToRequest(cap.id, team.id, t.requests[0].memberId, "accept");
    const r2 = await respondToRequest(cap.id, team.id, t.requests[1].memberId, "accept");
    expect(r2.teamFull).toBe(true);
    expect(await code(respondToRequest(cap.id, team.id, t.requests[2].memberId, "accept"))).toBe("TEAM_FULL");
    t = await getTeam(team.id, cap.id);
    expect(t.status).toBe("COMPLETE"); expect(t.members).toHaveLength(3);

    expect((await listTeams({ hasOpenSpots: "true" })).items.find((i) => i.id === team.id)).toBeUndefined();
    expect((await listTeams({ eventId: ev.id })).items.some((i) => i.id === team.id)).toBe(true);
    expect((await listTeams({ skill: "Frontend" })).items.some((i) => i.id === team.id)).toBe(true);

    const reg = await registerTeam(cap.id, team.id);
    expect(reg.registrations).toBe(3);
    expect((await getTeam(team.id)).status).toBe("REGISTERED");
    expect(await code(registerTeam(cap.id, team.id))).toBe("ALREADY_REGISTERED");
  });
  it("team registration validates size and prior registrations", async () => {
    const [cap, a] = await Promise.all([makeUser(d), makeUser(d)]);
    const team = await createTeam(cap.id, ev.id, { name: "Solo" });
    expect(await code(registerTeam(cap.id, team.id))).toBe("TEAM_TOO_SMALL");
    await requestToJoin(a.id, team.id);
    await respondToRequest(cap.id, team.id, (await getTeam(team.id, cap.id)).requests[0].memberId, "accept");
    await registerForEvent(a.id, ev.id);
    expect(await code(registerTeam(cap.id, team.id))).toBe("MEMBER_ALREADY_REGISTERED");
    expect(await code(registerTeam(a.id, team.id))).toBe("FORBIDDEN");
  });
  it("invites, leave, captain handover", async () => {
    const [cap, a, b] = await Promise.all([makeUser(d), makeUser(d), makeUser(d)]);
    const team = await createTeam(cap.id, ev.id, { name: "Invite Club" });
    await inviteUser(cap.id, team.id, a.id);
    expect((await getTeam(team.id, a.id)).viewer.invited).toBe(true);
    await respondToInvite(a.id, team.id, "accept");
    expect((await getTeam(team.id)).memberCount).toBe(2);
    await inviteUser(cap.id, team.id, b.id);
    await respondToInvite(b.id, team.id, "reject");
    expect((await getTeam(team.id)).memberCount).toBe(2);
    await leaveTeam(cap.id, team.id);
    const t = await getTeam(team.id);
    expect(t.captainId).toBe(a.id);
    await leaveTeam(a.id, team.id);
    expect((await getTeam(team.id)).status).toBe("DISBANDED");
  });
});
