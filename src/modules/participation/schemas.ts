import { z } from "zod";

export const OPPORTUNITY_TYPES = ["HACKATHON", "DANCE", "SINGING", "SPORTS", "QUIZ", "OPEN_MIC", "PHOTOGRAPHY", "SPEAKER", "EXHIBITION", "OTHER"] as const;
export const OPPORTUNITY_LABEL: Record<(typeof OPPORTUNITY_TYPES)[number], string> = {
  HACKATHON: "Hackathon", DANCE: "Dance", SINGING: "Singing", SPORTS: "Sports", QUIZ: "Quiz", OPEN_MIC: "Open mic",
  PHOTOGRAPHY: "Photography", SPEAKER: "Speaker", EXHIBITION: "Exhibition", OTHER: "Other",
};
export const APPLICATION_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;

/** Legal organizer-driven transitions for contestant applications. WITHDRAWN/REJECTED are terminal. */
export const APPLICATION_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["REJECTED"],
  REJECTED: [],
  WITHDRAWN: [],
};

export const createOpportunitySchema = z.object({
  type: z.enum(OPPORTUNITY_TYPES),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(3000),
  eligibility: z.string().trim().max(500).nullish(),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(10000).default(50),
  deadline: z.coerce.date().nullish(),
});
export const updateOpportunitySchema = createOpportunitySchema.partial().extend({ status: z.enum(["OPEN", "CLOSED"]).optional() });

export const applySchema = z.object({
  pitch: z.string().trim().min(20, "Tell us a bit more: at least 20 characters").max(3000),
  portfolioUrl: z.string().trim().url("Enter a valid URL (https://...)").max(300).nullish().or(z.literal("").transform(() => null)),
});
export const statusUpdateSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "SHORTLISTED", "ACCEPTED", "REJECTED"]),
  reviewNote: z.string().trim().max(1000).nullish(),
});
export const listOpportunitiesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  city: z.string().trim().max(60).optional(),
  eventId: z.string().max(60).optional(),
  q: z.string().trim().max(80).optional(),
});
