import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { put, del } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { getDatabaseUrl, isPostgresUrl } from "../src/lib/database-url";
import { parseSnapshot } from "../prisma/portfolio-snapshot";
import { resetPostgresSequences } from "../prisma/reset-postgres-sequences";
nextEnv.loadEnvConfig(process.cwd(), true);
const url = getDatabaseUrl();
if (
  !isPostgresUrl(url) ||
  !process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
  !process.argv[2]
)
  throw new Error(
    "Import requires PostgreSQL, BLOB_READ_WRITE_TOKEN and a private backup path.",
  );
const db = new PrismaClient({ datasources: { db: { url } } });
const uploaded: string[] = [];
try {
  const data = parseSnapshot(
    JSON.parse(await readFile(process.argv[2], "utf8")),
  );
  const counts = await db.$transaction([
    db.admin.count(),
    db.contentBlock.count(),
    db.stack.count(),
    db.project.count(),
    db.projectStack.count(),
  ]);
  if (counts.some((count) => count > 0))
    throw new Error("Target must be empty.");
  for (const file of data.files) {
    const blob = await put(
      file.path.slice(1),
      Buffer.from(file.base64, "base64"),
      {
        access: "public",
        contentType: file.path.endsWith(".pdf")
          ? "application/pdf"
          : "image/png",
        addRandomSuffix: false,
        allowOverwrite: false,
      },
    );
    uploaded.push(blob.url);
  }
  await db.$transaction(
    async (tx) => {
      const current = await Promise.all([
        tx.admin.count(),
        tx.contentBlock.count(),
        tx.stack.count(),
        tx.project.count(),
        tx.projectStack.count(),
      ]);
      if (current.some((count) => count > 0))
        throw new Error("Target must be empty.");
      await tx.admin.createMany({ data: data.admins });
      await tx.contentBlock.createMany({ data: data.blocks });
      await tx.stack.createMany({ data: data.stacks });
      await tx.project.createMany({ data: data.projects });
      await tx.projectStack.createMany({ data: data.memberships });
      await resetPostgresSequences(tx);
    },
    { isolationLevel: "Serializable", timeout: 60_000 },
  );
  console.log(
    "Portfolio imported with existing account, content, project/stack IDs, relationships and uploaded files.",
  );
} catch {
  if (uploaded.length) {
    try {
      await del(uploaded);
    } catch {
      console.error(
        "Cleanup failed. Remove this import's newly created files from Blob storage before retrying.",
      );
    }
  }
  console.error(
    "Import failed. Verify the private backup, empty migrated target, generated PostgreSQL client, connectivity and Blob settings. Existing database rows were not overwritten.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
