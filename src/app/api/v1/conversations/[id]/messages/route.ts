import { route, parseBody, parseQuery, ok } from "@/lib/api";
import { messagesQuerySchema, sendMessageSchema } from "@/modules/messaging/schemas";
import { listMessages, sendMessage } from "@/modules/messaging/service";
export const GET = route(async (req, { params }, user) => ok(await listMessages(user!.id, params.id, parseQuery(req, messagesQuerySchema))), { auth: true });
export const POST = route(async (req, { params }, user) => ok({ message: await sendMessage(user!.id, params.id, (await parseBody(req, sendMessageSchema)).body) }, 201), { auth: true });
