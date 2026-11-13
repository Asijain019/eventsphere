import { route, parseBody, ok } from "@/lib/api";
import { startConversationSchema } from "@/modules/messaging/schemas";
import { getOrCreateConversation, listConversations } from "@/modules/messaging/service";
export const GET = route(async (_r, _c, user) => ok({ items: await listConversations(user!.id) }), { auth: true });
/** 403 NOT_CONNECTED unless an accepted connection exists. */
export const POST = route(async (req, _c, user) => ok(await getOrCreateConversation(user!.id, (await parseBody(req, startConversationSchema)).userId), 201), { auth: true });
