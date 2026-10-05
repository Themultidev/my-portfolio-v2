import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, type PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "../../src/lib/database-url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const testParent = resolve(root, ".tmp");
mkdirSync(testParent, { recursive: true });
const directory = mkdtempSync(join(testParent, "portfolio-db-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
let db: PrismaClient | undefined;

function client() {
  assert.ok(db, "Database setup did not finish");
  return db;
}

function prismaError(code: string) {
  return (error: unknown) =>
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code;
}

before(async () => {
  // Apply the committed migration to an isolated database, never the user's DB.
  execFileSync(
    process.execPath,
    [resolve(root, "node_modules/prisma/build/index.js"), "migrate", "deploy"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "pipe",
    },
  );
  process.env.DATABASE_URL = databaseUrl;
  ({ db } = await import("../../src/lib/db"));
});

after(async () => {
  await db?.$disconnect();
  // Delete only the unique test directory verified to be within our workspace.
  assert.equal(dirname(resolve(directory)), testParent);
  assert.ok(directory.startsWith(join(testParent, "portfolio-db-")));
  rmSync(directory, { recursive: true, force: true });
});

test("database configuration uses a local development default and requires a production URL", () => {
  assert.equal(getDatabaseUrl({ NODE_ENV: "development" }), "file:./dev.db");
  assert.equal(
    getDatabaseUrl({ NODE_ENV: "production", DATABASE_URL: databaseUrl }),
    databaseUrl,
  );
  assert.throws(
    () => getDatabaseUrl({ NODE_ENV: "production" }),
    /DATABASE_URL must be configured/,
  );
  assert.throws(
    () =>
      getDatabaseUrl({
        NODE_ENV: "development",
        DATABASE_URL: "https://example.com",
      }),
    /SQLite file/,
  );
});

test("the committed migration matches the Prisma schema", () => {
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/prisma/build/index.js"),
      "migrate",
      "diff",
      "--from-url",
      databaseUrl,
      "--to-schema-datamodel",
      resolve(root, "prisma/schema.prisma"),
      "--exit-code",
    ],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "pipe",
    },
  );
});

test("admin emails, content keys, and stack names are unique", async () => {
  const database = client();
  const admin = {
    email: "schema-test@example.invalid",
    passwordHash: "test-only-placeholder",
  };
  await database.admin.create({ data: admin });
  await assert.rejects(
    database.admin.create({ data: admin }),
    prismaError("P2002"),
  );
  const block = {
    key: "test.hero",
    value: "Original\nplain text",
    label: "Test hero",
  };
  await database.contentBlock.create({ data: block });
  await assert.rejects(
    database.contentBlock.create({ data: block }),
    prismaError("P2002"),
  );
  const stack = { name: "Unique test stack", svgPath: "/stacks/test.svg" };
  await database.stack.create({ data: stack });
  await assert.rejects(
    database.stack.create({ data: stack }),
    prismaError("P2002"),
  );
  assert.equal(
    (
      await database.contentBlock.findUniqueOrThrow({
        where: { key: block.key },
      })
    ).value,
    block.value,
  );
});

test("project memberships reject duplicate stacks and orphan foreign keys", async () => {
  const database = client();
  const project = await database.project.create({
    data: { title: "Membership test" },
  });
  const stack = await database.stack.create({
    data: { name: "Membership stack", svgPath: "/stacks/test.svg" },
  });
  const membership = { projectId: project.id, stackId: stack.id, order: 0 };
  await database.projectStack.create({ data: membership });
  await assert.rejects(
    database.projectStack.create({ data: membership }),
    prismaError("P2002"),
  );
  await assert.rejects(
    database.projectStack.create({ data: { ...membership, projectId: -1 } }),
    prismaError("P2003"),
  );
  await assert.rejects(
    database.projectStack.create({ data: { ...membership, stackId: -1 } }),
    prismaError("P2003"),
  );
});

test("stack deletion is blocked while referenced; project deletion cascades only its memberships", async () => {
  const database = client();
  const stack = await database.stack.create({
    data: { name: "Shared stack", svgPath: "/stacks/test.svg" },
  });
  const first = await database.project.create({
    data: {
      title: "Delete this project",
      stacks: { create: { stackId: stack.id } },
    },
  });
  const second = await database.project.create({
    data: {
      title: "Keep this project",
      stacks: { create: { stackId: stack.id } },
    },
  });
  await assert.rejects(
    database.stack.delete({ where: { id: stack.id } }),
    prismaError("P2003"),
  );
  assert.equal(
    await database.projectStack.count({ where: { stackId: stack.id } }),
    2,
  );
  await database.project.delete({ where: { id: first.id } });
  assert.equal(
    await database.projectStack.count({ where: { projectId: first.id } }),
    0,
  );
  assert.equal(
    await database.projectStack.count({ where: { projectId: second.id } }),
    1,
  );
  assert.ok(await database.stack.findUnique({ where: { id: stack.id } }));
});

test("saved chip order survives shuffled insertion and a new client connection", async () => {
  const database = client();
  const project = await database.project.create({
    data: { title: "Ordered project" },
  });
  for (const order of [2, 0, 1]) {
    const stack = await database.stack.create({
      data: { name: `Ordered stack ${order}`, svgPath: "/stacks/test.svg" },
    });
    await database.projectStack.create({
      data: { projectId: project.id, stackId: stack.id, order },
    });
  }
  const { PrismaClient } = await import("@prisma/client");
  const reopened = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  try {
    const saved = await reopened.project.findUniqueOrThrow({
      where: { id: project.id },
      include: {
        stacks: {
          orderBy: [{ order: "asc" }, { stackId: "asc" }],
          include: { stack: true },
        },
      },
    });
    assert.deepEqual(
      saved.stacks.map((membership) => membership.stack.name),
      ["Ordered stack 0", "Ordered stack 1", "Ordered stack 2"],
    );
  } finally {
    await reopened.$disconnect();
  }
});
