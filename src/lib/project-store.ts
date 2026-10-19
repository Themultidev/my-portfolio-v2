import "server-only";
import { Prisma } from "@prisma/client";
import { ApiError } from "./api-response";
import { db } from "./db";
import { portfolioTransaction } from "./portfolio-history";
import { validProjectLocation } from "./countries";
import { projectContentBindings } from "./project-reference";
import type { ProjectRecord } from "./project-types";
import {
  PROJECT_MAX_ID,
  type ProjectCreateInput,
  type ProjectPatchInput,
} from "./project-validation";

const projectInclude = {
  stacks: {
    include: { stack: true },
    orderBy: [{ order: "asc" }, { stackId: "asc" }],
  },
} satisfies Prisma.ProjectInclude;

type StoredProject = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

function projectRecord(project: StoredProject): ProjectRecord {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    photoUrl: project.photoUrl,
    link: project.link,
    repoUrl: project.repoUrl,
    countryCode: project.countryCode,
    regionCode: project.regionCode,
    order: project.order,
    published: project.published,
    stacks: project.stacks.map(({ stack, order }) => ({
      id: stack.id,
      name: stack.name,
      svgPath: stack.svgPath,
      order,
    })),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

function notFound(): ApiError {
  return new ApiError(404, "NOT_FOUND", "Project was not found.");
}

export async function listProjects({
  publishedOnly = false,
}: { publishedOnly?: boolean } = {}): Promise<ProjectRecord[]> {
  const projects = await db.project.findMany({
    ...(publishedOnly ? { where: { published: true } } : {}),
    include: projectInclude,
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
  return projects.map(projectRecord);
}

export async function getProject(id: number): Promise<ProjectRecord> {
  const project = await db.project.findUnique({
    where: { id },
    include: projectInclude,
  });
  if (!project) throw notFound();
  return projectRecord(project);
}

export async function listProjectStacks() {
  return db.stack.findMany({
    select: { id: true, name: true, svgPath: true, order: true },
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
}

async function checkStacks(
  transaction: Prisma.TransactionClient,
  stackIds: number[],
) {
  const count = await transaction.stack.count({
    where: { id: { in: stackIds } },
  });
  if (count !== stackIds.length)
    throw new ApiError(400, "VALIDATION", "Invalid project stacks.", {
      stackIds: ["Choose only existing stacks."],
    });
}

function stackRows(stackIds: number[]) {
  return stackIds.map((stackId, order) => ({ stackId, order }));
}

export async function createProject(
  input: ProjectCreateInput,
): Promise<ProjectRecord> {
  return portfolioTransaction("Create project", async (transaction) => {
    if (
      !validProjectLocation(input.countryCode ?? null, input.regionCode ?? null)
    )
      throw new ApiError(
        400,
        "VALIDATION",
        "Choose a country before selecting a Nigerian state.",
      );
    const stackIds = input.stackIds ?? [];
    await checkStacks(transaction, stackIds);
    let order = input.order;
    if (order === undefined) {
      const { _max } = await transaction.project.aggregate({
        _max: { order: true },
      });
      order = (_max.order ?? -1) + 1;
      if (order > PROJECT_MAX_ID)
        throw new ApiError(400, "VALIDATION", "Project order is too large.", {
          order: ["Provide an order no greater than 2147483647."],
        });
    }
    const project = await transaction.project.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        photoUrl: input.photoUrl ?? null,
        link: input.link ?? null,
        repoUrl: input.repoUrl ?? null,
        countryCode: input.countryCode ?? null,
        regionCode: input.regionCode ?? null,
        order,
        published: input.published ?? true,
        stacks: { create: stackRows(stackIds) },
      },
      include: projectInclude,
    });
    return projectRecord(project);
  });
}

export async function updateProject(
  id: number,
  input: ProjectPatchInput,
): Promise<ProjectRecord> {
  return portfolioTransaction("Edit project", async (transaction) => {
    const existing = await transaction.project.findUnique({
      where: { id },
      select: { id: true, countryCode: true, regionCode: true },
    });
    if (!existing) throw notFound();
    if (
      !validProjectLocation(
        input.countryCode === undefined
          ? existing.countryCode
          : input.countryCode,
        input.regionCode === undefined ? existing.regionCode : input.regionCode,
      )
    )
      throw new ApiError(
        400,
        "VALIDATION",
        "A Nigerian state requires Nigeria as the project country. Clear the state when changing country.",
      );
    if (input.stackIds !== undefined)
      await checkStacks(transaction, input.stackIds);

    const { stackIds, ...data } = input;
    const project = await transaction.project.update({
      where: { id },
      data: {
        ...data,
        ...(stackIds === undefined
          ? {}
          : { stacks: { deleteMany: {}, create: stackRows(stackIds) } }),
      },
      include: projectInclude,
    });

    // Original card text still has content keys used by the inline editor.
    // Keep those aliases in the same transaction as the authoritative row.
    const binding = projectContentBindings.find((entry) => entry.id === id);
    if (binding && input.title !== undefined)
      await transaction.contentBlock.updateMany({
        where: { key: binding.titleKey },
        data: { value: input.title },
      });
    if (binding && input.description !== undefined)
      await transaction.contentBlock.updateMany({
        where: { key: binding.descriptionKey },
        data: { value: input.description ?? "" },
      });
    return projectRecord(project);
  });
}

export async function deleteProject(id: number): Promise<number> {
  return portfolioTransaction("Delete project", async (transaction) => {
    const project = await transaction.project.delete({
      where: { id },
      select: { id: true },
    });
    return project.id;
  });
}
