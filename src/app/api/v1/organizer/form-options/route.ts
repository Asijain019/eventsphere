import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { formOptions } from "@/modules/organizer/service";
export const GET = route(async () => ok(await formOptions()), { roles: ORGANIZER_ROLES });
