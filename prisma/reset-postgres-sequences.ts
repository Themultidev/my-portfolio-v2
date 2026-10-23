import type { Prisma } from "@prisma/client";
// Explicit imported/seeded IDs do not advance PostgreSQL's SERIAL sequences.
// Never rewind a sequence when a previously highest row was deleted.
export async function resetPostgresSequences(
  transaction: Prisma.TransactionClient,
  includeBlog = false,
) {
  for (const table of [
    "Admin",
    "ContentBlock",
    "Stack",
    "Project",
    ...(includeBlog ? ["BlogPost", "BlogComment", "BlogLike"] : []),
  ]) {
    await transaction.$queryRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) + 1 FROM "${table}"), (SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END FROM "${table}_id_seq")), false)`,
    );
  }
}
