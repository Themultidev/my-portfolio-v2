import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type Admin } from "@prisma/client";
import { hash } from "bcryptjs";
import { seedPortfolio } from "../../prisma/seed-content";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
} from "../../src/lib/session-token";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-content-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const email = "content-test@example.invalid";
const password = "Isolated content test password";
const secret = "isolated-content-test-secret-at-least-32-bytes";
const bodyLimit = 64 * 1024;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const originalEnvironment = new Map<string, string | undefined>();
let origin = "";
let server: ChildProcess | undefined;
let logs = "";
let admin: Admin;
let key = "";
let blockIdentity: { id: number; label: string };
let directRoute: typeof import("../../src/app/api/blocks/[key]/route");
let directDatabase: PrismaClient | undefined;

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

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${origin}${path}`, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
}

function cookie(token = createSessionToken(admin, secret)) {
  return `__Host-portfolio_session=${token}`;
}

function authenticatedHeaders() {
  return {
    "Content-Type": "application/json",
    Origin: origin,
    Cookie: cookie(),
  };
}

function patch(value: unknown, target = key) {
  return request(`/api/blocks/${encodeURIComponent(target)}`, {
    method: "PATCH",
    headers: authenticatedHeaders(),
    body: JSON.stringify(value),
  });
}

function contentSnapshot() {
  return db.contentBlock.findMany({ orderBy: { id: "asc" } });
}

async function assertFailure(response: Response, status: number, code: string) {
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
  if (body.error.fields !== undefined) {
    assert.ok(body.error.fields && typeof body.error.fields === "object");
    for (const messages of Object.values(body.error.fields)) {
      assert.ok(Array.isArray(messages));
      assert.ok(messages.every((message) => typeof message === "string"));
    }
  }
  const serialized = JSON.stringify(body);
  for (const hidden of [password, admin.passwordHash, secret, databaseUrl])
    assert.ok(
      !serialized.includes(hidden),
      "Error exposed private configuration",
    );
  return body;
}

async function assertSaved(response: Response, value: string) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["block"]);
  assert.deepEqual(Object.keys(body.block).sort(), [
    "key",
    "label",
    "updatedAt",
    "value",
  ]);
  assert.equal(body.block.key, key);
  assert.equal(body.block.value, value);
  assert.equal(typeof body.block.label, "string");
  assert.equal(
    new Date(body.block.updatedAt).toISOString(),
    body.block.updatedAt,
  );
  const saved = await db.contentBlock.findUniqueOrThrow({ where: { key } });
  assert.equal(saved.id, blockIdentity.id);
  assert.equal(saved.label, blockIdentity.label);
  assert.equal(saved.value, value);
  assert.equal(body.block.label, saved.label);
  assert.equal(body.block.updatedAt, saved.updatedAt.toISOString());
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
    const block = await db.contentBlock.findFirstOrThrow({
      orderBy: { id: "asc" },
    });
    key = block.key;
    blockIdentity = { id: block.id, label: block.label };
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
    // Direct handler calls use the same disposable database and credentials as
    // the production server. They deliberately bypass Proxy for guard checks.
    for (const [name, value] of Object.entries(environment)) {
      originalEnvironment.set(name, process.env[name]);
      process.env[name] = value;
    }
    directRoute = await import("../../src/app/api/blocks/[key]/route");
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
        throw new Error(`Content test server exited: ${logs}`);
      try {
        const response = await request("/login");
        if (response.status === 200) {
          await response.text();
          return;
        }
      } catch {
        /* The production listener is still starting. */
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    }
    throw new Error(`Content test server did not become ready: ${logs}`);
  },
  { timeout: 120_000 },
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
  assert.ok(directory.startsWith(join(parent, "portfolio-content-")));
  rmSync(directory, { recursive: true, force: true });
});

test("unauthenticated, forged, expired and missing-account sessions cannot edit blocks", async () => {
  const original = await contentSnapshot();
  const valid = createSessionToken(admin, secret);
  for (const token of [
    undefined,
    "bad",
    `${valid.slice(0, -1)}${valid.endsWith("A") ? "B" : "A"}`,
    createSessionToken(admin, secret, Date.now() - SESSION_TTL_SECONDS * 1000),
    createSessionToken(admin, secret, Date.now() + 60_000),
    createSessionToken({ ...admin, id: admin.id + 999 }, secret),
  ]) {
    const response = await request(`/api/blocks/${key}`, {
      method: "PATCH",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy",
        ...(token ? { Cookie: cookie(token) } : {}),
      },
      body: "{invalid json",
    });
    await assertFailure(response, 401, "UNAUTHORIZED");
  }
  assert.deepEqual(await contentSnapshot(), original);
});

test("authenticated mutations require the exact configured Origin", async () => {
  const original = await contentSnapshot();
  for (const supplied of [
    undefined,
    "null",
    "https://foreign.example",
    `${origin}/`,
    `${origin}, https://foreign.example`,
  ]) {
    const response = await request(`/api/blocks/${key}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie(),
        "X-Forwarded-Host": "foreign.example",
        "X-Forwarded-Proto": "https",
        ...(supplied ? { Origin: supplied } : {}),
      },
      body: "{invalid json",
    });
    await assertFailure(response, 403, "ORIGIN");
  }
  assert.deepEqual(await contentSnapshot(), original);
});

test("the handler enforces authentication and Origin before consuming the body without Proxy", async () => {
  const original = await contentSnapshot();
  const cases: Array<{
    headers: Record<string, string>;
    status: number;
    code: string;
  }> = [
    { headers: { Origin: origin }, status: 401, code: "UNAUTHORIZED" },
    {
      headers: { Origin: origin, Cookie: cookie("bad") },
      status: 401,
      code: "UNAUTHORIZED",
    },
    {
      headers: {
        Origin: origin,
        Cookie: cookie(
          createSessionToken({ ...admin, id: admin.id + 999 }, secret),
        ),
      },
      status: 401,
      code: "UNAUTHORIZED",
    },
    { headers: { Cookie: cookie() }, status: 403, code: "ORIGIN" },
    {
      headers: { Origin: "https://foreign.example", Cookie: cookie() },
      status: 403,
      code: "ORIGIN",
    },
  ];
  for (const input of cases) {
    const incoming = new Request(`${origin}/api/blocks/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...input.headers },
      body: "{invalid json",
    });
    const response = await directRoute.PATCH(incoming, {
      params: Promise.resolve({ key }),
    });
    await assertFailure(response, input.status, input.code);
    assert.equal(
      incoming.bodyUsed,
      false,
      "Rejected request body was consumed",
    );
  }
  assert.deepEqual(await contentSnapshot(), original);
});

test("malformed JSON and invalid strict value payloads return validation errors without writes", async () => {
  const original = await contentSnapshot();
  const bodies = [
    "",
    "{invalid json",
    "null",
    "[]",
    JSON.stringify("text"),
    JSON.stringify({}),
    JSON.stringify({ value: null }),
    JSON.stringify({ value: 42 }),
    JSON.stringify({ value: true }),
    JSON.stringify({ value: [] }),
    JSON.stringify({ value: {} }),
    JSON.stringify({ value: "changed", label: "overwrite label" }),
    JSON.stringify({ value: "changed", key: "overwrite key" }),
  ];
  for (const body of bodies) {
    await assertFailure(
      await request(`/api/blocks/${key}`, {
        method: "PATCH",
        headers: authenticatedHeaders(),
        body,
      }),
      400,
      "VALIDATION",
    );
  }
  assert.deepEqual(await contentSnapshot(), original);
});

test("only JSON media types are accepted, including charset parameters", async () => {
  const original = await contentSnapshot();
  for (const type of [
    undefined,
    "text/plain",
    "application/x-www-form-urlencoded",
    "application/jsonp",
  ]) {
    await assertFailure(
      await request(`/api/blocks/${key}`, {
        method: "PATCH",
        headers: {
          Cookie: cookie(),
          Origin: origin,
          ...(type ? { "Content-Type": type } : {}),
        },
        body: JSON.stringify({ value: "media validation" }),
      }),
      400,
      "VALIDATION",
    );
  }
  assert.deepEqual(await contentSnapshot(), original);
  const value = "JSON with a charset";
  await assertSaved(
    await request(`/api/blocks/${key}`, {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders(),
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ value }),
    }),
    value,
  );
});

test("edits persist exact whitespace, empty text and literal HTML while preserving identity and label", async () => {
  const original = await contentSnapshot();
  const originalBlock = original.find((block) => block.key === key)!;
  for (const value of [
    "",
    "  spaces\tand tabs\r\nnewlines\nremain  ",
    '<script>alert("literal text")</script><b>Unparsed & unchanged</b>',
  ]) {
    await assertSaved(await patch({ value }), value);
  }
  const saved = await db.contentBlock.findUniqueOrThrow({ where: { key } });
  assert.equal(saved.id, originalBlock.id);
  assert.equal(saved.label, originalBlock.label);
  assert.ok(saved.updatedAt.getTime() > originalBlock.updatedAt.getTime());
  assert.deepEqual(
    (await contentSnapshot()).filter((block) => block.key !== key),
    original.filter((block) => block.key !== key),
  );
});

test("all ASCII control characters except tab, LF and CR are rejected", async () => {
  const original = await contentSnapshot();
  const forbidden = Array.from({ length: 32 }, (_, index) => index)
    .filter((code) => ![9, 10, 13].includes(code))
    .concat(127);
  for (const code of forbidden) {
    await assertFailure(
      await patch({ value: `before${String.fromCharCode(code)}after` }),
      400,
      "VALIDATION",
    );
  }
  assert.deepEqual(await contentSnapshot(), original);
});

test("invalid UTF-8 and unpaired Unicode surrogates fail validation without writes", async () => {
  const original = await contentSnapshot();
  for (const value of ["\ud800", "\udc00", "before\ud800after"]) {
    await assertFailure(await patch({ value }), 400, "VALIDATION");
  }
  const bytes = Uint8Array.from([
    ...Buffer.from('{"value":"'),
    0xc3,
    0x28,
    ...Buffer.from('"}'),
  ]);
  await assertFailure(
    await request(`/api/blocks/${key}`, {
      method: "PATCH",
      headers: authenticatedHeaders(),
      body: bytes,
    }),
    400,
    "VALIDATION",
  );
  assert.deepEqual(await contentSnapshot(), original);
});

test("the text limit counts UTF-16 string units and accepts exactly 10000", async () => {
  for (const value of ["x".repeat(10_000), "\u{1f642}".repeat(5_000)]) {
    assert.equal(value.length, 10_000);
    await assertSaved(await patch({ value }), value);
  }
  const original = await contentSnapshot();
  for (const value of ["x".repeat(10_001), `${"\u{1f642}".repeat(5_000)}x`]) {
    await assertFailure(await patch({ value }), 400, "VALIDATION");
  }
  assert.deepEqual(await contentSnapshot(), original);
});

test("JSON request bodies are bounded by UTF-8 bytes independently of value length", async () => {
  const value = "exact request byte boundary";
  const json = JSON.stringify({ value });
  const atLimit = json + " ".repeat(bodyLimit - Buffer.byteLength(json));
  assert.equal(Buffer.byteLength(atLimit), bodyLimit);
  await assertSaved(
    await request(`/api/blocks/${key}`, {
      method: "PATCH",
      headers: authenticatedHeaders(),
      body: atLimit,
    }),
    value,
  );
  const original = await contentSnapshot();
  const unicodeJson = JSON.stringify({ value: "\u{1f642}".repeat(5_000) });
  const oversized =
    unicodeJson + " ".repeat(bodyLimit + 1 - Buffer.byteLength(unicodeJson));
  assert.ok(oversized.length < bodyLimit);
  assert.equal(Buffer.byteLength(oversized), bodyLimit + 1);
  await assertFailure(
    await request(`/api/blocks/${key}`, {
      method: "PATCH",
      headers: authenticatedHeaders(),
      body: oversized,
    }),
    400,
    "VALIDATION",
  );
  assert.deepEqual(await contentSnapshot(), original);
});

test("streamed requests cannot bypass the body bound with a false Content-Length", async () => {
  const original = await contentSnapshot();
  const json = JSON.stringify({ value: "streamed byte limit" });
  const bytes = Buffer.from(json + " ".repeat(bodyLimit + 1 - json.length));
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += 4096)
        controller.enqueue(bytes.subarray(offset, offset + 4096));
      controller.close();
    },
  });
  const init: RequestInit & { duplex: "half" } = {
    method: "PATCH",
    headers: { ...authenticatedHeaders(), "Content-Length": "1" },
    body: stream,
    duplex: "half",
  };
  const response = await directRoute.PATCH(
    new Request(`${origin}/api/blocks/${key}`, init),
    { params: Promise.resolve({ key }) },
  );
  await assertFailure(response, 400, "VALIDATION");
  assert.deepEqual(await contentSnapshot(), original);
});

test("unknown keys return404 instead of creating or modifying any content row", async () => {
  const original = await contentSnapshot();
  const missingKey = "home.text.999999";
  assert.equal(
    await db.contentBlock.findUnique({ where: { key: missingKey } }),
    null,
  );
  await assertFailure(
    await patch({ value: "must not be created" }, missingKey),
    404,
    "NOT_FOUND",
  );
  assert.deepEqual(await contentSnapshot(), original);
});

test("malformed keys return validation errors and a missing key segment is404", async () => {
  const original = await contentSnapshot();
  for (const malformed of [
    "home..text",
    "bad key",
    "home!text",
    "a".repeat(129),
  ]) {
    const body = await assertFailure(
      await patch({ value: "invalid key" }, malformed),
      400,
      "VALIDATION",
    );
    assert.ok(Array.isArray(body.error.fields?.key));
    assert.ok(body.error.fields.key.length > 0);
  }
  const missing = await request("/api/blocks", {
    headers: authenticatedHeaders(),
  });
  assert.equal(missing.status, 404);
  assert.deepEqual(await contentSnapshot(), original);
});

test("unsupported methods return405 without changing blocks", async () => {
  const original = await contentSnapshot();
  for (const method of ["GET", "HEAD", "POST", "PUT", "DELETE"]) {
    const response = await request(`/api/blocks/${key}`, {
      method,
      headers: authenticatedHeaders(),
      ...(["POST", "PUT", "DELETE"].includes(method)
        ? { body: JSON.stringify({ value: "unsupported method" }) }
        : {}),
    });
    assert.equal(response.status, 405, method);
  }
  const options = await request(`/api/blocks/${key}`, {
    method: "OPTIONS",
    headers: authenticatedHeaders(),
  });
  assert.equal(options.status, 204);
  assert.ok(options.headers.get("allow")?.split(/,\s*/).includes("PATCH"));
  assert.deepEqual(await contentSnapshot(), original);
});

test("rotated credentials and deleted administrators invalidate sessions at the handler", async () => {
  const original = await contentSnapshot();
  const oldCookie = cookie();
  try {
    await db.admin.update({
      where: { id: admin.id },
      data: { passwordHash: await hash("Changed content test password", 4) },
    });
    const rotated = await db.admin.findUniqueOrThrow({
      where: { id: admin.id },
    });
    for (const direct of [false, true]) {
      const incoming = new Request(`${origin}/api/blocks/${key}`, {
        method: "PATCH",
        headers: { ...authenticatedHeaders(), Cookie: oldCookie },
        body: "{invalid json",
      });
      const response = direct
        ? await directRoute.PATCH(incoming, {
            params: Promise.resolve({ key }),
          })
        : await request(`/api/blocks/${key}`, {
            method: "PATCH",
            headers: incoming.headers,
            body: "{invalid json",
          });
      await assertFailure(response, 401, "UNAUTHORIZED");
      if (direct) assert.equal(incoming.bodyUsed, false);
    }
    const deletedCookie = cookie(createSessionToken(rotated, secret));
    await db.admin.delete({ where: { id: admin.id } });
    for (const direct of [false, true]) {
      const incoming = new Request(`${origin}/api/blocks/${key}`, {
        method: "PATCH",
        headers: { ...authenticatedHeaders(), Cookie: deletedCookie },
        body: "{invalid json",
      });
      const response = direct
        ? await directRoute.PATCH(incoming, {
            params: Promise.resolve({ key }),
          })
        : await request(`/api/blocks/${key}`, {
            method: "PATCH",
            headers: incoming.headers,
            body: "{invalid json",
          });
      await assertFailure(response, 401, "UNAUTHORIZED");
      if (direct) assert.equal(incoming.bodyUsed, false);
    }
    assert.deepEqual(await contentSnapshot(), original);
  } finally {
    await db.admin.upsert({
      where: { id: admin.id },
      create: admin,
      update: { passwordHash: admin.passwordHash },
    });
  }
});
