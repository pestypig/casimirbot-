import type { Request, Response, NextFunction } from "express";
import {
  createTraceContextFromHeaders,
  formatTraceParent,
  isTracingEnabled,
  runWithTraceContext,
  startSpan,
} from "./otel-tracing.js";

const HTTP_SPANS_ENABLED = (() => {
  const override = process.env.OTEL_HTTP_SPANS;
  if (override === "0") return false;
  if (override === "1") return true;
  return isTracingEnabled();
})();

const resolveRouteName = (req: Request): string =>
  req.route?.path
    ? `${req.method.toUpperCase()} ${req.route.path}`
    : `${req.method.toUpperCase()} ${req.path || req.originalUrl || "/"}`;

export function otelMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const baseContext = createTraceContextFromHeaders(req.headers);
  if (!HTTP_SPANS_ENABLED) {
    runWithTraceContext(baseContext, next);
    return;
  }

  const span = startSpan("http.request", {
    parent: baseContext,
    spanKind: "server",
    attributes: {
      "http.method": req.method,
      "http.target": req.originalUrl ?? req.url ?? "/",
      "http.route": req.path ?? "/",
    },
  });

  const spanContext = {
    traceId: span.traceId,
    spanId: span.spanId,
    traceFlags: span.traceFlags,
    tracestate: span.tracestate,
  };

  res.setHeader(
    "traceparent",
    formatTraceParent({
      traceId: span.traceId,
      spanId: span.spanId,
      traceFlags: span.traceFlags,
    }),
  );
  if (span.tracestate) {
    res.setHeader("tracestate", span.tracestate);
  }

  let ended = false;
  const endSpanOnce = (statusCode?: number) => {
    if (ended) return;
    ended = true;
    span.setAttribute("http.status_code", statusCode ?? res.statusCode);
    span.setAttribute("http.route", resolveRouteName(req));
    span.status = (statusCode ?? res.statusCode) >= 500
      ? { code: "ERROR", message: `HTTP ${statusCode ?? res.statusCode}` }
      : { code: "OK" };
    span.end(span.status);
  };

  res.on("finish", () => endSpanOnce(res.statusCode));
  res.on("close", () => endSpanOnce(res.statusCode));

  runWithTraceContext(spanContext, next);
}
