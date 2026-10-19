import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { blobStorageEnabled } from "../../../../lib/storage-config";
import { blobUploadUrl } from "../../../../lib/upload-storage";
import { BlobNotFoundError } from "@vercel/blob";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; filename: string }> },
) {
  const { kind, filename } = await context.params;
  const resume = kind === "resumes";
  if (
    !["stacks", "projects", "resumes"].includes(kind) ||
    !(resume ? /^[a-f0-9-]{36}\.pdf$/ : /^[a-f0-9-]{36}\.png$/).test(filename)
  )
    return new Response("Not found", { status: 404 });
  try {
    if (blobStorageEnabled())
      return Response.redirect(
        await blobUploadUrl(`/uploads/${kind}/${filename}`),
        307,
      );
    const bytes = await readFile(
      resolve(process.cwd(), "public", "uploads", kind, filename),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": resume ? "application/pdf" : "image/png",
        ...(resume
          ? { "Content-Disposition": 'inline; filename="resume.pdf"' }
          : {}),
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const missing =
      error instanceof BlobNotFoundError ||
      (error instanceof Error && "code" in error && error.code === "ENOENT");
    return new Response(missing ? "Not found" : "Image unavailable", {
      status: missing ? 404 : 503,
    });
  }
}
