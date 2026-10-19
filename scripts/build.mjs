import nextEnv from "@next/env";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
nextEnv.loadEnvConfig(process.cwd(), false);
const cli = (file, args) =>
  execFileSync(process.execPath, [resolve(file), ...args], {
    stdio: "inherit",
    env: process.env,
  });
try {
  if (process.env.VERCEL === "1") {
    if (!/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? ""))
      throw new Error(
        "Vercel requires a hosted PostgreSQL DATABASE_URL. Connect the database in project settings.",
      );
    if (!process.env.BLOB_READ_WRITE_TOKEN?.trim())
      throw new Error(
        "Vercel requires BLOB_READ_WRITE_TOKEN. Connect a public Blob store in project settings.",
      );
  }
  cli("node_modules/prisma/build/index.js", ["generate"]);
  if (process.env.VERCEL === "1") {
    cli("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
    cli("node_modules/tsx/dist/cli.mjs", ["prisma/bootstrap.ts"]);
  }
  cli("node_modules/next/dist/bin/next", ["build"]);
} catch (error) {
  console.error(
    error instanceof Error && error.message.startsWith("Vercel requires")
      ? error.message
      : "Build failed. Check the command diagnostics above.",
  );
  process.exitCode = 1;
}
