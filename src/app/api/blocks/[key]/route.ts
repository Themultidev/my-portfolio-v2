import { Prisma } from "@prisma/client";
import { requireSession } from "../../../../lib/auth";
import { getAuthConfig, isTrustedOrigin } from "../../../../lib/auth-config";
import {
  ApiError,
  apiFailure,
  apiJson,
  unexpectedApiFailure,
} from "../../../../lib/api-response";
import {
  contentKeySchema,
  contentPatchSchema,
} from "../../../../lib/content-validation";
import { db } from "../../../../lib/db";
import { readJsonBody } from "../../../../lib/json-body";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    // Check the live account here even when Proxy already accepted the signature.
    await requireSession(request);
    if (!isTrustedOrigin(request, getAuthConfig()))
      throw new ApiError(403, "ORIGIN", "Request origin is not allowed.");

    const key = contentKeySchema.safeParse((await context.params).key);
    if (!key.success)
      throw new ApiError(400, "VALIDATION", "Invalid content key.", {
        key: key.error.issues.map((issue) => issue.message),
      });

    const patch = contentPatchSchema.safeParse(await readJsonBody(request));
    if (!patch.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of patch.error.issues) {
        const field = issue.path[0] === "value" ? "value" : "body";
        const message =
          field === "value"
            ? issue.message
            : issue.code === "unrecognized_keys"
              ? "Send only the value field."
              : "Send a JSON object with a value string.";
        (fields[field] ??= []).push(message);
      }
      throw new ApiError(400, "VALIDATION", "Invalid content update.", fields);
    }

    const block = await db.contentBlock.update({
      where: { key: key.data },
      data: { value: patch.data.value },
      select: { key: true, value: true, label: true, updatedAt: true },
    });
    return apiJson({ block });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      return apiFailure(
        new ApiError(404, "NOT_FOUND", "Content block was not found."),
      );
    return unexpectedApiFailure(error);
  }
}
