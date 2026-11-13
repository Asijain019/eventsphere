import { z } from "zod";
import { route, ok, ORGANIZER_ROLES } from "@/lib/api";
import { cancelEvent } from "@/modules/organizer/service";
const body = z.object({ reason: z.string().trim().max(500).optional() });
export const POST = route(async (req, { params }, user) => {
  const b = body.parse(await req.json().catch(() => ({})));
  return ok({ event: await cancelEvent(user!, params.id, b.reason) });
}, { roles: ORGANIZER_ROLES });
