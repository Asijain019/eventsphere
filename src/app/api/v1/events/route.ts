import { route, ok } from "@/lib/api";
import { cleanParams } from "@/modules/events/schemas";
import { listEvents } from "@/modules/events/queries";

export const GET = route(async (req, _c, user) =>
  ok(await listEvents(cleanParams(Object.fromEntries(new URL(req.url).searchParams)), user)));
