# syntax=docker/dockerfile:1.7
# EventSphere production image: deps -> build -> slim runner (non-root, healthcheck, auto-migrate on start).
#
# Design note on migrations: Next's standalone output only contains modules it can trace from app code, and `tsx` is a
# devDependency, so the runner cannot run `scripts/migrate.ts`. Instead a tiny separate dependency set (drizzle-orm + pg only,
# stage `migrate-deps`) is installed into /app/migrate together with the plain-JS `scripts/migrate.mjs`. The entrypoint runs it
# before starting the server. Secrets are never baked in: DATABASE_URL / AUTH_SECRET are only supplied at runtime.
ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- install all deps (lockfile-exact) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- minimal deps for the migration runner (versions taken from package.json) ----
FROM base AS migrate-deps
COPY package.json /tmp/package.json
RUN mkdir /migrate && node -e "const p=require('/tmp/package.json');require('fs').writeFileSync('/migrate/package.json',JSON.stringify({name:'migrate',private:true,dependencies:{'drizzle-orm':p.dependencies['drizzle-orm'],pg:p.dependencies.pg}}))" \
 && cd /migrate && npm install --omit=dev --no-audit --no-fund

# ---- build the app (also used by the compose `seed` service because it contains tsx + sources) ----
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_DEFAULT_CITY=jaipur
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL NEXT_PUBLIC_DEFAULT_CITY=$NEXT_PUBLIC_DEFAULT_CITY
# Dummy build-time values only (pages are dynamic and no DB is touched during build). Not present in the final image.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build AUTH_SECRET=build-time-placeholder-not-a-secret npm run build

# ---- slim runtime ----
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
WORKDIR /app
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=migrate-deps --chown=nextjs:nodejs /migrate /app/migrate
COPY --chown=nextjs:nodejs scripts/migrate.mjs /app/migrate/migrate.mjs
COPY --chown=nextjs:nodejs drizzle /app/drizzle
COPY --chown=nextjs:nodejs --chmod=755 docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1
ENTRYPOINT ["/app/docker-entrypoint.sh"]
