import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDb } from "../helpers/db";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeAll(async () => { await setupTestDb(); });
  it("reports ok when the database is reachable", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
  });
});
