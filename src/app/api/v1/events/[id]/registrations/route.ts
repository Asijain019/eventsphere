import { route, ok, parseBody } from "@/lib/api";
import { registerSchema } from "@/modules/events/schemas";
import { registerForEvent } from "@/modules/events/registration";

export const POST = route(async (req, { params }, user) => {
  const body = await parseBody(req, registerSchema);
  return ok(await registerForEvent(user!.id, params.id, body), 201);
}, { auth: true });
