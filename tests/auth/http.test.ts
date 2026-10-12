import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { chromium } from "@playwright/test";
import { hash } from "bcryptjs";
import { replayFonts } from "../migration/font-fixtures";
import { seedPortfolio } from "../../prisma/seed-content";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
} from "../../src/lib/session-token";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-auth-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const email = "auth-test@example.invalid";
const password = "Auth test password with spaces  ";
const secret = "isolated-auth-test-secret-at-least-32-bytes";
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const processes = new Set<ChildProcess>();
let origin = "";
let server: ChildProcess;
let logs = "";
let admin: { id: number; email: string; passwordHash: string };
let authenticatedCookie = "";

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

function startServer(port: number, overrides: Record<string, string> = {}) {
  const child = spawn(
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
        APP_ORIGIN: `http://localhost:${port}`,
        NEXT_TELEMETRY_DISABLED: "1",
        ...overrides,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  processes.add(child);
  return child;
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolveStop) => {
    child.once("exit", () => resolveStop());
    child.kill();
  });
}

async function request(path: string, init: RequestInit = {}) {
  const timeout = AbortSignal.timeout(15_000);
  return fetch(`${origin}${path}`, {
    ...init,
    redirect: "manual",
    signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
}

function assertLoginRedirect(response: Response) {
  assert.equal(response.status, 307);
  const location = response.headers.get("location");
  assert.ok(location);
  assert.equal(new URL(location, origin).href, `${origin}/login`);
}

function assertNoProtectedContent(body: string) {
  for (const value of [
    '"id":"projects"',
    "Rd Exchange",
    "My Portfolio",
    "Native Cuts",
    "LogoutButton",
    "Sign out",
    email,
    password,
    admin.passwordHash,
    secret,
  ]) {
    assert.equal(body.includes(value), false, "Protected content was returned");
  }
}

async function rscRequest(headers: Record<string, string>) {
  let response = await request("/admin/projects", { headers });
  const location = response.headers.get("location");
  if (location) {
    const target = new URL(location, origin);
    if (target.pathname === "/admin/projects") {
      // Next redirects once to the Flight header cache key before rendering.
      // Normal RSC requests use a bare `_rsc`; prefetch requests use a hash.
      assert.equal(response.status, 307);
      assert.equal(target.origin, origin);
      assert.equal(target.hash, "");
      assert.equal(target.searchParams.getAll("_rsc").length, 1);
      assert.deepEqual([...target.searchParams.keys()], ["_rsc"]);
      assert.equal(await response.text(), "");
      response = await request(`${target.pathname}${target.search}`, {
        headers,
      });
    }
  }
  return response;
}

async function assertRscLoginRedirect(response: Response) {
  if (response.status === 307) {
    assertLoginRedirect(response);
    return;
  }
  // A Server Component redirect can be serialized in a successful Flight
  // response. Require the actual redirect error, never just a 200 status.
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/x-component(?:;|$)/,
  );
  const body = await response.text();
  const errors = body.split(/\r?\n/).flatMap((line) => {
    const match = /^[0-9a-f]+:E(\{.*\})$/.exec(line);
    return match ? [JSON.parse(match[1]) as { digest?: string }] : [];
  });
  assert.ok(
    errors.length > 0,
    "Flight response did not contain a redirect error",
  );
  for (const error of errors) {
    assert.equal(error.digest, "NEXT_REDIRECT;replace;/login;307;");
  }
  assertNoProtectedContent(body);
}

function login(body: unknown, headers: Record<string, string> = {}) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, ...headers },
    body: JSON.stringify(body),
  });
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
    server = startServer(port);
    server.stdout?.on("data", (data) => {
      logs = (logs + String(data)).slice(-8000);
    });
    server.stderr?.on("data", (data) => {
      logs = (logs + String(data)).slice(-8000);
    });
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (server.exitCode !== null)
        throw new Error(`Auth test server exited: ${logs}`);
      try {
        const response = await request("/login");
        if (response.status === 200) {
          await response.text();
          return;
        }
      } catch {
        /* The listener is still starting. */
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
    throw new Error(`Auth test server did not become ready: ${logs}`);
  },
  { timeout: 120_000 },
);

after(async () => {
  await Promise.all([...processes].map(stop));
  await db.$disconnect();
  assert.equal(dirname(resolve(directory)), parent);
  assert.ok(directory.startsWith(join(parent, "portfolio-auth-")));
  rmSync(directory, { recursive: true, force: true });
});

test("anonymous direct admin visits redirect and protected mutations return401", async () => {
  for (const path of [
    "/admin",
    "/admin/projects",
    "/admin/stacks",
    "/admin/edit/home",
    "/admin/edit/portfolio",
    "/admin/edit/overview",
  ]) {
    const response = await request(path);
    assert.equal(response.status, 307, path);
    assert.equal(
      new URL(response.headers.get("location")!, origin).pathname,
      "/login",
    );
  }
  for (const [path, method] of [
    ["/api/blocks/hero", "PATCH"],
    ["/api/projects", "POST"],
    ["/api/stacks", "DELETE"],
    ["/api/upload", "POST"],
  ]) {
    const response = await request(path, {
      method,
      headers: {
        Origin: origin,
        "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy",
      },
    });
    assert.equal(response.status, 401, path);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  }
  const logout = await request("/api/auth/logout", {
    method: "POST",
    headers: { Origin: origin },
  });
  assert.equal(logout.status, 401);
  for (const path of ["/api/auth/login", "/api/auth/logout"])
    assert.equal((await request(path)).status, 405);
});

test("login rejects missing, null, foreign and spoofed origins", async () => {
  for (const supplied of [
    undefined,
    "null",
    "https://evil.example",
    `${origin}/`,
    `${origin}, https://evil.example`,
  ]) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-Host": "evil.example",
      "X-Forwarded-Proto": "https",
    };
    if (supplied) headers.Origin = supplied;
    const response = await request("/api/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("login validates body size, JSON fields, media type and bcrypt byte limit", async () => {
  const invalid = [
    { body: "{bad json", type: "application/json" },
    {
      body: JSON.stringify({ email, password, role: "admin" }),
      type: "application/json",
    },
    {
      body: JSON.stringify({ email, password: "x".repeat(5000) }),
      type: "application/json",
    },
    {
      body: `email=${email}&password=ignored`,
      type: "application/x-www-form-urlencoded",
    },
    {
      body: JSON.stringify({ email, password: "😀".repeat(19) }),
      type: "application/json",
    },
  ];
  for (const input of invalid) {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": input.type },
      body: input.body,
    });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("login has generic credential errors and issues a secure host-only signed cookie", async () => {
  const known = await login({ email, password: "wrong password" });
  const unknown = await login({
    email: "unknown@example.invalid",
    password: "wrong password",
  });
  assert.equal(known.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await known.json(), await unknown.json());
  const response = await login({
    email: `  ${email.toUpperCase()}  `,
    password,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie);
  assert.match(cookie, /^__Host-portfolio_session=/);
  for (const flag of [
    "HttpOnly",
    "Secure",
    "SameSite=strict",
    "Path=/",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ])
    assert.ok(cookie.toLowerCase().includes(flag.toLowerCase()), flag);
  assert.ok(!/domain=/i.test(cookie));
  assert.ok(
    !cookie.includes(password) &&
      !cookie.includes(admin.passwordHash) &&
      !cookie.includes(email),
  );
  authenticatedCookie = cookie.split(";")[0];
});

test("signed sessions access admin and logout requires the live account and exact origin", async () => {
  const response = await request("/admin/projects", {
    headers: { Cookie: authenticatedCookie },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const text of ["Rd Exchange", "My Portfolio", "Native Cuts", "Sign out"])
    assert.ok(html.includes(text), text);
  assert.ok(response.headers.get("cache-control")?.includes("no-store"));
  for (const path of ["/admin", "/login"]) {
    const redirected = await request(path, {
      headers: { Cookie: authenticatedCookie },
    });
    assert.equal(redirected.status, 307);
    assert.equal(
      new URL(redirected.headers.get("location")!, origin).pathname,
      "/admin/edit/portfolio",
    );
  }
  for (const supplied of [undefined, "null", "https://evil.example"]) {
    const response = await request("/api/auth/logout", {
      method: "POST",
      headers: {
        Cookie: authenticatedCookie,
        ...(supplied ? { Origin: supplied } : {}),
      },
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("set-cookie"), null);
  }
  const logout = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: authenticatedCookie, Origin: origin },
  });
  assert.equal(logout.status, 200);
  const cookie = logout.headers.get("set-cookie")!;
  assert.match(cookie, /^__Host-portfolio_session=;/);
  for (const flag of [
    "HttpOnly",
    "Secure",
    "SameSite=strict",
    "Path=/",
    "Max-Age=0",
  ])
    assert.ok(cookie.toLowerCase().includes(flag.toLowerCase()), flag);
});

test(
  "browser login reports failures, opens admin, and sign-out clears the cookie",
  { timeout: 60_000 },
  async () => {
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    try {
      const context = await browser.newContext();
      context.setDefaultTimeout(15_000);
      context.setDefaultNavigationTimeout(30_000);
      await replayFonts(context);
      await context.route("https://www.google.com/maps/embed**", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><title>Map fixture</title>",
        }),
      );
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}/login`);
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page
        .getByLabel("Password", { exact: true })
        .fill("browser wrong password");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page
        .getByRole("status")
        .filter({ hasText: "Email or password is incorrect." })
        .waitFor();
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL(`${origin}/admin/edit/portfolio`);
      const cookies = await context.cookies();
      const session = cookies.find(
        ({ name }) => name === "__Host-portfolio_session",
      );
      assert.ok(
        session?.httpOnly && session.secure && session.sameSite === "Strict",
      );
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await page.waitForURL(`${origin}/login`);
      assert.ok(
        !(await context.cookies()).some(
          ({ name }) => name === "__Host-portfolio_session",
        ),
      );
      await page.goto(`${origin}/admin/projects`);
      assert.equal(page.url(), `${origin}/login`);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);

test("prefetch rejects forged cookies and exposes only the route skeleton for a missing account", async () => {
  const valid = createSessionToken(admin, secret);
  for (const token of [
    "bad",
    `${valid.slice(0, -1)}${valid.endsWith("A") ? "B" : "A"}`,
    createSessionToken(admin, secret, Date.now() - SESSION_TTL_SECONDS * 1000),
    createSessionToken(admin, secret, Date.now() + 60_000),
  ]) {
    assertLoginRedirect(
      await rscRequest({
        Cookie: `__Host-portfolio_session=${token}`,
        RSC: "1",
        "Next-Router-Prefetch": "1",
      }),
    );
  }
  const token = createSessionToken({ ...admin, id: admin.id + 999 }, secret);
  const response = await rscRequest({
    Cookie: `__Host-portfolio_session=${token}`,
    RSC: "1",
    "Next-Router-Prefetch": "1",
  });
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/x-component(?:;|$)/,
  );
  const body = await response.text();
  const rows = body.trim().split(/\r?\n/);
  assert.equal(
    rows.length,
    1,
    "Prefetch returned additional component records",
  );
  const record = /^0:(\{.*\})$/.exec(rows[0]);
  assert.ok(record, "Prefetch did not return a route skeleton");
  const payload = JSON.parse(record[1]) as { f: unknown[][] };
  assert.ok(Array.isArray(payload.f));
  assert.equal(payload.f.length, 1);
  const entry = payload.f[0];
  assert.ok(Array.isArray(entry));
  assert.equal(entry.length, 4);
  assert.ok(Array.isArray(entry[0]));
  assert.equal(entry[1], null, "Prefetch exposed rendered component data");
  assert.deepEqual(entry[2], [null, null]);
  assert.equal(entry[3], true);
  assertNoProtectedContent(body);
  // A route skeleton grants no access: actual navigation still checks SQLite.
  await assertRscLoginRedirect(
    await rscRequest({ Cookie: `__Host-portfolio_session=${token}`, RSC: "1" }),
  );
});

test("forged, expired, future and ambiguous cookies fail direct and RSC admin visits", async () => {
  const cookie = (value: string) => `__Host-portfolio_session=${value}`;
  const valid = createSessionToken(admin, secret);
  const values = [
    "bad",
    `${valid.slice(0, -1)}${valid.endsWith("A") ? "B" : "A"}`,
    createSessionToken(admin, secret, Date.now() - SESSION_TTL_SECONDS * 1000),
    createSessionToken(admin, secret, Date.now() + 60_000),
    createSessionToken({ ...admin, id: admin.id + 999 }, secret),
  ];
  for (const token of values) {
    const direct = await request("/admin/projects", {
      headers: { Cookie: cookie(token) },
    });
    assertLoginRedirect(direct);
    const headers = {
      Cookie: cookie(token),
      RSC: "1",
    };
    await assertRscLoginRedirect(await rscRequest(headers));
  }
  const duplicate = await request("/admin/projects", {
    headers: { Cookie: `${cookie(valid)}; ${cookie(valid)}` },
  });
  assertLoginRedirect(duplicate);
  const oldHashToken = cookie(createSessionToken(admin, secret));
  await db.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hash("rotated test password", 4) },
  });
  assert.equal(
    (
      await request("/api/auth/logout", {
        method: "POST",
        headers: { Cookie: oldHashToken, Origin: origin },
      })
    ).status,
    401,
  );
  assertLoginRedirect(
    await request("/admin/projects", { headers: { Cookie: oldHashToken } }),
  );
  const current = await db.admin.findUniqueOrThrow({ where: { id: admin.id } });
  const deletedToken = cookie(createSessionToken(current, secret));
  await db.admin.delete({ where: { id: admin.id } });
  assert.equal(
    (
      await request("/api/auth/logout", {
        method: "POST",
        headers: { Cookie: deletedToken, Origin: origin },
      })
    ).status,
    401,
  );
});

test("account attempt limits survive case changes and spoofed forwarded IPs", async () => {
  for (let index = 0; index < 5; index++) {
    const response = await login(
      {
        email:
          index % 2
            ? "  THROTTLE@EXAMPLE.INVALID  "
            : "throttle@example.invalid",
        password: "wrong password",
      },
      { "X-Forwarded-For": `192.0.2.${index}` },
    );
    assert.equal(response.status, 401);
  }
  const response = await login(
    { email: "throttle@example.invalid", password: "wrong password" },
    { "X-Forwarded-For": "198.51.100.22" },
  );
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, "RATE_LIMIT");
  assert.ok(Number(response.headers.get("retry-after")) > 0);
});

test(
  "production startup refuses missing admin credentials",
  { timeout: 40_000 },
  async () => {
    const child = startServer(await freePort(), {
      ADMIN_EMAIL: "",
      ADMIN_PASSWORD: "",
    });
    let failure = "";
    child.stdout?.on("data", (data) => {
      failure += String(data);
    });
    child.stderr?.on("data", (data) => {
      failure += String(data);
    });
    await new Promise<void>((resolveExit, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Unconfigured production server did not exit")),
        30_000,
      );
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", () => {
        clearTimeout(timer);
        resolveExit();
      });
    });
    assert.notEqual(child.exitCode, 0);
    assert.match(failure, /ADMIN_EMAIL and ADMIN_PASSWORD must be configured/);
  },
);
