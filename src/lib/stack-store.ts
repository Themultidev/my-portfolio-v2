import "server-only";
import manifest from "../../prisma/seed-data.json";
import { storedUploadExists } from "./upload-storage";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { ApiError, apiFailure, unexpectedApiFailure } from "./api-response";
import { requireSession } from "./auth";
import { getAuthConfig, isTrustedOrigin } from "./auth-config";
import { readJsonBody } from "./json-body";
import { contentPatchSchema } from "./content-validation";
import { PROJECT_MAX_ID, projectIdSchema } from "./project-validation";
import type { StackRecord } from "./stack-types";

const name = contentPatchSchema.shape.value
  .transform((value) => value.trim())
  .refine(
    (value) =>
      value.length > 0 && value.length <= 100 && !/[\r\n\t]/.test(value),
    "Enter a single-line stack name of 1–100 characters.",
  );
const fields = {
  name,
  svgPath: z
    .string()
    .regex(
      /^\/(?:stacks\/[a-z0-9-]+\.svg|uploads\/stacks\/[a-f0-9-]{36}\.png)$/,
      "Choose a bundled icon or upload an icon first.",
    ),
  order: z.number().int().nonnegative().max(PROJECT_MAX_ID).optional(),
};
const createSchema = z.object(fields).strict();
const patchSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Send at least one stack field.",
  );
const selection = {
  id: true,
  name: true,
  svgPath: true,
  order: true,
  _count: { select: { projects: true } },
} as const;
type StoredStack = Prisma.StackGetPayload<{ select: typeof selection }>;
function record({ _count, ...stack }: StoredStack): StackRecord {
  return { ...stack, projectCount: _count.projects };
}
export async function listStackRecords(): Promise<StackRecord[]> {
  return (
    await db.stack.findMany({
      select: selection,
      orderBy: [{ order: "asc" }, { id: "asc" }],
    })
  ).map(record);
}
export async function stackMutation(request: Request) {
  await requireSession(request);
  if (!isTrustedOrigin(request, getAuthConfig()))
    throw new ApiError(403, "ORIGIN", "Request origin is not allowed.");
}
export function stackId(value: string) {
  const parsed = projectIdSchema.safeParse(value);
  if (!parsed.success)
    throw new ApiError(400, "VALIDATION", "Invalid stack ID.", {
      id: ["Use a positive integer stack ID."],
    });
  return parsed.data;
}
export async function saveStack(
  request: Request,
  id?: number,
): Promise<StackRecord> {
  const parsed = (id === undefined ? createSchema : patchSchema).safeParse(
    await readJsonBody(request),
  );
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues)
      (errors[String(issue.path[0] ?? "body")] ??= []).push(issue.message);
    throw new ApiError(400, "VALIDATION", "Invalid stack.", errors);
  }
  if (parsed.data.svgPath) {
    try {
      if (parsed.data.svgPath.startsWith("/uploads/"))
        await storedUploadExists(parsed.data.svgPath);
      else if (
        !manifest.stacks.some((stack) => stack.svgPath === parsed.data.svgPath)
      )
        throw new Error("Unknown bundled icon.");
    } catch {
      throw new ApiError(400, "VALIDATION", "Icon was not found.", {
        svgPath: ["Choose an existing icon or upload it first."],
      });
    }
  }
  return db.$transaction(async (transaction) => {
    if (id !== undefined)
      return record(
        await transaction.stack.update({
          where: { id },
          data: parsed.data,
          select: selection,
        }),
      );
    const data = createSchema.parse(parsed.data);
    const order =
      data.order ??
      ((await transaction.stack.aggregate({ _max: { order: true } }))._max
        .order ?? -1) + 1;
    if (order > PROJECT_MAX_ID)
      throw new ApiError(400, "VALIDATION", "Provide a smaller stack order.");
    return record(
      await transaction.stack.create({
        data: { ...data, order },
        select: selection,
      }),
    );
  });
}
export async function deleteStack(id: number) {
  return db.$transaction(async (transaction) => {
    const stack = await transaction.stack.findUnique({
      where: { id },
      select: selection,
    });
    if (!stack) throw new ApiError(404, "NOT_FOUND", "Stack was not found.");
    if (stack._count.projects)
      throw new ApiError(
        409,
        "IN_USE",
        `This stack is used by ${stack._count.projects} project(s). Remove it from those projects first.`,
      );
    await transaction.stack.delete({ where: { id } });
    return id;
  });
}
export function stackFailure(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return apiFailure(
        new ApiError(
          409,
          "CONFLICT",
          "A stack with that name already exists.",
          { name: ["Choose another name."] },
        ),
      );
    if (error.code === "P2025")
      return apiFailure(new ApiError(404, "NOT_FOUND", "Stack was not found."));
    if (error.code === "P2003")
      return apiFailure(
        new ApiError(
          409,
          "IN_USE",
          "A project still uses this stack. Remove it from the project first.",
        ),
      );
  }
  return unexpectedApiFailure(error);
}
