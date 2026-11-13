import { z } from "zod";
export const createCommunitySchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(80),
  description: z.string().trim().min(10, "Describe the community in at least 10 characters").max(1000),
  type: z.enum(["INTEREST", "EVENT"]).default("INTEREST"),
  topic: z.string().max(40).optional(),
  eventId: z.string().optional(),
  joinPolicy: z.enum(["OPEN", "APPROVAL", "REGISTERED_ONLY"]).optional(),
  coverUrl: z.string().max(500).optional(),
});
export const listCommunitiesSchema = z.object({
  type: z.enum(["INTEREST", "EVENT", "COLLEGE"]).optional(),
  topic: z.string().max(40).optional(),
  q: z.string().trim().max(80).optional(),
  eventId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export const createPostSchema = z.object({
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(1, "Write something first").max(4000),
  isAnnouncement: z.boolean().default(false),
});
export const createCommentSchema = z.object({ body: z.string().trim().min(1, "Write something first").max(1500) });
export const memberActionSchema = z.object({ userId: z.string().min(1), action: z.enum(["approve", "remove", "promote", "demote"]) });
