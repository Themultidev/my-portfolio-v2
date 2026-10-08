import { z } from "zod";

export type AuthConfig = {
  secret: string;
  origin: string | null;
  secureCookies: boolean;
};

function isLoopback(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

export function getAuthConfig(
  environment: Record<string, string | undefined> = process.env,
): AuthConfig {
  const production = environment.NODE_ENV === "production";
  const secret = environment.SESSION_SECRET;
  if (!secret?.trim() || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 UTF-8 bytes. Run npm run auth:setup.",
    );
  }
  if (production) {
    const admin = z
      .object({
        ADMIN_EMAIL: z.string().trim().email(),
        ADMIN_PASSWORD: z
          .string()
          .min(12)
          .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
      })
      .safeParse(environment);
    if (!admin.success) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be configured with valid seed credentials in production.",
      );
    }
  }
  const configured = environment.APP_ORIGIN?.trim();
  if (!configured && production) {
    throw new Error("APP_ORIGIN must be configured in production.");
  }
  let origin: string | null = null;
  if (configured) {
    let parsed: URL;
    try {
      parsed = new URL(configured);
    } catch {
      throw new Error(
        "APP_ORIGIN must be a valid HTTP(S) origin without a path.",
      );
    }
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== configured ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      (production &&
        parsed.protocol !== "https:" &&
        !isLoopback(parsed.hostname))
    ) {
      throw new Error(
        "APP_ORIGIN must be an exact HTTPS origin (local HTTP is allowed for loopback only).",
      );
    }
    origin = parsed.origin;
  }
  return {
    secret,
    origin,
    secureCookies: production || origin?.startsWith("https:") === true,
  };
}

export function isTrustedOrigin(request: Request, config: AuthConfig): boolean {
  const supplied = request.headers.get("origin");
  if (!supplied || supplied === "null") return false;
  if (config.origin) return supplied === config.origin;
  // Development fallback is limited to literal local hosts. Forwarded headers
  // never define the trusted origin; production always has a fixed APP_ORIGIN.
  const target = new URL(request.url);
  return (
    ["http:", "https:"].includes(target.protocol) &&
    isLoopback(target.hostname) &&
    supplied === target.origin
  );
}
