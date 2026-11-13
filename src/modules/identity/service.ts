import { eq } from "drizzle-orm";
import { db, users, userProfiles, colleges, cities } from "@/db";

/** The signed-in user's own full profile (private fields included). */
export async function getMe(userId: string) {
  const [row] = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role, discoverable: users.discoverable,
    profileVisibility: users.profileVisibility, homeCityId: users.homeCityId, cityName: cities.name,
    bio: userProfiles.bio, avatarUrl: userProfiles.avatarUrl, skills: userProfiles.skills, interests: userProfiles.interests,
    collegeId: userProfiles.collegeId, collegeName: colleges.name, year: userProfiles.year, linkedinUrl: userProfiles.linkedinUrl,
  }).from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .leftJoin(cities, eq(cities.id, users.homeCityId))
    .where(eq(users.id, userId)).limit(1);
  return row ?? null;
}
