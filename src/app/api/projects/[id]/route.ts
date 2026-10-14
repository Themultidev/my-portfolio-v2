import { Prisma } from "@prisma/client";
import { requireSession } from "../../../../lib/auth";
import { getAuthConfig, isTrustedOrigin } from "../../../../lib/auth-config";
import {
  ApiError,
  apiFailure,
  apiJson,
  unexpectedApiFailure,
} from "../../../../lib/api-response";
import { readJsonBody } from "../../../../lib/json-body";
import {
  deleteProject,
  getProject,
  updateProject,
} from "../../../../lib/project-store";
import {
  projectIdSchema,
  projectPatchSchema,
} from "../../../../lib/project-validation";

export const runtime = "nodejs";

type ProjectContext = { params: Promise<{ id: string }> };

async function readId(context: ProjectContext): Promise<number> {
  const id = projectIdSchema.safeParse((await context.params).id);
  if (!id.success)
    throw new ApiError(400, "VALIDATION", "Invalid project ID.", {
      id: id.error.issues.map((issue) => issue.message),
    });
  return id.data;
}

function projectFailure(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  )
    return apiFailure(new ApiError(404, "NOT_FOUND", "Project was not found."));
  return unexpectedApiFailure(error);
}

export async function GET(request: Request, context: ProjectContext) {
  try {
    await requireSession(request);
    const project = await getProject(await readId(context));
    return apiJson({ project });
  } catch (error) {
    return projectFailure(error);
  }
}

export async function PATCH(request: Request, context: ProjectContext) {
  try {
    await requireSession(request);
    if (!isTrustedOrigin(request, getAuthConfig()))
      throw new ApiError(403, "ORIGIN", "Request origin is not allowed.");

    const id = await readId(context);
    const input = projectPatchSchema.safeParse(await readJsonBody(request));
    if (!input.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of input.error.issues) {
        const field = String(issue.path[0] ?? "body");
        (fields[field] ??= []).push(
          issue.code === "unrecognized_keys"
            ? "Send only supported project fields."
            : issue.message,
        );
      }
      throw new ApiError(400, "VALIDATION", "Invalid project update.", fields);
    }
    const project = await updateProject(id, input.data);
    return apiJson({ project });
  } catch (error) {
    return projectFailure(error);
  }
}

export async function DELETE(request: Request, context: ProjectContext) {
  try {
    await requireSession(request);
    if (!isTrustedOrigin(request, getAuthConfig()))
      throw new ApiError(403, "ORIGIN", "Request origin is not allowed.");
    const deletedId = await deleteProject(await readId(context));
    return apiJson({ deletedId });
  } catch (error) {
    return projectFailure(error);
  }
}
