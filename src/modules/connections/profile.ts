import { eq } from "drizzle-orm";
import { db, users, userProfiles, colleges, cities } from "@/db";
import { notFound } from "@/lib/api";
import { connectionStates, type ConnectionState } from "./service";

export type PublicProfile = {
  id: string; name: string; avatarUrl: string | null; visibility: "FULL" | "MINIMAL"; connection: ConnectionState;
  bio?: string | null; collegeName?: string | null; cityName?: string | null; year?: string | null; skills?: string[]; interests?: string[]; linkedinUrl?: string | null;
  note?: string;
};

/**
 * Privacy-aware profile view. NEVER includes email/phone.
 * PUBLIC -> full to everyone logged in/out; CONNECTIONS -> full only to self and accepted connections; PRIVATE -> minimal card (self sees full).
 * Blocked users (either way) get a 404 so existence isn't leaked.
 */
export async function getPublicProfile(viewerId: string | null, targetId: string): Promise<PublicProfile> {
  const [u] = await db.select({
    id: users.id, name: users.name, visibility: users.profileVisibility, status: users.status, cityName: cities.name,
    bio: userProfiles.bio, avatarUrl: userProfiles.avatarUrl, skills: userProfiles.skills, interests: userProfiles.interests,
    collegeName: colleges.name, year: userProfiles.year, linkedinUrl: userProfiles.linkedinUrl,
  }).from(users).leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .leftJoin(cities, eq(cities.id, users.homeCityId)).where(eq(users.id, targetId)).limit(1);
  if (!u || u.status !== "ACTIVE") throw notFound("Profile not found");
  const connection: ConnectionState = viewerId ? (await connectionStates(viewerId, [targetId])).get(targetId) ?? "NONE" : "NONE";
  if (connection === "BLOCKED_BY") throw notFound("Profile not found");
  const full = connection === "SELF" || u.visibility === "PUBLIC" || (u.visibility === "CONNECTIONS" && connection === "CONNECTED");
  if (!full) {
    return { id: u.id, name: u.name, avatarUrl: u.visibility === "PRIVATE" ? null : u.avatarUrl, visibility: "MINIMAL", connection,
      note: u.visibility === "PRIVATE" ? "This profile is private." : "Connect with this person to see their full profile." };
  }
  return { id: u.id, name: u.name, avatarUrl: u.avatarUrl, visibility: "FULL", connection, bio: u.bio, collegeName: u.collegeName, cityName: u.cityName,
    year: u.year, skills: u.skills ?? [], interests: u.interests ?? [], linkedinUrl: u.linkedinUrl };
}
