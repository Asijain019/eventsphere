import { z } from "zod";

export const createRoleSchema = z.object({
  title: z.string().trim().min(3, "Role name must be at least 3 characters").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  responsibilities: z.string().trim().max(2000).nullish(),
  skillsRequired: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  openings: z.coerce.number().int().min(1, "At least one opening is required").max(1000).default(5),
  shiftStart: z.coerce.date().nullish(),
  shiftEnd: z.coerce.date().nullish(),
  shiftLabel: z.string().trim().max(80).nullish(),
  eligibility: z.string().trim().max(500).nullish(),
  deadline: z.coerce.date().nullish(),
}).superRefine((v, ctx) => {
  if (v.shiftStart && v.shiftEnd && v.shiftEnd <= v.shiftStart) ctx.addIssue({ code: "custom", message: "Shift end must be after shift start", path: ["shiftEnd"] });
});
export const updateRoleSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  responsibilities: z.string().trim().max(2000).nullish(),
  skillsRequired: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  openings: z.coerce.number().int().min(1).max(1000).optional(),
  shiftStart: z.coerce.date().nullish(), shiftEnd: z.coerce.date().nullish(),
  shiftLabel: z.string().trim().max(80).nullish(), eligibility: z.string().trim().max(500).nullish(),
  deadline: z.coerce.date().nullish(), status: z.enum(["OPEN", "CLOSED"]).optional(),
});
export const volunteerApplySchema = z.object({ motivation: z.string().trim().min(20, "Tell us why you want to help: at least 20 characters").max(2000) });

/** Organizer actions on a volunteer application (PATCH body). */
export const volunteerReviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ACCEPT") }),
  z.object({ action: z.literal("REJECT") }),
  z.object({ action: z.literal("ASSIGN_SHIFT"), shiftLabel: z.string().trim().min(1, "Shift label is required").max(80), shiftStart: z.coerce.date().nullish(), shiftEnd: z.coerce.date().nullish() }),
  z.object({ action: z.literal("SET_COMPLETION"), completion: z.enum(["PENDING", "COMPLETED", "NO_SHOW"]) }),
]);
export const listRolesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  city: z.string().trim().max(60).optional(),
  eventId: z.string().max(60).optional(),
  skill: z.string().trim().max(40).optional(),
  q: z.string().trim().max(80).optional(),
});
