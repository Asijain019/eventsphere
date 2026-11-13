import { route, ok } from "@/lib/api";
import { getFavourites } from "@/modules/events/queries";

export const GET = route(async (_r, _c, user) => ok({ items: await getFavourites(user!.id) }), { auth: true });
