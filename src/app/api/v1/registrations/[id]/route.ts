import { route, ok } from "@/lib/api";
import { cancelRegistration } from "@/modules/events/registration";

export const DELETE = route(async (_r, { params }, user) => ok(await cancelRegistration(user!.id, params.id)), { auth: true });
