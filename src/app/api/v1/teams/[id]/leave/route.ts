import { route, ok } from "@/lib/api";
import { leaveTeam } from "@/modules/events/teams";

export const POST = route(async (_r, { params }, user) => ok(await leaveTeam(user!.id, params.id)), { auth: true });
