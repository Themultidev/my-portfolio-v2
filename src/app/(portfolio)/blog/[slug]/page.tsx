import SiteIcon from "../../../../components/portfolio/SiteIcon";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/db";
import BlogEngagement from "../../../../components/portfolio/BlogEngagement";
import Link from "next/link";
async function getPost(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160)
    return null;
  return db.blogPost.findFirst({ where: { slug, published: true } });
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  return {
    title: post ? `${post.title} — Worlu Prince` : "Post not found",
    description: post?.excerpt,
  };
}
function Paragraph({ text }: { text: string }) {
  return (
    <p>
      {text.split(/(https:\/\/[^\s<>]+)/g).map((part, i) =>
        /^https:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noreferrer">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <main className="article-page">
      <Link className="eyebrow" href="/blog">
        <SiteIcon name="arrow-left" /> BACK TO THE JOURNAL
      </Link>
      <header className="article-header">
        <span className="article-category">{post.category}</span>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="article-deck">{post.excerpt}</p>}
        <div className="article-meta">
          <span className="author-avatar">W</span>
          <strong>Worlu Prince</strong>
          <time>
            {(post.publishedAt ?? post.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </time>
          <span>
            {Math.max(1, Math.ceil(post.body.split(/\s+/).length / 200))} min
            read
          </span>
        </div>
      </header>
      {post.coverUrl && (
        <img className="article-cover" src={post.coverUrl} alt="" />
      )}
      <div className="article-body">
        {post.body.split(/\n\s*\n/).map((p, i) => (
          <Paragraph key={i} text={p} />
        ))}
      </div>
      <BlogEngagement id={post.id} title={post.title} />
      <Link className="text-button" href="/blog">
        More from the journal <SiteIcon name="arrow-right" />
      </Link>
    </main>
  );
}
