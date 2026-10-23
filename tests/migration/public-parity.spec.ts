import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { replayFonts } from "./font-fixtures";
const baseline: {
  viewports: number[];
  assets: { url: string; sha256: string | null }[];
} = JSON.parse(
  readFileSync(
    new URL("../../migration/static-baseline.json", import.meta.url),
    "utf8",
  ),
);

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
      [...document.images]
        .filter((image) => image.complete)
        .map((image) => image.decode().catch(() => undefined)),
    );
  });
  await page.addStyleTag({ content: frozenStyles });
}

// The owner approved a new theme, navigation, hero and About design.
// Test responsive behavior and capture review artifacts instead of comparing
// these pages to the retired black/blue/yellow screenshots.
for (const width of baseline.viewports) {
  for (const route of ["/", "/overview.html", "/blog"]) {
    test(
      route + " supports both themes at " + width + "px",
      async ({ context }, testInfo) => {
        await replayFonts(context);
        await context.route("**/api/github**", (r) =>
          r.fulfill({ json: { calendar: [], commits: [], nextPage: null } }),
        );
        await context.route("https://www.google.com/maps/embed**", (r) =>
          r.fulfill({ contentType: "text/html", body: "" }),
        );
        const page = await context.newPage();
        await page.setViewportSize({ width, height: 900 });
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await ready(page, nextOrigin + route);
        await expect(page.locator("[data-admin-toolbar]")).toHaveCount(0);
        if (route === "/") {
          await expect(page.locator(".new-hero")).toBeVisible();
          await expect(page.locator(".skills-columns>div")).toHaveCount(3);
        }
        if (route === "/blog")
          await expect(page.locator(".blog-heading")).toBeVisible();
        for (const theme of ["light", "dark"]) {
          await page.evaluate((t) => {
            document.documentElement.dataset.theme = t;
          }, theme);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          await testInfo.attach(theme, {
            body: await page.screenshot({
              fullPage: true,
              animations: "disabled",
              mask: [page.locator("iframe")],
            }),
            contentType: "image/png",
          });
        }
        expect(errors).toEqual([]);
      },
    );
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
  const animated = page.locator("#projects [data-aos]").first();
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
