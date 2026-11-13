import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(["STUDENT", "GENERAL", "ORGANIZER"]).default("STUDENT"), // privileged roles can't be self-assigned
  cityId: z.string().optional(),
  collegeId: z.string().optional(),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().max(500).nullish(),
  avatarUrl: z.string().max(500).nullish(),
  skills: z.array(z.string().max(40)).max(15).optional(),
  interests: z.array(z.string().max(40)).max(15).optional(),
  collegeId: z.string().nullish(),
  homeCityId: z.string().nullish(),
  year: z.string().max(30).nullish(),
  linkedinUrl: z.string().url().max(200).nullish().or(z.literal("")),
  discoverable: z.boolean().optional(),
  profileVisibility: z.enum(["PUBLIC", "CONNECTIONS", "PRIVATE"]).optional(),
});
