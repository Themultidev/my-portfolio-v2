import type { ReactNode } from "react";
import OverviewHead from "../../components/overview/OverviewHead";
import "../../style.css";

export default function OverviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <OverviewHead />
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased">{children}</body>
    </html>
  );
}
