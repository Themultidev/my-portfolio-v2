import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseFragment } from "parse5";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { correctedAboutHtml } from "./lib/approved-icon-corrections.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(
  readFileSync(resolve(root, "migration/static-baseline.json"), "utf8"),
);

function normalizeStyle(value) {
  return value
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => rule.replace(/\s*:\s*/, ":"))
    .sort()
    .join(";");
}

function tree(node) {
  if (node.nodeName === "#comment") return null;
  if (node.nodeName === "#text")
    return node.value.trim() ? { text: node.value } : null;
  // React emits resource hints for the same existing images.
  if (
    node.tagName === "link" &&
    node.attrs.some((attr) => attr.name === "rel" && attr.value === "preload")
  )
    return null;
  const attrs = (node.attrs ?? [])
    .filter((attr) => !(attr.name === "minlength" && !attr.value))
    .map((attr) => [
      attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name,
      attr.name === "style" ? normalizeStyle(attr.value) : attr.value,
    ])
    .sort(([a], [b]) => a.localeCompare(b));
  return {
    tag: node.tagName ?? node.nodeName,
    attrs,
    children: (node.childNodes ?? []).map(tree).filter(Boolean),
  };
}

const names = [
  "MobileNavigation",
  "DesktopNavigation",
  "Home",
  "About",
  "Projects",
  "Contact",
  "Footer",
];
const original = baseline.pages["/"];
const originalSections = [
  ...original.matchAll(/<(header|section)\b[^>]*>[\s\S]*?<\/\1>/g),
].map((match) => match[0]);
assert.equal(originalSections.length, names.length);
const comparisons = names.map((name, index) => ({
  name,
  directory: "portfolio",
  original: originalSections[index],
}));
comparisons.push({
  name: "OverviewContent",
  directory: "overview",
  original: baseline.pages["/overview.html"].match(
    /<body[^>]*>([\s\S]*?)<\/body>/,
  )[1],
});
const redesigned = new Set([
  "MobileNavigation",
  "DesktopNavigation",
  "Home",
  "About",
]);
console.log(
  "Navigation, hero and About have an approved redesign; original parity applies only to retained sections.",
);
for (const { name, directory, original: reference } of comparisons.filter(
  (c) => !redesigned.has(c.name),
)) {
  // Import the actual graph through tsx, including the editor's client leaves.
  // Without a provider those leaves render the original fallback markup.
  const file = resolve(root, `src/components/${directory}/${name}.tsx`);
  const { default: Component } = await import(pathToFileURL(file).href);
  const rendered = renderToStaticMarkup(createElement(Component));
  assert.deepEqual(
    tree(parseFragment(rendered)),
    tree(
      parseFragment(
        name === "About" ? correctedAboutHtml(reference) : reference,
      ),
    ),
    `${name} differs from the static baseline`,
  );
  console.log(
    `${name}: structure, classes, attributes, and visible text match${name === "About" ? " (with the three requested logo corrections)" : ""}.`,
  );
}
assert.equal(
  readFileSync(resolve(root, "src/style.css"), "utf8"),
  baseline.stylesheet,
  "Global CSS changed",
);
console.log("Global CSS matches the baseline byte for byte.");
