import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { registrations, userProfiles, communityMembers } from "@/db";
import { eq } from "drizzle-orm";
import { sendRequest, respond, discoverAttendees, blockUser, isConnected, removeConnection } from "@/modules/connections/service";
import { getPublicProfile } from "@/modules/connections/profile";
import { getOrCreateConversation, sendMessage, listMessages } from "@/modules/messaging/service";
import { createCommunity, joinCommunity, createPost, listPosts, similarPeople } from "@/modules/communities/service";
import { flushNotifications } from "@/lib/notify";

let d: Awaited<ReturnType<typeof setupTestDb>>;
beforeAll(async () => { d = await setupTestDb(); });
const reg = (eventId: string, userId: string, status: "CONFIRMED" | "CANCELLED" = "CONFIRMED") =>
  d.insert(registrations).values({ eventId, userId, status, ticketReference: `T-${Math.random().toString(36).slice(2)}` });
const connect = async (a: string, b: string) => { const r = await sendRequest(a, b); await respond(b, r.id, true); };

describe("messaging gate", () => {
  it("is 403 NOT_CONNECTED before acceptance and works after", async () => {
    const a = await makeUser(d), b = await makeUser(d);
    await expect(getOrCreateConversation(a.id, b.id)).rejects.toMatchObject({ status: 403, code: "NOT_CONNECTED" });
    const r = await sendRequest(a.id, b.id, "hi");
    await expect(getOrCreateConversation(a.id, b.id)).rejects.toMatchObject({ status: 403 });
    await expect(respond(a.id, r.id, true)).rejects.toMatchObject({ status: 403 }); // only recipient
    await respond(b.id, r.id, true);
    const c = await getOrCreateConversation(a.id, b.id);
    expect((await getOrCreateConversation(b.id, a.id)).id).toBe(c.id);
    await sendMessage(a.id, c.id, "hello");
    const msgs = await listMessages(b.id, c.id);
    expect(msgs.items.map((m) => m.body)).toEqual(["hello"]);
    await expect(sendMessage(a.id, c.id, "x".repeat(2001))).rejects.toMatchObject({ status: 400 });
    const stranger = await makeUser(d);
    await expect(listMessages(stranger.id, c.id)).rejects.toMatchObject({ status: 403 });
  });
  it("declined requests and removed/blocked connections cut messaging", async () => {
    const a = await makeUser(d), b = await makeUser(d), c = await makeUser(d);
    const r = await sendRequest(a.id, b.id); await respond(b.id, r.id, false);
    await expect(getOrCreateConversation(a.id, b.id)).rejects.toMatchObject({ code: "NOT_CONNECTED" });
    await connect(a.id, c.id);
    const conv = await getOrCreateConversation(a.id, c.id);
    await blockUser(c.id, a.id);
    expect(await isConnected(a.id, c.id)).toBe(false);
    await expect(sendMessage(a.id, conv.id, "hey")).rejects.toMatchObject({ status: 403 });
    await expect(sendMessage(c.id, conv.id, "hey")).rejects.toMatchObject({ status: 403 });
  });
  it("removing a connection stops messages", async () => {
    const a = await makeUser(d), b = await makeUser(d);
    await connect(a.id, b.id);
    const conv = await getOrCreateConversation(a.id, b.id);
    await removeConnection(a.id, b.id);
    await expect(sendMessage(b.id, conv.id, "yo")).rejects.toMatchObject({ code: "NOT_CONNECTED" });
  });
});

describe("blocking", () => {
  it("blocked users cannot send requests either way", async () => {
    const a = await makeUser(d), b = await makeUser(d);
    await blockUser(a.id, b.id);
    await expect(sendRequest(b.id, a.id)).rejects.toMatchObject({ status: 403 });
    await expect(sendRequest(a.id, b.id)).rejects.toMatchObject({ status: 403 });
    await expect(sendRequest(a.id, a.id)).rejects.toMatchObject({ status: 400 });
  });
  it("notifies on request and acceptance; duplicate request rejected; mutual request auto-accepts", async () => {
    const a = await makeUser(d), b = await makeUser(d);
    await sendRequest(a.id, b.id);
    await expect(sendRequest(a.id, b.id)).rejects.toMatchObject({ status: 409 });
    const res = await sendRequest(b.id, a.id);
    expect(res.status).toBe("ACCEPTED");
    await flushNotifications();
    expect(await isConnected(a.id, b.id)).toBe(true);
  });
});

describe("attendee discovery", () => {
  it("requires viewer registration, respects opt-in, excludes self/blocked/cancelled, never leaks email", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" });
    const ev = await makeEvent(d, org.id);
    const viewer = await makeUser(d), optedIn = await makeUser(d, { discoverable: true }), hidden = await makeUser(d, { discoverable: false });
    const blocked = await makeUser(d, { discoverable: true }), cancelled = await makeUser(d, { discoverable: true }), outsider = await makeUser(d, { discoverable: true });
    await reg(ev.id, viewer.id); await reg(ev.id, optedIn.id); await reg(ev.id, hidden.id); await reg(ev.id, blocked.id); await reg(ev.id, cancelled.id, "CANCELLED");
    await d.update(userProfiles).set({ bio: "builder", skills: ["Frontend"] }).where(eq(userProfiles.userId, optedIn.id));
    await blockUser(viewer.id, blocked.id);
    await expect(discoverAttendees(outsider.id, ev.slug)).rejects.toMatchObject({ status: 403 });
    const res = await discoverAttendees(viewer.id, ev.slug);
    expect(res.items.map((i) => i.id)).toEqual([optedIn.id]);
    expect(res.items[0].connection).toBe("NONE");
    expect(Object.keys(res.items[0]).sort()).toEqual(["avatarUrl", "bio", "collegeName", "connection", "id", "name", "skills"]);
    expect(JSON.stringify(res)).not.toContain(optedIn.email);
  });
});

describe("profile privacy", () => {
  it("PUBLIC full, CONNECTIONS only to connected, PRIVATE minimal; never exposes email", async () => {
    const owner = await makeUser(d, { profileVisibility: "CONNECTIONS" }), friend = await makeUser(d), stranger = await makeUser(d);
    await d.update(userProfiles).set({ bio: "secret bio" }).where(eq(userProfiles.userId, owner.id));
    expect((await getPublicProfile(stranger.id, owner.id)).visibility).toBe("MINIMAL");
    expect((await getPublicProfile(null, owner.id)).bio).toBeUndefined();
    await connect(friend.id, owner.id);
    const full = await getPublicProfile(friend.id, owner.id);
    expect(full.visibility).toBe("FULL"); expect(full.bio).toBe("secret bio");
    expect(JSON.stringify(full)).not.toContain(owner.email);
    expect((await getPublicProfile(owner.id, owner.id)).visibility).toBe("FULL");
    const priv = await makeUser(d, { profileVisibility: "PRIVATE" });
    expect((await getPublicProfile(stranger.id, priv.id)).visibility).toBe("MINIMAL");
    const pub = await makeUser(d, { profileVisibility: "PUBLIC" });
    expect((await getPublicProfile(null, pub.id)).visibility).toBe("FULL");
    await blockUser(pub.id, stranger.id);
    await expect(getPublicProfile(stranger.id, pub.id)).rejects.toMatchObject({ status: 404 });
  });
});

describe("communities", () => {
  it("join policies incl REGISTERED_ONLY, one community per event, only organizer creates event community", async () => {
    const org = await makeUser(d, { role: "ORGANIZER" }), other = await makeUser(d, { role: "ORGANIZER" });
    const ev = await makeEvent(d, org.id);
    await expect(createCommunity(other, { name: "Hack Crew", description: "hackathon participants", type: "EVENT", eventId: ev.id })).rejects.toMatchObject({ status: 403 });
    const c = await createCommunity(org, { name: "Hack Crew", description: "hackathon participants", type: "EVENT", eventId: ev.id });
    expect(c.joinPolicy).toBe("REGISTERED_ONLY");
    await expect(createCommunity(org, { name: "Hack Crew 2", description: "hackathon participants", type: "EVENT", eventId: ev.id })).rejects.toMatchObject({ status: 409 });
    const u = await makeUser(d);
    await expect(joinCommunity(u.id, c.slug)).rejects.toMatchObject({ status: 403 });
    await reg(ev.id, u.id);
    expect((await joinCommunity(u.id, c.slug)).status).toBe("ACTIVE");
    await expect(joinCommunity(u.id, c.slug)).rejects.toMatchObject({ status: 409 });
    // event posts: members only
    await expect(listPosts(null, c.slug)).rejects.toMatchObject({ status: 403 });
    await createPost(u, c.slug, { body: "hello team" });
    expect((await listPosts(u, c.slug)).total).toBe(1);

    const open = await createCommunity(u, { name: "Open Music", description: "all about music", topic: "Music" });
    const appr = await createCommunity(u, { name: "Approval Club", description: "approval required", joinPolicy: "APPROVAL" });
    const v = await makeUser(d);
    expect((await joinCommunity(v.id, open.slug)).status).toBe("ACTIVE");
    expect((await joinCommunity(v.id, appr.slug)).status).toBe("PENDING");
    await expect(createPost(v, appr.slug, { body: "hi" })).rejects.toMatchObject({ status: 403 });
    expect((await listPosts(null, open.slug)).total).toBe(0); // interest posts public
  });
  it("announcements: only owner/moderator; members get notified", async () => {
    const owner = await makeUser(d), member = await makeUser(d);
    const c = await createCommunity(owner, { name: "Design Hub", description: "design talk and critique" });
    await joinCommunity(member.id, c.slug);
    await expect(createPost(member, c.slug, { body: "news", isAnnouncement: true })).rejects.toMatchObject({ status: 403 });
    const p = await createPost(owner, c.slug, { title: "Meetup", body: "Friday 5pm", isAnnouncement: true });
    expect(p.isAnnouncement).toBe(true);
    await flushNotifications();
    const rows = await d.select().from(communityMembers).where(eq(communityMembers.communityId, c.id));
    expect(rows).toHaveLength(2);
  });
  it("similar people: shared interests, discoverable only, excludes blocked", async () => {
    const me = await makeUser(d), a = await makeUser(d, { discoverable: true }), b = await makeUser(d, { discoverable: false }), c = await makeUser(d, { discoverable: true });
    await d.update(userProfiles).set({ interests: ["Music", "Coding"] }).where(eq(userProfiles.userId, me.id));
    await d.update(userProfiles).set({ interests: ["Music"] }).where(eq(userProfiles.userId, a.id));
    await d.update(userProfiles).set({ interests: ["Music"] }).where(eq(userProfiles.userId, b.id));
    await d.update(userProfiles).set({ interests: ["Coding"] }).where(eq(userProfiles.userId, c.id));
    await blockUser(me.id, c.id);
    const res = await similarPeople(me.id);
    expect(res.map((r) => r.id)).toEqual([a.id]);
    expect(res[0].sharedInterests).toEqual(["Music"]);
  });
});

import { safeNext } from "@/lib/safe-next";
describe("safeNext", () => {
  it("only allows same-origin paths", () => {
    expect(safeNext("/events?x=1")).toBe("/events?x=1");
    for (const bad of ["//evil.com", "https://evil.com", "javascript:alert(1)", "/\\evil.com", undefined, ""]) expect(safeNext(bad as any)).toBe("/");
  });
});
