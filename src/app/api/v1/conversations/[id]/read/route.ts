import { route, ok } from "@/lib/api";
import { markRead } from "@/modules/messaging/service";
export const POST = route(async (_r, { params }, user) => { await markRead(user!.id, params.id); return ok({ ok: true }); }, { auth: true });
