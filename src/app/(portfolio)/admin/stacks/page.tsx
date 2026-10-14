import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { listStackRecords } from "../../../../lib/stack-store";
import StackManager from "../../../../components/stacks/StackManager";
import manifest from "../../../../../prisma/seed-data.json";
export default async function AdminStacksPage() {
  if (!(await getSession())) redirect("/login");
  return (
    <StackManager
      initialStacks={await listStackRecords()}
      icons={manifest.stacks.map(({ name, svgPath }) => ({ name, svgPath }))}
    />
  );
}
