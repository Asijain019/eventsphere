import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { checkInSchema } from "@/modules/organizer/schemas";
import { checkIn } from "@/modules/organizer/service";
export const POST = route(async (req, { params }, user) => ok(await checkIn(user!, params.id, (await parseBody(req, checkInSchema)).ticketReference), 201), { roles: ORGANIZER_ROLES });
