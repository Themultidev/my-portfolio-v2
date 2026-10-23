import type { ReactNode } from "react";
import "../../style.css";
import "../../theme.css";
import { themeScript } from "../../components/portfolio/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[#000000] text-white">{children}</body>
    </html>
  );
}
