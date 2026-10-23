import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "./api-response";
import { writeStoredUpload } from "./upload-storage";
export function audioFormat(bytes: Buffer) {
  if (bytes.length < 12) return null;
  if (
    bytes.subarray(0, 3).toString() === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  )
    return { ext: "mp3", type: "audio/mpeg" };
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WAVE"
  )
    return { ext: "wav", type: "audio/wav" };
  if (bytes.subarray(0, 4).toString() === "OggS")
    return { ext: "ogg", type: "audio/ogg" };
  if (
    bytes.subarray(4, 8).toString() === "ftyp" &&
    /^(M4A |M4B |isom|mp42)/.test(bytes.subarray(8, 12).toString())
  )
    return { ext: "m4a", type: "audio/mp4" };
  return null;
}
export async function storeMusic(file: File) {
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new ApiError(400, "VALIDATION", "Choose an audio file up to 20 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const format = audioFormat(bytes);
  if (!format)
    throw new ApiError(
      400,
      "VALIDATION",
      "Choose a valid MP3, WAV, OGG or M4A file.",
    );
  const url = `/uploads/music/${randomUUID()}.${format.ext}`;
  await writeStoredUpload(url, bytes, format.type);
  return url;
}
