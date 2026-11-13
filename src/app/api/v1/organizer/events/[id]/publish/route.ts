import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { publishEvent } from "@/modules/organizer/service";
export const POST = route(async (_r, { params }, user) => ok({ event: await publishEvent(user!, params.id) }), { roles: ORGANIZER_ROLES });
