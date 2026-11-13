import { route, ok } from "@/lib/api";
import { setFavourite } from "@/modules/events/registration";

export const POST = route(async (_r, { params }, user) => ok(await setFavourite(user!.id, params.id, true)), { auth: true });
export const DELETE = route(async (_r, { params }, user) => ok(await setFavourite(user!.id, params.id, false)), { auth: true });
