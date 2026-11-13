import { route, parseBody, ok } from "@/lib/api";
import { reportSchema } from "@/modules/connections/schemas";
import { createReport } from "@/modules/connections/service";
export const POST = route(async (req, _c, user) => ok({ report: await createReport(user!.id, await parseBody(req, reportSchema)) }, 201), { auth: true });
