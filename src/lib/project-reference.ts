import manifest from "../../prisma/seed-data.json";
import type { ProjectRecord } from "./project-types";

// These aliases retain the existing editor keys as cards move to Project data.
export const projectContentBindings = [
  {
    id: 1,
    titleKey: "projects.text.003",
    descriptionKey: "projects.text.004",
    sourceIndex: 1,
  },
  {
    id: 2,
    titleKey: "projects.text.007",
    descriptionKey: "projects.text.008",
    sourceIndex: 3,
  },
  {
    id: 3,
    titleKey: "projects.text.011",
    descriptionKey: "projects.text.012",
    sourceIndex: 5,
  },
  {
    id: 4,
    titleKey: "projects.text.015",
    descriptionKey: "projects.text.016",
    sourceIndex: 9,
  },
].map((binding) => ({
  ...binding,
  contentKeys: manifest.content
    .filter(
      ({ source }) =>
        source.section === "projects" &&
        source.path[0] === 0 &&
        source.path[1] === 3 &&
        source.path[2] === binding.sourceIndex,
    )
    .map(({ key }) => key),
}));

export function getProjectContentBinding(
  key: string,
): { projectId: number; field: "title" | "description" } | undefined {
  for (const binding of projectContentBindings) {
    if (binding.titleKey === key)
      return { projectId: binding.id, field: "title" };
    if (binding.descriptionKey === key)
      return { projectId: binding.id, field: "description" };
  }
}

// Used only by the frozen-source parity check when no database records are passed.
export const referenceProjects: ProjectRecord[] = manifest.projects.map(
  (project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    photoUrl: project.photoUrl,
    link: project.link,
    repoUrl: project.repoUrl,
    order: project.order,
    published: project.published,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
    stacks: project.stackNames.map((name, order) => {
      const stack = manifest.stacks.find((item) => item.name === name);
      if (!stack) throw new Error(`Missing original stack: ${name}`);
      return { id: stack.id, name: stack.name, svgPath: stack.svgPath, order };
    }),
  }),
);
