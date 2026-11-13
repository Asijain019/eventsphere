import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { route, parseBody, ok, ApiError } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { loginSchema } from "@/modules/identity/schemas";

export const POST = route(async (req) => {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 60_000)) throw new ApiError(429, "Too many attempts, try again shortly", "RATE_LIMIT");
  const { email, password } = await parseBody(req, loginSchema);
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || u.status !== "ACTIVE" || !(await verifyPassword(password, u.passwordHash))) throw new ApiError(401, "Incorrect email or password", "BAD_CREDENTIALS");
  setSessionCookie(await createSessionToken(u.id));
  return ok({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});
