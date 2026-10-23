import { z } from "zod";
export const blogCategories = [
  "Personal updates",
  "Technology",
  "Web3",
  "Health",
  "Women",
  "Government",
  "Education",
  "Finance",
  "International affairs",
  "Entertainment",
] as const;
export const postSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    slug: z
      .string()
      .min(1)
      .max(160)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase words separated by hyphens for the URL.",
      ),
    excerpt: z.string().trim().max(400),
    body: z.string().trim().min(1).max(50000),
    coverUrl: z
      .string()
      .regex(/^\/uploads\/projects\/[a-f0-9-]{36}\.png$/)
      .nullable(),
    category: z.enum(blogCategories),
    featured: z.boolean(),
    published: z.boolean(),
  })
  .strict();
export const commentSchema = z
  .object({
    author: z.string().trim().min(2).max(60),
    body: z.string().trim().min(1).max(2000),
    website: z.literal("").optional(),
  })
  .strict();
export const blogId = z.coerce.number().int().positive().max(2147483647);
export type PostDraft = z.infer<typeof postSchema>;
