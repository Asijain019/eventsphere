import { route, parseBody, ok } from "@/lib/api";
import { sendRequestSchema } from "@/modules/connections/schemas";
import { sendRequest } from "@/modules/connections/service";
export const POST = route(async (req, _c, user) => { const b = await parseBody(req, sendRequestSchema); return ok(await sendRequest(user!.id, b.recipientId, b.message), 201); }, { auth: true });
