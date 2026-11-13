import { z } from "zod";
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(120),
  topic: z.enum(["general", "organizer", "bug", "partnership"]).default("general"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
  website: z.string().max(0).optional(), // honeypot
});
export type ContactInput = z.infer<typeof contactSchema>;
