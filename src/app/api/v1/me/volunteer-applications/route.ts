import { route, ok } from "@/lib/api";
import { myVolunteerApplications } from "@/modules/volunteer/service";
export const GET = route(async (_r, _c, user) => ok({ items: await myVolunteerApplications(user!.id) }), { auth: true });
