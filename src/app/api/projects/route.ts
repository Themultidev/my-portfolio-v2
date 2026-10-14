import { requireSession } from "../../../lib/auth";
import { getAuthConfig, isTrustedOrigin } from "../../../lib/auth-config";
import {
  ApiError,
  apiJson,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { readJsonBody } from "../../../lib/json-body";
import {
  createProject,
  listProjects,
  listProjectStacks,
} from "../../../lib/project-store";
import { projectCreateSchema } from "../../../lib/project-validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const [projects, stacks] = await Promise.all([
      listProjects(),
      listProjectStacks(),
    ]);
    return apiJson({ projects, stacks });
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSession(request);
    if (!isTrustedOrigin(request, getAuthConfig()))
      throw new ApiError(403, "ORIGIN", "Request origin is not allowed.");

    const input = projectCreateSchema.safeParse(await readJsonBody(request));
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
      throw new ApiError(400, "VALIDATION", "Invalid project.", fields);
    }
    const project = await createProject(input.data);
    return apiJson({ project }, 201);
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
