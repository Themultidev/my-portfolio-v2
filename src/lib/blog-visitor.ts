import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAuthConfig, isTrustedOrigin } from "./auth-config";
import { ApiError } from "./api-response";
import type { Prisma } from "@prisma/client";
const COOKIE = "blog-visitor";
function digest(value: string) {
  return createHmac("sha256", getAuthConfig().secret)
    .update(`blog:${value}`)
    .digest("hex");
}
export async function visitor(create = false) {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value ?? "";
  const [id, signature] = value.split(".");
  if (
    /^[a-f0-9]{48}$/.test(id ?? "") &&
    /^[a-f0-9]{64}$/.test(signature ?? "") &&
    timingSafeEqual(Buffer.from(digest(id)), Buffer.from(signature))
  )
    return digest(`visitor:${id}`);
  if (!create) return null;
  const next = randomBytes(24).toString("hex");
  jar.set(COOKIE, `${next}.${digest(next)}`, {
    httpOnly: true,
    secure: getAuthConfig().secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 31536000,
  });
  return digest(`visitor:${next}`);
}
export function engagementOrigin(request: Request) {
  if (!isTrustedOrigin(request, getAuthConfig()))
    throw new ApiError(403, "ORIGIN", "Request origin is not allowed.");
}
export async function consume(
  tx: Prisma.TransactionClient,
  hash: string,
  kind: "comment" | "like",
) {
  const now = new Date();
  const hour = new Date(Math.floor(now.getTime() / 3600000) * 3600000);
  // Database-backed increments serialize across serverless instances and include a global ceiling.
  for (const [key, max] of [
    [`${kind}:${hash}`, kind === "comment" ? 6 : 100],
    [`${kind}:global`, kind === "comment" ? 300 : 3000],
  ] as const) {
    await tx.blogActionLimit.upsert({
      where: { key },
      create: { key, count: 0, windowStart: hour },
      update: {},
    });
    await tx.blogActionLimit.updateMany({
      where: { key, windowStart: { lt: hour } },
      data: { count: 0, windowStart: hour },
    });
    const allowed = await tx.blogActionLimit.updateMany({
      where: { key, count: { lt: max } },
      data: { count: { increment: 1 } },
    });
    if (!allowed.count)
      throw new ApiError(
        429,
        "RATE_LIMIT",
        "Please wait before posting again.",
      );
  }
  await tx.blogActionLimit.deleteMany({
    where: { windowStart: { lt: new Date(hour.getTime() - 86400000) } },
  });
}
