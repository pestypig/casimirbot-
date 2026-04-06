import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type HelixConversationHistoryRoute = "/ask" | "/ask/conversation-turn";

export type HelixConversationHistoryEventType =
  | "conversation_turn_started"
  | "conversation_turn_classified"
  | "conversation_turn_brief_ready"
  | "conversation_turn_completed"
  | "conversation_turn_failed"
  | "conversation_turn_interrupted"
  | "ask_started"
  | "ask_completed"
  | "ask_failed"
  | "ask_interrupted";

export type HelixConversationHistoryTurnStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "interrupted";

export type HelixConversationHistoryClassifierResult = {
  mode?: string | null;
  confidence?: number | null;
  dispatch_hint?: boolean | null;
  clarify_needed?: boolean | null;
  reason?: string | null;
  source?: string | null;
};

export type HelixConversationHistoryEvent = {
  kind: "helix.ask.conversation_history";
  version: 1;
  event_id: string;
  seq: number;
  ts: string;
  route: HelixConversationHistoryRoute;
  event_type: HelixConversationHistoryEventType;
  turn_id: string;
  session_id?: string | null;
  trace_id?: string | null;
  user_text?: string | null;
  assistant_text?: string | null;
  classifier_result?: HelixConversationHistoryClassifierResult | null;
  route_reason?: string | null;
  brief_status?: string | null;
  final_gate_outcome?: string | null;
  fail_reason?: string | null;
  meta?: Record<string, unknown> | null;
};

export type HelixConversationHistoryEventInput = Omit<
  HelixConversationHistoryEvent,
  "kind" | "version" | "event_id" | "seq" | "ts"
> & {
  event_id?: string;
  ts?: string;
};

export type HelixConversationHistoryTurn = {
  turn_id: string;
  route: HelixConversationHistoryRoute;
  session_id?: string | null;
  trace_id?: string | null;
  status: HelixConversationHistoryTurnStatus;
  started_at: string;
  updated_at: string;
  user_text?: string | null;
  assistant_text?: string | null;
  classifier_result?: HelixConversationHistoryClassifierResult | null;
  route_reason?: string | null;
  brief_status?: string | null;
  final_gate_outcome?: string | null;
  fail_reason?: string | null;
  last_seq: number;
  event_count: number;
};

export type HelixAskMemoryCitationEntry = {
  path: string;
  line_start: number | null;
  line_end: number | null;
  note: string;
};

export type HelixAskMemoryCitation = {
  entries: HelixAskMemoryCitationEntry[];
  rollout_ids: string[];
};

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const parseBufferSize = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_CONVERSATION_HISTORY_BUFFER_SIZE, 300), 50, 4000);

const parseRotateMaxBytes = (): number =>
  clampNumber(
    readNumber(process.env.HELIX_ASK_CONVERSATION_HISTORY_ROTATE_MAX_BYTES, 5_000_000),
    1_024,
    200_000_000,
  );

const parseRotateMaxFiles = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_CONVERSATION_HISTORY_ROTATE_MAX_FILES, 6), 0, 50);

const MAX_BUFFER_SIZE = parseBufferSize();
const AUDIT_PERSIST_ENABLED = process.env.HELIX_ASK_CONVERSATION_HISTORY_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const eventBuffer: HelixConversationHistoryEvent[] = [];
let eventSequence = 0;
let persistedBytes = loadPersistedBytes();

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clipHistoryText = (value: unknown, limit = 1200): string | null => {
  const normalized = normalizeOptionalString(value)?.replace(/\s+/g, " ") ?? "";
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const normalizeClassifierResult = (
  value: HelixConversationHistoryClassifierResult | null | undefined,
): HelixConversationHistoryClassifierResult | null => {
  if (!value || typeof value !== "object") return null;
  const normalized: HelixConversationHistoryClassifierResult = {
    mode: normalizeOptionalString(value.mode),
    confidence:
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? clampNumber(value.confidence, 0, 1)
        : null,
    dispatch_hint:
      typeof value.dispatch_hint === "boolean" ? value.dispatch_hint : null,
    clarify_needed:
      typeof value.clarify_needed === "boolean" ? value.clarify_needed : null,
    reason: clipHistoryText(value.reason, 280),
    source: normalizeOptionalString(value.source),
  };
  return Object.values(normalized).some((entry) => entry !== null && entry !== undefined)
    ? normalized
    : null;
};

const sortBySequence = (
  events: HelixConversationHistoryEvent[],
): HelixConversationHistoryEvent[] =>
  events
    .slice()
    .sort(
      (a, b) =>
        a.seq - b.seq ||
        a.ts.localeCompare(b.ts) ||
        a.event_id.localeCompare(b.event_id),
    );

export const appendConversationHistoryEvent = (
  input: HelixConversationHistoryEventInput,
): HelixConversationHistoryEvent => {
  const record: HelixConversationHistoryEvent = {
    kind: "helix.ask.conversation_history",
    version: 1,
    event_id: input.event_id?.trim() || `conv_hist_${crypto.randomUUID()}`,
    seq: ++eventSequence,
    ts: input.ts?.trim() || new Date().toISOString(),
    route: input.route,
    event_type: input.event_type,
    turn_id: input.turn_id.trim(),
    session_id: normalizeOptionalString(input.session_id),
    trace_id: normalizeOptionalString(input.trace_id),
    user_text: clipHistoryText(input.user_text),
    assistant_text: clipHistoryText(input.assistant_text),
    classifier_result: normalizeClassifierResult(input.classifier_result),
    route_reason: clipHistoryText(input.route_reason, 220),
    brief_status: normalizeOptionalString(input.brief_status),
    final_gate_outcome: clipHistoryText(input.final_gate_outcome, 220),
    fail_reason: clipHistoryText(input.fail_reason, 220),
    meta: input.meta && typeof input.meta === "object" ? input.meta : null,
  };
  eventBuffer.push(record);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.splice(0, eventBuffer.length - MAX_BUFFER_SIZE);
  }
  persistAuditRecord(record);
  return record;
};

export const getConversationHistoryEvents = (options?: {
  sessionId?: string | null;
  limit?: number | null;
}): HelixConversationHistoryEvent[] => {
  const limit =
    options?.limit === null || options?.limit === undefined || Number.isNaN(options.limit)
      ? null
      : Math.max(1, Math.floor(options.limit));
  const sessionId = normalizeOptionalString(options?.sessionId);
  const persisted = AUDIT_PERSIST_ENABLED ? readPersistedEvents(limit, sessionId) : [];
  const merged = new Map<string, HelixConversationHistoryEvent>();
  for (const event of [...persisted, ...eventBuffer]) {
    if (sessionId && event.session_id !== sessionId) continue;
    merged.set(event.event_id, event);
  }
  const ordered = sortBySequence(Array.from(merged.values()));
  return limit === null ? ordered : ordered.slice(-limit);
};

export const buildConversationTurnsFromEvents = (
  events: HelixConversationHistoryEvent[],
): HelixConversationHistoryTurn[] => {
  const byTurnId = new Map<string, HelixConversationHistoryTurn>();
  for (const event of sortBySequence(events)) {
    const existing = byTurnId.get(event.turn_id);
    const next: HelixConversationHistoryTurn =
      existing ?? {
        turn_id: event.turn_id,
        route: event.route,
        session_id: event.session_id ?? null,
        trace_id: event.trace_id ?? null,
        status: "in_progress",
        started_at: event.ts,
        updated_at: event.ts,
        user_text: event.user_text ?? null,
        assistant_text: event.assistant_text ?? null,
        classifier_result: event.classifier_result ?? null,
        route_reason: event.route_reason ?? null,
        brief_status: event.brief_status ?? null,
        final_gate_outcome: event.final_gate_outcome ?? null,
        fail_reason: event.fail_reason ?? null,
        last_seq: event.seq,
        event_count: 0,
      };
    next.route = event.route;
    next.session_id = event.session_id ?? next.session_id ?? null;
    next.trace_id = event.trace_id ?? next.trace_id ?? null;
    next.updated_at = event.ts;
    next.last_seq = event.seq;
    next.event_count += 1;
    if (event.user_text) next.user_text = event.user_text;
    if (event.assistant_text) next.assistant_text = event.assistant_text;
    if (event.classifier_result) next.classifier_result = event.classifier_result;
    if (event.route_reason) next.route_reason = event.route_reason;
    if (event.brief_status) next.brief_status = event.brief_status;
    if (event.final_gate_outcome) next.final_gate_outcome = event.final_gate_outcome;
    if (event.fail_reason) next.fail_reason = event.fail_reason;
    if (
      event.event_type === "conversation_turn_started" ||
      event.event_type === "ask_started"
    ) {
      next.status = "in_progress";
      next.started_at = existing?.started_at ?? event.ts;
    } else if (
      event.event_type === "conversation_turn_failed" ||
      event.event_type === "ask_failed"
    ) {
      next.status = "failed";
    } else if (
      event.event_type === "conversation_turn_interrupted" ||
      event.event_type === "ask_interrupted"
    ) {
      next.status = "interrupted";
    } else if (
      event.event_type === "conversation_turn_completed" ||
      event.event_type === "ask_completed"
    ) {
      if (next.status !== "failed" && next.status !== "interrupted") {
        next.status = "completed";
      }
    }
    byTurnId.set(event.turn_id, next);
  }
  return Array.from(byTurnId.values()).sort(
    (a, b) => a.last_seq - b.last_seq || a.started_at.localeCompare(b.started_at),
  );
};

export const buildRecentTurnsFromConversationHistory = (args: {
  sessionId?: string | null;
  events?: HelixConversationHistoryEvent[];
  limit?: number;
  excludeTurnId?: string | null;
}): string[] => {
  const sessionId = normalizeOptionalString(args.sessionId);
  if (!sessionId) return [];
  const limit = clampNumber(args.limit ?? 6, 1, 12);
  const excludeTurnId = normalizeOptionalString(args.excludeTurnId);
  const turns = buildConversationTurnsFromEvents(
    args.events ?? getConversationHistoryEvents({ sessionId }),
  )
    .filter((turn) => turn.session_id === sessionId)
    .filter((turn) => !excludeTurnId || turn.turn_id !== excludeTurnId)
    .sort((a, b) => a.last_seq - b.last_seq);
  const lines: string[] = [];
  for (const turn of turns) {
    const userText = clipHistoryText(turn.user_text, 440);
    if (userText) {
      lines.push(`user: ${userText}`);
    }
    const assistantText = clipHistoryText(turn.assistant_text, 440);
    if (assistantText) {
      lines.push(`dottie: ${assistantText}`);
    }
  }
  return lines.slice(-limit);
};

export const buildHelixAskMemoryCitation = (args: {
  evidenceRefs?: string[] | null;
  rolloutIds?: string[] | null;
}): HelixAskMemoryCitation | null => {
  const entries: HelixAskMemoryCitationEntry[] = [];
  const seenEntries = new Set<string>();
  for (const evidenceRef of args.evidenceRefs ?? []) {
    const parsed = parseMemoryCitationEntry(evidenceRef);
    if (!parsed) continue;
    const key = `${parsed.path}|${parsed.line_start ?? "null"}|${parsed.line_end ?? "null"}`;
    if (seenEntries.has(key)) continue;
    seenEntries.add(key);
    entries.push(parsed);
  }
  const rollout_ids = Array.from(
    new Set(
      (args.rolloutIds ?? [])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
  if (entries.length === 0 && rollout_ids.length === 0) return null;
  return {
    entries: entries.slice(0, 12),
    rollout_ids,
  };
};

export const getConversationHistoryLogPath = (): string => AUDIT_LOG_PATH;

export const __resetConversationHistoryStore = (): void => {
  eventBuffer.length = 0;
  eventSequence = 0;
  persistedBytes = 0;
};

function resolveAuditLogPath(): string {
  const explicit = process.env.HELIX_ASK_CONVERSATION_HISTORY_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.HELIX_ASK_CONVERSATION_HISTORY_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "helix-conversation-history.jsonl");
}

function collectAuditLogPaths(): string[] {
  const dir = path.dirname(AUDIT_LOG_PATH);
  const ext = path.extname(AUDIT_LOG_PATH) || ".jsonl";
  const base = path.basename(AUDIT_LOG_PATH, ext);
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
  return fs.existsSync(AUDIT_LOG_PATH) ? [...rotated, AUDIT_LOG_PATH] : rotated;
}

function parseAuditRecord(line: string): HelixConversationHistoryEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<HelixConversationHistoryEvent>;
    if (
      parsed.kind !== "helix.ask.conversation_history" ||
      parsed.version !== 1 ||
      typeof parsed.event_id !== "string" ||
      !parsed.event_id.trim() ||
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
      kind: "helix.ask.conversation_history",
      version: 1,
      event_id: parsed.event_id.trim(),
      seq: Math.max(0, Math.floor(parsed.seq)),
      ts: parsed.ts.trim(),
      route:
        parsed.route === "/ask" || parsed.route === "/ask/conversation-turn"
          ? parsed.route
          : "/ask",
      event_type: parsed.event_type as HelixConversationHistoryEventType,
      turn_id: parsed.turn_id.trim(),
      session_id: normalizeOptionalString(parsed.session_id),
      trace_id: normalizeOptionalString(parsed.trace_id),
      user_text: clipHistoryText(parsed.user_text),
      assistant_text: clipHistoryText(parsed.assistant_text),
      classifier_result: normalizeClassifierResult(parsed.classifier_result),
      route_reason: clipHistoryText(parsed.route_reason, 220),
      brief_status: normalizeOptionalString(parsed.brief_status),
      final_gate_outcome: clipHistoryText(parsed.final_gate_outcome, 220),
      fail_reason: clipHistoryText(parsed.fail_reason, 220),
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
): HelixConversationHistoryEvent[] {
  if (!AUDIT_PERSIST_ENABLED) return [];
  const parsed: HelixConversationHistoryEvent[] = [];
  for (const filePath of collectAuditLogPaths()) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const record = parseAuditRecord(line);
        if (!record) continue;
        if (sessionId && record.session_id !== sessionId) continue;
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
  if (!AUDIT_PERSIST_ENABLED) return 0;
  try {
    const stat = fs.statSync(AUDIT_LOG_PATH);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function persistAuditRecord(record: HelixConversationHistoryEvent): void {
  if (!AUDIT_PERSIST_ENABLED) return;
  const line = JSON.stringify(record);
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
  maybeRotateAuditLog(lineBytes);
  fs.appendFileSync(AUDIT_LOG_PATH, `${line}\n`, "utf8");
  persistedBytes += lineBytes;
}

function maybeRotateAuditLog(nextBytes: number): void {
  if (ROTATE_MAX_BYTES <= 0) return;
  if (persistedBytes + nextBytes <= ROTATE_MAX_BYTES) return;
  rotateAuditLog();
}

function rotateAuditLog(): void {
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    persistedBytes = 0;
    return;
  }
  const dir = path.dirname(AUDIT_LOG_PATH);
  const ext = path.extname(AUDIT_LOG_PATH) || ".jsonl";
  const base = path.basename(AUDIT_LOG_PATH, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const rotated = path.join(dir, `${base}.${stamp}${ext}`);
  fs.renameSync(AUDIT_LOG_PATH, rotated);
  persistedBytes = 0;
  pruneAuditRotations(dir, base, ext);
}

function pruneAuditRotations(dir: string, base: string, ext: string): void {
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

function parseMemoryCitationEntry(
  evidenceRef: string,
): HelixAskMemoryCitationEntry | null {
  const raw = String(evidenceRef ?? "").trim();
  if (!raw) return null;
  const hashRange = /^(.*)#L(\d+)(?:-L?(\d+))?$/i.exec(raw);
  if (hashRange) {
    const pathValue = hashRange[1]?.trim();
    if (!pathValue) return null;
    const start = Number.parseInt(hashRange[2] ?? "", 10);
    const end = Number.parseInt(hashRange[3] ?? hashRange[2] ?? "", 10);
    return {
      path: pathValue,
      line_start: Number.isFinite(start) ? start : null,
      line_end: Number.isFinite(end) ? end : null,
      note: `source=evidence_ref; ref=${raw}`,
    };
  }
  const colonLRange = /^(.*):L(\d+)(?:-L?(\d+))?$/i.exec(raw);
  if (colonLRange) {
    const pathValue = colonLRange[1]?.trim();
    if (!pathValue) return null;
    const start = Number.parseInt(colonLRange[2] ?? "", 10);
    const end = Number.parseInt(colonLRange[3] ?? colonLRange[2] ?? "", 10);
    return {
      path: pathValue,
      line_start: Number.isFinite(start) ? start : null,
      line_end: Number.isFinite(end) ? end : null,
      note: `source=evidence_ref; ref=${raw}`,
    };
  }
  const colonRange = /^(.*):(\d+)(?:-(\d+))?$/.exec(raw);
  if (colonRange) {
    const pathValue = colonRange[1]?.trim();
    if (!pathValue || /\s/.test(pathValue)) {
      return {
        path: raw,
        line_start: null,
        line_end: null,
        note: `source=evidence_ref; ref=${raw}`,
      };
    }
    const start = Number.parseInt(colonRange[2] ?? "", 10);
    const end = Number.parseInt(colonRange[3] ?? colonRange[2] ?? "", 10);
    return {
      path: pathValue,
      line_start: Number.isFinite(start) ? start : null,
      line_end: Number.isFinite(end) ? end : null,
      note: `source=evidence_ref; ref=${raw}`,
    };
  }
  return {
    path: raw,
    line_start: null,
    line_end: null,
    note: `source=evidence_ref; ref=${raw}`,
  };
}

hydrateFromPersisted();
