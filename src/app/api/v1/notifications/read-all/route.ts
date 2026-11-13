import { route, ok } from "@/lib/api";
import { markRead } from "@/modules/notifications/service";
export const POST = route(async (_r, _c, user) => { await markRead(user!.id); return ok({ ok: true }); }, { auth: true });
