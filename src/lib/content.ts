import "server-only";
import { cache } from "react";
import type { ContentRecord } from "../components/editor/EditModeProvider";
import { db } from "./db";
import { projectContentBindings } from "./project-reference";
import { getProjectRecords } from "./projects";

// Deduplicate within one server render without caching content across requests.
export const getContentBlocks = cache(
  async (editable = false): Promise<ContentRecord> => {
    const [blocks, projects] = await Promise.all([
      db.contentBlock.findMany({
        select: { key: true, value: true, label: true },
      }),
      getProjectRecords(),
    ]);
    const content = Object.fromEntries(
      blocks.map(({ key, value, label }) => [key, { value, label }]),
    );
    for (const binding of projectContentBindings) {
      const project = projects.find(({ id }) => id === binding.id);
      // Draft/deleted card copy must not leak in the public provider's payload.
      if (!editable && (!project || !project.published)) {
        for (const key of binding.contentKeys) delete content[key];
        continue;
      }
      if (!project) continue;
      if (content[binding.titleKey])
        content[binding.titleKey].value = project.title;
      if (content[binding.descriptionKey])
        content[binding.descriptionKey].value = project.description ?? "";
    }
    return content;
  },
);
