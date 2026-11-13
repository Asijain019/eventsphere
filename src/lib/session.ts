import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";

export const SESSION_COOKIE = "es_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production");
  return new TextEncoder().encode(s || "dev-only-insecure-secret-change-me");
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
}
export async function verifySessionToken(token: string): Promise<string | null> {
  try { const { payload } = await jwtVerify(token, secret()); return (payload.sub as string) ?? null; } catch { return null; }
}
export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}
export function clearSessionCookie() { cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 }); }

export type SessionUser = { id: string; name: string; email: string; role: typeof users.$inferSelect["role"]; homeCityId: string | null; discoverable: boolean };

/** Current user from the session cookie, or null. Safe to call from server components and route handlers. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = await verifySessionToken(token);
  if (!id) return null;
  const [u] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, homeCityId: users.homeCityId, discoverable: users.discoverable, status: users.status })
    .from(users).where(eq(users.id, id)).limit(1);
  if (!u || u.status !== "ACTIVE") return null;
  const { status: _s, ...rest } = u;
  return rest;
}
