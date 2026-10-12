import { redirect } from "next/navigation";
import PortfolioContent from "../../../../../components/portfolio/PortfolioContent";
import { getSession } from "../../../../../lib/auth";

export default async function AdminPortfolioPage() {
  if (!(await getSession())) redirect("/login");
  return <PortfolioContent editable={true} />;
}
