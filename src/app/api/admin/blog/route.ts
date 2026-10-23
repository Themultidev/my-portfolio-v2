import { requireSession } from "../../../../lib/auth";
import { stackMutation } from "../../../../lib/stack-store";
import { apiJson } from "../../../../lib/api-response";
import { db } from "../../../../lib/db";
import { blogCounts, blogFailure, savePost } from "../../../../lib/blog-store";
export async function GET(request: Request) {
  try {
    await requireSession(request);
    return apiJson({
      posts: await db.blogPost.findMany({
        orderBy: { updatedAt: "desc" },
        include: blogCounts,
      }),
    });
  } catch (e) {
    return blogFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    return apiJson({ post: await savePost(request) }, 201);
  } catch (e) {
    return blogFailure(e);
  }
}
