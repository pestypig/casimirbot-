
export type ToolLogRecord = {
  id: string;
  seq: number;
  ts: string;
  tool: string;
  version: string;
  paramsHash: string;
  promptHash?: string;
  durationMs: number;
  sessionId?: string;
  traceId?: string;
  stepId?: string;
  seed?: unknown;
  ok: boolean;
  error?: string;
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

const MAX_BUFFER_SIZE = parseBufferSize();
const toolLogBuffer: ToolLogRecord[] = [];
const listeners = new Set<ToolLogListener>();
const logToStdout = process.env.TOOL_LOG_STDOUT !== "0";
const logTextEnabled = (): boolean => process.env.ENABLE_LOG_TEXT === "1";
let logSequence = 0;

type AppendEvent = Omit<ToolLogRecord, "id" | "seq" | "ts" | "version" | "text"> &
  Partial<Pick<ToolLogRecord, "ts" | "version" | "text">>;

export function appendToolLog(event: AppendEvent): ToolLogRecord {
  const seq = ++logSequence;
  const promptHash = event.promptHash ?? event.paramsHash;
  const record: ToolLogRecord = {
    id: String(seq),
    seq,
    ts: event.ts ?? new Date().toISOString(),
    tool: event.tool,
    version: event.version ?? "unknown",
    paramsHash: event.paramsHash ?? (promptHash ?? "unknown"),
    promptHash: promptHash,
    durationMs: event.durationMs,
    sessionId: event.sessionId,
    traceId: event.traceId,
    stepId: event.stepId,
    seed: normalizeSeed(event.seed),
    ok: event.ok,
    error: event.error,
    essenceId: event.essenceId,
    text: buildLogText(event.text, event.tool, event.durationMs, event.ok, event.error, event.essenceId),
    debateId: event.debateId,
  };
  toolLogBuffer.push(record);
  if (toolLogBuffer.length > MAX_BUFFER_SIZE) {
    toolLogBuffer.splice(0, toolLogBuffer.length - MAX_BUFFER_SIZE);
  }
  if (logToStdout) {
    try {
      console.info(JSON.stringify({ type: "tool_call", ...record }));
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
};

export function getToolLogs(options?: GetToolLogOptions): ToolLogRecord[] {
  const limit = clampLimit(options?.limit);
  const haystack = options?.tool ? toolLogBuffer.filter((entry) => entry.tool === options.tool) : [...toolLogBuffer];
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
  const haystack = options?.tool ? toolLogBuffer.filter((entry) => entry.tool === options.tool) : [...toolLogBuffer];
  return haystack.filter((entry) => entry.seq > cursor).sort((a, b) => a.seq - b.seq);
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

const truncate = (value: string, limit: number): string => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, Math.max(0, limit - 3))}...`;
};
