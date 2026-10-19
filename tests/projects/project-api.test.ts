import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type Admin } from "@prisma/client";
import { hash } from "bcryptjs";
import { parse, type DefaultTreeAdapterMap } from "parse5";
import { seedPortfolio } from "../../prisma/seed-content";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
} from "../../src/lib/session-token";

// Both HTTP requests and direct handler calls use this explicitly migrated,
// disposable database. No writes target the portfolio database in .env.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-project-api-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const email = "project-test@example.invalid";
const password = "Isolated project test password";
const secret = "isolated-project-test-secret-at-least-32-bytes";
const bodyLimit = 64 * 1024;
const originalEnvironment = new Map<string, string | undefined>();
let origin = "";
let admin: Admin;
let server: ChildProcess | undefined;
let logs = "";
let collection: typeof import("../../src/app/api/projects/route");
let item: typeof import("../../src/app/api/projects/[id]/route");
let blocks: typeof import("../../src/app/api/blocks/[key]/route");
let directDatabase: PrismaClient | undefined;

type ProjectDto = {
  id: number;
  title: string;
  description: string | null;
  photoUrl: string | null;
  link: string | null;
  repoUrl: string | null;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  stacks: Array<{ id: number; name: string; svgPath: string; order: number }>;
};

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

function cookie(token = createSessionToken(admin, secret)) {
  return `__Host-portfolio_session=${token}`;
}

function headers() {
  return {
    Cookie: cookie(),
    Origin: origin,
    "Content-Type": "application/json",
  };
}

function mutate(
  method: "POST" | "PATCH",
  payload: unknown,
  id?: number | string,
) {
  return request(
    `/api/projects${id === undefined ? "" : `/${encodeURIComponent(id)}`}`,
    {
      method,
      headers: headers(),
      body: JSON.stringify(payload),
    },
  );
}

function context(id: number | string) {
  return { params: Promise.resolve({ id: String(id) }) };
}

async function snapshot() {
  const [projects, memberships, content] = await Promise.all([
    db.project.findMany({ orderBy: { id: "asc" } }),
    db.projectStack.findMany({
      orderBy: [{ projectId: "asc" }, { stackId: "asc" }],
    }),
    db.contentBlock.findMany({ orderBy: { id: "asc" } }),
  ]);
  return { projects, memberships, content };
}

async function failure(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^application\/json/,
  );
  const body = await response.json();
  assert.equal(body.error.code, code);
  assert.equal(typeof body.error.message, "string");
  assert.ok(body.error.message.length > 0);
  if (body.error.fields) {
    for (const messages of Object.values(body.error.fields)) {
      assert.ok(Array.isArray(messages));
      assert.ok(messages.every((message) => typeof message === "string"));
    }
  }
  const serialized = JSON.stringify(body);
  for (const hidden of [password, secret, admin.passwordHash, databaseUrl])
    assert.ok(
      !serialized.includes(hidden),
      "Response exposed private configuration",
    );
  return body;
}

async function saved(response: Response, status = 200): Promise<ProjectDto> {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["project"]);
  const project = body.project as ProjectDto;
  assert.deepEqual(Object.keys(project).sort(), [
    "countryCode",
    "createdAt",
    "description",
    "id",
    "link",
    "order",
    "photoUrl",
    "published",
    "regionCode",
    "repoUrl",
    "stacks",
    "title",
    "updatedAt",
  ]);
  const row = await db.project.findUniqueOrThrow({
    where: { id: project.id },
    include: {
      stacks: {
        orderBy: [{ order: "asc" }, { stackId: "asc" }],
        include: { stack: true },
      },
    },
  });
  const { stacks, createdAt, updatedAt, ...fields } = row;
  assert.deepEqual(project, {
    ...fields,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    stacks: stacks.map(({ stack, order }) => ({ ...stack, order })),
  });
  return project;
}

async function createProject(payload: Record<string, unknown> = {}) {
  return saved(
    await mutate("POST", { title: "Disposable project", ...payload }),
    201,
  );
}

async function removeFixture(id: number) {
  await db.project.deleteMany({ where: { id } });
}

type HtmlNode = DefaultTreeAdapterMap["node"];
function walk(node: HtmlNode): HtmlNode[] {
  return [node, ...("childNodes" in node ? node.childNodes.flatMap(walk) : [])];
}
function text(node: HtmlNode): string {
  if (["script", "style", "svg"].includes(node.nodeName)) return "";
  if ("value" in node) return node.value;
  return "childNodes" in node ? node.childNodes.map(text).join("") : "";
}
function projectSection(html: string) {
  const section = walk(parse(html)).find(
    (node) =>
      "attrs" in node &&
      node.attrs.some(
        ({ name, value }) => name === "id" && value === "projects",
      ),
  );
  assert.ok(section, "Portfolio has no projects section");
  return section;
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
        timeout: 120_000,
      },
    );
    await seedPortfolio(db, { ADMIN_EMAIL: email, ADMIN_PASSWORD: password });
    admin = await db.admin.findUniqueOrThrow({ where: { email } });
    const port = await freePort();
    origin = `http://localhost:${port}`;
    const environment = {
      NODE_ENV: "production" as const,
      DATABASE_URL: databaseUrl,
      ADMIN_EMAIL: email,
      ADMIN_PASSWORD: password,
      SESSION_SECRET: secret,
      APP_ORIGIN: origin,
      NEXT_TELEMETRY_DISABLED: "1",
    };
    for (const [name, value] of Object.entries(environment)) {
      originalEnvironment.set(name, process.env[name]);
      process.env[name] = value;
    }
    collection = await import("../../src/app/api/projects/route");
    item = await import("../../src/app/api/projects/[id]/route");
    blocks = await import("../../src/app/api/blocks/[key]/route");
    directDatabase = (await import("../../src/lib/db")).db;
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
        env: { ...process.env, ...environment },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server = child;
    child.stdout?.on("data", (data) => {
      logs = (logs + String(data)).slice(-8000);
    });
    child.stderr?.on("data", (data) => {
      logs = (logs + String(data)).slice(-8000);
    });
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null)
        throw new Error(`Project test server exited: ${logs}`);
      try {
        const response = await request("/login");
        if (response.status === 200) {
          await response.text();
          return;
        }
      } catch {
        /* Listener still starting. */
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
    throw new Error(`Project test server did not become ready: ${logs}`);
  },
  { timeout: 240_000 },
);

after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const child = server;
    await new Promise<void>((resolveStop) => {
      child.once("exit", () => resolveStop());
      child.kill();
    });
  }
  await directDatabase?.$disconnect();
  await db.$disconnect();
  for (const [name, value] of originalEnvironment) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  assert.equal(dirname(resolve(directory)), parent);
  assert.ok(directory.startsWith(join(parent, "portfolio-project-api-")));
  rmSync(directory, { recursive: true, force: true });
});

test("project and stack DTOs are flat, ordered, authenticated, and never cached", async () => {
  const response = await request("/api/projects", {
    headers: { Cookie: cookie() },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["projects", "stacks"]);
  const expected = await db.project.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
  assert.deepEqual(
    body.projects.map(({ id }: ProjectDto) => id),
    expected.map(({ id }) => id),
  );
  assert.deepEqual(
    body.stacks,
    await db.stack.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
  );
  for (const { id } of expected)
    await saved(
      await request(`/api/projects/${id}`, { headers: { Cookie: cookie() } }),
    );
});

test("anonymous, forged, expired, future and missing-account sessions fail on every handler without Proxy", async () => {
  const original = await snapshot();
  const valid = createSessionToken(admin, secret);
  const invalidTokens = [
    undefined,
    "bad",
    `${valid.slice(0, -1)}${valid.endsWith("A") ? "B" : "A"}`,
    createSessionToken(admin, secret, Date.now() - SESSION_TTL_SECONDS * 1000),
    createSessionToken(admin, secret, Date.now() + 60_000),
    createSessionToken({ ...admin, id: admin.id + 999 }, secret),
  ];
  for (const token of invalidTokens) {
    for (const method of [
      "GET-list",
      "GET-item",
      "POST",
      "PATCH",
      "DELETE",
    ] as const) {
      const read = method.startsWith("GET");
      const incoming = new Request(
        `${origin}/api/projects${method === "GET-list" || method === "POST" ? "" : "/1"}`,
        {
          method: read ? "GET" : method,
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
            ...(token ? { Cookie: cookie(token) } : {}),
          },
          ...(!read ? { body: "{invalid json" } : {}),
        },
      );
      const response =
        method === "GET-list"
          ? await collection.GET(incoming)
          : method === "GET-item"
            ? await item.GET(incoming, context(1))
            : method === "POST"
              ? await collection.POST(incoming)
              : method === "PATCH"
                ? await item.PATCH(incoming, context(1))
                : await item.DELETE(incoming, context(1));
      await failure(response, 401, "UNAUTHORIZED");
      assert.equal(
        incoming.bodyUsed,
        false,
        `${method} consumed a rejected request body`,
      );
    }
  }
  await failure(await request("/api/projects"), 401, "UNAUTHORIZED");
  await failure(await request("/api/projects/1"), 401, "UNAUTHORIZED");
  assert.deepEqual(await snapshot(), original);
});

test("mutation handlers require the exact configured Origin before reading a body", async () => {
  const original = await snapshot();
  for (const supplied of [
    undefined,
    "null",
    "https://foreign.example",
    `${origin}/`,
    `${origin}, https://foreign.example`,
  ]) {
    for (const method of ["POST", "PATCH", "DELETE"] as const) {
      const incoming = new Request(
        `${origin}/api/projects${method === "POST" ? "" : "/1"}`,
        {
          method,
          headers: {
            Cookie: cookie(),
            "Content-Type": "application/json",
            "X-Forwarded-Host": "foreign.example",
            ...(supplied ? { Origin: supplied } : {}),
          },
          body: "{invalid json",
        },
      );
      const response =
        method === "POST"
          ? await collection.POST(incoming)
          : method === "PATCH"
            ? await item.PATCH(incoming, context(1))
            : await item.DELETE(incoming, context(1));
      await failure(response, 403, "ORIGIN");
      assert.equal(incoming.bodyUsed, false);
    }
  }
  // Reads need a live session; cross-origin/no-Origin does not make them mutations.
  assert.equal(
    (
      await request("/api/projects", {
        headers: { Cookie: cookie(), Origin: "https://foreign.example" },
      })
    ).status,
    200,
  );
  assert.deepEqual(await snapshot(), original);
});

test("malformed identifiers and missing projects fail without changing rows", async () => {
  const original = await snapshot();
  for (const id of ["0", "-1", "1.2", "1e1", "abc", "01", "2147483648"]) {
    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      await failure(
        await request(`/api/projects/${id}`, {
          method,
          headers: headers(),
          ...(method === "PATCH"
            ? { body: JSON.stringify({ title: "invalid id" }) }
            : {}),
        }),
        400,
        "VALIDATION",
      );
    }
  }
  for (const method of ["GET", "PATCH", "DELETE"] as const)
    await failure(
      await request("/api/projects/2147483647", {
        method,
        headers: headers(),
        ...(method === "PATCH"
          ? { body: JSON.stringify({ title: "missing row" }) }
          : {}),
      }),
      404,
      "NOT_FOUND",
    );
  assert.deepEqual(await snapshot(), original);
});

test("POST and PATCH reject malformed JSON, wrong media types and unknown fields atomically", async () => {
  const original = await snapshot();
  const invalidBodies = [
    "",
    "{invalid",
    "null",
    "[]",
    JSON.stringify("text"),
    "{}",
    JSON.stringify({ title: 42 }),
    JSON.stringify({ title: "changed", id: 9 }),
    JSON.stringify({ title: "changed", createdAt: "2026-01-01" }),
    JSON.stringify({ title: "changed", stacks: [] }),
    JSON.stringify({ title: "changed", unknown: true }),
  ];
  for (const method of ["POST", "PATCH"] as const) {
    const path = `/api/projects${method === "POST" ? "" : "/1"}`;
    for (const body of invalidBodies)
      await failure(
        await request(path, { method, headers: headers(), body }),
        400,
        "VALIDATION",
      );
    for (const type of [
      undefined,
      "text/plain",
      "application/jsonp",
      "application/x-www-form-urlencoded",
    ])
      await failure(
        await request(path, {
          method,
          headers: {
            Cookie: cookie(),
            Origin: origin,
            ...(type ? { "Content-Type": type } : {}),
          },
          body: JSON.stringify({ title: "wrong media type" }),
        }),
        400,
        "VALIDATION",
      );
  }
  assert.deepEqual(await snapshot(), original);
});

test("JSON byte limits apply to streamed bodies independently of Content-Length", async () => {
  const original = await snapshot();
  for (const method of ["POST", "PATCH"] as const) {
    const json = JSON.stringify({ title: "too much padding" });
    const bytes = Buffer.from(
      json + " ".repeat(bodyLimit + 1 - Buffer.byteLength(json)),
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < bytes.length; offset += 4096)
          controller.enqueue(bytes.subarray(offset, offset + 4096));
        controller.close();
      },
    });
    const init: RequestInit & { duplex: "half" } = {
      method,
      headers: { ...headers(), "Content-Length": "1" },
      body: stream,
      duplex: "half",
    };
    const incoming = new Request(
      `${origin}/api/projects${method === "POST" ? "" : "/1"}`,
      init,
    );
    await failure(
      method === "POST"
        ? await collection.POST(incoming)
        : await item.PATCH(incoming, context(1)),
      400,
      "VALIDATION",
    );
  }
  assert.deepEqual(await snapshot(), original);
  const json = JSON.stringify({ title: "Exact byte boundary" });
  const project = await saved(
    await request("/api/projects", {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": "application/json; charset=utf-8",
      },
      body: json + " ".repeat(bodyLimit - Buffer.byteLength(json)),
    }),
    201,
  );
  await removeFixture(project.id);
});

test("project copy preserves whitespace and literal HTML while validating Unicode and UTF-16 limits", async () => {
  const project = await createProject();
  try {
    for (const title of [
      "  tabs\tand newlines\nremain  ",
      "<b>Literal & text</b>",
      "x".repeat(10_000),
      "\u{1f642}".repeat(5000),
    ]) {
      const result = await saved(
        await mutate("PATCH", { title, description: title }, project.id),
      );
      assert.equal(result.title, title);
      assert.equal(result.description, title);
    }
    const original = await snapshot();
    for (const title of [
      "x".repeat(10_001),
      `${"\u{1f642}".repeat(5000)}x`,
      "\ud800",
      "\udc00",
      "bad\u0000text",
      "bad\u007ftext",
    ]) {
      await failure(
        await mutate("PATCH", { title }, project.id),
        400,
        "VALIDATION",
      );
      await failure(
        await mutate("PATCH", { description: title }, project.id),
        400,
        "VALIDATION",
      );
    }
    assert.deepEqual(await snapshot(), original);
    const cleared = await saved(
      await mutate("PATCH", { title: "", description: "" }, project.id),
    );
    assert.equal(cleared.title, "");
    assert.equal(cleared.description, "");
    for (const title of ["", "  \t\n "])
      await failure(await mutate("POST", { title }), 400, "VALIDATION");
  } finally {
    await removeFixture(project.id);
  }
});

test("links permit HTTP, HTTPS and root-relative paths and reject executable URLs", async () => {
  const project = await createProject();
  try {
    for (const link of [
      "https://example.invalid/work?q=a#demo",
      "http://example.invalid/work",
      "/work/demo?view=1#screen",
      null,
    ]) {
      const result = await saved(
        await mutate("PATCH", { link, repoUrl: link }, project.id),
      );
      assert.equal(result.link, link);
      assert.equal(result.repoUrl, link);
    }
    const original = await snapshot();
    for (const link of [
      "javascript:alert(1)",
      "data:text/html,evil",
      "//foreign.example",
      "relative/path",
      "\\foreign.example",
      "https://example.invalid/\nmalformed",
      "ftp://example.invalid",
    ])
      for (const field of ["link", "repoUrl"])
        await failure(
          await mutate("PATCH", { [field]: link }, project.id),
          400,
          "VALIDATION",
        );
    assert.deepEqual(await snapshot(), original);
  } finally {
    await removeFixture(project.id);
  }
});

test("photo paths accept local raster formats and reject remote, traversal and executable files", async () => {
  const project = await createProject();
  try {
    for (const photoUrl of [
      "/projectimgs/rdex.png",
      "/uploads/photo.jpg",
      "/uploads/photo.jpeg",
      "/uploads/photo.gif",
      "/uploads/photo.webp",
      "/uploads/photo.avif",
      null,
    ])
      assert.equal(
        (await saved(await mutate("PATCH", { photoUrl }, project.id))).photoUrl,
        photoUrl,
      );
    const original = await snapshot();
    for (const photoUrl of [
      "https://example.invalid/photo.png",
      "//example.invalid/photo.png",
      "/uploads/picture.svg",
      "/uploads/page.html",
      "/uploads/../secret.png",
      "/uploads/%2e%2e/secret.png",
      "uploads/photo.png",
      "data:image/png;base64,aaaa",
    ])
      await failure(
        await mutate("PATCH", { photoUrl }, project.id),
        400,
        "VALIDATION",
      );
    assert.deepEqual(await snapshot(), original);
  } finally {
    await removeFixture(project.id);
  }
});

test("create appends by default and rejects invalid ordering and publication values", async () => {
  const maximum = await db.project.aggregate({ _max: { order: true } });
  const project = await createProject({
    description: null,
    photoUrl: null,
    link: null,
    repoUrl: null,
  });
  try {
    assert.equal(project.order, (maximum._max.order ?? -1) + 1);
    assert.equal(project.published, true);
    assert.deepEqual(project.stacks, []);
    const original = await snapshot();
    for (const order of [-1, 1.5, "1", null, 2147483648])
      await failure(
        await mutate("PATCH", { order }, project.id),
        400,
        "VALIDATION",
      );
    for (const published of [0, "false", null])
      await failure(
        await mutate("PATCH", { published }, project.id),
        400,
        "VALIDATION",
      );
    assert.deepEqual(await snapshot(), original);
    const reordered = await saved(
      await mutate("PATCH", { order: 0, published: false }, project.id),
    );
    assert.equal(reordered.order, 0);
    assert.equal(reordered.published, false);
  } finally {
    await removeFixture(project.id);
  }
});

test("five unique existing stacks retain chip order and invalid membership edits roll back all fields", async () => {
  const catalog = await db.stack.findMany({ orderBy: { id: "asc" } });
  const selected = catalog
    .slice(0, 5)
    .reverse()
    .map(({ id }) => id);
  const project = await createProject({ stackIds: selected });
  try {
    assert.deepEqual(
      project.stacks.map(({ id }) => id),
      selected,
    );
    const original = await snapshot();
    for (const stackIds of [
      selected.concat(catalog[5].id),
      [selected[0], selected[0]],
      [0],
      [-1],
      [1.5],
      ["1"],
      [2147483647],
      null,
      "1",
    ])
      await failure(
        await mutate(
          "PATCH",
          { title: "Must roll back title", stackIds },
          project.id,
        ),
        400,
        "VALIDATION",
      );
    assert.deepEqual(await snapshot(), original);
    const reordered = [...selected].reverse();
    assert.deepEqual(
      (
        await saved(await mutate("PATCH", { stackIds: reordered }, project.id))
      ).stacks.map(({ id }) => id),
      reordered,
    );
    assert.deepEqual(
      await db.projectStack
        .findMany({
          where: { projectId: project.id },
          orderBy: { order: "asc" },
        })
        .then((rows) => rows.map(({ stackId, order }) => ({ stackId, order }))),
      reordered.map((stackId, order) => ({ stackId, order })),
    );
    assert.deepEqual(
      (await saved(await mutate("PATCH", { stackIds: [] }, project.id))).stacks,
      [],
    );
  } finally {
    await removeFixture(project.id);
  }
});

test("public cards use ordered published project data, escaped copy and links immediately after saving", async () => {
  const title = "<script>Public literal title & text</script>";
  const description =
    'Exact description <img src=x onerror="evil()"> & trailing spaces  ';
  const project = await createProject({
    title,
    description,
    link: "/demo",
    repoUrl: "https://example.invalid/repo",
    order: 0,
  });
  try {
    const response = await request("/");
    assert.equal(response.status, 200);
    const section = projectSection(await response.text());
    const headings = walk(section)
      .filter((node) => node.nodeName === "h1")
      .slice(1)
      .map(text);
    const expected = await db.project.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    assert.deepEqual(
      headings,
      expected.map(({ title }) => title),
    );
    assert.ok(text(section).includes(description));
    assert.ok(!walk(section).some((node) => node.nodeName === "script"));
    assert.ok(
      !walk(section).some(
        (node) =>
          "attrs" in node && node.attrs.some(({ name }) => name === "onerror"),
      ),
    );
    const hrefs = walk(section).flatMap((node) =>
      "attrs" in node
        ? node.attrs
            .filter(({ name }) => name === "href")
            .map(({ value }) => value)
        : [],
    );
    assert.ok(hrefs.includes("/demo"));
    // Preserve the single VISIT control, falling back to the repository when
    // the primary destination is cleared.
    await saved(await mutate("PATCH", { link: null }, project.id));
    const repositorySection = projectSection(await (await request("/")).text());
    assert.ok(
      walk(repositorySection).some(
        (node) =>
          "attrs" in node &&
          node.attrs.some(
            ({ name, value }) =>
              name === "href" && value === "https://example.invalid/repo",
          ),
      ),
    );
    await saved(await mutate("PATCH", { published: false }, project.id));
    assert.ok(
      !text(projectSection(await (await request("/")).text())).includes(title),
    );
    await saved(
      await mutate("PATCH", { published: true, order: 2147483647 }, project.id),
    );
    const last = walk(projectSection(await (await request("/")).text()))
      .filter((node) => node.nodeName === "h1")
      .map(text)
      .at(-1);
    assert.equal(last, title);
  } finally {
    await removeFixture(project.id);
  }
});

test("drafts are absent from the public portfolio and visible only with a live admin session", async () => {
  const title = "Isolated unpublished project title";
  const project = await createProject({ title, published: false });
  try {
    assert.ok(
      !text(projectSection(await (await request("/")).text())).includes(title),
    );
    await failure(
      await request(`/api/projects/${project.id}`),
      401,
      "UNAUTHORIZED",
    );
    assert.equal(
      (
        await saved(
          await request(`/api/projects/${project.id}`, {
            headers: { Cookie: cookie() },
          }),
        )
      ).published,
      false,
    );
    const adminResponse = await request("/admin/projects", {
      headers: { Cookie: cookie() },
    });
    assert.equal(adminResponse.status, 200);
    assert.ok(text(parse(await adminResponse.text())).includes(title));
    const anonymous = await request("/admin/projects");
    assert.equal(anonymous.status, 307);
    assert.equal(
      new URL(anonymous.headers.get("location")!, origin).pathname,
      "/login",
    );
  } finally {
    await removeFixture(project.id);
  }
});

test("legacy original-card copy and project fields synchronize in both API directions", async () => {
  const original = await db.project.findUniqueOrThrow({ where: { id: 1 } });
  const titleKey = "projects.text.003";
  const descriptionKey = "projects.text.004";
  const originalBlocks = await db.contentBlock.findMany({
    where: { key: { in: [titleKey, descriptionKey] } },
  });
  try {
    for (const [key, field, value] of [
      [titleKey, "title", "Legacy inline title"],
      [
        descriptionKey,
        "description",
        "Legacy inline description\nwith spaces  ",
      ],
    ] as const) {
      const response = await request(`/api/blocks/${key}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ value }),
      });
      assert.equal(response.status, 200);
      assert.equal(
        (await db.project.findUniqueOrThrow({ where: { id: 1 } }))[field],
        value,
      );
    }
    const result = await saved(
      await mutate(
        "PATCH",
        {
          title: "Project panel title",
          description: "Project panel description",
        },
        1,
      ),
    );
    assert.equal(
      (await db.contentBlock.findUniqueOrThrow({ where: { key: titleKey } }))
        .value,
      result.title,
    );
    assert.equal(
      (
        await db.contentBlock.findUniqueOrThrow({
          where: { key: descriptionKey },
        })
      ).value,
      result.description,
    );
    assert.ok(
      text(projectSection(await (await request("/")).text())).includes(
        result.title,
      ),
    );
    await saved(await mutate("PATCH", { title: "", description: null }, 1));
    assert.equal(
      (await db.contentBlock.findUniqueOrThrow({ where: { key: titleKey } }))
        .value,
      "",
    );
    assert.equal(
      (
        await db.contentBlock.findUniqueOrThrow({
          where: { key: descriptionKey },
        })
      ).value,
      "",
    );
    await saved(
      await mutate(
        "PATCH",
        {
          title: "Hidden original title",
          description: "Hidden original description",
          published: false,
        },
        1,
      ),
    );
    const html = await (await request("/")).text();
    assert.ok(
      !html.includes("Hidden original title"),
      "Draft leaked into public HTML or RSC data",
    );
    assert.ok(
      !html.includes("Hidden original description"),
      "Draft description leaked into public HTML or RSC data",
    );
  } finally {
    const { id, ...data } = original;
    await db.project.update({ where: { id }, data });
    for (const block of originalBlocks) {
      const { id, ...data } = block;
      await db.contentBlock.update({ where: { id }, data });
    }
  }
});

test("delete cascades memberships and subsequent reads or edits cannot recreate the project", async () => {
  const project = await createProject({ stackIds: [1, 2], published: false });
  const response = await request(`/api/projects/${project.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie(), Origin: origin },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { deletedId: project.id });
  assert.equal(
    await db.project.findUnique({ where: { id: project.id } }),
    null,
  );
  assert.equal(
    await db.projectStack.count({ where: { projectId: project.id } }),
    0,
  );
  const original = await snapshot();
  await failure(
    await request(`/api/projects/${project.id}`, {
      headers: { Cookie: cookie() },
    }),
    404,
    "NOT_FOUND",
  );
  await failure(
    await mutate("PATCH", { title: "Must not resurrect" }, project.id),
    404,
    "NOT_FOUND",
  );
  await failure(
    await request(`/api/projects/${project.id}`, {
      method: "DELETE",
      headers: headers(),
    }),
    404,
    "NOT_FOUND",
  );
  assert.deepEqual(await snapshot(), original);
});

test("deleting an original card removes its inline aliases from public data and prevents orphan text edits", async () => {
  const row = await db.project.findUniqueOrThrow({
    where: { id: 4 },
    include: { stacks: true },
  });
  const titleKey = "projects.text.015";
  const descriptionKey = "projects.text.016";
  const beforeBlocks = await db.contentBlock.findMany({
    where: { key: { in: [titleKey, descriptionKey] } },
  });
  try {
    await saved(
      await mutate(
        "PATCH",
        {
          title: "Deleted original unique title",
          description: "Deleted original unique description",
        },
        4,
      ),
    );
    const response = await request("/api/projects/4", {
      method: "DELETE",
      headers: headers(),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { deletedId: 4 });
    const original = await snapshot();
    for (const key of [titleKey, descriptionKey]) {
      const incoming = new Request(`${origin}/api/blocks/${key}`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ value: "Cannot edit a deleted card" }),
      });
      await failure(
        await blocks.PATCH(incoming, { params: Promise.resolve({ key }) }),
        404,
        "NOT_FOUND",
      );
    }
    assert.deepEqual(await snapshot(), original);
    const html = await (await request("/")).text();
    assert.ok(!html.includes("Deleted original unique title"));
    assert.ok(!html.includes("Deleted original unique description"));
  } finally {
    const { stacks, ...data } = row;
    await db.project.upsert({
      where: { id: 4 },
      create: {
        ...data,
        stacks: {
          create: stacks.map(({ stackId, order }) => ({ stackId, order })),
        },
      },
      update: data,
    });
    for (const block of beforeBlocks) {
      const { id, ...data } = block;
      await db.contentBlock.update({ where: { id }, data });
    }
  }
});

test("rotated or deleted admin credentials invalidate project reads and mutations without Proxy", async () => {
  const original = await snapshot();
  const oldCookie = cookie();
  try {
    const rotated = await db.admin.update({
      where: { id: admin.id },
      data: { passwordHash: await hash("Rotated project password", 4) },
    });
    for (const staleCookie of [
      oldCookie,
      cookie(createSessionToken(rotated, secret)),
    ]) {
      if (staleCookie !== oldCookie)
        await db.admin.delete({ where: { id: admin.id } });
      const read = new Request(`${origin}/api/projects`, {
        headers: { Cookie: staleCookie },
      });
      await failure(await collection.GET(read), 401, "UNAUTHORIZED");
      const mutation = new Request(`${origin}/api/projects/1`, {
        method: "PATCH",
        headers: { ...headers(), Cookie: staleCookie },
        body: "{invalid json",
      });
      await failure(
        await item.PATCH(mutation, context(1)),
        401,
        "UNAUTHORIZED",
      );
      assert.equal(mutation.bodyUsed, false);
    }
    assert.deepEqual(await snapshot(), original);
  } finally {
    await db.admin.upsert({
      where: { id: admin.id },
      create: admin,
      update: { passwordHash: admin.passwordHash },
    });
  }
});

test("unexpected database failures return a sanitized unavailable response", async () => {
  assert.ok(directDatabase);
  const findMany = directDatabase.project.findMany;
  const transaction = directDatabase.$transaction;
  const diagnostic = `Private database diagnostic ${databaseUrl} ${password} ${secret}`;
  try {
    directDatabase.project.findMany = (() => {
      throw new Error(diagnostic);
    }) as typeof findMany;
    await failure(
      await collection.GET(
        new Request(`${origin}/api/projects`, {
          headers: { Cookie: cookie() },
        }),
      ),
      503,
      "UNAVAILABLE",
    );
    directDatabase.project.findMany = findMany;
    directDatabase.$transaction = (() => {
      throw new Error(diagnostic);
    }) as typeof transaction;
    const incoming = new Request(`${origin}/api/projects/1`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ title: "Not written" }),
    });
    await failure(await item.PATCH(incoming, context(1)), 503, "UNAVAILABLE");
  } finally {
    directDatabase.project.findMany = findMany;
    directDatabase.$transaction = transaction;
  }
});
