import { after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { compare, getRounds, hash } from "bcryptjs";
import { parse, type DefaultTreeAdapterMap } from "parse5";
import manifest from "../../prisma/seed-data.json";
import { getAdminCredentials, seedPortfolio } from "../../prisma/seed-content";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const testParent = resolve(root, ".tmp");
mkdirSync(testParent, { recursive: true });
const directory = mkdtempSync(join(testParent, "portfolio-seed-"));
const clients = new Set<PrismaClient>();
const credentials = {
  ADMIN_EMAIL: "  SEED-ADMIN@EXAMPLE.INVALID  ",
  ADMIN_PASSWORD: "  keep these password spaces!  ",
};

function databaseUrl(name: string) {
  return `file:${join(directory, `${name}.db`).replaceAll("\\", "/")}`;
}

function createDatabase(name: string) {
  const url = databaseUrl(name);
  // Explicitly migrate a disposable file; never inherit the user's database URL.
  execFileSync(
    process.execPath,
    [resolve(root, "node_modules/prisma/build/index.js"), "migrate", "deploy"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    },
  );
  const database = new PrismaClient({
    datasources: { db: { url } },
  });
  clients.add(database);
  return database;
}

async function snapshot(database: PrismaClient) {
  const [admins, content, projects, stacks, memberships] = await Promise.all([
    database.admin.findMany({ orderBy: { id: "asc" } }),
    database.contentBlock.findMany({ orderBy: { key: "asc" } }),
    database.project.findMany({ orderBy: { id: "asc" } }),
    database.stack.findMany({ orderBy: { id: "asc" } }),
    database.projectStack.findMany({
      orderBy: [{ projectId: "asc" }, { stackId: "asc" }],
    }),
  ]);
  return { admins, content, projects, stacks, memberships };
}

after(async () => {
  await Promise.all([...clients].map((database) => database.$disconnect()));
  // Delete only the unique test directory verified to be inside this workspace.
  assert.equal(dirname(resolve(directory)), testParent);
  assert.ok(directory.startsWith(join(testParent, "portfolio-seed-")));
  rmSync(directory, { recursive: true, force: true });
});

test("admin credentials normalize email, preserve password spaces, and enforce bcrypt's byte limit", () => {
  assert.deepEqual(getAdminCredentials(credentials), {
    email: "seed-admin@example.invalid",
    password: credentials.ADMIN_PASSWORD,
  });
  const boundary = "😀".repeat(18);
  assert.equal(Buffer.byteLength(boundary, "utf8"), 72);
  assert.equal(
    getAdminCredentials({ ...credentials, ADMIN_PASSWORD: boundary }).password,
    boundary,
  );
  for (const password of ["a".repeat(11), "a".repeat(73), "😀".repeat(19)]) {
    assert.throws(() =>
      getAdminCredentials({ ...credentials, ADMIN_PASSWORD: password }),
    );
  }
  const invalidEmail = "private-invalid-email";
  const invalidPassword = "secret-short";
  assert.throws(
    () =>
      getAdminCredentials({
        ADMIN_EMAIL: invalidEmail,
        ADMIN_PASSWORD: invalidPassword,
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(!error.message.includes(invalidEmail));
      assert.ok(!error.message.includes(invalidPassword));
      return true;
    },
  );
});

type HtmlNode = DefaultTreeAdapterMap["node"];

function walk(node: HtmlNode): HtmlNode[] {
  return [node, ...("childNodes" in node ? node.childNodes.flatMap(walk) : [])];
}

// Compare the decoded copy independently of generator keys and source paths.
// Repeated strings remain repeated, and significant whitespace stays untouched.
function baselineCopy(node: HtmlNode): string[] {
  if (["svg", "script", "style"].includes(node.nodeName)) return [];
  const values: string[] = [];
  if ("value" in node && node.value.trim()) values.push(node.value);
  if ("attrs" in node) {
    for (const attribute of node.attrs) {
      if (
        ["placeholder", "alt", "title", "aria-label"].includes(
          attribute.name,
        ) &&
        attribute.value.trim()
      ) {
        values.push(attribute.value);
      }
    }
  }
  if ("childNodes" in node) {
    for (const child of node.childNodes) values.push(...baselineCopy(child));
  }
  return values;
}

test("the manifest includes every original body text and editable attribute with exact whitespace", () => {
  const baseline = JSON.parse(
    readFileSync(resolve(root, "migration/static-baseline.json"), "utf8"),
  ) as { pages: Record<string, string> };
  const expected = Object.values(baseline.pages).flatMap((html) => {
    const body = walk(parse(html)).find((node) => node.nodeName === "body");
    assert.ok(body);
    return baselineCopy(body);
  });
  assert.equal(manifest.version, 1);
  assert.equal(manifest.projects.length, 4);
  assert.equal(manifest.stacks.length, 20);
  assert.equal(
    new Set(manifest.content.map(({ key }) => key)).size,
    manifest.content.length,
  );
  assert.deepEqual(
    manifest.content.map(({ value }) => value).sort(),
    expected.sort(),
  );
});

test("seeding imports all manifested copy, projects, icons, and ordered memberships with a bcrypt admin", async () => {
  const database = createDatabase("initial");
  const counts = await seedPortfolio(database, credentials);
  assert.deepEqual(counts, {
    admins: 1,
    content: manifest.content.length,
    projects: manifest.projects.length,
    stacks: manifest.stacks.length,
  });
  const saved = await snapshot(database);
  const expectedContent = manifest.content
    .map(({ key, value, label }) => ({ key, value, label }))
    .sort((left, right) => left.key.localeCompare(right.key));
  assert.deepEqual(
    saved.content
      .map(({ key, value, label }) => ({ key, value, label }))
      .sort((left, right) => left.key.localeCompare(right.key)),
    expectedContent,
  );
  assert.deepEqual(
    saved.stacks,
    [...manifest.stacks].sort((left, right) => left.id - right.id),
  );

  const projects = await database.project.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: {
      stacks: {
        orderBy: [{ order: "asc" }, { stackId: "asc" }],
        include: { stack: true },
      },
    },
  });
  assert.equal(projects.length, manifest.projects.length);
  for (const [index, expected] of manifest.projects.entries()) {
    const actual = projects[index];
    assert.deepEqual(
      {
        id: actual.id,
        title: actual.title,
        description: actual.description,
        photoUrl: actual.photoUrl,
        link: actual.link,
        repoUrl: actual.repoUrl,
        order: actual.order,
        published: actual.published,
      },
      {
        id: expected.id,
        title: expected.title,
        description: expected.description,
        photoUrl: expected.photoUrl,
        link: expected.link,
        repoUrl: expected.repoUrl,
        order: expected.order,
        published: expected.published,
      },
    );
    assert.deepEqual(
      actual.stacks.map(({ stack }) => stack.name),
      expected.stackNames,
    );
    assert.deepEqual(
      actual.stacks.map(({ order }) => order),
      expected.stackNames.map((_, order) => order),
    );
    assert.ok(actual.stacks.length <= 5);
  }
  assert.equal(
    saved.memberships.length,
    manifest.projects.reduce(
      (total, project) => total + project.stackNames.length,
      0,
    ),
  );
  const [admin] = saved.admins;
  assert.equal(admin.email, "seed-admin@example.invalid");
  assert.equal(getRounds(admin.passwordHash), 12);
  assert.ok(await compare(credentials.ADMIN_PASSWORD, admin.passwordHash));
  assert.equal(
    await compare("An incorrect password", admin.passwordHash),
    false,
  );
  assert.equal(
    await compare(credentials.ADMIN_PASSWORD.trim(), admin.passwordHash),
    false,
  );

  const addedProject = await database.project.create({
    data: { title: "New project after the original cards" },
  });
  const addedStack = await database.stack.create({
    data: {
      name: "New stack after the original catalog",
      svgPath: "/uploads/new.svg",
    },
  });
  assert.ok(
    addedProject.id > Math.max(...manifest.projects.map(({ id }) => id)),
  );
  assert.ok(addedStack.id > Math.max(...manifest.stacks.map(({ id }) => id)));
});

test("rerunning seed preserves edited copy, renamed icons, project fields and chip order, and changed passwords", async () => {
  const database = createDatabase("rerun");
  await seedPortfolio(database, credentials);
  const firstStack = manifest.stacks[0];
  const lastStack = manifest.stacks[manifest.stacks.length - 1];
  const firstProject = manifest.projects[0];
  const changedPasswordHash = await hash("Edited password remains", 4);
  await database.contentBlock.update({
    where: { key: manifest.content[0].key },
    data: {
      value: "Edited\ncopy with trailing spaces  ",
      label: "Edited label",
    },
  });
  await database.stack.update({
    where: { id: firstStack.id },
    data: {
      name: "Renamed original stack",
      svgPath: "/uploads/edited-icon.svg",
      order: 91,
    },
  });
  await database.project.update({
    where: { id: firstProject.id },
    data: {
      title: "Edited project title",
      description: "Edited project description",
      photoUrl: "/uploads/edited-photo.png",
      link: "https://example.invalid/edited-project",
      repoUrl: "https://example.invalid/edited-repository",
      order: 42,
      published: false,
      stacks: {
        deleteMany: {},
        create: [
          { stackId: lastStack.id, order: 7 },
          { stackId: firstStack.id, order: 2 },
        ],
      },
    },
  });
  await database.admin.update({
    where: { email: "seed-admin@example.invalid" },
    data: { passwordHash: changedPasswordHash },
  });
  const before = await snapshot(database);
  const counts = await seedPortfolio(database, {
    ...credentials,
    ADMIN_PASSWORD: "A different environment password",
  });
  assert.deepEqual(await snapshot(database), before);
  assert.deepEqual(counts, {
    admins: before.admins.length,
    content: before.content.length,
    projects: before.projects.length,
    stacks: before.stacks.length,
  });
  assert.ok(
    await compare("Edited password remains", before.admins[0].passwordHash),
  );
});

test("invalid or missing credentials reject before any application rows are written", async () => {
  const database = createDatabase("invalid-credentials");
  const empty = await snapshot(database);
  const invalidEnvironments: Record<string, string | undefined>[] = [
    {},
    { ADMIN_EMAIL: credentials.ADMIN_EMAIL },
    { ADMIN_PASSWORD: credentials.ADMIN_PASSWORD },
    { ...credentials, ADMIN_EMAIL: "invalid-email" },
    { ...credentials, ADMIN_PASSWORD: "too-short" },
    { ...credentials, ADMIN_PASSWORD: "a".repeat(73) },
    { ...credentials, ADMIN_PASSWORD: "😀".repeat(19) },
  ];
  for (const environment of invalidEnvironments) {
    await assert.rejects(seedPortfolio(database, environment));
    assert.deepEqual(await snapshot(database), empty);
  }
});

test("a different existing admin rejects seeding without changing any rows", async () => {
  const database = createDatabase("different-admin");
  await database.admin.create({
    data: {
      email: "other-admin@example.invalid",
      passwordHash: "existing-hash-must-stay",
    },
  });
  const before = await snapshot(database);
  await assert.rejects(seedPortfolio(database, credentials), /admin/i);
  assert.deepEqual(await snapshot(database), before);
});

test("multiple existing admins reject seeding atomically even when one email matches", async () => {
  const database = createDatabase("multiple-admins");
  await database.admin.createMany({
    data: [
      {
        email: "seed-admin@example.invalid",
        passwordHash: "matching-admin-hash",
      },
      {
        email: "second-admin@example.invalid",
        passwordHash: "second-admin-hash",
      },
    ],
  });
  const before = await snapshot(database);
  await assert.rejects(seedPortfolio(database, credentials), /admin/i);
  assert.deepEqual(await snapshot(database), before);
});

test("a late catalog conflict rolls back the admin and copy already inserted by the seed", async () => {
  const database = createDatabase("late-conflict");
  await database.stack.create({
    data: {
      id: Math.max(...manifest.stacks.map(({ id }) => id)) + 1,
      name: manifest.stacks[0].name,
      svgPath: "/uploads/pre-existing-icon.svg",
      order: 99,
    },
  });
  const before = await snapshot(database);
  await assert.rejects(seedPortfolio(database, credentials), { code: "P2002" });
  assert.deepEqual(await snapshot(database), before);
});

test("Prisma db seed runs the configured entry point against an isolated database", async () => {
  const name = "seed-cli";
  const database = createDatabase(name);
  const password = "Valid CLI password with spaces";
  const pathKey =
    Object.keys(process.env).find((key) => key.toLowerCase() === "path") ??
    "PATH";
  const stdout = execFileSync(
    process.execPath,
    [resolve(root, "node_modules/prisma/build/index.js"), "db", "seed"],
    {
      cwd: root,
      env: {
        ...process.env,
        // Match npm's executable lookup without installing tsx globally.
        [pathKey]: `${resolve(root, "node_modules/.bin")}${delimiter}${process.env[pathKey] ?? ""}`,
        DATABASE_URL: databaseUrl(name),
        ADMIN_EMAIL: "  CLI-ADMIN@EXAMPLE.INVALID  ",
        ADMIN_PASSWORD: password,
      },
      encoding: "utf8",
      stdio: "pipe",
    },
  );
  assert.ok(
    stdout.includes(
      `Seed ready: ${manifest.content.length} text blocks, ${manifest.projects.length} projects, ${manifest.stacks.length} stacks, 1 admin.`,
    ),
  );
  const saved = await snapshot(database);
  assert.equal(saved.admins.length, 1);
  assert.equal(saved.content.length, manifest.content.length);
  assert.equal(saved.projects.length, manifest.projects.length);
  assert.equal(saved.stacks.length, manifest.stacks.length);
  assert.equal(saved.admins[0].email, "cli-admin@example.invalid");
  assert.equal(getRounds(saved.admins[0].passwordHash), 12);
  assert.ok(await compare(password, saved.admins[0].passwordHash));
  assert.equal(
    await compare("Incorrect CLI password", saved.admins[0].passwordHash),
    false,
  );
});
