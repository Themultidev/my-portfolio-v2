import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { seedPortfolio } from "../../prisma/seed-content";

// Public parity always renders the frozen seed, including after real admin edits.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const parent = resolve(root, ".tmp");
mkdirSync(parent, { recursive: true });
const directory = mkdtempSync(join(parent, "portfolio-parity-"));
const databaseUrl = `file:${join(directory, "test.db").replaceAll("\\", "/")}`;
const credentials = {
  ADMIN_EMAIL: "parity-only@example.invalid",
  ADMIN_PASSWORD: "parity-only-password",
};
const database = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});
let child: ChildProcess | undefined;
let cleaned = false;

async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  await database.$disconnect();
  if (
    dirname(resolve(directory)) !== parent ||
    !directory.startsWith(join(parent, "portfolio-parity-"))
  )
    throw new Error("Unexpected parity fixture directory.");
  rmSync(directory, { recursive: true, force: true });
}

async function main() {
  execFileSync(
    process.execPath,
    [resolve(root, "node_modules/prisma/build/index.js"), "migrate", "deploy"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "pipe",
      timeout: 30_000,
    },
  );
  await seedPortfolio(database, credentials);
  await database.$disconnect();
  child = spawn(
    process.execPath,
    [
      resolve(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3100",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        ...credentials,
        NODE_ENV: "production",
        DATABASE_URL: databaseUrl,
        SESSION_SECRET: "parity-only-session-secret-at-least-32-bytes",
        APP_ORIGIN: "http://127.0.0.1:3100",
      },
      stdio: "inherit",
    },
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => child?.kill());
  child.once("error", () => {
    console.error("Public parity server could not start.");
    void cleanup().then(() => {
      process.exitCode = 1;
    });
  });
  child.once("exit", (code) => {
    void cleanup().then(() => {
      process.exitCode = code ?? 0;
    });
  });
}

main().catch(async () => {
  await cleanup();
  console.error("Public parity database setup failed.");
  process.exitCode = 1;
});
