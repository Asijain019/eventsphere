import { route, ok } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session";
export const POST = route(async () => { clearSessionCookie(); return ok({ ok: true }); });
