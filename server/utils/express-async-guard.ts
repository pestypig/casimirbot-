import type { Application, RequestHandler } from "express";
import express from "express";

const ASYNC_GUARD_FLAG = Symbol.for("casimir.async.guard");
const METHODS = ["get", "post", "put", "patch", "delete", "options", "head", "all", "use"] as const;

const wrapHandler = (handler: RequestHandler): RequestHandler => {
  if ((handler as any)[ASYNC_GUARD_FLAG]) return handler;
  if (handler.length >= 4) return handler;
  const wrapped: RequestHandler = (req, res, next) => {
    try {
      const result = handler(req, res, next) as unknown;
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        (result as Promise<unknown>).catch(next);
      }
    } catch (error) {
      next(error);
    }
  };
  (wrapped as any)[ASYNC_GUARD_FLAG] = true;
  return wrapped;
};

const wrapArgs = (args: unknown[]): unknown[] =>
  args.map((arg) => {
    if (Array.isArray(arg)) {
      return arg.map((item) => (typeof item === "function" ? wrapHandler(item as RequestHandler) : item));
    }
    if (typeof arg === "function") {
      return wrapHandler(arg as RequestHandler);
    }
    return arg;
  });

const patchTarget = (target: Record<string, unknown>) => {
  METHODS.forEach((method) => {
    const original = target[method] as unknown;
    if (typeof original !== "function") return;
    if ((original as any)[ASYNC_GUARD_FLAG]) return;
    const wrapped = (...args: unknown[]) => (original as any).apply(target, wrapArgs(args));
    (wrapped as any)[ASYNC_GUARD_FLAG] = true;
    target[method] = wrapped as unknown;
  });
};

export const patchExpressAsyncHandlers = (app?: Application): void => {
  const expressAny = express as unknown as Record<string, unknown>;
  if (!(expressAny as any).__casimirAsyncGuardPatched) {
    const rawRouter = expressAny.Router as (...args: unknown[]) => Record<string, unknown>;
    if (typeof rawRouter === "function") {
      expressAny.Router = (...args: unknown[]) => {
        const router = rawRouter(...args);
        patchTarget(router);
        return router;
      };
    }
    (expressAny as any).__casimirAsyncGuardPatched = true;
  }
  if (app) {
    patchTarget(app as unknown as Record<string, unknown>);
  }
};
