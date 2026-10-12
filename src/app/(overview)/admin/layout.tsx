import type { ReactNode } from "react";
import AdminEditorLayout from "../../../components/editor/AdminEditorLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminEditorLayout>{children}</AdminEditorLayout>;
}
