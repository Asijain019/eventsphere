/**
 * Demo-data seeder (library). `scripts/seed.ts` is the CLI wrapper; tests call `seedDatabase(pgliteDb)` directly.
 *
 * IDEMPOTENT: every row gets a deterministic id derived from a stable key (`sid()`) and is inserted with
 * `ON CONFLICT DO NOTHING`; parents that have natural unique keys (city/category/college slug, user email, event slug,
 * community slug) are resolved back from the database. Running the seed twice therefore adds nothing, and it never
 * deletes or overwrites real (non-demo) data. Counters (`confirmed_count`, `popularity`) are recomputed from the
 * actual rows on every run so they always agree with the registrations table.
 *
 * ALL EVENTS ARE FICTIONAL DEMO DATA (`is_demo = true`).
 */
import bcrypt from "bcryptjs";
import { sql, count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import * as S from "./schema";
import { CATEGORIES } from "../lib/constants";
import { slugify } from "../lib/utils";
import {
  CITY_ROWS, COLLEGE_ROWS, ORGANIZATION_ROWS, VENUE_ROWS, DEMO_USERS, EXTRA_USERS, EVENT_ROWS, TEAM_ROWS, OPPORTUNITY_ROWS, VOLUNTEER_ROWS,
  INTEREST_COMMUNITIES, COMMENT_SNIPPETS, MESSAGE_THREAD, DEMO_PASSWORD, galleryFor, type UserRow,
} from "./seed-data";

type AnyDb = any;

const HOUR = 3600e3, DAY = 864e5, IST = 5.5 * HOUR;
const sid = (ns: string, key: string) => `seed_${ns}_${key}`;

/** Wall-clock IST time `days` from today (minutes optional) as a UTC Date. */
function at(days: number, hour = 0, minute = 0, now = Date.now()): Date {
  const d = new Date(now + days * DAY + IST);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute) - IST);
}
function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export type SeedSummary = Record<string, number>;
export type SeedOptions = { bcryptCost?: number; log?: (m: string) => void };

export async function seedDatabase(db: AnyDb, opts: SeedOptions = {}): Promise<SeedSummary> {
  const log = opts.log ?? (() => {});
  const now = Date.now();
  const rand = mulberry32(20240607);
  const ins = async (table: PgTable, rows: unknown[]) => {
    for (let i = 0; i < rows.length; i += 200) await db.insert(table).values(rows.slice(i, i + 200)).onConflictDoNothing();
  };

  // ---- cities, categories, colleges (resolve ids by slug) ----
  await ins(S.cities, CITY_ROWS.map((c) => ({ id: sid("city", c.slug), ...c })));
  const cityId: Record<string, string> = Object.fromEntries((await db.select().from(S.cities)).map((c: { slug: string; id: string }) => [c.slug, c.id]));

  await ins(S.eventCategories, CATEGORIES.map((c) => ({ id: sid("cat", c.slug), ...c })));
  const catId: Record<string, string> = Object.fromEntries((await db.select().from(S.eventCategories)).map((c: { slug: string; id: string }) => [c.slug, c.id]));

  await ins(S.colleges, COLLEGE_ROWS.map((c) => ({
    id: sid("college", c.key), name: c.name, slug: slugify(c.name), cityId: cityId.jaipur, website: c.website, verificationStatus: "VERIFIED" as const,
  })));
  const collegeId: Record<string, string> = {};
  const collegeRows = await db.select().from(S.colleges);
  for (const c of COLLEGE_ROWS) collegeId[c.key] = collegeRows.find((r: { slug: string }) => r.slug === slugify(c.name))!.id;
  log(`cities/categories/colleges ready`);

  // ---- users ----
  const hash = bcrypt.hashSync(DEMO_PASSWORD, opts.bcryptCost ?? 10);
  const allUsers: UserRow[] = [...DEMO_USERS, ...EXTRA_USERS];
  await ins(S.users, allUsers.map((u) => ({
    id: sid("user", u.key), name: u.name, email: u.email, passwordHash: hash, role: u.role, homeCityId: cityId[u.city],
    profileVisibility: "PUBLIC", discoverable: u.discoverable,
  })));
  const userRows = await db.select({ id: S.users.id, email: S.users.email }).from(S.users);
  const uid: Record<string, string> = {};
  for (const u of allUsers) uid[u.key] = userRows.find((r: { email: string }) => r.email === u.email)!.id;
  await ins(S.userProfiles, allUsers.map((u) => ({
    userId: uid[u.key], bio: u.bio, skills: u.skills, interests: u.interests, collegeId: u.college ? collegeId[u.college] : null, year: u.year ?? null,
  })));
  await ins(S.userRoles, allUsers.map((u) => ({ id: sid("urole", u.key), userId: uid[u.key], role: u.role, scopeId: u.role === "COLLEGE_ADMIN" && u.college ? collegeId[u.college] : null })));
  await ins(S.collegeMembers, allUsers.filter((u) => u.college).map((u) => ({
    id: sid("cmem", u.key), userId: uid[u.key], collegeId: collegeId[u.college!], role: u.role === "COLLEGE_ADMIN" ? "ADMIN" : u.role === "ORGANIZER" ? "ORGANIZER" : "MEMBER",
  })));
  log(`users ready (${allUsers.length})`);

  // ---- organizations, venues ----
  await ins(S.organizations, ORGANIZATION_ROWS.map((o) => ({
    id: sid("org", o.key), name: o.name, slug: slugify(o.name), type: o.type, collegeId: o.college ? collegeId[o.college] : null, createdById: uid[o.owner], verificationStatus: "VERIFIED" as const,
  })));
  const orgRows = await db.select({ id: S.organizations.id, slug: S.organizations.slug }).from(S.organizations);
  const orgId = (key: string) => orgRows.find((r: { slug: string }) => r.slug === slugify(ORGANIZATION_ROWS.find((o) => o.key === key)!.name))?.id as string | undefined;
  await ins(S.venues, VENUE_ROWS.map((v) => ({
    id: sid("venue", v.key), name: v.name, address: v.address, locality: v.locality, cityId: cityId[v.city ?? "jaipur"], latitude: v.lat, longitude: v.lng,
  })));

  // ---- events ----
  type EvInfo = { id: string; slug: string; row: (typeof EVENT_ROWS)[number]; start: Date };
  const ev: Record<string, EvInfo> = {};
  const eventInserts = EVENT_ROWS.map((e) => {
    const start = at(e.day, e.hour);
    const slug = slugify(e.title);
    const id = sid("event", e.key);
    ev[e.key] = { id, slug, row: e, start };
    return {
      id, slug, title: e.title, description: e.desc, organizerId: uid[e.org], collegeId: e.college ? collegeId[e.college] : null,
      organizationId: e.orgz ? orgId(e.orgz) ?? null : null, categoryId: catId[e.cat], venueId: sid("venue", e.venue), cityId: cityId[e.city ?? "jaipur"],
      mode: e.mode ?? "OFFLINE", startAt: start, endAt: new Date(start.getTime() + e.hours * HOUR),
      registrationDeadline: new Date(start.getTime() - 2 * HOUR), capacity: e.cap, confirmedCount: 0, feePaise: (e.fee ?? 0) * 100,
      eligibility: e.elig ?? null, posterUrl: e.poster!, schedule: e.schedule.map(([time, title, description]) => ({ time, title, ...(description ? { description } : {}) })),
      tags: e.tags, teamsEnabled: !!e.teams, minTeamSize: e.teams?.[0] ?? 1, maxTeamSize: e.teams?.[1] ?? 4,
      status: "PUBLISHED" as const, isDemo: true, popularity: 0,
    };
  });
  await ins(S.events, eventInserts);
  // resolve ids by slug in case an event with this slug already existed under another id
  const evRows = await db.select({ id: S.events.id, slug: S.events.slug }).from(S.events);
  for (const k of Object.keys(ev)) ev[k].id = evRows.find((r: { slug: string }) => r.slug === ev[k].slug)!.id;
  await ins(S.eventMedia, EVENT_ROWS.flatMap((e) => galleryFor(e.cat, e.poster!).map((url, i) => ({ id: sid("media", `${e.key}:${i}`), eventId: ev[e.key].id, url, type: "IMAGE", order: i }))));
  log(`events ready (${EVENT_ROWS.length})`);

  // ---- teams ----
  const teamId: Record<string, string> = {};
  await ins(S.teams, TEAM_ROWS.map((t) => {
    teamId[t.key] = sid("team", t.key);
    return { id: teamId[t.key], eventId: ev[t.event].id, captainId: uid[t.captain], name: t.name, description: t.description, openRoles: t.open, maxSize: t.max, status: t.status };
  }));
  await ins(S.teamMembers, TEAM_ROWS.flatMap((t) => [
    { id: sid("tm", `${t.key}:${t.captain}`), teamId: teamId[t.key], userId: uid[t.captain], memberRole: "Captain", status: "ACCEPTED" as const },
    ...t.members.map(([u, role]) => ({ id: sid("tm", `${t.key}:${u}`), teamId: teamId[t.key], userId: uid[u], memberRole: role, status: "ACCEPTED" as const })),
    ...(t.pending ?? []).map(([u, message]) => ({ id: sid("tm", `${t.key}:${u}`), teamId: teamId[t.key], userId: uid[u], memberRole: null, message, status: "PENDING" as const })),
  ]));

  // ---- registrations ----
  type Reg = { status: "CONFIRMED" | "WAITLISTED" | "CANCELLED"; type: "ATTENDEE" | "TEAM"; team?: string };
  const regs: Record<string, Map<string, Reg>> = Object.fromEntries(Object.keys(ev).map((k) => [k, new Map()]));
  const add = (e: string, u: string, r: Partial<Reg> = {}) => { if (!regs[e].has(u)) regs[e].set(u, { status: "CONFIRMED", type: "ATTENDEE", ...r }); };
  // registered teams -> TEAM registrations for every accepted member
  for (const t of TEAM_ROWS.filter((x) => x.status === "REGISTERED")) for (const u of [t.captain, ...t.members.map((m) => m[0])]) add(t.event, u, { type: "TEAM", team: t.key });
  // explicit demo-account registrations (student3 and a few events are left unregistered on purpose so journeys can be tested)
  for (const [e, u] of [["rangotsav", "student"], ["nextjs", "student"], ["raag", "student"], ["sunset", "student2"], ["rangotsav", "student2"], ["dancebattle", "student2"], ["aisummit", "student3"], ["devops", "student3"]] as const) add(e, u);
  // near-full (1 seat left) and full (+1 waitlisted) events
  const extras = EXTRA_USERS.map((u) => u.key);
  for (const u of extras) add("sunset", u);
  extras.slice(0, 20).forEach((u) => add("designstudio", u));
  add("designstudio", "u21", { status: "WAITLISTED" });
  add("nextjs", "u2", { status: "CANCELLED" });
  // pseudo-random attendees for everything else (not for team-only events or the special events above)
  const pool = [...extras, "organizer2"];
  for (const [k, e] of Object.entries(ev)) {
    if (e.row.teams || ["sunset", "designstudio"].includes(k)) continue;
    const n = Math.min(Math.floor(4 + rand() * 18), e.row.cap - 1);
    const shuffled = [...pool].sort(() => rand() - 0.5).filter((u) => u !== e.row.org);
    for (const u of shuffled) { if ([...regs[k].values()].filter((r) => r.status === "CONFIRMED").length >= n) break; add(k, u); }
  }
  const userKeys = Object.keys(uid);
  const regRows = Object.entries(regs).flatMap(([k, m], ei) => [...m.entries()].map(([u, r]) => ({
    id: sid("reg", `${k}:${u}`), eventId: ev[k].id, userId: uid[u], type: r.type, status: r.status,
    ticketReference: `ES-${(ei + 1).toString(36).toUpperCase().padStart(2, "0")}${(userKeys.indexOf(u) + 1).toString(36).toUpperCase().padStart(2, "0")}S`,
    teamId: r.team ? teamId[r.team] : null, registeredAt: new Date(now - Math.floor((1 + rand() * 20) * DAY * 0.5)),
  })));
  await ins(S.registrations, regRows);
  // verification-friendly check-in for nothing (events are in the future)

  // ---- favourites ----
  const fav: [string, string][] = [
    ["student", "hacksphere"], ["student", "bass"], ["student", "aisummit"], ["student", "raag"],
    ["student2", "sunset"], ["student2", "bass"], ["student2", "photowalk"], ["student2", "artexpo"],
    ["student3", "devops"], ["student3", "valorant"], ["student3", "codestorm"],
  ];
  for (const u of extras) { fav.push([u, EVENT_ROWS[Math.floor(rand() * EVENT_ROWS.length)].key], [u, EVENT_ROWS[Math.floor(rand() * EVENT_ROWS.length)].key]); }
  const favSeen = new Set<string>();
  await ins(S.favourites, fav.filter(([u, e]) => !favSeen.has(u + e) && favSeen.add(u + e)).map(([u, e]) => ({ userId: uid[u], eventId: ev[e].id })));

  // ---- recompute counters from real rows (keeps confirmedCount consistent even when real users also registered) ----
  await db.execute(sql`update events set confirmed_count = (select count(*)::int from registrations r where r.event_id = events.id and r.status = 'CONFIRMED') where is_demo = true`);
  await db.execute(sql`update events set popularity = confirmed_count * 5 + (select count(*)::int from favourites f where f.event_id = events.id) * 3 where is_demo = true`);

  // ---- participation ----
  const oppId: Record<string, string> = {};
  await ins(S.participationOpportunities, OPPORTUNITY_ROWS.map((o) => {
    oppId[o.key] = sid("opp", o.key);
    return { id: oppId[o.key], eventId: ev[o.event].id, type: o.type as never, title: o.title, description: o.description, eligibility: o.eligibility ?? null, capacity: o.capacity, deadline: at(o.deadlineDays, 23, 59), status: "OPEN" as const };
  }));
  const pitchFor = (type: string, who: string) => `${who} here. ${{
    HACKATHON: "We want to build a working AI prototype for campus life; I bring two hackathon wins and a strong frontend portfolio.",
    SINGING: "Acoustic set of 4 songs, mix of originals and covers. Recordings on request.", OPEN_MIC: "A 5-minute spoken-word piece on growing up in a small town.",
    DANCE: "Hip-hop and contemporary fusion crew, 4 years of competition experience.", QUIZ: "Strong in history, current affairs and sports, quizzing since school.",
    SPORTS: "Our squad has played three inter-college tournaments and won two.", PHOTOGRAPHY: "Street photography portfolio focusing on Jaipur's heritage lanes.",
    SPEAKER: "Early-stage startup with 200 pilot users and a clear problem statement.", EXHIBITION: "Mixed-media series on urban life, six pieces ready for display.", OTHER: "Two years of mixing experience at college events.",
  }[type] ?? "Excited to take part."}`;
  const apps: [string, string, string][] = [
    ["student", "photo-contest", "UNDER_REVIEW"], ["student", "pitch-slot", "SHORTLISTED"], ["student2", "sunset-acts", "ACCEPTED"], ["student2", "art-exhibit", "SUBMITTED"],
    ["u1", "openmic-slots", "ACCEPTED"], ["u2", "openmic-slots", "SUBMITTED"], ["u3", "openmic-slots", "REJECTED"], ["u4", "openmic-slots", "WITHDRAWN"],
    ["u5", "dance-crew", "SHORTLISTED"], ["u6", "dance-crew", "SUBMITTED"], ["u7", "sunset-acts", "REJECTED"], ["u8", "quiz-teams", "SUBMITTED"],
    ["u9", "cricket-squad", "ACCEPTED"], ["u10", "dj-slots", "UNDER_REVIEW"], ["u11", "pitch-slot", "ACCEPTED"], ["u12", "hack-main", "SUBMITTED"],
  ];
  const typeOf = (k: string) => OPPORTUNITY_ROWS.find((o) => o.key === k)!.type;
  await ins(S.participationApplications, apps.map(([u, o, status], i) => ({
    id: sid("papp", `${o}:${u}`), opportunityId: oppId[o], userId: uid[u], pitch: pitchFor(typeOf(o), allUsers.find((x) => x.key === u)!.name),
    portfolioUrl: i % 3 === 0 ? `https://example.com/portfolio/${u}` : null, status: status as never, reviewNote: status === "REJECTED" ? "Thanks for applying - we had very limited slots this time." : status === "ACCEPTED" ? "Welcome aboard! Details will follow." : null,
    submittedAt: new Date(now - (i + 1) * 5 * HOUR),
  })));

  // ---- volunteering ----
  const roleId: Record<string, string> = {};
  await ins(S.volunteerRoles, VOLUNTEER_ROWS.map((r) => {
    roleId[r.key] = sid("vrole", r.key);
    const base = at(ev[r.event].row.day, 0, 0, now).getTime();
    return { id: roleId[r.key], eventId: ev[r.event].id, title: r.title, description: r.description, responsibilities: r.responsibilities, skillsRequired: r.skills, openings: r.openings,
      shiftStart: new Date(base + r.startH * HOUR), shiftEnd: new Date(base + r.endH * HOUR), shiftLabel: r.shift, eligibility: r.eligibility ?? "College students 18+", deadline: at(r.deadlineDays, 23, 59), status: "OPEN" as const };
  }));
  const vapps: [string, string, string][] = [
    ["student", "cricket-score", "SUBMITTED"], ["student2", "sunset-stage", "ACCEPTED"], ["u1", "hack-reg", "ACCEPTED"], ["u2", "hack-reg", "SUBMITTED"], ["u3", "hack-mentor", "UNDER_REVIEW"],
    ["u4", "rang-crowd", "ACCEPTED"], ["u5", "rang-crowd", "ACCEPTED"], ["u6", "rang-crowd", "SUBMITTED"], ["u7", "clean-lead", "ACCEPTED"], ["u8", "clean-photo", "SHORTLISTED"],
    ["u9", "blood-desk", "SUBMITTED"], ["u10", "blood-desk", "REJECTED"], ["u11", "cricket-score", "ACCEPTED"], ["u12", "clean-lead", "WITHDRAWN"],
  ];
  await ins(S.volunteerApplications, vapps.map(([u, r, status], i) => ({
    id: sid("vapp", `${r}:${u}`), roleId: roleId[r], userId: uid[u], status: status as never, appliedAt: new Date(now - (i + 1) * 3 * HOUR),
    motivation: "I have volunteered at college fests before and love being part of the team behind the scenes. Reliable, punctual and happy to take any shift.",
  })));
  await ins(S.volunteerAssignments, vapps.filter((a) => a[2] === "ACCEPTED").map(([u, r]) => {
    const row = VOLUNTEER_ROWS.find((x) => x.key === r)!;
    const base = at(ev[row.event].row.day, 0, 0, now).getTime();
    return { id: sid("vasg", `${r}:${u}`), applicationId: sid("vapp", `${r}:${u}`), shiftLabel: row.shift, shiftStart: new Date(base + row.startH * HOUR), shiftEnd: new Date(base + row.endH * HOUR), completion: "PENDING" as const };
  }));

  // ---- communities (interest + event) ----
  const members = (topic: string) => allUsers.filter((u) => u.interests.includes(topic)).map((u) => u.key);
  const cmemRows: unknown[] = [], postRows: unknown[] = [], commentRows: unknown[] = [], announceRows: unknown[] = [], commRows: unknown[] = [];
  const addCommunity = (c: { slug: string; name: string; description: string; type: "INTEREST" | "EVENT"; owner: string; eventId?: string; policy: "OPEN" | "REGISTERED_ONLY"; topic?: string; cover?: string | null },
    mem: string[], posts: { title: string | null; body: string; announcement?: boolean; by?: string }[]) => {
    const cid = sid("comm", c.slug);
    commRows.push({ id: cid, slug: c.slug, name: c.name, description: c.description, type: c.type, ownerId: uid[c.owner], eventId: c.eventId ?? null, joinPolicy: c.policy, coverUrl: c.cover ?? null, topic: c.topic ?? null });
    const uniq = [...new Set([c.owner, ...mem])];
    uniq.forEach((u) => cmemRows.push({ id: sid("cm", `${c.slug}:${u}`), communityId: cid, userId: uid[u], role: u === c.owner ? "OWNER" : "MEMBER", status: "ACTIVE" }));
    posts.forEach((p, i) => {
      const pid = sid("post", `${c.slug}:${i}`);
      const author = p.by ?? (p.announcement ? c.owner : uniq[(i * 3 + 1) % uniq.length]);
      postRows.push({ id: pid, communityId: cid, authorId: uid[author], title: p.title, body: p.body, isAnnouncement: !!p.announcement, createdAt: new Date(now - (i + 1) * 9 * HOUR - Math.floor(rand() * 4 * HOUR)) });
      if (!p.announcement) for (let j = 0; j < (i === 0 ? 3 : 1); j++) {
        const commenter = uniq[(i * 5 + j * 2 + 2) % uniq.length];
        commentRows.push({ id: sid("cmt", `${c.slug}:${i}:${j}`), postId: pid, authorId: uid[commenter], body: COMMENT_SNIPPETS[(i + j * 3 + c.slug.length) % COMMENT_SNIPPETS.length], createdAt: new Date(now - (i + 1) * 9 * HOUR + (j + 1) * 20 * 60e3) });
      }
    });
  };
  for (const c of INTEREST_COMMUNITIES) {
    const base = new Set([...members(c.topic), ...(c.slug === "coding" ? ["student"] : [])]);
    addCommunity({ slug: c.slug, name: c.name, description: c.description, type: "INTEREST", owner: c.owner, policy: "OPEN", topic: c.topic, cover: c.cover }, [...base], c.posts.map(([title, body]) => ({ title, body })));
  }
  const eventCommunities: [string, "OPEN" | "REGISTERED_ONLY", string, string][] = [
    ["hacksphere", "REGISTERED_ONLY", "Welcome hackers! Problem statements go live 24 hours before kick-off. Carry your college ID.", "Mentor slots are open: ask your questions here."],
    ["sunset", "OPEN", "Gates open at 5 PM sharp. Please carry a valid ID and a light jacket for the evening.", "Who is carpooling from Malviya Nagar?"],
    ["rangotsav", "OPEN", "Day-1 schedule is out. Check the event page for the full line-up.", "Looking for a dance crew for the prelims. Anyone?"],
    ["cricket", "REGISTERED_ONLY", "Fixtures will be published after registrations close. Captains please keep the squad list ready.", "Does the venue provide kit or should we bring our own?"],
    ["pitch", "OPEN", "Shortlisted startups will be notified 3 days before the event.", "Any tips on structuring a 5-minute pitch?"],
    ["photowalk", "OPEN", "Meet at the Hawa Mahal Chowk steps. Wear comfortable shoes.", "Is a tripod allowed in the lanes?"],
    ["nextjs", "OPEN", "Please install Node.js 20 and VS Code before the workshop.", "Will the recording be shared afterwards?"],
  ];
  for (const [k, policy, ann, q] of eventCommunities) {
    const e = ev[k];
    const memberKeys = [...regs[k].entries()].filter(([u, r]) => r.status === "CONFIRMED" && u !== "student").map(([u]) => u);
    const slug = `${e.slug}-community`.slice(0, 80);
    addCommunity({ slug, name: `${e.row.title} Community`, description: `Official community for ${e.row.title}: announcements, questions and team-ups.`, type: "EVENT", owner: e.row.org, eventId: e.id, policy, cover: e.row.poster },
      memberKeys.slice(0, 40), [{ title: "Official update", body: ann, announcement: true }, { title: "Question", body: q }]);
    announceRows.push({ id: sid("ann", k), eventId: e.id, authorId: uid[e.row.org], title: "Official update", body: ann, createdAt: new Date(now - 6 * HOUR) });
  }
  await ins(S.communities, commRows);
  // resolve community ids by slug (defensive), then insert children
  await ins(S.communityMembers, cmemRows); await ins(S.communityPosts, postRows); await ins(S.comments, commentRows); await ins(S.announcements, announceRows);
  log(`communities ready (${commRows.length})`);

  // ---- connections & messaging ----
  const conns: [string, string, "PENDING" | "ACCEPTED" | "DECLINED", string][] = [
    ["student", "student2", "ACCEPTED", "Saw you at the last hackathon!"], ["student2", "u2", "ACCEPTED", "Fellow designer, let's connect."], ["student", "organizer", "ACCEPTED", "Thanks for hosting the cricket cup."],
    ["u1", "student", "PENDING", "Hi Aarav, I'm also going to HackSphere. Let's team up?"], ["u6", "student3", "PENDING", "Hey Rohan, saw you're into ML. Want to connect?"],
    ["student2", "u9", "PENDING", "Hi! Are you attending the Sunset Sessions?"], ["u12", "student2", "DECLINED", "Hello!"],
  ];
  await ins(S.connectionRequests, conns.map(([a, b, status, message], i) => ({
    id: sid("conn", `${a}:${b}`), requesterId: uid[a], recipientId: uid[b], status, message, createdAt: new Date(now - (i + 2) * DAY / 2), respondedAt: status === "PENDING" ? null : new Date(now - (i + 1) * DAY / 2),
  })));
  const convs: [string, string, [string, string][]][] = [
    ["student-student2", "student", MESSAGE_THREAD], ["student2-u2", "student2", [["u2", "Loved your wireframes from the design meet-up!"], ["student2", "Thanks Ishaan, happy to share the Figma file."]]],
  ];
  const pairs = [["student", "student2"], ["student2", "u2"]];
  await ins(S.conversations, convs.map(([k]) => ({ id: sid("conv", k) })));
  await ins(S.conversationMembers, convs.flatMap(([k], i) => pairs[i].map((u) => ({ conversationId: sid("conv", k), userId: uid[u], lastReadAt: u === "student" ? new Date(now - HOUR) : null }))));
  await ins(S.messages, convs.flatMap(([k, , msgs]) => msgs.map(([u, body], i) => ({ id: sid("msg", `${k}:${i}`), conversationId: sid("conv", k), senderId: uid[u], body, createdAt: new Date(now - DAY - (msgs.length - i) * 7 * 60e3) }))));

  // ---- notifications ----
  const N = (k: string, user: string, type: string, title: string, body: string, link: string, read = false, ago = 2) => ({
    id: sid("notif", k), userId: uid[user], type: type as never, title, body, link, readAt: read ? new Date(now - HOUR) : null, createdAt: new Date(now - ago * HOUR),
  });
  await ins(S.notifications, [
    N("s1", "student", "REGISTRATION_CONFIRMED", "You're in! Rangotsav Cultural Fest", "Your ticket is ready in My Registrations.", "/my/registrations", true, 30),
    N("s2", "student", "CONNECTION_REQUEST", "Ananya Rathore sent you a connection request", "Hi Aarav, I'm also going to HackSphere. Let's team up?", "/my/network", false, 3),
    N("s3", "student", "TEAM_JOIN_REQUEST", "A hacker wants to join Byte Brigade", "Review the request on your team page.", "/teams", false, 2),
    N("s4", "student", "CONNECTION_ACCEPTED", "Priya Meena accepted your connection request", "You can now message each other.", "/messages", true, 26),
    N("s5", "student", "ANNOUNCEMENT", "Update from Old City Photography Walk", "Meet at the Hawa Mahal Chowk steps. Wear comfortable shoes.", "/events", false, 6),
    N("p1", "student2", "REGISTRATION_CONFIRMED", "You're in! Pink City Sunset Sessions", "Only a few seats remain for this event.", "/my/registrations", true, 40),
    N("p2", "student2", "APPLICATION_STATUS", "You've been accepted to perform", "Your application for Pink City Sunset Sessions was accepted.", "/my/applications", false, 5),
    N("p3", "student2", "VOLUNTEER_ASSIGNED", "Volunteer shift assigned", "Stage & Artist Hospitality, 16:00-21:00.", "/my/applications", false, 4),
    N("r1", "student3", "CONNECTION_REQUEST", "Simran Chawla wants to connect", "Hey Rohan, saw you're into ML.", "/my/network", false, 8),
    N("r2", "student3", "ANNOUNCEMENT", "Welcome to EventSphere", "Browse events in Jaipur, join communities and find your team.", "/events", false, 50),
    N("o1", "organizer", "GENERIC", "New registrations for Inter-College Cricket Cup", "Your event is attracting teams.", "/organizer", false, 7),
    N("o2", "organizer", "APPLICATION_STATUS", "New participation application", "Review new applications in your dashboard.", "/organizer", false, 12),
  ]);

  // ---- summary ----
  const tables: [string, PgTable][] = [
    ["cities", S.cities], ["colleges", S.colleges], ["categories", S.eventCategories], ["venues", S.venues], ["users", S.users], ["events", S.events], ["registrations", S.registrations],
    ["teams", S.teams], ["teamMembers", S.teamMembers], ["opportunities", S.participationOpportunities], ["opportunityApplications", S.participationApplications],
    ["volunteerRoles", S.volunteerRoles], ["volunteerApplications", S.volunteerApplications], ["communities", S.communities], ["communityPosts", S.communityPosts],
    ["comments", S.comments], ["connections", S.connectionRequests], ["messages", S.messages], ["notifications", S.notifications], ["favourites", S.favourites],
  ];
  const summary: SeedSummary = {};
  for (const [name, t] of tables) { const [r] = await db.select({ n: count() }).from(t); summary[name] = Number(r.n); }
  return summary;
}
