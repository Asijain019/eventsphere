import { route, ok, parseBody, ApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { contactSchema } from "@/modules/home/schemas";

/** Demo inbox: validates + rate-limits, then only logs. Nothing is stored or emailed. */
export const POST = route(async (req) => {
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 60_000)) throw new ApiError(429, "Too many messages, please try again in a minute", "RATE_LIMIT");
  const body = await parseBody(req, contactSchema);
  if (body.website) return ok({ ok: true }); // honeypot tripped: silently accept
  console.log("[contact] demo message", { topic: body.topic, from: body.email.replace(/(.{2}).*(@.*)/, "$1***$2"), length: body.message.length });
  return ok({ ok: true, demo: true }, 201);
});
