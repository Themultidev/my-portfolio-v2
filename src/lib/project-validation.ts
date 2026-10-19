import { z } from "zod";
import { contentPatchSchema } from "./content-validation";
import { isCountryCode, nigeriaRegion } from "./countries";

export const PROJECT_MAX_ID = 2_147_483_647;
export const PROJECT_MAX_STACKS = 5;
export const PROJECT_MAX_URL_LENGTH = 2_048;

const plainText = contentPatchSchema.shape.value;
const positiveId = z.number().int().positive().max(PROJECT_MAX_ID);

/** Validate the route spelling as well as the resulting database integer. */
export const projectIdSchema = z
  .string()
  .regex(/^[1-9][0-9]*$/, "Use a positive integer project ID.")
  .refine((value) => Number(value) <= PROJECT_MAX_ID, "Use a valid project ID.")
  .transform(Number);

function decodedUrl(value: string): string | null {
  // Check escaped characters too. A twice-escaped path must not bypass the
  // local image path checks, and malformed percent escapes are not accepted.
  let decoded = value;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return null;
    }
  }
  return null;
}

function safeUrlCharacters(value: string): string | null {
  if (value !== value.trim() || !value) return null;
  const decoded = decodedUrl(value);
  if (
    decoded === null ||
    /[\\\u0000-\u001f\u007f]/.test(value) ||
    /[\\\u0000-\u001f\u007f]/.test(decoded)
  )
    return null;
  return decoded;
}

function safeLink(value: string): boolean {
  const decoded = safeUrlCharacters(value);
  if (decoded === null) return false;
  if (value.startsWith("/"))
    return !value.startsWith("//") && !decoded.startsWith("//");
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function safePhoto(value: string): boolean {
  const decoded = safeUrlCharacters(value);
  if (
    decoded === null ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    decoded.startsWith("//") ||
    /[?#]/.test(decoded) ||
    decoded.split("/").some((part) => part === "." || part === "..")
  )
    return false;
  return /\.(?:jpe?g|png|webp|gif|avif)$/i.test(decoded);
}

const urlText = plainText.refine(
  (value) => value.length <= PROJECT_MAX_URL_LENGTH,
  "Use at most 2048 characters for a URL.",
);
const link = urlText
  .refine(safeLink, "Use an HTTP(S) URL or a path starting with one slash.")
  .nullable();
const photo = urlText
  .refine(
    safePhoto,
    "Use a local JPG, PNG, WebP, GIF, or AVIF image path without traversal.",
  )
  .nullable();
const stackIds = z
  .array(positiveId)
  .max(PROJECT_MAX_STACKS, "Choose at most five stacks.")
  .refine(
    (values) => new Set(values).size === values.length,
    "Choose each stack only once.",
  );

const projectFields = {
  title: plainText,
  description: plainText.nullable(),
  photoUrl: photo,
  link,
  repoUrl: link,
  countryCode: z
    .string()
    .refine(isCountryCode, "Choose a valid country.")
    .nullable(),
  regionCode: z
    .string()
    .refine(
      (value) => nigeriaRegion(value) === value,
      "Choose a Nigerian state or FCT.",
    )
    .nullable(),
  order: z.number().int().nonnegative().max(PROJECT_MAX_ID),
  published: z.boolean(),
  stackIds,
};

export const projectCreateSchema = z
  .object({
    ...projectFields,
    title: plainText.refine(
      (value) => value.trim().length > 0,
      "Enter a project title.",
    ),
    description: projectFields.description.optional(),
    photoUrl: photo.optional(),
    link: link.optional(),
    repoUrl: link.optional(),
    countryCode: projectFields.countryCode.optional(),
    regionCode: projectFields.regionCode.optional(),
    order: projectFields.order.optional(),
    published: projectFields.published.optional(),
    stackIds: stackIds.optional(),
  })
  .strict();

export const projectPatchSchema = z
  .object(projectFields)
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Send at least one project field to update.",
  );

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectPatchInput = z.infer<typeof projectPatchSchema>;
