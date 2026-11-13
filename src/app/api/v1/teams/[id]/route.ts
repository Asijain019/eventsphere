import { route, ok } from "@/lib/api";
import { getTeam } from "@/modules/events/teams";

export const GET = route(async (_r, { params }, user) => ok({ team: await getTeam(params.id, user?.id) }));
