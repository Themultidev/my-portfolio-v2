import MobileNavigation from "../../components/portfolio/MobileNavigation";
import DesktopNavigation from "../../components/portfolio/DesktopNavigation";
import Home from "../../components/portfolio/Home";
import About from "../../components/portfolio/About";
import Projects from "../../components/portfolio/Projects";
import Contact from "../../components/portfolio/Contact";
import Footer from "../../components/portfolio/Footer";
import PortfolioEffects from "../../components/PortfolioEffects";

export default function PortfolioPage() {
  return (
    <>
      <MobileNavigation />
      <DesktopNavigation />
      <Home />
      <About />
      <Projects />
      <Contact />
      <Footer />
      <PortfolioEffects />
    </>
  );
}
