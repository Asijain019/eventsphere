import { route, ok } from "@/lib/api";
import { removeConnection } from "@/modules/connections/service";
export const DELETE = route(async (_r, { params }, user) => { await removeConnection(user!.id, params.userId); return ok({ ok: true }); }, { auth: true });
