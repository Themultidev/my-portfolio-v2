import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { listStackRecords } from "../../../../lib/stack-store";
import StackManager from "../../../../components/stacks/StackManager";
import { bundledStackIcons } from "../../../../lib/stack-icons";
export default async function AdminStacksPage() {
  if (!(await getSession())) redirect("/login");
  return (
    <StackManager
      initialStacks={await listStackRecords()}
      icons={bundledStackIcons}
    />
  );
}
