import { route, ok } from "@/lib/api";
import { blockUser, unblockUser } from "@/modules/connections/service";
export const POST = route(async (_r, { params }, user) => { await blockUser(user!.id, params.id); return ok({ ok: true }); }, { auth: true });
export const DELETE = route(async (_r, { params }, user) => { await unblockUser(user!.id, params.id); return ok({ ok: true }); }, { auth: true });
