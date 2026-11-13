import { eq } from "drizzle-orm";
import { db, users, userProfiles } from "@/db";
import { route, parseBody, ok, notFound } from "@/lib/api";
import { profileSchema } from "@/modules/identity/schemas";
import { getMe } from "@/modules/identity/service";

export const GET = route(async (_r, _c, user) => ok({ user: await getMe(user!.id) }), { auth: true });

export const PATCH = route(async (req, _c, user) => {
  const b = await parseBody(req, profileSchema);
  await db.transaction(async (tx) => {
    const u: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (b.name !== undefined) u.name = b.name;
    if (b.homeCityId !== undefined) u.homeCityId = b.homeCityId;
    if (b.discoverable !== undefined) u.discoverable = b.discoverable;
    if (b.profileVisibility !== undefined) u.profileVisibility = b.profileVisibility;
    await tx.update(users).set(u).where(eq(users.id, user!.id));
    const p: Partial<typeof userProfiles.$inferInsert> = {};
    if (b.bio !== undefined) p.bio = b.bio;
    if (b.avatarUrl !== undefined) p.avatarUrl = b.avatarUrl;
    if (b.skills) p.skills = b.skills;
    if (b.interests) p.interests = b.interests;
    if (b.collegeId !== undefined) p.collegeId = b.collegeId;
    if (b.year !== undefined) p.year = b.year;
    if (b.linkedinUrl !== undefined) p.linkedinUrl = b.linkedinUrl || null;
    if (Object.keys(p).length) await tx.insert(userProfiles).values({ userId: user!.id, ...p }).onConflictDoUpdate({ target: userProfiles.userId, set: p });
  });
  const me = await getMe(user!.id);
  if (!me) throw notFound();
  return ok({ user: me });
}, { auth: true });
