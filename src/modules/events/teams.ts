import { and, asc, desc, eq, ne, sql, inArray, gte, ilike, or, count, type SQL } from "drizzle-orm";
import { db, teams, teamMembers, events, users, userProfiles, colleges, registrations } from "@/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";
import { teamFiltersSchema } from "./schemas";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Convention: a PENDING team_members row with memberRole = INVITED is an invitation sent by the captain; otherwise it is a join request. */
export const INVITED = "INVITED";

const publicUser = {
  id: users.id, name: users.name, avatarUrl: userProfiles.avatarUrl, skills: userProfiles.skills, collegeName: colleges.name,
};

async function lockTeam(tx: Tx, teamId: string) {
  const [t] = await tx.select().from(teams).where(eq(teams.id, teamId)).for("update");
  if (!t) throw notFound("Team not found");
  return t;
}
const acceptedCount = async (tx: Tx, teamId: string) =>
  (await tx.select({ c: count() }).from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "ACCEPTED"))))[0].c;

async function assertFreeAgent(tx: Tx, eventId: string, userId: string) {
  const [hit] = await tx.select({ name: teams.name }).from(teamMembers).innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "ACCEPTED"), eq(teams.eventId, eventId), ne(teams.status, "DISBANDED"))).limit(1);
  if (hit) throw conflict(`Already in team "${hit.name}" for this event`, "ALREADY_IN_TEAM");
}
const assertEventActive = (ev: typeof events.$inferSelect) => {
  if (ev.status !== "PUBLISHED") throw conflict("This event is not open for teams");
  if (ev.endAt.getTime() < Date.now()) throw conflict("This event has ended");
};

export async function createTeam(userId: string, eventId: string, input: { name: string; description?: string; openRoles?: string[]; maxSize?: number }) {
  const [ev] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!ev) throw notFound("Event not found");
  assertEventActive(ev);
  if (!ev.teamsEnabled) throw badRequest("This event does not support teams");
  const maxSize = input.maxSize ?? ev.maxTeamSize;
  if (maxSize > ev.maxTeamSize) throw badRequest(`Team size cannot exceed ${ev.maxTeamSize} for this event`);
  if (maxSize < 1) throw badRequest("Team size must be at least 1");
  const name = input.name.trim();
  return db.transaction(async (tx) => {
    await assertFreeAgent(tx, eventId, userId);
    const [dup] = await tx.select({ id: teams.id }).from(teams).where(and(eq(teams.eventId, eventId), sql`lower(${teams.name}) = ${name.toLowerCase()}`)).limit(1);
    if (dup) throw conflict("A team with this name already exists for this event", "TEAM_NAME_TAKEN");
    const [t] = await tx.insert(teams).values({ eventId, captainId: userId, name, description: input.description || null, openRoles: input.openRoles ?? [], maxSize, status: maxSize <= 1 ? "COMPLETE" : "FORMING" }).returning();
    await tx.insert(teamMembers).values({ teamId: t.id, userId, memberRole: "Captain", status: "ACCEPTED" });
    return t;
  });
}

export async function listTeams(raw: Record<string, unknown> = {}) {
  const f = teamFiltersSchema.parse(raw);
  const where: SQL[] = [ne(teams.status, "DISBANDED"), eq(events.status, "PUBLISHED"), gte(events.endAt, new Date())];
  if (f.eventId) where.push(or(eq(events.id, f.eventId), eq(events.slug, f.eventId))!);
  if (f.skill) where.push(sql`${f.skill} = any(${teams.openRoles})`);
  if (f.q) where.push(or(ilike(teams.name, `%${f.q}%`), ilike(events.title, `%${f.q}%`))!);
  const memberCount = sql<number>`(select count(*) from team_members tm where tm.team_id = ${teams.id} and tm.status = 'ACCEPTED')`.mapWith(Number);
  if (f.hasOpenSpots) where.push(sql`${teams.status} = 'FORMING' and (select count(*) from team_members tm where tm.team_id = ${teams.id} and tm.status = 'ACCEPTED') < ${teams.maxSize}`);
  const w = and(...where);
  const [items, [{ total }]] = await Promise.all([
    db.select({
      id: teams.id, name: teams.name, description: teams.description, openRoles: teams.openRoles, maxSize: teams.maxSize, status: teams.status, createdAt: teams.createdAt,
      memberCount, eventId: events.id, eventSlug: events.slug, eventTitle: events.title, eventStartAt: events.startAt, eventPoster: events.posterUrl,
      captain: { id: users.id, name: users.name, avatarUrl: userProfiles.avatarUrl },
    }).from(teams).innerJoin(events, eq(teams.eventId, events.id)).innerJoin(users, eq(teams.captainId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id)).where(w).orderBy(desc(teams.createdAt)).limit(f.pageSize).offset((f.page - 1) * f.pageSize),
    db.select({ total: count() }).from(teams).innerJoin(events, eq(teams.eventId, events.id)).where(w),
  ]);
  return { items, total, page: f.page, pageSize: f.pageSize, totalPages: Math.max(1, Math.ceil(total / f.pageSize)) };
}

/** Events that allow teams, for the "new team" form. */
export async function listTeamEvents() {
  return db.select({ id: events.id, slug: events.slug, title: events.title, startAt: events.startAt, minTeamSize: events.minTeamSize, maxTeamSize: events.maxTeamSize })
    .from(events).where(and(eq(events.teamsEnabled, true), eq(events.status, "PUBLISHED"), gte(events.endAt, new Date()))).orderBy(asc(events.startAt));
}

export async function getTeam(teamId: string, viewerId?: string | null) {
  const [t] = await db.select({
    team: teams,
    event: { id: events.id, slug: events.slug, title: events.title, startAt: events.startAt, minTeamSize: events.minTeamSize, maxTeamSize: events.maxTeamSize, status: events.status, posterUrl: events.posterUrl },
  }).from(teams).innerJoin(events, eq(teams.eventId, events.id)).where(eq(teams.id, teamId)).limit(1);
  if (!t) throw notFound("Team not found");
  const rows = await db.select({ memberId: teamMembers.id, status: teamMembers.status, memberRole: teamMembers.memberRole, message: teamMembers.message, joinedAt: teamMembers.joinedAt, ...publicUser })
    .from(teamMembers).innerJoin(users, eq(users.id, teamMembers.userId)).leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(colleges, eq(colleges.id, userProfiles.collegeId)).where(eq(teamMembers.teamId, teamId)).orderBy(asc(teamMembers.joinedAt));
  const strip = (r: (typeof rows)[number]) => ({ id: r.id, name: r.name, avatarUrl: r.avatarUrl, skills: r.skills ?? [], collegeName: r.collegeName });
  const members = rows.filter((r) => r.status === "ACCEPTED").map((r) => ({ ...strip(r), memberRole: r.memberRole, isCaptain: r.id === t.team.captainId }));
  const isCaptain = viewerId === t.team.captainId;
  const mine = viewerId ? rows.find((r) => r.id === viewerId) : undefined;
  const pending = isCaptain ? rows.filter((r) => r.status === "PENDING") : [];
  return {
    ...t.team, event: t.event, members, memberCount: members.length, spotsLeft: Math.max(0, t.team.maxSize - members.length),
    requests: pending.filter((r) => r.memberRole !== INVITED).map((r) => ({ memberId: r.memberId, message: r.message, user: strip(r), createdAt: r.joinedAt })),
    invites: pending.filter((r) => r.memberRole === INVITED).map((r) => ({ memberId: r.memberId, user: strip(r) })),
    viewer: {
      isCaptain, isMember: mine?.status === "ACCEPTED",
      requestPending: mine?.status === "PENDING" && mine.memberRole !== INVITED,
      invited: mine?.status === "PENDING" && mine.memberRole === INVITED,
    },
  };
}
export type TeamDetail = Awaited<ReturnType<typeof getTeam>>;

export async function requestToJoin(userId: string, teamId: string, message?: string) {
  const result = await db.transaction(async (tx) => {
    const t = await lockTeam(tx, teamId);
    const [ev] = await tx.select().from(events).where(eq(events.id, t.eventId)).limit(1);
    assertEventActive(ev);
    if (t.status !== "FORMING") throw conflict("This team is not accepting new members", "TEAM_CLOSED");
    if (t.captainId === userId) throw conflict("You are the captain of this team");
    await assertFreeAgent(tx, t.eventId, userId);
    if ((await acceptedCount(tx, teamId)) >= t.maxSize) throw conflict("This team is full", "TEAM_FULL");
    const [existing] = await tx.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))).limit(1);
    if (existing?.status === "PENDING") throw conflict("You already have a pending request or invitation for this team", "ALREADY_REQUESTED");
    if (existing) await tx.update(teamMembers).set({ status: "PENDING", memberRole: null, message: message ?? null, joinedAt: new Date() }).where(eq(teamMembers.id, existing.id));
    else await tx.insert(teamMembers).values({ teamId, userId, status: "PENDING", message: message ?? null });
    return t;
  });
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  notify({ userId: result.captainId, type: "TEAM_JOIN_REQUEST", title: `${u?.name ?? "Someone"} wants to join ${result.name}`, body: message, link: `/teams/${teamId}` });
  return { ok: true };
}

export async function respondToRequest(captainId: string, teamId: string, memberId: string, action: "accept" | "reject") {
  const out = await db.transaction(async (tx) => {
    const t = await lockTeam(tx, teamId);
    if (t.captainId !== captainId) throw forbidden("Only the team captain can respond to requests");
    const [m] = await tx.select().from(teamMembers).where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId))).limit(1);
    if (!m || m.status !== "PENDING") throw notFound("Request not found");
    if (action === "reject") {
      await tx.update(teamMembers).set({ status: "DECLINED" }).where(eq(teamMembers.id, memberId));
      return { t, userId: m.userId, accepted: false, full: false };
    }
    if (t.status === "REGISTERED" || t.status === "DISBANDED") throw conflict("This team can no longer change");
    const n = await acceptedCount(tx, teamId);
    if (n >= t.maxSize) throw conflict("Team is full", "TEAM_FULL");
    await assertFreeAgent(tx, t.eventId, m.userId);
    await tx.update(teamMembers).set({ status: "ACCEPTED", joinedAt: new Date() }).where(eq(teamMembers.id, memberId));
    const full = n + 1 >= t.maxSize;
    if (full) await tx.update(teams).set({ status: "COMPLETE" }).where(eq(teams.id, teamId));
    return { t, userId: m.userId, accepted: true, full };
  });
  notify(out.accepted
    ? { userId: out.userId, type: "TEAM_JOIN_ACCEPTED", title: `You joined ${out.t.name}`, body: "Your request was accepted. Say hi to your team!", link: `/teams/${teamId}` }
    : { userId: out.userId, type: "GENERIC", title: `Update on ${out.t.name}`, body: "The captain declined your request to join.", link: "/teams" });
  return { accepted: out.accepted, teamFull: out.full };
}

export async function inviteUser(captainId: string, teamId: string, userId: string) {
  const t = await db.transaction(async (tx) => {
    const t = await lockTeam(tx, teamId);
    if (t.captainId !== captainId) throw forbidden("Only the team captain can invite people");
    if (t.status !== "FORMING") throw conflict("This team is not accepting new members", "TEAM_CLOSED");
    const [target] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!target) throw notFound("User not found");
    if (userId === captainId) throw badRequest("You are already on this team");
    await assertFreeAgent(tx, t.eventId, userId);
    if ((await acceptedCount(tx, teamId)) >= t.maxSize) throw conflict("This team is full", "TEAM_FULL");
    const [existing] = await tx.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))).limit(1);
    if (existing?.status === "PENDING") throw conflict("Already has a pending request or invitation", "ALREADY_REQUESTED");
    if (existing) await tx.update(teamMembers).set({ status: "PENDING", memberRole: INVITED, message: null, joinedAt: new Date() }).where(eq(teamMembers.id, existing.id));
    else await tx.insert(teamMembers).values({ teamId, userId, status: "PENDING", memberRole: INVITED });
    return t;
  });
  notify({ userId, type: "TEAM_INVITE", title: `You're invited to join ${t.name}`, body: "Open the team page to accept or decline.", link: `/teams/${teamId}` });
  return { ok: true };
}

export async function respondToInvite(userId: string, teamId: string, action: "accept" | "reject") {
  const out = await db.transaction(async (tx) => {
    const t = await lockTeam(tx, teamId);
    const [m] = await tx.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))).limit(1);
    if (!m || m.status !== "PENDING" || m.memberRole !== INVITED) throw notFound("Invitation not found");
    if (action === "reject") { await tx.update(teamMembers).set({ status: "DECLINED" }).where(eq(teamMembers.id, m.id)); return { t, accepted: false }; }
    const n = await acceptedCount(tx, teamId);
    if (n >= t.maxSize) throw conflict("Team is full", "TEAM_FULL");
    await assertFreeAgent(tx, t.eventId, userId);
    await tx.update(teamMembers).set({ status: "ACCEPTED", memberRole: null, joinedAt: new Date() }).where(eq(teamMembers.id, m.id));
    if (n + 1 >= t.maxSize) await tx.update(teams).set({ status: "COMPLETE" }).where(eq(teams.id, teamId));
    return { t, accepted: true };
  });
  if (out.accepted) {
    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    notify({ userId: out.t.captainId, type: "TEAM_JOIN_ACCEPTED", title: `${u?.name ?? "Someone"} accepted your invite`, body: `They joined ${out.t.name}.`, link: `/teams/${teamId}` });
  }
  return { accepted: out.accepted };
}

/** Member leaves (or withdraws a pending request). Captain leaving hands over to the longest-standing member, or disbands. */
export async function leaveTeam(userId: string, teamId: string) {
  return db.transaction(async (tx) => {
    const t = await lockTeam(tx, teamId);
    const [m] = await tx.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))).limit(1);
    if (!m) throw notFound("You are not part of this team");
    if (t.status === "REGISTERED" && m.status === "ACCEPTED") throw conflict("The team is registered. Cancel your registration first to leave.", "TEAM_REGISTERED");
    await tx.delete(teamMembers).where(eq(teamMembers.id, m.id));
    if (m.status !== "ACCEPTED") return { left: true, disbanded: false };
    if (t.captainId === userId) {
      const [next] = await tx.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "ACCEPTED"))).orderBy(asc(teamMembers.joinedAt)).limit(1);
      if (!next) { await tx.update(teams).set({ status: "DISBANDED" }).where(eq(teams.id, teamId)); return { left: true, disbanded: true }; }
      await tx.update(teams).set({ captainId: next.userId, status: "FORMING" }).where(eq(teams.id, teamId));
      await tx.update(teamMembers).set({ memberRole: "Captain" }).where(eq(teamMembers.id, next.id));
    } else if (t.status === "COMPLETE") await tx.update(teams).set({ status: "FORMING" }).where(eq(teams.id, teamId));
    return { left: true, disbanded: false };
  });
}

/** Teams relevant to a viewer (captain/member/invited) — used for dashboards and invitation lookup. */
export async function myTeams(userId: string) {
  return db.select({ id: teams.id, name: teams.name, status: teams.status, eventTitle: events.title, eventSlug: events.slug, memberStatus: teamMembers.status, memberRole: teamMembers.memberRole })
    .from(teamMembers).innerJoin(teams, eq(teams.id, teamMembers.teamId)).innerJoin(events, eq(events.id, teams.eventId))
    .where(and(eq(teamMembers.userId, userId), ne(teams.status, "DISBANDED"), inArray(teamMembers.status, ["ACCEPTED", "PENDING"])));
}
