import { route, ok } from "@/lib/api";
import { registerTeam } from "@/modules/events/registration";

/** Captain registers the whole team for the event. */
export const POST = route(async (_r, { params }, user) => ok(await registerTeam(user!.id, params.id), 201), { auth: true });
