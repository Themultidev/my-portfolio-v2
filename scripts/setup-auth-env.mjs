import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(root, true);
const filename = existsSync(resolve(root, ".env.local"))
  ? ".env.local"
  : ".env";
const target = resolve(root, filename);
let contents = existsSync(target) ? readFileSync(target, "utf8") : "";
let changed = false;

function addMissing(name, value) {
  if (process.env[name]?.trim()) return;
  const pattern = new RegExp(`^(?:export\\s+)?${name}\\s*=.*$`, "m");
  const line = `${name}="${value}"`;
  contents = pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${contents}${contents.endsWith("\n") || !contents ? "" : "\n"}${line}\n`;
  changed = true;
}

if (
  process.env.SESSION_SECRET &&
  Buffer.byteLength(process.env.SESSION_SECRET, "utf8") < 32
) {
  throw new Error(
    "Existing SESSION_SECRET is too short. Replace it privately with a random secret of at least 32 bytes.",
  );
}
addMissing("SESSION_SECRET", randomBytes(48).toString("base64url"));
addMissing("APP_ORIGIN", "http://localhost:3000");
addMissing("DATABASE_URL", "file:./dev.db");
if (changed) writeFileSync(target, contents);
console.log(
  changed
    ? `Authentication settings added to ${filename}; existing values were preserved.`
    : "Authentication settings are already configured.",
);
console.log(
  "Restart Next.js after changing environment settings. Set APP_ORIGIN to your exact HTTPS origin when deploying.",
);
