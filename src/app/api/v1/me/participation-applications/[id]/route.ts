import { route, ok } from "@/lib/api";
import { withdrawApplication } from "@/modules/participation/service";
/** DELETE = withdraw (status becomes WITHDRAWN; the row is kept for history). */
export const DELETE = route(async (_r, { params }, user) => ok({ application: await withdrawApplication(user!.id, params.id) }), { auth: true });
