import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { replayFonts } from "./font-fixtures";
import { iconCorrections } from "../../scripts/lib/approved-icon-corrections.mjs";
const baseline: {
  viewports: number[];
  assets: { url: string; sha256: string | null }[];
} = JSON.parse(
  readFileSync(
    new URL("../../migration/static-baseline.json", import.meta.url),
    "utf8",
  ),
);

const staticOrigin = "http://127.0.0.1:4100";
const nextOrigin = "http://127.0.0.1:3100";
const frozenStyles = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  [data-aos] { opacity: 1 !important; transform: none !important; }
`;

async function ready(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) =>
        image.decode().catch(() => undefined),
      ),
    );
  });
  await page.addStyleTag({ content: frozenStyles });
}

async function publicDom(page: Page) {
  return page.evaluate(() => {
    function visit(node: Node): unknown {
      if (node.nodeType === Node.COMMENT_NODE) return null;
      if (node.nodeType === Node.TEXT_NODE)
        return node.textContent?.trim() ? { text: node.textContent } : null;
      if (!(node instanceof Element)) return null;
      if (node.matches("script, style, link, next-route-announcer"))
        return null;
      // Next's streamed metadata placeholder is an empty, hidden body child.
      const children = [...node.childNodes].map(visit).filter(Boolean);
      if (
        node.parentElement === document.body &&
        node.matches("div[hidden]") &&
        !children.length
      )
        return null;
      const inlineStyle =
        node instanceof HTMLElement || node instanceof SVGElement
          ? [...node.style]
              .map(
                (property) =>
                  `${property}:${getComputedStyle(node).getPropertyValue(property)}`,
              )
              .sort()
              .join(";")
          : "";
      const attrs = [...node.attributes]
        .filter(
          (attr) =>
            !["data-aos", "data-aos-delay", "data-aos-duration"].includes(
              attr.name,
            ),
        )
        .filter((attr) => !(attr.name === "minlength" && attr.value === ""))
        .filter((attr) => attr.name !== "style" || inlineStyle)
        .map((attr) => [
          attr.name,
          attr.name === "class"
            ? attr.value.replace(/\s*aos-(?:init|animate)\b/g, "")
            : attr.name === "style"
              ? inlineStyle
              : attr.value,
        ])
        .sort(([a], [b]) => a.localeCompare(b));
      return {
        tag: node.tagName.toLowerCase(),
        attrs,
        children,
      };
    }
    return visit(document.body);
  });
}

for (const width of baseline.viewports) {
  for (const route of ["/", "/overview.html"]) {
    test(`${route} matches the original at ${width}px`, async ({
      context,
    }, testInfo) => {
      await replayFonts(context);
      // The embedded map is third-party content. Keep its frame and dimensions,
      // but replace its document consistently and mask it in both screenshots.
      await context.route("https://www.google.com/maps/embed**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><html><body></body></html>",
        }),
      );
      const original = await context.newPage();
      const migrated = await context.newPage();
      await original.setViewportSize({ width, height: 900 });
      await migrated.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      migrated.on("pageerror", (error) => errors.push(error.message));
      await ready(original, `${staticOrigin}${route}`);
      // Explicit owner-requested artwork changes; compare all remaining markup
      // and pixels strictly against the frozen original without rewriting it.
      if (route === "/")
        await original.evaluate((icons) => {
          for (const [name, svg] of Object.entries(icons)) {
            const label = [...document.querySelectorAll("#about span")].find(
              (span) => span.textContent?.trim() === name,
            );
            const old = label?.parentElement?.querySelector("svg");
            if (!old) throw new Error(`Missing original icon ${name}`);
            old.outerHTML = svg;
          }
        }, iconCorrections());
      await ready(migrated, `${nextOrigin}${route}`);
      writeFileSync(
        testInfo.outputPath("browser-errors.json"),
        JSON.stringify(errors, null, 2),
      );
      expect(await publicDom(migrated)).toEqual(await publicDom(original));
      expect(errors).toEqual([]);

      const referenceBuffer = await original.screenshot({
        fullPage: true,
        animations: "disabled",
        mask: [original.locator("iframe")],
      });
      const migratedBuffer = await migrated.screenshot({
        fullPage: true,
        animations: "disabled",
        mask: [migrated.locator("iframe")],
      });
      await testInfo.attach("original", {
        body: referenceBuffer,
        contentType: "image/png",
      });
      await testInfo.attach("next", {
        body: migratedBuffer,
        contentType: "image/png",
      });
      const reference = PNG.sync.read(referenceBuffer);
      const actual = PNG.sync.read(migratedBuffer);
      expect({ width: actual.width, height: actual.height }).toEqual({
        width: reference.width,
        height: reference.height,
      });
      const diff = new PNG({
        width: reference.width,
        height: reference.height,
      });
      const pixels = pixelmatch(
        reference.data,
        actual.data,
        diff.data,
        reference.width,
        reference.height,
        { threshold: 0.1 },
      );
      if (pixels)
        await testInfo.attach("diff", {
          body: PNG.sync.write(diff),
          contentType: "image/png",
        });
      expect(
        pixels,
        "Different screenshot pixels (excluding anti-aliasing)",
      ).toBe(0);

      const fonts = await migrated.evaluate(() =>
        [...document.fonts].map((font) => ({
          family: font.family,
          status: font.status,
        })),
      );
      writeFileSync(
        testInfo.outputPath("fonts.json"),
        JSON.stringify(fonts, null, 2),
      );
      if (route === "/") {
        expect(
          fonts.some(
            (font) => font.family === "Michroma" && font.status === "loaded",
          ),
        ).toBe(true);
        expect(fonts.some((font) => font.family === "Google Sans Code")).toBe(
          true,
        );
      }
    });
  }
}

test("AOS retains its duration and activates sections on scroll", async ({
  page,
  context,
}) => {
  await replayFonts(context);
  await context.route("https://www.google.com/maps/embed**", (route) =>
    route.fulfill({ contentType: "text/html", body: "" }),
  );
  await page.goto(nextOrigin, { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute(
    "data-aos-duration",
    "1000",
  );
  const animated = page.locator("#about [data-aos]").first();
  await expect(animated).toHaveClass(/aos-init/);
  await animated.scrollIntoViewIfNeeded();
  await expect(animated).toHaveClass(/aos-animate/);
});

test("original asset files resolve without content changes", async ({
  request,
}) => {
  for (const asset of baseline.assets.filter(
    (asset) => !asset.url.replace(/^\//, "").startsWith("src/"),
  )) {
    const response = await request.get(`${nextOrigin}${asset.url}`);
    expect(response.status(), asset.url).toBe(200);
    expect(
      createHash("sha256")
        .update(await response.body())
        .digest("hex"),
      asset.url,
    ).toBe(asset.sha256);
  }
});

test("project overview link preserves the route and page metadata", async ({
  page,
}) => {
  await page.goto(nextOrigin);
  await page.locator('a[href="/overview.html"]').click();
  await expect(page).toHaveURL(`${nextOrigin}/overview.html`);
  await expect(page).toHaveTitle(
    "Face Attendance System — Overview | Worlu Prince",
  );
  await expect(page.locator("body")).toHaveAttribute(
    "class",
    "bg-slate-50 text-slate-800 antialiased",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://yourdomain.example/overview.html",
  );
  await expect(page.locator("h1")).toHaveText("Face Attendance System");
});

test("contact form keeps EmailJS success/reset and failure/retry behavior", async ({
  page,
}) => {
  let fail = false;
  let requests = 0;
  await page.route(
    "https://api.emailjs.com/api/v1.0/email/send-form",
    async (route) => {
      requests++;
      await route.fulfill({
        status: fail ? 500 : 200,
        contentType: "text/plain",
        body: fail ? "Test failure" : "OK",
      });
    },
  );
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
  await page.goto(nextOrigin, { waitUntil: "networkidle" });
  async function fill() {
    await page.locator('[name="fName"]').fill("John");
    await page.locator('[name="sName"]').fill("Doe");
    await page.locator('[name="email"]').fill("john@example.com");
    await page
      .locator('[name="mSg"]')
      .fill("Migration contact form verification.");
  }
  await fill();
  await page.locator('button[type="submit"]').click();
  await expect.poll(() => dialogs[0]).toBe("Message sent successfully!");
  await expect(page.locator('[name="fName"]')).toHaveValue("");
  fail = true;
  await fill();
  await page.locator('button[type="submit"]').click();
  await expect
    .poll(() => dialogs[1])
    .toBe("Something went wrong. Please try again.");
  await expect(page.locator('[name="mSg"]')).toHaveValue(
    "Migration contact form verification.",
  );
  expect(requests).toBe(2);
  await expect(page).toHaveURL(`${nextOrigin}/`);
});
