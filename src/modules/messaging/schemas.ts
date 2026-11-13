import { z } from "zod";
export const sendMessageSchema = z.object({ body: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long (max 2000 characters)") });
export const startConversationSchema = z.object({ userId: z.string().min(1) });
export const messagesQuerySchema = z.object({ before: z.string().datetime().optional(), limit: z.coerce.number().int().min(1).max(100).default(40) });
