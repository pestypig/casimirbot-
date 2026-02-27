
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

export type ToolLogPolicyFlag = boolean | number;

export type ToolLogPolicyFlags = {
  forbidden?: ToolLogPolicyFlag;
  approvalMissing?: ToolLogPolicyFlag;
  provenanceMissing?: ToolLogPolicyFlag;
};

export type ToolLogRecord = {
  id: string;
  seq: number;
  ts: string;
  tool: string;
  version: string;
  paramsHash: string;
  promptHash?: string;
  durationMs: number;
  tenantId?: string;
  sessionId?: string;
  traceId?: string;
  stepId?: string;
  stage?: string;
  detail?: string;
  message?: string;
  meta?: Record<string, unknown>;
  seed?: unknown;
  ok: boolean;
  error?: string;
  policy?: ToolLogPolicyFlags;
  essenceId?: string;
  text?: string;
  debateId?: string;
  strategy?: string;
};

type ToolLogListener = (entry: ToolLogRecord) => void;

const parseBufferSize = (): number => {
  const requested = Number(process.env.TOOL_LOG_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 1000);
};

const parseTenantBufferSize = (fallback: number): number => {
  const requested = Number(
    process.env.TOOL_LOG_TENANT_BUFFER_SIZE ?? fallback,
  );
  if (!Number.isFinite(requested) || requested < 1) {
    return fallback;
  }
  return Math.min(Math.max(10, Math.floor(requested)), 1000);
};

const parseRotateMaxBytes = (): number => {
  const requested = Number(process.env.TOOL_LOG_ROTATE_MAX_BYTES ?? 10000000);
  if (!Number.isFinite(requested) || requested < 1) {
    return 10000000;
  }
  return Math.min(Math.max(100000, Math.floor(requested)), 200000000);
};

const parseRotateMaxFiles = (): number => {
  const requested = Number(process.env.TOOL_LOG_ROTATE_MAX_FILES ?? 5);
  if (!Number.isFinite(requested) || requested < 0) {
    return 5;
  }
  return Math.min(Math.max(0, Math.floor(requested)), 50);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const MAX_TENANT_BUFFER_SIZE = parseTenantBufferSize(MAX_BUFFER_SIZE);
const AUDIT_PERSIST_ENABLED = process.env.TOOL_LOG_PERSIST === "1";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const HELIX_ASK_HIGH_VOLUME_TOOL_RE =
  /^helix\.ask\.(event|progress|stream)$/i;
const compactHighVolumeRecords = process.env.TOOL_LOG_COMPACT_HIGH_VOLUME !== "0";
const LOG_RECORD_MAX_FIELD_CHARS = (() => {
  const fallback = 1600;
  const raw = Number(process.env.TOOL_LOG_RECORD_MAX_FIELD_CHARS ?? fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(120, Math.floor(raw)), 20000);
})();
const LOG_RECORD_HIGH_VOLUME_FIELD_CHARS = (() => {
  const fallback = 320;
  const raw = Number(process.env.TOOL_LOG_HIGH_VOLUME_FIELD_CHARS ?? fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(60, Math.floor(raw)), LOG_RECORD_MAX_FIELD_CHARS);
})();
const toolLogBuffer: ToolLogRecord[] = [];
const listeners = new Set<ToolLogListener>();
const logToStdout = process.env.TOOL_LOG_STDOUT !== "0";
const logToStdoutVerbose = process.env.TOOL_LOG_STDOUT_VERBOSE === "1";
const LOG_STDOUT_MAX_FIELD_CHARS = (() => {
  const fallback = 1200;
  const raw = Number(process.env.TOOL_LOG_STDOUT_MAX_FIELD_CHARS ?? fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(120, Math.floor(raw)), 8000);
})();
const logTextEnabled = (): boolean => process.env.ENABLE_LOG_TEXT === "1";      
let logSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

type AppendEvent = Omit<ToolLogRecord, "id" | "seq" | "ts" | "version" | "text"> &
  Partial<Pick<ToolLogRecord, "ts" | "version" | "text">>;

export function appendToolLog(event: AppendEvent): ToolLogRecord {
  const seq = ++logSequence;
  const promptHash = event.promptHash ?? event.paramsHash;
  const policy = normalizePolicy(event.policy);
  const tenantId = normalizeTenantId(event.tenantId);
  const highVolumeRecord = compactHighVolumeRecords && isHighVolumeTool(event.tool);
  const valueMaxChars = highVolumeRecord
    ? LOG_RECORD_HIGH_VOLUME_FIELD_CHARS
    : LOG_RECORD_MAX_FIELD_CHARS;
  const logText = buildLogText(
    event.text,
    event.tool,
    event.durationMs,
    event.ok,
    event.error,
    event.essenceId,
  );
  const record: ToolLogRecord = {
    id: String(seq),
    seq,
    ts: event.ts ?? new Date().toISOString(),
    tool: event.tool,
    version: event.version ?? "unknown",
    paramsHash: event.paramsHash ?? (promptHash ?? "unknown"),
    promptHash: promptHash,
    durationMs: event.durationMs,
    tenantId,
    sessionId: event.sessionId,
    traceId: event.traceId,
    stepId: event.stepId,
    stage: event.stage,
    detail: clipRecordField(event.detail, valueMaxChars),
    message: clipRecordField(event.message, valueMaxChars),
    meta: highVolumeRecord ? undefined : event.meta,
    seed: normalizeSeed(event.seed),
    ok: event.ok,
    error: clipRecordField(event.error, valueMaxChars),
    policy,
    essenceId: event.essenceId,
    text: clipRecordField(logText, valueMaxChars),
    debateId: event.debateId,
    strategy: event.strategy,
  };
  toolLogBuffer.push(record);
  trimTenantBuffer(tenantId);
  if (toolLogBuffer.length > MAX_BUFFER_SIZE) {
    toolLogBuffer.splice(0, toolLogBuffer.length - MAX_BUFFER_SIZE);
  }
  persistAuditRecord(record);
  if (shouldEmitToStdout(record)) {
    try {
      console.info(JSON.stringify(buildStdoutRecord(record)));
    } catch {
      // ignore serialization failures
    }
  }
  for (const listener of Array.from(listeners)) {
    try {
      listener(record);
    } catch (err) {
      console.warn("[tool-log] listener error", err);
    }
  }
  return record;
}

type GetToolLogOptions = {
  limit?: number;
  tool?: string;
  tenantId?: string;
  sessionId?: string;
  traceId?: string;
};

export function getToolLogs(options?: GetToolLogOptions): ToolLogRecord[] {
  const limit = clampLimit(options?.limit);
  const tenantId = normalizeTenantId(options?.tenantId);
  const sessionId = options?.sessionId;
  const traceId = options?.traceId;
  const haystack = toolLogBuffer.filter((entry) => {
    if (options?.tool && entry.tool !== options.tool) return false;
    if (tenantId && !matchesTenant(entry, tenantId)) {
      return false;
    }
    if (sessionId && entry.sessionId !== sessionId) {
      return false;
    }
    if (traceId && entry.traceId !== traceId) {
      return false;
    }
    return true;
  });
  if (haystack.length === 0) {
    return [];
  }
  const start = Math.max(0, haystack.length - limit);
  return haystack.slice(start).reverse();
}

export function getToolLogsSince(lastId: string, options?: GetToolLogOptions): ToolLogRecord[] {
  const cursor = parseSequence(lastId);
  if (cursor === null) {
    return [];
  }
  const tenantId = normalizeTenantId(options?.tenantId);
  const sessionId = options?.sessionId;
  const traceId = options?.traceId;
  const haystack = toolLogBuffer.filter((entry) => {
    if (options?.tool && entry.tool !== options.tool) return false;
    if (tenantId && !matchesTenant(entry, tenantId)) {
      return false;
    }
    if (sessionId && entry.sessionId !== sessionId) {
      return false;
    }
    if (traceId && entry.traceId !== traceId) {
      return false;
    }
    return true;
  });
  return haystack
    .filter((entry) => entry.seq > cursor)
    .sort((a, b) => a.seq - b.seq);
}

export function subscribeToolLogs(listener: ToolLogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetToolLogStore(): void {
  toolLogBuffer.length = 0;
  listeners.clear();
}

const clampLimit = (value?: number): number => {
  const fallback = 50;
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(1, Math.floor(value)), MAX_BUFFER_SIZE);
};

const normalizeSeed = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
};

const parseSequence = (value?: string): number | null => {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTenantId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const matchesTenant = (
  record: ToolLogRecord,
  tenantId?: string,
): boolean => {
  if (!tenantId) return record.tenantId === undefined;
  return record.tenantId === tenantId;
};

const trimTenantBuffer = (tenantId?: string): void => {
  if (MAX_TENANT_BUFFER_SIZE <= 0) return;
  const normalizedTenant = normalizeTenantId(tenantId);
  const total = toolLogBuffer.reduce((count, entry) => {
    if (matchesTenant(entry, normalizedTenant)) {
      return count + 1;
    }
    return count;
  }, 0);
  const excess = total - MAX_TENANT_BUFFER_SIZE;
  if (excess <= 0) return;
  let remaining = excess;
  for (let i = 0; i < toolLogBuffer.length && remaining > 0; i += 1) {
    if (matchesTenant(toolLogBuffer[i], normalizedTenant)) {
      toolLogBuffer.splice(i, 1);
      i -= 1;
      remaining -= 1;
    }
  }
};

const buildLogText = (
  explicit: string | undefined,
  tool: string,
  durationMs: number,
  ok: boolean,
  error?: string,
  essenceId?: string,
): string | undefined => {
  if (!logTextEnabled()) {
    return explicit?.trim() || undefined;
  }
  if (explicit?.trim()) {
    return explicit.trim();
  }
  const prefix = ok ? "[ok]" : "[err]";
  const parts = [`${prefix} ${tool}`, `${Math.round(durationMs)}ms`];
  if (essenceId) {
    parts.push(`essence:${truncate(essenceId, 18)}`);
  }
  if (!ok && error) {
    parts.push(`error:${truncate(error, 140)}`);
  }
  return parts.join(" | ");
};

const normalizePolicy = (
  policy?: ToolLogPolicyFlags,
): ToolLogPolicyFlags | undefined => {
  if (!policy) return undefined;
  const normalized: ToolLogPolicyFlags = {};
  if (policy.forbidden) normalized.forbidden = policy.forbidden;
  if (policy.approvalMissing) normalized.approvalMissing = policy.approvalMissing;
  if (policy.provenanceMissing) normalized.provenanceMissing = policy.provenanceMissing;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const truncate = (value: string, limit: number): string => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, Math.max(0, limit - 3))}...`;
};

const isHighVolumeTool = (tool?: string): boolean =>
  typeof tool === "string" && HELIX_ASK_HIGH_VOLUME_TOOL_RE.test(tool);

const clipRecordField = (value?: string, limit = LOG_RECORD_MAX_FIELD_CHARS): string | undefined => {
  if (!value) return value;
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 3))}...`;
};

const shouldEmitToStdout = (record: ToolLogRecord): boolean => {
  if (!logToStdout) return false;
  if (logToStdoutVerbose) return true;
  // Keep high-volume Helix Ask traces queryable via store APIs, not stdout spam.
  return !HELIX_ASK_HIGH_VOLUME_TOOL_RE.test(record.tool);
};

const clipStdoutField = (value?: string): string | undefined => {
  if (!value) return value;
  if (value.length <= LOG_STDOUT_MAX_FIELD_CHARS) return value;
  return `${value.slice(0, Math.max(0, LOG_STDOUT_MAX_FIELD_CHARS - 3))}...`;
};

const buildStdoutRecord = (record: ToolLogRecord): Record<string, unknown> => {
  if (logToStdoutVerbose) {
    return { type: "tool_call", ...record };
  }
  return {
    type: "tool_call",
    id: record.id,
    seq: record.seq,
    ts: record.ts,
    tool: record.tool,
    version: record.version,
    paramsHash: record.paramsHash,
    durationMs: record.durationMs,
    tenantId: record.tenantId,
    sessionId: record.sessionId,
    traceId: record.traceId,
    stepId: record.stepId,
    stage: record.stage,
    detail: clipStdoutField(record.detail),
    message: clipStdoutField(record.message),
    seed: record.seed,
    ok: record.ok,
    error: clipStdoutField(record.error),
    policy: record.policy,
    essenceId: record.essenceId,
    text: clipStdoutField(record.text),
    debateId: record.debateId,
    strategy: record.strategy,
  };
};

function resolveAuditLogPath(): string {
  const explicit = process.env.TOOL_LOG_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.TOOL_LOG_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "tool-log.jsonl");
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

function persistAuditRecord(record: ToolLogRecord): void {
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
      console.warn("[tool-log] failed to persist audit log", error);
    });
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
