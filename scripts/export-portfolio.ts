import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDatabaseUrl, isPostgresUrl } from "../src/lib/database-url";
import { parseSnapshot, uploadReferences } from "../prisma/portfolio-snapshot";
nextEnv.loadEnvConfig(process.cwd(), true);
const url = getDatabaseUrl();
if (isPostgresUrl(url))
  throw new Error(
    "Export must use your local SQLite database before switching environment settings.",
  );
const db = new PrismaClient({ datasources: { db: { url } } });
try {
  const [admins, blocks, stacks, projects, memberships] = await db.$transaction(
    [
      db.admin.findMany(),
      db.contentBlock.findMany(),
      db.stack.findMany(),
      db.project.findMany(),
      db.projectStack.findMany(),
    ],
  );
  const rows = { admins, blocks, stacks, projects, memberships };
  const files = [];
  for (const path of uploadReferences(rows)) {
    if (
      !/^\/uploads\/(?:(?:stacks|projects)\/[a-f0-9-]{36}\.png|resumes\/[a-f0-9-]{36}\.pdf)$/.test(
        path,
      )
    )
      throw new Error("Invalid local upload reference.");
    files.push({
      path,
      base64: (await readFile(resolve("public", path.slice(1)))).toString(
        "base64",
      ),
    });
  }
  const data = parseSnapshot(
    JSON.parse(JSON.stringify({ version: 1, ...rows, files })),
  );
  await mkdir(resolve(".tmp"), { recursive: true });
  const destination = resolve(".tmp", `portfolio-export-${Date.now()}.json`);
  await writeFile(destination, JSON.stringify(data), {
    flag: "wx",
    mode: 0o600,
  });
  console.log(
    `Private backup saved to ${destination}. It includes the password hash; keep it out of Git and shared folders.`,
  );
} catch {
  console.error(
    "Export failed. Check your local database, account and referenced upload files. No database changes were made.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
