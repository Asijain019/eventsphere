import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, users, userProfiles, colleges, registrations, events, connectionRequests, userBlocks, reports } from "@/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/api";
import { notify } from "@/lib/notify";

export type ConnectionState = "SELF" | "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "CONNECTED" | "BLOCKED" | "BLOCKED_BY";
/** The ONLY user fields ever returned by social discovery endpoints. Never add email/phone here. */
export type PublicUser = { id: string; name: string; avatarUrl: string | null; collegeName: string | null; skills: string[]; bio: string | null };

export const publicUserCols = {
  id: users.id, name: users.name, avatarUrl: userProfiles.avatarUrl, collegeName: colleges.name,
  skills: userProfiles.skills, bio: userProfiles.bio,
};
type Row = { id: string; name: string; avatarUrl: string | null; collegeName: string | null; skills: string[] | null; bio: string | null };
export const toPublicUser = (r: Row): PublicUser => ({ id: r.id, name: r.name, avatarUrl: r.avatarUrl, collegeName: r.collegeName, skills: r.skills ?? [], bio: r.bio });

/** SQL fragment: true when no block exists between `viewerId` and the users.id column in either direction. */
export const notBlockedWith = (viewerId: string) =>
  sql`not exists (select 1 from user_blocks b where (b.blocker_id = ${viewerId} and b.blocked_id = ${users.id}) or (b.blocker_id = ${users.id} and b.blocked_id = ${viewerId}))`;

export async function isBlockedEitherWay(a: string, b: string) {
  const r = await db.select({ x: userBlocks.blockerId }).from(userBlocks)
    .where(or(and(eq(userBlocks.blockerId, a), eq(userBlocks.blockedId, b)), and(eq(userBlocks.blockerId, b), eq(userBlocks.blockedId, a)))).limit(1);
  return r.length > 0;
}
export async function isConnected(a: string, b: string) {
  if (a === b) return false;
  const r = await db.select({ id: connectionRequests.id }).from(connectionRequests).where(and(
    eq(connectionRequests.status, "ACCEPTED"),
    or(and(eq(connectionRequests.requesterId, a), eq(connectionRequests.recipientId, b)), and(eq(connectionRequests.requesterId, b), eq(connectionRequests.recipientId, a))),
  )).limit(1);
  return r.length > 0;
}

/** Connection state between the viewer and many users at once. */
export async function connectionStates(viewerId: string, ids: string[]): Promise<Map<string, ConnectionState>> {
  const out = new Map<string, ConnectionState>();
  if (!ids.length) return out;
  const reqs = await db.select().from(connectionRequests).where(or(
    and(eq(connectionRequests.requesterId, viewerId), inArray(connectionRequests.recipientId, ids)),
    and(eq(connectionRequests.recipientId, viewerId), inArray(connectionRequests.requesterId, ids)),
  ));
  const blocks = await db.select().from(userBlocks).where(or(
    and(eq(userBlocks.blockerId, viewerId), inArray(userBlocks.blockedId, ids)),
    and(eq(userBlocks.blockedId, viewerId), inArray(userBlocks.blockerId, ids)),
  ));
  for (const id of ids) {
    if (id === viewerId) { out.set(id, "SELF"); continue; }
    if (blocks.some((b) => b.blockerId === viewerId && b.blockedId === id)) { out.set(id, "BLOCKED"); continue; }
    if (blocks.some((b) => b.blockerId === id && b.blockedId === viewerId)) { out.set(id, "BLOCKED_BY"); continue; }
    const mine = reqs.filter((r) => (r.requesterId === viewerId && r.recipientId === id) || (r.requesterId === id && r.recipientId === viewerId));
    if (mine.some((r) => r.status === "ACCEPTED")) out.set(id, "CONNECTED");
    else if (mine.some((r) => r.status === "PENDING" && r.requesterId === viewerId)) out.set(id, "PENDING_SENT");
    else if (mine.some((r) => r.status === "PENDING" && r.recipientId === viewerId)) out.set(id, "PENDING_RECEIVED");
    else out.set(id, "NONE");
  }
  return out;
}

// ---------- attendee discovery ----------
export async function getEventBySlugOrId(key: string) {
  const [e] = await db.select({ id: events.id, slug: events.slug, title: events.title, status: events.status, startAt: events.startAt })
    .from(events).where(or(eq(events.slug, key), eq(events.id, key))).limit(1);
  return e ?? null;
}

export async function discoverAttendees(viewerId: string, eventKey: string, opts: { page?: number; pageSize?: number; q?: string } = {}) {
  const event = await getEventBySlugOrId(eventKey);
  if (!event) throw notFound("Event not found");
  const [mine] = await db.select({ id: registrations.id }).from(registrations)
    .where(and(eq(registrations.eventId, event.id), eq(registrations.userId, viewerId), eq(registrations.status, "CONFIRMED"))).limit(1);
  if (!mine) throw forbidden("Register for this event to meet other attendees");
  const page = opts.page ?? 1, pageSize = opts.pageSize ?? 12;
  const where = and(
    eq(registrations.eventId, event.id), eq(registrations.status, "CONFIRMED"),
    eq(users.discoverable, true), eq(users.status, "ACTIVE"),
    sql`${users.id} <> ${viewerId}`, notBlockedWith(viewerId),
    opts.q ? ilike(users.name, `%${opts.q.replace(/[%_]/g, "")}%`) : undefined,
  );
  const base = () => db.select(publicUserCols).from(registrations)
    .innerJoin(users, eq(users.id, registrations.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(colleges, eq(colleges.id, userProfiles.collegeId)).where(where);
  const [tot] = await db.select({ n: count() }).from(registrations).innerJoin(users, eq(users.id, registrations.userId)).where(where);
  const rows = await base().orderBy(users.name).limit(pageSize).offset((page - 1) * pageSize);
  const states = await connectionStates(viewerId, rows.map((r) => r.id));
  return {
    event: { id: event.id, slug: event.slug, title: event.title },
    items: rows.map((r) => ({ ...toPublicUser(r), connection: states.get(r.id) ?? "NONE" })),
    total: Number(tot?.n ?? 0), page, pageSize,
  };
}

// ---------- requests ----------
export async function sendRequest(viewerId: string, recipientId: string, message?: string) {
  if (viewerId === recipientId) throw badRequest("You cannot connect with yourself");
  const [target] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.id, recipientId)).limit(1);
  if (!target || target.status !== "ACTIVE") throw notFound("User not found");
  if (await isBlockedEitherWay(viewerId, recipientId)) throw forbidden("You can't connect with this user");
  const [me] = await db.select({ name: users.name }).from(users).where(eq(users.id, viewerId)).limit(1);

  const existing = await db.select().from(connectionRequests).where(or(
    and(eq(connectionRequests.requesterId, viewerId), eq(connectionRequests.recipientId, recipientId)),
    and(eq(connectionRequests.requesterId, recipientId), eq(connectionRequests.recipientId, viewerId)),
  ));
  if (existing.some((r) => r.status === "ACCEPTED")) throw conflict("You are already connected", "ALREADY_CONNECTED");
  if (existing.some((r) => r.status === "PENDING" && r.requesterId === viewerId)) throw conflict("Request already sent", "ALREADY_PENDING");
  const incoming = existing.find((r) => r.status === "PENDING" && r.requesterId === recipientId);
  if (incoming) { // they already asked us: sending a request == accepting theirs
    await respond(viewerId, incoming.id, true);
    return { status: "ACCEPTED" as const, id: incoming.id };
  }
  const mineDeclined = existing.find((r) => r.requesterId === viewerId && r.status === "DECLINED");
  let id: string;
  if (mineDeclined) {
    const waited = Date.now() - new Date(mineDeclined.respondedAt ?? mineDeclined.createdAt).getTime();
    if (waited < 24 * 3600_000) throw conflict("You can send another request 24 hours after a declined one", "COOLDOWN");
    await db.update(connectionRequests).set({ status: "PENDING", message: message ?? null, createdAt: new Date(), respondedAt: null }).where(eq(connectionRequests.id, mineDeclined.id));
    id = mineDeclined.id;
  } else {
    const [r] = await db.insert(connectionRequests).values({ requesterId: viewerId, recipientId, message: message ?? null }).returning({ id: connectionRequests.id });
    id = r.id;
  }
  notify({ userId: recipientId, type: "CONNECTION_REQUEST", title: `${me?.name ?? "Someone"} wants to connect`, body: message, link: "/my/network?tab=received" });
  return { status: "PENDING" as const, id };
}

export async function respond(viewerId: string, requestId: string, accept: boolean) {
  const [r] = await db.select().from(connectionRequests).where(eq(connectionRequests.id, requestId)).limit(1);
  if (!r) throw notFound("Request not found");
  if (r.recipientId !== viewerId) throw forbidden("Only the recipient can respond to this request");
  if (r.status !== "PENDING") throw conflict("This request was already answered", "ALREADY_ANSWERED");
  if (await isBlockedEitherWay(r.requesterId, r.recipientId)) throw forbidden("You can't connect with this user");
  await db.update(connectionRequests).set({ status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() }).where(eq(connectionRequests.id, requestId));
  if (accept) {
    const [me] = await db.select({ name: users.name }).from(users).where(eq(users.id, viewerId)).limit(1);
    notify({ userId: r.requesterId, type: "CONNECTION_ACCEPTED", title: `${me?.name ?? "Someone"} accepted your request`, body: "You can now message each other.", link: `/messages?with=${viewerId}` });
  }
  return { status: accept ? ("ACCEPTED" as const) : ("DECLINED" as const) };
}

export async function cancelRequest(viewerId: string, requestId: string) {
  const [r] = await db.select().from(connectionRequests).where(eq(connectionRequests.id, requestId)).limit(1);
  if (!r) throw notFound("Request not found");
  if (r.requesterId !== viewerId) throw forbidden();
  if (r.status !== "PENDING") throw conflict("Only pending requests can be cancelled");
  await db.delete(connectionRequests).where(eq(connectionRequests.id, requestId));
}

export async function removeConnection(viewerId: string, otherId: string) {
  await db.delete(connectionRequests).where(and(
    eq(connectionRequests.status, "ACCEPTED"),
    or(and(eq(connectionRequests.requesterId, viewerId), eq(connectionRequests.recipientId, otherId)), and(eq(connectionRequests.requesterId, otherId), eq(connectionRequests.recipientId, viewerId))),
  ));
}

// ---------- lists ----------
export async function listConnections(viewerId: string) {
  const rows = await db.select({ ...publicUserCols, requestId: connectionRequests.id }).from(connectionRequests)
    .innerJoin(users, sql`${users.id} = case when ${connectionRequests.requesterId} = ${viewerId} then ${connectionRequests.recipientId} else ${connectionRequests.requesterId} end`)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .where(and(eq(connectionRequests.status, "ACCEPTED"), or(eq(connectionRequests.requesterId, viewerId), eq(connectionRequests.recipientId, viewerId)), notBlockedWith(viewerId)))
    .orderBy(desc(connectionRequests.respondedAt));
  return rows.map((r) => ({ requestId: r.requestId, user: toPublicUser(r) }));
}
export async function listRequests(viewerId: string, dir: "received" | "sent") {
  const otherCol = dir === "received" ? connectionRequests.requesterId : connectionRequests.recipientId;
  const mineCol = dir === "received" ? connectionRequests.recipientId : connectionRequests.requesterId;
  const rows = await db.select({ ...publicUserCols, requestId: connectionRequests.id, message: connectionRequests.message, createdAt: connectionRequests.createdAt }).from(connectionRequests)
    .innerJoin(users, eq(users.id, otherCol)).leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .where(and(eq(mineCol, viewerId), eq(connectionRequests.status, "PENDING"), notBlockedWith(viewerId))).orderBy(desc(connectionRequests.createdAt));
  return rows.map((r) => ({ requestId: r.requestId, message: r.message, createdAt: r.createdAt, user: toPublicUser(r) }));
}

// ---------- blocking & reporting ----------
export async function blockUser(viewerId: string, targetId: string) {
  if (viewerId === targetId) throw badRequest("You cannot block yourself");
  const [t] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!t) throw notFound("User not found");
  await db.transaction(async (tx) => {
    await tx.insert(userBlocks).values({ blockerId: viewerId, blockedId: targetId }).onConflictDoNothing();
    await tx.delete(connectionRequests).where(or(
      and(eq(connectionRequests.requesterId, viewerId), eq(connectionRequests.recipientId, targetId)),
      and(eq(connectionRequests.requesterId, targetId), eq(connectionRequests.recipientId, viewerId)),
    ));
  });
}
export async function unblockUser(viewerId: string, targetId: string) {
  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, viewerId), eq(userBlocks.blockedId, targetId)));
}
export async function listBlocked(viewerId: string) {
  const rows = await db.select(publicUserCols).from(userBlocks).innerJoin(users, eq(users.id, userBlocks.blockedId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id)).leftJoin(colleges, eq(colleges.id, userProfiles.collegeId))
    .where(eq(userBlocks.blockerId, viewerId));
  return rows.map(toPublicUser);
}
export async function createReport(viewerId: string, input: { targetType: string; targetId: string; reason: string }) {
  if (input.targetType === "USER" && input.targetId === viewerId) throw badRequest("You cannot report yourself");
  const [r] = await db.insert(reports).values({ reporterId: viewerId, ...input }).returning({ id: reports.id });
  return r;
}
