import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { createOpportunitySchema } from "@/modules/participation/schemas";
import { createOpportunity, listEventOpportunities } from "@/modules/participation/service";
export const GET = route(async (_r, { params }, user) => ok({ items: await listEventOpportunities(user!, params.id) }), { roles: ORGANIZER_ROLES });
export const POST = route(async (req, { params }, user) => ok({ opportunity: await createOpportunity(user!, params.id, await parseBody(req, createOpportunitySchema)) }, 201), { roles: ORGANIZER_ROLES });
