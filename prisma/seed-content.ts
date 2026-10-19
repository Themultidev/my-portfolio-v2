import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import manifest from "./seed-data.json";
import { resetPostgresSequences } from "./reset-postgres-sequences";

const environmentSchema = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
  ADMIN_PASSWORD: z
    .string()
    .min(12)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "must be at most 72 UTF-8 bytes (bcrypt limit)",
    ),
});

export function getAdminCredentials(
  environment: Record<string, string | undefined>,
) {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    // Never include input values, password fragments, or the full environment.
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(
      `Invalid ${fields.join(" / ")}. Set ADMIN_EMAIL to a valid email and ADMIN_PASSWORD to at least 12 characters, at most 72 UTF-8 bytes, in .env.local.`,
    );
  }
  return {
    email: result.data.ADMIN_EMAIL,
    password: result.data.ADMIN_PASSWORD,
  };
}

/** Create missing original rows; preserve existing edits and password hashes. */
export async function seedPortfolio(
  database: PrismaClient,
  environment: Record<string, string | undefined>,
) {
  const credentials = getAdminCredentials(environment);
  // bcrypt cost 12. Passwords are used verbatim, including intentional spaces.
  const passwordHash = await hash(credentials.password, 12);
  return database.$transaction(
    async (transaction) => {
      const admins = await transaction.admin.findMany({ take: 2 });
      if (
        admins.length > 1 ||
        (admins.length === 1 && admins[0].email !== credentials.email)
      ) {
        throw new Error(
          "Seed requires one admin matching ADMIN_EMAIL. Existing admin credentials were left unchanged.",
        );
      }
      await transaction.admin.upsert({
        where: { email: credentials.email },
        create: { email: credentials.email, passwordHash },
        update: {},
      });
      for (const { key, value, label } of manifest.content) {
        await transaction.contentBlock.upsert({
          where: { key },
          create: { key, value, label },
          update: {},
        });
      }
      // Mutable names must not be seed identity: renaming a stack stays renamed.
      // IDs 1..20 are reserved for the original catalog; new IDs auto-increment.
      const stackIds = new Map<string, number>();
      for (const stack of manifest.stacks) {
        const saved = await transaction.stack.upsert({
          where: { id: stack.id },
          create: stack,
          update: {},
        });
        stackIds.set(stack.name, saved.id);
      }
      // IDs 1..4 identify the original cards. Existing cards retain their fields
      // and memberships, even if chips were removed or reordered by the editor.
      for (const original of manifest.projects) {
        const {
          id,
          title,
          description,
          photoUrl,
          link,
          repoUrl,
          order,
          published,
        } = original;
        const project = {
          id,
          title,
          description,
          photoUrl,
          link,
          repoUrl,
          order,
          published,
        };
        const memberships = original.stackNames.map((name, order) => {
          const stackId = stackIds.get(name);
          if (!stackId) throw new Error(`Missing bundled stack: ${name}`);
          return { stackId, order };
        });
        await transaction.project.upsert({
          where: { id: project.id },
          select: { id: true },
          create: { ...project, stacks: { create: memberships } },
          update: {},
        });
      }
      if (
        /^postgres(?:ql)?:\/\//.test(
          environment.DATABASE_URL ?? process.env.DATABASE_URL ?? "",
        )
      )
        await resetPostgresSequences(transaction);
      return {
        admins: await transaction.admin.count(),
        content: await transaction.contentBlock.count(),
        projects: await transaction.project.count(),
        stacks: await transaction.stack.count(),
      };
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
}
