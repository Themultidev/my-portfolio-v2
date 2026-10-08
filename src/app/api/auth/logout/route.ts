import { NextResponse } from "next/server";
import { getAuthConfig, isTrustedOrigin } from "../../../../lib/auth-config";
import {
  requireSession,
  sessionCookieName,
  sessionCookieOptions,
} from "../../../../lib/auth";
import {
  authFailure,
  unexpectedAuthFailure,
} from "../../../../lib/auth-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const config = getAuthConfig();
    await requireSession(request);
    if (!isTrustedOrigin(request, config))
      return authFailure(403, "ORIGIN", "Request origin is not allowed.");
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(sessionCookieName(config), "", {
      ...sessionCookieOptions(config),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return unexpectedAuthFailure(error);
  }
}
