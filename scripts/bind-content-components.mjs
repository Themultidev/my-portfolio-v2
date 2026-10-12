import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseFragment, serializeOuter } from "parse5";
import { format } from "prettier";
import { elements, extractContent, sectionNames } from "./lib/static-seed.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(
  readFileSync(resolve(root, "migration/static-baseline.json"), "utf8"),
);
const seed = JSON.parse(
  readFileSync(resolve(root, "prisma/seed-data.json"), "utf8"),
);

// The frozen source defines both the stable keys and whitespace-inclusive paths.
// Reject stale seed metadata before replacing any generated component.
assert.deepEqual(seed.content, extractContent(baseline));
const bindings = new Map();
const used = new Set();
for (const block of seed.content) {
  const address = `${block.source.section}:${block.source.path.join(".")}`;
  const entries = bindings.get(address) ?? [];
  entries.push(block);
  bindings.set(address, entries);
}

const aliases = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
  "xmlns:xlink": "xmlnsXlink",
  "xlink:href": "xlinkHref",
  "xml:space": "xmlSpace",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "fill-opacity": "fillOpacity",
  "stroke-opacity": "strokeOpacity",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "enable-background": "enableBackground",
  allowfullscreen: "allowFullScreen",
  referrerpolicy: "referrerPolicy",
  minlength: "minLength",
  maxlength: "maxLength",
  charset: "charSet",
  crossorigin: "crossOrigin",
  autocomplete: "autoComplete",
};
const booleans = new Set([
  "required",
  "disabled",
  "checked",
  "multiple",
  "selected",
  "allowfullscreen",
]);

function style(value) {
  return Object.fromEntries(
    value
      .split(";")
      .filter((rule) => rule.includes(":"))
      .map((rule) => {
        const separator = rule.indexOf(":");
        const name = rule
          .slice(0, separator)
          .trim()
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return [name, rule.slice(separator + 1).trim()];
      }),
  );
}

function attributeName(attribute) {
  return attribute.prefix
    ? `${attribute.prefix}:${attribute.name}`
    : attribute.name;
}

function reactProps(node) {
  return Object.fromEntries(
    node.attrs
      .filter(
        (attribute) =>
          !(attribute.name === "minlength" && !attribute.value),
      )
      .map((attribute) => {
        const name = attributeName(attribute);
        return [
          aliases[name] ?? name,
          booleans.has(name)
            ? true
            : name === "style"
              ? style(attribute.value)
              : attribute.value,
        ];
      }),
  );
}

function claim(block, value) {
  assert.equal(value, block.value, `Source changed for ${block.key}`);
  assert.ok(!used.has(block.key), `Duplicate binding for ${block.key}`);
  used.add(block.key);
}

function render(node, section, path) {
  const entries = bindings.get(`${section}:${path.join(".")}`) ?? [];
  if (node.nodeName === "#text") {
    const block = entries.find((entry) => entry.source.kind === "text");
    if (!block) return `{${JSON.stringify(node.value)}}`;
    claim(block, node.value);
    return `<EditableText blockKey=${JSON.stringify(block.key)}>{${JSON.stringify(node.value)}}</EditableText>`;
  }
  if (!node.tagName) return "";

  if (node.tagName === "pre") {
    assert.equal(node.childNodes?.length, 1);
    const text = node.childNodes[0];
    assert.equal(text.nodeName, "#text");
    const block = bindings
      .get(`${section}:${[...path, 0].join(".")}`)
      ?.find((entry) => entry.source.kind === "text");
    assert.ok(block, "Every pre must have a single bound text value");
    claim(block, text.value);
    // A native pre with a direct string child lets React preserve leading LFs
    // during both server rendering and hydration without an extra React child.
    return `<EditableText as="pre" blockKey=${JSON.stringify(block.key)} elementProps={${JSON.stringify(reactProps(node))}}>{${JSON.stringify(text.value)}}</EditableText>`;
  }

  const attributeBlocks = entries.filter(
    (entry) => entry.source.kind === "attribute",
  );
  const children = () =>
    (node.childNodes ?? [])
      .map((child, index) => render(child, section, [...path, index]))
      .join("");
  if (attributeBlocks.length) {
    assert.ok(["img", "input", "textarea"].includes(node.tagName));
    const blockKeys = {};
    for (const block of attributeBlocks) {
      const attribute = node.attrs.find(
        (item) => item.name === block.source.attribute,
      );
      claim(block, attribute?.value);
      blockKeys[block.source.attribute] = block.key;
    }
    const props = Object.fromEntries(
      node.attrs
        .filter(
          (attribute) => !(attribute.name === "minlength" && !attribute.value),
        )
        .map((attribute) => {
          const name = attributeName(attribute);
          return [
            aliases[name] ?? name,
            booleans.has(name)
              ? true
              : name === "style"
                ? style(attribute.value)
                : attribute.value,
          ];
        }),
    );
    const open = `<EditableElement tag=${JSON.stringify(node.tagName)} blockKeys={${JSON.stringify(blockKeys)}} elementProps={${JSON.stringify(props)}}`;
    return node.childNodes?.length
      ? `${open}>${children()}</EditableElement>`
      : `${open} />`;
  }

  const attributes = node.attrs
    .map((attribute) => {
      const name = attributeName(attribute);
      const property = aliases[name] ?? name;
      // Keep the original HTML's unsupported legacy attribute verbatim.
      if (name === "stroke-lincap")
        return `{...${JSON.stringify({ [name]: attribute.value })}}`;
      if (booleans.has(name)) return `${property}={true}`;
      if (name === "style")
        return `style={${JSON.stringify(style(attribute.value))} as CSSProperties}`;
      if (name === "minlength" && !attribute.value) return "";
      return `${property}={${JSON.stringify(attribute.value)}}`;
    })
    .filter(Boolean)
    .join(" ");
  const open = `<${node.tagName}${attributes ? " " + attributes : ""}`;
  if (node.tagName === "script" || node.tagName === "style") {
    const content = (node.childNodes ?? [])
      .map((child) => child.value ?? "")
      .join("");
    return `${open} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(content)} }} />`;
  }
  return node.childNodes?.length
    ? `${open}>${children()}</${node.tagName}>`
    : `${open} />`;
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
const fragments = [
  ...baseline.pages["/"].matchAll(/<(header|section)\b[^>]*>[\s\S]*?<\/\1>/g),
];
assert.equal(fragments.length, names.length);
const components = fragments.map((match, index) => ({
  name: names[index],
  section: sectionNames[index],
  directory: "portfolio",
  tree: parseFragment(match[0]),
}));
const overviewBody = elements(
  parse(baseline.pages["/overview.html"]),
  (node) => node.tagName === "body",
)[0];
assert.ok(overviewBody);
components.push({
  name: "OverviewContent",
  section: "overview",
  directory: "overview",
  tree: parseFragment(overviewBody.childNodes.map(serializeOuter).join("")),
});

const generated = [];
for (const { name, section, directory, tree } of components) {
  const hasStyles =
    elements(tree, (node) =>
      node.attrs?.some((attribute) => attribute.name === "style"),
    ).length > 0;
  const hasAttributes = seed.content.some(
    (block) =>
      block.source.section === section && block.source.kind === "attribute",
  );
  const source = [
    "// Generated from the frozen static source; run node scripts/bind-content-components.mjs.",
    hasStyles ? 'import type { CSSProperties } from "react";' : "",
    'import EditableText from "../editor/EditableText";',
    hasAttributes
      ? 'import EditableElement from "../editor/EditableElement";'
      : "",
    `export default function ${name}() {`,
    `return (<>${tree.childNodes.map((node, index) => render(node, section, [index])).join("")}</>);`,
    "}",
  ]
    .filter(Boolean)
    .join("\n");
  generated.push({
    file: resolve(root, `src/components/${directory}/${name}.tsx`),
    source: await format(source, { parser: "typescript" }),
  });
}

assert.deepEqual(
  [...used].sort(),
  seed.content.map((block) => block.key).sort(),
  "Every seeded content block must have exactly one binding",
);
// All path, value, JSX parsing, and coverage checks finish before any write.
for (const { file, source } of generated) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, source);
}
console.log(
  `Bound ${used.size} content blocks across ${generated.length} components.`,
);
