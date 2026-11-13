import { route, ok } from "@/lib/api";
import { listMyRegistrations } from "@/modules/events/registration";

export const GET = route(async (_r, _c, user) => ok(await listMyRegistrations(user!.id)), { auth: true });
