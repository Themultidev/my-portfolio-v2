import { stackMutation } from "../../../../lib/stack-store";
import {
  apiJson,
  ApiError,
  unexpectedApiFailure,
} from "../../../../lib/api-response";
import { portfolioTransaction } from "../../../../lib/portfolio-history";
export async function DELETE(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    await stackMutation(request);
    const { key } = await context.params;
    if (!/^about\.note\.[a-f0-9-]{36}$/.test(key))
      throw new ApiError(400, "VALIDATION", "Invalid note.");
    await portfolioTransaction("Remove about note", (tx) =>
      tx.contentBlock.deleteMany({ where: { key } }),
    );
    return apiJson({ ok: true });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
