import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { PrismaClient, type Admin } from "@prisma/client";
import { seedPortfolio } from "../../prisma/seed-content";
import manifest from "../../prisma/seed-data.json";
import { createSessionToken } from "../../src/lib/session-token";
import {
  countries,
  nigeriaStates,
  visitorCountry,
  nigeriaRegion,
} from "../../src/lib/countries";
import {
  INJECTION_MESSAGE,
  isInjectionProbe,
} from "../../src/lib/injection-probe";

const parent = resolve(".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-history-"));
const url = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const db = new PrismaClient({ datasources: { db: { url } } });
const origin = "https://history.example.invalid",
  secret = "isolated-history-secret-at-least-32-bytes";
let admin: Admin, directDb: PrismaClient;
let api: typeof import("../../src/app/api/history/route"),
  blocks: typeof import("../../src/app/api/blocks/[key]/route"),
  store: typeof import("../../src/lib/project-store"),
  history: typeof import("../../src/lib/portfolio-history");
const previous = new Map<string, string | undefined>();
const files: string[] = [];
function request(
  data?: unknown,
  options: { authenticated?: boolean; origin?: string } = {},
) {
  return new Request(`${origin}/api/history`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: options.origin ?? origin,
      ...(options.authenticated === false
        ? {}
        : {
            Cookie: `__Host-portfolio_session=${createSessionToken(admin, secret)}`,
          }),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
async function action(action: "undo" | "redo") {
  return api.POST(
    request({ action, version: (await history.historyStatus()).version }),
  );
}
before(async () => {
  execFileSync(
    process.execPath,
    [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
    { env: { ...process.env, DATABASE_URL: url, VERCEL: "0" }, stdio: "pipe" },
  );
  await seedPortfolio(db, {
    ADMIN_EMAIL: "history@example.invalid",
    ADMIN_PASSWORD: "History tests only password",
  });
  admin = await db.admin.findFirstOrThrow();
  for (const [key, value] of Object.entries({
    NODE_ENV: "production",
    VERCEL: "0",
    BLOB_READ_WRITE_TOKEN: "",
    DATABASE_URL: url,
    SESSION_SECRET: secret,
    APP_ORIGIN: origin,
    ADMIN_EMAIL: admin.email,
    ADMIN_PASSWORD: "History tests only password",
  })) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }
  api = await import("../../src/app/api/history/route");
  blocks = await import("../../src/app/api/blocks/[key]/route");
  store = await import("../../src/lib/project-store");
  history = await import("../../src/lib/portfolio-history");
  directDb = (await import("../../src/lib/db")).db;
});
after(async () => {
  await directDb?.$disconnect();
  await db.$disconnect();
  for (const [key, value] of previous) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const file of files) {
    const full = resolve("public", file.slice(1));
    assert.equal(dirname(full), resolve("public/uploads/resumes"));
    if (existsSync(full)) unlinkSync(full);
  }
  assert.equal(dirname(directory), parent);
  rmSync(directory, { recursive: true, force: true });
});
test("history requires a live session, trusted origin and explicit full-reset confirmation", async () => {
  assert.equal(
    (await api.GET(request(undefined, { authenticated: false }))).status,
    401,
  );
  assert.equal(
    (
      await api.POST(
        request(
          { action: "undo", version: 0 },
          { origin: "https://untrusted.invalid" },
        ),
      )
    ).status,
    403,
  );
  assert.equal((await api.POST(request({ action: "defaults" }))).status, 400);
  assert.deepEqual(await (await api.GET(request())).json(), {
    undo: null,
    redo: null,
    version: 0,
  });
});
test("text and project alias saves persist undo/redo, reject stale tabs, and discard redo after a new edit", async () => {
  const key = "projects.text.003";
  const old = (await db.project.findUniqueOrThrow({ where: { id: 1 } })).title;
  const save = (value: string) =>
    blocks.PATCH(
      new Request(`${origin}/api/blocks/${key}`, {
        method: "PATCH",
        headers: request().headers,
        body: JSON.stringify({ value }),
      }),
      { params: Promise.resolve({ key }) },
    );
  assert.equal((await save("Mistaken title")).status, 200);
  const revision = await db.portfolioRevision.findFirstOrThrow();
  assert.ok(!revision.before.includes(admin.passwordHash));
  const stale = (await history.historyStatus()).version;
  assert.equal((await action("undo")).status, 200);
  assert.equal(
    (await db.project.findUniqueOrThrow({ where: { id: 1 } })).title,
    old,
  );
  assert.equal(
    (await db.contentBlock.findUniqueOrThrow({ where: { key } })).value,
    old,
  );
  assert.equal(
    (await api.POST(request({ action: "redo", version: stale }))).status,
    409,
  );
  assert.equal((await action("redo")).status, 200);
  assert.equal(
    (await db.project.findUniqueOrThrow({ where: { id: 1 } })).title,
    "Mistaken title",
  );
  assert.equal((await action("undo")).status, 200);
  assert.equal((await save("New branch")).status, 200);
  assert.equal((await history.historyStatus()).redo, null);
  const reopened = new PrismaClient({ datasources: { db: { url } } });
  try {
    assert.ok(await reopened.portfolioRevision.count());
  } finally {
    await reopened.$disconnect();
  }
});
test("full defaults remove additions and saved links, preserve admin, and can themselves be undone including résumé files", async () => {
  const { storeResume } = await import("../../src/lib/resume-upload");
  const file = await storeResume(new File(["%PDF-1.4\n%%EOF"], "test.pdf"));
  files.push(file);
  const { PATCH } = await import("../../src/app/api/site-links/[key]/route");
  assert.equal(
    (
      await PATCH(
        new Request(`${origin}/api/site-links/site.resume.url`, {
          method: "PATCH",
          headers: request().headers,
          body: JSON.stringify({ value: file }),
        }),
        { params: Promise.resolve({ key: "site.resume.url" }) },
      )
    ).status,
    200,
  );
  const extra = await store.createProject({
    title: "Added project",
    countryCode: "NG",
    regionCode: "AN",
    stackIds: [1, 2],
  });
  const response = await api.POST(
    request({ action: "defaults", confirmation: "RESTORE ORIGINAL PORTFOLIO" }),
  );
  assert.equal(response.status, 200);
  assert.equal(await db.project.count(), manifest.projects.length);
  assert.equal(await db.stack.count(), manifest.stacks.length);
  for (const original of manifest.content)
    assert.equal(
      (
        await db.contentBlock.findUniqueOrThrow({
          where: { key: original.key },
        })
      ).value,
      original.value,
    );
  assert.equal(
    await db.contentBlock.findUnique({ where: { key: "site.resume.url" } }),
    null,
  );
  assert.equal(
    (await db.admin.findUniqueOrThrow({ where: { id: admin.id } }))
      .passwordHash,
    admin.passwordHash,
  );
  assert.equal((await action("undo")).status, 200);
  assert.equal(
    (await db.project.findUniqueOrThrow({ where: { id: extra.id } }))
      .regionCode,
    "AN",
  );
  assert.equal(
    (
      await db.contentBlock.findUniqueOrThrow({
        where: { key: "site.resume.url" },
      })
    ).value,
    file,
  );
  assert.ok(existsSync(resolve("public", file.slice(1))));
});
test("country/state matching uses automatic Vercel estimates, supports all Nigerian states and never exposes draft projects", async () => {
  assert.equal(countries.length, 249);
  assert.equal(nigeriaStates.length, 37);
  assert.equal(nigeriaRegion("NG-AN"), "AN");
  assert.equal(nigeriaRegion("unknown"), null);
  assert.equal(
    visitorCountry(new Headers({ "x-vercel-ip-country": "NG" }), {
      VERCEL: "0",
    }),
    null,
  );
  await store.createProject({
    title: "Private Anambra",
    countryCode: "NG",
    regionCode: "AN",
    published: false,
  });
  await store.createProject({
    title: "Lagos work",
    countryCode: "NG",
    regionCode: "LA",
  });
  await assert.rejects(
    store.createProject({
      title: "Invalid state",
      countryCode: "US",
      regionCode: "AN",
    }),
  );
  const { GET } = await import("../../src/app/api/nearby/route");
  process.env.VERCEL = "1";
  try {
    const nearby = await GET(
      new Request(`${origin}/api/nearby`, {
        headers: {
          "x-vercel-ip-country": "NG",
          "x-vercel-ip-country-region": "AN",
          "x-forwarded-for": "203.0.113.8",
        },
      }),
    );
    assert.equal(nearby.headers.get("cache-control"), "no-store");
    const body = await nearby.json();
    assert.equal(body.scope, "region");
    assert.equal(body.region.name, "Anambra");
    assert.ok(body.projects.length);
    assert.ok(
      body.projects.every(
        (project: { regionCode: string; published?: boolean; title: string }) =>
          project.regionCode === "AN" && project.title !== "Private Anambra",
      ),
    );
    assert.ok(!JSON.stringify(body).includes("203.0.113.8"));
    const fallback = await (
      await GET(
        new Request(`${origin}/api/nearby`, {
          headers: {
            "x-vercel-ip-country": "NG",
            "x-vercel-ip-country-region": "SO",
          },
        }),
      )
    ).json();
    assert.equal(fallback.scope, "country");
    assert.ok(
      fallback.projects.some(
        (project: { title: string }) => project.title === "Lagos work",
      ),
    );
    const unknown = await (
      await GET(new Request(`${origin}/api/nearby`))
    ).json();
    assert.equal(unknown.country, null);
    assert.ok(
      (await store.listProjects({ publishedOnly: true })).some(
        (project) => project.title === "Lagos work",
      ),
      "The main project list remains unfiltered by country",
    );
  } finally {
    process.env.VERCEL = "0";
  }
});
test("history is bounded to the latest 50 saved mutations", async () => {
  const block = await db.contentBlock.findFirstOrThrow();
  for (let i = 0; i < 52; i++)
    await history.portfolioTransaction("History cap test", (tx) =>
      tx.contentBlock.update({
        where: { id: block.id },
        data: { value: `Revision ${i}` },
      }),
    );
  assert.equal(await db.portfolioRevision.count(), 50);
});
test("custom injection response recognizes SQL probes while ordinary comments, names and password punctuation remain valid", () => {
  for (const value of [
    "admin'--",
    "' OR 1=1 --",
    "' OR '1'='1' --",
    "1 UNION SELECT password FROM Admin",
    "1; DROP TABLE Admin",
  ])
    assert.equal(isInjectionProbe(value), true, value);
  for (const value of [
    "My -- project notes",
    "O'Connor",
    "my-password--is-long",
    "I select projects for people",
    "https://portfolio.example",
  ])
    assert.equal(isInjectionProbe(value), false, value);
  assert.match(INJECTION_MESSAGE, /share my link/);
});

test("login and admin query probes get the custom message; SQL-looking valid passwords still sign in", async () => {
  const { POST } = await import("../../src/app/api/auth/login/route");
  const { hash } = await import("bcryptjs");
  const send = (email: string, password: string) =>
    POST(
      new Request(`${origin}/api/auth/login`, {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );
  const probe = await send("admin'--", "test");
  assert.equal(probe.status, 400);
  assert.equal((await probe.json()).error.message, INJECTION_MESSAGE);
  assert.equal(probe.headers.get("set-cookie"), null);
  const tricky = "A tricky ' OR 1=1 -- password";
  const failed = await send(admin.email, tricky);
  assert.equal(failed.status, 400);
  assert.equal((await failed.json()).error.code, "INJECTION_PROBE");
  await db.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hash(tricky, 12) },
  });
  const success = await send(admin.email, tricky);
  assert.equal(success.status, 200);
  assert.ok(success.headers.get("set-cookie"));
  const { NextRequest } = await import("next/server");
  const { proxy } = await import("../../src/proxy");
  const query = new URL(`${origin}/admin`);
  query.searchParams.set("id", "1 UNION SELECT password FROM Admin");
  const response = proxy(new NextRequest(query));
  assert.equal(response.status, 400);
  assert.equal(await response.text(), INJECTION_MESSAGE);
});
