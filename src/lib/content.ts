import "server-only";
import { cache } from "react";
import type { ContentRecord } from "../components/editor/EditModeProvider";
import { db } from "./db";

// Deduplicate within one server render without caching content across requests.
export const getContentBlocks = cache(async (): Promise<ContentRecord> => {
  const blocks = await db.contentBlock.findMany({
    select: { key: true, value: true, label: true },
  });
  return Object.fromEntries(
    blocks.map(({ key, value, label }) => [key, { value, label }]),
  );
});
