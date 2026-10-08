import "server-only";
import type { AuthConfig } from "./auth-config";
import { SESSION_TTL_SECONDS } from "./session-token";

export function sessionCookieName(config: AuthConfig) {
  return config.secureCookies
    ? "__Host-portfolio_session"
    : "portfolio_session";
}

export function sessionCookieOptions(config: AuthConfig) {
  return {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function readSessionCookie(
  headers: Headers,
  config: AuthConfig,
): string | undefined {
  const raw = headers.get("cookie") ?? "";
  if (raw.length > 8192) return undefined;
  const name = sessionCookieName(config);
  const matches = raw
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  return matches.length === 1 ? matches[0].slice(name.length + 1) : undefined;
}
