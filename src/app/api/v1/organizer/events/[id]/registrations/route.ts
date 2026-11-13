import { route, ok, parseQuery, ORGANIZER_ROLES } from "@/lib/api";
import { registrationsQuery } from "@/modules/organizer/schemas";
import { listRegistrations, registrationsCsv } from "@/modules/organizer/service";

export const GET = route(async (req, { params }, user) => {
  const q = parseQuery(req, registrationsQuery);
  if (q.format === "csv") {
    const csv = await registrationsCsv(user!, params.id);
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="registrations-${params.id}.csv"`, "cache-control": "no-store" } });
  }
  return ok(await listRegistrations(user!, params.id, q));
}, { roles: ORGANIZER_ROLES });
