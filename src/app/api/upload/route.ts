import {
  ApiError,
  apiJson,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { stackMutation } from "../../../lib/stack-store";
import { readImageForm, storeImage } from "../../../lib/image-upload";
import { storeResume } from "../../../lib/resume-upload";
import { requireSession } from "../../../lib/auth";
import { blobStorageEnabled } from "../../../lib/storage-config";
import { isUploadKind } from "../../../lib/upload-kinds";
import { readJsonBody } from "../../../lib/json-body";
import { readStagingFile, discardStagingFile } from "../../../lib/blob-staging";
import { z } from "zod";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    return apiJson({
      provider: blobStorageEnabled() ? "blob" : "local",
      adminId: session.id,
    });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    const kind = new URL(request.url).searchParams.get("kind") ?? "project";
    if (!isUploadKind(kind))
      throw new ApiError(
        400,
        "VALIDATION",
        "Choose a stack, project, or résumé upload.",
      );
    let stagingPath: string | undefined;
    let file: File;
    if (
      (request.headers.get("content-type") ?? "").startsWith("application/json")
    ) {
      if (!blobStorageEnabled())
        throw new ApiError(400, "VALIDATION", "Blob uploads are not enabled.");
      const input = z
        .object({ stagingPath: z.string().max(256) })
        .strict()
        .safeParse(await readJsonBody(request));
      if (!input.success)
        throw new ApiError(400, "VALIDATION", "Invalid staged upload.");
      const session = await requireSession(request);
      stagingPath = input.data.stagingPath;
      file = await readStagingFile(stagingPath, session.id, kind);
    } else file = await readImageForm(request);
    const url =
      kind === "resume"
        ? await storeResume(file)
        : await storeImage(Buffer.from(await file.arrayBuffer()), kind);
    if (stagingPath) {
      try {
        await discardStagingFile(stagingPath);
      } catch {
        console.error("Staged upload cleanup failed.");
      }
    }
    return apiJson({ url }, 201);
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
