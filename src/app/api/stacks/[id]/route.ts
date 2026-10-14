import { apiJson } from "../../../../lib/api-response";
import {
  deleteStack,
  saveStack,
  stackFailure,
  stackId,
  stackMutation,
} from "../../../../lib/stack-store";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    await stackMutation(request);
    return apiJson({
      stack: await saveStack(request, stackId((await context.params).id)),
    });
  } catch (error) {
    return stackFailure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await stackMutation(request);
    return apiJson({
      deletedId: await deleteStack(stackId((await context.params).id)),
    });
  } catch (error) {
    return stackFailure(error);
  }
}
