"use client";
import SiteIcon from "./SiteIcon";
import { useEffect, useState } from "react";
import { useEditMode } from "../editor/EditModeProvider";
import { parseSettings, SETTINGS_KEY } from "../../lib/site-settings";
type Activity = {
  calendar: { date: string; level: number; count: number | null }[];
  commits: {
    sha: string;
    url: string;
    message: string;
    date: string;
    repo: string;
    languages: string[];
  }[];
  nextPage: number | null;
  commitsUnavailable?: boolean;
};
export default function GitHubActivity() {
  const settings = parseSettings(useEditMode()?.blocks[SETTINGS_KEY]?.value);
  const [language, setLanguage] = useState("All");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Activity | null>(null);
  const [calendar, setCalendar] = useState<Activity["calendar"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/github?language=${encodeURIComponent(language)}&page=${page}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok)
          throw new Error(value.error?.message ?? "Activity unavailable.");
        return value as Activity;
      })
      .then((value) => {
        setData(value);
        if (value.calendar.length) setCalendar(value.calendar);
        setLoading(false);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [language, page, retry]);
  return (
    <div className="github-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE WORK, IN MOTION</p>
          <h3>
            Small commits. Steady progress<span className="accent">.</span>
          </h3>
        </div>
        <a
          href={`https://github.com/${settings.githubUsername}`}
          target="_blank"
          rel="noreferrer"
          className="text-button"
        >
          GitHub <SiteIcon name="arrow-up-right" />
        </a>
      </div>
      <div className="contribution-panel">
        {calendar.length ? (
          <>
            <div className="contribution-scroll">
              <div className="contribution-grid">
                {calendar.map((day) => (
                  <span
                    key={day.date}
                    data-level={day.level}
                    title={`${day.date}: ${day.count === null ? `activity level ${day.level}/4` : `${day.count} contributions`}`}
                    aria-label={`${day.date}, ${day.count ?? `level ${day.level}`} contributions`}
                  />
                ))}
              </div>
            </div>
            <p className="calendar-caption">
              Public GitHub activity{" "}
              <span>
                Less <i data-level="0" />
                <i data-level="1" />
                <i data-level="2" />
                <i data-level="3" />
                <i data-level="4" /> More
              </span>
            </p>
          </>
        ) : (
          <p>
            {loading ? (
              "Fetching activity from GitHub…"
            ) : (
              <>
                Calendar unavailable right now. View my activity on GitHub{" "}
                <SiteIcon name="arrow-up-right" />
              </>
            )}
          </p>
        )}
      </div>
      <p className="eyebrow commits-heading">CHECK RECENT COMMITS ON</p>
      <div className="filter-tabs" role="group" aria-label="Commit language">
        {[
          "All",
          "PHP",
          "Python",
          "JavaScript",
          "Rust",
          "Go",
          "SQL/MySQL",
          "TypeScript",
        ].map((name) => (
          <button
            key={name}
            aria-pressed={language === name}
            onClick={() => {
              setLoading(true);
              setLanguage(name);
              setPage(1);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="commit-list" aria-busy={loading}>
        {loading ? (
          <p>Checking recent commits…</p>
        ) : error ? (
          <p role="alert">
            {error}{" "}
            <button
              onClick={() => {
                setLoading(true);
                setRetry(retry + 1);
              }}
            >
              Retry
            </button>
          </p>
        ) : data?.commitsUnavailable ? (
          <p>
            GitHub’s request limit may have been reached.{" "}
            <a
              href={`https://github.com/${settings.githubUsername}`}
              target="_blank"
              rel="noreferrer"
            >
              See activity on GitHub <SiteIcon name="arrow-up-right" />
            </a>
          </p>
        ) : data?.commits.length ? (
          data.commits.map((commit) => (
            <a
              className="commit-row"
              key={commit.sha}
              href={commit.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="commit-dot" />
              <div>
                <strong>{commit.message}</strong>
                <small>
                  {commit.repo} · {commit.languages.join(", ")}
                </small>
              </div>
              <time dateTime={commit.date}>
                {new Date(commit.date).toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </time>
              <code>
                {commit.sha.slice(0, 7)} <SiteIcon name="arrow-up-right" />
              </code>
            </a>
          ))
        ) : (
          <p>
            No {language === "All" ? "public" : language} commits in this batch.
            Try the next page.
          </p>
        )}
      </div>
      <div className="pagination">
        <button
          disabled={loading || page === 1}
          onClick={() => {
            setLoading(true);
            setPage(page - 1);
          }}
        >
          <SiteIcon name="arrow-left" /> Previous
        </button>
        <span>Batch {page}</span>
        <button
          disabled={loading || !data?.nextPage}
          onClick={() => {
            setLoading(true);
            setPage(data!.nextPage!);
          }}
        >
          Next <SiteIcon name="arrow-right" />
        </button>
      </div>
      <p className="help-text">
        Language filters use changed file extensions in each batch of 20 public
        commits. SQL files include MySQL work.
      </p>
    </div>
  );
}
