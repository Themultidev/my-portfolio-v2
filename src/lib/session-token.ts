import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const SESSION_TTL_SECONDS = 8 * 60 * 60;
const claimsSchema = z.strictObject({
  version: z.literal(1),
  adminId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  issuedAt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  expiresAt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  credentialVersion: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
export type SessionClaims = z.infer<typeof claimsSchema>;
type AdminIdentity = { id: number; passwordHash: string };

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`portfolio-session-v1:${payload}`)
    .digest("base64url");
}

function credentialVersion(admin: AdminIdentity, secret: string) {
  return createHmac("sha256", secret)
    .update(`portfolio-admin-v1:${admin.id}:${admin.passwordHash}`)
    .digest("base64url");
}

export function createSessionToken(
  admin: AdminIdentity,
  secret: string,
  nowMs = Date.now(),
): string {
  const issuedAt = Math.floor(nowMs / 1000);
  const claims = claimsSchema.parse({
    version: 1,
    adminId: admin.id,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS,
    credentialVersion: credentialVersion(admin, secret),
  });
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): SessionClaims | null {
  if (!token || token.length > 2048) return null;
  const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const [, payload, supplied] = match;
  const expected = signature(payload, secret);
  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)))
    return null;
  const bytes = Buffer.from(payload, "base64url");
  if (bytes.toString("base64url") !== payload) return null;
  try {
    const parsed = claimsSchema.safeParse(JSON.parse(bytes.toString("utf8")));
    if (!parsed.success) return null;
    const claims = parsed.data;
    const now = Math.floor(nowMs / 1000);
    if (
      claims.issuedAt > now ||
      claims.expiresAt <= now ||
      claims.expiresAt - claims.issuedAt !== SESSION_TTL_SECONDS
    )
      return null;
    return claims;
  } catch {
    return null;
  }
}

export function sessionMatchesAdmin(
  claims: SessionClaims,
  admin: AdminIdentity,
  secret: string,
): boolean {
  if (
    claims.adminId !== admin.id ||
    !/^[A-Za-z0-9_-]{43}$/.test(claims.credentialVersion)
  )
    return false;
  const expected = credentialVersion(admin, secret);
  return timingSafeEqual(
    Buffer.from(claims.credentialVersion),
    Buffer.from(expected),
  );
}
