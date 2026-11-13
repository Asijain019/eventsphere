import { and, asc, desc, eq, gte, sql, count } from "drizzle-orm";
import { db, events, cities, colleges, users, eventCategories, venues, communities, communityMembers } from "@/db";
import type { EventListItem } from "@/modules/events/types";

/** Every query is wrapped so a missing/empty DB gives empty arrays and the page renders designed empty states. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch (e) { console.error("[home]", (e as Error).message); return fallback; }
}

function baseSelect() {
  return db.select({
    id: events.id, slug: events.slug, title: events.title, posterUrl: events.posterUrl,
    categoryName: eventCategories.name, categoryColor: eventCategories.color, categorySlug: eventCategories.slug,
    startAt: events.startAt, endAt: events.endAt, registrationDeadline: events.registrationDeadline,
    venueName: venues.name, locality: venues.locality, cityName: cities.name, collegeName: colleges.name, organizerName: users.name,
    feePaise: events.feePaise, capacity: events.capacity, confirmedCount: events.confirmedCount, mode: events.mode,
    status: events.status, isDemo: events.isDemo,
  }).from(events)
    .innerJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .innerJoin(cities, eq(events.cityId, cities.id))
    .innerJoin(users, eq(events.organizerId, users.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(colleges, eq(events.collegeId, colleges.id));
}

const upcoming = (citySlug: string) => and(eq(events.status, "PUBLISHED"), gte(events.endAt, new Date()), eq(cities.slug, citySlug));

export const getCities = () => safe(() => db.select({ slug: cities.slug, name: cities.name }).from(cities).orderBy(asc(cities.name)), [] as { slug: string; name: string }[]);

export const getFeaturedEvents = (city: string, limit = 6) =>
  safe(() => baseSelect().where(upcoming(city)).orderBy(desc(events.popularity), asc(events.startAt)).limit(limit) as Promise<EventListItem[]>, [] as EventListItem[]);

export const getTrendingEvents = (city: string, limit = 4) =>
  safe(() => baseSelect().where(upcoming(city)).orderBy(desc(events.confirmedCount), desc(events.popularity)).limit(limit) as Promise<EventListItem[]>, [] as EventListItem[]);

export const getEventsByCategory = (city: string, categorySlug: string, limit = 4) =>
  safe(() => baseSelect().where(and(upcoming(city), eq(eventCategories.slug, categorySlug))).orderBy(asc(events.startAt)).limit(limit) as Promise<EventListItem[]>, [] as EventListItem[]);

export const getMusicEvents = (city: string, limit = 3) => getEventsByCategory(city, "music-concerts", limit);
export const getHackathons = (city: string, limit = 3) => getEventsByCategory(city, "hackathons", limit);

export const getCategoryCounts = (city: string) =>
  safe(async () => {
    const rows = await db.select({ slug: eventCategories.slug, n: count() }).from(events)
      .innerJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .innerJoin(cities, eq(events.cityId, cities.id))
      .where(upcoming(city)).groupBy(eventCategories.slug);
    return Object.fromEntries(rows.map((r) => [r.slug, Number(r.n)])) as Record<string, number>;
  }, {} as Record<string, number>);

export type HomeCommunity = { slug: string; name: string; description: string; topic: string | null; members: number };
export const getPopularCommunities = (limit = 6) =>
  safe(async () => {
    const rows = await db.select({
      slug: communities.slug, name: communities.name, description: communities.description, topic: communities.topic,
      members: sql<number>`count(${communityMembers.id}) filter (where ${communityMembers.status} = 'ACTIVE')`,
    }).from(communities).leftJoin(communityMembers, eq(communityMembers.communityId, communities.id))
      .where(eq(communities.type, "INTEREST")).groupBy(communities.id).orderBy(desc(sql`count(${communityMembers.id})`)).limit(limit);
    return rows.map((r) => ({ ...r, members: Number(r.members) })) as HomeCommunity[];
  }, [] as HomeCommunity[]);

export const getLiveStats = () =>
  safe(async () => {
    const [[e], [c], [u]] = await Promise.all([
      db.select({ n: count() }).from(events).where(eq(events.status, "PUBLISHED")),
      db.select({ n: count() }).from(colleges),
      db.select({ n: count() }).from(users),
    ]);
    return { events: Number(e.n), colleges: Number(c.n), members: Number(u.n) };
  }, { events: 0, colleges: 0, members: 0 });

export async function getHomeData(city: string) {
  const [cityList, featured, trending, categoryCounts, communityList, stats, hackathons, music] = await Promise.all([
    getCities(), getFeaturedEvents(city), getTrendingEvents(city), getCategoryCounts(city), getPopularCommunities(),
    getLiveStats(), getHackathons(city), getMusicEvents(city),
  ]);
  return { cityList, featured, trending, categoryCounts, communityList, stats, hackathons, music };
}
