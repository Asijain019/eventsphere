# Testing

## Automated
```bash
npm test            # Vitest; PGlite = real Postgres engine in-process with the real migrations
npm run lint && npm run typecheck && npm run build
```
Infrastructure tests (`tests/infra`): seed idempotency, consistent `confirmed_count`, demo accounts, health endpoint, worker SQL. Feature suites live next to them in `tests/`.

## Manual end-to-end scripts

Setup: seeded DB (`npm run db:seed`), app running. Password for all demo accounts: `Password123!`. Use two browsers (or one normal + one private window) where two users are needed. Seed state used below: `student` has **no** HackSphere registration; `student3` has no volunteer/participation applications; "Pink City Sunset Sessions" has 1 seat left; "Design Thinking Studio" is full.

### Journey 1 — Attendee
1. `/signup`: create a new student account (or use `student3@eventsphere.dev`). Log out and log in again.
2. Confirm the city selector shows **Jaipur**; switch to Udaipur and back.
3. `/events`: search "hack"; filter category *Music & Concerts*; filter *Free*; filter *Online*; change sort to *Popular*.
4. Open **Old City Photography Walk** → **Register** → confirmation shows a ticket reference and seats left drops by 1.
5. Register again → duplicate is rejected with a clear message.
6. `/my/registrations` shows the registration with status Confirmed; cancel it and re-register.
7. Try **Design Thinking Studio** (full) → waitlist/full message, no seat taken. Favourite an event; it appears under favourites.
8. Last-seat check: with two accounts, register both for **Pink City Sunset Sessions** → only one succeeds (the other gets "full").

### Journey 2 — Organizer
1. Log in as `organizer@eventsphere.dev` → `/organizer`.
2. Create an event (title, category, venue, dates, capacity 5, upload a PNG/JPG poster ≤ 5 MB). Save as draft → confirm it is not visible on `/events` while logged out.
3. Publish → it appears on `/events`.
4. Register 1–2 students; in the dashboard open the event's **Registrations** and verify the list/analytics.
5. Add a **volunteer requirement** (role, openings, shift); log in as `student3`, apply at `/volunteer`; back as organizer accept the applicant and assign a shift.
6. Authorization: log in as `organizer2` and try to open/edit `organizer`'s event → forbidden. Log in as a student and open `/organizer` → redirected/forbidden.

### Journey 3 — Social networking
1. As `student2`, open **Rangotsav Cultural Fest** → its community → **Join**.
2. Event page → attendees (only users with discovery enabled are shown). Send a connection request to a seeded attendee.
3. Messaging gate: try to message that user before acceptance → refused (`NOT_CONNECTED`). `student` ↔ `student2` already have an accepted connection and a conversation at `/messages`.
4. As `student` open `/my/network` → accept the pending request from Ananya Rathore; decline another; message the accepted user.
5. Block a user, confirm they vanish from discovery and cannot message; report a user.

### Journey 4 — Participation & volunteering
1. As `student3`: `/participate` → open **Enter a cricket squad** (Inter-College Cricket Cup) → submit your pitch.
2. `/my/applications` shows status **Submitted**. Log in as `organizer@eventsphere.dev` (owner of the cricket cup) → open the applications for that opportunity and move it **Under review → Shortlisted → Accepted**. Back as `student3` the new status and an in-app notification are visible.
3. As `student3` apply for the volunteer role **Scorer & Match Coordinator** at `/volunteer`; as the organizer accept it and assign a shift; check the status under `/my/applications`.
4. Seed data shows every status: `student2` has an **Accepted** performer application (Pink City Sunset Sessions), `student` has **Under review** and **Shortlisted** ones.

### Journey 5 — Team formation
1. As `student` (captain of **Byte Brigade**, HackSphere): `/teams` → open the team. It has a pending join request from Ananya Rathore; **accept** it.
2. As `student3`: open **Pixel Pirates** (open roles Backend, AI/ML) → **Request to join** with a message. (The captain is a seeded account; to test accept/reject yourself, do step 3.)
3. Full loop with your own accounts: `student3` → `/teams/new` → create a team on HackSphere with required skills *Backend* and *AI/ML*; sign up a fresh account (not already on a HackSphere team) → open the team → **Request to join**; back as `student3` accept the request.
4. When a team has at least 2 members (minimum for HackSphere) the captain registers the whole team; seats drop by the team size and every member gets a ticket under My Registrations.

### Journey 6 — DevOps
1. `docker compose up --build` → http://localhost:3000, log in with a demo account.
2. `docker compose ps` shows `db` and `app` **healthy**; `curl localhost:3000/api/health`.
3. `npm test`, `npm run build` pass locally.
4. Push a branch → GitHub **Actions** run "CI" (both jobs green); open a PR to see checks.
5. Deploy per `docs/DEPLOYMENT.md` and open the Vercel URL.
