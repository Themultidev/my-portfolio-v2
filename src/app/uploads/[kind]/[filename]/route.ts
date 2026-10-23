import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { blobStorageEnabled } from "../../../../lib/storage-config";
import { blobUploadUrl } from "../../../../lib/upload-storage";
import { BlobNotFoundError } from "@vercel/blob";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; filename: string }> },
) {
  const { kind, filename } = await context.params;
  const resume = kind === "resumes";
  const music = kind === "music";
  if (
    !["stacks", "projects", "resumes", "music"].includes(kind) ||
    !(
      music
        ? /^[a-f0-9-]{36}\.(mp3|wav|ogg|m4a)$/
        : resume
          ? /^[a-f0-9-]{36}\.pdf$/
          : /^[a-f0-9-]{36}\.png$/
    ).test(filename)
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
    const audioTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    };
    const headers: Record<string, string> = {
      "Content-Type": music
        ? audioTypes[filename.split(".").pop()!]
        : resume
          ? "application/pdf"
          : "image/png",
      ...(resume
        ? { "Content-Disposition": 'inline; filename="resume.pdf"' }
        : {}),
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };
    if (music) {
      headers["Accept-Ranges"] = "bytes";
      const range = request.headers.get("range");
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2]))
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${bytes.length}` },
          });
        const start = match[1]
          ? Number(match[1])
          : Math.max(0, bytes.length - Number(match[2]));
        const end =
          match[1] && match[2]
            ? Math.min(Number(match[2]), bytes.length - 1)
            : bytes.length - 1;
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start < 0 ||
          start > end ||
          start >= bytes.length
        )
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${bytes.length}` },
          });
        headers["Content-Range"] = `bytes ${start}-${end}/${bytes.length}`;
        headers["Content-Length"] = String(end - start + 1);
        return new Response(new Uint8Array(bytes.subarray(start, end + 1)), {
          status: 206,
          headers,
        });
      }
    }
    return new Response(new Uint8Array(bytes), {
      headers,
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
