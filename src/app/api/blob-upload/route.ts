import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { stackMutation } from "../../../lib/stack-store";
import { requireSession } from "../../../lib/auth";
import {
  ApiError,
  apiJson,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { readJsonBody } from "../../../lib/json-body";
import { blobStorageEnabled } from "../../../lib/storage-config";
import {
  maxUploadBytes,
  validStagingPath,
  type UploadKind,
} from "../../../lib/upload-kinds";
import { z } from "zod";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    const input = z
      .object({
        type: z.literal("blob.generate-client-token"),
        payload: z
          .object({
            pathname: z.string().max(256),
            clientPayload: z.string().nullable().optional(),
            multipart: z.boolean().optional(),
          })
          .strict(),
      })
      .strict()
      .safeParse(await readJsonBody(request));
    if (!input.success)
      throw new ApiError(400, "VALIDATION", "Invalid upload request.");
    const body = input.data as HandleUploadBody;
    if (!blobStorageEnabled())
      throw new ApiError(400, "VALIDATION", "Blob uploads are not enabled.");
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (path) => {
        const session = await requireSession(request);
        if (!validStagingPath(path, session.id))
          throw new ApiError(400, "VALIDATION", "Invalid upload destination.");
        return {
          allowedContentTypes: ["application/octet-stream"],
          maximumSizeInBytes: maxUploadBytes(path.split("/")[2] as UploadKind),
          validUntil: Date.now() + 5 * 60_000,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
        };
      },
      // No webhook is needed: the authenticated finalize API validates and publishes.
    });
    return apiJson(result);
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
