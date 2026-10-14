import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { seedPortfolio } from "../../prisma/seed-content";

// Deploy only the historical schema, seed it, then deploy the actual new SQL.
// This verifies the real Prisma migration ledger instead of invoking the UPDATE
// statements directly or changing the user's database or migration directory.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-project-migration-"));
const migrations = join(directory, "migrations");
const initial = "20261005000000_init";
const promotion = "20261012090000_promote_project_content";
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const credentials = {
  ADMIN_EMAIL: "migration-test@example.invalid",
  ADMIN_PASSWORD: "Isolated migration test password",
};
const config = join(directory, "prisma.config.ts");
const schema = join(directory, "schema.prisma");

function deploy() {
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/prisma/build/index.js"),
      "migrate",
      "deploy",
      "--config",
      config,
    ],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl, RUST_LOG: "info" },
      stdio: "pipe",
      timeout: 120_000,
    },
  );
}

before(
  async () => {
    mkdirSync(join(migrations, initial), { recursive: true });
    copyFileSync(resolve(root, "prisma/schema.prisma"), schema);
    copyFileSync(
      resolve(root, "prisma/migrations/migration_lock.toml"),
      join(migrations, "migration_lock.toml"),
    );
    copyFileSync(
      resolve(root, "prisma/migrations", initial, "migration.sql"),
      join(migrations, initial, "migration.sql"),
    );
    writeFileSync(
      config,
      `import { defineConfig } from "prisma/config";\nexport default defineConfig({ schema: ${JSON.stringify(schema)}, migrations: { path: ${JSON.stringify(migrations)} } });\n`,
    );
    deploy();
    await seedPortfolio(db, credentials);
  },
  { timeout: 180_000 },
);

after(async () => {
  await db.$disconnect();
  assert.equal(dirname(resolve(directory)), parent);
  assert.ok(directory.startsWith(join(parent, "portfolio-project-migration-")));
  rmSync(directory, { recursive: true, force: true });
});

test("upgrading a seeded old database preserves all original text edits, empty values and missing blocks", async () => {
  const changes = [
    ["projects.text.003", "  Legacy title <b>& text</b>  "],
    ["projects.text.004", "Legacy description\nwith trailing spaces  "],
    ["projects.text.007", ""],
    ["projects.text.008", "\n\tExact whitespace  "],
    ["projects.text.011", "Third legacy title"],
    ["projects.text.015", "Fourth legacy title"],
    ["projects.text.016", "Fourth legacy description"],
  ] as const;
  for (const [key, value] of changes)
    await db.contentBlock.update({ where: { key }, data: { value } });
  const missingDescription = await db.project.findUniqueOrThrow({
    where: { id: 3 },
  });
  await db.contentBlock.delete({ where: { key: "projects.text.012" } });
  const untouched = await db.project.create({
    data: {
      title: "New historical project",
      description: "Keep unrelated data",
      published: false,
    },
  });
  const memberships = await db.projectStack.findMany({
    orderBy: [{ projectId: "asc" }, { order: "asc" }],
  });
  mkdirSync(join(migrations, promotion));
  copyFileSync(
    resolve(root, "prisma/migrations", promotion, "migration.sql"),
    join(migrations, promotion, "migration.sql"),
  );
  deploy();
  for (const [id, title, description] of [
    [1, changes[0][1], changes[1][1]],
    [2, changes[2][1], changes[3][1]],
    [3, changes[4][1], missingDescription.description],
    [4, changes[5][1], changes[6][1]],
  ] as const) {
    const row = await db.project.findUniqueOrThrow({ where: { id } });
    assert.equal(row.title, title);
    assert.equal(row.description, description);
  }
  assert.deepEqual(
    await db.project.findUniqueOrThrow({ where: { id: untouched.id } }),
    untouched,
  );
  assert.deepEqual(
    await db.projectStack.findMany({
      orderBy: [{ projectId: "asc" }, { order: "asc" }],
    }),
    memberships,
  );
  const ledger = await db.$queryRaw<
    Array<{ migration_name: string; finished_at: unknown }>
  >`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name`;
  assert.deepEqual(
    ledger.map(({ migration_name }) => migration_name),
    [initial, promotion],
  );
  assert.ok(ledger.every(({ finished_at }) => finished_at !== null));
});

test("repeated deploy and seed cannot overwrite later project edits with legacy content", async () => {
  await db.project.update({
    where: { id: 1 },
    data: {
      title: "Later canonical project title",
      description: "Later canonical description",
      order: 42,
      published: false,
    },
  });
  await db.contentBlock.update({
    where: { key: "projects.text.003" },
    data: { value: "Stale legacy title must not replace canonical data" },
  });
  await db.contentBlock.update({
    where: { key: "projects.text.004" },
    data: { value: "Stale legacy description" },
  });
  const row = await db.project.findUniqueOrThrow({ where: { id: 1 } });
  deploy();
  await seedPortfolio(db, credentials);
  assert.deepEqual(
    await db.project.findUniqueOrThrow({ where: { id: 1 } }),
    row,
  );
  const ledger = await db.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT COUNT(*) AS count FROM _prisma_migrations WHERE migration_name = ${promotion}`;
  assert.equal(Number(ledger[0].count), 1);
});
