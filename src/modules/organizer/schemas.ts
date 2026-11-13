import { z } from "zod";

const assetUrl = z.string().trim().max(600).refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), "Must be an uploaded image or an http(s) URL");

export const scheduleItemSchema = z.object({
  time: z.string().trim().min(1, "Time is required").max(40),
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(300).optional(),
});

export const venueInputSchema = z.object({
  name: z.string().trim().min(2, "Venue name is required").max(120),
  address: z.string().trim().min(3, "Venue address is required").max(250),
  locality: z.string().trim().max(80).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
});

export type Invariants = { startAt: Date; endAt: Date; registrationDeadline?: Date | null; minTeamSize?: number; maxTeamSize?: number };
/** Returns human-readable problems; shared by zod (create) and the service (merged update). */
export function eventInvariantProblems(v: Invariants): string[] {
  const p: string[] = [];
  if (isNaN(v.startAt.getTime()) || isNaN(v.endAt.getTime())) p.push("Start and end must be valid dates");
  else if (v.endAt <= v.startAt) p.push("End time must be after the start time");
  if (v.registrationDeadline && !isNaN(v.startAt.getTime()) && v.registrationDeadline > v.startAt) p.push("Registration deadline must be on or before the event start");
  if (v.minTeamSize !== undefined && v.maxTeamSize !== undefined && v.minTeamSize > v.maxTeamSize) p.push("Minimum team size cannot exceed maximum team size");
  return p;
}

const base = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  categoryId: z.string().min(1, "Choose a category"),
  cityId: z.string().min(1, "Choose a city"),
  venue: venueInputSchema.nullish(),
  mode: z.enum(["OFFLINE", "ONLINE", "HYBRID"]).default("OFFLINE"),
  startAt: z.coerce.date({ error: "Start date is required" }),
  endAt: z.coerce.date({ error: "End date is required" }),
  registrationDeadline: z.coerce.date().nullish(),
  capacity: z.coerce.number().int("Capacity must be a whole number").min(1, "Capacity must be at least 1").max(100000).default(100),
  feePaise: z.coerce.number().int().min(0).max(100000000).default(0),
  eligibility: z.string().trim().max(500).nullish(),
  posterUrl: assetUrl.nullish(),
  gallery: z.array(assetUrl).max(8).default([]),
  schedule: z.array(scheduleItemSchema).max(30).default([]),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  teamsEnabled: z.boolean().default(false),
  minTeamSize: z.coerce.number().int().min(1).max(20).default(1),
  maxTeamSize: z.coerce.number().int().min(1).max(20).default(4),
  collegeId: z.string().nullish(),
});

export const createEventSchema = base.superRefine((v, ctx) => {
  for (const m of eventInvariantProblems(v)) ctx.addIssue({ code: "custom", message: m });
});
export const updateEventSchema = base.partial();
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  body: z.string().trim().min(5, "Message is too short").max(3000),
});
export const checkInSchema = z.object({ ticketReference: z.string().trim().min(3, "Enter a ticket code").max(40) });
export const listEventsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "POSTPONED", "COMPLETED"]).optional(),
  q: z.string().trim().max(80).optional(),
});
export const registrationsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(80).optional(),
  status: z.enum(["CONFIRMED", "WAITLISTED", "CANCELLED"]).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});
