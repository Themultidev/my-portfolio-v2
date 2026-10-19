export function getDatabaseUrl(
  environment: Partial<NodeJS.ProcessEnv> = process.env,
): string {
  const configured = environment.DATABASE_URL?.trim();
  if (!configured && environment.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be configured in production.");
  }
  const url = configured || "file:./dev.db";
  if (/^postgres(?:ql)?:\/\//.test(url)) {
    try {
      const parsed = new URL(url);
      // Prisma Postgres can use /?sslmode=require for its default database.
      if (!parsed.hostname || !parsed.pathname) throw new Error();
    } catch {
      throw new Error(
        "DATABASE_URL must contain a valid PostgreSQL connection URL.",
      );
    }
    return url;
  }
  if (!url.startsWith("file:") || url.length === 5) {
    throw new Error(
      "DATABASE_URL must point to a SQLite file using file: or a PostgreSQL database using postgres:// or postgresql://.",
    );
  }
  if (environment.VERCEL === "1")
    throw new Error(
      "DATABASE_URL must use hosted PostgreSQL on Vercel. Local SQLite files are not persistent there.",
    );
  return url;
}

export function isPostgresUrl(url: string) {
  return /^postgres(?:ql)?:\/\//.test(url);
}
export function getDirectDatabaseUrl(
  environment: Partial<NodeJS.ProcessEnv> = process.env,
) {
  const url = environment.DIRECT_URL?.trim() || getDatabaseUrl(environment);
  if (!isPostgresUrl(url))
    throw new Error("DIRECT_URL must use a PostgreSQL connection URL.");
  return getDatabaseUrl({ ...environment, DATABASE_URL: url });
}
