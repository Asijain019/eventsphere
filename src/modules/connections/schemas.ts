import { z } from "zod";
export const sendRequestSchema = z.object({ recipientId: z.string().min(1), message: z.string().trim().max(300).optional() });
export const reportSchema = z.object({
  targetType: z.enum(["USER", "POST", "COMMENT", "COMMUNITY", "EVENT", "MESSAGE"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(5, "Please describe the problem (at least 5 characters)").max(1000),
});
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(80).optional(),
});
