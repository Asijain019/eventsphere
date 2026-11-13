export type EventListItem = {
  id: string; slug: string; title: string; posterUrl: string | null;
  categoryName: string; categoryColor: string; categorySlug: string;
  startAt: Date | string; endAt: Date | string; registrationDeadline: Date | string | null;
  venueName: string | null; locality: string | null; cityName: string; collegeName: string | null; organizerName: string;
  feePaise: number; capacity: number; confirmedCount: number; mode: "OFFLINE" | "ONLINE" | "HYBRID";
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "POSTPONED" | "COMPLETED"; isDemo: boolean; favourited?: boolean;
};

export type RegState = { label: string; tone: "open" | "few" | "full" | "closed" | "cancelled" };
export function registrationState(e: Pick<EventListItem, "capacity" | "confirmedCount" | "registrationDeadline" | "status" | "startAt">): RegState {
  if (e.status === "CANCELLED") return { label: "Cancelled", tone: "cancelled" };
  const now = Date.now();
  if (e.status === "COMPLETED" || new Date(e.startAt).getTime() < now) return { label: "Ended", tone: "closed" };
  if (e.registrationDeadline && new Date(e.registrationDeadline).getTime() < now) return { label: "Registration closed", tone: "closed" };
  const left = e.capacity - e.confirmedCount;
  if (left <= 0) return { label: "Sold out", tone: "full" };
  if (left <= Math.max(5, Math.ceil(e.capacity * 0.1))) return { label: `Only ${left} left`, tone: "few" };
  return { label: "Registration open", tone: "open" };
}
