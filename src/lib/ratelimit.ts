/** Tiny in-memory fixed-window limiter. Replace store with Redis (REDIS_URL) when running multiple instances. */
const hits = new Map<string, { n: number; reset: number }>();

/**
 * Test-only switch: `RATE_LIMIT_DISABLED=1` turns the limiter off so an end-to-end suite can log in many times
 * from one IP. It is read on every call (no restart-order surprises) and is deliberately IGNORED on a real
 * deployment (`VERCEL_ENV=production`), so a stray variable can never remove brute-force protection there.
 */
export function rateLimitDisabled(env: Record<string, string | undefined> = process.env): boolean {
  const v = env.RATE_LIMIT_DISABLED;
  if (v !== "1" && v !== "true") return false;
  return env.VERCEL_ENV !== "production";
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (rateLimitDisabled()) return true;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
  h.n++; return h.n <= limit;
}
/** Test helper: forget all counters. */
export function resetRateLimits() { hits.clear(); }
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
