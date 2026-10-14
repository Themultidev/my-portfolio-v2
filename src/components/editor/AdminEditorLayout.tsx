import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { getContentBlocks } from "../../lib/content";
import LogoutButton from "../auth/LogoutButton";
import EditModeProvider from "./EditModeProvider";
import AdminToolbar from "./AdminToolbar";

export default async function AdminEditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await getSession())) redirect("/login");
  const blocks = await getContentBlocks(true);

  return (
    <EditModeProvider blocks={blocks} editable={true}>
      {children}
      <AdminToolbar />
      <LogoutButton />
    </EditModeProvider>
  );
}
