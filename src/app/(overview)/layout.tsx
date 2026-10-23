import type { ReactNode } from "react";
import OverviewHead from "../../components/overview/OverviewHead";
import "../../style.css";
import "../../theme.css";
import { themeScript } from "../../components/portfolio/ThemeToggle";

export default function OverviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OverviewHead />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased">{children}</body>
    </html>
  );
}
