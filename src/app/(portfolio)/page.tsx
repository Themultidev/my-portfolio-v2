import PortfolioContent from "../../components/portfolio/PortfolioContent";
import EditModeProvider from "../../components/editor/EditModeProvider";
import { getContentBlocks } from "../../lib/content";
import { getProjectRecords } from "../../lib/projects";
import BlogMusic from "../../components/portfolio/BlogMusic";
import { getSiteSettings } from "../../lib/settings-store";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [blocks, projects, settings] = await Promise.all([
    getContentBlocks(),
    getProjectRecords(),
    getSiteSettings(),
  ]);
  return (
    <EditModeProvider blocks={blocks} editable={false}>
      <PortfolioContent
        projects={projects.filter(({ published }) => published)}
      />
      <BlogMusic music={settings.music} />
    </EditModeProvider>
  );
}
