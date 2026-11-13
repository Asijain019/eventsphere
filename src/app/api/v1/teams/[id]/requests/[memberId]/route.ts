import { route, ok, parseBody } from "@/lib/api";
import { respondSchema } from "@/modules/events/schemas";
import { respondToRequest } from "@/modules/events/teams";

/** Captain accepts / rejects a join request. Body: { action: "accept" | "reject" } */
export const POST = route(async (req, { params }, user) => {
  const b = await parseBody(req, respondSchema);
  return ok(await respondToRequest(user!.id, params.id, params.memberId, b.action));
}, { auth: true });
