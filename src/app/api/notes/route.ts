import { randomUUID } from "node:crypto";
import { z } from "zod";
import { stackMutation } from "../../../lib/stack-store";
import {
  apiJson,
  ApiError,
  unexpectedApiFailure,
} from "../../../lib/api-response";
import { readJsonBody } from "../../../lib/json-body";
import { portfolioTransaction } from "../../../lib/portfolio-history";
export async function POST(request: Request) {
  try {
    await stackMutation(request);
    const input = z
      .object({ value: z.string().trim().min(1).max(2000) })
      .strict()
      .safeParse(await readJsonBody(request));
    if (!input.success)
      throw new ApiError(
        400,
        "VALIDATION",
        "Write a note of 1–2,000 characters.",
      );
    const block = await portfolioTransaction("Add about note", async (tx) => {
      if (
        (await tx.contentBlock.count({
          where: { key: { startsWith: "about.note." } },
        })) >= 30
      )
        throw new ApiError(400, "LIMIT", "Keep up to 30 notes.");
      return tx.contentBlock.create({
        data: {
          key: `about.note.${randomUUID()}`,
          value: input.data.value,
          label: "About note",
        },
      });
    });
    return apiJson({ block }, 201);
  } catch (error) {
    return unexpectedApiFailure(error);
  }
}
