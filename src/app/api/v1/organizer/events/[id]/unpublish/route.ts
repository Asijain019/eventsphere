import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { unpublishEvent } from "@/modules/organizer/service";
export const POST = route(async (_r, { params }, user) => ok({ event: await unpublishEvent(user!, params.id) }), { roles: ORGANIZER_ROLES });
