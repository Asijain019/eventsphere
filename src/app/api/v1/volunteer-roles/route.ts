import { route, ok, parseQuery } from "@/lib/api";
import { listRolesQuery } from "@/modules/volunteer/schemas";
import { listRoles } from "@/modules/volunteer/service";
export const GET = route(async (req) => ok(await listRoles(parseQuery(req, listRolesQuery))));
