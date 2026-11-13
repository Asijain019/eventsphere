import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { getCurrentUser, type SessionUser } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "ERROR", public details?: unknown) { super(message); }
}
export const badRequest = (m: string, d?: unknown) => new ApiError(400, m, "BAD_REQUEST", d);
export const unauthorized = (m = "Please log in to continue") => new ApiError(401, m, "UNAUTHORIZED");
export const forbidden = (m = "You do not have permission to do that") => new ApiError(403, m, "FORBIDDEN");
export const notFound = (m = "Not found") => new ApiError(404, m, "NOT_FOUND");
export const conflict = (m: string, code = "CONFLICT") => new ApiError(409, m, code);

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message, code: e.code, details: e.details }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input", code: "VALIDATION", details: e.flatten() }, { status: 400 });
  console.error("[api] unhandled", e);
  return NextResponse.json({ error: "Something went wrong", code: "INTERNAL" }, { status: 500 });
}

type Ctx = { params: Record<string, string> };
type Handler = (req: Request, ctx: Ctx, user: SessionUser | null) => Promise<Response>;

/** Wrap a route handler: consistent error JSON. Pass `{ auth: true }` to require login, `{ roles: [...] }` to restrict roles. */
export function route(handler: Handler, opts: { auth?: boolean; roles?: SessionUser["role"][] } = {}) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const user = await getCurrentUser();
      if ((opts.auth || opts.roles) && !user) throw unauthorized();
      if (opts.roles && user && !opts.roles.includes(user.role) && user.role !== "PLATFORM_ADMIN") throw forbidden();
      return await handler(req, ctx ?? { params: {} }, user);
    } catch (e) { return errorResponse(e); }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try { json = await req.json(); } catch { throw badRequest("Request body must be valid JSON"); }
  return schema.parse(json);
}
export function parseQuery<S extends ZodTypeAny>(req: Request, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}

export const ORGANIZER_ROLES: SessionUser["role"][] = ["ORGANIZER", "COLLEGE_ADMIN", "PLATFORM_ADMIN"];
