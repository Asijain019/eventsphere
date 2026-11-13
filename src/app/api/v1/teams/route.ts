import { route, ok, parseBody, badRequest } from "@/lib/api";
import { createTeamSchema } from "@/modules/events/schemas";
import { createTeam, listTeams } from "@/modules/events/teams";

export const GET = route(async (req) => ok(await listTeams(Object.fromEntries(new URL(req.url).searchParams))));
/** Convenience create: body must include eventId (same as POST /events/:id/teams). */
export const POST = route(async (req, _c, user) => {
  const b = await parseBody(req, createTeamSchema);
  if (!b.eventId) throw badRequest("eventId is required");
  return ok({ team: await createTeam(user!.id, b.eventId, b) }, 201);
}, { auth: true });
