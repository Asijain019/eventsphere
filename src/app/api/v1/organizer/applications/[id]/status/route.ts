import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { statusUpdateSchema } from "@/modules/participation/schemas";
import { updateApplicationStatus } from "@/modules/participation/service";
export const PATCH = route(async (req, { params }, user) => {
  const b = await parseBody(req, statusUpdateSchema);
  return ok({ application: await updateApplicationStatus(user!, params.id, b.status, b.reviewNote) });
}, { roles: ORGANIZER_ROLES });
