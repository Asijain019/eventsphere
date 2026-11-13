import { route, ok, parseBody, ORGANIZER_ROLES } from "@/lib/api";
import { volunteerReviewSchema } from "@/modules/volunteer/schemas";
import { reviewVolunteerApplication } from "@/modules/volunteer/service";
export const PATCH = route(async (req, { params }, user) => ok(await reviewVolunteerApplication(user!, params.id, await parseBody(req, volunteerReviewSchema))), { roles: ORGANIZER_ROLES });
