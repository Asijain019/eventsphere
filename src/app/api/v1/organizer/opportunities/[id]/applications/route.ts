import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { listApplicants } from "@/modules/participation/service";
export const GET = route(async (_r, { params }, user) => ok({ items: await listApplicants(user!, params.id) }), { roles: ORGANIZER_ROLES });
