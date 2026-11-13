import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDb, makeUser } from "./helpers/db";
import { users } from "@/db";
import { count } from "drizzle-orm";

describe("test harness", () => {
  let d: Awaited<ReturnType<typeof setupTestDb>>;
  beforeAll(async () => { d = await setupTestDb(); });
  it("applies migrations to PGlite and can write", async () => {
    await makeUser(d);
    const [r] = await d.select({ n: count() }).from(users);
    expect(Number(r.n)).toBe(1);
  });
});
