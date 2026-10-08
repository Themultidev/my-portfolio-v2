import "server-only";

type Counter = { count: number; expiresAt: number };
type LimitOptions = {
  accountLimit?: number;
  accountWindowMs?: number;
  globalLimit?: number;
  globalWindowMs?: number;
  maxAccounts?: number;
};

export class LoginRateLimiter {
  private accounts = new Map<string, Counter>();
  private global: Counter = { count: 0, expiresAt: 0 };
  private options: Required<LimitOptions>;

  constructor(options: LimitOptions = {}) {
    this.options = {
      accountLimit: 5,
      accountWindowMs: 15 * 60_000,
      globalLimit: 60,
      globalWindowMs: 60_000,
      maxAccounts: 1000,
      ...options,
    };
  }

  attempt(key: string, nowMs = Date.now()) {
    for (const [name, counter] of this.accounts) {
      if (counter.expiresAt <= nowMs) this.accounts.delete(name);
    }
    if (this.global.expiresAt <= nowMs) {
      this.global = {
        count: 0,
        expiresAt: nowMs + this.options.globalWindowMs,
      };
    }
    if (this.global.count >= this.options.globalLimit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((this.global.expiresAt - nowMs) / 1000),
        ),
      };
    }
    this.global.count++;
    let account = this.accounts.get(key);
    if (!account) {
      if (this.accounts.size >= this.options.maxAccounts) {
        const earliest = Math.min(
          ...[...this.accounts.values()].map(({ expiresAt }) => expiresAt),
        );
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((earliest - nowMs) / 1000)),
        };
      }
      account = { count: 0, expiresAt: nowMs + this.options.accountWindowMs };
      this.accounts.set(key, account);
    }
    if (account.count >= this.options.accountLimit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((account.expiresAt - nowMs) / 1000),
        ),
      };
    }
    account.count++;
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

const limiterGlobal = globalThis as typeof globalThis & {
  portfolioLoginLimiter?: LoginRateLimiter;
};
export const loginRateLimiter = (limiterGlobal.portfolioLoginLimiter ??=
  new LoginRateLimiter());
