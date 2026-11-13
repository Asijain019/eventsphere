import { route, ok, parseQuery } from "@/lib/api";
import { listOpportunitiesQuery } from "@/modules/participation/schemas";
import { listOpportunities } from "@/modules/participation/service";
export const GET = route(async (req) => ok(await listOpportunities(parseQuery(req, listOpportunitiesQuery))));
