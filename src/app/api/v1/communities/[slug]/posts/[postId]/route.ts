import { route, ok } from "@/lib/api";
import { deletePost } from "@/modules/communities/service";
export const DELETE = route(async (_r, { params }, user) => { await deletePost(user!, params.postId); return ok({ ok: true }); }, { auth: true });
