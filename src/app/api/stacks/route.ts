import { requireSession } from "../../../lib/auth";
import { apiJson } from "../../../lib/api-response";
import {
  listStackRecords,
  saveStack,
  stackFailure,
  stackMutation,
} from "../../../lib/stack-store";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireSession(request);
    return apiJson({ stacks: await listStackRecords() });
  } catch (error) {
    return stackFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    return apiJson({ stack: await saveStack(request) }, 201);
  } catch (error) {
    return stackFailure(error);
  }
}
