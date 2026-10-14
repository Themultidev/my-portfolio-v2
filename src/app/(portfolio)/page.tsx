import PortfolioContent from "../../components/portfolio/PortfolioContent";
import EditModeProvider from "../../components/editor/EditModeProvider";
import { getContentBlocks } from "../../lib/content";
import { getProjectRecords } from "../../lib/projects";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [blocks, projects] = await Promise.all([
    getContentBlocks(),
    getProjectRecords(),
  ]);
  return (
    <EditModeProvider blocks={blocks} editable={false}>
      <PortfolioContent
        projects={projects.filter(({ published }) => published)}
      />
    </EditModeProvider>
  );
}
