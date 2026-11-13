# EventSphere — build contract (shared by all workstreams)

Stack: Next.js 14 App Router + TypeScript + Tailwind + Framer Motion + lucide-react, **Drizzle ORM + PostgreSQL** (`src/db/schema.ts`
is the source of truth; migration SQL in `/drizzle`), zod validation, JWT session cookie (jose) + bcryptjs, Vitest (+PGlite for DB tests).
(Prisma was replaced by Drizzle because Prisma engine binaries could not be downloaded/verified in the build sandbox.)

## Layering (keep it understandable)
- `src/app/**/page.tsx` — pages (server components fetch via module services; client components call `/api/v1/*` with `api()` from `@/lib/client`).
- `src/app/api/v1/**/route.ts` — thin handlers wrapped with `route()` from `@/lib/api` (auth/roles, zod, JSON errors). NO business logic here.
- `src/modules/<name>/{service.ts,schemas.ts,...}` — business logic + DB access + zod schemas. Services take plain args (userId etc.) so they are unit-testable.
- `src/components/<area>/*` — UI. Shared primitives: `components/ui/{SmartImage,Tilt,Reveal,States}`, `components/events/EventCard`, `components/layout/*`.
- `tests/**/*.test.ts` — Vitest. Use `tests/helpers/db.ts` (`setupTestDb`, `makeUser`, `makeEvent`) = real migrations on in-process Postgres.

## Foundation already written (do not rewrite; extend if really needed)
`src/db/*`, `src/lib/{api,session,auth,notify,ratelimit,storage,utils,images,constants,client}.ts`, `components/layout/{Navbar,Footer}`,
`app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, auth APIs (`/api/v1/auth/*`, `/api/v1/me`), `/api/health`, `modules/identity`, `modules/notifications/service.ts`.

## Conventions
- API errors: throw `badRequest/unauthorized/forbidden/notFound/conflict` (from `@/lib/api`). Success = JSON body. Lists paginate: `?page=1&pageSize=12` → `{ items, total, page, pageSize }`.
- Auth in handlers: `route(handler, { auth: true })` or `{ roles: ORGANIZER_ROLES }`. Resource-level checks (e.g. "owns this event") happen in the service and throw `forbidden()`. PLATFORM_ADMIN bypasses ownership checks.
- Notifications: `notify({userId,type,title,body,link})` from `@/lib/notify` (async queue; never inside a failing path that must roll back).
- Money: `feePaise` ints. Dates: ISO strings over JSON; `Asia/Kolkata` display via `@/lib/utils`. Default city slug: `jaipur` (never hardcode Jaipur in logic — use city slug params).
- Design: dark `bg-ink`, accents violet `#8B35FF`, magenta `#E83EAB`, lime `#D6FF55`, off-white `paper`. Use classes from globals.css (`btn-primary`, `btn-lime`, `btn-ghost`, `input`, `label`, `card`, `glass`, `chip`, `section-title`, `container-x`). Display font = `font-display`. Every page: responsive, loading/empty/error states, no dead buttons (disable + explain instead), accessible labels. Use `Reveal` for scroll reveals, `Tilt` for 3D cards, images via `SmartImage` with `IMG` map from `@/lib/images` (the user's reference images in `/public/assets/ref`).
- Pages that read the DB need `export const dynamic = "force-dynamic"` (no DB at build time).
- Demo accounts (seeded, password `Password123!`): student@eventsphere.dev, student2@eventsphere.dev, student3@eventsphere.dev, organizer@eventsphere.dev, organizer2@eventsphere.dev, collegeadmin@eventsphere.dev, admin@eventsphere.dev.

## Route ownership
| Workstream | Pages | APIs (`/api/v1/...`) | Module dirs |
|---|---|---|---|
| A events | `/events`, `/events/[slug]`, `/my/registrations`, `/teams`, `/teams/new`, `/teams/[id]` | `meta` (cities,colleges,categories), `events` (GET list), `events/[id]` (GET), `events/[id]/registrations` (POST), `me/registrations`, `registrations/[id]` (DELETE), `me/favourites`, `events/[id]/favourite`, `events/[id]/teams`, `teams/**` | `modules/events` (queries, registration, teams) |
| B organizer | `/organizer/**`, `/participate`, `/participate/[opportunityId]`, `/volunteer`, `/volunteer/[roleId]`, `/my/applications` | `organizer/**` (events CRUD/publish/cancel, registrations, analytics, check-in, announcements), `uploads`, `opportunities/**`, `volunteer-roles/**`, `me/participation-applications`, `me/volunteer-applications` | `modules/organizer`, `modules/participation`, `modules/volunteer` |
| C social | `/login`, `/signup`, `/profile`, `/u/[id]`, `/communities`, `/communities/[slug]`, `/my/network`, `/messages`, `/messages/[id]`, `/notifications` | `communities/**`, `events/[id]/attendees`, `connections/**`, `me/connections`, `conversations/**`, `users/[id]/block`, `reports`, `me/notifications`, `notifications/**` | `modules/communities`, `modules/connections`, `modules/messaging`, `modules/notifications` (extend) |
| D marketing | `/`, `/about`, `/contact`, `/help`, `/privacy`, `/terms`, `not-found`, `error`, root `loading` | — | `modules/home`, `components/home/*`, `components/about/*` |
| E devops/docs/seed | — | — | `scripts/seed.ts`, Docker, CI, docs, README, tests for infra |

Cross-workstream calls: organizer UI creates event communities via `POST /api/v1/communities` (C) and announcements via its own API; event page (A) links to `/communities/[slug]` of the event community, `/participate/[opportunityId]` and `/volunteer/[roleId]`; everything links profile avatars/names to `/u/[id]`.
