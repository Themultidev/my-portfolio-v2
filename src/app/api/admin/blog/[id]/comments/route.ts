import { requireSession } from "../../../../../../lib/auth";
import { stackMutation } from "../../../../../../lib/stack-store";
import { apiJson } from "../../../../../../lib/api-response";
import { db } from "../../../../../../lib/db";
import { blogFailure } from "../../../../../../lib/blog-store";
import { blogId } from "../../../../../../lib/blog-validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    await requireSession(request);
    const postId = blogId.parse((await context.params).id);
    const page = Math.max(
      1,
      Math.floor(Number(new URL(request.url).searchParams.get("page")) || 1),
    );
    return apiJson({
      comments: await db.blogComment.findMany({
        where: { postId },
        orderBy: { id: "desc" },
        skip: (page - 1) * 50,
        take: 50,
        select: { id: true, author: true, body: true, createdAt: true },
      }),
    });
  } catch (e) {
    return blogFailure(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await stackMutation(request);
    const postId = blogId.parse((await context.params).id);
    const id = blogId.parse(new URL(request.url).searchParams.get("comment"));
    await db.blogComment.deleteMany({ where: { id, postId } });
    return apiJson({ ok: true });
  } catch (e) {
    return blogFailure(e);
  }
}
