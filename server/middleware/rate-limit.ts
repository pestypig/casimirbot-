import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  onLimit?: (req: Request, res: Response, retryAfterMs: number) => void;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const resolveKey = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || req.ip || "unknown";
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.trim() || req.ip || "unknown";
  }
  return req.ip || "unknown";
};

export const createRateLimiter = (options: RateLimitOptions) => {
  const store = new Map<string, RateLimitEntry>();
  const windowMs = Math.max(1000, options.windowMs);
  const max = Math.max(0, options.max);
  const keyFn = options.keyGenerator ?? resolveKey;

  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  };

  let sweepTimer: NodeJS.Timeout | null = null;
  const scheduleSweep = () => {
    if (sweepTimer) return;
    sweepTimer = setTimeout(() => {
      sweepTimer = null;
      sweep();
    }, windowMs).unref?.();
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (max <= 0) {
      next();
      return;
    }
    const now = Date.now();
    const key = keyFn(req);
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      scheduleSweep();
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(max - 1));
      res.setHeader("X-RateLimit-Reset", String(now + windowMs));
      next();
      return;
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(entry.resetAt));
    if (entry.count > max) {
      const retryAfterMs = Math.max(0, entry.resetAt - now);
      res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      if (options.onLimit) {
        options.onLimit(req, res, retryAfterMs);
      } else {
        res.status(429).json({
          error: "rate_limited",
          message: "Too many requests. Please retry shortly.",
          retryAfterMs,
        });
      }
      return;
    }
    next();
  };
};
