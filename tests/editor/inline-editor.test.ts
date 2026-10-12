import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type Admin } from "@prisma/client";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import {
  chromium,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import manifest from "../../prisma/seed-data.json";
import { seedPortfolio } from "../../prisma/seed-content";
import { createSessionToken } from "../../src/lib/session-token";
import { replayFonts } from "../migration/font-fixtures";

// Every write targets this disposable, migrated database. The real .env and
// portfolio database are neither read directly nor changed by these checks.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-editor-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const email = "editor-test@example.invalid";
const password = "Isolated editor test password";
const secret = "isolated-editor-test-secret-at-least-32-bytes";
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const editorPath = "/admin/edit/portfolio";
let origin = "";
let admin: Admin;
let browser: Browser | undefined;
let server: ChildProcess | undefined;
let logs = "";

async function freePort() {
  const listener = createServer();
  await new Promise<void>((resolveListen, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolveListen);
  });
  const address = listener.address();
  assert.ok(address && typeof address === "object");
  await new Promise<void>((resolveClose, reject) =>
    listener.close((error) => (error ? reject(error) : resolveClose())),
  );
  return address.port;
}

function request(path: string, init: RequestInit = {}) {
  return fetch(`${origin}${path}`, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
}

async function newContext(authenticated = true) {
  assert.ok(browser);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  await replayFonts(context);
  // The map is unrelated to editing and must not introduce a network dependency.
  await context.route("https://www.google.com/maps/embed**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Map fixture</title>",
    }),
  );
  if (authenticated) {
    await context.addCookies([
      {
        name: "__Host-portfolio_session",
        value: createSessionToken(admin, secret),
        // CDP requires a secure source URL for __Host- cookies. Chromium also
        // sends Secure cookies on HTTP localhost, as the real login test proves.
        url: origin.replace(/^http:/, "https:"),
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
  }
  return context;
}

async function withEditor(
  run: (page: Page, context: BrowserContext) => Promise<void>,
) {
  const context = await newContext();
  const errors: string[] = [];
  context.on("page", (openedPage) => {
    openedPage.on("pageerror", (error) => errors.push(error.message));
    openedPage.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydrat(?:ion|ing)|did not match|Minified React error/i.test(
          message.text(),
        )
      )
        errors.push(message.text());
    });
  });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}${editorPath}`);
    await expect(
      page.locator('[data-content-editor][data-block-key="hero.text.003"]'),
    ).toBeVisible();
    await run(page, context);
    assert.deepEqual(errors, [], "Editor raised a browser exception");
  } finally {
    await context.close();
  }
}

function marker(page: Page, key: string) {
  return page.locator(`[data-content-editor][data-block-key="${key}"]`).first();
}

function editingInput(page: Page, key: string) {
  return page.locator(`[data-content-editor-ui] [data-editing-input="${key}"]`);
}

async function openEditor(page: Page, key: string) {
  const target = marker(page, key);
  // Text wrappers use display:contents to preserve the original layout. Click
  // the rendered text rectangle, as a user does, rather than a nonexistent box.
  await target.evaluate((element) => {
    (element.parentElement ?? element).scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  });
  const point = await target.evaluate((element) => {
    if (["IMG", "INPUT", "TEXTAREA"].includes(element.tagName)) {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect =
      Array.from(range.getClientRects()).find(
        (candidate) => candidate.width > 0 && candidate.height > 0,
      ) ?? element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0)
      throw new Error(
        "Editable text and its empty marker have no visible rectangle",
      );
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page.mouse.click(point.x, point.y);
  const input = editingInput(page, key);
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  return input;
}

async function blockValue(key: string) {
  return (await db.contentBlock.findUniqueOrThrow({ where: { key } })).value;
}

function findElement(
  node: DefaultTreeAdapterTypes.Node,
  tagName: string,
): DefaultTreeAdapterTypes.Element | undefined {
  if ("tagName" in node && node.tagName === tagName) return node;
  if ("childNodes" in node) {
    for (const child of node.childNodes) {
      const found = findElement(child, tagName);
      if (found) return found;
    }
  }
}

function htmlText(node: DefaultTreeAdapterTypes.Node): string {
  if ("value" in node) return node.value;
  return "childNodes" in node ? node.childNodes.map(htmlText).join("") : "";
}

async function saveWithKeyboard(page: Page, key: string, value: string) {
  const input = await openEditor(page, key);
  await input.fill(value);
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/blocks/${key}` &&
      response.request().method() === "PATCH",
  );
  await input.press("Control+Enter");
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  assert.deepEqual(response.request().postDataJSON(), { value });
  await expect(input).toHaveCount(0);
  assert.equal(await blockValue(key), value);
}

async function assertPublicOnly(page: Page) {
  await expect(
    page.locator(
      "[data-content-editor], [data-content-editor-ui], [data-editable-attribute], [data-block-key], [data-editing-input], [data-admin-toolbar]",
    ),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);
}

before(
  async () => {
    execFileSync(
      process.execPath,
      [
        resolve(root, "node_modules/prisma/build/index.js"),
        "migrate",
        "deploy",
      ],
      {
        cwd: root,
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
        timeout: 30_000,
      },
    );
    await seedPortfolio(db, { ADMIN_EMAIL: email, ADMIN_PASSWORD: password });
    admin = await db.admin.findUniqueOrThrow({ where: { email } });
    const port = await freePort();
    origin = `http://localhost:${port}`;
    server = spawn(
      process.execPath,
      [
        resolve(root, "node_modules/next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          NODE_ENV: "production",
          DATABASE_URL: databaseUrl,
          ADMIN_EMAIL: email,
          ADMIN_PASSWORD: password,
          SESSION_SECRET: secret,
          APP_ORIGIN: origin,
          NEXT_TELEMETRY_DISABLED: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", (data) => {
      logs = (logs + String(data)).slice(-8000);
    });
    server.stderr?.on("data", (data) => {
      logs = (logs + String(data)).slice(-8000);
    });
    const deadline = Date.now() + 60_000;
    let ready = false;
    while (Date.now() < deadline) {
      if (server.exitCode !== null)
        throw new Error(`Editor test server exited: ${logs}`);
      try {
        const response = await request("/login");
        if (response.status === 200) {
          await response.text();
          ready = true;
          break;
        }
      } catch {
        /* Listener is starting. */
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
    if (!ready)
      throw new Error(`Editor test server did not become ready: ${logs}`);
    browser = await chromium.launch({ channel: "chrome", headless: true });
  },
  { timeout: 120_000 },
);

after(async () => {
  await browser?.close();
  const child = server;
  if (child && child.exitCode === null && child.signalCode === null) {
    await new Promise<void>((resolveStop) => {
      child.once("exit", () => resolveStop());
      child.kill();
    });
  }
  await db.$disconnect();
  assert.equal(dirname(resolve(directory)), parent);
  assert.ok(directory.startsWith(join(parent, "portfolio-editor-")));
  rmSync(directory, { recursive: true, force: true });
});

test(
  "login opens the whole portfolio and every seeded portfolio block is editable",
  { timeout: 60_000 },
  async () => {
    const context = await newContext(false);
    try {
      const page = await context.newPage();
      await page.goto(`${origin}/login`);
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL(`${origin}${editorPath}`);
      for (const id of ["home", "about", "projects", "contact", "footer"])
        await expect(page.locator(`section#${id}`)).toHaveCount(1);
      await expect(page.locator('header[class~="lg:hidden"] nav')).toHaveCount(
        1,
      );
      await expect(page.locator('header[class~="lg:block"] nav')).toHaveCount(
        1,
      );
      const actual = await page
        .locator("[data-content-editor][data-block-key]")
        .evaluateAll((elements) =>
          [
            ...new Set(
              elements.map((element) => element.getAttribute("data-block-key")),
            ),
          ].sort(),
        );
      const expected = manifest.content
        .filter(({ key }) => !key.startsWith("overview."))
        .map(({ key }) => key)
        .sort();
      assert.deepEqual(
        actual,
        expected,
        "The admin omits editable content from a portfolio section",
      );
      await expect(
        page.getByRole("button", { name: "Sign out", exact: true }),
      ).toBeVisible();
      await page.goto(`${origin}/admin`);
      assert.equal(page.url(), `${origin}${editorPath}`);
      await page.goto(`${origin}/login`);
      assert.equal(page.url(), `${origin}${editorPath}`);
    } finally {
      await context.close();
    }
  },
);

test(
  "nested hero text and long paragraphs save safely and appear publicly",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page, context) => {
      const key = "hero.text.003";
      const value = "WÖ <script>plain text</script> ";
      const originalClasses = await page
        .locator("#home h1 > span[class]")
        .evaluateAll((elements) =>
          elements.map((element) => element.className),
        );
      await saveWithKeyboard(page, key, value);
      await expect(marker(page, key)).toHaveText(value);
      assert.deepEqual(
        await page
          .locator("#home h1 > span[class]")
          .evaluateAll((elements) =>
            elements.map((element) => element.className),
          ),
        originalClasses,
      );
      await expect(marker(page, "hero.text.004")).toHaveText("RLU ");
      await expect(marker(page, "hero.text.005")).toHaveText("PRINCE");
      await page.reload();
      await expect(marker(page, key)).toHaveText(value);
      const paragraphKey = "projects.text.004";
      const originalParagraph = await blockValue(paragraphKey);
      const paragraphValue =
        "This project connects a practical user request with a simple interface, validates the submitted details, and sends the result to the owner. Editing this description keeps the full paragraph readable, including literal <plain> text and punctuation.";
      const paragraphInput = await openEditor(page, paragraphKey);
      assert.equal(
        await paragraphInput.evaluate((element) => element.tagName),
        "TEXTAREA",
      );
      await paragraphInput.fill(paragraphValue);
      const [paragraphResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/blocks/${paragraphKey}` &&
            response.request().method() === "PATCH",
        ),
        paragraphInput.press("Control+Enter"),
      ]);
      assert.equal(paragraphResponse.status(), 200);
      await expect(paragraphInput).toHaveCount(0);
      assert.equal(await blockValue(paragraphKey), paragraphValue);
      const publicPage = await context.newPage();
      await publicPage.goto(`${origin}/`);
      await assertPublicOnly(publicPage);
      assert.ok(
        (await publicPage.locator("#home h1").textContent())?.includes(value),
      );
      await expect(publicPage.locator("#home h1 script")).toHaveCount(0);
      assert.deepEqual(
        await publicPage
          .locator("#home h1 > span[class]")
          .evaluateAll((elements) =>
            elements.map((element) => element.className),
          ),
        originalClasses,
      );
      assert.equal(
        await publicPage.locator("#boxOne > div > p").textContent(),
        paragraphValue,
      );
      await expect(publicPage.locator("#boxOne p plain")).toHaveCount(0);
      await saveWithKeyboard(page, paragraphKey, originalParagraph);
    });
  },
);

test(
  "blur persists a changed field while Escape discards a draft without writing",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page) => {
      const savedKey = "hero.text.007";
      const savedValue = "Web, mobile, and AI developer";
      const input = await openEditor(page, savedKey);
      await input.fill(savedValue);
      const responsePromise = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === `/api/blocks/${savedKey}` &&
          response.request().method() === "PATCH",
      );
      await input.evaluate((element) => (element as HTMLInputElement).blur());
      assert.equal((await responsePromise).status(), 200);
      await expect(input).toHaveCount(0);
      assert.equal(await blockValue(savedKey), savedValue);
      await saveWithKeyboard(page, savedKey, "");
      assert.equal(await marker(page, savedKey).textContent(), "");
      await page.reload();
      assert.equal(await marker(page, savedKey).textContent(), "");
      // Reopening uses a real mouse click on the empty admin marker.
      await saveWithKeyboard(page, savedKey, savedValue);
      await expect(marker(page, savedKey)).toHaveText(savedValue);
      const canceledKey = "hero.text.008";
      const before = await db.contentBlock.findUniqueOrThrow({
        where: { key: canceledKey },
      });
      const requests: string[] = [];
      page.on("request", (request) => {
        if (request.method() === "PATCH") requests.push(request.url());
      });
      const canceled = await openEditor(page, canceledKey);
      await canceled.fill("This draft must be discarded");
      await canceled.press("Escape");
      await expect(canceled).toHaveCount(0);
      await expect(marker(page, canceledKey)).toHaveText(before.value);
      assert.deepEqual(
        await db.contentBlock.findUniqueOrThrow({
          where: { key: canceledKey },
        }),
        before,
      );
      assert.deepEqual(requests, []);
    });
  },
);

test(
  "failed saves retain the draft and Retry persists it without losing content",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page) => {
      const key = "footer.text.003";
      const original = await blockValue(key);
      const value = " by the portfolio owner. ";
      const endpoint = `**/api/blocks/${key}`;
      await page.route(endpoint, (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: { code: "INTERNAL", message: "Temporary test failure." },
          }),
        }),
      );
      const input = await openEditor(page, key);
      await input.fill(value);
      await input.press("Control+Enter");
      const overlay = page.locator(
        `[data-content-editor-ui][data-editing-block="${key}"]`,
      );
      await expect(overlay.getByRole("alert")).toBeVisible();
      await expect(input).toHaveValue(value);
      const retry = overlay.getByRole("button", { name: "Retry", exact: true });
      await expect(retry).toBeVisible();
      await expect(retry).toBeInViewport({ ratio: 1 });
      assert.equal(await blockValue(key), original);
      await page.unroute(endpoint);
      const [saved] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === `/api/blocks/${key}` &&
            response.request().method() === "PATCH",
        ),
        retry.click(),
      ]);
      assert.equal(saved.status(), 200);
      await expect(input).toHaveCount(0);
      assert.equal(await blockValue(key), value);
    });
  },
);

test(
  "image alt text and form placeholders edit the original intrinsic elements",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page, context) => {
      const altKey = "hero.alt.001";
      const placeholderKey = "contact.placeholder.013";
      assert.equal(
        await marker(page, altKey).evaluate((element) => element.tagName),
        "IMG",
      );
      assert.equal(
        await marker(page, placeholderKey).evaluate(
          (element) => element.tagName,
        ),
        "INPUT",
      );
      const imageClass = await marker(page, altKey).getAttribute("class");
      const inputClass = await marker(page, placeholderKey).getAttribute(
        "class",
      );
      const alt = "Developer portrait & profile";
      const placeholder = "Your first name";
      await saveWithKeyboard(page, altKey, alt);
      await saveWithKeyboard(page, placeholderKey, placeholder);
      await expect(marker(page, altKey)).toHaveAttribute("alt", alt);
      await expect(marker(page, placeholderKey)).toHaveAttribute(
        "placeholder",
        placeholder,
      );
      await page.reload();
      await expect(marker(page, altKey)).toHaveAttribute("alt", alt);
      await expect(marker(page, placeholderKey)).toHaveAttribute(
        "placeholder",
        placeholder,
      );
      const publicPage = await context.newPage();
      await publicPage.goto(`${origin}/`);
      await assertPublicOnly(publicPage);
      await expect(
        publicPage.locator('#home img[src="/mypictop.jpg"]'),
      ).toHaveAttribute("alt", alt);
      await expect(
        publicPage.locator('#contact input[name="fName"]'),
      ).toHaveAttribute("placeholder", placeholder);
      assert.equal(
        await publicPage
          .locator('#home img[src="/mypictop.jpg"]')
          .getAttribute("class"),
        imageClass,
      );
      assert.equal(
        await publicPage
          .locator('#contact input[name="fName"]')
          .getAttribute("class"),
        inputClass,
      );
    });
  },
);

test(
  "overview edits cover every block and preserve multiline preformatted text publicly",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page, context) => {
      await page.goto(`${origin}/admin/edit/overview`);
      const actual = await page
        .locator("[data-content-editor][data-block-key]")
        .evaluateAll((elements) =>
          [
            ...new Set(
              elements.map((element) => element.getAttribute("data-block-key")),
            ),
          ].sort(),
        );
      const expected = manifest.content
        .filter(({ key }) => key.startsWith("overview."))
        .map(({ key }) => key)
        .sort();
      assert.deepEqual(actual, expected);
      const key = "overview.text.058";
      const value =
        "\n  first line\n    second <plain> & text\n\n  last line  ";
      const preClass = await page.locator("pre").getAttribute("class");
      const input = await openEditor(page, key);
      assert.equal(
        await input.evaluate((element) => element.tagName),
        "TEXTAREA",
      );
      await input.fill(value);
      const saved = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === `/api/blocks/${key}` &&
          response.request().method() === "PATCH",
      );
      await input.press("Control+Enter");
      assert.equal((await saved).status(), 200);
      await expect(input).toHaveCount(0);
      assert.equal(await blockValue(key), value);
      await page.reload();
      assert.equal(await marker(page, key).textContent(), value);
      await saveWithKeyboard(page, key, "");
      assert.equal(await marker(page, key).textContent(), "");
      await page.reload();
      assert.equal(await marker(page, key).textContent(), "");
      await saveWithKeyboard(page, key, value);
      assert.equal(await marker(page, key).textContent(), value);
      const publicResponse = await request("/overview.html");
      assert.equal(publicResponse.status, 200);
      const pre = findElement(parse(await publicResponse.text()), "pre");
      assert.ok(pre);
      assert.equal(
        htmlText(pre),
        value,
        "Server HTML dropped or added preformatted whitespace before hydration",
      );
      const publicPage = await context.newPage();
      await publicPage.goto(`${origin}/overview.html`);
      await assertPublicOnly(publicPage);
      assert.equal(await publicPage.locator("pre").textContent(), value);
      assert.equal(
        await publicPage.locator("pre").getAttribute("class"),
        preClass,
      );
      await expect(publicPage.locator("pre plain")).toHaveCount(0);
    });
  },
);

test(
  "navigation confirms a failed unsaved draft and cancellation preserves it",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page) => {
      const key = "hero.text.008";
      const original = await blockValue(key);
      const value = "Keep this unsaved navigation draft";
      await page.route(`**/api/blocks/${key}`, (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "Temporary test failure." },
          }),
        }),
      );
      const input = await openEditor(page, key);
      await input.fill(value);
      await input.press("Control+Enter");
      await expect(
        page.locator('[data-content-editor-ui] [role="alert"]'),
      ).toBeVisible();
      const link = page.locator('a[href="/admin/edit/overview"]').first();
      const denied = page.waitForEvent("dialog");
      const deniedClick = link.click();
      const denyDialog = await denied;
      assert.equal(denyDialog.type(), "confirm");
      assert.match(denyDialog.message(), /unsaved/i);
      await denyDialog.dismiss();
      await deniedClick;
      assert.equal(new URL(page.url()).pathname, editorPath);
      await expect(input).toHaveValue(value);
      assert.equal(await blockValue(key), original);
      const accepted = page.waitForEvent("dialog");
      const acceptedClick = link.click();
      await (await accepted).accept();
      await acceptedClick;
      await page.waitForURL(`${origin}/admin/edit/overview`);
      assert.equal(await blockValue(key), original);
    });
  },
);

test(
  "sign-out prompts for a dirty draft and clears the session only after approval",
  { timeout: 60_000 },
  async () => {
    await withEditor(async (page, context) => {
      const key = "hero.text.008";
      const original = await blockValue(key);
      await page.route(`**/api/blocks/${key}`, (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "Temporary test failure." },
          }),
        }),
      );
      const input = await openEditor(page, key);
      await input.fill("Keep this draft before sign-out");
      await input.press("Control+Enter");
      await expect(
        page.locator('[data-content-editor-ui] [role="alert"]'),
      ).toBeVisible();
      const signOut = page.getByRole("button", {
        name: "Sign out",
        exact: true,
      });
      const denied = page.waitForEvent("dialog");
      const deniedClick = signOut.click();
      const dialog = await denied;
      assert.equal(dialog.type(), "confirm");
      await dialog.dismiss();
      await deniedClick;
      assert.equal(new URL(page.url()).pathname, editorPath);
      await expect(input).toHaveValue("Keep this draft before sign-out");
      assert.ok(
        (await context.cookies()).some(
          ({ name }) => name === "__Host-portfolio_session",
        ),
      );
      const accepted = page.waitForEvent("dialog");
      const acceptedClick = signOut.click();
      await (await accepted).accept();
      await acceptedClick;
      await page.waitForURL(`${origin}/login`);
      assert.equal(
        (await context.cookies()).some(
          ({ name }) => name === "__Host-portfolio_session",
        ),
        false,
      );
      assert.equal(await blockValue(key), original);
    });
  },
);
