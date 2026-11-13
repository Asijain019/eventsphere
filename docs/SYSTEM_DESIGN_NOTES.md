# System design — presentation talking points

**Problem.** Event information is scattered across college posters, WhatsApp groups and Instagram; there is no city-wide place to discover events, register, find teammates/volunteers or meet co-attendees.

**Architecture in one sentence.** A three-tier **modular monolith** (Next.js UI + `/api/v1`, PostgreSQL, async notification queue) — microservices were rejected as unnecessary operational cost for an MVP and a 3-person team, but module seams make later extraction possible.

## Decisions and trade-offs
| Topic | Decision | Trade-off |
|---|---|---|
| Monolith vs microservices | Modular monolith | Simpler transactions/deploys; scales vertically first, split later |
| SQL vs NoSQL | PostgreSQL | Strong relations/constraints for registrations, teams, connections; less schema flexibility |
| ORM | Drizzle (Prisma not installable in the sandbox) | Plain-SQL migrations and full type-safety; smaller ecosystem |
| Seat allocation | Row lock + transaction (`FOR UPDATE`) | Serialises per event (fine at campus scale); correctness over raw throughput |
| Read performance | Denormalised `confirmed_count`, indexes on (city, start, status) | Counter must be maintained transactionally (it is; worker can heal) |
| Notifications | In-process async queue | Not durable across crashes / multi-instance → swap for BullMQ+Redis |
| Sessions | Stateless signed JWT in httpOnly cookie | Cheap horizontal scaling; revocation needs a denylist (not built) |
| Privacy | Opt-in discovery, messaging only after accepted connection, blocks, reports | Slower networking, but safer for students |
| Uploads | Storage abstraction: local (dev) / Vercel Blob (prod) | Serverless FS is read-only, so provider switch required |
| Payments | Out of scope (price display only) | Documented future integration |

## Consistency model
Strong: seats, duplicate registration/application/connection, authorization. Eventual: notifications, popularity, housekeeping.

## Scalability story
Stateless app → add instances; Postgres read replicas for discovery; Redis for shared rate limiting + cache of hot lists + BullMQ; CDN for images; extract notifications/messaging first.

## Security checklist
bcrypt hashes · httpOnly signed cookie · Zod validation on every body/query · RBAC in wrapper + ownership in services · rate-limited login · upload type/size checks · no secrets in repo/images (`.env.example` only) · private contact data never exposed.

## DevOps story
Branch per feature → PR → CI (lint, types, tests on PGlite, build, Docker build) → merge → Vercel auto-deploy; Docker Compose for local parity; migrations as an explicit release step.

## Honest limitations to volunteer in Q&A
No payment gateway · single-instance queue/rate limiter · no WebSockets · demo data is fictional · Docker/CI/Vercel runs must be confirmed on your own machine/account.

## Likely questions
- *What happens if two users take the last seat?* Row lock; second gets 409 / waitlist.
- *Why not microservices?* Cost/complexity vs benefit at this scale; seams exist.
- *How do you protect privacy?* See above; enforced server-side, not just hidden in UI.
- *How would it scale 100×?* See scalability story.
