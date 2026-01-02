import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

export type OtelSpanKind = "internal" | "server" | "client";

export type OtelSpanStatus = {
  code: "OK" | "ERROR";
  message?: string;
};

export type OtelSpanInput = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  spanKind: OtelSpanKind;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  durationMs?: number;
  status?: OtelSpanStatus;
  attributes?: Record<string, string | number | boolean>;
  resource?: Record<string, string>;
  tracestate?: string;
  traceFlags?: string;
};

export type OtelSpanRecord = OtelSpanInput & {
  kind: "otel-span";
  version: 1;
  id: string;
  seq: number;
  ts: string;
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.OTEL_SPAN_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 2000);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const PERSIST_ENABLED = process.env.OTEL_SPAN_PERSIST === "1";
const OTEL_ENABLED =
  process.env.OTEL_TRACING === "1" ||
  PERSIST_ENABLED ||
  Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
const AUDIT_LOG_PATH = resolveAuditLogPath();
const spanBuffer: OtelSpanRecord[] = [];
let spanSequence = 0;
let persistChain = Promise.resolve();

const persisted = loadPersistedSpans();
if (persisted.length > 0) {
  spanBuffer.push(...persisted);
  spanSequence = persisted.reduce((max, record) => Math.max(max, record.seq), 0);
}

export function recordOtelSpan(input: OtelSpanInput): OtelSpanRecord {
  const seq = ++spanSequence;
  const record: OtelSpanRecord = {
    kind: "otel-span",
    version: 1,
    id: `${input.traceId}:${input.spanId}`,
    seq,
    ts: new Date().toISOString(),
    ...input,
  };
  if (!OTEL_ENABLED) {
    return record;
  }
  spanBuffer.push(record);
  if (spanBuffer.length > MAX_BUFFER_SIZE) {
    spanBuffer.splice(0, spanBuffer.length - MAX_BUFFER_SIZE);
  }
  persistSpanRecord(record);
  return record;
}

type GetOtelSpanOptions = {
  limit?: number;
};

export function getOtelSpans(options?: GetOtelSpanOptions): OtelSpanRecord[] {
  const limit = clampLimit(options?.limit);
  if (PERSIST_ENABLED) {
    const persisted = readPersistedSpans(limit);
    if (persisted.length > 0) {
      return persisted.slice(-limit).reverse();
    }
  }
  if (spanBuffer.length === 0) {
    return [];
  }
  const start = Math.max(0, spanBuffer.length - limit);
  return spanBuffer.slice(start).reverse();
}

export function getOtelSpanLogPath(): string {
  return AUDIT_LOG_PATH;
}

export function __resetOtelSpanStore(): void {
  spanBuffer.length = 0;
}

const clampLimit = (value?: number): number => {
  const fallback = 25;
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(1, Math.floor(value)), MAX_BUFFER_SIZE);
};

function resolveAuditLogPath(): string {
  const explicit = process.env.OTEL_SPAN_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.OTEL_SPAN_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "otel-span.jsonl");
}

function readPersistedSpans(limit: number): OtelSpanRecord[] {
  if (!PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: OtelSpanRecord[] = [];
    for (const line of lines) {
      const record = parseSpanRecord(line);
      if (record) {
        parsed.push(record);
      }
    }
    if (parsed.length === 0) {
      return [];
    }
    const capped = Math.max(1, Math.floor(limit));
    return parsed.slice(-capped);
  } catch (error) {
    console.warn("[otel-span] failed to read audit log", error);
    return [];
  }
}

function loadPersistedSpans(): OtelSpanRecord[] {
  return readPersistedSpans(MAX_BUFFER_SIZE);
}

function parseSpanRecord(line: string): OtelSpanRecord | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.kind !== "otel-span") {
      return null;
    }
    return parsed as OtelSpanRecord;
  } catch {
    return null;
  }
}

function persistSpanRecord(record: OtelSpanRecord): void {
  if (!PERSIST_ENABLED) {
    return;
  }
  const line = JSON.stringify(record);
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
      await fsPromises.appendFile(AUDIT_LOG_PATH, `${line}\n`, "utf8");
    })
    .catch((error) => {
      console.warn("[otel-span] failed to persist audit log", error);
    });
}
