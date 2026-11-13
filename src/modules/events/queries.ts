import { and, asc, desc, eq, gte, lte, ilike, or, sql, count, ne, type SQL } from "drizzle-orm";
import {
  db, events, eventCategories, cities, colleges, venues, users, userProfiles, organizations, eventMedia,
  participationOpportunities, volunteerRoles, communities, registrations, favourites,
} from "@/db";
import { DEFAULT_CITY } from "@/lib/constants";
import { notFound } from "@/lib/api";
import { eventFiltersSchema, type EventFilters } from "./schemas";
import type { EventListItem } from "./types";

export type Viewer = { id: string; role?: string } | string | null | undefined;
const viewerOf = (v: Viewer) => (typeof v === "string" ? { id: v, role: undefined } : v ?? null);

// ---------- IST date helpers ----------
const IST = 5.5 * 3600e3, DAY = 864e5;
const istDayStart = (d: Date) => new Date(Math.floor((d.getTime() + IST) / DAY) * DAY - IST);
/** Parse "YYYY-MM-DD" (as an IST day) or full ISO. `end` → end of that day. */
function parseDate(s: string | undefined, end = false): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - IST) : new Date(s);
  if (isNaN(d.getTime())) return null;
  return m && end ? new Date(d.getTime() + DAY - 1) : d;
}
export function presetRange(preset: "today" | "this-week" | "this-month", now = new Date()) {
  const start = istDayStart(now);
  if (preset === "today") return { from: start, to: new Date(start.getTime() + DAY - 1) };
  if (preset === "this-week") {
    const dow = new Date(now.getTime() + IST).getUTCDay();
    return { from: start, to: new Date(start.getTime() + ((7 - dow) % 7 + 1) * DAY - 1) };
  }
  const s = new Date(now.getTime() + IST);
  return { from: start, to: new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 1) - IST - 1) };
}

// ---------- shared list select ----------
function itemSelect(viewerId?: string) {
  return {
    id: events.id, slug: events.slug, title: events.title, posterUrl: events.posterUrl,
    categoryName: eventCategories.name, categoryColor: eventCategories.color, categorySlug: eventCategories.slug,
    startAt: events.startAt, endAt: events.endAt, registrationDeadline: events.registrationDeadline,
    venueName: venues.name, locality: venues.locality, cityName: cities.name, collegeName: colleges.name, organizerName: users.name,
    feePaise: events.feePaise, capacity: events.capacity, confirmedCount: events.confirmedCount, mode: events.mode,
    status: events.status, isDemo: events.isDemo,
    favourited: viewerId
      ? sql<boolean>`exists (select 1 from favourites f where f.event_id = ${events.id} and f.user_id = ${viewerId})`
      : sql<boolean>`false`,
  };
}
function joined(viewerId?: string) {
  return db.select(itemSelect(viewerId)).from(events)
    .innerJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .innerJoin(cities, eq(events.cityId, cities.id))
    .innerJoin(users, eq(events.organizerId, users.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(colleges, eq(events.collegeId, colleges.id));
}

export type EventPage = { items: EventListItem[]; total: number; page: number; pageSize: number; totalPages: number };

export async function listEvents(filters: EventFilters = {}, viewer?: Viewer): Promise<EventPage> {
  const f = eventFiltersSchema.parse(filters);
  const vid = viewerOf(viewer)?.id;
  const now = new Date();
  let from = parseDate(f.from), to = parseDate(f.to, true);
  if (f.preset) { const r = presetRange(f.preset, now); from = r.from; to = r.to; }

  const where: SQL[] = [eq(events.status, "PUBLISHED")];
  const city = f.city ?? DEFAULT_CITY;
  if (city !== "all") where.push(eq(cities.slug, city));
  if (f.category) where.push(eq(eventCategories.slug, f.category));
  if (f.college) where.push(or(eq(colleges.slug, f.college), eq(colleges.id, f.college))!);
  if (f.fee === "free") where.push(eq(events.feePaise, 0));
  if (f.fee === "paid") where.push(sql`${events.feePaise} > 0`);
  if (f.mode) where.push(eq(events.mode, f.mode));
  // overlap semantics: hide events that already ended unless a past window was requested
  where.push(gte(events.endAt, from ?? now));
  if (to) where.push(lte(events.startAt, to));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
    where.push(or(ilike(events.title, like), ilike(events.description, like), sql`array_to_string(${events.tags}, ' ') ilike ${like}`)!);
  }
  const order = f.sort === "popular" ? [desc(events.popularity), desc(events.confirmedCount), asc(events.startAt)]
    : f.sort === "newest" ? [desc(events.createdAt)] : [asc(events.startAt)];

  const w = and(...where);
  const [items, [{ total }]] = await Promise.all([
    joined(vid).where(w).orderBy(...order).limit(f.pageSize).offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(events)
      .innerJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .innerJoin(cities, eq(events.cityId, cities.id))
      .leftJoin(colleges, eq(events.collegeId, colleges.id)).where(w),
  ]);
  return { items: items as EventListItem[], total, page: f.page, pageSize: f.pageSize, totalPages: Math.max(1, Math.ceil(total / f.pageSize)) };
}

export async function getFavourites(userId: string): Promise<EventListItem[]> {
  const rows = await joined(userId).innerJoin(favourites, and(eq(favourites.eventId, events.id), eq(favourites.userId, userId)))
    .orderBy(desc(favourites.createdAt));
  return rows as EventListItem[];
}

export async function getRelatedEvents(eventId: string, limit = 3, viewer?: Viewer): Promise<EventListItem[]> {
  const [e] = await db.select({ categoryId: events.categoryId, cityId: events.cityId }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!e) return [];
  const rows = await joined(viewerOf(viewer)?.id)
    .where(and(eq(events.status, "PUBLISHED"), ne(events.id, eventId), gte(events.endAt, new Date()), or(eq(events.categoryId, e.categoryId), eq(events.cityId, e.cityId))))
    .orderBy(desc(sql`(${events.categoryId} = ${e.categoryId})`), asc(events.startAt)).limit(limit);
  return rows as EventListItem[];
}

// ---------- detail ----------
export async function getEvent(idOrSlug: string, viewer?: Viewer) {
  const v = viewerOf(viewer);
  const [row] = await db.select({
    e: events, category: eventCategories, city: cities, venue: venues,
    college: { id: colleges.id, name: colleges.name, slug: colleges.slug, logoUrl: colleges.logoUrl, verified: sql<boolean>`${colleges.verificationStatus} = 'VERIFIED'` },
    organizer: { id: users.id, name: users.name, avatarUrl: userProfiles.avatarUrl },
    organizationName: organizations.name,
  }).from(events)
    .innerJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .innerJoin(cities, eq(events.cityId, cities.id))
    .innerJoin(users, eq(events.organizerId, users.id))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(colleges, eq(events.collegeId, colleges.id))
    .leftJoin(organizations, eq(events.organizationId, organizations.id))
    .where(or(eq(events.slug, idOrSlug), eq(events.id, idOrSlug))).limit(1);
  if (!row) throw notFound("Event not found");
  const ev = row.e;
  const isOwner = !!v && (v.id === ev.organizerId || v.role === "PLATFORM_ADMIN");
  if (ev.status === "DRAFT" && !isOwner) throw notFound("Event not found");

  const [media, opportunities, volRoles, [community], reg, fav] = await Promise.all([
    db.select().from(eventMedia).where(eq(eventMedia.eventId, ev.id)).orderBy(asc(eventMedia.order)),
    db.select().from(participationOpportunities).where(and(eq(participationOpportunities.eventId, ev.id), eq(participationOpportunities.status, "OPEN"))).orderBy(asc(participationOpportunities.createdAt)),
    db.select().from(volunteerRoles).where(and(eq(volunteerRoles.eventId, ev.id), eq(volunteerRoles.status, "OPEN"))),
    db.select({ id: communities.id, slug: communities.slug, name: communities.name, description: communities.description, joinPolicy: communities.joinPolicy })
      .from(communities).where(and(eq(communities.eventId, ev.id), eq(communities.type, "EVENT"))).limit(1),
    v ? db.select({ id: registrations.id, status: registrations.status, type: registrations.type, ticketReference: registrations.ticketReference, teamId: registrations.teamId })
      .from(registrations).where(and(eq(registrations.eventId, ev.id), eq(registrations.userId, v.id))).limit(1) : Promise.resolve([]),
    v ? db.select().from(favourites).where(and(eq(favourites.eventId, ev.id), eq(favourites.userId, v.id))).limit(1) : Promise.resolve([]),
  ]);
  const myReg = reg[0] && reg[0].status !== "CANCELLED" ? reg[0] : null;
  return {
    ...ev,
    seatsLeft: Math.max(0, ev.capacity - ev.confirmedCount),
    category: row.category, city: row.city, venue: row.venue,
    college: row.college?.id ? row.college : null,
    organizer: row.organizer, organizationName: row.organizationName,
    media, opportunities, volunteerRoles: volRoles, community: community ?? null,
    registration: myReg, favourited: fav.length > 0, isOwner,
  };
}
export const getEventBySlug = getEvent;
export type EventDetail = Awaited<ReturnType<typeof getEvent>>;

// ---------- meta ----------
export async function getMeta(citySlug?: string) {
  const now = new Date();
  const [cityRows, collegeRows, cats] = await Promise.all([
    db.select().from(cities).orderBy(asc(cities.name)),
    db.select({ id: colleges.id, name: colleges.name, slug: colleges.slug, cityId: colleges.cityId, citySlug: cities.slug, logoUrl: colleges.logoUrl, verified: sql<boolean>`${colleges.verificationStatus} = 'VERIFIED'` })
      .from(colleges).innerJoin(cities, eq(colleges.cityId, cities.id)).orderBy(asc(colleges.name)),
    db.select({ id: eventCategories.id, name: eventCategories.name, slug: eventCategories.slug, color: eventCategories.color, icon: eventCategories.icon,
      count: sql<number>`count(${events.id}) filter (where ${events.status} = 'PUBLISHED' and ${events.endAt} >= ${now.toISOString()}::timestamptz ${citySlug && citySlug !== "all" ? sql`and ${cities.slug} = ${citySlug}` : sql``})`.mapWith(Number) })
      .from(eventCategories).leftJoin(events, eq(events.categoryId, eventCategories.id)).leftJoin(cities, eq(events.cityId, cities.id))
      .groupBy(eventCategories.id).orderBy(asc(eventCategories.name)),
  ]);
  return { cities: cityRows, colleges: collegeRows, categories: cats, defaultCity: DEFAULT_CITY };
}
