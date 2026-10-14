import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { PrismaClient, type Admin } from "@prisma/client";
import sharp from "sharp";
import { chromium, expect } from "@playwright/test";
import { seedPortfolio } from "../../prisma/seed-content";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
} from "../../src/lib/session-token";
import { replayFonts } from "../migration/font-fixtures";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-stacks-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const email = "stacks-test@example.invalid",
  password = "Isolated stack test password",
  secret = "isolated-stack-test-secret-at-least-32-bytes";
let origin = "",
  admin: Admin,
  server: ChildProcess | undefined,
  logs = "";
let collection: typeof import("../../src/app/api/stacks/route"),
  item: typeof import("../../src/app/api/stacks/[id]/route"),
  upload: typeof import("../../src/app/api/upload/route");
let directDb: PrismaClient | undefined;
const oldEnv = new Map<string, string | undefined>();
const uploaded: string[] = [];
function headers() {
  return {
    Cookie: `__Host-portfolio_session=${createSessionToken(admin, secret)}`,
    Origin: origin,
    "Content-Type": "application/json",
  };
}
function request(path: string, init: RequestInit = {}) {
  return fetch(`${origin}${path}`, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
}
function mutate(method: string, path: string, data?: unknown) {
  return request(path, {
    method,
    headers: headers(),
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
async function failure(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.error.code, code);
  const text = JSON.stringify(body);
  for (const hidden of [password, secret, databaseUrl, admin.passwordHash])
    assert.ok(!text.includes(hidden));
}
async function saved(response: Response, status = 200) {
  assert.equal(response.status, status);
  return (await response.json()).stack;
}
function context(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) };
}
async function freePort() {
  const listener = createServer();
  await new Promise<void>((done) => listener.listen(0, "127.0.0.1", done));
  const address = listener.address();
  assert.ok(address && typeof address === "object");
  await new Promise<void>((done) => listener.close(() => done()));
  return address.port;
}
function track(url: string) {
  assert.match(url, /^\/uploads\/stacks\/[a-f0-9-]{36}\.png$/);
  uploaded.push(url);
}
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect width="40" height="20" fill="#06b6d4"/></svg>';

test(
  "project tile creates, retries, edits photos and copy, removes chips, orders and deletes",
  { timeout: 180_000 },
  async () => {
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await replayFonts(context);
    await context.addCookies([
      {
        name: "__Host-portfolio_session",
        value: createSessionToken(admin, secret),
        url: origin.replace("http:", "https:"),
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let id: number | undefined;
    try {
      await page.goto(`${origin}/admin/projects`);
      const originalTitle = (
        await db.project.findUniqueOrThrow({ where: { id: 1 } })
      ).title;
      for (const title of ["Original project edited inline", originalTitle]) {
        await page
          .locator('#boxOne [data-block-key="projects.text.003"]')
          .evaluate((element) => (element as HTMLElement).click());
        const originalField = page.locator(
          '[data-editing-input="projects.text.003"]',
        );
        await originalField.fill(title);
        await originalField.press("Control+Enter");
        await expect(originalField).toHaveCount(0);
        await expect(
          page.getByLabel(`Replace photo for ${title}`, { exact: true }),
        ).toHaveCount(1);
      }
      const tile = page.locator("[data-add-project-tile]");
      assert.equal(
        await tile.evaluate(
          (element) =>
            element.parentElement ===
            document.querySelector("#boxOne")?.parentElement,
        ),
        true,
      );
      assert.equal(
        await tile.getAttribute("class"),
        (await page.locator("#boxOne").getAttribute("class"))?.replace(
          / aos-(init|animate)/g,
          "",
        ),
      );
      await tile
        .getByRole("button", { name: "Add project", exact: true })
        .click();
      await tile
        .getByRole("button", { name: "Save project", exact: true })
        .click();
      await expect(tile.getByRole("alert")).toHaveText("Add a title.");
      await tile
        .getByLabel("Add title", { exact: true })
        .fill("Browser project creation");
      const navigation = page.waitForEvent("dialog");
      const click = page.locator('a[href="/admin/stacks"]').click();
      await (await navigation).dismiss();
      await click;
      await expect(tile.getByLabel("Add title", { exact: true })).toHaveValue(
        "Browser project creation",
      );
      await tile
        .getByLabel("Upload project photo", { exact: true })
        .setInputFiles({
          name: "too-large.png",
          mimeType: "image/png",
          buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
        });
      await expect(
        tile.getByRole("alert").filter({ hasText: "5 MB" }),
      ).toBeVisible();
      const photo = await sharp({
        create: { width: 80, height: 50, channels: 3, background: "#06b6d4" },
      })
        .png()
        .toBuffer();
      await tile
        .getByLabel("Upload project photo", { exact: true })
        .setInputFiles({
          name: "project.png",
          mimeType: "image/png",
          buffer: photo,
        });
      await expect(tile.locator("img")).toBeVisible();
      uploaded.push((await tile.locator("img").getAttribute("src"))!);
      await tile.locator('[data-project-stacks="0"]').click();
      const picker = page.locator('[data-stack-picker="0"]');
      for (const name of ["HTML", "CSS", "JavaScript", "React", "Next.js"])
        await picker.getByRole("checkbox", { name, exact: true }).check();
      await expect(tile.locator("li[role=button]")).toHaveCount(5);
      await expect(
        picker.getByRole("checkbox", { name: "Python", exact: true }),
      ).toBeDisabled();
      await expect(picker).toContainText("Max 5 stacks");
      await picker.getByRole("button", { name: "Done", exact: true }).click();
      let blocked = true;
      await page.route("**/api/projects", async (route) => {
        if (route.request().method() === "POST" && blocked) {
          blocked = false;
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              error: { message: "Temporary test failure" },
            }),
          });
        } else await route.continue();
      });
      await tile
        .getByRole("button", { name: "Save project", exact: true })
        .click();
      await expect(tile.getByRole("alert")).toContainText(
        "Temporary test failure",
      );
      await expect(tile.getByLabel("Add title", { exact: true })).toHaveValue(
        "Browser project creation",
      );
      assert.equal(
        await db.project.count({
          where: { title: "Browser project creation" },
        }),
        0,
      );
      await tile
        .getByRole("button", { name: "Save project", exact: true })
        .click();
      await expect(
        tile.getByRole("button", { name: "Add project", exact: true }),
      ).toBeVisible();
      const project = await db.project.findFirstOrThrow({
        where: { title: "Browser project creation" },
      });
      id = project.id;
      let card = page.locator(`#project-${id}`);
      await expect(card.locator("li[role=button]")).toHaveCount(5);
      await card
        .getByRole("button", { name: "Remove HTML", exact: true })
        .click();
      await expect(
        card.getByRole("button", { name: "Remove HTML", exact: true }),
      ).toHaveCount(0);
      await expect
        .poll(() => db.projectStack.count({ where: { projectId: id } }))
        .toBe(4);
      await card
        .locator(`[data-block-key="project.${id}.title"]`)
        .evaluate((element) => (element as HTMLElement).click());
      const text = page.locator(`[data-editing-input="project.${id}.title"]`);
      await text.fill("Browser project edited");
      await text.press("Control+Enter");
      await expect(text).toHaveCount(0);
      await card
        .locator(`[data-block-key="project.${id}.description"]`)
        .evaluate((element) => (element as HTMLElement).click());
      const description = page.locator(
        `[data-editing-input="project.${id}.description"]`,
      );
      await description.fill("New project description saved inline.");
      await description.press("Control+Enter");
      await expect(description).toHaveCount(0);
      const chooser = page.waitForEvent("filechooser");
      await card.locator(`[data-project-photo="${id}"]`).click();
      await (
        await chooser
      ).setFiles({
        name: "replacement.png",
        mimeType: "image/png",
        buffer: await sharp(photo).tint("#ff0000").png().toBuffer(),
      });
      await expect
        .poll(
          async () =>
            (await db.project.findUniqueOrThrow({ where: { id } })).photoUrl,
        )
        .not.toBe(project.photoUrl);
      uploaded.push(
        (await db.project.findUniqueOrThrow({ where: { id } })).photoUrl!,
      );
      await page.reload();
      card = page.locator(`#project-${id}`);
      await expect(card.locator("h1")).toHaveText("Browser project edited");
      await expect(card.locator("p").first()).toHaveText(
        "New project description saved inline.",
      );
      await expect(card.locator("li[role=button]")).toHaveCount(4);
      await card
        .getByRole("button", { name: "Project options", exact: true })
        .click();
      await card.getByLabel("Display order", { exact: true }).fill("0");
      await card
        .getByLabel("Project URL", { exact: true })
        .fill("https://example.invalid/project");
      await card.getByLabel("Published", { exact: true }).uncheck();
      await card
        .getByRole("button", { name: "Save options", exact: true })
        .click();
      await expect(
        card.getByRole("button", { name: "Project options", exact: true }),
      ).toBeVisible();
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id } })).order,
        0,
      );
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id } })).published,
        false,
      );
      const publicPage = await context.newPage();
      await publicPage.goto(origin);
      await expect(publicPage.locator(`#project-${id}`)).toHaveCount(0);
      await publicPage.close();
      await card
        .getByRole("button", { name: "Project options", exact: true })
        .click();
      page.once("dialog", (dialog) => void dialog.dismiss());
      await card
        .getByRole("button", { name: "Delete project", exact: true })
        .click();
      await expect(card).toHaveCount(1);
      page.once("dialog", (dialog) => void dialog.accept());
      await card
        .getByRole("button", { name: "Delete project", exact: true })
        .click();
      await expect(card).toHaveCount(0);
      assert.equal(await db.project.findUnique({ where: { id } }), null);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
      await browser.close();
      if (id) await db.project.deleteMany({ where: { id } });
    }
  },
);

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
        timeout: 120_000,
      },
    );
    await seedPortfolio(db, { ADMIN_EMAIL: email, ADMIN_PASSWORD: password });
    admin = await db.admin.findUniqueOrThrow({ where: { email } });
    origin = `http://localhost:${await freePort()}`;
    const env = {
      NODE_ENV: "production" as const,
      DATABASE_URL: databaseUrl,
      ADMIN_EMAIL: email,
      ADMIN_PASSWORD: password,
      SESSION_SECRET: secret,
      APP_ORIGIN: origin,
      NEXT_TELEMETRY_DISABLED: "1",
    };
    for (const [key, value] of Object.entries(env)) {
      oldEnv.set(key, process.env[key]);
      process.env[key] = value;
    }
    collection = await import("../../src/app/api/stacks/route");
    item = await import("../../src/app/api/stacks/[id]/route");
    upload = await import("../../src/app/api/upload/route");
    directDb = (await import("../../src/lib/db")).db;
    const child = spawn(
      process.execPath,
      [
        resolve(root, "node_modules/next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        new URL(origin).port,
      ],
      {
        cwd: root,
        env: { ...process.env, ...env },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server = child;
    child.stdout?.on("data", (chunk) => {
      logs = (logs + chunk).slice(-8000);
    });
    child.stderr?.on("data", (chunk) => {
      logs = (logs + chunk).slice(-8000);
    });
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      try {
        const response = await request("/login");
        if (response.status === 200) {
          await response.text();
          return;
        }
      } catch {}
      if (child.exitCode !== null) break;
      await new Promise((done) => setTimeout(done, 200));
    }
    throw new Error(`Stack test server did not start: ${logs}`);
  },
  { timeout: 240_000 },
);
after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const child = server;
    await new Promise<void>((done) => {
      child.once("exit", () => done());
      child.kill();
    });
  }
  await directDb?.$disconnect();
  await db.$disconnect();
  for (const [key, value] of oldEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const url of uploaded) {
    assert.match(url, /^\/uploads\/(stacks|projects)\/[a-f0-9-]{36}\.png$/);
    const path = resolve(root, "public", `.${url}`);
    assert.ok(
      [
        resolve(root, "public/uploads/stacks"),
        resolve(root, "public/uploads/projects"),
      ].includes(dirname(path)),
    );
    try {
      unlinkSync(path);
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
  }
  assert.equal(dirname(directory), parent);
  rmSync(directory, { recursive: true, force: true });
});

test("stack and upload handlers enforce live sessions and trusted origins before reading bodies", async () => {
  const before = await db.stack.findMany();
  for (const token of [
    undefined,
    "bad",
    createSessionToken(admin, secret, Date.now() - SESSION_TTL_SECONDS * 1000),
    createSessionToken({ ...admin, id: 9999 }, secret),
  ]) {
    const h = {
      Origin: origin,
      ...(token ? { Cookie: `__Host-portfolio_session=${token}` } : {}),
    };
    await failure(
      await collection.GET(new Request(`${origin}/api/stacks`, { headers: h })),
      401,
      "UNAUTHORIZED",
    );
    for (const [handler, path] of [
      [collection.POST, "/api/stacks"],
      [upload.POST, "/api/upload?kind=stack"],
    ] as const) {
      const incoming = new Request(`${origin}${path}`, {
        method: "POST",
        headers: h,
        body: "bad body",
      });
      await failure(await handler(incoming), 401, "UNAUTHORIZED");
      assert.equal(incoming.bodyUsed, false);
    }
    const incoming = new Request(`${origin}/api/stacks/1`, {
      method: "DELETE",
      headers: h,
    });
    await failure(await item.DELETE(incoming, context(1)), 401, "UNAUTHORIZED");
  }
  for (const Origin of ["null", "https://foreign.example"]) {
    const incoming = new Request(`${origin}/api/stacks`, {
      method: "POST",
      headers: { ...headers(), Origin },
      body: "bad body",
    });
    await failure(await collection.POST(incoming), 403, "ORIGIN");
    assert.equal(incoming.bodyUsed, false);
  }
  assert.deepEqual(await db.stack.findMany(), before);
});
test("catalog CRUD persists names, bundled icons and order; invalid updates are rejected", async () => {
  const added = await saved(
    await mutate("POST", "/api/stacks", {
      name: "  Svelte  ",
      svgPath: "/stacks/javascript.svg",
    }),
    201,
  );
  try {
    assert.equal(added.name, "Svelte");
    assert.equal(added.projectCount, 0);
    const changed = await saved(
      await mutate("PATCH", `/api/stacks/${added.id}`, {
        name: "SvelteKit",
        svgPath: "/stacks/react.svg",
        order: 0,
      }),
    );
    assert.equal(changed.name, "SvelteKit");
    assert.equal(changed.svgPath, "/stacks/react.svg");
    const response = await request("/api/stacks", { headers: headers() });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const rows = (await response.json()).stacks;
    assert.ok(rows.some((row: { id: number }) => row.id === added.id));
    await failure(
      await mutate("POST", "/api/stacks", {
        name: "SvelteKit",
        svgPath: "/stacks/css.svg",
      }),
      409,
      "CONFLICT",
    );
    for (const data of [
      { name: "" },
      { name: "a".repeat(101) },
      { name: "bad\nname" },
      { svgPath: "https://foreign.example/icon.svg" },
      { svgPath: "/stacks/../secret.svg" },
      { svgPath: "/stacks/absent.svg" },
      { order: -1 },
      { projectCount: 0 },
      {},
    ])
      await failure(
        await mutate("PATCH", `/api/stacks/${added.id}`, data),
        400,
        "VALIDATION",
      );
    assert.equal(
      (await db.stack.findUniqueOrThrow({ where: { id: added.id } })).name,
      "SvelteKit",
    );
    await failure(
      await mutate("PATCH", "/api/stacks/01", { name: "Invalid ID" }),
      400,
      "VALIDATION",
    );
    await failure(
      await mutate("DELETE", "/api/stacks/2147483647"),
      404,
      "NOT_FOUND",
    );
    assert.equal(
      (await mutate("DELETE", `/api/stacks/${added.id}`)).status,
      200,
    );
    assert.equal(await db.stack.findUnique({ where: { id: added.id } }), null);
  } finally {
    await db.stack.deleteMany({ where: { id: added.id } });
  }
});
test("referenced stacks cannot be deleted and icon replacements reach existing project cards", async () => {
  const stack = await db.stack.findUniqueOrThrow({ where: { id: 1 } });
  try {
    await failure(await mutate("DELETE", "/api/stacks/1"), 409, "IN_USE");
    const changed = await saved(
      await mutate("PATCH", "/api/stacks/1", {
        name: "Renamed HTML",
        svgPath: "/stacks/css.svg",
      }),
    );
    assert.ok(changed.projectCount > 0);
    const models = await (
      await request("/api/projects", { headers: headers() })
    ).json();
    assert.ok(
      models.projects[0].stacks.some(
        (item: { id: number; name: string; svgPath: string }) =>
          item.id === 1 &&
          item.name === "Renamed HTML" &&
          item.svgPath === "/stacks/css.svg",
      ),
    );
    const html = await (await request("/")).text();
    assert.ok(html.includes("#1572b6"));
  } finally {
    await db.stack.update({ where: { id: 1 }, data: stack });
  }
});
test("SVG upload produces a square PNG that is immediately served and usable by a stack", async () => {
  const form = new FormData();
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), "svelte.svg");
  const response = await request("/api/upload?kind=stack", {
    method: "POST",
    headers: { Cookie: headers().Cookie, Origin: origin },
    body: form,
  });
  assert.equal(response.status, 201);
  const { url } = await response.json();
  track(url);
  const image = await request(url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  const metadata = await sharp(
    Buffer.from(await image.arrayBuffer()),
  ).metadata();
  assert.equal(metadata.width, 128);
  assert.equal(metadata.height, 128);
  const stack = await saved(
    await mutate("POST", "/api/stacks", {
      name: "Uploaded Svelte",
      svgPath: url,
    }),
    201,
  );
  await db.stack.delete({ where: { id: stack.id } });
});
test("upload rejects malformed images, oversized files and active SVG content", async () => {
  const payloads = [
    "not an image",
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="file:///private"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="evil()"/>',
  ];
  for (const data of payloads) {
    const form = new FormData();
    form.append("file", new Blob([data]), "icon.svg");
    await failure(
      await request("/api/upload?kind=stack", {
        method: "POST",
        headers: { Cookie: headers().Cookie, Origin: origin },
        body: form,
      }),
      400,
      "VALIDATION",
    );
  }
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]),
    "large.png",
  );
  await failure(
    await request("/api/upload?kind=stack", {
      method: "POST",
      headers: { Cookie: headers().Cookie, Origin: origin },
      body: form,
    }),
    400,
    "VALIDATION",
  );
});
test(
  "browser catalog adds, uploads, renames and deletes a stack and guards unsaved navigation",
  { timeout: 120_000 },
  async () => {
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await replayFonts(context);
    await context.addCookies([
      {
        name: "__Host-portfolio_session",
        value: createSessionToken(admin, secret),
        url: origin.replace("http:", "https:"),
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(`${origin}/admin/projects`);
      await page.locator('[data-project-stacks="1"]').click();
      await page
        .locator('[data-stack-picker="1"]')
        .getByRole("link", {
          name: "Manage stack names and SVG icons",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", { name: "Manage stacks" }),
      ).toBeVisible();
      const creator = page.locator('[data-stack-id="new"]');
      await creator
        .getByLabel("New stack name", { exact: true })
        .fill("Browser Svelte");
      await creator
        .getByLabel("Upload icon for new stack", { exact: true })
        .setInputFiles({
          name: "browser.svg",
          mimeType: "image/svg+xml",
          buffer: Buffer.from(svg),
        });
      await expect(
        creator.getByRole("button", { name: "Add stack", exact: true }),
      ).toBeEnabled();
      const newIcon = await creator.locator("img").getAttribute("src");
      assert.ok(newIcon);
      track(newIcon);
      await creator
        .getByRole("button", { name: "Add stack", exact: true })
        .click();
      await expect(creator.getByRole("status")).toHaveText("Stack added.");
      const added = await db.stack.findUniqueOrThrow({
        where: { name: "Browser Svelte" },
      });
      const row = page.locator(`[data-stack-id="${added.id}"]`);
      await row
        .getByLabel("Name for Browser Svelte", { exact: true })
        .fill("Browser SvelteKit");
      const samePageDialog = page.waitForEvent("dialog");
      const reloadClick = page.locator('a[href="/admin/stacks"]').click();
      await (await samePageDialog).dismiss();
      await reloadClick;
      await expect(
        row.getByLabel("Name for Browser Svelte", { exact: true }),
      ).toHaveValue("Browser SvelteKit");
      const dialog = page.waitForEvent("dialog");
      const navigating = page
        .locator('a[href="/admin/edit/portfolio"]')
        .click();
      await (await dialog).dismiss();
      await navigating;
      assert.equal(new URL(page.url()).pathname, "/admin/stacks");
      await row
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      await expect(row.getByRole("status")).toHaveText("Saved.");
      await page.reload();
      await expect(
        page
          .locator(`[data-stack-id="${added.id}"]`)
          .getByLabel("Name for Browser SvelteKit", { exact: true }),
      ).toHaveValue("Browser SvelteKit");
      await expect(
        page
          .locator('[data-stack-id="1"]')
          .getByRole("button", { name: "Delete", exact: true }),
      ).toBeDisabled();
      await page.goto(`${origin}/admin/projects`);
      await page.locator('[data-project-stacks="1"]').click();
      const picker = page.locator('[data-stack-picker="1"]');
      await expect(
        picker.getByRole("checkbox", {
          name: "Browser SvelteKit",
          exact: true,
        }),
      ).toBeDisabled();
      await picker
        .getByRole("checkbox", { name: "HTML", exact: true })
        .uncheck();
      await expect(
        picker.getByRole("button", { name: "Done", exact: true }),
      ).toBeEnabled();
      await picker
        .getByRole("checkbox", { name: "Browser SvelteKit", exact: true })
        .check();
      await expect(page.locator(`#boxOne img[src="${newIcon}"]`)).toHaveCount(
        1,
      );
      await expect(
        picker.getByRole("button", { name: "Done", exact: true }),
      ).toBeEnabled();
      await expect(
        picker.getByRole("checkbox", { name: "React", exact: true }),
      ).toBeDisabled();
      await picker.getByRole("button", { name: "Done", exact: true }).click();
      await expect(picker).toHaveCount(0);
      await expect(page.locator(`#boxOne img[src="${newIcon}"]`)).toHaveCount(
        1,
      );
      await page.goto(`${origin}/admin/stacks`);
      await expect(
        page
          .locator(`[data-stack-id="${added.id}"]`)
          .getByRole("button", { name: "Delete", exact: true }),
      ).toBeDisabled();
      await page.goto(`${origin}/admin/projects`);
      await page.locator('[data-project-stacks="1"]').click();
      await page
        .locator('[data-stack-picker="1"]')
        .getByRole("checkbox", { name: "Browser SvelteKit", exact: true })
        .uncheck();
      await expect(
        page
          .locator('[data-stack-picker="1"]')
          .getByRole("button", { name: "Done", exact: true }),
      ).toBeEnabled();
      await page
        .locator('[data-stack-picker="1"]')
        .getByRole("checkbox", { name: "HTML", exact: true })
        .check();
      await expect(
        page
          .locator('[data-stack-picker="1"]')
          .getByRole("button", { name: "Done", exact: true }),
      ).toBeEnabled();
      await page
        .locator('[data-stack-picker="1"]')
        .getByRole("button", { name: "Done", exact: true })
        .click();
      await expect(page.locator('[data-stack-picker="1"]')).toHaveCount(0);
      await page.goto(`${origin}/admin/stacks`);
      page.once("dialog", (dialog) => void dialog.accept());
      await page
        .locator(`[data-stack-id="${added.id}"]`)
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await expect(page.locator(`[data-stack-id="${added.id}"]`)).toHaveCount(
        0,
      );
      assert.equal(
        await db.stack.findUnique({ where: { id: added.id } }),
        null,
      );
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
      await browser.close();
      await db.projectStack.deleteMany({
        where: {
          stack: { name: { in: ["Browser Svelte", "Browser SvelteKit"] } },
        },
      });
      await db.stack.deleteMany({
        where: { name: { in: ["Browser Svelte", "Browser SvelteKit"] } },
      });
    }
  },
);
