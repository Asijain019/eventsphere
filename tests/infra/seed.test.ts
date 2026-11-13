import { describe, it, expect, beforeAll } from "vitest";
import { sql, count, eq } from "drizzle-orm";
import { setupTestDb } from "../helpers/db";
import { seedDatabase } from "../../scripts/seed";
import * as S from "@/db/schema";
import { DEMO_USERS, DEMO_PASSWORD } from "@/db/seed-data";
import { CATEGORIES } from "@/lib/constants";
import bcrypt from "bcryptjs";

describe("seed", () => {
  let d: Awaited<ReturnType<typeof setupTestDb>>;
  let first: Record<string, number>;
  beforeAll(async () => {
    d = await setupTestDb();
    first = await seedDatabase(d, { bcryptCost: 4 });
  });

  it("is idempotent: a second run creates no duplicates", async () => {
    const second = await seedDatabase(d, { bcryptCost: 4 });
    expect(second).toEqual(first);
  });

  it("seeds the expected volume and variety", async () => {
    expect(first.cities).toBeGreaterThanOrEqual(8);
    expect(first.colleges).toBe(12);
    expect(first.categories).toBe(12);
    expect(first.users).toBeGreaterThanOrEqual(32);
    expect(first.events).toBeGreaterThanOrEqual(28);
    const cats = await d.selectDistinct({ c: S.events.categoryId }).from(S.events);
    expect(cats.length).toBe(CATEGORIES.length);
    const bad = await d.select({ n: count() }).from(S.events).where(sql`not ${S.events.isDemo} or ${S.events.status} <> 'PUBLISHED' or ${S.events.startAt} < now() or ${S.events.startAt} > now() + interval '91 days'`);
    expect(Number(bad[0].n)).toBe(0);
  });

  it("keeps confirmed_count consistent with confirmed registrations and within capacity", async () => {
    const rows = await d.execute<{ id: string; confirmed_count: number; capacity: number; actual: number }>(
      sql`select e.id, e.confirmed_count, e.capacity, (select count(*)::int from registrations r where r.event_id = e.id and r.status = 'CONFIRMED') as actual from events e`);
    const list = (rows as unknown as { rows: typeof rows }).rows ?? rows;
    for (const r of list as unknown as { confirmed_count: number; capacity: number; actual: number }[]) {
      expect(r.confirmed_count).toBe(r.actual);
      expect(r.confirmed_count).toBeLessThanOrEqual(r.capacity);
    }
  });

  it("has one full and one near-full event for testing", async () => {
    const evs = await d.select().from(S.events);
    expect(evs.some((e) => e.confirmedCount === e.capacity)).toBe(true);
    expect(evs.some((e) => e.capacity - e.confirmedCount === 1)).toBe(true);
    expect(evs.some((e) => e.feePaise > 0)).toBe(true);
    expect(evs.some((e) => e.teamsEnabled)).toBe(true);
    expect(evs.some((e) => e.mode === "ONLINE")).toBe(true);
  });

  it("creates the 7 demo accounts with a valid bcrypt password", async () => {
    for (const u of DEMO_USERS) {
      const [row] = await d.select().from(S.users).where(eq(S.users.email, u.email));
      expect(row, u.email).toBeTruthy();
      expect(row.role).toBe(u.role);
      expect(await bcrypt.compare(DEMO_PASSWORD, row.passwordHash)).toBe(true);
    }
    expect(DEMO_USERS).toHaveLength(7);
  });

  it("seeds social data: communities, accepted connection with a conversation, pending requests", async () => {
    expect(first.communities).toBeGreaterThanOrEqual(15);
    const statuses = await d.selectDistinct({ s: S.connectionRequests.status }).from(S.connectionRequests);
    expect(statuses.map((s) => s.s).sort()).toEqual(["ACCEPTED", "DECLINED", "PENDING"]);
    expect(first.messages).toBeGreaterThanOrEqual(6);
  });
});

describe("worker housekeeping SQL", () => {
  it("is valid against the real schema (runs on PGlite)", async () => {
    const d = await setupTestDb();
    await seedDatabase(d, { bcryptCost: 4 });
    // same statements as scripts/worker.ts runOnce
    await d.execute(sql`update events set status = 'COMPLETED' where status = 'PUBLISHED' and end_at < now()`);
    await d.execute(sql`update volunteer_roles set status = 'CLOSED' where status = 'OPEN' and deadline is not null and deadline < now()`);
    await d.execute(sql`update participation_opportunities set status = 'CLOSED' where status = 'OPEN' and deadline is not null and deadline < now()`);
    await d.execute(sql`update events e set confirmed_count = c.n from (select e2.id, (select count(*)::int from registrations r where r.event_id = e2.id and r.status = 'CONFIRMED') as n from events e2) c where e.id = c.id and e.confirmed_count <> c.n`);
  });
});
