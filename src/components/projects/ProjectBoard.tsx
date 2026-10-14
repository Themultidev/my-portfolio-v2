// Generated from the frozen static source; run node scripts/bind-content-components.mjs.
"use client";
import { Fragment, useState } from "react";
import type { ProjectRecord } from "../../lib/project-types";
import ProjectCard from "./ProjectCard";
import { ProjectBoardContext } from "./ProjectBoardContext";
import AddProjectTile from "./AddProjectTile";
export default function ProjectBoard({
  projects,
  editable = false,
}: {
  projects: ProjectRecord[];
  editable?: boolean;
}) {
  // The shared board keeps the original public grid in both modes.
  const [records, setRecords] = useState(projects);
  const visibleProjects = editable
    ? records
    : projects.filter((project) => project.published);
  const entries: (ProjectRecord | null)[] = editable
    ? [...visibleProjects, null]
    : visibleProjects;
  return (
    <ProjectBoardContext.Provider value={{ records, setRecords }}>
      <div
        className={
          "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:space-y-50"
        }
      >
        {entries.map((project, index) => (
          <Fragment key={project?.id ?? "add"}>
            <ProjectSpacing index={index} />
            {project ? (
              <ProjectCard project={project} editable={editable} />
            ) : (
              <AddProjectTile />
            )}
          </Fragment>
        ))}
        {"\n      \n\n    "}
      </div>
    </ProjectBoardContext.Provider>
  );
}
function ProjectSpacing({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <>{"\n\n      "}</>;
    case 1:
      return <>{"\n\n      "}</>;
    case 2:
      return <>{"\n\n      "}</>;
    case 3:
      return (
        <>
          {"\n\n\n      "}
          <div className={"md:hidden lg:block"} />
          {"\n      \n      "}
        </>
      );
    default:
      return <>{"\n\n      "}</>;
  }
}
