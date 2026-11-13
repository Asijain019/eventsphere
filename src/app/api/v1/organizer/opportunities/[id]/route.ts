import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { updateOpportunitySchema } from "@/modules/participation/schemas";
import { updateOpportunity } from "@/modules/participation/service";
export const PATCH = route(async (req, { params }, user) => ok({ opportunity: await updateOpportunity(user!, params.id, await parseBody(req, updateOpportunitySchema)) }), { roles: ORGANIZER_ROLES });
