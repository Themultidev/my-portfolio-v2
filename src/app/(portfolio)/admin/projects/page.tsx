import { redirect } from "next/navigation";
import PortfolioEffects from "../../../../components/PortfolioEffects";
import Projects from "../../../../components/portfolio/Projects";
import { getSession } from "../../../../lib/auth";

export default async function AdminProjectsPage() {
  if (!(await getSession())) redirect("/login");

  return (
    <>
      <Projects />
      <PortfolioEffects />
    </>
  );
}
