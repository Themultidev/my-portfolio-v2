import MobileNavigation from "./MobileNavigation";
import DesktopNavigation from "./DesktopNavigation";
import Home from "./Home";
import About from "./About";
import Projects from "./Projects";
import Contact from "./Contact";
import Footer from "./Footer";
import PortfolioEffects from "../PortfolioEffects";
import type { ProjectRecord } from "../../lib/project-types";
import NearbyProjects from "../projects/NearbyProjects";

export default function PortfolioContent({
  editable = false,
  projects,
}: {
  editable?: boolean;
  projects: ProjectRecord[];
}) {
  return (
    <>
      <MobileNavigation />
      <DesktopNavigation />
      <Home />
      <About />
      {!editable && <NearbyProjects />}
      <Projects projects={projects} editable={editable} />
      <Contact />
      <Footer />
      <PortfolioEffects editable={editable} />
    </>
  );
}
