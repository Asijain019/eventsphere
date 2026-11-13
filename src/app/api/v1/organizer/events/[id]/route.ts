import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { updateEventSchema } from "@/modules/organizer/schemas";
import { getManagedEvent, updateEvent } from "@/modules/organizer/service";

export const GET = route(async (_r, { params }, user) => ok({ event: await getManagedEvent(user!, params.id) }), { roles: ORGANIZER_ROLES });
export const PATCH = route(async (req, { params }, user) => {
  await updateEvent(user!, params.id, await parseBody(req, updateEventSchema));
  return ok({ event: await getManagedEvent(user!, params.id) });
}, { roles: ORGANIZER_ROLES });
