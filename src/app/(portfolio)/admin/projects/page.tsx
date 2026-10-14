import { redirect } from "next/navigation";
import PortfolioEffects from "../../../../components/PortfolioEffects";
import Projects from "../../../../components/portfolio/Projects";
import { getSession } from "../../../../lib/auth";
import { getProjectRecords } from "../../../../lib/projects";

export default async function AdminProjectsPage() {
  if (!(await getSession())) redirect("/login");

  return (
    <>
      <Projects projects={await getProjectRecords()} editable />
      <PortfolioEffects editable />
    </>
  );
}
