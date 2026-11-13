import { defineConfig } from "drizzle-kit";
// Load .env for local runs (real environment variables always win; no .env in Docker/CI is fine).
try { process.loadEnvFile(); } catch { /* no .env file */ }
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://eventsphere:eventsphere@localhost:5432/eventsphere" },
});
