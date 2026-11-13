# Deployment

## A. Vercel (public URL)

Nothing has been deployed by the tooling that produced this project. Steps for you:

### 1. Database
Pick one managed PostgreSQL (all have free tiers):
- **Neon** (neon.tech) — copy the pooled connection string (ends with `?sslmode=require`).
- **Supabase** — Project → Settings → Database → Connection string (use the *pooler/transaction* URL on port 6543 for serverless).
- **Vercel Postgres / Neon via Vercel Marketplace** — add from the Vercel dashboard; it injects the URL for you.

### 2. Repository
Push to GitHub following `docs/GIT_WORKFLOW.md`.

### 3. Vercel project
Vercel → **Add New → Project → Import Git Repository**. Framework preset: **Next.js** (also set by `vercel.json`). Leave build/output defaults.

### 4. Environment variables (Project → Settings → Environment Variables; set for Production and Preview)

| Name | Value |
|---|---|
| `DATABASE_URL` | connection string from step 1 |
| `AUTH_SECRET` | output of `openssl rand -base64 32` (different per environment) |
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` (or custom domain) — set, then redeploy because it is inlined at build time |
| `NEXT_PUBLIC_DEFAULT_CITY` | `jaipur` |
| `STORAGE_PROVIDER` | `blob` (Vercel's filesystem is read-only; local uploads cannot work) |
| `BLOB_READ_WRITE_TOKEN` | Storage → Create → **Blob** store → connect to the project (token is injected automatically) |

Image domains for next/image (`*.public.blob.vercel-storage.com`, Unsplash) are already configured in `next.config.mjs`.

### 5. Migrate (and optionally seed) the production database — from your machine
```bash
DATABASE_URL="<production url>" npm run db:migrate
DATABASE_URL="<production url>" npm run db:seed     # optional demo data
```
**Why manual and not in the Vercel build?** (a) Preview deployments would otherwise migrate your production DB; (b) a failed migration would break the build without a rollback story; (c) serverless build containers may not have network access to the DB. For a team workflow, run the command as a deliberate release step (or a GitHub Actions `workflow_dispatch` job you add later).

### 6. Deploy and verify
Deploy (or push to `main`). Checklist:

- [ ] Build succeeded in the Vercel dashboard
- [ ] `GET https://<app>/api/health` → `{"status":"ok","db":true,...}`
- [ ] Home page loads with images; `/events` lists events (needs the seed)
- [ ] Log in as `student@eventsphere.dev` / `Password123!` (if seeded) — then **change or delete demo accounts for a real launch**
- [ ] Register for an event; open My Registrations
- [ ] Log in as organizer, upload a poster (verifies Blob), publish an event
- [ ] No errors in Vercel → Logs
- [ ] Put the live URL into README section 17

### CORS
The API is same-origin (Next.js route handlers), so no CORS configuration is needed. If you later split the API to a separate host, add the `Access-Control-Allow-*` headers and set `NEXT_PUBLIC_APP_URL` accordingly.

## B. Docker (self-hosting / demo laptop)

```bash
docker compose up --build        # http://localhost:3000
```
Set `AUTH_SECRET` in `.env` first for anything reachable by others. Put a reverse proxy (Caddy/Nginx) with TLS in front for a public host, and set `NEXT_PUBLIC_APP_URL` (build arg) to the public URL.

## C. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/api/health` returns 503 `degraded` | `DATABASE_URL` wrong or DB unreachable / SSL missing (`?sslmode=require`) |
| Login works locally but not in prod | Missing/changed `AUTH_SECRET`; sessions signed with an old secret are rejected |
| Upload fails on Vercel | `STORAGE_PROVIDER` not `blob` or token missing |
| `relation "events" does not exist` | Migrations were not run against that database |
