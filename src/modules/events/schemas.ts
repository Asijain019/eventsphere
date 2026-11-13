import { z } from "zod";
import { SKILLS } from "@/lib/constants";

/** Strip empty values / take first of arrays so URL searchParams can be fed straight in. */
export function cleanParams(raw: Record<string, string | string[] | undefined | null>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (typeof s === "string" && s.trim() !== "") out[k] = s.trim();
  }
  return out;
}

export const eventFiltersSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().max(60).optional(),
  city: z.string().max(60).optional(), // slug, or "all"
  college: z.string().max(80).optional(), // id or slug
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  preset: z.enum(["today", "this-week", "this-month"]).optional(),
  fee: z.enum(["free", "paid"]).optional(),
  mode: z.string().transform((s) => s.toUpperCase()).pipe(z.enum(["OFFLINE", "ONLINE", "HYBRID"])).optional(),
  sort: z.enum(["upcoming", "popular", "newest"]).default("upcoming"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
export type EventFilters = z.input<typeof eventFiltersSchema>;

export const registerSchema = z.object({
  type: z.enum(["ATTENDEE", "TEAM"]).default("ATTENDEE"),
  teamId: z.string().min(1).optional(),
});

const skill = z.enum(SKILLS as unknown as [string, ...string[]]);
export const createTeamSchema = z.object({
  eventId: z.string().min(1).optional(), // body or route param
  name: z.string().trim().min(2, "Team name must be at least 2 characters").max(60),
  description: z.string().trim().max(600).optional(),
  openRoles: z.array(skill).max(10).default([]),
  maxSize: z.coerce.number().int().min(1).max(20).optional(),
});
export const joinTeamSchema = z.object({ message: z.string().trim().max(400).optional() });
export const respondSchema = z.object({ action: z.enum(["accept", "reject"]) });
export const inviteSchema = z.object({ userId: z.string().min(1) });
export const teamFiltersSchema = z.object({
  eventId: z.string().optional(),
  skill: z.string().max(40).optional(),
  hasOpenSpots: z.enum(["true", "false", "1", "0"]).optional().transform((v) => v === "true" || v === "1"),
  q: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
