import "server-only";
import { randomUUID } from "node:crypto";
import {
  parseFragment,
  serializeOuter,
  type DefaultTreeAdapterTypes,
} from "parse5";
import sharp from "sharp";
import { ApiError } from "./api-response";
import { writeStoredUpload } from "./upload-storage";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const svgTags = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "use",
  "title",
  "desc",
]);
const svgAttributes = new Set([
  "id",
  "viewBox",
  "preserveAspectRatio",
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "transform",
  "gradientTransform",
  "gradientUnits",
  "offset",
  "clipPathUnits",
  "maskUnits",
  "maskContentUnits",
  "fill",
  "stroke",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "fill-rule",
  "clip-rule",
  "clip-path",
  "mask",
  "stop-color",
  "stop-opacity",
]);
function invalidImage(message: string): never {
  throw new ApiError(400, "VALIDATION", message, { file: [message] });
}
function safeSvg(input: Buffer): Buffer {
  if (input.length > 256 * 1024)
    invalidImage(
      "SVG icons must be at most 256 KiB. Use a PNG for a larger icon.",
    );
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(input);
  } catch {
    return invalidImage("Use a valid UTF-8 SVG or raster image.");
  }
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source))
    invalidImage("SVG external declarations are not supported.");
  const fragment = parseFragment(source);
  const elements = fragment.childNodes.filter(
    (node) =>
      node.nodeName !== "#comment" &&
      !(node.nodeName === "#text" && "value" in node && !node.value.trim()),
  );
  const root = elements[0] as DefaultTreeAdapterTypes.Element;
  if (elements.length !== 1 || root?.tagName !== "svg")
    invalidImage("Choose an SVG, PNG, JPEG, WebP, GIF, or AVIF image.");
  const viewBox = root.attrs.find(({ name }) => name === "viewBox")?.value;
  const bounds = viewBox
    ? viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number)
    : [
        0,
        0,
        Number.parseFloat(
          root.attrs.find(({ name }) => name === "width")?.value ?? "32",
        ),
        Number.parseFloat(
          root.attrs.find(({ name }) => name === "height")?.value ?? "32",
        ),
      ];
  if (
    bounds.length !== 4 ||
    bounds.some(
      (value) => !Number.isFinite(value) || Math.abs(value) > 100_000,
    ) ||
    bounds[2] <= 0 ||
    bounds[3] <= 0
  )
    invalidImage("Use a valid positive SVG viewBox.");
  let count = 0;
  function sanitize(node: DefaultTreeAdapterTypes.Node, depth: number) {
    if (++count > 5000 || depth > 64)
      invalidImage("This SVG is too complex. Upload a PNG instead.");
    if (!("tagName" in node)) return;
    if (!svgTags.has(node.tagName))
      invalidImage(
        "This SVG contains unsupported elements. Upload a PNG instead.",
      );
    const attrs = [] as typeof node.attrs;
    for (const attribute of node.attrs) {
      const { name, value } = attribute;
      if (
        name === "xmlns" ||
        attribute.prefix === "xmlns" ||
        name === "version" ||
        name === "class"
      )
        continue;
      if (name === "style") {
        for (const rule of value.split(";").filter((item) => item.trim())) {
          const separator = rule.indexOf(":");
          const property = rule.slice(0, separator).trim();
          const paint = rule.slice(separator + 1).trim();
          if (
            separator < 1 ||
            !svgAttributes.has(property) ||
            /[\\<>]/.test(paint) ||
            (/url\s*\(/i.test(paint) &&
              !/^url\(#[A-Za-z_][\w.-]*\)$/.test(paint))
          )
            invalidImage("Use an SVG without external styles or resources.");
          attrs.push({ name: property, value: paint });
        }
        continue;
      }
      if (name === "href") {
        if (!/^#[A-Za-z_][\w.-]*$/.test(value))
          invalidImage("SVG references must stay inside the icon.");
        attrs.push({ name: "href", value });
        continue;
      }
      if (
        !svgAttributes.has(name) ||
        /[\\<>]/.test(value) ||
        (/url\s*\(/i.test(value) && !/^url\(#[A-Za-z_][\w.-]*\)$/.test(value))
      )
        invalidImage(
          "Use an SVG without scripts, events, or external resources.",
        );
      attrs.push({ name, value });
    }
    node.attrs = attrs;
    for (const child of node.childNodes) sanitize(child, depth + 1);
  }
  sanitize(root, 0);
  const side = Math.max(bounds[2], bounds[3]);
  const square = [
    bounds[0] - (side - bounds[2]) / 2,
    bounds[1] - (side - bounds[3]) / 2,
    side,
    side,
  ];
  root.attrs = root.attrs.filter(
    ({ name }) => !["width", "height", "viewBox"].includes(name),
  );
  root.attrs.push(
    { name: "xmlns", value: "http://www.w3.org/2000/svg" },
    { name: "width", value: "128" },
    { name: "height", value: "128" },
    { name: "viewBox", value: square.join(" ") },
  );
  return Buffer.from(serializeOuter(root));
}
function isRaster(input: Buffer) {
  return (
    input
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (input[0] === 255 && input[1] === 216 && input[2] === 255) ||
    /^GIF8[79]a$/.test(input.subarray(0, 6).toString("ascii")) ||
    (input.subarray(0, 4).toString("ascii") === "RIFF" &&
      input.subarray(8, 12).toString("ascii") === "WEBP") ||
    (input.subarray(4, 8).toString("ascii") === "ftyp" &&
      /avi[fs]/.test(input.subarray(8, 32).toString("ascii")))
  );
}
export async function normalizeImage(
  input: Buffer,
  kind: "stack" | "project",
): Promise<Buffer> {
  if (!input.length || input.length > MAX_IMAGE_BYTES)
    invalidImage("Choose an image of at most 5 MiB.");
  const raster = isRaster(input);
  const data = raster ? input : safeSvg(input);
  try {
    return await sharp(data, { limitInputPixels: 16_000_000, animated: false })
      .autoOrient()
      .resize(
        kind === "stack"
          ? {
              width: 128,
              height: 128,
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            }
          : {
              width: 1920,
              height: 1920,
              fit: "inside",
              withoutEnlargement: true,
            },
      )
      .png()
      .timeout({ seconds: 10 })
      .toBuffer();
  } catch {
    return invalidImage(
      "The image could not be decoded. Use a valid SVG or raster image with at most 16 million pixels.",
    );
  }
}
export async function readImageForm(
  request: Request,
  maxBytes = MAX_IMAGE_BYTES,
): Promise<File> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(type))
    invalidImage("Upload a multipart form containing one file.");
  const reader = request.body?.getReader();
  if (!reader) invalidImage("Choose a file to upload.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes + 64 * 1024) {
        await reader.cancel();
        invalidImage("The upload exceeds the allowed size.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": type },
    }).formData();
  } catch {
    return invalidImage("The upload form is malformed.");
  }
  const files = form.getAll("file");
  if (
    files.length !== 1 ||
    !(files[0] instanceof File) ||
    [...form.keys()].some((key) => key !== "file")
  )
    invalidImage("Upload exactly one file.");
  return files[0];
}
export async function storeImage(input: Buffer, kind: "stack" | "project") {
  const normalized = await normalizeImage(input, kind);
  if (normalized.length > MAX_IMAGE_BYTES)
    invalidImage("The decoded image is too large. Choose a smaller image.");
  const url = `/uploads/${kind === "stack" ? "stacks" : "projects"}/${randomUUID()}.png`;
  await writeStoredUpload(url, normalized, "image/png");
  return url;
}
