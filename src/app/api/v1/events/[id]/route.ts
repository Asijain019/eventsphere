import { route, ok } from "@/lib/api";
import { getEvent } from "@/modules/events/queries";

/** `id` may be the event id or slug. Drafts are only visible to their organizer / platform admin. */
export const GET = route(async (_r, { params }, user) => ok({ event: await getEvent(params.id, user) }));
