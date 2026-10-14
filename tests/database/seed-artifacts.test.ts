import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";
import manifest from "../../prisma/seed-data.json";
import { extractSeedData } from "../../scripts/lib/static-seed.mjs";
import { correctedIcons } from "../../scripts/lib/approved-icon-corrections.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baseline = JSON.parse(
  readFileSync(resolve(root, "migration/static-baseline.json"), "utf8"),
);

test("seed manifest is a deterministic extraction of the frozen public pages", () => {
  const { data } = extractSeedData(baseline);
  assert.deepEqual(manifest, data);
  assert.equal(manifest.projects.length, 4);
  assert.equal(manifest.stacks.length, 20);
  assert.equal(
    new Set(manifest.content.map(({ key }) => key)).size,
    manifest.content.length,
  );
  assert.ok(
    manifest.content.some(({ source }) => source.page === "/overview.html"),
  );
  assert.equal(
    manifest.projects[1].link,
    null,
    "Do not invent the Portfolio card's missing href",
  );
  assert.equal(manifest.projects[2].link, "/overview.html");
});

test("bundled stack SVGs retain source artwork except the three owner-requested logo corrections", () => {
  const { icons } = extractSeedData(baseline);
  for (const stack of manifest.stacks) {
    const svg = readFileSync(resolve(root, `public${stack.svgPath}`), "utf8");
    if (!(stack.name in correctedIcons))
      assert.equal(
        svg.replaceAll("\r\n", "\n"),
        `${icons.get(stack.svgPath)}\n`,
        stack.name,
      );
    const element = parseFragment(svg)
      .childNodes[0] as DefaultTreeAdapterTypes.Element;
    assert.equal(element.tagName, "svg");
    const viewBox = element.attrs.find(({ name }) => name === "viewBox")?.value;
    assert.ok(viewBox, `${stack.name} needs its original viewBox`);
    const dimensions = viewBox.split(/\s+/).map(Number);
    assert.equal(dimensions.length, 4);
    assert.ok(dimensions[2] > 0 && dimensions[3] > 0);
  }
  // The owner explicitly corrected these original JavaScript placeholders.
  const artwork = (name: string) => {
    const stack = manifest.stacks.find((item) => item.name === name);
    assert.ok(stack);
    return readFileSync(resolve(root, `public${stack.svgPath}`), "utf8");
  };
  const corrected = [artwork("Python"), artwork("PHP"), artwork("React")];
  assert.equal(new Set(corrected).size, 3);
  for (const svg of corrected) {
    assert.notEqual(svg, artwork("JavaScript"));
    assert.ok(
      !svg.includes("#F7DF1E"),
      "Corrected logos must not contain the yellow JavaScript square",
    );
  }
  assert.ok(
    artwork("Python").includes("#3776AB") &&
      artwork("Python").includes("#FFD343"),
  );
  assert.ok(artwork("PHP").includes("#777BB4"));
  assert.ok(artwork("React").includes("#61DAFB"));
});

test("original project assets, features, and chip selections are retained", () => {
  for (const project of manifest.projects) {
    assert.ok(
      existsSync(resolve(root, `public${project.photoUrl}`)),
      project.photoUrl,
    );
    assert.ok(project.stackNames.length <= 5);
    assert.equal(new Set(project.stackNames).size, project.stackNames.length);
    for (const name of project.stackNames) {
      assert.ok(
        manifest.stacks.some((stack) => stack.name === name),
        name,
      );
    }
  }
  const values = new Set(manifest.content.map(({ value }) => value.trim()));
  for (const text of [
    "Core Feautures",
    "CRUD enabled",
    "Ai integration for booking and hairstyle suggestions",
    "Admin Dashboard",
    "User Authentication",
    "User Management",
    "Notification System",
    "Analytics",
    "SEO Optimized",
    "Responsive Design",
  ])
    assert.ok(values.has(text), `Missing original feature: ${text}`);
});
