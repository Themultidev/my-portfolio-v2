"use client";
import { MAX_UPLOAD_BYTES, type UploadKind } from "./upload-kinds";
async function json(response: Response) {
  const body = await response.json();
  if (!response.ok)
    throw new Error(body?.error?.message ?? "Upload failed. Try again.");
  return body;
}
export async function uploadPortfolioFile(file: File, kind: UploadKind) {
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error("Choose a file no larger than 5 MB.");
  const config = await json(
    await fetch("/api/upload", {
      credentials: "same-origin",
      signal: AbortSignal.timeout(30_000),
    }),
  );
  let response: Response;
  if (config.provider === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const path = `portfolio-staging/${config.adminId}/${kind}/${crypto.randomUUID()}.bin`;
    const blob = await upload(path, file, {
      access: "public",
      handleUploadUrl: "/api/blob-upload",
      contentType: "application/octet-stream",
    });
    response = await fetch(`/api/upload?kind=${kind}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stagingPath: blob.pathname }),
      signal: AbortSignal.timeout(60_000),
    });
  } else {
    const form = new FormData();
    form.append("file", file);
    response = await fetch(`/api/upload?kind=${kind}`, {
      method: "POST",
      body: form,
      credentials: "same-origin",
      signal: AbortSignal.timeout(30_000),
    });
  }
  const body = await json(response);
  if (typeof body.url !== "string")
    throw new Error("Unable to confirm the upload. Try again.");
  return body.url as string;
}
