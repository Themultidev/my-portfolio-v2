import SiteIcon from "../../../components/portfolio/SiteIcon";
import { db } from "../../../lib/db";
import { blogCategories } from "../../../lib/blog-validation";
import { blogCounts } from "../../../lib/blog-store";
import Link from "next/link";
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const category =
    typeof query.category === "string" &&
    blogCategories.includes(query.category as (typeof blogCategories)[number])
      ? query.category
      : "";
  const search =
    typeof query.q === "string" ? query.q.slice(0, 120).trim() : "";
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(query.page) || 1)),
  );
  const where = {
    published: true,
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { body: { contains: search } },
          ],
        }
      : {}),
  };
  const [posts, total, featured] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 9,
      take: 9,
      include: blogCounts,
    }),
    db.blogPost.count({ where }),
    !category && !search && page === 1
      ? db.blogPost.findFirst({
          where: { published: true, featured: true },
          orderBy: { publishedAt: "desc" },
          include: blogCounts,
        })
      : null,
  ]);
  const feature =
    featured ?? (!category && !search && page === 1 ? posts[0] : null);
  function url(c: string, p = 1) {
    const params = new URLSearchParams();
    if (c) params.set("category", c);
    if (search) params.set("q", search);
    if (p > 1) params.set("page", String(p));
    return `/blog${params.size ? `?${params}` : ""}`;
  }
  return (
    <main className="blog-page">
      <div className="blog-heading">
        <span className="eyebrow tag">THE JOURNAL</span>
        <h1>
          Curiosity, in good company<span className="accent">.</span>
        </h1>
        <p>
          What I’ve been up to lately. Ideas, contributions and perspectives on
          technology, people and the world around us.
        </p>
      </div>
      {feature && (
        <Link href={`/blog/${feature.slug}`} className="featured-post">
          {feature.coverUrl ? (
            <img src={feature.coverUrl} alt="" fetchPriority="high" />
          ) : (
            <div className="editorial-art" aria-hidden="true">
              <span>
                Ideas worth
                <br />
                putting into words.
              </span>
              <i>
                <SiteIcon name="star" />
              </i>
            </div>
          )}
          <div className="featured-overlay">
            <span className="eyebrow">FEATURED / {feature.category}</span>
            <h2>
              {feature.title}
              <span>
                <SiteIcon name="arrow-up-right" />
              </span>
            </h2>
            <p>{feature.excerpt}</p>
            <div className="article-meta">
              <span className="author-avatar">W</span>
              <span>Worlu Prince</span>
              <span>·</span>
              <time>
                {(feature.publishedAt ?? feature.createdAt).toLocaleDateString(
                  "en-GB",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  },
                )}
              </time>
              <span className="category-pill">{feature.category}</span>
            </div>
          </div>
        </Link>
      )}
      <div className="blog-discovery">
        <nav className="filter-tabs" aria-label="Blog categories">
          <Link href={url("")} aria-current={!category ? "page" : undefined}>
            All
          </Link>
          {blogCategories.map((c) => (
            <Link
              key={c}
              href={url(c)}
              aria-current={category === c ? "page" : undefined}
            >
              {c}
            </Link>
          ))}
        </nav>
        <form role="search" className="blog-search">
          <label className="sr-only" htmlFor="blog-search">
            Search blog
          </label>
          {category && <input type="hidden" name="category" value={category} />}
          <input
            id="blog-search"
            name="q"
            defaultValue={search}
            placeholder="Search the journal…"
            maxLength={120}
          />
          <button aria-label="Search">⌕</button>
        </form>
      </div>
      <div className="section-heading results-heading">
        <p className="eyebrow">{category || "LATEST FROM THE JOURNAL"}</p>
        <span>
          {total} {total === 1 ? "story" : "stories"}
        </span>
      </div>
      {posts.length ? (
        <div className="article-grid">
          {posts.map((post) => (
            <article key={post.id}>
              <Link href={`/blog/${post.slug}`} className="article-card">
                {post.coverUrl ? (
                  <img src={post.coverUrl} alt="" loading="lazy" />
                ) : (
                  <div className="card-art" aria-hidden="true">
                    <span>{post.category}</span>
                    <i>
                      <SiteIcon name="star" />
                    </i>
                  </div>
                )}
                <p className="article-category">{post.category}</p>
                <h2>
                  {post.title}
                  <span aria-hidden="true">
                    <SiteIcon name="arrow-up-right" />
                  </span>
                </h2>
                <p className="article-excerpt">{post.excerpt}</p>
                <div className="article-meta">
                  <span className="author-avatar">W</span>
                  <span>Worlu Prince</span>
                  <time>
                    {(post.publishedAt ?? post.createdAt).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", timeZone: "UTC" },
                    )}
                  </time>
                </div>
                <div className="article-counts">
                  ♡ {post._count.likes}{" "}
                  <span>{post._count.comments} comments</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="journal-empty">
          <span>
            <SiteIcon name="star" />
          </span>
          <h2>
            {search || category
              ? "No stories here just yet."
              : "A new chapter is taking shape."}
          </h2>
          <p>
            {search || category
              ? "Try another category or search."
              : "My latest work, ideas and discoveries will land here. Come back soon."}
          </p>
          <Link
            className="outline-button"
            href={search || category ? "/blog" : "/#projects"}
          >
            {search || category ? "Browse all stories" : "Explore my projects"}{" "}
            <SiteIcon name="arrow-up-right" />
          </Link>
        </div>
      )}
      {total > 9 && (
        <nav className="pagination" aria-label="Blog pages">
          {page > 1 ? (
            <Link href={url(category, page - 1)}>
              <SiteIcon name="arrow-left" /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {page} of {Math.ceil(total / 9)}
          </span>
          {page * 9 < total ? (
            <Link href={url(category, page + 1)}>
              Next <SiteIcon name="arrow-right" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
