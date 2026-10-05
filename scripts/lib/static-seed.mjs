import assert from "node:assert/strict";
import { parse, parseFragment, serializeOuter } from "parse5";

export const sectionNames = [
  "mobileNavigation",
  "desktopNavigation",
  "hero",
  "about",
  "projects",
  "contact",
  "footer",
];

export function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

export function elements(node, predicate) {
  const result = [];
  function visit(current) {
    if (predicate(current)) result.push(current);
    for (const child of current.childNodes ?? []) visit(child);
  }
  visit(node);
  return result;
}

export function textContent(node) {
  if (node.nodeName === "#text") return node.value;
  if (["svg", "script", "style"].includes(node.tagName)) return "";
  return (node.childNodes ?? []).map(textContent).join("");
}

// Paths and keys refer to the frozen migration source, not mutable HTML files.
// Keep whitespace: mixed inline text must join exactly as it did in the source.
export function extractContent(baseline) {
  const blocks = [];
  function collect(root, page, section) {
    let sequence = 0;
    function visit(node, path, parentTag) {
      if (["svg", "script", "style"].includes(node.tagName)) return;
      if (node.nodeName === "#text" && node.value.trim()) {
        blocks.push({
          key: `${section}.text.${String(++sequence).padStart(3, "0")}`,
          value: node.value,
          label: `${section}: ${parentTag} — ${node.value.trim().replace(/\s+/g, " ").slice(0, 70)}`,
          source: { page, section, path, kind: "text" },
        });
      }
      for (const name of ["placeholder", "alt", "title", "aria-label"]) {
        const value = attribute(node, name);
        if (value?.trim()) {
          blocks.push({
            key: `${section}.${name}.${String(++sequence).padStart(3, "0")}`,
            value,
            label: `${section}: ${node.tagName} ${name}`,
            source: { page, section, path, kind: "attribute", attribute: name },
          });
        }
      }
      for (const [index, child] of (node.childNodes ?? []).entries()) {
        visit(child, [...path, index], node.tagName ?? parentTag);
      }
    }
    visit(root, [], "body");
  }
  const sections = [
    ...baseline.pages["/"].matchAll(/<(header|section)\b[^>]*>[\s\S]*?<\/\1>/g),
  ];
  assert.equal(sections.length, sectionNames.length);
  sections.forEach((match, index) =>
    collect(parseFragment(match[0]), "/", sectionNames[index]),
  );
  const body = elements(
    parse(baseline.pages["/overview.html"]),
    (node) => node.tagName === "body",
  )[0];
  assert.ok(body);
  // Match the fragment used by OverviewContent, rather than include its body tag.
  collect(
    parseFragment((body.childNodes ?? []).map(serializeOuter).join("")),
    "/overview.html",
    "overview",
  );
  assert.equal(new Set(blocks.map((block) => block.key)).size, blocks.length);
  return blocks;
}

const technologyNames = {
  HTML: "HTML",
  CSS: "CSS",
  file_type_html: "HTML",
  file_type_css: "CSS",
  Javascript: "JavaScript",
  JavaScript: "JavaScript",
  javascript: "JavaScript",
  googlesheets: "Google Sheets",
  "App Script": "Apps Script",
  file_type_tailwind: "Tailwind CSS",
  "Tailwind CSS": "Tailwind CSS",
  "Express Js": "Express.js",
  "Node Js": "Node.js",
};

function projectTechnology(svg, cardId, index) {
  const title = elements(svg, (node) => node.tagName === "title")[0];
  const original = title ? textContent(title).trim() : "";
  if (technologyNames[original]) return technologyNames[original];
  const untitled = {
    boxFour: ["Next.js", "Tailwind CSS", "Node.js", "MongoDB"],
  };
  const inferred = untitled[cardId]?.[index];
  assert.ok(inferred, `Unmapped technology ${cardId}[${index}]: ${original}`);
  return inferred;
}

export function extractSeedData(baseline) {
  const document = parse(baseline.pages["/"]);
  const catalog = new Map();
  const icons = new Map();
  function addStack(name, svg) {
    if (catalog.has(name)) return;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "");
    const svgPath = `/stacks/${slug}.svg`;
    catalog.set(name, {
      id: catalog.size + 1,
      name,
      svgPath,
      order: catalog.size,
    });
    // Export existing artwork verbatim; do not replace or correct source icons.
    icons.set(svgPath, serializeOuter(svg));
  }
  const projects = ["boxOne", "boxTwo", "boxThree", "boxFour"].map(
    (sourceId, order) => {
      const card = elements(
        document,
        (node) => attribute(node, "id") === sourceId,
      )[0];
      assert.ok(card, `Missing ${sourceId}`);
      const heading = elements(card, (node) => node.tagName === "h1")[0];
      const description = elements(card, (node) => node.tagName === "p")[0];
      const image = elements(card, (node) => node.tagName === "img")[0];
      const anchor = elements(card, (node) => node.tagName === "a")[0];
      const iconList = elements(
        card,
        (node) =>
          node.tagName === "ul" &&
          elements(node, (child) => child.tagName === "svg").length > 0,
      )[0];
      assert.ok(
        heading && description && image && anchor && iconList,
        `Incomplete ${sourceId}`,
      );
      const stackNames = elements(
        iconList,
        (node) => node.tagName === "svg",
      ).map((svg, index) => {
        const name = projectTechnology(svg, sourceId, index);
        addStack(name, svg);
        return name;
      });
      assert.ok(stackNames.length <= 5);
      return {
        id: order + 1,
        sourceId,
        title: textContent(heading),
        description: textContent(description),
        photoUrl: attribute(image, "src"),
        link: attribute(anchor, "href") ?? null,
        repoUrl: null,
        order,
        published: true,
        stackNames,
      };
    },
  );
  const about = elements(
    document,
    (node) => attribute(node, "id") === "about",
  )[0];
  // About's visible labels identify otherwise ambiguous SVGs (some source art
  // differs from the named technology). Preserve those mismatches as-is.
  for (const svg of elements(about, (node) => node.tagName === "svg")) {
    const item = svg.parentNode;
    const label = textContent(item).trim().replace(/\s+/g, " ");
    const aliases = {
      Javascript: "JavaScript",
      NextJs: "Next.js",
      NodeJs: "Node.js",
      Tailwind: "Tailwind CSS",
      TailwindCSS: "Tailwind CSS",
      Github: "GitHub",
    };
    if (label) addStack(aliases[label] ?? label, svg);
  }
  return {
    data: {
      version: 1,
      content: extractContent(baseline),
      projects,
      stacks: [...catalog.values()],
    },
    icons,
  };
}
