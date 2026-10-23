import BlogManager from "../../../../components/portfolio/BlogManager";
import { db } from "../../../../lib/db";
import { blogCounts } from "../../../../lib/blog-store";
export default async function Page() {
  const posts = await db.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: blogCounts,
  });
  return (
    <BlogManager
      initial={posts.map((p) => ({
        ...p,
        category:
          p.category as import("../../../../lib/blog-validation").PostDraft["category"],
        updatedAt: p.updatedAt.toISOString(),
        createdAt: undefined,
        publishedAt: undefined,
      }))}
    />
  );
}
