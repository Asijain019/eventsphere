import { route, ok } from "@/lib/api";
import { withdrawVolunteerApplication } from "@/modules/volunteer/service";
export const DELETE = route(async (_r, { params }, user) => ok({ application: await withdrawVolunteerApplication(user!.id, params.id) }), { auth: true });
