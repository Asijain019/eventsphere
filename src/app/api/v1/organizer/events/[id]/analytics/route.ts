import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { eventAnalytics } from "@/modules/organizer/service";
export const GET = route(async (_r, { params }, user) => ok(await eventAnalytics(user!, params.id)), { roles: ORGANIZER_ROLES });
