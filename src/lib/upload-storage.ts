import "server-only";
import { head, put, del } from "@vercel/blob";
import { access, mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { ApiError } from "./api-response";
import { blobStorageEnabled } from "./storage-config";
export const UPLOAD_PATH =
  /^\/uploads\/(?:(?:stacks|projects)\/[a-f0-9-]{36}\.png|resumes\/[a-f0-9-]{36}\.pdf)$/;
function pathname(url: string) {
  if (!UPLOAD_PATH.test(url))
    throw new ApiError(400, "VALIDATION", "Invalid uploaded file path.");
  return url.slice(1);
}
export async function writeStoredUpload(
  url: string,
  bytes: Buffer,
  contentType: string,
) {
  const name = pathname(url);
  if (blobStorageEnabled()) {
    await put(name, bytes, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType,
    });
  } else {
    const path = resolve(process.cwd(), "public", name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, { flag: "wx" });
  }
}
export async function storedUploadExists(url: string) {
  const name = pathname(url);
  if (blobStorageEnabled()) {
    const blob = await head(name);
    if (blob.pathname !== name) throw new Error("Unexpected Blob pathname.");
  } else await access(resolve(process.cwd(), "public", name));
}
export async function deleteStoredUpload(url: string) {
  const name = pathname(url);
  if (blobStorageEnabled()) {
    await del(name);
    return;
  }
  try {
    await unlink(resolve(process.cwd(), "public", name));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      throw error;
  }
}
export async function blobUploadUrl(url: string) {
  const name = pathname(url),
    blob = await head(name);
  if (blob.pathname !== name) throw new Error("Unexpected Blob pathname.");
  const parsed = new URL(blob.url);
  if (
    parsed.protocol !== "https:" ||
    !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname)
  )
    throw new Error("Unexpected Blob host.");
  return blob.url;
}
