import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFragment } from "parse5";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "src/components/portfolio");
mkdirSync(target, { recursive: true });

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

function render(node) {
  if (node.nodeName === "#text") return `{${JSON.stringify(node.value)}}`;
  if (!node.tagName) return "";
  const attributes = node.attrs
    .map((attribute) => {
      const name = attribute.prefix
        ? `${attribute.prefix}:${attribute.name}`
        : attribute.name;
      const property = aliases[name] ?? name;
      // Retain legacy attributes that aren't part of React's typed DOM props.
      if (
        name === "stroke-lincap" ||
        (node.tagName === "textarea" && name === "type")
      ) {
        return `{...${JSON.stringify({ [name]: attribute.value })}}`;
      }
      if (booleans.has(name)) return `${property}={true}`;
      if (name === "style")
        return `style={${JSON.stringify(style(attribute.value))} as CSSProperties}`;
      // The original textarea uses an empty minlength, equivalent to no minimum.
      if (name === "minlength" && !attribute.value) return "";
      return `${property}={${JSON.stringify(attribute.value)}}`;
    })
    .filter(Boolean)
    .join(" ");
  const open = `<${node.tagName}${attributes ? " " + attributes : ""}`;
  if (node.tagName === "script" || node.tagName === "style") {
    const content = node.childNodes.map((child) => child.value ?? "").join("");
    return `${open} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(content)} }} />`;
  }
  if (!node.childNodes?.length) return `${open} />`;
  return `${open}>${node.childNodes.map(render).join("")}</${node.tagName}>`;
}

function component(name, html) {
  const tree = parseFragment(html);
  writeFileSync(
    resolve(target, `${name}.tsx`),
    `// Ported from the static HTML. Preserve classes and markup during migration.\n${html.includes("style=") ? "import type { CSSProperties } from 'react';\n" : ""}export default function ${name}() {\n  return (<>${tree.childNodes.map(render).join("")}</>);\n}\n`,
  );
}

for (const [file, name] of Object.entries({
  "mobile-navigation": "MobileNavigation",
  "desktop-navigation": "DesktopNavigation",
  home: "Home",
  about: "About",
  projects: "Projects",
  contact: "Contact",
  footer: "Footer",
}))
  component(
    name,
    readFileSync(resolve(root, `src/components/${file}.html`), "utf8"),
  );

const index = readFileSync(resolve(root, "index.html"), "utf8");
const head = index
  .match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<link href="src\/style.css" rel="stylesheet">/, "");
component("PortfolioHead", head);
console.log(
  "Ported seven sections and the original head without rewriting class strings.",
);
