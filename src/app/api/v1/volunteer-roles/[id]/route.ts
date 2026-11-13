import { route, ok } from "@/lib/api";
import { getRole } from "@/modules/volunteer/service";
export const GET = route(async (_r, { params }, user) => ok({ role: await getRole(params.id, user?.id), loggedIn: !!user }));
