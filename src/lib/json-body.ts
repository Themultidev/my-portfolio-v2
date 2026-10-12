import "server-only";
import { ApiError } from "./api-response";

export const MAX_JSON_BYTES = 64 * 1024;

function invalidBody(message: string) {
  return new ApiError(400, "VALIDATION", message, { body: [message] });
}

/** Bound actual streamed bytes; Content-Length is not a trusted size limit. */
export async function readJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BYTES,
): Promise<unknown> {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json")
    throw invalidBody("Send a JSON body with Content-Type application/json.");

  const reader = request.body?.getReader();
  if (!reader) throw invalidBody("Send a JSON request body.");

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let contents = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes)
        throw invalidBody(
          `JSON request bodies must be at most ${maxBytes} bytes.`,
        );
      contents += decoder.decode(value, { stream: true });
    }
    contents += decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof ApiError) throw error;
    throw invalidBody("The request body must contain valid UTF-8 JSON.");
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(contents) as unknown;
  } catch {
    throw invalidBody("The request body must contain valid JSON.");
  }
}
