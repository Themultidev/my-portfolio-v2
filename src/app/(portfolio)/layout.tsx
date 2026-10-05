import type { ReactNode } from "react";
import PortfolioHead from "../../components/portfolio/PortfolioHead";
import "../../style.css";
import "aos/dist/aos.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <PortfolioHead />
      </head>
      <body className="  bg-[#000000] shadow-xl   text-white py-5   ">
        {children}
      </body>
    </html>
  );
}
