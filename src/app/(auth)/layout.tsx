import type { ReactNode } from "react";
import "../../style.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#000000] text-white">{children}</body>
    </html>
  );
}
