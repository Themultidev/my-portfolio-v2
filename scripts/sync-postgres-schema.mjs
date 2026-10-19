import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const source = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8",
);
const postgres = source
  .replace('provider = "sqlite"', 'provider = "postgresql"')
  .replace(
    'url      = env("DATABASE_URL")',
    'url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
  );
mkdirSync(new URL("../prisma/postgres/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../prisma/postgres/schema.prisma", import.meta.url),
  "// Models are shared with SQLite; regenerate with node scripts/sync-postgres-schema.mjs.\n" +
    postgres,
);
