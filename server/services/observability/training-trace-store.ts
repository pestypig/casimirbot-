import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { emitEventSpine } from "./event-spine.js";
import {
  trainingTraceSchema,
  type TrainingTraceCertificate,
  type TrainingTraceConstraint,
  type TrainingTraceDelta,
  type TrainingTraceMetrics,
  type TrainingTraceCalibration,
  type TrainingTraceHilPacket,
  type TrainingTracePayload,
  type TrainingTraceRecord,
  type PredictionObservationLedger,
  type TrainingTraceSignal,
  type TrainingTraceSource,
} from "../../../shared/schema.js";

export type TrainingTraceInput = {
  traceId?: string;
  tenantId?: string;
  source?: TrainingTraceSource;
  calibration?: TrainingTraceCalibration;
  hil_packet?: TrainingTraceHilPacket;
  signal?: TrainingTraceSignal;
  pass: boolean;
  deltas?: TrainingTraceDelta[];
  metrics?: TrainingTraceMetrics;
  firstFail?: TrainingTraceConstraint;
  certificate?: TrainingTraceCertificate;
  predictionObservationLedger?: PredictionObservationLedger;
  payload?: TrainingTracePayload;
  notes?: string[];
  ts?: string;
  id?: string;
  eventRefs?: string[];
};

const parseBufferSize = (): number => {
  const requested = Number(process.env.TRAINING_TRACE_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 1000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(
    process.env.TRAINING_TRACE_ROTATE_MAX_BYTES ?? 20000000,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return 20000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(process.env.TRAINING_TRACE_ROTATE_MAX_FILES ?? 5);
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED = process.env.TRAINING_TRACE_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const traceBuffer: TrainingTraceRecord[] = [];
let traceSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

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

const sortBySequence = (records: TrainingTraceRecord[]): TrainingTraceRecord[] =>
  records.slice().sort((a, b) => a.seq - b.seq);

const mergeVisibleRecords = (
  persisted: TrainingTraceRecord[],
  buffered: TrainingTraceRecord[],
  limit?: number | null,
): TrainingTraceRecord[] => {
  const byId = new Map<string, TrainingTraceRecord>();
  for (const record of [...persisted, ...buffered]) {
    byId.set(record.id, record);
  }
  const merged = sortBySequence(Array.from(byId.values()));
  if (limit === null || limit === undefined) {
    return merged;
  }
  return merged.slice(-limit);
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
    calibration: input.calibration,
    hil_packet: input.hil_packet,
    signal: input.signal,
    pass: input.pass,
    deltas: input.deltas ?? [],
    metrics: input.metrics,
    firstFail: input.firstFail,
    certificate: input.certificate,
    predictionObservationLedger: input.predictionObservationLedger,
    payload: input.payload,
    eventRefs: input.eventRefs,
    notes: input.notes,
  };
  const spineEvent = emitEventSpine({
    kind: "training-trace.emit",
    traceId: record.traceId,
    sessionId: undefined,
    runId: record.id,
    ts: record.ts,
    payload: {
      recordId: record.id,
      signal: record.signal?.kind,
      pass: record.pass,
    },
  });
  if (!record.eventRefs?.includes(spineEvent.eventId)) {
    record.eventRefs = [...(record.eventRefs ?? []), spineEvent.eventId];
  }
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
  const persisted = AUDIT_PERSIST_ENABLED ? readPersistedTraces(limit, tenantId) : [];
  const buffered = filterByTenant(traceBuffer, tenantId);
  const merged = mergeVisibleRecords(persisted, buffered, limit);
  return merged.slice().reverse();
}

export function getTrainingTraceById(
  id: string | undefined,
  tenantId?: string,
): TrainingTraceRecord | null {
  if (!id) return null;
  const normalizedTenant = normalizeTenantId(tenantId);
  const persisted = AUDIT_PERSIST_ENABLED
    ? readPersistedTraces(Number.MAX_SAFE_INTEGER, normalizedTenant)
    : [];
  const buffered = filterByTenant(traceBuffer, normalizedTenant);
  const merged = mergeVisibleRecords(persisted, buffered, null);
  const match = merged.find((entry) => entry.id === id);
  return match ?? null;
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
  const persisted = AUDIT_PERSIST_ENABLED
    ? readPersistedTraces(limit ?? Number.MAX_SAFE_INTEGER, normalizedTenant)
    : [];
  const buffered = filterByTenant(traceBuffer, normalizedTenant);
  return mergeVisibleRecords(persisted, buffered, limit);
}

export function getTrainingTraceLogPath(): string {
  return AUDIT_LOG_PATH;
}

export function __resetTrainingTraceStore(): void {
  traceBuffer.length = 0;
}


const toEvolutionTrainingConstraint = (firstFail: unknown): TrainingTraceConstraint | undefined => {
  if (!firstFail || typeof firstFail !== "object") return undefined;
  const candidate = firstFail as Record<string, unknown>;
  const parsedValue =
    typeof candidate.value === "number" && Number.isFinite(candidate.value)
      ? candidate.value
      : candidate.value === null
        ? null
        : undefined;
  const parsedLimit =
    typeof candidate.limit === "string"
      ? candidate.limit
      : candidate.limit === null
        ? null
        : undefined;
  return {
    id: typeof candidate.id === "string" ? candidate.id : "EVOLUTION_FIRST_FAIL_UNKNOWN",
    severity: typeof candidate.severity === "string" ? candidate.severity : undefined,
    status: typeof candidate.status === "string" ? candidate.status : undefined,
    value: parsedValue,
    limit: parsedLimit,
    note: typeof candidate.note === "string" ? candidate.note : "source=evolution.gate",
  };
};


export function recordEvolutionTrace(input: {
  traceId: string;
  pass: boolean;
  verdict: string;
  firstFail?: unknown;
  score?: number;
  artifacts?: Array<{ kind: string; ref: string }>;
}): TrainingTraceRecord {
  return recordTrainingTrace({
    traceId: input.traceId,
    source: { system: "evolution", component: "gate", tool: "evolution.gate", version: "1" },
    pass: input.pass,
    firstFail: toEvolutionTrainingConstraint(input.firstFail),
    deltas:
      typeof input.score === "number"
        ? [
            {
              key: "evolution_congruence_score",
              from: null,
              to: input.score,
              delta: input.score,
              unit: "score",
              change: "added",
            },
          ]
        : [],
    notes: [
      "source=evolution.gate",
      `verdict=${input.verdict}`,
      ...(input.artifacts ?? []).map((a) => `artifact:${a.kind}=${a.ref}`),
    ],
  });
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
    return sortBySequence(parsed).slice(-capped);
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
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
      await maybeRotateAuditLog(lineBytes);
      await fsPromises.appendFile(AUDIT_LOG_PATH, `${line}\n`, "utf8");
      persistedBytes += lineBytes;
    })
    .catch((error) => {
      console.warn("[training-trace] failed to persist audit log", error);
    });
}

function loadPersistedBytes(): number {
  if (!AUDIT_PERSIST_ENABLED) {
    return 0;
  }
  try {
    const stat = fs.statSync(AUDIT_LOG_PATH);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

async function maybeRotateAuditLog(nextBytes: number): Promise<void> {
  if (ROTATE_MAX_BYTES <= 0) return;
  if (persistedBytes + nextBytes <= ROTATE_MAX_BYTES) return;
  await rotateAuditLog();
}

async function rotateAuditLog(): Promise<void> {
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    persistedBytes = 0;
    return;
  }
  const dir = path.dirname(AUDIT_LOG_PATH);
  const ext = path.extname(AUDIT_LOG_PATH) || ".jsonl";
  const base = path.basename(AUDIT_LOG_PATH, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const rotated = path.join(dir, `${base}.${stamp}${ext}`);
  await fsPromises.rename(AUDIT_LOG_PATH, rotated);
  persistedBytes = 0;
  await pruneAuditRotations(dir, base, ext);
}

async function pruneAuditRotations(
  dir: string,
  base: string,
  ext: string,
): Promise<void> {
  if (ROTATE_MAX_FILES <= 0) return;
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const prefix = `${base}.`;
  const candidates = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(prefix) &&
        entry.name.endsWith(ext),
    )
    .map((entry) => entry.name)
    .sort();
  const excess = candidates.length - ROTATE_MAX_FILES;
  if (excess <= 0) return;
  const toRemove = candidates.slice(0, excess);
  await Promise.all(
    toRemove.map((name) =>
      fsPromises.unlink(path.join(dir, name)).catch(() => undefined),
    ),
  );
}
