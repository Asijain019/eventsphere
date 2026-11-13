import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";

async function main() {
  // Load .env for local runs (real environment variables always win; no .env in Docker/CI is fine).
  try { process.loadEnvFile(); } catch { /* no .env file */ }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url, ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
  await migrate(drizzle(pool), { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  await pool.end();
  console.log("✓ migrations applied");
}
main().catch((e) => { console.error(e); process.exit(1); });
