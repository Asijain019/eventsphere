import { z } from "zod";
import { route, parseBody, ok } from "@/lib/api";
import { cancelRequest, respond } from "@/modules/connections/service";
const body = z.object({ action: z.enum(["accept", "decline"]) });
export const PATCH = route(async (req, { params }, user) => ok(await respond(user!.id, params.id, (await parseBody(req, body)).action === "accept")), { auth: true });
/** Cancel a request you sent. */
export const DELETE = route(async (_r, { params }, user) => { await cancelRequest(user!.id, params.id); return ok({ ok: true }); }, { auth: true });
