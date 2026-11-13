import clsx, { type ClassValue } from "clsx";
export const cn = (...i: ClassValue[]) => clsx(i);
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
export const formatPrice = (paise: number) => (paise <= 0 ? "Free" : `₹${(paise / 100).toLocaleString("en-IN")}`);
export const formatDate = (d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
export const formatTime = (d: Date | string) => new Date(d).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
export const ticketRef = () => "ES-" + Math.random().toString(36).slice(2, 7).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
export const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
