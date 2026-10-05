import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "../src/lib/database-url";
import { getAdminCredentials, seedPortfolio } from "./seed-content";

async function main() {
  nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  // Fail before connecting if credentials or the connection are invalid.
  getAdminCredentials(process.env);
  const database = new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
  });
  try {
    const counts = await seedPortfolio(database, process.env);
    console.log(
      `Seed ready: ${counts.content} text blocks, ${counts.projects} projects, ${counts.stacks} stacks, ${counts.admins} admin.`,
    );
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Prisma diagnostics may include connection details. Keep CLI failures safe.
  const safe =
    error instanceof Error &&
    (error.message.startsWith("Invalid ADMIN_") ||
      error.message.startsWith("Seed requires") ||
      error.message.startsWith("DATABASE_URL"));
  console.error(
    safe
      ? error.message
      : "Seeding failed. Check the database URL, apply migrations, and resolve any conflicting seed IDs. No partial seed was saved.",
  );
  process.exitCode = 1;
});
