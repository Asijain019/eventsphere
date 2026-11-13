import { route, ok } from "@/lib/api";
import { becomeOrganizer } from "@/modules/organizer/service";
/** MVP self-serve organizer upgrade (stands in for a verification workflow; see docs). */
export const POST = route(async (_r, _c, user) => ok(await becomeOrganizer(user!.id)), { auth: true });
