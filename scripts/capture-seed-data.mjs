import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSeedData } from "./lib/static-seed.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(
  readFileSync(resolve(root, "migration/static-baseline.json"), "utf8"),
);
const { data, icons } = extractSeedData(baseline);
mkdirSync(resolve(root, "public/stacks"), { recursive: true });
for (const [path, svg] of icons)
  writeFileSync(resolve(root, `public${path}`), `${svg}\n`);
writeFileSync(
  resolve(root, "prisma/seed-data.json"),
  `${JSON.stringify(data, null, 2)}\n`,
);
console.log(
  `Captured ${data.content.length} text blocks, ${data.projects.length} projects, and ${data.stacks.length} original stack icons.`,
);
console.log(
  JSON.stringify(
    data.projects.map(({ sourceId, title, stackNames }) => ({
      sourceId,
      title,
      stackNames,
    })),
    null,
    2,
  ),
);
console.log(`Stack catalog: ${data.stacks.map(({ name }) => name).join(", ")}`);
