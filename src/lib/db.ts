import "server-only";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "./database-url";

const databaseGlobal = globalThis as typeof globalThis & {
  portfolioDatabase?: PrismaClient;
};

export const db =
  databaseGlobal.portfolioDatabase ??
  new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
  });

// Reuse the connection during development reloads.
if (process.env.NODE_ENV !== "production")
  databaseGlobal.portfolioDatabase = db;
