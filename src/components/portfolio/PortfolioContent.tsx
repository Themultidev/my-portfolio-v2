import MobileNavigation from "./MobileNavigation";
import DesktopNavigation from "./DesktopNavigation";
import Home from "./Home";
import About from "./About";
import Projects from "./Projects";
import Contact from "./Contact";
import Footer from "./Footer";
import PortfolioEffects from "../PortfolioEffects";

export default function PortfolioContent({
  editable = false,
}: {
  editable?: boolean;
}) {
  return (
    <>
      <MobileNavigation />
      <DesktopNavigation />
      <Home />
      <About />
      <Projects />
      <Contact />
      <Footer />
      <PortfolioEffects editable={editable} />
    </>
  );
}
