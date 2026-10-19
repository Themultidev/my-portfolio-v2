import "server-only";
import { randomUUID } from "node:crypto";
import {
  writeStoredUpload,
  storedUploadExists,
  deleteStoredUpload,
} from "./upload-storage";
import { ApiError } from "./api-response";
export const RESUME_PATH = /^\/uploads\/resumes\/[a-f0-9-]{36}\.pdf$/;
export async function storeResume(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (
    bytes.length > 5 * 1024 * 1024 ||
    bytes.length < 8 ||
    bytes.subarray(0, 5).toString() !== "%PDF-" ||
    !bytes.subarray(-1024).includes(Buffer.from("%%EOF"))
  )
    throw new ApiError(
      400,
      "VALIDATION",
      "Choose a PDF résumé no larger than 5 MB.",
    );
  const filename = `${randomUUID()}.pdf`;
  const url = `/uploads/resumes/${filename}`;
  await writeStoredUpload(url, bytes, "application/pdf");
  return url;
}
export async function requireResumeFile(value: string) {
  if (!RESUME_PATH.test(value))
    throw new ApiError(400, "VALIDATION", "Upload a PDF résumé first.");
  try {
    await storedUploadExists(value);
  } catch {
    throw new ApiError(
      400,
      "VALIDATION",
      "This résumé upload is unavailable. Upload it again.",
    );
  }
}
export async function removeResumeFile(value: string) {
  if (!RESUME_PATH.test(value)) return;
  try {
    await deleteStoredUpload(value);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      throw error;
  }
}
