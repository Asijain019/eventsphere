/**
 * Seed the database with realistic DEMO data.   Usage:  npm run db:seed   (needs DATABASE_URL, migrations applied first)
 * Idempotent: safe to run repeatedly. Also exports `seedDatabase(db)` for tests (PGlite).
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";
import { DEMO_PASSWORD, DEMO_USERS } from "../src/db/seed-data";

export { seedDatabase };

async function main() {
  // Load .env for local runs (real environment variables always win; no .env in Docker/CI is fine).
  try { process.loadEnvFile(); } catch { /* no .env file */ }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (copy .env.example to .env)");
  const pool = new Pool({ connectionString: url, ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
  try {
    const summary = await seedDatabase(drizzle(pool, { schema }), { log: (m) => console.log("  -", m) });
    console.log("\nSeed complete. Row counts:");
    console.table(summary);
    console.log(`\nDemo accounts (password: ${DEMO_PASSWORD})`);
    for (const u of DEMO_USERS) console.log(`  ${u.role.padEnd(15)} ${u.email.padEnd(32)} ${u.name}`);
    console.log("\nAll seeded events are fictional DEMO data (is_demo = true).");
  } finally { await pool.end(); }
}
// Only run when executed directly (`tsx scripts/seed.ts`), not when imported by tests.
if (/seed\.(ts|js|mjs|cjs)$/.test(process.argv[1] ?? "")) main().catch((e) => { console.error(e); process.exit(1); });
