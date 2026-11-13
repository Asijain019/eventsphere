import { db, notifications } from "@/db";

type NotificationType = typeof notifications.$inferInsert["type"];
export type NotifyInput = { userId: string; type: NotificationType; title: string; body?: string; link?: string };

/**
 * Lightweight async notification queue (MVP).
 * Callers `await`-free fire-and-forget via notify(); failures are logged and never roll back the caller's transaction.
 * Swap this module for BullMQ/SQS later without touching callers.
 */
const queue: NotifyInput[] = [];
let draining = false;

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      const batch = queue.splice(0, 50);
      try { await db.insert(notifications).values(batch); }
      catch (e) { console.error("[notify] failed to persist batch", e); }
    }
  } finally { draining = false; }
}

export function notify(input: NotifyInput | NotifyInput[]) {
  queue.push(...(Array.isArray(input) ? input : [input]));
  void Promise.resolve().then(drain);
}
/** Test helper: wait for queue to flush. */
export async function flushNotifications() { await drain(); while (draining) await new Promise((r) => setTimeout(r, 5)); await drain(); }
