import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, notifications } from "@/db";

export async function unreadCount(userId: string) {
  const [r] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(r?.n ?? 0);
}
export async function listNotifications(userId: string, limit = 50) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
export async function markRead(userId: string, id?: string) {
  const cond = id ? and(eq(notifications.userId, userId), eq(notifications.id, id)) : and(eq(notifications.userId, userId), isNull(notifications.readAt));
  await db.update(notifications).set({ readAt: new Date() }).where(cond);
}

/** Notifications grouped for the UI: today / earlier this week / older. */
export async function listNotificationsPaged(userId: string, opts: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) {
  const page = opts.page ?? 1, pageSize = opts.pageSize ?? 30;
  const where = opts.unreadOnly ? and(eq(notifications.userId, userId), isNull(notifications.readAt)) : eq(notifications.userId, userId);
  const [tot] = await db.select({ n: count() }).from(notifications).where(where);
  const items = await db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { items, total: Number(tot?.n ?? 0), page, pageSize, unread: await unreadCount(userId) };
}
/** Mark one notification read; returns false if it isn't the caller's. */
export async function markOneRead(userId: string, id: string) {
  const r = await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), eq(notifications.id, id))).returning({ id: notifications.id });
  return r.length > 0;
}
