import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import { getAuthConfig } from "./auth-config";
import { sessionMatchesAdmin, verifySessionToken } from "./session-token";
import { readSessionCookie } from "./session-cookie";
export { sessionCookieName, sessionCookieOptions } from "./session-cookie";

export class AuthError extends Error {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
  constructor() {
    super("Sign in to continue.");
  }
}

export async function getSession(
  request?: Request,
): Promise<{ id: number; email: string } | null> {
  const config = getAuthConfig();
  const requestHeaders = request?.headers ?? (await headers());
  const claims = verifySessionToken(
    readSessionCookie(requestHeaders, config),
    config.secret,
  );
  if (!claims) return null;
  const admin = await db.admin.findUnique({ where: { id: claims.adminId } });
  if (!admin || !sessionMatchesAdmin(claims, admin, config.secret)) return null;
  return { id: admin.id, email: admin.email };
}

export async function requireSession(request?: Request) {
  const session = await getSession(request);
  if (!session) throw new AuthError();
  return session;
}
