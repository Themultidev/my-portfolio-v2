import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError, unexpectedApiFailure, apiFailure } from "./api-response";
import { postSchema } from "./blog-validation";
import { readJsonBody } from "./json-body";
import { storedUploadExists } from "./upload-storage";
export const blogCounts = {
  _count: { select: { likes: true, comments: true } },
} as const;
export async function savePost(request: Request, id?: number) {
  const parsed = postSchema.safeParse(await readJsonBody(request, 256 * 1024));
  if (!parsed.success)
    throw new ApiError(400, "VALIDATION", parsed.error.issues[0].message);
  const input = parsed.data;
  if (input.coverUrl) await storedUploadExists(input.coverUrl);
  const previous = id ? await db.blogPost.findUnique({ where: { id } }) : null;
  if (id && !previous) throw new ApiError(404, "NOT_FOUND", "Post not found.");
  const data = {
    ...input,
    publishedAt: input.published ? (previous?.publishedAt ?? new Date()) : null,
  };
  return id
    ? db.blogPost.update({ where: { id }, data })
    : db.blogPost.create({ data });
}
export function blogFailure(error: unknown) {
  if (error instanceof ZodError)
    return apiFailure(
      new ApiError(400, "VALIDATION", "Invalid post or comment ID."),
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return apiFailure(
        new ApiError(409, "CONFLICT", "This post URL is already in use."),
      );
    if (error.code === "P2025")
      return apiFailure(new ApiError(404, "NOT_FOUND", "Post not found."));
  }
  return unexpectedApiFailure(error);
}
export async function publicPost(id: number) {
  const post = await db.blogPost.findFirst({
    where: { id, published: true },
    select: { id: true },
  });
  if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found.");
  return post;
}
