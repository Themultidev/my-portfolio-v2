import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function authFailure(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function unexpectedAuthFailure(error: unknown) {
  if (error instanceof AuthError)
    return authFailure(401, error.code, error.message);
  return authFailure(
    503,
    "UNAVAILABLE",
    "Sign-in is temporarily unavailable. Try again later.",
  );
}
