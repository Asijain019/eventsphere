/**
 * EventSphere background worker (MVP).   Run:  npm run worker     (or `tsx scripts/worker.ts --once` for a single pass / cron)
 *
 * Honest scope: the notification queue itself is IN-PROCESS (src/lib/notify.ts) and drains inside the web server, so this worker
 * is NOT required for the app to function. It performs periodic housekeeping that should not depend on a user request:
 *   1. mark PUBLISHED events whose end time has passed as COMPLETED,
 *   2. close volunteer roles / participation opportunities whose deadline has passed,
 *   3. recompute events.confirmed_count from registrations (self-heals any drift),
 *   4. print a heartbeat.
 * In production you would replace the queue with BullMQ/SQS (Redis is already in docker-compose) and run this as a separate process.
 */
import { Pool } from "pg";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);

export async function runOnce(pool: Pool) {
  const completed = await pool.query(`update events set status = 'COMPLETED', updated_at = now() where status = 'PUBLISHED' and end_at < now()`);
  const roles = await pool.query(`update volunteer_roles set status = 'CLOSED' where status = 'OPEN' and deadline is not null and deadline < now()`);
  const opps = await pool.query(`update participation_opportunities set status = 'CLOSED' where status = 'OPEN' and deadline is not null and deadline < now()`);
  const healed = await pool.query(`update events e set confirmed_count = c.n from (
      select e2.id, (select count(*)::int from registrations r where r.event_id = e2.id and r.status = 'CONFIRMED') as n from events e2
    ) c where e.id = c.id and e.confirmed_count <> c.n`);
  console.log(`[worker] ${new Date().toISOString()} heartbeat: completed=${completed.rowCount} rolesClosed=${roles.rowCount} oppsClosed=${opps.rowCount} countersFixed=${healed.rowCount}`);
}

async function main() {
  // Load .env for local runs (real environment variables always win; no .env in Docker/CI is fine).
  try { process.loadEnvFile(); } catch { /* no .env file */ }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url, max: 2, ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
  const once = process.argv.includes("--once");
  let stop = false;
  for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => { stop = true; });
  do {
    try { await runOnce(pool); } catch (e) { console.error("[worker] pass failed", e); }
    if (once) break;
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  } while (!stop);
  await pool.end();
}
if (/worker\.(ts|js|mjs|cjs)$/.test(process.argv[1] ?? "")) main().catch((e) => { console.error(e); process.exit(1); });
