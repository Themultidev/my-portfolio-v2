import { redirect } from "next/navigation";
import OverviewContent from "../../../../../components/overview/OverviewContent";
import { getSession } from "../../../../../lib/auth";

export default async function AdminOverviewPage() {
  if (!(await getSession())) redirect("/login");
  return <OverviewContent />;
}
