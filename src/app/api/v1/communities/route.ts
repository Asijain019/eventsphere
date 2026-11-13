import { route, parseBody, parseQuery, ok } from "@/lib/api";
import { createCommunitySchema, listCommunitiesSchema } from "@/modules/communities/schemas";
import { createCommunity, listCommunities } from "@/modules/communities/service";

export const GET = route(async (req, _c, user) => ok(await listCommunities(user, parseQuery(req, listCommunitiesSchema))));
export const POST = route(async (req, _c, user) => ok({ community: await createCommunity(user!, await parseBody(req, createCommunitySchema)) }, 201), { auth: true });
