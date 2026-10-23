import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { createServer } from "node:net";
import { PrismaClient } from "@prisma/client";
import { chromium, expect, type Browser } from "@playwright/test";
import { seedPortfolio } from "../../prisma/seed-content";
import { createSessionToken } from "../../src/lib/session-token";
import {
  defaultSettings,
  settingsSchema,
  spotifyEmbed,
} from "../../src/lib/site-settings";
import { fileLanguages, parseContributions } from "../../src/lib/github";
import { audioFormat } from "../../src/lib/music-upload";

const root = process.cwd(),
  parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "blog-test-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const email = "blog-test@example.invalid",
  password = "isolated-blog-test-password",
  secret = "isolated-blog-test-secret-at-least-32-bytes";
let origin = "",
  cookie = "",
  server: ChildProcess | undefined,
  browser: Browser | undefined,
  logs = "",
  postId = 0;
const uploaded: string[] = [];
const draft = {
  title: "Building for people",
  slug: "building-for-people",
  excerpt: "A development journal entry.",
  body: "First paragraph.\n\nSecond paragraph with <script>literal text</script>.",
  coverUrl: null,
  category: "Technology",
  featured: true,
  published: false,
};
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  authenticated = false,
  otherHeaders: Record<string, string> = {},
) {
  return fetch(origin + path, {
    method,
    redirect: "manual",
    headers: {
      ...(body !== undefined
        ? { "Content-Type": "application/json", Origin: origin }
        : {}),
      ...(authenticated ? { Cookie: cookie } : {}),
      ...otherHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
}
before(
  async () => {
    execFileSync(
      process.execPath,
      [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "pipe" },
    );
    await seedPortfolio(db, { ADMIN_EMAIL: email, ADMIN_PASSWORD: password });
    const admin = await db.admin.findUniqueOrThrow({ where: { email } });
    cookie = `__Host-portfolio_session=${createSessionToken(admin, secret)}`;
    const listener = createServer();
    await new Promise<void>((r) => listener.listen(0, "127.0.0.1", r));
    const address = listener.address();
    assert(address && typeof address === "object");
    origin = `http://localhost:${address.port}`;
    await new Promise<void>((r) => listener.close(() => r()));
    server = spawn(
      process.execPath,
      [
        resolve("node_modules/next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(address.port),
      ],
      {
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
    server.stdout?.on("data", (d) => {
      logs = (logs + String(d)).slice(-6000);
    });
    server.stderr?.on("data", (d) => {
      logs = (logs + String(d)).slice(-6000);
    });
    const deadline = Date.now() + 60000;
    let ready = false;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) throw new Error(logs);
      try {
        const r = await request("/blog");
        if (r.status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    assert(ready, logs);
    browser = await chromium.launch({ channel: "chrome", headless: true });
  },
  { timeout: 120000 },
);
after(async () => {
  await browser?.close();
  if (server && server.exitCode === null) {
    const closed = new Promise((r) => server!.once("exit", r));
    server.kill();
    await closed;
  }
  await db.$disconnect();
  for (const path of uploaded) {
    assert.match(path, /^\/uploads\/music\/[a-f0-9-]{36}\.wav$/);
    unlinkSync(resolve(root, "public", path.slice(1)));
  }
  assert.equal(dirname(resolve(directory)), parent);
  assert(directory.startsWith(join(parent, "blog-test-")));
  rmSync(directory, { recursive: true, force: true });
});

test("settings validation rejects executable/foreign sources and classifies real changed files", () => {
  assert(settingsSchema.safeParse(defaultSettings).success);
  assert(
    !settingsSchema.safeParse({
      ...defaultSettings,
      music: {
        mode: "audio",
        source: "javascript:alert(1)",
        title: "bad",
        autoplay: true,
      },
    }).success,
  );
  assert(!spotifyEmbed("https://evil.example/track/123"));
  assert.equal(
    spotifyEmbed("https://open.spotify.com/track/Ab123?si=example"),
    "https://open.spotify.com/embed/track/Ab123?utm_source=generator",
  );
  assert.deepEqual(
    fileLanguages([
      { filename: "src/main.rs" },
      { filename: "db/schema.sql" },
      { filename: "main.tsx" },
      { filename: "notes.md" },
    ]),
    ["Rust", "SQL/MySQL", "TypeScript"],
  );
  assert.deepEqual(
    parseContributions(
      '<td data-date="2026-01-02" data-level="3"></td><td data-date="2026-01-01" data-level="1" data-count="2"></td>',
    ),
    [
      { date: "2026-01-01", level: 1, count: 2 },
      { date: "2026-01-02", level: 3, count: null },
    ],
  );
  assert.equal(
    audioFormat(Buffer.concat([Buffer.from("ID3"), Buffer.alloc(20)]))?.ext,
    "mp3",
  );
  assert.equal(audioFormat(Buffer.from("this is not an audio file")), null);
});
test("only the authenticated owner can create posts and cross-origin writes are blocked", async () => {
  assert.equal((await request("/api/admin/blog", "POST", draft)).status, 401);
  assert.equal(
    (
      await request("/api/admin/blog", "POST", draft, true, {
        Origin: "https://foreign.example",
      })
    ).status,
    403,
  );
  const response = await request("/api/admin/blog", "POST", draft, true);
  assert.equal(response.status, 201);
  postId = (await response.json()).post.id;
  assert.equal((await request(`/blog/${draft.slug}`)).status, 404);
  assert.equal((await request(`/api/blog/${postId}/engagement`)).status, 404);
  assert.equal(
    (await request("/api/admin/blog", "POST", draft, true)).status,
    409,
  );
});
test("publishing exposes a post while comments are immediate, escaped and removable", async () => {
  assert.equal(
    (
      await request(
        `/api/admin/blog/${postId}`,
        "PATCH",
        { ...draft, published: true },
        true,
      )
    ).status,
    200,
  );
  const page = await request(`/blog/${draft.slug}`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /literal text/);
  const payload = {
    action: "comment",
    author: "Test reader",
    body: "<script>window.untrusted=true</script>",
    website: "",
  };
  assert.equal(
    (
      await request(`/api/blog/${postId}/engagement`, "POST", payload, false, {
        Origin: "https://foreign.example",
      })
    ).status,
    403,
  );
  const added = await request(
    `/api/blog/${postId}/engagement`,
    "POST",
    payload,
  );
  assert.equal(added.status, 201);
  const comment = (await added.json()).comment;
  assert.equal(comment.body, payload.body);
  assert.equal(comment.visitorHash, undefined);
  const visible = await (
    await request(`/api/blog/${postId}/engagement`)
  ).json();
  assert.equal(visible.comments.length, 1);
  assert.equal(visible.comments[0].id, comment.id);
  assert.equal(visible.comments[0].visitorHash, undefined);
  assert.equal(
    (
      await request(
        `/api/admin/blog/${postId}/comments?comment=${comment.id}`,
        "DELETE",
        undefined,
        true,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/api/admin/blog/${postId}/comments?comment=${comment.id}`,
        "DELETE",
        undefined,
        true,
        { Origin: origin },
      )
    ).status,
    200,
  );
});
test("likes are idempotent per signed browser cookie, with no draft engagement", async () => {
  const path = `/api/blog/${postId}/engagement`;
  const first = await request(path, "POST", { action: "like", liked: true });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).likes, 1);
  const visitorCookie = first.headers.get("set-cookie")?.split(";")[0];
  assert(visitorCookie);
  const second = await request(
    path,
    "POST",
    { action: "like", liked: true },
    false,
    { Cookie: visitorCookie },
  );
  assert.equal((await second.json()).likes, 1);
  const read = await (
    await request(path, "GET", undefined, false, { Cookie: visitorCookie })
  ).json();
  assert.equal(read.liked, true);
  const removed = await request(
    path,
    "POST",
    { action: "like", liked: false },
    false,
    { Cookie: visitorCookie },
  );
  assert.equal((await removed.json()).likes, 0);
});
test("comment limits persist in the database and reject honeypot submissions", async () => {
  const path = `/api/blog/${postId}/engagement`;
  const payload = {
    action: "comment",
    author: "Reader",
    body: "A useful thought",
    website: "",
  };
  assert.equal(
    (await request(path, "POST", { ...payload, website: "spam" })).status,
    400,
  );
  const first = await request(path, "POST", payload);
  const visitorCookie = first.headers.get("set-cookie")?.split(";")[0];
  assert(visitorCookie);
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await request(path, "POST", payload, false, { Cookie: visitorCookie }))
        .status,
      201,
    );
  assert.equal(
    (await request(path, "POST", payload, false, { Cookie: visitorCookie }))
      .status,
    429,
  );
});
test("settings and extra notes save through protected portfolio history", async () => {
  assert.equal(
    (await request("/api/settings", "PATCH", defaultSettings)).status,
    401,
  );
  const settings = {
    ...defaultSettings,
    skills: [
      ...defaultSettings.skills,
      { id: "go", name: "Go", iconPath: "", group: "languages" },
    ],
  };
  assert.equal(
    (await request("/api/settings", "PATCH", settings, true)).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/api/blocks/site.settings",
        "PATCH",
        { value: "invalid" },
        true,
      )
    ).status,
    400,
  );
  const note = await request(
    "/api/notes",
    "POST",
    { value: "Currently learning Go" },
    true,
  );
  assert.equal(note.status, 201);
  const key = (await note.json()).block.key;
  assert.match(await (await request("/")).text(), /Currently learning Go/);
  assert.equal(
    (
      await request(`/api/notes/${key}`, "DELETE", undefined, true, {
        Origin: origin,
      })
    ).status,
    200,
  );
  assert((await db.portfolioRevision.count()) >= 3);
});
test("uploaded music is validated, persists in settings and supports byte ranges", async () => {
  const bytes = Buffer.alloc(16044);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24);
  bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(16000, 40);
  const form = new FormData();
  form.set("file", new File([bytes], "test.wav", { type: "audio/wav" }));
  const response = await fetch(origin + "/api/upload?kind=music", {
    method: "POST",
    headers: { Origin: origin, Cookie: cookie },
    body: form,
  });
  assert.equal(response.status, 201);
  const path = (await response.json()).url;
  uploaded.push(path);
  const range = await fetch(origin + path, {
    headers: { Range: "bytes=0-15" },
  });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get("content-type"), "audio/wav");
  assert.equal((await range.arrayBuffer()).byteLength, 16);
  assert.equal(
    (await fetch(origin + path, { headers: { Range: "bytes=999999-" } }))
      .status,
    416,
  );
  const settings = {
    ...defaultSettings,
    music: {
      mode: "audio",
      source: path,
      title: "My soundtrack",
      autoplay: true,
    },
  };
  assert.equal(
    (await request("/api/settings", "PATCH", settings, true)).status,
    200,
  );
});

test(
  "desktop and mobile themes persist; blog UI renders and scripts remain plain text",
  { timeout: 120000 },
  async () => {
    assert(browser);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
    });
    await context.route("https://fonts.googleapis.com/**", (r) => r.abort());
    await context.route("**/api/github**", (r) =>
      r.fulfill({ json: { calendar: [], commits: [], nextPage: null } }),
    );
    const page = await context.newPage();
    await page.goto(origin + "/blog");
    await expect(page.locator(".featured-post")).toBeVisible();
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({
      path: join(parent, "blog-desktop-dark.png"),
      fullPage: true,
    });
    await page.goto(origin + `/blog/${draft.slug}`);
    await expect(page.locator(".article-body")).toContainText(
      "<script>literal text</script>",
    );
    assert.equal(await page.locator(".article-body script").count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + "/");
    await expect(page.locator(".new-hero")).toBeVisible();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(
      page.getByRole("link", { name: "Blog", exact: false }).first(),
    ).toBeVisible();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: join(parent, "portfolio-mobile-dark.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await page.screenshot({
      path: join(parent, "portfolio-mobile-light.png"),
      fullPage: true,
    });
    await context.close();
  },
);
test(
  "blog and skills admin controls publish, delete and persist edits through the browser",
  { timeout: 120000 },
  async () => {
    assert(browser);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.route("https://fonts.googleapis.com/**", (r) => r.abort());
    await context.addCookies([
      {
        name: "__Host-portfolio_session",
        value: cookie.split("=")[1],
        url: origin.replace("http:", "https:"),
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    const page = await context.newPage();
    try {
      await page.goto(origin + "/admin/blog");
      await page
        .getByRole("button", { name: "+ New post", exact: true })
        .click();
      await page.getByLabel("Title", { exact: true }).fill("From the studio");
      await page
        .getByLabel("Article", { exact: true })
        .fill("Publishing from the actual blog editor.");
      await page.getByLabel("Published — visible to everyone").check();
      const saved = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/admin/blog") &&
          r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Save & publish", exact: true })
        .click();
      assert.equal((await saved).status(), 201);
      await expect(
        page.getByText("Post published. It is now visible on your blog.", {
          exact: true,
        }),
      ).toBeVisible();
      assert.equal((await request("/blog/from-the-studio")).status, 200);
      page.once("dialog", (d) => void d.accept());
      await page
        .getByRole("button", { name: "Delete From the studio", exact: true })
        .click();
      await expect(
        page.getByText("Post deleted.", { exact: true }),
      ).toBeVisible();
      assert.equal((await request("/blog/from-the-studio")).status, 404);
      await page.goto(origin + "/admin/settings");
      await page
        .getByRole("button", { name: "+ Add technical stack", exact: true })
        .click();
      await page
        .locator(".skill-editor-row")
        .last()
        .getByRole("textbox")
        .fill("Testing Go");
      await page
        .getByRole("button", { name: "Save settings", exact: true })
        .click();
      await expect(
        page.getByText(
          "Settings saved. Refresh the portfolio to see your changes.",
          { exact: true },
        ),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.locator(".skill-editor-row").last().getByRole("textbox"),
      ).toHaveValue("Testing Go");
      await page
        .getByRole("button", { name: "Remove Testing Go", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Save settings", exact: true })
        .click();
      await expect(
        page.getByText(
          "Settings saved. Refresh the portfolio to see your changes.",
          { exact: true },
        ),
      ).toBeVisible();
      await page.screenshot({
        path: join(parent, "admin-settings.png"),
        fullPage: true,
      });
    } finally {
      await context.close();
    }
  },
);

test("unpublish hides posts and delete cascades associated comments and likes", async () => {
  assert.equal(
    (
      await request(
        `/api/admin/blog/${postId}`,
        "PATCH",
        { ...draft, published: false },
        true,
      )
    ).status,
    200,
  );
  assert.equal((await request(`/api/blog/${postId}/engagement`)).status, 404);
  assert.equal(
    (
      await request(`/api/admin/blog/${postId}`, "DELETE", undefined, true, {
        Origin: origin,
      })
    ).status,
    200,
  );
  assert.equal(await db.blogComment.count({ where: { postId } }), 0);
  assert.equal(await db.blogLike.count({ where: { postId } }), 0);
});
