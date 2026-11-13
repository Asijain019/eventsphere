import { route, parseBody, parseQuery, ok } from "@/lib/api";
import { z } from "zod";
import { createPostSchema } from "@/modules/communities/schemas";
import { createPost, listPosts } from "@/modules/communities/service";
const q = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(30).default(10) });
export const GET = route(async (req, { params }, user) => ok(await listPosts(user, params.slug, parseQuery(req, q))));
export const POST = route(async (req, { params }, user) => ok({ post: await createPost(user!, params.slug, await parseBody(req, createPostSchema)) }, 201), { auth: true });
