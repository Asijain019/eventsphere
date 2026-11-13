import { and, desc, eq, gt, inArray, lt, ne, sql, count } from "drizzle-orm";
import { db, conversations, conversationMembers, messages, users, userProfiles } from "@/db";
import { ApiError, badRequest, forbidden, notFound } from "@/lib/api";
import { isBlockedEitherWay, isConnected } from "@/modules/connections/service";

export const MAX_MESSAGE_LENGTH = 2000;
const notConnected = () => new ApiError(403, "You can only message people you are connected with", "NOT_CONNECTED");

/** Backend-enforced messaging gate: accepted connection AND no block either way. */
export async function assertCanMessage(a: string, b: string) {
  if (a === b) throw badRequest("You cannot message yourself");
  if (await isBlockedEitherWay(a, b)) throw notConnected();
  if (!(await isConnected(a, b))) throw notConnected();
}

async function findConversation(a: string, b: string) {
  const rows = await db.select({ id: conversationMembers.conversationId }).from(conversationMembers)
    .where(inArray(conversationMembers.userId, [a, b])).groupBy(conversationMembers.conversationId)
    .having(sql`count(*) = 2`);
  return rows[0]?.id ?? null;
}

export async function getOrCreateConversation(userId: string, otherId: string) {
  await assertCanMessage(userId, otherId);
  const existing = await findConversation(userId, otherId);
  if (existing) return { id: existing };
  return db.transaction(async (tx) => {
    const [c] = await tx.insert(conversations).values({}).returning({ id: conversations.id });
    await tx.insert(conversationMembers).values([{ conversationId: c.id, userId }, { conversationId: c.id, userId: otherId }]);
    return c;
  });
}

async function getOther(conversationId: string, userId: string) {
  const members = await db.select({ userId: conversationMembers.userId }).from(conversationMembers).where(eq(conversationMembers.conversationId, conversationId));
  if (!members.some((m) => m.userId === userId)) throw forbidden("You are not part of this conversation");
  const other = members.find((m) => m.userId !== userId);
  if (!other) throw notFound("Conversation not found");
  return other.userId;
}

export async function sendMessage(userId: string, conversationId: string, body: string) {
  const text = body.trim();
  if (!text) throw badRequest("Message can't be empty");
  if (text.length > MAX_MESSAGE_LENGTH) throw badRequest(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  const otherId = await getOther(conversationId, userId);
  await assertCanMessage(userId, otherId); // re-checked on every send: removal/blocks cut messaging immediately
  const [m] = await db.insert(messages).values({ conversationId, senderId: userId, body: text }).returning();
  await db.update(conversationMembers).set({ lastReadAt: new Date() }).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)));
  return m;
}

export async function listConversations(userId: string) {
  const mine = await db.select({ id: conversationMembers.conversationId, lastReadAt: conversationMembers.lastReadAt }).from(conversationMembers).where(eq(conversationMembers.userId, userId));
  if (!mine.length) return [];
  const ids = mine.map((m) => m.id);
  const others = await db.select({ conversationId: conversationMembers.conversationId, id: users.id, name: users.name, avatarUrl: userProfiles.avatarUrl })
    .from(conversationMembers).innerJoin(users, eq(users.id, conversationMembers.userId)).leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(inArray(conversationMembers.conversationId, ids), ne(conversationMembers.userId, userId)));
  const last = await db.selectDistinctOn([messages.conversationId], { conversationId: messages.conversationId, body: messages.body, senderId: messages.senderId, createdAt: messages.createdAt })
    .from(messages).where(inArray(messages.conversationId, ids)).orderBy(messages.conversationId, desc(messages.createdAt));
  const out = [];
  for (const c of mine) {
    const other = others.find((o) => o.conversationId === c.id);
    if (!other) continue;
    const [u] = await db.select({ n: count() }).from(messages).where(and(eq(messages.conversationId, c.id), ne(messages.senderId, userId), c.lastReadAt ? gt(messages.createdAt, c.lastReadAt) : undefined));
    const lm = last.find((l) => l.conversationId === c.id) ?? null;
    out.push({ id: c.id, other: { id: other.id, name: other.name, avatarUrl: other.avatarUrl }, lastMessage: lm, unread: Number(u?.n ?? 0) });
  }
  return out.sort((a, b) => +new Date(b.lastMessage?.createdAt ?? 0) - +new Date(a.lastMessage?.createdAt ?? 0));
}

export async function listMessages(userId: string, conversationId: string, opts: { before?: string; limit?: number } = {}) {
  const otherId = await getOther(conversationId, userId);
  const limit = opts.limit ?? 40;
  const rows = await db.select().from(messages).where(and(eq(messages.conversationId, conversationId), opts.before ? lt(messages.createdAt, new Date(opts.before)) : undefined))
    .orderBy(desc(messages.createdAt)).limit(limit + 1);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).reverse();
  const [o] = await db.select({ id: users.id, name: users.name, avatarUrl: userProfiles.avatarUrl }).from(users).leftJoin(userProfiles, eq(userProfiles.userId, users.id)).where(eq(users.id, otherId)).limit(1);
  let canSend = true;
  try { await assertCanMessage(userId, otherId); } catch { canSend = false; }
  return { items, hasMore, nextBefore: hasMore ? items[0].createdAt.toISOString() : null, other: o, canSend };
}

export async function markRead(userId: string, conversationId: string) {
  await getOther(conversationId, userId);
  await db.update(conversationMembers).set({ lastReadAt: new Date() }).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)));
}

export async function unreadMessageCount(userId: string) {
  const list = await listConversations(userId);
  return list.reduce((s, c) => s + c.unread, 0);
}
