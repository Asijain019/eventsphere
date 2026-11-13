import { route, parseBody, ok } from "@/lib/api";
import { createCommentSchema } from "@/modules/communities/schemas";
import { createComment, listComments } from "@/modules/communities/service";
export const GET = route(async (_r, { params }, user) => ok({ items: await listComments(user, params.postId) }));
export const POST = route(async (req, { params }, user) => ok({ comment: await createComment(user!, params.postId, (await parseBody(req, createCommentSchema)).body) }, 201), { auth: true });
