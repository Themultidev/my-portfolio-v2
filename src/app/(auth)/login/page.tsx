import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "../../../components/auth/LoginForm";
import { getSession } from "../../../lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getSession()) redirect("/admin/edit/portfolio");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-lg border border-cyan-400 p-6 md:p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-cyan-400">
          Admin sign in
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
