import { eq } from "drizzle-orm";
import { db, users, userProfiles } from "@/db";
import { route, parseBody, ok, conflict } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { ApiError } from "@/lib/api";
import { registerSchema } from "@/modules/identity/schemas";

export const POST = route(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60_000)) throw new ApiError(429, "Too many attempts, try again shortly", "RATE_LIMIT");
  const body = await parseBody(req, registerSchema);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
  if (existing) throw conflict("An account with this email already exists", "EMAIL_TAKEN");
  const [u] = await db.insert(users).values({
    name: body.name, email: body.email, passwordHash: await hashPassword(body.password), role: body.role, homeCityId: body.cityId ?? null,
  }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });
  await db.insert(userProfiles).values({ userId: u.id, collegeId: body.collegeId ?? null });
  setSessionCookie(await createSessionToken(u.id));
  return ok({ user: u }, 201);
});
