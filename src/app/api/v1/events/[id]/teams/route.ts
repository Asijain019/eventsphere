import { route, ok, parseBody } from "@/lib/api";
import { createTeamSchema } from "@/modules/events/schemas";
import { createTeam, listTeams } from "@/modules/events/teams";

export const GET = route(async (req, { params }) => {
  const q = Object.fromEntries(new URL(req.url).searchParams);
  return ok(await listTeams({ ...q, eventId: params.id }));
});
export const POST = route(async (req, { params }, user) => {
  const b = await parseBody(req, createTeamSchema);
  return ok({ team: await createTeam(user!.id, params.id, b) }, 201);
}, { auth: true });
