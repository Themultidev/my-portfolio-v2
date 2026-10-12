import OverviewContent from "../../../components/overview/OverviewContent";
import EditModeProvider from "../../../components/editor/EditModeProvider";
import { getContentBlocks } from "../../../lib/content";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const blocks = await getContentBlocks();
  return (
    <EditModeProvider blocks={blocks} editable={false}>
      <OverviewContent />
    </EditModeProvider>
  );
}
