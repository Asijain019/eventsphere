import { route, ok } from "@/lib/api";
import { myApplications } from "@/modules/participation/service";
export const GET = route(async (_r, _c, user) => ok({ items: await myApplications(user!.id) }), { auth: true });
