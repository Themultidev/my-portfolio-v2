import { z } from "zod";
import { parseSettings } from "../src/lib/site-settings";
const id = z.number().int().positive();
const order = z.number().int();
const date = z
  .string()
  .datetime()
  .transform((value) => new Date(value));
export const snapshotSchema = z
  .object({
    version: z.literal(1),
    admins: z
      .array(
        z
          .object({
            id,
            email: z.string().email(),
            passwordHash: z.string().regex(/^\$2[aby]\$\d{2}\$.{53}$/),
            createdAt: date,
          })
          .strict(),
      )
      .length(1),
    blocks: z
      .array(
        z
          .object({
            id,
            key: z.string(),
            value: z.string(),
            label: z.string(),
            updatedAt: date,
          })
          .strict(),
      )
      .min(1),
    stacks: z.array(
      z.object({ id, name: z.string(), svgPath: z.string(), order }).strict(),
    ),
    projects: z.array(
      z
        .object({
          id,
          title: z.string(),
          photoUrl: z.string().nullable(),
          description: z.string().nullable(),
          link: z.string().nullable(),
          repoUrl: z.string().nullable(),
          countryCode: z
            .string()
            .regex(/^[A-Z]{2}$/)
            .nullable()
            .default(null),
          regionCode: z.string().max(10).nullable().default(null),
          order,
          published: z.boolean(),
          createdAt: date,
          updatedAt: date,
        })
        .strict(),
    ),
    memberships: z.array(
      z.object({ projectId: id, stackId: id, order }).strict(),
    ),
    posts: z
      .array(
        z
          .object({
            id,
            slug: z.string(),
            title: z.string(),
            excerpt: z.string(),
            body: z.string(),
            coverUrl: z.string().nullable(),
            category: z.string(),
            featured: z.boolean(),
            published: z.boolean(),
            publishedAt: date.nullable(),
            createdAt: date,
            updatedAt: date,
          })
          .strict(),
      )
      .default([]),
    comments: z
      .array(
        z
          .object({
            id,
            postId: id,
            author: z.string(),
            body: z.string(),
            visitorHash: z.string(),
            createdAt: date,
          })
          .strict(),
      )
      .default([]),
    likes: z
      .array(
        z
          .object({ id, postId: id, visitorHash: z.string(), createdAt: date })
          .strict(),
      )
      .default([]),
    files: z.array(
      z
        .object({
          path: z
            .string()
            .regex(
              /^\/uploads\/(?:(?:stacks|projects)\/[a-f0-9-]{36}\.png|resumes\/[a-f0-9-]{36}\.pdf|music\/[a-f0-9-]{36}\.(?:mp3|wav|ogg|m4a))$/,
            ),
          base64: z
            .string()
            .max(28_000_000)
            .regex(
              /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
            ),
        })
        .strict(),
    ),
  })
  .strict();
export type PortfolioSnapshot = z.infer<typeof snapshotSchema>;
export function uploadReferences(
  data: Pick<PortfolioSnapshot, "stacks" | "projects" | "blocks"> & {
    posts?: { coverUrl: string | null }[];
  },
) {
  return [
    ...new Set(
      [
        ...data.stacks.map((row) => row.svgPath),
        ...data.projects.flatMap((row) => (row.photoUrl ? [row.photoUrl] : [])),
        ...data.blocks
          .filter((row) => row.key === "site.resume.url")
          .map((row) => row.value),
        ...(data.posts ?? []).flatMap((row) =>
          row.coverUrl ? [row.coverUrl] : [],
        ),
        ...data.blocks
          .filter((row) => row.key === "site.settings")
          .flatMap((row) => {
            const settings = parseSettings(row.value);
            return [
              ...settings.skills.map((s) => s.iconPath),
              settings.music.source,
            ];
          }),
      ].filter((path) => path.startsWith("/uploads/")),
    ),
  ];
}
export function parseSnapshot(value: unknown) {
  const data = snapshotSchema.parse(value);
  const paths = new Set(data.files.map((file) => file.path));
  const references = uploadReferences(data);
  if (
    paths.size !== data.files.length ||
    paths.size !== references.length ||
    references.some((path) => !paths.has(path))
  )
    throw new Error("Snapshot files do not match portfolio references.");
  for (const file of data.files) {
    const bytes = Buffer.from(file.base64, "base64");
    if (
      !bytes.length ||
      bytes.length >
        (file.path.startsWith("/uploads/music/") ? 20 : 5) * 1024 * 1024 ||
      bytes.toString("base64") !== file.base64
    )
      throw new Error("Invalid snapshot file size or encoding.");
    if (
      file.path.startsWith("/uploads/music/")
        ? !(
            bytes.subarray(0, 3).toString() === "ID3" ||
            (bytes[0] === 255 && (bytes[1] & 224) === 224) ||
            bytes.subarray(0, 4).toString() === "OggS" ||
            (bytes.subarray(0, 4).toString() === "RIFF" &&
              bytes.subarray(8, 12).toString() === "WAVE") ||
            bytes.subarray(4, 8).toString() === "ftyp"
          )
        : file.path.endsWith(".pdf")
          ? bytes.subarray(0, 5).toString() !== "%PDF-" ||
            !bytes.subarray(-1024).includes(Buffer.from("%%EOF"))
          : !bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      throw new Error("Invalid snapshot file format.");
  }
  return data;
}
