import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./api-response";
import manifest from "../../prisma/seed-data.json";
import { resetPostgresSequences } from "../../prisma/reset-postgres-sequences";
import { snapshotSchema } from "../../prisma/portfolio-snapshot";

const stateSchema = snapshotSchema.pick({
  blocks: true,
  stacks: true,
  projects: true,
  memberships: true,
});
const LIMIT = 50;
async function snapshot(tx: Prisma.TransactionClient) {
  const [blocks, stacks, projects, memberships] = await Promise.all([
    tx.contentBlock.findMany({ orderBy: { id: "asc" } }),
    tx.stack.findMany({ orderBy: { id: "asc" } }),
    tx.project.findMany({ orderBy: { id: "asc" } }),
    tx.projectStack.findMany({
      orderBy: [{ projectId: "asc" }, { stackId: "asc" }],
    }),
  ]);
  return JSON.stringify({ blocks, stacks, projects, memberships });
}
async function lock(tx: Prisma.TransactionClient) {
  // Taking a write lock on this singleton serializes all portfolio mutations
  // across tabs/functions on both SQLite and PostgreSQL before reading state.
  return tx.portfolioHistoryState.upsert({
    where: { id: 1 },
    create: { id: 1, version: 1 },
    update: { version: { increment: 1 } },
  });
}
async function restore(tx: Prisma.TransactionClient, json: string) {
  const state = stateSchema.parse(JSON.parse(json));
  await tx.projectStack.deleteMany();
  await tx.project.deleteMany();
  await tx.stack.deleteMany();
  await tx.contentBlock.deleteMany();
  await tx.contentBlock.createMany({ data: state.blocks });
  await tx.stack.createMany({ data: state.stacks });
  await tx.project.createMany({ data: state.projects });
  await tx.projectStack.createMany({ data: state.memberships });
  if (/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? ""))
    await resetPostgresSequences(tx);
}
export async function portfolioTransaction<T>(
  label: string,
  mutate: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      await lock(tx);
      const before = await snapshot(tx);
      const result = await mutate(tx);
      const after = await snapshot(tx);
      if (before !== after) {
        await tx.portfolioRevision.deleteMany({ where: { undone: true } });
        await tx.portfolioRevision.create({ data: { label, before, after } });
        const old = await tx.portfolioRevision.findMany({
          orderBy: { id: "desc" },
          skip: LIMIT,
          select: { id: true },
        });
        if (old.length)
          await tx.portfolioRevision.deleteMany({
            where: { id: { in: old.map(({ id }) => id) } },
          });
      }
      return result;
    },
    { maxWait: 15_000, timeout: 30_000 },
  );
}
export async function historyStatus() {
  const [undo, redo, state] = await db.$transaction([
    db.portfolioRevision.findFirst({
      where: { undone: false },
      orderBy: { id: "desc" },
      select: { label: true },
    }),
    db.portfolioRevision.findFirst({
      where: { undone: true },
      orderBy: { id: "asc" },
      select: { label: true },
    }),
    db.portfolioHistoryState.findUnique({ where: { id: 1 } }),
  ]);
  return {
    undo: undo?.label ?? null,
    redo: redo?.label ?? null,
    version: state?.version ?? 0,
  };
}
export async function replayHistory(
  action: "undo" | "redo",
  expectedVersion: number,
) {
  return db.$transaction(
    async (tx) => {
      const state = await lock(tx);
      if (state.version - 1 !== expectedVersion)
        throw new ApiError(
          409,
          "CONFLICT",
          "The portfolio changed in another tab. Refresh the history controls and try again.",
        );
      const undo = action === "undo";
      const revision = await tx.portfolioRevision.findFirst({
        where: { undone: !undo },
        orderBy: { id: undo ? "desc" : "asc" },
      });
      if (!revision)
        throw new ApiError(409, "EMPTY_HISTORY", `Nothing to ${action}.`);
      await restore(tx, undo ? revision.before : revision.after);
      await tx.portfolioRevision.update({
        where: { id: revision.id },
        data: { undone: undo },
      });
    },
    { maxWait: 15_000, timeout: 30_000 },
  );
}
export async function restoreDefaults() {
  return portfolioTransaction("Restore original portfolio", async (tx) => {
    await tx.projectStack.deleteMany();
    await tx.project.deleteMany();
    await tx.stack.deleteMany();
    await tx.contentBlock.deleteMany();
    await tx.contentBlock.createMany({
      data: manifest.content.map(({ key, value, label }) => ({
        key,
        value,
        label,
      })),
    });
    await tx.stack.createMany({ data: manifest.stacks });
    for (const original of manifest.projects) {
      await tx.project.create({
        data: {
          id: original.id,
          title: original.title,
          description: original.description,
          photoUrl: original.photoUrl,
          link: original.link,
          repoUrl: original.repoUrl,
          order: original.order,
          published: original.published,
          countryCode: null,
          regionCode: null,
          stacks: {
            create: original.stackNames.map((name, order) => ({
              stackId: manifest.stacks.find((stack) => stack.name === name)!.id,
              order,
            })),
          },
        },
      });
    }
    if (/^postgres(?:ql)?:\/\//.test(process.env.DATABASE_URL ?? ""))
      await resetPostgresSequences(tx);
  });
}
