"use client";
/** Thin fetch wrapper for client components. Throws Error(message) from the API's { error } payload. */
export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data?.error || "Request failed") as Error & { status?: number; code?: string }; e.status = res.status; e.code = data?.code; throw e; }
  return data as T;
}
