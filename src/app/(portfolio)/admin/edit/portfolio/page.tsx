import { redirect } from "next/navigation";
import PortfolioContent from "../../../../../components/portfolio/PortfolioContent";
import { getSession } from "../../../../../lib/auth";
import { getProjectRecords } from "../../../../../lib/projects";

export default async function AdminPortfolioPage() {
  if (!(await getSession())) redirect("/login");
  return (
    <PortfolioContent projects={await getProjectRecords()} editable={true} />
  );
}
