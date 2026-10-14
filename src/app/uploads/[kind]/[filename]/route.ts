import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; filename: string }> },
) {
  const { kind, filename } = await context.params;
  if (
    !["stacks", "projects"].includes(kind) ||
    !/^[a-f0-9-]{36}\.png$/.test(filename)
  )
    return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(
      resolve(process.cwd(), "public", "uploads", kind, filename),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const missing =
      error instanceof Error && "code" in error && error.code === "ENOENT";
    return new Response(missing ? "Not found" : "Image unavailable", {
      status: missing ? 404 : 503,
    });
  }
}
