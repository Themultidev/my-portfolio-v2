import "server-only";
import { db } from "./db";
import { parseSettings, SETTINGS_KEY } from "./site-settings";
export async function getSiteSettings() {
  const block = await db.contentBlock.findUnique({
    where: { key: SETTINGS_KEY },
  });
  return parseSettings(block?.value);
}
