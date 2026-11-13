import { and, count, desc, eq, ilike, or, sql, inArray } from "drizzle-orm";
import { db, communities, communityMembers, communityPosts, comments, users, userProfiles, colleges, events, registrations } from "@/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";
import { slugify } from "@/lib/utils";
import { connectionStates, notBlockedWith, publicUserCols, toPublicUser } from "@/modules/connections/service";

export type Viewer = { id: string; role: string } | null;
const isAdmin = (v: Viewer) => v?.role === "PLATFORM_ADMIN";
const escapeLike = (s: string) => s.replace(/[%_\\]/g, "");

async function membership(communityId: string, userId: string | undefined) {
  if (!userId) return null;
  const [m] = await db.select().from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))).limit(1);
  return m ?? null;
}
const isMod = (m: { role: string; status: string } | null) => !!m && m.status === "ACTIVE" && (m.role === "OWNER" || m.role === "MODERATOR");

async function requireCommunity(slugOrId: string) {
  const [c] = await db.select().from(communities).where(or(eq(communities.slug, slugOrId), eq(communities.id, slugOrId))).limit(1);
  if (!c) throw notFound("Community not found");
  return c;
}

// ---------- list / get ----------
export async function listCommunities(viewer: Viewer, q: { type?: "INTEREST" | "EVENT" | "COLLEGE"; topic?: string; q?: string; eventId?: string; page?: number; pageSize?: number }) {
  const page = q.page ?? 1, pageSize = q.pageSize ?? 12;
  const where = and(
    q.type ? eq(communities.type, q.type) : undefined,
    q.topic ? eq(communities.topic, q.topic) : undefined,
    q.eventId ? eq(communities.eventId, q.eventId) : undefined,
    q.q ? or(ilike(communities.name, `%${escapeLike(q.q)}%`), ilike(communities.description, `%${escapeLike(q.q)}%`)) : undefined,
  );
  const [tot] = await db.select({ n: count() }).from(communities).where(where);
  const rows = await db.select({
    id: communities.id, slug: communities.slug, name: communities.name, description: communities.description, type: communities.type,
    topic: communities.topic, joinPolicy: communities.joinPolicy, coverUrl: communities.coverUrl, eventId: communities.eventId,
    memberCount: sql<number>`(select count(*)::int from community_members m where m.community_id = ${communities.id} and m.status = 'ACTIVE')`,
  }).from(communities).where(where).orderBy(desc(sql`(select count(*) from community_members m where m.community_id = ${communities.id} and m.status = 'ACTIVE')`), desc(communities.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  let mine = new Map<string, { status: string; role: string }>();
  if (viewer && rows.length) {
    const ms = await db.select().from(communityMembers).where(and(eq(communityMembers.userId, viewer.id), inArray(communityMembers.communityId, rows.map((r) => r.id))));
    mine = new Map(ms.map((m) => [m.communityId, { status: m.status, role: m.role }]));
  }
  return { items: rows.map((r) => ({ ...r, viewerMembership: mine.get(r.id) ?? null })), total: Number(tot?.n ?? 0), page, pageSize };
}

export async function getCommunity(viewer: Viewer, slug: string) {
  const c = await requireCommunity(slug);
  const m = await membership(c.id, viewer?.id);
  const [n] = await db.select({ n: count() }).from(communityMembers).where(and(eq(communityMembers.communityId, c.id), eq(communityMembers.status, "ACTIVE")));
  let event: { id: string; slug: string; title: string } | null = null;
  let viewerRegistered = false;
  if (c.eventId) {
    const [e] = await db.select({ id: events.id, slug: events.slug, title: events.title }).from(events).where(eq(events.id, c.eventId)).limit(1);
    event = e ?? null;
    if (viewer) {
      const [r] = await db.select({ id: registrations.id }).from(registrations).where(and(eq(registrations.eventId, c.eventId), eq(registrations.userId, viewer.id), eq(registrations.status, "CONFIRMED"))).limit(1);
      viewerRegistered = !!r;
    }
  }
  const active = m?.status === "ACTIVE";
  return {
    ...c, memberCount: Number(n?.n ?? 0), event,
    viewerMembership: m ? { status: m.status, role: m.role } : null,
    viewerRegistered,
    canModerate: isMod(m) || isAdmin(viewer),
    canReadPosts: c.type !== "EVENT" || active || isAdmin(viewer),
    canPost: active,
  };
}

// ---------- create ----------
export async function createCommunity(user: { id: string; role: string }, input: { name: string; description: string; type?: "INTEREST" | "EVENT"; topic?: string; eventId?: string; joinPolicy?: "OPEN" | "APPROVAL" | "REGISTERED_ONLY"; coverUrl?: string }) {
  const type = input.type ?? "INTEREST";
  let eventId: string | null = null;
  if (type === "EVENT") {
    if (!input.eventId) throw badRequest("An event community needs an event");
    const [e] = await db.select({ id: events.id, organizerId: events.organizerId }).from(events).where(eq(events.id, input.eventId)).limit(1);
    if (!e) throw notFound("Event not found");
    if (e.organizerId !== user.id && user.role !== "PLATFORM_ADMIN") throw forbidden("Only the event organizer can create its community");
    const [dup] = await db.select({ id: communities.id }).from(communities).where(eq(communities.eventId, e.id)).limit(1);
    if (dup) throw conflict("This event already has a community", "COMMUNITY_EXISTS");
    eventId = e.id;
  } else if (input.joinPolicy === "REGISTERED_ONLY") throw badRequest("Registered-only applies to event communities");
  const joinPolicy = input.joinPolicy ?? (type === "EVENT" ? "REGISTERED_ONLY" : "OPEN");
  const base = slugify(input.name) || "community";
  let slug = base;
  for (let i = 2; ; i++) {
    const [x] = await db.select({ id: communities.id }).from(communities).where(eq(communities.slug, slug)).limit(1);
    if (!x) break;
    slug = `${base}-${i}`;
  }
  return db.transaction(async (tx) => {
    const [c] = await tx.insert(communities).values({ slug, name: input.name, description: input.description, type, ownerId: user.id, eventId, joinPolicy, topic: input.topic ?? null, coverUrl: input.coverUrl ?? null }).returning();
    await tx.insert(communityMembers).values({ communityId: c.id, userId: user.id, role: "OWNER", status: "ACTIVE" });
    return c;
  });
}

// ---------- membership ----------
export async function joinCommunity(userId: string, slug: string) {
  const c = await requireCommunity(slug);
  const m = await membership(c.id, userId);
  if (m?.status === "REMOVED") throw forbidden("You can't rejoin this community");
  if (m?.status === "ACTIVE") throw conflict("You are already a member", "ALREADY_MEMBER");
  if (m?.status === "PENDING") throw conflict("Your request is awaiting approval", "ALREADY_PENDING");
  let status: "ACTIVE" | "PENDING" = "ACTIVE";
  if (c.joinPolicy === "APPROVAL") status = "PENDING";
  if (c.joinPolicy === "REGISTERED_ONLY") {
    if (!c.eventId) throw forbidden("Membership is restricted");
    const [r] = await db.select({ id: registrations.id }).from(registrations).where(and(eq(registrations.eventId, c.eventId), eq(registrations.userId, userId), eq(registrations.status, "CONFIRMED"))).limit(1);
    if (!r) throw forbidden("Register for the event to join its community");
  }
  await db.insert(communityMembers).values({ communityId: c.id, userId, status }).onConflictDoNothing();
  if (status === "PENDING") {
    const [me] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    const mods = await db.select({ userId: communityMembers.userId }).from(communityMembers).where(and(eq(communityMembers.communityId, c.id), eq(communityMembers.status, "ACTIVE"), inArray(communityMembers.role, ["OWNER", "MODERATOR"])));
    notify(mods.map((x) => ({ userId: x.userId, type: "GENERIC" as const, title: `${me?.name ?? "Someone"} asked to join ${c.name}`, link: `/communities/${c.slug}` })));
  }
  return { status };
}

export async function leaveCommunity(userId: string, slug: string) {
  const c = await requireCommunity(slug);
  const m = await membership(c.id, userId);
  if (!m || m.status === "REMOVED") throw notFound("You are not a member");
  if (m.role === "OWNER") throw badRequest("Owners can't leave their own community");
  await db.delete(communityMembers).where(eq(communityMembers.id, m.id));
}

export async function manageMember(actor: NonNullable<Viewer>, slug: string, targetId: string, action: "approve" | "remove" | "promote" | "demote") {
  const c = await requireCommunity(slug);
  const am = await membership(c.id, actor.id);
  if (!isMod(am) && !isAdmin(actor)) throw forbidden("Only moderators can manage members");
  const t = await membership(c.id, targetId);
  if (!t) throw notFound("Member not found");
  if (t.role === "OWNER") throw forbidden("The owner can't be changed");
  if ((action === "promote" || action === "demote") && am?.role !== "OWNER" && !isAdmin(actor)) throw forbidden("Only the owner can change moderators");
  const set = action === "approve" ? { status: "ACTIVE" as const } : action === "remove" ? { status: "REMOVED" as const } : action === "promote" ? { role: "MODERATOR" as const } : { role: "MEMBER" as const };
  await db.update(communityMembers).set(set).where(eq(communityMembers.id, t.id));
  if (action === "approve") notify({ userId: targetId, type: "GENERIC", title: `You're in! Welcome to ${c.name}`, link: `/communities/${c.slug}` });
}

export async function listMembers(viewer: Viewer, slug: string, opts: { page?: number; pageSize?: number } = {}) {
  const c = await requireCommunity(slug);
  const am = await membership(c.id, viewer?.id);
  const mod = isMod(am) || isAdmin(viewer);
  const page = opts.page ?? 1, pageSize = opts.pageSize ?? 24;
  const where = and(eq(communityMembers.communityId, c.id), mod ? inArray(communityMembers.status, ["ACTIVE", "PENDING"]) : eq(communityMembers.status, "ACTIVE"));
  const [tot] = await db.select({ n: count() }).from(communityMembers).where(where);
  const rows = await db.select({ ...publicUserCols, role: communityMembers.role, status: communityMembers.status }).from(communityMembers)
    .innerJoin(users, eq(users.id, communityMembers.userId)).leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .where(where).orderBy(sql`case ${communityMembers.role} when 'OWNER' then 0 when 'MODERATOR' then 1 else 2 end`, communityMembers.joinedAt).limit(pageSize).offset((page - 1) * pageSize);
  return { items: rows.map((r) => ({ ...toPublicUser(r), role: r.role, status: r.status })), total: Number(tot?.n ?? 0), page, pageSize };
}

// ---------- posts & comments ----------
async function assertCanRead(viewer: Viewer, c: typeof communities.$inferSelect) {
  if (c.type !== "EVENT" || isAdmin(viewer)) return;
  const m = await membership(c.id, viewer?.id);
  if (m?.status !== "ACTIVE") throw forbidden("Only members can read this community's posts");
}

export async function listPosts(viewer: Viewer, slug: string, opts: { page?: number; pageSize?: number } = {}) {
  const c = await requireCommunity(slug);
  await assertCanRead(viewer, c);
  const page = opts.page ?? 1, pageSize = opts.pageSize ?? 10;
  const where = eq(communityPosts.communityId, c.id);
  const [tot] = await db.select({ n: count() }).from(communityPosts).where(where);
  const rows = await db.select({
    id: communityPosts.id, title: communityPosts.title, body: communityPosts.body, isAnnouncement: communityPosts.isAnnouncement, createdAt: communityPosts.createdAt,
    authorId: users.id, authorName: users.name, authorAvatar: userProfiles.avatarUrl,
    commentCount: sql<number>`(select count(*)::int from comments cm where cm.post_id = ${communityPosts.id})`,
  }).from(communityPosts).innerJoin(users, eq(users.id, communityPosts.authorId)).leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(where).orderBy(desc(communityPosts.isAnnouncement), desc(communityPosts.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items: rows, total: Number(tot?.n ?? 0), page, pageSize };
}

export async function createPost(viewer: NonNullable<Viewer>, slug: string, input: { title?: string; body: string; isAnnouncement?: boolean }) {
  const c = await requireCommunity(slug);
  const m = await membership(c.id, viewer.id);
  if (m?.status !== "ACTIVE") throw forbidden("Join the community to post");
  const announce = !!input.isAnnouncement;
  if (announce && !isMod(m)) throw forbidden("Only the owner or moderators can post announcements");
  const [p] = await db.insert(communityPosts).values({ communityId: c.id, authorId: viewer.id, title: input.title || null, body: input.body, isAnnouncement: announce }).returning();
  if (announce) {
    const members = await db.select({ userId: communityMembers.userId }).from(communityMembers).where(and(eq(communityMembers.communityId, c.id), eq(communityMembers.status, "ACTIVE")));
    notify(members.filter((x) => x.userId !== viewer.id).map((x) => ({ userId: x.userId, type: "ANNOUNCEMENT" as const, title: `${c.name}: ${input.title || "New announcement"}`, body: input.body.slice(0, 140), link: `/communities/${c.slug}` })));
  }
  return p;
}

async function requirePost(postId: string) {
  const [p] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  if (!p) throw notFound("Post not found");
  const [c] = await db.select().from(communities).where(eq(communities.id, p.communityId)).limit(1);
  return { p, c };
}

export async function listComments(viewer: Viewer, postId: string) {
  const { c } = await requirePost(postId);
  await assertCanRead(viewer, c);
  return db.select({ id: comments.id, body: comments.body, createdAt: comments.createdAt, authorId: users.id, authorName: users.name, authorAvatar: userProfiles.avatarUrl })
    .from(comments).innerJoin(users, eq(users.id, comments.authorId)).leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(comments.postId, postId)).orderBy(comments.createdAt).limit(200);
}
export async function createComment(viewer: NonNullable<Viewer>, postId: string, body: string) {
  const { c } = await requirePost(postId);
  const m = await membership(c.id, viewer.id);
  if (m?.status !== "ACTIVE") throw forbidden("Join the community to comment");
  const [row] = await db.insert(comments).values({ postId, authorId: viewer.id, body }).returning();
  return row;
}
export async function deletePost(viewer: NonNullable<Viewer>, postId: string) {
  const { p, c } = await requirePost(postId);
  const m = await membership(c.id, viewer.id);
  if (p.authorId !== viewer.id && !isMod(m) && !isAdmin(viewer)) throw forbidden();
  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
}
export async function deleteComment(viewer: NonNullable<Viewer>, commentId: string) {
  const [cm] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!cm) throw notFound("Comment not found");
  const { c } = await requirePost(cm.postId);
  const m = await membership(c.id, viewer.id);
  if (cm.authorId !== viewer.id && !isMod(m) && !isAdmin(viewer)) throw forbidden();
  await db.delete(comments).where(eq(comments.id, commentId));
}

// ---------- people with similar interests ----------
export async function similarPeople(viewerId: string, limit = 8) {
  const [me] = await db.select({ interests: userProfiles.interests }).from(userProfiles).where(eq(userProfiles.userId, viewerId)).limit(1);
  const mine = me?.interests ?? [];
  if (!mine.length) return [];
  const arr = sql`array[${sql.join(mine.map((i) => sql`${i}`), sql`, `)}]::text[]`;
  const rows = await db.select({ ...publicUserCols, interests: userProfiles.interests }).from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .where(and(eq(users.discoverable, true), eq(users.status, "ACTIVE"), sql`${users.id} <> ${viewerId}`, sql`${userProfiles.interests} && ${arr}`, notBlockedWith(viewerId)))
    .limit(limit * 3);
  const scored = rows.map((r) => ({ ...toPublicUser(r), sharedInterests: (r.interests ?? []).filter((i) => mine.includes(i)) }))
    .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length).slice(0, limit);
  const states = await connectionStates(viewerId, scored.map((s) => s.id));
  return scored.map((s) => ({ ...s, connection: states.get(s.id) ?? "NONE" }));
}
