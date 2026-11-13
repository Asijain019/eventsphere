# EventSphere

[![CI](https://github.com/Asijain019/eventsphere/actions/workflows/ci.yml/badge.svg)](https://github.com/Asijain019/eventsphere/actions/workflows/ci.yml)

**Discover. Experience. Connect.**

EventSphere is a city-wide and campus event platform where students can discover events, register individually or as teams, volunteer, find collaborators, and connect with other attendees.

**Live demo:** [eventsphere-rosy-nine.vercel.app](https://eventsphere-rosy-nine.vercel.app/)<br>
**Repository:** [github.com/Asijain019/eventsphere](https://github.com/Asijain019/eventsphere)

> The live demo is populated with fictional sample events and accounts.

## Features

- **Event discovery:** Search and filter by city, college, category, date, price, and format. View event posters, schedules, venue details, capacity, and registration status.
- **Registration:** Register individually or as a team. Capacity checks, waitlists, and registration status are enforced by the server.
- **Organizer tools:** Create, edit, publish, and manage events, registrations, volunteers, participation applications, announcements, and check-in.
- **Teams and participation:** Find teammates, create or join teams, and apply for performer, contestant, or volunteer roles.
- **Communities and connections:** Join interest or event communities, post and comment, and discover attendees by choice. Messaging is available after a connection request is accepted.
- **Accounts and notifications:** Role-based access, profiles, favourites, and in-app notifications.

## Technology

Next.js 14 · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Vitest · Docker

## Architecture

EventSphere is a three-tier modular monolith: a Next.js presentation layer, domain modules and API handlers, and PostgreSQL persistence.

![EventSphere architecture](public/assets/ref/architecture.png)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module boundaries and design decisions.

## Project structure

```text
src/app/          Next.js pages and API routes
src/modules/      Domain services, queries, and validation
src/components/   Shared and feature-specific UI
src/db/           PostgreSQL schema and demo data
drizzle/          SQL migrations
public/assets/    Static images and media
docs/             Architecture, API, testing, and workflow guides
```

## Run locally

Requirements: Node.js 20+, npm, and Docker.

```powershell
git clone https://github.com/Asijain019/eventsphere.git
cd eventsphere
npm ci
Copy-Item .env.example .env
```

Set `AUTH_SECRET` in `.env` to a new random value (generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). The example environment is configured for the local PostgreSQL service.

```powershell
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seed command adds fictional demo records and accounts; omit it if you want an empty database.

## Docker

From the repository root, build and run the app, PostgreSQL, and demo seed:

```powershell
docker compose up --build
```

The app is available at [http://localhost:3000](http://localhost:3000). To rebuild the app container after changing code or public assets, run `docker compose up --build -d app`.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation

[API](docs/API.md) · [Architecture](docs/ARCHITECTURE.md) · [Testing](docs/TESTING.md) · [Git workflow](docs/GIT_WORKFLOW.md)
