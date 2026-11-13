import { route, ok, parseBody } from "@/lib/api";
import { joinTeamSchema } from "@/modules/events/schemas";
import { requestToJoin } from "@/modules/events/teams";

export const POST = route(async (req, { params }, user) => {
  const b = await parseBody(req, joinTeamSchema);
  return ok(await requestToJoin(user!.id, params.id, b.message), 201);
}, { auth: true });
