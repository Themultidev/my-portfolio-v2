import { createHash } from "node:crypto";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { getAuthConfig, isTrustedOrigin } from "../../../../lib/auth-config";
import { sessionCookieName, sessionCookieOptions } from "../../../../lib/auth";
import {
  authFailure,
  unexpectedAuthFailure,
} from "../../../../lib/auth-response";
import { loginRateLimiter } from "../../../../lib/login-rate-limit";
import { createSessionToken } from "../../../../lib/session-token";
import {
  INJECTION_MESSAGE,
  isInjectionProbe,
} from "../../../../lib/injection-probe";

export const runtime = "nodejs";
const loginSchema = z.strictObject({
  email: z.string().max(254).trim().toLowerCase().email(),
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});
// Valid cost-12 bcrypt hash for comparable work when the email is unknown.
const dummyHash =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxHylGaSPVKrrJOjrTMB.YuQpLa";

async function boundedJson(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  try {
    const config = getAuthConfig();
    if (!isTrustedOrigin(request, config))
      return authFailure(403, "ORIGIN", "Request origin is not allowed.");
    const raw = await boundedJson(request);
    const input = loginSchema.safeParse(raw);
    // Invalid requests share a rate-limit bucket; all accepted origins consume
    // the global limit before any potentially expensive password comparison.
    const key = input.success
      ? createHash("sha256").update(input.data.email).digest("hex")
      : "invalid-input";
    const limit = loginRateLimiter.attempt(key);
    if (!limit.allowed) {
      const response = authFailure(
        429,
        "RATE_LIMIT",
        "Too many sign-in attempts. Try again later.",
      );
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }
    if (!input.success) {
      if (
        raw &&
        typeof raw === "object" &&
        (isInjectionProbe(raw.email) || isInjectionProbe(raw.password))
      )
        return authFailure(400, "INJECTION_PROBE", INJECTION_MESSAGE);
      return authFailure(
        400,
        "VALIDATION",
        "Enter a valid email and password (at most 72 UTF-8 bytes).",
      );
    }
    const admin = await db.admin.findUnique({
      where: { email: input.data.email },
    });
    const matches = await compare(
      input.data.password,
      admin?.passwordHash ?? dummyHash,
    );
    if (!admin || !matches) {
      if (
        isInjectionProbe(input.data.email) ||
        isInjectionProbe(input.data.password)
      )
        return authFailure(400, "INJECTION_PROBE", INJECTION_MESSAGE);
      return authFailure(401, "CREDENTIALS", "Email or password is incorrect.");
    }
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      sessionCookieName(config),
      createSessionToken(admin, config.secret),
      sessionCookieOptions(config),
    );
    return response;
  } catch (error) {
    return unexpectedAuthFailure(error);
  }
}
