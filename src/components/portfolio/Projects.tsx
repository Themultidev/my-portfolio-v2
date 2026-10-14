// Generated from the frozen static source; run node scripts/bind-content-components.mjs.
import type { ProjectRecord } from "../../lib/project-types";
import { referenceProjects } from "../../lib/project-reference";
import ProjectBoard from "../projects/ProjectBoard";
import EditableText from "../editor/EditableText";
export default function Projects({
  projects = referenceProjects,
  editable = false,
}: { projects?: ProjectRecord[]; editable?: boolean } = {}) {
  return (
    <>
      <section
        className={
          "px-10 py-40 space-y-20 h-fit md:h-full md:py-30 md:px-16 lg:px-24"
        }
        id={"projects"}
      >
        {"\n    "}
        <div>
          <h1
            className={
              " text-center text-[27px] md:text-[40px] font-bold font-[Michroma]  text-cyan-400 mb-4"
            }
          >
            <EditableText blockKey="projects.text.001">
              {" LATEST WORKS"}
            </EditableText>
          </h1>
        </div>
        {"\n    "}
        <ProjectBoard
          projects={
            editable
              ? projects
              : projects.filter((project) => project.published)
          }
          editable={editable}
        />
        {"\n\n    \n\n    \n  "}
      </section>
    </>
  );
}
