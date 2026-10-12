import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function apiFailure(error: ApiError | AuthError) {
  return apiJson(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ApiError && error.fields
          ? { fields: error.fields }
          : {}),
      },
    },
    error.status,
  );
}

export function unexpectedApiFailure(error: unknown) {
  if (error instanceof ApiError || error instanceof AuthError)
    return apiFailure(error);
  // Database diagnostics can contain connection details or supplied values.
  return apiFailure(
    new ApiError(
      503,
      "UNAVAILABLE",
      "The request could not be completed. Try again later.",
    ),
  );
}
