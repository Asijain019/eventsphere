import { eq } from "drizzle-orm";
import { db, cities, colleges } from "@/db";
import { badRequest } from "@/lib/api";

export async function validateRegistrationReferences(cityId?: string, collegeId?: string): Promise<void> {
  if (cityId) {
    const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, cityId)).limit(1);
    if (!city) throw badRequest("Unknown city");
  }

  if (!collegeId) return;
  const [college] = await db.select({ id: colleges.id, cityId: colleges.cityId }).from(colleges).where(eq(colleges.id, collegeId)).limit(1);
  if (!college) throw badRequest("Unknown college");
  if (cityId && college.cityId !== cityId) throw badRequest("College does not belong to the selected city");
}
