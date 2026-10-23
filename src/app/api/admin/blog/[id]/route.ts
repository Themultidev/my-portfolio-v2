import { stackMutation } from "../../../../../lib/stack-store";
import { apiJson } from "../../../../../lib/api-response";
import { db } from "../../../../../lib/db";
import { blogFailure, savePost } from "../../../../../lib/blog-store";
import { blogId } from "../../../../../lib/blog-validation";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    await stackMutation(request);
    return apiJson({
      post: await savePost(request, blogId.parse((await context.params).id)),
    });
  } catch (e) {
    return blogFailure(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await stackMutation(request);
    await db.blogPost.delete({
      where: { id: blogId.parse((await context.params).id) },
    });
    return apiJson({ ok: true });
  } catch (e) {
    return blogFailure(e);
  }
}
