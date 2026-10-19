import { z } from "zod";
import { requireSession } from "../../../lib/auth";
import { stackMutation } from "../../../lib/stack-store";
import {
  ApiError,
  apiJson,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import {
  historyStatus,
  replayHistory,
  restoreDefaults,
} from "../../../lib/portfolio-history";
import { readJsonBody } from "../../../lib/json-body";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireSession(request);
    return apiJson(await historyStatus());
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    const input = z
      .discriminatedUnion("action", [
        z
          .object({
            action: z.enum(["undo", "redo"]),
            version: z.number().int().nonnegative(),
          })
          .strict(),
        z
          .object({
            action: z.literal("defaults"),
            confirmation: z.literal("RESTORE ORIGINAL PORTFOLIO"),
          })
          .strict(),
      ])
      .safeParse(await readJsonBody(request));
    if (!input.success)
      throw new ApiError(
        400,
        "VALIDATION",
        "Choose undo, redo or confirm restoring the original portfolio.",
      );
    if (input.data.action === "defaults") await restoreDefaults();
    else await replayHistory(input.data.action, input.data.version);
    return apiJson({ ok: true, ...(await historyStatus()) });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
