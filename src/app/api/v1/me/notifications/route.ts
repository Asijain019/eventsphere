import { z } from "zod";
import { route, parseQuery, ok } from "@/lib/api";
import { listNotificationsPaged } from "@/modules/notifications/service";
const q = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(30), unreadOnly: z.enum(["true", "false"]).optional() });
export const GET = route(async (req, _c, user) => { const p = parseQuery(req, q); return ok(await listNotificationsPaged(user!.id, { ...p, unreadOnly: p.unreadOnly === "true" })); }, { auth: true });
