import "server-only";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";
export const commitLanguages = [
  "All",
  "PHP",
  "Python",
  "JavaScript",
  "Rust",
  "Go",
  "SQL/MySQL",
  "TypeScript",
] as const;
const extensions: Record<string, string> = {
  php: "PHP",
  py: "Python",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  rs: "Rust",
  go: "Go",
  sql: "SQL/MySQL",
  ts: "TypeScript",
  tsx: "TypeScript",
};
export function fileLanguages(files: { filename: string }[]) {
  return [
    ...new Set(
      files
        .map(
          (f) => extensions[f.filename.split(".").pop()?.toLowerCase() ?? ""],
        )
        .filter(Boolean),
    ),
  ];
}
export type Contribution = {
  date: string;
  level: number;
  count: number | null;
};
export function parseContributions(html: string): Contribution[] {
  const result: Contribution[] = [];
  const root = parseFragment(html);
  const seen = new Set<string>();
  function walk(node: DefaultTreeAdapterTypes.Node) {
    if ("attrs" in node) {
      const attrs = Object.fromEntries(
        node.attrs.map((a) => [a.name, a.value]),
      );
      const date = attrs["data-date"];
      if (/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") && !seen.has(date)) {
        seen.add(date);
        result.push({
          date,
          level: Math.max(0, Math.min(4, Number(attrs["data-level"]) || 0)),
          count:
            attrs["data-count"] !== undefined
              ? Number(attrs["data-count"])
              : null,
        });
      }
    }
    if ("childNodes" in node) node.childNodes.forEach(walk);
  }
  walk(root);
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
async function githubJson(path: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("GitHub activity is temporarily unavailable.");
  return response.json();
}
export async function getContributions(
  username: string,
): Promise<Contribution[]> {
  if (process.env.GITHUB_TOKEN) {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}",
        variables: { login: username },
      }),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    const weeks =
      body.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (response.ok && Array.isArray(weeks))
      return weeks.flatMap(
        (w: {
          contributionDays: {
            date: string;
            contributionCount: number;
            contributionLevel: string;
          }[];
        }) =>
          w.contributionDays.map((d) => ({
            date: d.date,
            count: d.contributionCount,
            level: [
              "NONE",
              "FIRST_QUARTILE",
              "SECOND_QUARTILE",
              "THIRD_QUARTILE",
              "FOURTH_QUARTILE",
            ].indexOf(d.contributionLevel),
          })),
      );
  }
  const response = await fetch(
    `https://github.com/users/${encodeURIComponent(username)}/contributions`,
    { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok) throw new Error("Calendar unavailable.");
  return parseContributions(await response.text());
}
export async function getCommits(
  username: string,
  language: string,
  page: number,
) {
  const data = await githubJson(
    `/search/commits?q=${encodeURIComponent(`author:${username}`)}&sort=author-date&order=desc&per_page=20&page=${page}`,
  );
  const items = data.items ?? [];
  const commits = await Promise.all(
    items.map(
      async (item: {
        sha: string;
        html_url: string;
        commit: { message: string; author: { date: string } };
        repository: { full_name: string };
      }) => {
        const repo = item.repository.full_name;
        if (
          !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo) ||
          !/^[a-f0-9]{40}$/.test(item.sha)
        )
          return null;
        let languages: string[] = [];
        try {
          const detail = await githubJson(`/repos/${repo}/commits/${item.sha}`);
          languages = fileLanguages(detail.files ?? []);
        } catch {
          if (language !== "All") return null;
        }
        if (language !== "All" && !languages.includes(language)) return null;
        return {
          sha: item.sha,
          url: `https://github.com/${repo}/commit/${item.sha}`,
          message: item.commit.message.split("\n")[0],
          date: item.commit.author.date,
          repo,
          languages,
        };
      },
    ),
  );
  return {
    commits: commits.filter((c) => c !== null),
    nextPage: items.length === 20 && page < 50 ? page + 1 : null,
  };
}
