import { route, ok, parseBody } from "@/lib/api";
import { inviteSchema, respondSchema } from "@/modules/events/schemas";
import { inviteUser, respondToInvite } from "@/modules/events/teams";

/** Captain invites a user by id. */
export const POST = route(async (req, { params }, user) => {
  const b = await parseBody(req, inviteSchema);
  return ok(await inviteUser(user!.id, params.id, b.userId), 201);
}, { auth: true });
/** Invited user responds. Body: { action: "accept" | "reject" } */
export const PATCH = route(async (req, { params }, user) => {
  const b = await parseBody(req, respondSchema);
  return ok(await respondToInvite(user!.id, params.id, b.action));
}, { auth: true });
