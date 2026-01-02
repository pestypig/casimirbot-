import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  trainingTraceSchema,
  type TrainingTraceCertificate,
  type TrainingTraceConstraint,
  type TrainingTraceDelta,
  type TrainingTraceRecord,
  type TrainingTraceSignal,
  type TrainingTraceSource,
} from "../../../shared/schema.js";

export type TrainingTraceInput = {
  traceId?: string;
  tenantId?: string;
  source?: TrainingTraceSource;
  signal?: TrainingTraceSignal;
  pass: boolean;
  deltas?: TrainingTraceDelta[];
  firstFail?: TrainingTraceConstraint;
  certificate?: TrainingTraceCertificate;
  notes?: string[];
  ts?: string;
  id?: string;
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.TRAINING_TRACE_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 1000);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED = process.env.TRAINING_TRACE_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const traceBuffer: TrainingTraceRecord[] = [];
let traceSequence = 0;
let persistChain = Promise.resolve();

const normalizeTenantId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const matchesTenant = (
  record: TrainingTraceRecord,
  tenantId?: string,
): boolean => {
  if (!tenantId) return true;
  return record.tenantId === tenantId;
};

const filterByTenant = (
  records: TrainingTraceRecord[],
  tenantId?: string,
): TrainingTraceRecord[] => {
  if (!tenantId) return records;
  return records.filter((record) => matchesTenant(record, tenantId));
};

const persistedTraces = loadPersistedTraces();
if (persistedTraces.length > 0) {
  traceBuffer.push(...persistedTraces);
  traceSequence = persistedTraces.reduce(
    (max, record) => Math.max(max, record.seq),
    0,
  );
}

export function recordTrainingTrace(input: TrainingTraceInput): TrainingTraceRecord {
  const seq = ++traceSequence;
  const tenantId = normalizeTenantId(input.tenantId);
  const record: TrainingTraceRecord = {
    kind: "training-trace",
    version: 1,
    id: input.id ?? String(seq),
    seq,
    ts: input.ts ?? new Date().toISOString(),
    traceId: input.traceId,
    tenantId,
    source: input.source,
    signal: input.signal,
    pass: input.pass,
    deltas: input.deltas ?? [],
    firstFail: input.firstFail,
    certificate: input.certificate,
    notes: input.notes,
  };
  traceBuffer.push(record);
  if (traceBuffer.length > MAX_BUFFER_SIZE) {
    traceBuffer.splice(0, traceBuffer.length - MAX_BUFFER_SIZE);
  }
  persistAuditRecord(record);
  return record;
}

type GetTrainingTracesOptions = {
  limit?: number;
  tenantId?: string;
};

export function getTrainingTraces(
  options?: GetTrainingTracesOptions,
): TrainingTraceRecord[] {
  const limit = clampLimit(options?.limit);
  const tenantId = normalizeTenantId(options?.tenantId);
  if (AUDIT_PERSIST_ENABLED) {
    const persisted = readPersistedTraces(limit, tenantId);
    if (persisted.length > 0) {
      return persisted.slice(-limit).reverse();
    }
  }
  if (traceBuffer.length === 0) {
    return [];
  }
  const filtered = filterByTenant(traceBuffer, tenantId);
  const start = Math.max(0, filtered.length - limit);
  return filtered.slice(start).reverse();
}

export function getTrainingTraceById(
  id: string | undefined,
  tenantId?: string,
): TrainingTraceRecord | null {
  if (!id) return null;
  const normalizedTenant = normalizeTenantId(tenantId);
  const record = traceBuffer.find((entry) => entry.id === id);
  if (record && matchesTenant(record, normalizedTenant)) return record;
  if (AUDIT_PERSIST_ENABLED) {
    const persisted = readPersistedTraces(Number.MAX_SAFE_INTEGER, normalizedTenant);
    const match = persisted.find((entry) => entry.id === id);
    return match ?? null;
  }
  return null;
}

type GetTrainingTraceExportOptions = {
  limit?: number;
  tenantId?: string;
};

export function getTrainingTraceExport(
  options?: GetTrainingTraceExportOptions,
): TrainingTraceRecord[] {
  const normalizedTenant = normalizeTenantId(options?.tenantId);
  const rawLimit = options?.limit;
  const limit =
    rawLimit === undefined || rawLimit === null || Number.isNaN(rawLimit)
      ? null
      : Math.max(1, Math.floor(rawLimit));
  if (AUDIT_PERSIST_ENABLED) {
    const persisted = readPersistedTraces(
      limit ?? Number.MAX_SAFE_INTEGER,
      normalizedTenant,
    );
    if (persisted.length > 0) {
      return persisted;
    }
  }
  const filtered = filterByTenant(traceBuffer, normalizedTenant);
  if (!limit) {
    return filtered.slice();
  }
  return filtered.slice(-limit);
}

export function getTrainingTraceLogPath(): string {
  return AUDIT_LOG_PATH;
}

export function __resetTrainingTraceStore(): void {
  traceBuffer.length = 0;
}

const clampLimit = (value?: number): number => {
  const fallback = 25;
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(1, Math.floor(value)), MAX_BUFFER_SIZE);
};

function resolveAuditLogPath(): string {
  const explicit = process.env.TRAINING_TRACE_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.TRAINING_TRACE_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "training-trace.jsonl");
}

function readPersistedTraces(
  limit: number,
  tenantId?: string,
): TrainingTraceRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: TrainingTraceRecord[] = [];
    for (const line of lines) {
      const record = parseAuditRecord(line);
      if (record && matchesTenant(record, tenantId)) {
        parsed.push(record);
      }
    }
    if (parsed.length === 0) {
      return [];
    }
    const capped = Math.max(1, Math.floor(limit));
    return parsed.slice(-capped);
  } catch (error) {
    console.warn("[training-trace] failed to read audit log", error);
    return [];
  }
}

function loadPersistedTraces(): TrainingTraceRecord[] {
  return readPersistedTraces(MAX_BUFFER_SIZE);
}

function parseAuditRecord(line: string): TrainingTraceRecord | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    const result = trainingTraceSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function persistAuditRecord(record: TrainingTraceRecord): void {
  if (!AUDIT_PERSIST_ENABLED) {
    return;
  }
  const line = JSON.stringify(record);
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
      await fsPromises.appendFile(AUDIT_LOG_PATH, `${line}\n`, "utf8");
    })
    .catch((error) => {
      console.warn("[training-trace] failed to persist audit log", error);
    });
}
