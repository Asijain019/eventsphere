import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { createRoleSchema } from "@/modules/volunteer/schemas";
import { createRole, listEventRoles } from "@/modules/volunteer/service";
export const GET = route(async (_r, { params }, user) => ok({ items: await listEventRoles(user!, params.id) }), { roles: ORGANIZER_ROLES });
export const POST = route(async (req, { params }, user) => ok({ role: await createRole(user!, params.id, await parseBody(req, createRoleSchema)) }, 201), { roles: ORGANIZER_ROLES });
