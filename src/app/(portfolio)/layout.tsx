import type { ReactNode } from "react";
import PortfolioHead from "../../components/portfolio/PortfolioHead";
import "../../style.css";
import "../../theme.css";
import { themeScript } from "../../components/portfolio/ThemeToggle";
import "aos/dist/aos.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PortfolioHead />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="portfolio-body">{children}</body>
    </html>
  );
}
