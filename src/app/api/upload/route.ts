import {
  ApiError,
  apiJson,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { stackMutation } from "../../../lib/stack-store";
import { readImageForm, storeImage } from "../../../lib/image-upload";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    const kind = new URL(request.url).searchParams.get("kind") ?? "project";
    if (kind !== "stack" && kind !== "project")
      throw new ApiError(
        400,
        "VALIDATION",
        "Choose a stack or project upload.",
      );
    const file = await readImageForm(request);
    const url = await storeImage(Buffer.from(await file.arrayBuffer()), kind);
    return apiJson({ url }, 201);
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
