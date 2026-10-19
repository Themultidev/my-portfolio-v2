export function blobStorageEnabled(
  environment: Partial<NodeJS.ProcessEnv> = process.env,
) {
  if (environment.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  if (environment.VERCEL === "1")
    throw new Error(
      "BLOB_READ_WRITE_TOKEN must be configured on Vercel. Connect a public Blob store to this project.",
    );
  return false;
}
