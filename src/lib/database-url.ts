export function getDatabaseUrl(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = environment.DATABASE_URL?.trim();
  if (!configured && environment.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be configured in production.");
  }
  const url = configured || "file:./dev.db";
  if (!url.startsWith("file:") || url.length === 5) {
    throw new Error(
      "DATABASE_URL must point to a SQLite file using the file: prefix.",
    );
  }
  return url;
}
