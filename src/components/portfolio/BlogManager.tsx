"use client";
import SiteIcon from "./SiteIcon";
import { useState } from "react";
import { blogCategories, type PostDraft } from "../../lib/blog-validation";
import { uploadPortfolioFile } from "../../lib/upload-client";
import { useEditMode } from "../editor/EditModeProvider";
type Post = PostDraft & {
  id: number;
  updatedAt: string;
  _count: { likes: number; comments: number };
};
type Comment = { id: number; author: string; body: string; createdAt: string };
const empty: PostDraft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverUrl: null,
  category: "Personal updates",
  featured: false,
  published: false,
};
export default function BlogManager({ initial }: { initial: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [id, setId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const editor = useEditMode();
  function change(patch: Partial<PostDraft>) {
    setDraft((value) => (value ? { ...value, ...patch } : value));
    editor?.setDirty("blog-draft", true);
  }
  function open(post?: Post) {
    if (!editor?.confirmLeave() && editor) return;
    setMessage("");
    setComments([]);
    setId(post?.id ?? null);
    setDraft(
      post
        ? {
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            body: post.body,
            coverUrl: post.coverUrl,
            category: post.category,
            featured: post.featured,
            published: post.published,
          }
        : { ...empty },
    );
    editor?.setDirty("blog-draft", false);
  }
  async function json(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message ?? "Request failed.");
    return d;
  }
  async function reload() {
    const result = await json("/api/admin/blog");
    setPosts(result.posts);
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const data = await json(
        id ? `/api/admin/blog/${id}` : "/api/admin/blog",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      setId(data.post.id);
      editor?.setDirty("blog-draft", false);
      await reload();
      setMessage(
        data.post.published
          ? "Post published. It is now visible on your blog."
          : "Draft saved. Only you can see it.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(postId: number) {
    if (!confirm("Delete this post, its comments and its likes permanently?"))
      return;
    setBusy(true);
    try {
      await json(`/api/admin/blog/${postId}`, { method: "DELETE" });
      if (id === postId) {
        setDraft(null);
        setId(null);
        editor?.setDirty("blog-draft", false);
      }
      await reload();
      setMessage("Post deleted.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }
  async function cover(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      change({ coverUrl: await uploadPortfolioFile(file, "project") });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  async function loadComments(page = 1) {
    if (!id) return;
    setBusy(true);
    try {
      const d = await json(`/api/admin/blog/${id}/comments?page=${page}`);
      setComments(d.comments);
      setCommentPage(page);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to load comments.");
    } finally {
      setBusy(false);
    }
  }
  async function deleteComment(comment: number) {
    if (!id || !confirm("Remove this comment?")) return;
    setBusy(true);
    try {
      await json(`/api/admin/blog/${id}/comments?comment=${comment}`, {
        method: "DELETE",
      });
      setComments((c) => c.filter((v) => v.id !== comment));
      await reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to delete comment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="studio-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR EDITORIAL DESK</p>
          <h1>
            Blog studio<span className="accent">.</span>
          </h1>
        </div>
        <button
          className="accent-button"
          disabled={busy}
          onClick={() => open()}
        >
          + New post
        </button>
      </div>
      <p className="page-description">
        Write, publish and keep the conversation going.{" "}
        <a href="/blog" target="_blank" rel="noreferrer">
          View blog <SiteIcon name="arrow-up-right" />
        </a>{" "}
        · <a href="/admin/settings">Music settings</a>
      </p>
      <p role="status">{message}</p>
      <div className="blog-studio-grid">
        <aside className="studio-panel post-list">
          <h2>
            Your posts <small>({posts.length})</small>
          </h2>
          {!posts.length && (
            <p>No posts yet. Start with what you’ve been up to lately.</p>
          )}
          {posts.map((post) => (
            <div
              key={post.id}
              className={
                id === post.id ? "post-list-item selected" : "post-list-item"
              }
            >
              <button disabled={busy} onClick={() => open(post)}>
                <small>
                  {post.published ? "PUBLISHED" : "DRAFT"} · {post.category}
                </small>
                <strong>{post.title}</strong>
                <small>
                  ♡ {post._count.likes} · {post._count.comments} comments
                </small>
              </button>
              <button
                className="danger-text"
                disabled={busy}
                onClick={() => void remove(post.id)}
                aria-label={`Delete ${post.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </aside>
        {draft ? (
          <form
            className="studio-panel post-editor"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy}>
              <label>
                Title
                <input
                  required
                  maxLength={180}
                  value={draft.title}
                  onChange={(e) => {
                    const patch: Partial<PostDraft> = { title: e.target.value };
                    if (
                      !id &&
                      (!draft.slug ||
                        draft.slug ===
                          draft.title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""))
                    )
                      patch.slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "");
                    change(patch);
                  }}
                />
              </label>
              <div className="form-grid">
                <label>
                  Post URL /blog/
                  <input
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    maxLength={160}
                    value={draft.slug}
                    onChange={(e) => change({ slug: e.target.value })}
                  />
                </label>
                <label>
                  Category
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      change({
                        category: e.target.value as PostDraft["category"],
                      })
                    }
                  >
                    {blogCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Cover image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => void cover(e.target.files?.[0])}
                />
              </label>
              {draft.coverUrl && (
                <div className="cover-preview">
                  <img src={draft.coverUrl} alt="Post cover preview" />
                  <button
                    type="button"
                    onClick={() => change({ coverUrl: null })}
                  >
                    Remove cover
                  </button>
                </div>
              )}
              <label>
                Excerpt
                <textarea
                  maxLength={400}
                  rows={3}
                  value={draft.excerpt}
                  onChange={(e) => change({ excerpt: e.target.value })}
                />
              </label>
              <label>
                Article
                <textarea
                  required
                  maxLength={50000}
                  rows={20}
                  value={draft.body}
                  placeholder="What have you been up to lately? Separate paragraphs with a blank line."
                  onChange={(e) => change({ body: e.target.value })}
                />
              </label>
              <p className="help-text">
                Plain text, with blank lines between paragraphs. Links written
                as full HTTPS URLs become clickable.
              </p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => change({ featured: e.target.checked })}
                />{" "}
                Feature this post on the blog homepage
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => change({ published: e.target.checked })}
                />{" "}
                Published — visible to everyone
              </label>
              <button className="accent-button" type="submit">
                {busy
                  ? "Saving…"
                  : draft.published
                    ? "Save & publish"
                    : "Save draft"}
              </button>
              {id && draft.published && (
                <a
                  className="text-button"
                  href={`/blog/${draft.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read post <SiteIcon name="arrow-up-right" />
                </a>
              )}
            </fieldset>
            {id && (
              <section className="comment-moderation">
                <div className="section-heading">
                  <h3>Comments</h3>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void loadComments()}
                  >
                    Load comments
                  </button>
                </div>
                <p className="help-text">
                  Visitor comments appear immediately. Remove unwanted comments
                  here.
                </p>
                {comments.map((c) => (
                  <div className="comment" key={c.id}>
                    <strong>{c.author}</strong>
                    <time>{new Date(c.createdAt).toLocaleDateString()}</time>
                    <p>{c.body}</p>
                    <button
                      type="button"
                      disabled={busy}
                      className="danger-text"
                      onClick={() => void deleteComment(c.id)}
                    >
                      Delete comment
                    </button>
                  </div>
                ))}
                <div className="pagination">
                  <button
                    type="button"
                    disabled={busy || commentPage === 1}
                    onClick={() => void loadComments(commentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={busy || comments.length < 50}
                    onClick={() => void loadComments(commentPage + 1)}
                  >
                    More comments
                  </button>
                </div>
              </section>
            )}
          </form>
        ) : (
          <div className="studio-panel studio-empty">
            <span className="empty-symbol">
              <SiteIcon name="star" />
            </span>
            <h2>A space for your next thought.</h2>
            <p>Select a post, or start something new.</p>
          </div>
        )}
      </div>
    </main>
  );
}
