import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";
import * as schema from "@/db/schema";
import { setDb } from "@/db";

/** Spins up an in-process Postgres (PGlite), applies the real SQL migrations and registers it as the app DB. */
export async function setupTestDb() {
  const client = new PGlite();
  const d = drizzle(client, { schema });
  await migrate(d, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  setDb(d);
  return d;
}
let n = 0;
export async function makeUser(d: Awaited<ReturnType<typeof setupTestDb>>, over: Partial<typeof schema.users.$inferInsert> = {}) {
  n++;
  const [u] = await d.insert(schema.users).values({ name: `User ${n}`, email: `u${n}-${Date.now()}@test.dev`, passwordHash: "x", ...over }).returning();
  await d.insert(schema.userProfiles).values({ userId: u.id });
  return u;
}
export async function makeEvent(d: Awaited<ReturnType<typeof setupTestDb>>, organizerId: string, over: Partial<typeof schema.events.$inferInsert> = {}) {
  let [city] = await d.select().from(schema.cities).limit(1);
  if (!city) [city] = await d.insert(schema.cities).values({ name: "Jaipur", slug: "jaipur", state: "Rajasthan" }).returning();
  let [cat] = await d.select().from(schema.eventCategories).limit(1);
  if (!cat) [cat] = await d.insert(schema.eventCategories).values({ name: "Technology", slug: "technology" }).returning();
  n++;
  const [e] = await d.insert(schema.events).values({
    slug: `evt-${n}-${Date.now()}`, title: `Event ${n}`, description: "desc", organizerId, categoryId: cat.id, cityId: city.id,
    startAt: new Date(Date.now() + 864e5), endAt: new Date(Date.now() + 2 * 864e5), status: "PUBLISHED", capacity: 10, ...over,
  }).returning();
  return e;
}
