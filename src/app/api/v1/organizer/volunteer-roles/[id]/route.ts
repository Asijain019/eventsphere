import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { updateRoleSchema } from "@/modules/volunteer/schemas";
import { updateRole } from "@/modules/volunteer/service";
export const PATCH = route(async (req, { params }, user) => ok({ role: await updateRole(user!, params.id, await parseBody(req, updateRoleSchema)) }), { roles: ORGANIZER_ROLES });
