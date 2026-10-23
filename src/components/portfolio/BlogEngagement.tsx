"use client";
import { useCallback, useEffect, useState } from "react";
type Comment = { id: number; author: string; body: string; createdAt: string };
type State = {
  likes: number;
  liked: boolean;
  comments: Comment[];
  total: number;
  page: number;
};
export default function BlogEngagement({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const url = `/api/blog/${id}/engagement`;
  const load = useCallback(
    async (signal?: AbortSignal, requestedPage = page) => {
      const r = await fetch(`${url}?page=${requestedPage}`, { signal });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message ?? "Unable to load comments.");
      return d as State;
    },
    [url, page],
  );
  useEffect(() => {
    const c = new AbortController();
    void load(c.signal)
      .then((d) => {
        if (!c.signal.aborted) setState(d);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [load, retry]);
  async function mutate(action: "like" | "comment") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "like"
            ? { action, liked: !state?.liked }
            : { action, author, body, website },
        ),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message ?? "Please try again.");
      if (action === "comment") {
        setBody("");
        setPage(1);
      }
      setState(await load(undefined, action === "comment" ? 1 : page));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    setShareMessage("");
    try {
      if (navigator.share) await navigator.share({ title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setShareMessage("Link copied.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setShareMessage("Copy the page URL from your address bar to share.");
    }
  }
  return (
    <section className="blog-engagement" aria-label="Post conversation">
      <div className="engagement-bar">
        <button
          className={state?.liked ? "like-button liked" : "like-button"}
          aria-pressed={state?.liked ?? false}
          disabled={busy || !state}
          onClick={() => void mutate("like")}
        >
          {state?.liked ? "♥" : "♡"} {state?.likes ?? 0}{" "}
          <span>{state?.liked ? "Liked" : "Like this story"}</span>
        </button>
        <button className="outline-button" onClick={() => void share()}>
          Share story ↗
        </button>
        <span role="status">{shareMessage}</span>
      </div>
      <div className="section-heading">
        <h2>
          Join the conversation<span className="accent">.</span>
        </h2>
        <span>{state?.total ?? 0} comments</span>
      </div>
      <p className="help-text">
        Comments appear immediately. Keep it thoughtful and respectful. Your
        name and comment will be public.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void mutate("comment");
        }}
      >
        <label htmlFor="comment-name">
          Your name
          <input
            id="comment-name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={60}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <label htmlFor="comment-body">
          Your perspective
          <textarea
            id="comment-body"
            required
            maxLength={2000}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add to the conversation…"
          />
        </label>
        <div className="comment-trap" aria-hidden="true">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>
        <button className="accent-button" disabled={busy}>
          {busy ? "Sending…" : "Post comment ↗"}
        </button>
      </form>
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            onClick={() => {
              setError("");
              setRetry(retry + 1);
            }}
          >
            Retry loading
          </button>
        </p>
      )}
      <div className="comments-list">
        {state?.comments.map((c) => (
          <article className="comment" key={c.id}>
            <div className="comment-heading">
              <span className="author-avatar">
                {c.author.slice(0, 1).toUpperCase()}
              </span>
              <strong>{c.author}</strong>
              <time>
                {new Date(c.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </div>
            <p>{c.body}</p>
          </article>
        ))}
      </div>
      {(state?.total ?? 0) > 20 && (
        <div className="pagination">
          <button
            disabled={page === 1 || busy}
            onClick={() => setPage(page - 1)}
          >
            ← Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * 20 >= (state?.total ?? 0) || busy}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
