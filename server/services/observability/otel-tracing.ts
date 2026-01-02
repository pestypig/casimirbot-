import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import os from "node:os";
import {
  recordOtelSpan,
  type OtelSpanInput,
  type OtelSpanKind,
  type OtelSpanStatus,
} from "./otel-span-store.js";

type OtelTraceContext = {
  traceId: string;
  spanId?: string;
  traceFlags?: string;
  tracestate?: string;
  source?: string;
};

export type OtelSpanHandle = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  spanKind: OtelSpanKind;
  startTimeUnixNano: string;
  traceFlags?: string;
  tracestate?: string;
  attributes?: Record<string, string | number | boolean>;
  status?: OtelSpanStatus;
  end: (status?: OtelSpanStatus) => void;
  setAttribute: (key: string, value: string | number | boolean) => void;
  addAttributes: (attrs?: Record<string, string | number | boolean>) => void;
};

const TRACEPARENT_RE =
  /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const DEFAULT_TRACE_FLAGS = "01";
const storage = new AsyncLocalStorage<OtelTraceContext>();
const OTEL_TRACING_ENABLED =
  process.env.OTEL_TRACING === "1" ||
  process.env.OTEL_SPAN_PERSIST === "1" ||
  Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

const SERVICE_NAME =
  process.env.OTEL_SERVICE_NAME ??
  process.env.SERVICE_NAME ??
  "casimir-verifier";
const SERVICE_VERSION =
  process.env.OTEL_SERVICE_VERSION ??
  process.env.SERVICE_VERSION ??
  process.env.npm_package_version;
const SERVICE_INSTANCE_ID =
  process.env.OTEL_SERVICE_INSTANCE_ID ?? os.hostname();

const headerValue = (value: string | string[] | undefined): string => {
  if (!value) return "";
  return Array.isArray(value) ? value.join(",") : value;
};

const toTraceId = (): string => crypto.randomBytes(16).toString("hex");
const toSpanId = (): string => crypto.randomBytes(8).toString("hex");

export const isTracingEnabled = (): boolean => OTEL_TRACING_ENABLED;

export const parseTraceParent = (
  raw?: string,
): OtelTraceContext | null => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const match = value.match(TRACEPARENT_RE);
  if (!match) return null;
  const traceId = match[2].toLowerCase();
  const parentSpanId = match[3].toLowerCase();
  const traceFlags = match[4].toLowerCase();
  return {
    traceId,
    spanId: parentSpanId,
    traceFlags,
    source: "traceparent",
  };
};

export const formatTraceParent = (args: {
  traceId: string;
  spanId: string;
  traceFlags?: string;
}): string => {
  const traceFlags = (args.traceFlags ?? DEFAULT_TRACE_FLAGS).toLowerCase();
  return `00-${args.traceId}-${args.spanId}-${traceFlags}`;
};

export const createTraceContextFromHeaders = (
  headers: Record<string, string | string[] | undefined>,
): OtelTraceContext => {
  const traceparent = headerValue(headers["traceparent"]);
  const tracestate = headerValue(headers["tracestate"]);
  const parsed = parseTraceParent(traceparent);
  if (parsed) {
    return { ...parsed, tracestate: tracestate || undefined };
  }
  return { traceId: toTraceId(), traceFlags: DEFAULT_TRACE_FLAGS, tracestate };
};

export const getTraceContext = (): OtelTraceContext | null =>
  storage.getStore() ?? null;

export const runWithTraceContext = <T>(
  ctx: OtelTraceContext,
  fn: () => T,
): T => storage.run(ctx, fn);

const resolveResourceAttributes = (): Record<string, string> => ({
  "service.name": SERVICE_NAME,
  ...(SERVICE_VERSION ? { "service.version": SERVICE_VERSION } : {}),
  ...(SERVICE_INSTANCE_ID ? { "service.instance.id": SERVICE_INSTANCE_ID } : {}),
});

const nowUnixNano = (ms: number): string => String(ms * 1_000_000);

export const startSpan = (
  name: string,
  options?: {
    parent?: OtelTraceContext | null;
    traceId?: string;
    parentSpanId?: string;
    spanKind?: OtelSpanKind;
    attributes?: Record<string, string | number | boolean>;
  },
): OtelSpanHandle => {
  const parent = options?.parent ?? getTraceContext();
  const traceId = options?.traceId ?? parent?.traceId ?? toTraceId();
  const parentSpanId = options?.parentSpanId ?? parent?.spanId;
  const spanId = toSpanId();
  const spanKind = options?.spanKind ?? "internal";
  const startMs = Date.now();
  const span: OtelSpanHandle = {
    traceId,
    spanId,
    parentSpanId,
    name,
    spanKind,
    startTimeUnixNano: nowUnixNano(startMs),
    traceFlags: parent?.traceFlags ?? DEFAULT_TRACE_FLAGS,
    tracestate: parent?.tracestate,
    attributes: options?.attributes ? { ...options.attributes } : undefined,
    end: (status?: OtelSpanStatus) => {
      endSpan(span, status, startMs);
    },
    setAttribute: (key, value) => {
      span.attributes = span.attributes ?? {};
      span.attributes[key] = value;
    },
    addAttributes: (attrs) => {
      if (!attrs) return;
      span.attributes = span.attributes ?? {};
      for (const [key, value] of Object.entries(attrs)) {
        span.attributes[key] = value;
      }
    },
  };
  return span;
};

export const withSpan = async <T>(
  name: string,
  options: {
    parent?: OtelTraceContext | null;
    traceId?: string;
    parentSpanId?: string;
    spanKind?: OtelSpanKind;
    attributes?: Record<string, string | number | boolean>;
  },
  fn: (span: OtelSpanHandle) => Promise<T>,
): Promise<T> => {
  const span = startSpan(name, options);
  const ctx: OtelTraceContext = {
    traceId: span.traceId,
    spanId: span.spanId,
    traceFlags: span.traceFlags,
    tracestate: span.tracestate,
  };
  return runWithTraceContext(ctx, async () => {
    try {
      const result = await fn(span);
      if (!span.status) {
        span.status = { code: "OK" };
      }
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "span handler error";
      span.status = { code: "ERROR", message };
      throw error;
    } finally {
      span.end(span.status);
    }
  });
};

const endSpan = (
  span: OtelSpanHandle,
  status: OtelSpanStatus | undefined,
  startMs: number,
): void => {
  if ((span as any)._ended) {
    return;
  }
  (span as any)._ended = true;
  const endMs = Date.now();
  const input: OtelSpanInput = {
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    name: span.name,
    spanKind: span.spanKind,
    startTimeUnixNano: span.startTimeUnixNano,
    endTimeUnixNano: nowUnixNano(endMs),
    durationMs: Math.max(0, endMs - startMs),
    status: status ?? span.status,
    attributes: span.attributes,
    resource: resolveResourceAttributes(),
    tracestate: span.tracestate,
    traceFlags: span.traceFlags,
  };
  recordOtelSpan(input);
};
