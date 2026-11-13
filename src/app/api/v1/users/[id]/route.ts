import { route, ok } from "@/lib/api";
import { getPublicProfile } from "@/modules/connections/profile";
export const GET = route(async (_r, { params }, user) => ok({ profile: await getPublicProfile(user?.id ?? null, params.id) }));
