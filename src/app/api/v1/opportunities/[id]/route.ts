import { route, ok } from "@/lib/api";
import { getOpportunity } from "@/modules/participation/service";
export const GET = route(async (_r, { params }, user) => ok({ opportunity: await getOpportunity(params.id, user?.id), loggedIn: !!user }));
