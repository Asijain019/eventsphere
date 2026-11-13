#!/bin/sh
# Container entrypoint: apply DB migrations (idempotent), then start the Next.js standalone server.
# Set RUN_MIGRATIONS=false to skip (e.g. when migrations are run as a separate release step).
set -e
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  MIGRATIONS_DIR=/app/drizzle node /app/migrate/migrate.mjs
fi
exec node server.js
