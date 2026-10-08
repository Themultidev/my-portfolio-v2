import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import LogoutButton from "../../../components/auth/LogoutButton";
import { getSession } from "../../../lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await getSession())) redirect("/login");

  return (
    <>
      {children}
      <LogoutButton />
    </>
  );
}
