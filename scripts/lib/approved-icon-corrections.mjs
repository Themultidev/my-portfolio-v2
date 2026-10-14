import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseFragment, serializeOuter } from "parse5";
import { elements, textContent } from "./static-seed.mjs";

// Owner-requested exception to frozen visual parity: correct only these three
// mislabeled JavaScript logos, retaining their 20px boxes and all surrounding DOM.
export const correctedIcons = { Python: "python", PHP: "php", React: "react" };
export function iconCorrections() {
  return Object.fromEntries(
    Object.entries(correctedIcons).map(([name, slug]) => [
      name,
      readFileSync(
        new URL(`../../public/stacks/${slug}.svg`, import.meta.url),
        "utf8",
      ),
    ]),
  );
}
export function correctAboutIcons(tree) {
  for (const [name, svg] of Object.entries(iconCorrections())) {
    const label = elements(
      tree,
      (node) => node.tagName === "span" && textContent(node).trim() === name,
    )[0];
    assert.ok(label, `Missing About label ${name}`);
    const old = label.parentNode.childNodes.find(
      (node) => node.tagName === "svg",
    );
    assert.ok(old, `Missing About icon ${name}`);
    const replacement = parseFragment(svg).childNodes.find(
      (node) => node.tagName === "svg",
    );
    replacement.parentNode = old.parentNode;
    old.parentNode.childNodes[old.parentNode.childNodes.indexOf(old)] =
      replacement;
  }
  return tree;
}
export function correctedAboutHtml(html) {
  return correctAboutIcons(parseFragment(html))
    .childNodes.map(serializeOuter)
    .join("");
}
