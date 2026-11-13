import { route, ok } from "@/lib/api";
import { joinCommunity, leaveCommunity } from "@/modules/communities/service";
export const POST = route(async (_r, { params }, user) => ok(await joinCommunity(user!.id, params.slug), 201), { auth: true });
export const DELETE = route(async (_r, { params }, user) => { await leaveCommunity(user!.id, params.slug); return ok({ ok: true }); }, { auth: true });
