import { z } from "zod";
import { route, parseQuery, ok } from "@/lib/api";
import { listBlocked, listConnections, listRequests } from "@/modules/connections/service";
const q = z.object({ type: z.enum(["connections", "received", "sent", "blocked"]).default("connections") });
export const GET = route(async (req, _c, user) => {
  const { type } = parseQuery(req, q);
  const items = type === "connections" ? await listConnections(user!.id) : type === "blocked" ? await listBlocked(user!.id) : await listRequests(user!.id, type);
  return ok({ type, items });
}, { auth: true });
