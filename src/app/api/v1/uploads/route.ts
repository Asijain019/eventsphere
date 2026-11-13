import { route, ok, badRequest, forbidden, ApiError, ORGANIZER_ROLES } from "@/lib/api";
import { saveImage } from "@/lib/storage";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
const FOLDERS = ["poster", "avatar", "gallery"] as const;

/** multipart/form-data: `file` (image) + `folder` (poster|avatar|gallery). Posters/galleries are organizer-only; avatars any signed-in user. */
export const POST = route(async (req, _c, user) => {
  if (!rateLimit(`upload:${user!.id}`, 30, 10 * 60_000)) throw new ApiError(429, "Too many uploads. Try again in a few minutes.", "RATE_LIMIT");
  let form: FormData;
  try { form = await req.formData(); } catch { throw badRequest("Expected multipart/form-data"); }
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "poster");
  if (!(file instanceof File) || file.size === 0) throw badRequest("Choose an image file to upload");
  if (!(FOLDERS as readonly string[]).includes(folder)) throw badRequest("Invalid upload folder");
  if (folder !== "avatar" && !ORGANIZER_ROLES.includes(user!.role)) throw forbidden("Only organizers can upload event images");
  return ok({ url: await saveImage(file, folder) }, 201);
}, { auth: true });
