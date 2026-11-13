import { route, ok } from "@/lib/api";
import { deleteComment } from "@/modules/communities/service";
export const DELETE = route(async (_r, { params }, user) => { await deleteComment(user!, params.commentId); return ok({ ok: true }); }, { auth: true });
