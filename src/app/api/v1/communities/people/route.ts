import { route, ok } from "@/lib/api";
import { similarPeople } from "@/modules/communities/service";
/** People with at least one shared interest (opt-in discoverable users only, public-safe fields). */
export const GET = route(async (_r, _c, user) => ok({ items: await similarPeople(user!.id) }), { auth: true });
