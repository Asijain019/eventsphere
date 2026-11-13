# EventSphere — Architecture

## 1. Style: three-tier modular monolith

One deployable Next.js application, internally divided into modules with explicit boundaries, backed by PostgreSQL. A monolith keeps deployment, transactions and debugging simple for a three-person team while the module seams (each with its own `service.ts` + `schemas.ts`) allow extraction into services later.

| Tier | Implementation |
|---|---|
| Presentation | Next.js App Router pages and client components: attendee UI, organizer dashboard (`/organizer/**`), admin-capable views. Server components read through module services; client components call `/api/v1/*`. |
| Application | `src/app/api/v1/**/route.ts` thin handlers wrapped by `route()` + `src/modules/<domain>/service.ts` business logic. |
| Data | PostgreSQL (Drizzle ORM), image storage (local disk in dev / Vercel Blob in prod), optional Redis (future cache / queue / rate limit). |

The supplied reference diagram is `public/assets/ref/architecture.png` (also recreated on the About page).

## 2. Modules

| Module (`src/modules/…`) | Responsibility |
|---|---|
| `identity` | register/login, profile read/update, session user |
| `events` | discovery queries (search, filters, sort, pagination), event detail, favourites, **registration** (transactional capacity), **teams** (Find My Team) |
| `organizer` | event CRUD/publish/cancel, ownership checks, registrations list, analytics, check-in, announcements, uploads |
| `participation` | performer/contestant opportunities and application review workflow |
| `volunteer` | volunteer roles, applications, assignments, completion |
| `communities` | interest + event communities, membership policy, posts, comments |
| `connections` | opt-in attendee discovery, connection requests, blocks, reports |
| `messaging` | conversations/messages — only between accepted connections |
| `notifications` | list/read in-app notifications; `lib/notify.ts` is the producer-side queue |
| `home` | read models for the landing page |

Cross-cutting (`src/lib`): `api.ts` (route wrapper, errors), `session.ts`, `auth.ts`, `ratelimit.ts`, `storage.ts`, `notify.ts`.

## 3. Request flow

```
Browser → /api/v1/events/:id/registrations (POST)
  route():  read session cookie (jose JWT) → 401 if required & missing → role check → 403
  handler:  parseBody(zod)  → 400 on invalid input
  service:  registerForEvent(userId, eventId)
              BEGIN
                SELECT … FROM events WHERE id = $1 FOR UPDATE      -- serialise per event
                checks: published, deadline, duplicate, capacity
                INSERT registration; UPDATE events SET confirmed_count = confirmed_count + 1
              COMMIT
              notify({ REGISTRATION_CONFIRMED })                      -- after commit, fire-and-forget
  route():  ok(json, 201)  | errorResponse(ApiError/ZodError) → {error, code}
```

## 4. Key design decisions

| Decision | Why / consequence |
|---|---|
| Capacity checked **in the database transaction** with a row lock (`FOR UPDATE`) | Two concurrent last-seat requests cannot both succeed; frontend checks are only UX. Over-capacity requests are waitlisted or rejected with `409`. |
| Denormalised `events.confirmed_count` | O(1) "seats left" on cards; kept consistent inside the same transaction, recomputable from `registrations` (the worker and the seed both recompute it). |
| Unique constraints as the last line of defence | `(event_id, user_id)` registration, `(requester, recipient)` connection, `(team, user)` membership, `(opportunity, user)` application. |
| Authorization in two layers | Role gate in `route()`; resource ownership/membership in the service (`forbidden()`), so UI hiding is never the only protection. PLATFORM_ADMIN bypasses ownership. |
| Privacy by default | `users.discoverable` is opt-in; profile visibility enum; messaging requires an `ACCEPTED` connection checked server-side; blocks are honoured in discovery and messaging. |
| Async notifications | `notify()` enqueues in-process and a drain loop batch-inserts. Never inside a transaction that must roll back; failures are logged, never bubbled. Interface is swappable for BullMQ/SQS (Redis profile exists in compose). |
| Eventual consistency where acceptable | Notifications, popularity counters and housekeeping (`scripts/worker.ts`) are eventually consistent; money-like invariants (seats, duplicates) are strongly consistent. |
| Drizzle + SQL migrations | Explicit, reviewable SQL in `drizzle/`; PGlite lets tests run the *same migrations* on a real Postgres engine. |
| Multi-city by data, not code | `cities` table; every query takes a city slug; `NEXT_PUBLIC_DEFAULT_CITY=jaipur` is only a default. |
| Stateless app server | JWT cookie sessions; scales horizontally behind a load balancer (needs Redis for shared rate limiting at that point). |

## 5. Deployment views

- **Vercel**: Next.js serverless functions + managed Postgres + Vercel Blob (see `docs/DEPLOYMENT.md`).
- **Docker**: `app` (standalone Next server, auto-migrates), `db` (Postgres 16), `seed` one-shot, optional `worker` and `redis` profiles (see `docker-compose.yml`).

## 6. Evolution path to services

Natural seams: `notifications` + `messaging` (stateful, push) first; `events/registration` (high-write) second. Each module already exposes a service API and owns its tables conceptually, so extraction means swapping direct calls for HTTP/queue messages.
