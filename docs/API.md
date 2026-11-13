# EventSphere HTTP API

> GENERATED FILE - do not edit by hand. Regenerate with `npm run docs:api` (`npx tsx scripts/gen-api-docs.ts`) after adding or changing routes.
> 94 endpoints across 18 resource groups.

## Conventions

- Base path `/api/v1` (plus `/api/health`). Request and response bodies are JSON; dates are ISO-8601 strings.
- Auth is a signed, httpOnly JWT session cookie set by `POST /api/v1/auth/login` or `/register`. Role checks happen in the `route()` wrapper; resource-level ownership checks (e.g. "you own this event", "you are a captain") happen in the module services and return `403`.
- Success: JSON body. Lists are paginated: `?page=1&pageSize=12` -> `{ items, total, page, pageSize }`.
- Errors: `{ "error": string, "code": string, "details"?: any }` with HTTP status 400 (validation), 401 (not logged in), 403 (forbidden), 404, 409 (conflict, e.g. event full / duplicate registration), 429 (rate limited) or 500.

## auth

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/login` | Public (or optional session) |
| POST | `/api/v1/auth/logout` | Public (or optional session) |
| POST | `/api/v1/auth/register` | Public (or optional session) |

## communities

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/communities` | Public (or optional session) |
| POST | `/api/v1/communities` | Logged-in user |
| GET | `/api/v1/communities/:slug` | Public (or optional session) |
| DELETE | `/api/v1/communities/:slug/comments/:commentId` | Logged-in user |
| POST | `/api/v1/communities/:slug/join` | Logged-in user |
| DELETE | `/api/v1/communities/:slug/join` | Logged-in user |
| GET | `/api/v1/communities/:slug/members` | Public (or optional session) |
| PATCH | `/api/v1/communities/:slug/members` | Logged-in user |
| GET | `/api/v1/communities/:slug/posts` | Public (or optional session) |
| POST | `/api/v1/communities/:slug/posts` | Logged-in user |
| DELETE | `/api/v1/communities/:slug/posts/:postId` | Logged-in user |
| GET | `/api/v1/communities/:slug/posts/:postId/comments` | Public (or optional session) |
| POST | `/api/v1/communities/:slug/posts/:postId/comments` | Logged-in user |
| GET | `/api/v1/communities/people` | Logged-in user |

## connections

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/connections` | Logged-in user |
| PATCH | `/api/v1/connections/:id` | Logged-in user |
| DELETE | `/api/v1/connections/:id` | Logged-in user |
| DELETE | `/api/v1/connections/user/:userId` | Logged-in user |

## contact

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/contact` | Public (or optional session) |

## conversations

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/conversations` | Logged-in user |
| POST | `/api/v1/conversations` | Logged-in user |
| GET | `/api/v1/conversations/:id/messages` | Logged-in user |
| POST | `/api/v1/conversations/:id/messages` | Logged-in user |
| POST | `/api/v1/conversations/:id/read` | Logged-in user |

## events

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/events` | Public (or optional session) |
| GET | `/api/v1/events/:id` | Public (or optional session) |
| GET | `/api/v1/events/:id/attendees` | Logged-in user |
| POST | `/api/v1/events/:id/favourite` | Logged-in user |
| DELETE | `/api/v1/events/:id/favourite` | Logged-in user |
| POST | `/api/v1/events/:id/registrations` | Logged-in user |
| GET | `/api/v1/events/:id/teams` | Public (or optional session) |
| POST | `/api/v1/events/:id/teams` | Logged-in user |

## health

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public (or optional session) |

## me

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/me` | Logged-in user |
| PATCH | `/api/v1/me` | Logged-in user |
| POST | `/api/v1/me/become-organizer` | Logged-in user |
| GET | `/api/v1/me/connections` | Logged-in user |
| GET | `/api/v1/me/favourites` | Logged-in user |
| GET | `/api/v1/me/notifications` | Logged-in user |
| GET | `/api/v1/me/participation-applications` | Logged-in user |
| DELETE | `/api/v1/me/participation-applications/:id` | Logged-in user |
| GET | `/api/v1/me/registrations` | Logged-in user |
| GET | `/api/v1/me/volunteer-applications` | Logged-in user |
| DELETE | `/api/v1/me/volunteer-applications/:id` | Logged-in user |

## meta

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/meta` | Public (or optional session) |

## notifications

| Method | Endpoint | Access |
|---|---|---|
| PATCH | `/api/v1/notifications/:id/read` | Logged-in user |
| POST | `/api/v1/notifications/read-all` | Logged-in user |

## opportunities

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/opportunities` | Public (or optional session) |
| GET | `/api/v1/opportunities/:id` | Public (or optional session) |
| POST | `/api/v1/opportunities/:id/apply` | Logged-in user |

## organizer

| Method | Endpoint | Access |
|---|---|---|
| PATCH | `/api/v1/organizer/applications/:id/status` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events/:id` | Organizer / college admin / platform admin |
| PATCH | `/api/v1/organizer/events/:id` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events/:id/analytics` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events/:id/announcements` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/announcements` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/cancel` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/checkin` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events/:id/opportunities` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/opportunities` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/publish` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events/:id/registrations` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/unpublish` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/events/:id/volunteer-roles` | Organizer / college admin / platform admin |
| POST | `/api/v1/organizer/events/:id/volunteer-roles` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/form-options` | Organizer / college admin / platform admin |
| PATCH | `/api/v1/organizer/opportunities/:id` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/opportunities/:id/applications` | Organizer / college admin / platform admin |
| PATCH | `/api/v1/organizer/volunteer-applications/:id` | Organizer / college admin / platform admin |
| PATCH | `/api/v1/organizer/volunteer-roles/:id` | Organizer / college admin / platform admin |
| GET | `/api/v1/organizer/volunteer-roles/:id/applications` | Organizer / college admin / platform admin |

## registrations

| Method | Endpoint | Access |
|---|---|---|
| DELETE | `/api/v1/registrations/:id` | Logged-in user |

## reports

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/reports` | Logged-in user |

## teams

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/teams` | Public (or optional session) |
| POST | `/api/v1/teams` | Logged-in user |
| GET | `/api/v1/teams/:id` | Public (or optional session) |
| POST | `/api/v1/teams/:id/invite` | Logged-in user |
| PATCH | `/api/v1/teams/:id/invite` | Logged-in user |
| POST | `/api/v1/teams/:id/join` | Logged-in user |
| POST | `/api/v1/teams/:id/leave` | Logged-in user |
| POST | `/api/v1/teams/:id/register` | Logged-in user |
| POST | `/api/v1/teams/:id/requests/:memberId` | Logged-in user |

## uploads

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/uploads` | Logged-in user |

## users

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/users/:id` | Public (or optional session) |
| POST | `/api/v1/users/:id/block` | Logged-in user |
| DELETE | `/api/v1/users/:id/block` | Logged-in user |

## volunteer-roles

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/volunteer-roles` | Public (or optional session) |
| GET | `/api/v1/volunteer-roles/:id` | Public (or optional session) |
| POST | `/api/v1/volunteer-roles/:id/apply` | Logged-in user |
