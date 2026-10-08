import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";

export default async function AdminPage() {
  if (!(await getSession())) redirect("/login");
  redirect("/admin/projects");
}
