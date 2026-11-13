import { route, ok, notFound } from "@/lib/api";
import { markOneRead } from "@/modules/notifications/service";
export const PATCH = route(async (_r, { params }, user) => { if (!(await markOneRead(user!.id, params.id))) throw notFound("Notification not found"); return ok({ ok: true }); }, { auth: true });
