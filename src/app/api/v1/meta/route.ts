import { route, ok } from "@/lib/api";
import { getMeta } from "@/modules/events/queries";

export const GET = route(async (req) => ok(await getMeta(new URL(req.url).searchParams.get("city") ?? undefined)));
