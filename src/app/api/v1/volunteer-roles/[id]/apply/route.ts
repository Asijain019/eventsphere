import { route, ok, parseBody } from "@/lib/api";
import { volunteerApplySchema } from "@/modules/volunteer/schemas";
import { applyForRole } from "@/modules/volunteer/service";
export const POST = route(async (req, { params }, user) => ok({ application: await applyForRole(user!.id, params.id, await parseBody(req, volunteerApplySchema)) }, 201), { auth: true });
