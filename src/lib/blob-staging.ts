import "server-only";
import { head, del } from "@vercel/blob";
import { ApiError } from "./api-response";
import {
  maxUploadBytes,
  validStagingPath,
  type UploadKind,
} from "./upload-kinds";
export async function readStagingFile(
  path: string,
  adminId: number,
  kind: UploadKind,
) {
  if (!validStagingPath(path, adminId, kind))
    throw new ApiError(400, "VALIDATION", "Upload this file again.");
  const blob = await head(path);
  if (
    blob.pathname !== path ||
    blob.contentType !== "application/octet-stream" ||
    blob.size > maxUploadBytes(kind) ||
    blob.size <= 0
  )
    throw new ApiError(400, "VALIDATION", "Invalid staged upload.");
  const url = new URL(blob.url);
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) ||
    decodeURIComponent(url.pathname) !== `/${path}`
  )
    throw new ApiError(400, "VALIDATION", "Invalid staged upload location.");
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok || !response.body)
    throw new ApiError(400, "VALIDATION", "The uploaded file is unavailable.");
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > maxUploadBytes(kind)) {
        await reader.cancel();
        throw new ApiError(
          400,
          "VALIDATION",
          "The uploaded file exceeds the size limit.",
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size !== blob.size)
    throw new ApiError(
      400,
      "VALIDATION",
      "Incomplete staged upload. Upload it again.",
    );
  return new File([new Uint8Array(Buffer.concat(chunks))], "upload.bin", {
    type: "application/octet-stream",
  });
}
export async function discardStagingFile(path: string) {
  await del(path);
}
