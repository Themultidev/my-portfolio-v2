// Generated from the frozen static source; run node scripts/bind-content-components.mjs.
import { Fragment } from "react";
import type { ProjectRecord } from "../../lib/project-types";
import { ProjectCopy, ProjectImage, ProjectActions } from "./ProjectFields";
import StackChip from "./StackChip";
import ProjectStackPicker from "./ProjectStackPicker";
export default function ProjectCard({
  project,
  editable = false,
}: {
  project: ProjectRecord;
  editable?: boolean;
}) {
  switch (project.id) {
    case 2:
      return <Card2 project={project} editable={editable} />;
    case 3:
      return <Card3 project={project} editable={editable} />;
    case 4:
      return <Card4 project={project} editable={editable} />;
    default:
      return <Card1 project={project} editable={editable} />;
  }
}
function Card1({
  project,
  editable,
}: {
  project: ProjectRecord;
  editable: boolean;
}) {
  return (
    <div
      className={
        "relative grid gap-6 text-center rounded grid-col-1 border-1 md:text-left lg:translate-y-30"
      }
      data-aos={"fade-up"}
      data-aos-delay={"300"}
      id={project.id === 1 ? "boxOne" : `project-${project.id}`}
    >
      {"\n  "}
      <ProjectImage
        project={project}
        sourceId={1}
        blockKey="projects.alt.002"
        elementProps={{
          className: "w-full h-auto md:h-[100%] object-cover",
          src: "/projectimgs/rdex.png",
          alt: "RD Exchange — project screenshot (HTML, CSS, JavaScript)",
        }}
      />
      {"\n       \n       "}
      <div className={"flex flex-col gap-5 p-3 pb-4 text-center md:text-left"}>
        {"\n\n        "}
        <h1 className={"text-[20px]  text-cyan-400   "}>
          <ProjectCopy
            projectId={project.id}
            sourceId={1}
            field="title"
            blockKey="projects.text.003"
          >
            {project.title}
          </ProjectCopy>
        </h1>
        {"\n        "}
        <p>
          <ProjectCopy
            projectId={project.id}
            sourceId={1}
            field="description"
            blockKey="projects.text.004"
          >
            {project.description ?? ""}
          </ProjectCopy>
        </p>
        {"\n\n        "}
        <ul
          className={
            " mt-5 text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full *:w-8 *:h-8"
          }
          data-aos={"fade-out"}
          data-aos-duration={"80"}
        >
          {editable ? (
            <ProjectStackPicker
              projectId={project.id}
              title={project.title}
              stacks={project.stacks}
              profile={1}
            >
              {project.stacks.map((stack, index) => (
                <Fragment key={stack.id}>
                  <StackSpacing1 index={index} />
                  <StackChip stack={stack} profile={1} />
                </Fragment>
              ))}
            </ProjectStackPicker>
          ) : (
            project.stacks.map((stack, index) => (
              <Fragment key={stack.id}>
                <StackSpacing1 index={index} />
                <StackChip stack={stack} profile={1} />
              </Fragment>
            ))
          )}
          {"\n\n        "}
        </ul>
        {"\n       \n        "}
        <div className={"flex items-center justify-center"}>
          {"\n          "}
          <a
            className={
              "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
            }
            href={project.link ?? project.repoUrl ?? undefined}
            target={"_blank"}
            rel={"noopener noreferrer"}
          >
            {"\n            "}
            <svg
              fill={"#000000"}
              version={"1.1"}
              id={"Layer_1"}
              xmlns={"http://www.w3.org/2000/svg"}
              xmlnsXlink={"http://www.w3.org/1999/xlink"}
              width={"18px"}
              height={"18px"}
              viewBox={"0 0 70 70"}
              enableBackground={"new 0 0 70 70"}
              xmlSpace={"preserve"}
            >
              {"\n              "}
              <g>
                {"\n                "}
                <path
                  d={
                    "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                  }
                />
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n              "}
              </g>
              {"\n            "}
            </svg>
            {"\n            "}
            <p>
              <ProjectCopy
                projectId={project.id}
                sourceId={1}
                field="copy"
                blockKey="projects.text.005"
              >
                {"VISIT"}
              </ProjectCopy>
            </p>
            {"\n          "}
          </a>
          {"\n        "}
        </div>
        {"\n\n       "}
      </div>
      {"\n\n\n\n      "}
      {editable && <ProjectActions project={project} />}
    </div>
  );
}
function Card2({
  project,
  editable,
}: {
  project: ProjectRecord;
  editable: boolean;
}) {
  return (
    <div
      className={
        "grid grid-cols-1 gap-6 text-center rounded border-1 border-cyan-400 md:text-left "
      }
      data-aos={"fade-up"}
      id={project.id === 2 ? "boxTwo" : `project-${project.id}`}
    >
      {"\n      \n  "}
      <ProjectImage
        project={project}
        sourceId={2}
        blockKey="projects.alt.006"
        elementProps={{
          className: "w-full h-auto md:h-[80%] object-cover",
          src: "/myport.png",
          alt: "Personal portfolio project screenshot — built with Tailwind CSS and JavaScript",
        }}
      />
      {"\n\n       "}
      <div className={"flex flex-col gap-6 p-3 "}>
        {"\n        \n        "}
        <h1 className={"text-[20px] uppercase text-cyan-400 "}>
          <ProjectCopy
            projectId={project.id}
            sourceId={2}
            field="title"
            blockKey="projects.text.007"
          >
            {project.title}
          </ProjectCopy>
        </h1>
        {"\n        "}
        <p className={""}>
          <ProjectCopy
            projectId={project.id}
            sourceId={2}
            field="description"
            blockKey="projects.text.008"
          >
            {project.description ?? ""}
          </ProjectCopy>
        </p>
        {"\n        \n        "}
        <ul
          className={
            " text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full *:w-8 *:h-8"
          }
        >
          {editable ? (
            <ProjectStackPicker
              projectId={project.id}
              title={project.title}
              stacks={project.stacks}
              profile={2}
            >
              {project.stacks.map((stack, index) => (
                <Fragment key={stack.id}>
                  <StackSpacing2 index={index} />
                  <StackChip stack={stack} profile={2} />
                </Fragment>
              ))}
            </ProjectStackPicker>
          ) : (
            project.stacks.map((stack, index) => (
              <Fragment key={stack.id}>
                <StackSpacing2 index={index} />
                <StackChip stack={stack} profile={2} />
              </Fragment>
            ))
          )}
          {"\n\n\n\n        "}
        </ul>
        {"\n       \n        "}
        <div className={"flex items-center justify-center"}>
          {"\n          "}
          <a
            className={
              "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
            }
            href={project.link ?? project.repoUrl ?? undefined}
          >
            {"\n            "}
            <svg
              fill={"#000000"}
              version={"1.1"}
              id={"Layer_1"}
              xmlns={"http://www.w3.org/2000/svg"}
              xmlnsXlink={"http://www.w3.org/1999/xlink"}
              width={"18px"}
              height={"18px"}
              viewBox={"0 0 70 70"}
              enableBackground={"new 0 0 70 70"}
              xmlSpace={"preserve"}
            >
              {"\n              "}
              <g>
                {"\n                "}
                <path
                  d={
                    "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                  }
                />
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n              "}
              </g>
              {"\n            "}
            </svg>
            {"\n            "}
            <p>
              <ProjectCopy
                projectId={project.id}
                sourceId={2}
                field="copy"
                blockKey="projects.text.009"
              >
                {"VISIT"}
              </ProjectCopy>
            </p>
            {"\n          "}
          </a>
          {"\n        "}
        </div>
        {"\n\n       "}
      </div>
      {"\n      \n\n      "}
      {editable && <ProjectActions project={project} />}
    </div>
  );
}
function Card3({
  project,
  editable,
}: {
  project: ProjectRecord;
  editable: boolean;
}) {
  return (
    <div
      className={
        "grid grid-cols-1 gap-6 text-center rounded border-1 border-cyan-400 md:text-left lg:translate-y-30"
      }
      data-aos={"fade-up"}
      data-aos-delay={"md:400"}
      id={project.id === 3 ? "boxThree" : `project-${project.id}`}
    >
      {"\n      \n  "}
      <ProjectImage
        project={project}
        sourceId={3}
        blockKey="projects.alt.010"
        elementProps={{
          className: "w-full h-auto md:h-[100%] object-cover",
          src: "/projectimgs/face attendance system.png",
          alt: "Face Attendance System — project screenshot (face recognition, Node.js, Google Sheets)",
        }}
      />
      {"\n\n       "}
      <div className={"flex flex-col gap-6 p-3 pb-4 "}>
        {"\n        \n        "}
        <h1 className={"text-[20px]  uppercase text-cyan-400 "}>
          <ProjectCopy
            projectId={project.id}
            sourceId={3}
            field="title"
            blockKey="projects.text.011"
          >
            {project.title}
          </ProjectCopy>
        </h1>
        {"\n        "}
        <p className={""}>
          <ProjectCopy
            projectId={project.id}
            sourceId={3}
            field="description"
            blockKey="projects.text.012"
          >
            {project.description ?? ""}
          </ProjectCopy>
        </p>
        {"\n        \n        "}
        <ul
          className={
            " text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full"
          }
        >
          {editable ? (
            <ProjectStackPicker
              projectId={project.id}
              title={project.title}
              stacks={project.stacks}
              profile={3}
            >
              {project.stacks.map((stack, index) => (
                <Fragment key={stack.id}>
                  <StackSpacing3 index={index} />
                  <StackChip stack={stack} profile={3} />
                </Fragment>
              ))}
            </ProjectStackPicker>
          ) : (
            project.stacks.map((stack, index) => (
              <Fragment key={stack.id}>
                <StackSpacing3 index={index} />
                <StackChip stack={stack} profile={3} />
              </Fragment>
            ))
          )}
          {"\n\n          \n        "}
        </ul>
        {"\n       \n        "}
        <div className={"flex items-center justify-center"}>
          {"\n          "}
          <a
            className={
              "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
            }
            href={project.link ?? project.repoUrl ?? undefined}
          >
            {"\n            "}
            <svg
              fill={"#000000"}
              version={"1.1"}
              id={"Layer_1"}
              xmlns={"http://www.w3.org/2000/svg"}
              xmlnsXlink={"http://www.w3.org/1999/xlink"}
              width={"18px"}
              height={"18px"}
              viewBox={"0 0 70 70"}
              enableBackground={"new 0 0 70 70"}
              xmlSpace={"preserve"}
            >
              {"\n              "}
              <g>
                {"\n                "}
                <path
                  d={
                    "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                  }
                />
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n              "}
              </g>
              {"\n            "}
            </svg>
            {"\n            "}
            <p>
              <ProjectCopy
                projectId={project.id}
                sourceId={3}
                field="copy"
                blockKey="projects.text.013"
              >
                {"VISIT"}
              </ProjectCopy>
            </p>
            {"\n          "}
          </a>
          {"\n        "}
        </div>
        {"\n\n       "}
      </div>
      {"\n      \n      \n\n      \n\n      "}
      {editable && <ProjectActions project={project} />}
    </div>
  );
}
function Card4({
  project,
  editable,
}: {
  project: ProjectRecord;
  editable: boolean;
}) {
  return (
    <div
      className={
        "grid gap-6  rounded grid-col-1 border-1 md:text-left lg:-translate-y-20"
      }
      data-aos={"fade-up"}
      id={project.id === 4 ? "boxFour" : `project-${project.id}`}
    >
      {"\n  "}
      <ProjectImage
        project={project}
        sourceId={4}
        blockKey="projects.alt.014"
        elementProps={{
          className: "h-auto  ",
          src: "/projectimgs/ncuts.png",
          alt: "NCUTS project screenshot — UI preview",
        }}
      />
      {"\n       \n       "}
      <div
        className={
          "flex flex-col gap-5 p-3 pb-4 text-center md:text-left text-center"
        }
      >
        {"\n\n        "}
        <h1 className={"text-[20px]  text-cyan-400  "}>
          <ProjectCopy
            projectId={project.id}
            sourceId={4}
            field="title"
            blockKey="projects.text.015"
          >
            {project.title}
          </ProjectCopy>
        </h1>
        {"\n        "}
        <p className={"text-center text-base"}>
          <ProjectCopy
            projectId={project.id}
            sourceId={4}
            field="description"
            blockKey="projects.text.016"
          >
            {project.description ?? ""}
          </ProjectCopy>
        </p>
        {"\n        "}
        <p className={" text-base text-left text-yellow-400"}>
          <ProjectCopy
            projectId={project.id}
            sourceId={4}
            field="copy"
            blockKey="projects.text.017"
          >
            {"Core Feautures"}
          </ProjectCopy>
        </p>
        {"\n        "}
        <ul className={"list-disc list-inside text-left"}>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.018"
            >
              {"CRUD enabled"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.019"
            >
              {"Ai integration for booking and hairstyle suggestions"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.020"
            >
              {"Admin Dashboard"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.021"
            >
              {"User Authentication"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.022"
            >
              {"User Management"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.023"
            >
              {"Notification System"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.024"
            >
              {"Analytics"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.025"
            >
              {"SEO Optimized"}
            </ProjectCopy>
          </li>
          {"\n          "}
          <li>
            <ProjectCopy
              projectId={project.id}
              sourceId={4}
              field="copy"
              blockKey="projects.text.026"
            >
              {"Responsive Design"}
            </ProjectCopy>
          </li>
          {"\n        "}
        </ul>
        {"\n\n        "}
        <ul
          className={
            " text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-3 *:bg-gray-900 *:rounded-full"
          }
        >
          {editable ? (
            <ProjectStackPicker
              projectId={project.id}
              title={project.title}
              stacks={project.stacks}
              profile={4}
            >
              {project.stacks.map((stack, index) => (
                <Fragment key={stack.id}>
                  <StackSpacing4 index={index} />
                  <StackChip stack={stack} profile={4} />
                </Fragment>
              ))}
            </ProjectStackPicker>
          ) : (
            project.stacks.map((stack, index) => (
              <Fragment key={stack.id}>
                <StackSpacing4 index={index} />
                <StackChip stack={stack} profile={4} />
              </Fragment>
            ))
          )}
          {"\n\n        "}
        </ul>
        {"\n       \n        "}
        <div className={"flex items-center justify-center"}>
          {"\n          "}
          <a
            className={
              "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
            }
            href={project.link ?? project.repoUrl ?? undefined}
          >
            {"\n            "}
            <svg
              fill={"#000000"}
              version={"1.1"}
              id={"Layer_1"}
              xmlns={"http://www.w3.org/2000/svg"}
              xmlnsXlink={"http://www.w3.org/1999/xlink"}
              width={"18px"}
              height={"18px"}
              viewBox={"0 0 70 70"}
              enableBackground={"new 0 0 70 70"}
              xmlSpace={"preserve"}
            >
              {"\n              "}
              <g>
                {"\n                "}
                <path
                  d={
                    "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                  }
                />
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n                "}
                <g>
                  {"\n                  "}
                  <path
                    d={
                      "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                    }
                  />
                  {"\n                "}
                </g>
                {"\n              "}
              </g>
              {"\n            "}
            </svg>
            {"\n            "}
            <p>
              <ProjectCopy
                projectId={project.id}
                sourceId={4}
                field="copy"
                blockKey="projects.text.027"
              >
                {"VISIT"}
              </ProjectCopy>
            </p>
            {"\n          "}
          </a>
          {"\n        "}
        </div>
        {"\n\n       "}
      </div>
      {"\n\n      "}
      {editable && <ProjectActions project={project} />}
    </div>
  );
}
function StackSpacing1({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <>{"\n          "}</>;
    case 1:
      return <>{"\n\n          "}</>;
    case 2:
      return <>{"\n\n          "}</>;
    case 3:
      return <>{"\n\n          "}</>;
    case 4:
      return <>{"\n\n          "}</>;
    default:
      return <>{"\n          "}</>;
  }
}
function StackSpacing2({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <>{"\n          \n          "}</>;
    case 1:
      return <>{"\n\n          "}</>;
    default:
      return <>{"\n          \n          "}</>;
  }
}
function StackSpacing3({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <>{"\n          "}</>;
    case 1:
      return <>{"\n\n          "}</>;
    case 2:
      return <>{"\n\n          "}</>;
    case 3:
      return <>{"\n\n          "}</>;
    case 4:
      return <>{"\n\n        \n\n          "}</>;
    default:
      return <>{"\n          "}</>;
  }
}
function StackSpacing4({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <>{"\n          "}</>;
    case 1:
      return <>{"\n\n          "}</>;
    case 2:
      return <>{"\n\n          "}</>;
    case 3:
      return <>{"\n\n          "}</>;
    default:
      return <>{"\n          "}</>;
  }
}
