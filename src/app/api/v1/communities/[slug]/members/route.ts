import { route, parseBody, ok, parseQuery } from "@/lib/api";
import { z } from "zod";
import { memberActionSchema } from "@/modules/communities/schemas";
import { listMembers, manageMember } from "@/modules/communities/service";
const q = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(24) });
export const GET = route(async (req, { params }, user) => ok(await listMembers(user, params.slug, parseQuery(req, q))));
export const PATCH = route(async (req, { params }, user) => {
  const b = await parseBody(req, memberActionSchema);
  await manageMember(user!, params.slug, b.userId, b.action);
  return ok({ ok: true });
}, { auth: true });
