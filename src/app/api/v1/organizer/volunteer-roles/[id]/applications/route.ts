import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { listRoleApplicants } from "@/modules/volunteer/service";
export const GET = route(async (_r, { params }, user) => ok({ items: await listRoleApplicants(user!, params.id) }), { roles: ORGANIZER_ROLES });
