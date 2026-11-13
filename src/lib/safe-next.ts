/** Only allow same-origin relative paths as post-login redirects (blocks open-redirects like //evil.com or https://evil.com). */
export function safeNext(next: string | string[] | undefined | null, fallback = "/"): string {
  const n = Array.isArray(next) ? next[0] : next;
  if (!n || !n.startsWith("/") || n.startsWith("//") || n.includes("\\") || /[\r\n]/.test(n)) return fallback;
  return n;
}
