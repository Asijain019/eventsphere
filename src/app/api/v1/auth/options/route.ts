import { asc } from "drizzle-orm";
import { db, cities, colleges } from "@/db";
import { route, ok } from "@/lib/api";

export const GET = route(async () => {
  const [cityRows, collegeRows] = await Promise.all([
    db.select({ id: cities.id, name: cities.name, slug: cities.slug }).from(cities).orderBy(asc(cities.name)),
    db.select({ id: colleges.id, name: colleges.name, cityId: colleges.cityId }).from(colleges).orderBy(asc(colleges.name)),
  ]);
  return ok({ cities: cityRows, colleges: collegeRows });
});
