import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "../src/lib/database-url";
import { seedPortfolio, getAdminCredentials } from "./seed-content";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const database = new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});
try {
  getAdminCredentials(process.env);
  const counts = await database.$transaction([
    database.admin.count(),
    database.contentBlock.count(),
    database.stack.count(),
    database.project.count(),
    database.projectStack.count(),
  ]);
  if (counts.every((count) => count === 0)) {
    await seedPortfolio(database, process.env);
    console.log("Empty database initialized with the portfolio and admin.");
  } else if (counts[0] > 0 && counts[1] > 0)
    console.log(
      "Existing portfolio database retained; no seed rows were restored or overwritten.",
    );
  else
    throw new Error(
      "Database initialization is incomplete. Import your existing data or resolve the partial initialization before deploying.",
    );
} catch (error) {
  console.error(
    error instanceof Error &&
      error.message.startsWith("Database initialization")
      ? error.message
      : "Database bootstrap failed. Check migrations, connectivity and admin environment settings.",
  );
  process.exitCode = 1;
} finally {
  await database.$disconnect();
}
