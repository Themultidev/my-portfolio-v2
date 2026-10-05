import nextEnv from "@next/env";
import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./src/lib/database-url";

// Prisma commands use the same .env/.env.local precedence as the Next.js app.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
process.env.DATABASE_URL = getDatabaseUrl();

// Prisma 6's CLI drops the first engine stderr line when parsing errors.
// Keep the startup info line so a missing SQLite file is correctly recognized
// and created by migrate deploy, even when the host suppresses Rust logs.
process.env.RUST_LOG = "info";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
});
