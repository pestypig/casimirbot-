import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  type HelixThreadAnswerSurfaceMode,
  type HelixThreadClassifierResult,
  type HelixThreadEvent,
  type HelixThreadEventInput,
  type HelixThreadMemoryCitation,
} from "./types";

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const parseBufferSize = (): number =>
  clampNumber(readNumber(process.env.HELIX_THREAD_BUFFER_SIZE, 300), 50, 4000);

const parseRotateMaxBytes = (): number =>
  clampNumber(
    readNumber(process.env.HELIX_THREAD_ROTATE_MAX_BYTES, 5_000_000),
    1_024,
    200_000_000,
  );

const parseRotateMaxFiles = (): number =>
  clampNumber(readNumber(process.env.HELIX_THREAD_ROTATE_MAX_FILES, 6), 0, 50);

const MAX_BUFFER_SIZE = parseBufferSize();
const LEDGER_PERSIST_ENABLED = process.env.HELIX_THREAD_PERSIST !== "0";
const LEDGER_PATH = resolveLedgerPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const eventBuffer: HelixThreadEvent[] = [];
let eventSequence = 0;
let persistedBytes = loadPersistedBytes();

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clipThreadText = (value: unknown, limit = 1200): string | null => {
  const normalized = normalizeOptionalString(value)?.replace(/\s+/g, " ") ?? "";
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const normalizeClassifierResult = (
  value: HelixThreadClassifierResult | null | undefined,
): HelixThreadClassifierResult | null => {
  if (!value || typeof value !== "object") return null;
  const normalized: HelixThreadClassifierResult = {
    mode: normalizeOptionalString(value.mode),
    confidence:
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? clampNumber(value.confidence, 0, 1)
        : null,
    dispatch_hint:
      typeof value.dispatch_hint === "boolean" ? value.dispatch_hint : null,
    clarify_needed:
      typeof value.clarify_needed === "boolean" ? value.clarify_needed : null,
    reason: clipThreadText(value.reason, 280),
    source: normalizeOptionalString(value.source),
  };
  return Object.values(normalized).some((entry) => entry !== null && entry !== undefined)
    ? normalized
    : null;
};

const normalizeMemoryCitation = (
  value: HelixThreadMemoryCitation | null | undefined,
): HelixThreadMemoryCitation | null => {
  if (!value || typeof value !== "object") return null;
  const entries = Array.isArray(value.entries)
    ? value.entries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          path: normalizeOptionalString((entry as { path?: unknown }).path) ?? "",
          line_start:
            typeof (entry as { line_start?: unknown }).line_start === "number" &&
            Number.isFinite((entry as { line_start?: number }).line_start)
              ? Math.max(1, Math.floor((entry as { line_start?: number }).line_start ?? 0))
              : null,
          line_end:
            typeof (entry as { line_end?: unknown }).line_end === "number" &&
            Number.isFinite((entry as { line_end?: number }).line_end)
              ? Math.max(1, Math.floor((entry as { line_end?: number }).line_end ?? 0))
              : null,
          note: clipThreadText((entry as { note?: unknown }).note, 240) ?? "source=thread_event",
        }))
        .filter((entry) => entry.path)
        .slice(0, 16)
    : [];
  const rollout_ids = Array.isArray(value.rollout_ids)
    ? Array.from(
        new Set(
          value.rollout_ids
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean),
        ),
      ).slice(0, 12)
    : [];
  if (entries.length === 0 && rollout_ids.length === 0) return null;
  return {
    entries,
    rollout_ids,
  };
};

const normalizeAnswerSurfaceMode = (
  value: unknown,
): HelixThreadAnswerSurfaceMode | null =>
  value === "conversational" ||
  value === "structured_report" ||
  value === "fail_closed"
    ? value
    : null;

const resolveThreadId = (input: HelixThreadEventInput): string => {
  const explicit = normalizeOptionalString(input.thread_id);
  if (explicit) return explicit;
  const sessionId = normalizeOptionalString(input.session_id);
  if (sessionId) return sessionId;
  const traceId = normalizeOptionalString(input.trace_id);
  if (traceId) return `trace:${traceId}`;
  return `turn:${input.turn_id.trim()}`;
};

const sortBySequence = (events: HelixThreadEvent[]): HelixThreadEvent[] =>
  events
    .slice()
    .sort(
      (a, b) =>
        a.seq - b.seq ||
        a.ts.localeCompare(b.ts) ||
        a.event_id.localeCompare(b.event_id),
    );

export const appendHelixThreadEvent = (
  input: HelixThreadEventInput,
): HelixThreadEvent => {
  const record: HelixThreadEvent = {
    kind: "helix.thread.event",
    version: 1,
    event_id: input.event_id?.trim() || `helix_thread_${crypto.randomUUID()}`,
    seq: ++eventSequence,
    ts: input.ts?.trim() || new Date().toISOString(),
    thread_id: resolveThreadId(input),
    route: input.route,
    event_type: input.event_type,
    turn_id: input.turn_id.trim(),
    session_id: normalizeOptionalString(input.session_id),
    trace_id: normalizeOptionalString(input.trace_id),
    user_text: clipThreadText(input.user_text),
    assistant_text: clipThreadText(input.assistant_text),
    classifier_result: normalizeClassifierResult(input.classifier_result),
    route_reason: clipThreadText(input.route_reason, 220),
    brief_status: normalizeOptionalString(input.brief_status),
    final_gate_outcome: clipThreadText(input.final_gate_outcome, 220),
    fail_reason: clipThreadText(input.fail_reason, 220),
    answer_surface_mode: normalizeAnswerSurfaceMode(input.answer_surface_mode),
    memory_citation: normalizeMemoryCitation(input.memory_citation),
    meta: input.meta && typeof input.meta === "object" ? input.meta : null,
  };
  eventBuffer.push(record);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.splice(0, eventBuffer.length - MAX_BUFFER_SIZE);
  }
  persistLedgerRecord(record);
  return record;
};

export const getHelixThreadLedgerEvents = (options?: {
  sessionId?: string | null;
  threadId?: string | null;
  limit?: number | null;
}): HelixThreadEvent[] => {
  const limit =
    options?.limit === null || options?.limit === undefined || Number.isNaN(options.limit)
      ? null
      : Math.max(1, Math.floor(options.limit));
  const sessionId = normalizeOptionalString(options?.sessionId);
  const threadId = normalizeOptionalString(options?.threadId);
  const persisted = LEDGER_PERSIST_ENABLED ? readPersistedEvents(limit, sessionId, threadId) : [];
  const merged = new Map<string, HelixThreadEvent>();
  for (const event of [...persisted, ...eventBuffer]) {
    if (sessionId && event.session_id !== sessionId) continue;
    if (threadId && event.thread_id !== threadId) continue;
    merged.set(event.event_id, event);
  }
  const ordered = sortBySequence(Array.from(merged.values()));
  return limit === null ? ordered : ordered.slice(-limit);
};

export const getHelixThreadLedgerPath = (): string => LEDGER_PATH;

export const __resetHelixThreadLedgerStore = (): void => {
  eventBuffer.length = 0;
  eventSequence = 0;
  persistedBytes = 0;
};

function resolveLedgerPath(): string {
  const explicit = process.env.HELIX_THREAD_LEDGER_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.HELIX_THREAD_LEDGER_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "helix-thread-ledger.jsonl");
}

function collectLedgerPaths(): string[] {
  const dir = path.dirname(LEDGER_PATH);
  const ext = path.extname(LEDGER_PATH) || ".jsonl";
  const base = path.basename(LEDGER_PATH, ext);
  const prefix = `${base}.`;
  const rotated =
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir, { withFileTypes: true })
          .filter(
            (entry) =>
              entry.isFile() &&
              entry.name.startsWith(prefix) &&
              entry.name.endsWith(ext),
          )
          .map((entry) => path.join(dir, entry.name))
          .sort()
      : [];
  return fs.existsSync(LEDGER_PATH) ? [...rotated, LEDGER_PATH] : rotated;
}

function parseLedgerRecord(line: string): HelixThreadEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<HelixThreadEvent>;
    if (
      parsed.kind !== "helix.thread.event" ||
      parsed.version !== 1 ||
      typeof parsed.event_id !== "string" ||
      !parsed.event_id.trim() ||
      typeof parsed.thread_id !== "string" ||
      !parsed.thread_id.trim() ||
      typeof parsed.turn_id !== "string" ||
      !parsed.turn_id.trim() ||
      typeof parsed.route !== "string" ||
      typeof parsed.event_type !== "string" ||
      typeof parsed.seq !== "number" ||
      !Number.isFinite(parsed.seq) ||
      typeof parsed.ts !== "string" ||
      !parsed.ts.trim()
    ) {
      return null;
    }
    return {
      kind: "helix.thread.event",
      version: 1,
      event_id: parsed.event_id.trim(),
      seq: Math.max(0, Math.floor(parsed.seq)),
      ts: parsed.ts.trim(),
      thread_id: parsed.thread_id.trim(),
      route:
        parsed.route === "/ask" || parsed.route === "/ask/conversation-turn"
          ? parsed.route
          : "/ask",
      event_type: parsed.event_type as HelixThreadEvent["event_type"],
      turn_id: parsed.turn_id.trim(),
      session_id: normalizeOptionalString(parsed.session_id),
      trace_id: normalizeOptionalString(parsed.trace_id),
      user_text: clipThreadText(parsed.user_text),
      assistant_text: clipThreadText(parsed.assistant_text),
      classifier_result: normalizeClassifierResult(parsed.classifier_result),
      route_reason: clipThreadText(parsed.route_reason, 220),
      brief_status: normalizeOptionalString(parsed.brief_status),
      final_gate_outcome: clipThreadText(parsed.final_gate_outcome, 220),
      fail_reason: clipThreadText(parsed.fail_reason, 220),
      answer_surface_mode: normalizeAnswerSurfaceMode(parsed.answer_surface_mode),
      memory_citation: normalizeMemoryCitation(parsed.memory_citation),
      meta:
        parsed.meta && typeof parsed.meta === "object"
          ? (parsed.meta as Record<string, unknown>)
          : null,
    };
  } catch {
    return null;
  }
}

function readPersistedEvents(
  limit?: number | null,
  sessionId?: string | null,
  threadId?: string | null,
): HelixThreadEvent[] {
  if (!LEDGER_PERSIST_ENABLED) return [];
  const parsed: HelixThreadEvent[] = [];
  for (const filePath of collectLedgerPaths()) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const record = parseLedgerRecord(line);
        if (!record) continue;
        if (sessionId && record.session_id !== sessionId) continue;
        if (threadId && record.thread_id !== threadId) continue;
        parsed.push(record);
      }
    } catch {
      continue;
    }
  }
  const ordered = sortBySequence(parsed);
  if (limit === null || limit === undefined) return ordered;
  return ordered.slice(-Math.max(1, Math.floor(limit)));
}

function loadPersistedBytes(): number {
  if (!LEDGER_PERSIST_ENABLED) return 0;
  try {
    const stat = fs.statSync(LEDGER_PATH);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function persistLedgerRecord(record: HelixThreadEvent): void {
  if (!LEDGER_PERSIST_ENABLED) return;
  const line = JSON.stringify(record);
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  maybeRotateLedger(lineBytes);
  fs.appendFileSync(LEDGER_PATH, `${line}\n`, "utf8");
  persistedBytes += lineBytes;
}

function maybeRotateLedger(nextBytes: number): void {
  if (ROTATE_MAX_BYTES <= 0) return;
  if (persistedBytes + nextBytes <= ROTATE_MAX_BYTES) return;
  rotateLedger();
}

function rotateLedger(): void {
  if (!fs.existsSync(LEDGER_PATH)) {
    persistedBytes = 0;
    return;
  }
  const dir = path.dirname(LEDGER_PATH);
  const ext = path.extname(LEDGER_PATH) || ".jsonl";
  const base = path.basename(LEDGER_PATH, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const rotated = path.join(dir, `${base}.${stamp}${ext}`);
  fs.renameSync(LEDGER_PATH, rotated);
  persistedBytes = 0;
  pruneLedgerRotations(dir, base, ext);
}

function pruneLedgerRotations(dir: string, base: string, ext: string): void {
  if (ROTATE_MAX_FILES <= 0 || !fs.existsSync(dir)) return;
  const prefix = `${base}.`;
  const candidates = fs
    .readdirSync(dir, { withFileTypes: true })
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
  for (const name of candidates.slice(0, excess)) {
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
      // ignore pruning failures
    }
  }
}

function hydrateFromPersisted(): void {
  const persisted = readPersistedEvents(MAX_BUFFER_SIZE);
  if (persisted.length === 0) return;
  eventBuffer.push(...persisted);
  eventSequence = persisted.reduce((max, entry) => Math.max(max, entry.seq), 0);
}

hydrateFromPersisted();
