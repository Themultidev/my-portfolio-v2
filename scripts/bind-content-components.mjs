import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseFragment, serializeOuter } from "parse5";
import { format } from "prettier";
import { correctAboutIcons } from "./lib/approved-icon-corrections.mjs";
import {
  attribute,
  elements,
  extractContent,
  sectionNames,
} from "./lib/static-seed.mjs";

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
}

function claim(block, value) {
  assert.equal(value, block.value, `Source changed for ${block.key}`);
  assert.ok(!used.has(block.key), `Duplicate binding for ${block.key}`);
  used.add(block.key);
}

function jsxAttributes(node, replacements = {}) {
  const attributes = node.attrs
    .map((attribute) => {
      const name = attributeName(attribute);
      const property = aliases[name] ?? name;
      if (Object.hasOwn(replacements, property))
        return `${property}={${replacements[property]}}`;
      // Keep the original HTML's unsupported legacy attribute verbatim.
      if (name === "stroke-lincap")
        return `{...${JSON.stringify({ [name]: attribute.value })}}`;
      if (booleans.has(name)) return `${property}={true}`;
      if (name === "style")
        return `style={${JSON.stringify(style(attribute.value))} as CSSProperties}`;
      if (name === "minlength" && !attribute.value) return "";
      return `${property}={${JSON.stringify(attribute.value)}}`;
    })
    .filter(Boolean);
  for (const [property, expression] of Object.entries(replacements)) {
    if (
      !node.attrs.some(
        (attribute) =>
          (aliases[attributeName(attribute)] ?? attributeName(attribute)) ===
          property,
      )
    )
      attributes.push(`${property}={${expression}}`);
  }
  return attributes.join(" ");
}

function render(node, section, path, overrides = new Map()) {
  const override = overrides.get(node);
  if (override) return override(path);
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
      .map((child, index) =>
        render(child, section, [...path, index], overrides),
      )
      .join("");
  if (
    ["mobileNavigation", "desktopNavigation"].includes(section) &&
    node.tagName === "a"
  ) {
    const href = attribute(node, "href") ?? "";
    const resume =
      elements(
        node,
        (child) =>
          child.tagName === "svg" &&
          attribute(child, "class")?.includes("si-glyph-document"),
      ).length > 0;
    const kind = resume
      ? "resume"
      : /(?:x|twitter)\.com\//.test(href)
        ? "x"
        : /linkedin\.com\//.test(href)
          ? "linkedin"
          : null;
    if (kind)
      return `<EditableSiteLink kind=${JSON.stringify(kind)} elementProps={${JSON.stringify(reactProps(node))}}>${children()}</EditableSiteLink>`;
  }
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

  const attributes = jsxAttributes(node);
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

async function generateProjectComponents(tree) {
  const paths = new Map();
  function collectPaths(node, path) {
    paths.set(node, path);
    for (const [index, child] of (node.childNodes ?? []).entries())
      collectPaths(child, [...path, index]);
  }
  collectPaths(tree, []);
  const cards = seed.projects.map((project) => {
    const card = elements(
      tree,
      (node) => attribute(node, "id") === project.sourceId,
    )[0];
    assert.ok(card, `Missing project template ${project.sourceId}`);
    return { project, card };
  });
  const grid = cards[0].card.parentNode;
  assert.ok(cards.every(({ card }) => card.parentNode === grid));
  const cardNodes = new Set(cards.map(({ card }) => card));
  const profiles = [];
  const cardSources = [];
  const spacingSources = [];

  function separators(container, members) {
    const before = [];
    let pending = "";
    for (const child of container.childNodes ?? []) {
      if (members.has(child)) {
        before.push(pending);
        pending = "";
      } else {
        pending += render(child, "projectWhitespace", []);
      }
    }
    return { before, after: pending };
  }

  function spacingSource(name, space) {
    return `function ${name}({ index }: { index: number }) {
      switch (index) {
        ${space.before.map((source, index) => `case ${index}: return <>${source}</>;`).join("\n")}
        default: return <>${space.before[0] ?? ""}</>;
      }
    }`;
  }

  for (const { project, card } of cards) {
    const overrides = new Map();
    const title = elements(card, (node) => node.tagName === "h1")[0]
      ?.childNodes[0];
    const description = elements(card, (node) => node.tagName === "p")[0]
      ?.childNodes[0];
    assert.equal(title?.nodeName, "#text");
    assert.equal(description?.nodeName, "#text");

    for (const node of elements(card, () => true)) {
      const entries =
        bindings.get(`projects:${paths.get(node).join(".")}`) ?? [];
      if (node.nodeName === "#text") {
        const block = entries.find((entry) => entry.source.kind === "text");
        if (!block) continue;
        overrides.set(node, () => {
          claim(block, node.value);
          const value =
            node === title
              ? "project.title"
              : node === description
                ? 'project.description ?? ""'
                : JSON.stringify(node.value);
          return `<ProjectCopy projectId={project.id} sourceId={${project.id}} field=${JSON.stringify(node === title ? "title" : node === description ? "description" : "copy")} blockKey=${JSON.stringify(block.key)}>{${value}}</ProjectCopy>`;
        });
      }
      if (node.tagName === "img") {
        const block = entries.find((entry) => entry.source.attribute === "alt");
        assert.ok(block, `Missing image description for ${project.sourceId}`);
        overrides.set(node, () => {
          claim(block, attribute(node, "alt"));
          return `<ProjectImage project={project} sourceId={${project.id}} blockKey=${JSON.stringify(block.key)} elementProps={${JSON.stringify(reactProps(node))}} />`;
        });
      }
    }

    const iconList = elements(
      card,
      (node) =>
        node.tagName === "ul" &&
        elements(node, (child) => child.tagName === "svg").length > 0,
    )[0];
    assert.ok(iconList);
    const iconItems = iconList.childNodes.filter(
      (node) => node.tagName === "li",
    );
    assert.equal(iconItems.length, project.stackNames.length);
    const space = separators(iconList, new Set(iconItems));
    const spacingName = `StackSpacing${project.id}`;
    spacingSources.push(spacingSource(spacingName, space));
    for (const [index, item] of iconItems.entries()) {
      const stack = seed.stacks.find(
        (entry) => entry.name === project.stackNames[index],
      );
      assert.ok(stack);
      profiles.push({
        profile: project.id,
        stack,
        name: `Profile${project.id}Stack${stack.id}`,
        source: render(item, "stackIcon", []),
      });
    }
    overrides.set(
      iconList,
      () =>
        `<ul ${jsxAttributes(iconList)} style={editable ? { flexWrap: "wrap", rowGap: "1.25rem", opacity: 1 } : undefined}>{editable ? <ProjectStackPicker projectId={project.id} title={project.title} stacks={project.stacks} profile={${project.id}}>{project.stacks.map((stack, index) => <Fragment key={stack.id}><${spacingName} index={index} /><StackChip stack={stack} profile={${project.id}} /></Fragment>)}</ProjectStackPicker> : project.stacks.map((stack, index) => <Fragment key={stack.id}><${spacingName} index={index} /><StackChip stack={stack} profile={${project.id}} /></Fragment>)}${space.after}</ul>`,
    );

    const visit = elements(card, (node) => node.tagName === "a")[0];
    assert.ok(visit);
    overrides.set(
      visit,
      (path) =>
        `<a ${jsxAttributes(visit, { href: "project.link ?? project.repoUrl ?? undefined" })}>${visit.childNodes.map((child, index) => render(child, "projects", [...path, index], overrides)).join("")}</a>`,
    );
    const cardAttributes = jsxAttributes(card, {
      id: `project.id === ${project.id} ? ${JSON.stringify(project.sourceId)} : \`project-\${project.id}\``,
    });
    cardSources.push(
      `function Card${project.id}({ project, editable }: { project: ProjectRecord; editable: boolean }) { return <div ${cardAttributes}>${card.childNodes.map((child, index) => render(child, "projects", [...paths.get(card), index], overrides)).join("")}{editable && <ProjectActions project={project} />}</div>; }`,
    );
  }

  const cardSource = `
    // Generated from the frozen static source; run node scripts/bind-content-components.mjs.
    import { Fragment } from "react";
    import type { ProjectRecord } from "../../lib/project-types";
    import { ProjectCopy, ProjectImage, ProjectActions } from "./ProjectFields";
    import StackChip from "./StackChip";
    import ProjectStackPicker from "./ProjectStackPicker";
    export default function ProjectCard({ project, editable = false }: { project: ProjectRecord; editable?: boolean }) {
      switch (project.id) {
        case 2: return <Card2 project={project} editable={editable} />;
        case 3: return <Card3 project={project} editable={editable} />;
        case 4: return <Card4 project={project} editable={editable} />;
        default: return <Card1 project={project} editable={editable} />;
      }
    }
    ${cardSources.join("\n")}
    ${spacingSources.join("\n")}
  `;

  const iconSources = seed.stacks.map((stack) => {
    const svg = parseFragment(
      readFileSync(resolve(root, `public${stack.svgPath}`), "utf8"),
    ).childNodes.find((node) => node.tagName === "svg");
    assert.ok(svg, `Missing bundled stack icon ${stack.svgPath}`);
    return `case ${JSON.stringify(stack.svgPath)}: return (${render(svg, "stackIcon", [])});`;
  });
  const chipSource = `
    // Generated from the frozen static source and bundled SVG catalog.
    import type { CSSProperties, HTMLAttributes } from "react";
    import type { ProjectStackRecord } from "../../lib/project-types";
    function StackIcon({ stack }: { stack: ProjectStackRecord }) {
      switch (stack.svgPath) {
        ${iconSources.join("\n")}
        default: return <img src={stack.svgPath} alt={stack.name} width="24" height="24" />;
      }
    }
    export default function StackChip({ stack, profile = 1, onRemove }: { stack: ProjectStackRecord; profile?: number; onRemove?: () => void }) {
      const interaction: HTMLAttributes<HTMLLIElement> = onRemove ? { role: "button", tabIndex: 0, title: \`Remove \${stack.name}\`, "aria-label": \`Remove \${stack.name}\`, onClick: onRemove, onKeyDown: (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRemove(); } } } : {};
      switch (\`\${profile}:\${stack.svgPath}\`) {
        ${profiles.map((entry) => `case ${JSON.stringify(`${entry.profile}:${entry.stack.svgPath}`)}: return <${entry.name} interaction={interaction} />;`).join("\n")}
      }
      return <li {...interaction} className="flex items-center justify-center border-2 border-gray-400">{"\\n            "}<StackIcon stack={stack} />{"\\n          "}</li>;
    }
    ${profiles.map((entry) => `function ${entry.name}({ interaction }: { interaction: HTMLAttributes<HTMLLIElement> }) { return (${entry.source.replace(/<li(?=[ >])/, "<li {...interaction}")}); }`).join("\n")}
  `;

  const gridSpace = separators(grid, cardNodes);
  const boardSource = `
    // Generated from the frozen static source; run node scripts/bind-content-components.mjs.
    "use client";
    import { Fragment, useState } from "react";
    import type { ProjectRecord } from "../../lib/project-types";
    import ProjectCard from "./ProjectCard";
    import { ProjectBoardContext } from "./ProjectBoardContext";
    import AddProjectTile from "./AddProjectTile";
    export default function ProjectBoard({ projects, editable = false }: { projects: ProjectRecord[]; editable?: boolean }) {
      // The shared board keeps the original public grid in both modes.
      const [records, setRecords] = useState(projects);
      const visibleProjects = (editable ? records : projects.filter((project) => project.published));
      const entries: (ProjectRecord | null)[] = editable ? [...visibleProjects, null] : visibleProjects;
      return <ProjectBoardContext.Provider value={{ records, setRecords }}><div ${jsxAttributes(grid)}>{entries.map((project, index) => <Fragment key={project?.id ?? "add"}><ProjectSpacing index={index} />{project ? <ProjectCard project={project} editable={editable} /> : <AddProjectTile />}</Fragment>)}${gridSpace.after}</div></ProjectBoardContext.Provider>;
    }
    ${spacingSource("ProjectSpacing", gridSpace)}
  `;
  for (const [name, source] of [
    ["ProjectCard", cardSource],
    ["StackChip", chipSource],
    ["ProjectBoard", boardSource],
  ])
    generated.push({
      file: resolve(root, `src/components/projects/${name}.tsx`),
      source: await format(source, { parser: "typescript" }),
    });
  return new Map([
    [
      grid,
      () =>
        "<ProjectBoard projects={editable ? projects : projects.filter((project) => project.published)} editable={editable} />",
    ],
  ]);
}

for (const { name, section, directory, tree } of components) {
  const isProjects = name === "Projects";
  const overrides = isProjects
    ? await generateProjectComponents(tree)
    : new Map();
  if (name === "About") correctAboutIcons(tree);
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
    hasStyles && !isProjects
      ? 'import type { CSSProperties } from "react";'
      : "",
    isProjects
      ? 'import type { ProjectRecord } from "../../lib/project-types";'
      : "",
    isProjects
      ? 'import { referenceProjects } from "../../lib/project-reference";'
      : "",
    isProjects ? 'import ProjectBoard from "../projects/ProjectBoard";' : "",
    'import EditableText from "../editor/EditableText";',
    ["mobileNavigation", "desktopNavigation"].includes(section)
      ? 'import EditableSiteLink from "../editor/EditableSiteLink";'
      : "",
    hasAttributes && !isProjects
      ? 'import EditableElement from "../editor/EditableElement";'
      : "",
    isProjects
      ? "export default function Projects({ projects = referenceProjects, editable = false }: { projects?: ProjectRecord[]; editable?: boolean } = {}) {"
      : `export default function ${name}() {`,
    `return (<>${tree.childNodes.map((node, index) => render(node, section, [index], overrides)).join("")}</>);`,
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
