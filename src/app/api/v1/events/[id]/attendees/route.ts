import { route, parseQuery, ok } from "@/lib/api";
import { pageSchema } from "@/modules/connections/schemas";
import { discoverAttendees } from "@/modules/connections/service";
/** Opted-in attendees of an event. Viewer must be registered. Returns public-safe fields only. */
export const GET = route(async (req, { params }, user) => ok(await discoverAttendees(user!.id, params.id, parseQuery(req, pageSchema))), { auth: true });
