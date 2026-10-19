import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  getDatabaseUrl,
  getDirectDatabaseUrl,
} from "../../src/lib/database-url";
import { blobStorageEnabled } from "../../src/lib/storage-config";
import { validStagingPath, MAX_UPLOAD_BYTES } from "../../src/lib/upload-kinds";
import { parseSnapshot } from "../../prisma/portfolio-snapshot";
import {
  writeStoredUpload,
  storedUploadExists,
  blobUploadUrl,
  deleteStoredUpload,
} from "../../src/lib/upload-storage";
import { readStagingFile } from "../../src/lib/blob-staging";
import { storeResume } from "../../src/lib/resume-upload";

test("Vercel requires hosted database and storage; direct URL falls back to database URL", () => {
  const pooled =
    "postgresql://user:password@pool.example.invalid/portfolio?sslmode=require";
  assert.equal(getDatabaseUrl({ VERCEL: "1", DATABASE_URL: pooled }), pooled);
  assert.equal(getDirectDatabaseUrl({ DATABASE_URL: pooled }), pooled);
  assert.equal(
    getDirectDatabaseUrl({
      DATABASE_URL: pooled,
      DIRECT_URL: pooled.replace("pool.", "direct."),
    }),
    pooled.replace("pool.", "direct."),
  );
  assert.throws(
    () => getDatabaseUrl({ VERCEL: "1", DATABASE_URL: "file:./dev.db" }),
    /hosted PostgreSQL/,
  );
  assert.throws(
    () => getDatabaseUrl({ DATABASE_URL: "postgresql://host" }),
    /valid PostgreSQL/,
  );
  assert.throws(
    () => blobStorageEnabled({ VERCEL: "1" }),
    /BLOB_READ_WRITE_TOKEN/,
  );
  assert.equal(blobStorageEnabled({}), false);
  assert.equal(
    blobStorageEnabled({ BLOB_READ_WRITE_TOKEN: "test-only" }),
    true,
  );
});

test("Prisma Postgres default-database TCP URLs are accepted without enabling Accelerate URLs", () => {
  const pooled =
    "postgres://test:test@pooled.db.prisma.io:5432/?sslmode=require";
  const direct = "postgres://test:test@db.prisma.io:5432/?sslmode=require";
  const environment = { VERCEL: "1", DATABASE_URL: pooled, DIRECT_URL: direct };
  assert.equal(getDatabaseUrl(environment), pooled);
  assert.equal(getDirectDatabaseUrl(environment), direct);
  assert.throws(
    () =>
      getDatabaseUrl({
        DATABASE_URL:
          "prisma+postgres://accelerate.prisma-data.net/?api_key=test",
      }),
    /PostgreSQL database/,
  );
});

test("PostgreSQL schema shares all SQLite models and migration uses native PostgreSQL types", () => {
  const sqlite = readFileSync(resolve("prisma/schema.prisma"), "utf8");
  const postgres = readFileSync(
    resolve("prisma/postgres/schema.prisma"),
    "utf8",
  );
  assert.equal(
    postgres.slice(postgres.indexOf("model Admin")),
    sqlite.slice(sqlite.indexOf("model Admin")),
  );
  const sql = readFileSync(
    resolve("prisma/postgres/migrations/20261014000000_initial/migration.sql"),
    "utf8",
  );
  const generated = execFileSync(
    process.execPath,
    [
      resolve("node_modules/prisma/build/index.js"),
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      "prisma/postgres/schema.prisma",
      "--script",
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        DIRECT_URL: "postgresql://test:test@localhost:5432/test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const history = readdirSync(resolve("prisma/postgres/migrations"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) =>
      readFileSync(
        resolve("prisma/postgres/migrations", entry.name, "migration.sql"),
        "utf8",
      ),
    )
    .join("\n");
  const tables = (text: string) =>
    [...text.matchAll(/CREATE TABLE "([^"]+)"/g)]
      .map((match) => match[1])
      .sort();
  assert.deepEqual(tables(history), tables(generated));
  assert.match(history, /ALTER TABLE "Project" ADD COLUMN "countryCode" TEXT/);
  assert.match(history, /ALTER TABLE "Project" ADD COLUMN "regionCode" TEXT/);
  assert.match(sql, /SERIAL/);
  assert.match(sql, /TIMESTAMP\(3\)/);
});

test("deployment bootstrap initializes once and preserves deliberate deletion and edited text", async () => {
  const parent = resolve(".tmp");
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(join(parent, "deployment-bootstrap-"));
  const url = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
  const env = {
    ...process.env,
    VERCEL: "0",
    DATABASE_URL: url,
    ADMIN_EMAIL: "deploy-test@example.invalid",
    ADMIN_PASSWORD: "Deployment test only password",
  };
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    execFileSync(
      process.execPath,
      [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      { env, stdio: "pipe" },
    );
    const bootstrap = () =>
      execFileSync(
        process.execPath,
        [resolve("node_modules/tsx/dist/cli.mjs"), "prisma/bootstrap.ts"],
        { env, stdio: "pipe" },
      );
    bootstrap();
    assert.equal(await db.project.count(), 4);
    await db.project.delete({ where: { id: 4 } });
    const block = await db.contentBlock.findFirstOrThrow();
    await db.contentBlock.update({
      where: { id: block.id },
      data: { value: "My edited text" },
    });
    bootstrap();
    assert.equal(await db.project.count(), 3);
    assert.equal(
      (await db.contentBlock.findUniqueOrThrow({ where: { id: block.id } }))
        .value,
      "My edited text",
    );
    const exported = execFileSync(
      process.execPath,
      [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/export-portfolio.ts"],
      {
        env: { ...env, BLOB_READ_WRITE_TOKEN: "" },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const backup = exported.match(/Private backup saved to (.+?\.json)\./)?.[1];
    assert.ok(backup);
    assert.equal(dirname(resolve(backup)), parent);
    assert.match(backup, /portfolio-export-\d+\.json$/);
    try {
      const saved = parseSnapshot(JSON.parse(readFileSync(backup, "utf8")));
      assert.equal(saved.projects.length, 3);
      assert.equal(
        saved.blocks.find((row) => row.id === block.id)?.value,
        "My edited text",
      );
      assert.deepEqual(
        saved.projects.map((row) => row.id),
        [1, 2, 3],
      );
      assert.equal(saved.admins[0].email, env.ADMIN_EMAIL);
    } finally {
      rmSync(backup);
    }
  } finally {
    await db.$disconnect();
    assert.equal(dirname(directory), parent);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("private snapshot validates dates, hash and complete file references", () => {
  const path = "/uploads/resumes/00000000-0000-0000-0000-000000000000.pdf";
  const raw = {
    version: 1,
    admins: [
      {
        id: 1,
        email: "test@example.invalid",
        passwordHash: "$2b$12$" + "a".repeat(53),
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    blocks: [
      {
        id: 1,
        key: "site.resume.url",
        value: path,
        label: "Resume",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    stacks: [],
    projects: [],
    memberships: [],
    files: [
      { path, base64: Buffer.from("%PDF-1.4\n%%EOF").toString("base64") },
    ],
  };
  assert.ok(parseSnapshot(raw).admins[0].createdAt instanceof Date);
  assert.throws(() => parseSnapshot({ ...raw, files: [] }), /references/);
  assert.throws(() =>
    parseSnapshot({
      ...raw,
      files: [{ ...raw.files[0], path: "/uploads/../../.env" }],
    }),
  );
  assert.throws(
    () =>
      parseSnapshot({
        ...raw,
        files: [
          {
            ...raw.files[0],
            base64: Buffer.from("<html>bad</html>").toString("base64"),
          },
        ],
      }),
    /format/,
  );
});

test("Blob storage preserves logical paths, rejects untrusted redirects and restricts staging owners", async (context) => {
  const previous = {
    token: process.env.BLOB_READ_WRITE_TOKEN,
    api: process.env.VERCEL_BLOB_API_URL,
  };
  const path = "/uploads/projects/00000000-0000-0000-0000-000000000000.png";
  let badHost = false;
  let stagedPdf: Buffer | undefined;
  const calls: {
    method: string;
    path: string;
    overwrite: string | string[] | undefined;
  }[] = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://localhost");
    calls.push({
      method: req.method!,
      path:
        url.searchParams.get("pathname") ??
        url.searchParams.get("url") ??
        url.pathname,
      overwrite: req.headers["x-allow-overwrite"],
    });
    for await (const chunk of req) void chunk;
    res.setHeader("content-type", "application/json");
    const pathname =
      url.searchParams.get("pathname") ?? url.searchParams.get("url");
    res.end(
      JSON.stringify(
        pathname
          ? {
              pathname,
              url: `${badHost ? "https://evil.invalid" : "https://test.public.blob.vercel-storage.com"}/${pathname}`,
              size:
                pathname.startsWith("portfolio-staging/") && stagedPdf
                  ? stagedPdf.length
                  : 10,
              contentType:
                pathname.startsWith("portfolio-staging/") && stagedPdf
                  ? "application/octet-stream"
                  : "image/png",
              uploadedAt: "2026-01-01T00:00:00Z",
            }
          : {},
      ),
    );
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_testonly";
  process.env.VERCEL_BLOB_API_URL = `http://127.0.0.1:${address.port}`;
  try {
    await writeStoredUpload(path, Buffer.from("test bytes"), "image/png");
    await storedUploadExists(path);
    assert.equal(
      await blobUploadUrl(path),
      `https://test.public.blob.vercel-storage.com${path}`,
    );
    badHost = true;
    await assert.rejects(blobUploadUrl(path), /Unexpected Blob host/);
    await deleteStoredUpload(path);
    assert.ok(
      calls.some(
        (call) =>
          call.method === "PUT" &&
          call.path === path.slice(1) &&
          call.overwrite === "0",
      ),
    );
    assert.ok(calls.some((call) => call.path === "/delete"));
    await assert.rejects(
      blobUploadUrl("/uploads/../../.env"),
      /Invalid uploaded/,
    );
    const staged =
      "portfolio-staging/1/project/00000000-0000-0000-0000-000000000000.bin";
    assert.equal(validStagingPath(staged, 1, "project"), true);
    assert.equal(validStagingPath(staged, 2, "project"), false);
    assert.equal(validStagingPath(staged, 1, "resume"), false);
    const count = calls.length;
    await assert.rejects(
      readStagingFile(staged, 2, "project"),
      /Upload this file again/,
    );
    await assert.rejects(
      readStagingFile(staged, 1, "project"),
      /Invalid staged upload/,
    );
    assert.equal(calls.length, count + 1);
    assert.equal(MAX_UPLOAD_BYTES, 5 * 1024 * 1024);
    badHost = false;
    const { GET } =
      await import("../../src/app/uploads/[kind]/[filename]/route");
    const redirect = await GET(
      new Request("https://portfolio.invalid" + path),
      {
        params: Promise.resolve({
          kind: "projects",
          filename: path.split("/").at(-1)!,
        }),
      },
    );
    assert.equal(redirect.status, 307);
    assert.equal(
      redirect.headers.get("location"),
      `https://test.public.blob.vercel-storage.com${path}`,
    );
    stagedPdf = Buffer.alloc(Math.ceil(4.7 * 1024 * 1024), 32);
    stagedPdf.write("%PDF-1.4\n");
    stagedPdf.write("%%EOF", stagedPdf.length - 5);
    const download = context.mock.method(
      globalThis,
      "fetch",
      async () => new Response(new Uint8Array(stagedPdf!)),
    );
    const stagedResume = staged.replace("/project/", "/resume/");
    const file = await readStagingFile(stagedResume, 1, "resume");
    assert.equal(file.size, stagedPdf.length);
    const pdfUrl = await storeResume(file);
    assert.match(pdfUrl, /^\/uploads\/resumes\/[a-f0-9-]{36}\.pdf$/);
    await deleteStoredUpload(pdfUrl);
    download.mock.mockImplementation(async () => new Response("short body"));
    await assert.rejects(
      readStagingFile(stagedResume, 1, "resume"),
      /Incomplete staged upload/,
    );
    stagedPdf = Buffer.alloc(MAX_UPLOAD_BYTES + 1);
    await assert.rejects(
      readStagingFile(stagedResume, 1, "resume"),
      /Invalid staged upload/,
    );
    download.mock.restore();
  } finally {
    for (const [key, value] of [
      ["BLOB_READ_WRITE_TOKEN", previous.token],
      ["VERCEL_BLOB_API_URL", previous.api],
    ]) {
      if (value === undefined) delete process.env[key!];
      else process.env[key!] = value;
    }
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
});
