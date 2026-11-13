import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { announcementSchema } from "@/modules/organizer/schemas";
import { listAnnouncements, publishAnnouncement } from "@/modules/organizer/service";
export const GET = route(async (_r, { params }, user) => ok({ items: await listAnnouncements(user!, params.id) }), { roles: ORGANIZER_ROLES });
export const POST = route(async (req, { params }, user) => ok(await publishAnnouncement(user!, params.id, await parseBody(req, announcementSchema)), 201), { roles: ORGANIZER_ROLES });
