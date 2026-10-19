import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { getAuthConfig, isTrustedOrigin } from "../../src/lib/auth-config";
import {
  SESSION_TTL_SECONDS,
  createSessionToken,
  sessionMatchesAdmin,
  verifySessionToken,
} from "../../src/lib/session-token";
import { LoginRateLimiter } from "../../src/lib/login-rate-limit";

const secret = "auth-test-secret-at-least-32-bytes-long";
const nowMs = 1_800_000_000_000;
const admin = { id: 7, passwordHash: "$2b$12$test-password-hash" };
const productionEnvironment = {
  NODE_ENV: "production",
  SESSION_SECRET: secret,
  APP_ORIGIN: "https://portfolio.example",
  ADMIN_EMAIL: "admin@example.invalid",
  ADMIN_PASSWORD: "test-admin-password-only",
};

test("auth configuration requires a secret measured in UTF-8 bytes", () => {
  for (const SESSION_SECRET of [undefined, "", "a".repeat(31)]) {
    assert.throws(
      () => getAuthConfig({ NODE_ENV: "development", SESSION_SECRET }),
      /SESSION_SECRET/,
    );
  }
  const unicodeSecret = "\u{1f512}".repeat(8);
  assert.equal(Buffer.byteLength(unicodeSecret), 32);
  assert.equal(
    getAuthConfig({ NODE_ENV: "development", SESSION_SECRET: unicodeSecret })
      .secret,
    unicodeSecret,
  );
});

test("development permits local origins without admin credentials", () => {
  const config = getAuthConfig({
    NODE_ENV: "development",
    SESSION_SECRET: secret,
  });
  assert.equal(config.origin, null);
  assert.equal(config.secureCookies, false);
  for (const origin of [
    "http://localhost:3000",
    "http://127.0.0.1:3100",
    "http://[::1]:3200",
  ]) {
    assert.equal(
      isTrustedOrigin(
        new Request(`${origin}/api/login`, { headers: { origin } }),
        config,
      ),
      true,
    );
  }
  for (const origin of [
    "http://portfolio.example",
    "http://localhost.attacker.example",
    "http://127.0.0.2:3100",
  ]) {
    assert.equal(
      isTrustedOrigin(
        new Request(`${origin}/api/login`, { headers: { origin } }),
        config,
      ),
      false,
    );
  }
});

test("a configured app origin binds browser requests and controls secure cookies", () => {
  const config = getAuthConfig(productionEnvironment);
  assert.equal(config.origin, "https://portfolio.example");
  assert.equal(config.secureCookies, true);
  assert.equal(
    isTrustedOrigin(
      new Request("https://portfolio.example/api/login", {
        headers: { origin: "https://portfolio.example" },
      }),
      config,
    ),
    true,
  );
  for (const origin of [
    undefined,
    "null",
    "http://portfolio.example",
    "https://portfolio.example.attacker.invalid",
    "https://portfolio.example:444",
    "https://portfolio.example/path",
  ]) {
    const headers = new Headers();
    if (origin !== undefined) headers.set("origin", origin);
    assert.equal(
      isTrustedOrigin(
        new Request("https://portfolio.example/api/login", { headers }),
        config,
      ),
      false,
    );
  }
});

test("origin rejection logs the runtime comparison without credentials or attacker-controlled paths", (context) => {
  const warning = context.mock.method(console, "warn", () => {});
  const config = getAuthConfig(productionEnvironment);
  const request = (origin?: string) =>
    new Request(
      "https://deployment.example/api/login?token=private-query-value",
      {
        method: "POST",
        headers: {
          ...(origin === undefined ? {} : { origin }),
          cookie: "session=private-cookie-value",
          authorization: "Bearer private-token-value",
        },
        body: "private-body-value",
      },
    );
  assert.equal(isTrustedOrigin(request(config.origin!), config), true);
  assert.equal(warning.mock.callCount(), 0);
  assert.equal(
    isTrustedOrigin(request("https://preview.example"), config),
    false,
  );
  assert.deepEqual(warning.mock.calls[0].arguments, [
    "[auth-origin]",
    {
      expectedOrigin: "https://portfolio.example",
      receivedOrigin: "https://preview.example",
      requestOrigin: "https://deployment.example",
    },
  ]);
  assert.equal(isTrustedOrigin(request(), config), false);
  assert.equal(isTrustedOrigin(request("null"), config), false);
  assert.equal(
    isTrustedOrigin(
      request(
        "https://user:private-password@attacker.example/private-path?key=private-query",
      ),
      config,
    ),
    false,
  );
  assert.equal(warning.mock.calls[1].arguments[1].receivedOrigin, "<missing>");
  assert.equal(warning.mock.calls[2].arguments[1].receivedOrigin, "null");
  assert.equal(warning.mock.calls[3].arguments[1].receivedOrigin, "<invalid>");
  const output = JSON.stringify(
    warning.mock.calls.map((call) => call.arguments),
  );
  for (const hidden of [
    secret,
    productionEnvironment.ADMIN_PASSWORD,
    "private-",
    "authorization",
    "cookie",
  ])
    assert.ok(!output.includes(hidden));
});

test("request forwarding headers cannot expand the development origin allowlist", () => {
  const config = getAuthConfig({
    NODE_ENV: "development",
    SESSION_SECRET: secret,
  });
  assert.equal(
    isTrustedOrigin(
      new Request("http://localhost:3000/api/login", {
        headers: {
          origin: "https://attacker.invalid",
          "x-forwarded-host": "attacker.invalid",
          "x-forwarded-proto": "https",
          host: "attacker.invalid",
        },
      }),
      config,
    ),
    false,
  );
  assert.equal(
    isTrustedOrigin(
      new Request("https://attacker.invalid/api/login", {
        headers: {
          origin: "https://attacker.invalid",
          "x-forwarded-host": "localhost:3000",
        },
      }),
      config,
    ),
    false,
  );
});

test("app origin configuration rejects URLs carrying paths, credentials or insecure public hosts", () => {
  for (const APP_ORIGIN of [
    undefined,
    "https://portfolio.example/",
    "https://portfolio.example/login",
    "https://portfolio.example?mode=edit",
    "https://portfolio.example#login",
    "https://user:password@portfolio.example",
    "http://portfolio.example",
    "ftp://portfolio.example",
    "not-a-url",
  ]) {
    assert.throws(
      () => getAuthConfig({ ...productionEnvironment, APP_ORIGIN }),
      /APP_ORIGIN/,
    );
  }
  for (const APP_ORIGIN of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ]) {
    const config = getAuthConfig({ ...productionEnvironment, APP_ORIGIN });
    assert.equal(config.origin, APP_ORIGIN);
    assert.equal(config.secureCookies, true);
  }
});

test("production validates admin credentials without including their values in errors", () => {
  for (const credentials of [
    { ADMIN_EMAIL: undefined },
    { ADMIN_EMAIL: "invalid-private-email-value" },
    { ADMIN_PASSWORD: undefined },
    { ADMIN_PASSWORD: "short-only" },
    { ADMIN_PASSWORD: "long-private-password-".repeat(5) },
    { ADMIN_PASSWORD: "\u{1f512}".repeat(19) },
  ]) {
    assert.throws(
      () => getAuthConfig({ ...productionEnvironment, ...credentials }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /ADMIN_EMAIL|ADMIN_PASSWORD/);
        for (const value of Object.values(credentials)) {
          if (value) assert.equal(error.message.includes(value), false);
        }
        return true;
      },
    );
  }
  assert.doesNotThrow(() =>
    getAuthConfig({
      ...productionEnvironment,
      ADMIN_PASSWORD: "\u{1f512}".repeat(18),
    }),
  );
});

test("sessions have an eight-hour lifetime and contain only signed identity metadata", () => {
  assert.equal(SESSION_TTL_SECONDS, 8 * 60 * 60);
  const token = createSessionToken(admin, secret, nowMs);
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);
  assert.ok(token.length < 2048);
  const claims = verifySessionToken(token, secret, nowMs);
  assert.ok(claims);
  assert.equal(claims.version, 1);
  assert.equal(claims.adminId, admin.id);
  assert.equal(claims.issuedAt, Math.floor(nowMs / 1000));
  assert.equal(claims.expiresAt, claims.issuedAt + SESSION_TTL_SECONDS);
  assert.equal(typeof claims.credentialVersion, "string");
  const payload = Buffer.from(token.split(".")[0], "base64url").toString(
    "utf8",
  );
  assert.equal(payload.includes(admin.passwordHash), false);
  assert.equal(payload.includes(secret), false);
  assert.deepEqual(Object.keys(JSON.parse(payload)).sort(), [
    "adminId",
    "credentialVersion",
    "expiresAt",
    "issuedAt",
    "version",
  ]);
  assert.equal(sessionMatchesAdmin(claims, admin, secret), true);
  assert.equal(sessionMatchesAdmin(claims, { ...admin, id: 8 }, secret), false);
  assert.equal(
    sessionMatchesAdmin(
      claims,
      { ...admin, passwordHash: "$2b$12$changed-hash" },
      secret,
    ),
    false,
  );
  assert.equal(sessionMatchesAdmin(claims, admin, `${secret}-other`), false);
});

test("sessions expire at the exact deadline and cannot be used before their issue time", () => {
  const token = createSessionToken(admin, secret, nowMs);
  assert.ok(
    verifySessionToken(token, secret, nowMs + SESSION_TTL_SECONDS * 1000 - 1),
  );
  assert.equal(
    verifySessionToken(token, secret, nowMs + SESSION_TTL_SECONDS * 1000),
    null,
  );
  assert.equal(verifySessionToken(token, secret, nowMs - 1000), null);
});

test("session verification rejects changed identities, signatures, secrets and malformed encodings", () => {
  const token = createSessionToken(admin, secret, nowMs);
  const [payload, mac] = token.split(".");
  const alteredClaims = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  );
  alteredClaims.adminId = 999;
  const alteredPayload = Buffer.from(JSON.stringify(alteredClaims)).toString(
    "base64url",
  );
  const alteredMac = `${mac[0] === "A" ? "B" : "A"}${mac.slice(1)}`;
  for (const invalid of [
    undefined,
    "",
    "nonsense",
    `${payload}.${alteredMac}`,
    `${alteredPayload}.${mac}`,
    `${token}.extra`,
    `${payload}=.${mac}`,
    `${payload}.${mac}=`,
    `${payload}.${mac.slice(1)}`,
    `${payload}.${"!".repeat(43)}`,
    "a".repeat(2049),
  ]) {
    assert.equal(verifySessionToken(invalid, secret, nowMs), null);
  }
  assert.equal(verifySessionToken(token, `${secret}-different`, nowMs), null);
});

test("correctly signed sessions still require a strict and valid claims schema", () => {
  const token = createSessionToken(admin, secret, nowMs);
  const claims = JSON.parse(
    Buffer.from(token.split(".")[0], "base64url").toString("utf8"),
  );
  function signedPayload(payload: string) {
    const signature = createHmac("sha256", secret)
      .update(`portfolio-session-v1:${payload}`)
      .digest("base64url");
    return `${payload}.${signature}`;
  }
  function signedClaims(value: unknown) {
    return signedPayload(
      Buffer.from(JSON.stringify(value)).toString("base64url"),
    );
  }
  const mutations = [
    { ...claims, version: 2 },
    { ...claims, adminId: 0 },
    { ...claims, adminId: -1 },
    { ...claims, adminId: 1.5 },
    { ...claims, adminId: Number.MAX_SAFE_INTEGER + 1 },
    { ...claims, adminId: "7" },
    { ...claims, issuedAt: 0, expiresAt: SESSION_TTL_SECONDS },
    { ...claims, issuedAt: -1, expiresAt: SESSION_TTL_SECONDS - 1 },
    {
      ...claims,
      issuedAt: claims.issuedAt + 0.5,
      expiresAt: claims.expiresAt + 0.5,
    },
    {
      ...claims,
      issuedAt: claims.issuedAt + 1,
      expiresAt: claims.expiresAt + 1,
    },
    { ...claims, issuedAt: null },
    { ...claims, expiresAt: claims.expiresAt - 1 },
    { ...claims, expiresAt: claims.expiresAt + 1 },
    { ...claims, expiresAt: Number.MAX_SAFE_INTEGER + 1 },
    { ...claims, credentialVersion: "" },
    { ...claims, credentialVersion: "!".repeat(43) },
    { ...claims, credentialVersion: 123 },
    { ...claims, passwordHash: admin.passwordHash },
    { adminId: admin.id },
    [claims],
    null,
  ];
  for (const mutation of mutations) {
    assert.equal(
      verifySessionToken(signedClaims(mutation), secret, nowMs),
      null,
      JSON.stringify(mutation),
    );
  }
  const payload = token.split(".")[0];
  assert.equal(
    verifySessionToken(signedPayload(`${payload}=`), secret, nowMs),
    null,
  );
  const badJsonPayload = Buffer.from("{not valid json}").toString("base64url");
  assert.equal(
    verifySessionToken(signedPayload(badJsonPayload), secret, nowMs),
    null,
  );
});

test("session signatures enforce canonical base64url and a session-specific HMAC purpose", () => {
  const token = createSessionToken(admin, secret, nowMs);
  const [payload, signature] = token.split(".");
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const lastCharacter = alphabet.indexOf(signature.at(-1)!);
  const alternate = `${signature.slice(0, -1)}${alphabet[lastCharacter + 1]}`;
  assert.deepEqual(
    Buffer.from(alternate, "base64url"),
    Buffer.from(signature, "base64url"),
  );
  assert.equal(
    verifySessionToken(`${payload}.${alternate}`, secret, nowMs),
    null,
  );
  const wrongPurposeSignature = createHmac("sha256", secret)
    .update(`portfolio-admin-v1:${payload}`)
    .digest("base64url");
  assert.equal(
    verifySessionToken(`${payload}.${wrongPurposeSignature}`, secret, nowMs),
    null,
  );
});

test("account attempt limits cover the full window without a successful-login reset", () => {
  const limiter = new LoginRateLimiter({
    accountLimit: 2,
    accountWindowMs: 10_000,
    globalLimit: 100,
    globalWindowMs: 60_000,
    maxAccounts: 10,
  });
  assert.deepEqual(limiter.attempt("admin@example.invalid", nowMs), {
    allowed: true,
    retryAfterSeconds: 0,
  });
  assert.deepEqual(limiter.attempt("admin@example.invalid", nowMs + 1000), {
    allowed: true,
    retryAfterSeconds: 0,
  });
  assert.deepEqual(limiter.attempt("admin@example.invalid", nowMs + 1500), {
    allowed: false,
    retryAfterSeconds: 9,
  });
  assert.equal(
    limiter.attempt("other@example.invalid", nowMs + 1500).allowed,
    true,
  );
  assert.equal(
    limiter.attempt("admin@example.invalid", nowMs + 9999).allowed,
    false,
  );
  assert.equal(
    limiter.attempt("admin@example.invalid", nowMs + 10_000).allowed,
    true,
  );
});

test("a global budget limits distinct account guesses before expensive password checks", () => {
  const limiter = new LoginRateLimiter({
    accountLimit: 10,
    accountWindowMs: 60_000,
    globalLimit: 3,
    globalWindowMs: 20_000,
    maxAccounts: 20,
  });
  for (const account of ["one", "two", "three"]) {
    assert.equal(limiter.attempt(account, nowMs).allowed, true);
  }
  assert.deepEqual(limiter.attempt("four", nowMs + 1000), {
    allowed: false,
    retryAfterSeconds: 19,
  });
  assert.equal(limiter.attempt("five", nowMs + 19_999).allowed, false);
  assert.equal(limiter.attempt("six", nowMs + 20_000).allowed, true);
});

test("bounded account storage refuses churn instead of evicting a throttled account", () => {
  const limiter = new LoginRateLimiter({
    accountLimit: 1,
    accountWindowMs: 10_000,
    globalLimit: 100,
    globalWindowMs: 60_000,
    maxAccounts: 2,
  });
  assert.equal(limiter.attempt("admin", nowMs).allowed, true);
  assert.equal(limiter.attempt("second", nowMs).allowed, true);
  for (let index = 0; index < 10; index++) {
    assert.equal(limiter.attempt(`new-${index}`, nowMs + 1000).allowed, false);
  }
  assert.equal(limiter.attempt("admin", nowMs + 1000).allowed, false);
  assert.equal(limiter.attempt("third", nowMs + 10_000).allowed, true);
});
