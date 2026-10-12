import PortfolioContent from "../../components/portfolio/PortfolioContent";
import EditModeProvider from "../../components/editor/EditModeProvider";
import { getContentBlocks } from "../../lib/content";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const blocks = await getContentBlocks();
  return (
    <EditModeProvider blocks={blocks} editable={false}>
      <PortfolioContent />
    </EditModeProvider>
  );
}
