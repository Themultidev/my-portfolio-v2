import { db } from "../../../../../lib/db";
import { blogId, commentSchema } from "../../../../../lib/blog-validation";
import { blogFailure, publicPost } from "../../../../../lib/blog-store";
import { apiJson, ApiError } from "../../../../../lib/api-response";
import { readJsonBody } from "../../../../../lib/json-body";
import {
  consume,
  engagementOrigin,
  visitor,
} from "../../../../../lib/blog-visitor";
type Context = { params: Promise<{ id: string }> };
const commentSelect = {
  id: true,
  author: true,
  body: true,
  createdAt: true,
} as const;
export async function GET(request: Request, context: Context) {
  try {
    const id = blogId.parse((await context.params).id);
    await publicPost(id);
    const page = Math.max(
      1,
      Math.min(
        10000,
        Number(new URL(request.url).searchParams.get("page")) || 1,
      ),
    );
    const hash = await visitor();
    const [likes, liked, comments, total] = await Promise.all([
      db.blogLike.count({ where: { postId: id } }),
      hash
        ? db.blogLike.findUnique({
            where: { postId_visitorHash: { postId: id, visitorHash: hash } },
            select: { id: true },
          })
        : null,
      db.blogComment.findMany({
        where: { postId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (Math.floor(page) - 1) * 20,
        take: 20,
        select: commentSelect,
      }),
      db.blogComment.count({ where: { postId: id } }),
    ]);
    return apiJson({
      likes,
      liked: !!liked,
      comments,
      total,
      page: Math.floor(page),
    });
  } catch (e) {
    return blogFailure(e);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    engagementOrigin(request);
    const id = blogId.parse((await context.params).id);
    await publicPost(id);
    const data = await readJsonBody(request);
    const hash = (await visitor(true))!;
    if (typeof data !== "object" || data === null || !("action" in data))
      throw new ApiError(400, "VALIDATION", "Choose an action.");
    if (data.action === "like") {
      // Upsert/delete are idempotent; a retry cannot silently toggle a like twice.
      if (!("liked" in data) || typeof data.liked !== "boolean")
        throw new ApiError(400, "VALIDATION", "Choose like or unlike.");
      const liked = data.liked;
      await db.$transaction(async (tx) => {
        await consume(tx, hash, "like");
        if (liked)
          await tx.blogLike.upsert({
            where: { postId_visitorHash: { postId: id, visitorHash: hash } },
            create: { postId: id, visitorHash: hash },
            update: {},
          });
        else
          await tx.blogLike.deleteMany({
            where: { postId: id, visitorHash: hash },
          });
      });
      return apiJson({
        liked,
        likes: await db.blogLike.count({ where: { postId: id } }),
      });
    }
    if (data.action !== "comment")
      throw new ApiError(400, "VALIDATION", "Unknown action.");
    const { action: _, ...fields } = data;
    void _;
    const parsed = commentSchema.safeParse(fields);
    if (!parsed.success)
      throw new ApiError(
        400,
        "VALIDATION",
        "Enter your name (2–60 characters) and a comment (up to 2,000 characters).",
      );
    const comment = await db.$transaction(async (tx) => {
      await consume(tx, hash, "comment");
      return tx.blogComment.create({
        data: {
          postId: id,
          visitorHash: hash,
          author: parsed.data.author,
          body: parsed.data.body,
        },
        select: commentSelect,
      });
    });
    return apiJson({ comment }, 201);
  } catch (e) {
    return blogFailure(e);
  }
}
