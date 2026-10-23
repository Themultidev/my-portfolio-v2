import {
  apiJson,
  ApiError,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { getSiteSettings } from "../../../lib/settings-store";
import {
  commitLanguages,
  getCommits,
  getContributions,
} from "../../../lib/github";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const language = query.get("language") ?? "All";
    const page = Number(query.get("page") ?? 1);
    if (
      !commitLanguages.includes(language as (typeof commitLanguages)[number]) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 50
    )
      throw new ApiError(
        400,
        "VALIDATION",
        "Choose a valid language and page.",
      );
    const { githubUsername: username } = await getSiteSettings();
    const [calendar, result] = await Promise.allSettled([
      page === 1 ? getContributions(username) : Promise.resolve([]),
      getCommits(username, language, page),
    ]);
    return apiJson({
      username,
      calendar: calendar.status === "fulfilled" ? calendar.value : [],
      calendarUnavailable: calendar.status === "rejected",
      ...(result.status === "fulfilled"
        ? result.value
        : { commits: [], nextPage: null, commitsUnavailable: true }),
      page,
    });
  } catch (e) {
    return unexpectedApiFailure(e);
  }
}
