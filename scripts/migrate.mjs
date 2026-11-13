// Plain-JS migration runner (no TypeScript / tsx needed) used inside the Docker runner image and usable locally:
//   DATABASE_URL=... node scripts/migrate.mjs
// Retries the connection so it is safe to start before Postgres is ready.
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url));
const folder = process.env.MIGRATIONS_DIR ?? (process.cwd().endsWith("migrate") ? path.resolve(process.cwd(), "../drizzle") : path.resolve(process.cwd(), "drizzle"));
void here;

const pool = new pg.Pool({ connectionString: url, max: 1, ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
const attempts = Number(process.env.MIGRATE_RETRIES ?? 20);
for (let i = 1; ; i++) {
  try { await pool.query("select 1"); break; }
  catch (e) {
    if (i >= attempts) { console.error("Database not reachable:", e.message); process.exit(1); }
    console.log(`[migrate] waiting for database (${i}/${attempts})...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
try {
  await migrate(drizzle(pool), { migrationsFolder: folder });
  console.log(`[migrate] migrations applied from ${folder}`);
} catch (e) { console.error("[migrate] failed:", e); process.exit(1); }
finally { await pool.end(); }
