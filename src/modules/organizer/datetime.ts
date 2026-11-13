/** Client-safe helpers: <input type="datetime-local"> values are interpreted as Asia/Kolkata (all events are shown in IST). */
export const toISTInput = (d?: Date | string | null) => (d ? new Date(new Date(d).getTime() + 19800000).toISOString().slice(0, 16) : "");
export const fromISTInput = (s: string) => (s ? new Date(`${s}:00+05:30`).toISOString() : null);
