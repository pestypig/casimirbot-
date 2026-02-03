import type { Request, Response, NextFunction } from "express";

type ConcurrencyGuardOptions = {
  max: number;
  keyGenerator?: (req: Request) => string;
  onReject?: (req: Request, res: Response) => void;
};

type Counter = {
  count: number;
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

export const createConcurrencyGuard = (options: ConcurrencyGuardOptions) => {
  const buckets = new Map<string, Counter>();
  const max = Math.max(0, options.max);
  const keyFn = options.keyGenerator ?? resolveKey;

  const decrement = (key: string) => {
    const entry = buckets.get(key);
    if (!entry) return;
    entry.count = Math.max(0, entry.count - 1);
    if (entry.count === 0) {
      buckets.delete(key);
    }
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (max <= 0) {
      next();
      return;
    }
    const key = keyFn(req);
    const entry = buckets.get(key) ?? { count: 0 };
    if (entry.count >= max) {
      if (options.onReject) {
        options.onReject(req, res);
      } else {
        res.status(503).json({
          error: "busy",
          message: "Too many concurrent requests. Please retry shortly.",
        });
      }
      return;
    }
    entry.count += 1;
    buckets.set(key, entry);
    const cleanup = () => decrement(key);
    res.on("finish", cleanup);
    res.on("close", cleanup);
    next();
  };
};
