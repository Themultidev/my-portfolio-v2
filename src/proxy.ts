import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, isTrustedOrigin } from "./lib/auth-config";
import { verifySessionToken } from "./lib/session-token";
import { readSessionCookie } from "./lib/session-cookie";

export function proxy(request: NextRequest) {
  const config = getAuthConfig();
  const claims = verifySessionToken(
    readSessionCookie(request.headers, config),
    config.secret,
  );
  const api = request.nextUrl.pathname.startsWith("/api/");
  if (!claims) {
    if (api)
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (
    api &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !isTrustedOrigin(request, config)
  ) {
    return NextResponse.json(
      { error: { code: "ORIGIN", message: "Request origin is not allowed." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/blocks/:path*",
    "/api/projects/:path*",
    "/api/stacks/:path*",
    "/api/upload/:path*",
  ],
};
