import { z } from "zod";
import { stackMutation } from "../../../../lib/stack-store";
import { portfolioTransaction } from "../../../../lib/portfolio-history";
import {
  ApiError,
  apiJson,
  unexpectedApiFailure,
} from "../../../../lib/api-response";
import { readJsonBody } from "../../../../lib/json-body";
import { isSiteLinkKey, siteLinkKeys } from "../../../../lib/site-links";
import { requireResumeFile } from "../../../../lib/resume-upload";
export const runtime = "nodejs";
type Context = { params: Promise<{ key: string }> };
const input = z.object({ value: z.string().trim().max(2048) }).strict();
async function mutate(request: Request, context: Context, deleting: boolean) {
  try {
    await stackMutation(request);
    const { key } = await context.params;
    if (!isSiteLinkKey(key))
      throw new ApiError(404, "NOT_FOUND", "Unknown site link.");
    const resume = key === siteLinkKeys.resume;
    if (deleting && !resume)
      throw new ApiError(405, "METHOD", "Only the résumé can be removed.");
    const parsed = deleting
      ? { success: true as const, data: { value: "" } }
      : input.safeParse(await readJsonBody(request));
    if (!parsed.success)
      throw new ApiError(400, "VALIDATION", "Enter a valid link.");
    const value = parsed.data.value;
    if (resume && value) await requireResumeFile(value);
    if (!resume) {
      let safe = false;
      try {
        const url = new URL(value);
        safe =
          /^https?:\/\//i.test(value) &&
          ["https:", "http:"].includes(url.protocol) &&
          !url.username &&
          !url.password &&
          !/[\\\u0000-\u001f\u007f]/.test(value);
      } catch {}
      if (!safe)
        throw new ApiError(
          400,
          "VALIDATION",
          "Enter a complete HTTP or HTTPS profile URL.",
        );
    }
    const block = await portfolioTransaction(
      resume ? "Change résumé" : "Edit profile link",
      async (transaction) => {
        const saved = await transaction.contentBlock.upsert({
          where: { key },
          create: {
            key,
            value,
            label: resume
              ? "Résumé PDF"
              : key === siteLinkKeys.x
                ? "X profile URL"
                : "LinkedIn profile URL",
          },
          update: { value },
        });
        return saved;
      },
    );
    // Keep previous files available while undo history can restore their links.
    return apiJson({ block });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
export const PATCH = (request: Request, context: Context) =>
  mutate(request, context, false);
export const DELETE = (request: Request, context: Context) =>
  mutate(request, context, true);
