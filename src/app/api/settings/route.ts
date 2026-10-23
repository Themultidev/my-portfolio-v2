import {
  apiJson,
  ApiError,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { stackMutation } from "../../../lib/stack-store";
import { getSiteSettings } from "../../../lib/settings-store";
import { settingsSchema, SETTINGS_KEY } from "../../../lib/site-settings";
import { readJsonBody } from "../../../lib/json-body";
import { portfolioTransaction } from "../../../lib/portfolio-history";
import { storedUploadExists } from "../../../lib/upload-storage";
import { bundledStackIcons } from "../../../lib/stack-icons";
export async function GET() {
  try {
    return apiJson({ settings: await getSiteSettings() });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    await stackMutation(request);
    const input = settingsSchema.safeParse(await readJsonBody(request));
    if (!input.success)
      throw new ApiError(400, "VALIDATION", input.error.issues[0].message);
    if (
      input.data.skills.some(
        (s) =>
          s.iconPath.startsWith("/stacks/") &&
          !bundledStackIcons.some((icon) => icon.svgPath === s.iconPath),
      )
    )
      throw new ApiError(
        400,
        "VALIDATION",
        "Choose an existing bundled icon or upload your own.",
      );
    for (const path of [
      ...input.data.skills.map((s) => s.iconPath),
      input.data.music.source,
    ].filter((p) => p.startsWith("/uploads/")))
      await storedUploadExists(path);
    const value = JSON.stringify(input.data);
    await portfolioTransaction("Edit skills and site settings", (tx) =>
      tx.contentBlock.upsert({
        where: { key: SETTINGS_KEY },
        create: { key: SETTINGS_KEY, value, label: "Site settings" },
        update: { value },
      }),
    );
    return apiJson({ settings: input.data });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
