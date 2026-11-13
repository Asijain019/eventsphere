import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const g = globalThis as unknown as { __db?: DB; __pool?: Pool };

/** Postgres via node-postgres. Tests can call `setDb()` with a PGlite-backed instance. */
export function getDb(): DB {
  if (!g.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__pool = new Pool({ connectionString: url, max: 10, ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
    g.__db = drizzlePg(g.__pool, { schema });
  }
  return g.__db;
}
export function setDb(db: unknown) { g.__db = db as DB; }

/** Lazy proxy so modules can `import { db }` without connecting at import time (important for `next build`). */
export const db: DB = new Proxy({} as DB, { get: (_t, p) => (getDb() as any)[p] });
export * from "./schema";
export { schema };
