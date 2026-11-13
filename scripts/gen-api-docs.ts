/**
 * Regenerates docs/API.md by scanning src/app/api/**\/route.ts.   Usage:  npm run docs:api   (or: npx tsx scripts/gen-api-docs.ts)
 * Access level is inferred from the `route(handler, { auth | roles })` options of each exported method.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src/app/api");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === "route.ts" ? [path.join(dir, e.name)] : []));
}

type Row = { method: string; url: string; access: string; group: string };
const rows: Row[] = [];
for (const file of walk(ROOT)) {
  const url = "/api/" + path.relative(ROOT, path.dirname(file)).split(path.sep).filter(Boolean).map((s) => s.replace(/^\[(.+)\]$/, ":$1")).join("/");
  const src = fs.readFileSync(file, "utf8");
  const parts = src.split(/(?=^export (?:const|async function|function) )/m);
  for (const part of parts) {
    const m = part.match(/^export (?:const|async function|function) (GET|POST|PUT|PATCH|DELETE)\b/);
    if (!m) continue;
    const roles = part.match(/roles:\s*([A-Z_]+|\[[^\]]*\])/);
    const access = roles ? (roles[1] === "ORGANIZER_ROLES" ? "Organizer / college admin / platform admin" : `Roles: ${roles[1]}`) : /auth:\s*true/.test(part) ? "Logged-in user" : "Public (or optional session)";
    const seg = url.replace(/^\/api\/(v1\/)?/, "").split("/")[0] || "health";
    rows.push({ method: m[1], url: url.replace(/\/$/, ""), access, group: seg });
  }
}
rows.sort((a, b) => a.group.localeCompare(b.group) || a.url.localeCompare(b.url) || METHODS.indexOf(a.method) - METHODS.indexOf(b.method));

const groups = [...new Set(rows.map((r) => r.group))];
let md = `# EventSphere HTTP API

> GENERATED FILE - do not edit by hand. Regenerate with \`npm run docs:api\` (\`npx tsx scripts/gen-api-docs.ts\`) after adding or changing routes.
> ${rows.length} endpoints across ${groups.length} resource groups.

## Conventions

- Base path \`/api/v1\` (plus \`/api/health\`). Request and response bodies are JSON; dates are ISO-8601 strings.
- Auth is a signed, httpOnly JWT session cookie set by \`POST /api/v1/auth/login\` or \`/register\`. Role checks happen in the \`route()\` wrapper; resource-level ownership checks (e.g. "you own this event", "you are a captain") happen in the module services and return \`403\`.
- Success: JSON body. Lists are paginated: \`?page=1&pageSize=12\` -> \`{ items, total, page, pageSize }\`.
- Errors: \`{ "error": string, "code": string, "details"?: any }\` with HTTP status 400 (validation), 401 (not logged in), 403 (forbidden), 404, 409 (conflict, e.g. event full / duplicate registration), 429 (rate limited) or 500.

`;
for (const g of groups) {
  md += `## ${g}\n\n| Method | Endpoint | Access |\n|---|---|---|\n`;
  for (const r of rows.filter((x) => x.group === g)) md += `| ${r.method} | \`${r.url}\` | ${r.access} |\n`;
  md += "\n";
}
fs.writeFileSync(path.resolve(process.cwd(), "docs/API.md"), md);
console.log(`docs/API.md written (${rows.length} endpoints)`);
