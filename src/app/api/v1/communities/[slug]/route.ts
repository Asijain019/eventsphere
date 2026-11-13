import { route, ok } from "@/lib/api";
import { getCommunity } from "@/modules/communities/service";
export const GET = route(async (_r, { params }, user) => ok({ community: await getCommunity(user, params.slug) }));
