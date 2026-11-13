import { route, ok, parseBody, parseQuery, ORGANIZER_ROLES } from "@/lib/api";
import { createEventSchema, listEventsQuery } from "@/modules/organizer/schemas";
import { createEvent, listMyEvents } from "@/modules/organizer/service";

export const GET = route(async (req, _c, user) => ok(await listMyEvents(user!, parseQuery(req, listEventsQuery))), { roles: ORGANIZER_ROLES });
export const POST = route(async (req, _c, user) => ok({ event: await createEvent(user!, await parseBody(req, createEventSchema)) }, 201), { roles: ORGANIZER_ROLES });
