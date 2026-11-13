import { route, ok, parseBody } from "@/lib/api";
import { applySchema } from "@/modules/participation/schemas";
import { applyToOpportunity } from "@/modules/participation/service";
export const POST = route(async (req, { params }, user) => ok({ application: await applyToOpportunity(user!.id, params.id, await parseBody(req, applySchema)) }, 201), { auth: true });
