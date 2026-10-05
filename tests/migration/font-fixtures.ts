import { readFileSync } from "node:fs";
import type { BrowserContext } from "@playwright/test";

const packages: Record<string, URL> = {
  michroma: new URL(
    "../../node_modules/@fontsource/michroma/",
    import.meta.url,
  ),
  "google-sans-code": new URL(
    "../../node_modules/@fontsource-variable/google-sans-code/",
    import.meta.url,
  ),
};

// Test-only replay of the existing font families. Public font links are untouched.
export async function replayFonts(context: BrowserContext) {
  await context.route("https://fonts.googleapis.com/**", async (route) => {
    const family =
      new URL(route.request().url()).searchParams.get("family") ?? "";
    const key = family.startsWith("Michroma") ? "michroma" : "google-sans-code";
    const css = [
      "index.css",
      ...(key === "google-sans-code" ? ["wght-italic.css"] : []),
    ]
      .map((file) => readFileSync(new URL(file, packages[key]), "utf8"))
      .join("\n")
      .replaceAll("Google Sans Code Variable", "Google Sans Code")
      .replace(
        /url\(['"]?\.\/files\/([^'")]+)['"]?\)/g,
        (_, filename) =>
          `url("https://fonts.gstatic.com/migration-fonts/${key}/${filename}")`,
      );
    await route.fulfill({ contentType: "text/css", body: css });
  });
  await context.route(
    "https://fonts.gstatic.com/migration-fonts/**",
    async (route) => {
      const segments = new URL(route.request().url()).pathname.split("/");
      const key = segments[2];
      const filename = segments[3];
      if (!packages[key] || !filename || segments.length !== 4)
        throw new Error("Unknown test font");
      await route.fulfill({
        contentType: filename.endsWith(".woff2") ? "font/woff2" : "font/woff",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: readFileSync(new URL(`files/${filename}`, packages[key])),
      });
    },
  );
}
