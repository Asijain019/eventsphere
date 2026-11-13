import { promises as fs } from "node:fs";
import path from "node:path";
import { ApiError } from "./api";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

/** Provider-agnostic image upload. STORAGE_PROVIDER=local writes to public/uploads (dev); =blob uses Vercel Blob over REST. */
export async function saveImage(file: File, folder = "misc"): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new ApiError(400, "Only JPEG, PNG, WebP or GIF images are allowed", "BAD_FILE");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Image must be 5 MB or smaller", "BAD_FILE");
  const name = `${folder}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const buf = Buffer.from(await file.arrayBuffer());
  if (process.env.STORAGE_PROVIDER === "blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new ApiError(500, "Blob storage is not configured", "STORAGE");
    const res = await fetch(`https://blob.vercel-storage.com/${name}`, {
      method: "PUT", headers: { authorization: `Bearer ${token}`, "x-api-version": "7", "x-content-type": file.type, "x-add-random-suffix": "0" }, body: buf,
    });
    if (!res.ok) throw new ApiError(502, "Upload failed", "STORAGE");
    return ((await res.json()) as { url: string }).url;
  }
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return `/uploads/${name}`;
}
