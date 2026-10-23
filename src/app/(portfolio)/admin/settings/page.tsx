import SettingsManager from "../../../../components/portfolio/SettingsManager";
import { getSiteSettings } from "../../../../lib/settings-store";
import { listStackRecords } from "../../../../lib/stack-store";
import { bundledStackIcons } from "../../../../lib/stack-icons";
export default async function Page() {
  const [initial, stacks] = await Promise.all([
    getSiteSettings(),
    listStackRecords(),
  ]);
  return (
    <SettingsManager
      initial={initial}
      icons={Array.from(
        new Map(
          [
            ...bundledStackIcons,
            ...stacks.map((s) => ({ name: s.name, svgPath: s.svgPath })),
          ].map((s) => [s.svgPath, s]),
        ).values(),
      )}
    />
  );
}
