import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type RateEntry = {
  count: number;
  resetAt: number;
};

type RateDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
};

export type FirstPartyCookieBoundaryOptions = {
  codePrefix: string;
  windowMs?: number;
  ipMax?: number;
  accountMax?: number;
  maxKeys?: number;
  now?: () => number;
};

export class FirstPartyCookieBoundaryError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = "FirstPartyCookieBoundaryError";
  }
}

const positiveInteger = (
  value: number | undefined,
  fallback: number,
): number =>
  Number.isFinite(value) && Number(value) > 0
    ? Math.floor(Number(value))
    : fallback;

class BoundedFixedWindowRateGate {
  private readonly entries = new Map<string, RateEntry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys: number,
    private readonly now: () => number,
  ) {}

  take(key: string): RateDecision {
    const now = this.now();
    let entry = this.entries.get(key);
    if (!entry || entry.resetAt <= now) {
      if (!entry && this.entries.size >= this.maxKeys) {
        this.sweep(now);
        if (this.entries.size >= this.maxKeys) {
          const oldestKey = this.entries.keys().next().value as
            string | undefined;
          if (oldestKey) this.entries.delete(oldestKey);
        }
      }
      entry = {
        count: 0,
        resetAt: now + this.windowMs,
      };
      this.entries.set(key, entry);
    }
    entry.count += 1;
    const allowed = entry.count <= this.limit;
    return {
      allowed,
      limit: this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      resetAt: entry.resetAt,
      retryAfterMs: allowed ? 0 : Math.max(0, entry.resetAt - now),
    };
  }

  private sweep(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}

const setRateHeaders = (
  res: Response,
  decision: RateDecision,
  scope: "ip" | "account",
): void => {
  res.setHeader("X-RateLimit-Scope", scope);
  res.setHeader("X-RateLimit-Limit", String(decision.limit));
  res.setHeader("X-RateLimit-Remaining", String(decision.remaining));
  res.setHeader("X-RateLimit-Reset", String(decision.resetAt));
  if (!decision.allowed) {
    res.setHeader(
      "Retry-After",
      String(Math.max(1, Math.ceil(decision.retryAfterMs / 1_000))),
    );
  }
};

const requestIp = (req: Request): string =>
  req.ip || req.socket.remoteAddress || "unknown";

const normalizedRequestOrigin = (req: Request): string | null => {
  const host = req.get("host")?.trim();
  if (!host || host.includes(",") || /\s/.test(host)) return null;
  try {
    const parsed = new URL(`${req.protocol}://${host}`);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
};

const normalizedSuppliedOrigin = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  if (!normalized || normalized === "null") return null;
  try {
    const parsed = new URL(normalized);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
};

export class FirstPartyCookieBoundary {
  private readonly codePrefix: string;
  private readonly ipRateGate: BoundedFixedWindowRateGate;
  private readonly accountRateGate: BoundedFixedWindowRateGate;

  constructor(options: FirstPartyCookieBoundaryOptions) {
    this.codePrefix = options.codePrefix;
    const windowMs = positiveInteger(options.windowMs, 60_000);
    const maxKeys = positiveInteger(options.maxKeys, 10_000);
    const now = options.now ?? Date.now;
    this.ipRateGate = new BoundedFixedWindowRateGate(
      positiveInteger(options.ipMax, 300),
      windowMs,
      maxKeys,
      now,
    );
    this.accountRateGate = new BoundedFixedWindowRateGate(
      positiveInteger(options.accountMax, 240),
      windowMs,
      maxKeys,
      now,
    );
  }

  readonly noStore = (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    next();
  };

  readonly enforceIpRateLimit = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const decision = this.ipRateGate.take(requestIp(req));
    setRateHeaders(res, decision, "ip");
    if (!decision.allowed) {
      next(
        new FirstPartyCookieBoundaryError(
          `${this.codePrefix}_rate_limited`,
          429,
          "Too many first-party browser requests. Retry shortly.",
          decision.retryAfterMs,
        ),
      );
      return;
    }
    next();
  };

  readonly enforceSameOrigin = (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }
    const expectedOrigin = normalizedRequestOrigin(req);
    const suppliedOrigin = normalizedSuppliedOrigin(req.get("origin"));
    const fetchSite = req.get("sec-fetch-site")?.trim().toLowerCase();
    if (
      !expectedOrigin ||
      suppliedOrigin !== expectedOrigin ||
      fetchSite !== "same-origin"
    ) {
      next(
        new FirstPartyCookieBoundaryError(
          `${this.codePrefix}_cross_origin_forbidden`,
          403,
          "This cookie-authenticated action requires an exact same-origin browser request.",
        ),
      );
      return;
    }
    next();
  };

  enforceAccountRateLimit(res: Response, accountId: string): void {
    const decision = this.accountRateGate.take(accountId);
    setRateHeaders(res, decision, "account");
    if (!decision.allowed) {
      throw new FirstPartyCookieBoundaryError(
        `${this.codePrefix}_rate_limited`,
        429,
        "Too many first-party browser requests for this account. Retry shortly.",
        decision.retryAfterMs,
      );
    }
  }
}
