import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDb, makeUser, makeEvent } from "../helpers/db";
import { cities, eventCategories, colleges, favourites } from "@/db";
import { listEvents, getEvent, getMeta, presetRange } from "@/modules/events/queries";

let d: Awaited<ReturnType<typeof setupTestDb>>;
let org: Awaited<ReturnType<typeof makeUser>>;
const H = 36e5, D = 864e5;
beforeAll(async () => {
  d = await setupTestDb();
  org = await makeUser(d, { role: "ORGANIZER" });
  const [jaipur] = await d.insert(cities).values({ name: "Jaipur", slug: "jaipur", state: "Rajasthan" }).returning();
  const [delhi] = await d.insert(cities).values({ name: "Delhi", slug: "delhi", state: "Delhi" }).returning();
  const [tech] = await d.insert(eventCategories).values({ name: "Technology", slug: "technology" }).returning();
  const [music] = await d.insert(eventCategories).values({ name: "Music", slug: "music-concerts" }).returning();
  const [col] = await d.insert(colleges).values({ name: "MNIT", slug: "mnit", cityId: jaipur.id }).returning();
  const base = { cityId: jaipur.id, categoryId: tech.id };
  await makeEvent(d, org.id, { ...base, title: "AI Summit", tags: ["machine-learning"], startAt: new Date(Date.now() + 2 * D), endAt: new Date(Date.now() + 2 * D + 3 * H), collegeId: col.id, popularity: 5 });
  await makeEvent(d, org.id, { ...base, title: "Rock Night", categoryId: music.id, feePaise: 50000, startAt: new Date(Date.now() + 5 * D), endAt: new Date(Date.now() + 5 * D + 3 * H), popularity: 50, mode: "OFFLINE" });
  await makeEvent(d, org.id, { ...base, title: "Online Workshop", mode: "ONLINE", startAt: new Date(Date.now() + 40 * D), endAt: new Date(Date.now() + 40 * D + H) });
  await makeEvent(d, org.id, { ...base, title: "Delhi Fest", cityId: delhi.id });
  await makeEvent(d, org.id, { ...base, title: "Secret Draft", status: "DRAFT" });
  await makeEvent(d, org.id, { ...base, title: "Old Event", startAt: new Date(Date.now() - 3 * D), endAt: new Date(Date.now() - 3 * D + H) });
});
const titles = (r: { items: { title: string }[] }) => r.items.map((i) => i.title);

describe("listEvents", () => {
  it("defaults to Jaipur, published, not ended", async () => {
    const r = await listEvents({});
    expect(titles(r)).toEqual(["AI Summit", "Rock Night", "Online Workshop"]);
    expect(r.total).toBe(3);
  });
  it("city all / delhi", async () => {
    expect(titles(await listEvents({ city: "delhi" }))).toEqual(["Delhi Fest"]);
    expect((await listEvents({ city: "all" })).total).toBe(4);
  });
  it("filters q, tags, category, college, fee, mode", async () => {
    expect(titles(await listEvents({ q: "summit" }))).toEqual(["AI Summit"]);
    expect(titles(await listEvents({ q: "machine-learning" }))).toEqual(["AI Summit"]);
    expect(titles(await listEvents({ category: "music-concerts" }))).toEqual(["Rock Night"]);
    expect(titles(await listEvents({ college: "mnit" }))).toEqual(["AI Summit"]);
    expect(titles(await listEvents({ fee: "paid" }))).toEqual(["Rock Night"]);
    expect((await listEvents({ fee: "free" })).total).toBe(2);
    expect(titles(await listEvents({ mode: "online" as any }))).toEqual(["Online Workshop"]);
  });
  it("date range & presets", async () => {
    const f = new Date(Date.now() + 4 * D).toISOString().slice(0, 10), t = new Date(Date.now() + 6 * D).toISOString().slice(0, 10);
    expect(titles(await listEvents({ from: f, to: t }))).toEqual(["Rock Night"]);
    expect(titles(await listEvents({ preset: "this-month" })).length).toBeLessThanOrEqual(3);
    const r = presetRange("today"); expect(r.to.getTime() - r.from.getTime()).toBe(D - 1);
  });
  it("sorts and paginates", async () => {
    expect(titles(await listEvents({ sort: "popular" }))[0]).toBe("Rock Night");
    const p1 = await listEvents({ pageSize: 2, page: 1 }), p2 = await listEvents({ pageSize: 2, page: 2 });
    expect(p1.items).toHaveLength(2); expect(p2.items).toHaveLength(1); expect(p1.totalPages).toBe(2);
  });
  it("marks favourites for the viewer", async () => {
    const u = await makeUser(d);
    const first = (await listEvents({})).items[0];
    await d.insert(favourites).values({ userId: u.id, eventId: first.id });
    const r = await listEvents({}, u.id);
    expect(r.items.find((i) => i.id === first.id)?.favourited).toBe(true);
    expect(r.items.filter((i) => i.favourited)).toHaveLength(1);
  });
});

describe("getEvent / meta", () => {
  it("hides drafts from the public but not the organizer", async () => {
    const [draft] = await d.query.events.findMany({ where: (e, { eq }) => eq(e.status, "DRAFT") });
    await expect(getEvent(draft.slug)).rejects.toMatchObject({ status: 404 });
    await expect(getEvent(draft.slug, await makeUser(d))).rejects.toMatchObject({ status: 404 });
    expect((await getEvent(draft.slug, { id: org.id })).isOwner).toBe(true);
  });
  it("returns detail with seats left and no organizer email", async () => {
    const [e] = (await listEvents({})).items;
    const det: any = await getEvent(e.slug);
    expect(det.seatsLeft).toBe(10);
    expect(JSON.stringify(det.organizer)).not.toContain("@");
  });
  it("meta has counts", async () => {
    const m = await getMeta("jaipur");
    expect(m.cities.length).toBe(2);
    expect(m.categories.find((c) => c.slug === "technology")?.count).toBe(2);
  });
});
