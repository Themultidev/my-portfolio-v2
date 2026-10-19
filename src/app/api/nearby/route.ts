import { db } from "../../../lib/db";
import { apiJson, unexpectedApiFailure } from "../../../lib/api-response";
import {
  visitorCountry,
  nigeriaRegion,
  countryName,
  regionName,
} from "../../../lib/countries";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const country = visitorCountry(request.headers);
    if (!country) return apiJson({ country: null, region: null, projects: [] });
    const region =
      country === "NG"
        ? nigeriaRegion(request.headers.get("x-vercel-ip-country-region"))
        : null;
    const projects = await db.project.findMany({
      where: { published: true, countryCode: country },
      select: {
        id: true,
        title: true,
        description: true,
        photoUrl: true,
        link: true,
        repoUrl: true,
        countryCode: true,
        regionCode: true,
      },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    const local = region
      ? projects.filter((project) => project.regionCode === region)
      : [];
    return apiJson({
      country: { code: country, name: countryName(country) },
      region: region ? { code: region, name: regionName(region) } : null,
      scope: local.length ? "region" : "country",
      projects: local.length ? local : projects,
    });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
