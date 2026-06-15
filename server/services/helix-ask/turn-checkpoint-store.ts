import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  HELIX_ASK_TURN_CHECKPOINT_SCHEMA,
  HELIX_ASK_TURN_JOURNAL_SCHEMA,
  HELIX_ASK_TURN_RECOVERY_SCHEMA,
  type HelixAskTurnCheckpointAuthority,
  type HelixAskTurnCheckpointRecord,
  type HelixAskTurnCheckpointStatus,
  type HelixAskTurnCheckpointTranscriptEvent,
  type HelixAskTurnCheckpointType,
  type HelixAskTurnJournal,
  type HelixAskTurnJournalSummary,
  type HelixAskTurnRecovery,
} from "@shared/helix-ask-turn-checkpoint";

const DEFAULT_MAX_TEXT_CHARS = 4_000;

const CHECKPOINT_AUTHORITY: HelixAskTurnCheckpointAuthority = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  terminal_ineligible_reason: "ask_turn_checkpoint_is_recovery_context_only",
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const clipCheckpointText = (value: unknown, limit = DEFAULT_MAX_TEXT_CHARS): string | null => {
  const normalized = normalizeOptionalString(value);
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const resolveCheckpointPath = (): string => {
  const explicit = process.env.HELIX_ASK_TURN_CHECKPOINT_PATH?.trim();
  if (explicit) return path.resolve(explicit);
  const dir = process.env.HELIX_ASK_TURN_CHECKPOINT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "helix-ask-turn-checkpoints.jsonl");
};

const checkpointPersistEnabled = (): boolean =>
  process.env.HELIX_ASK_TURN_CHECKPOINT_PERSIST !== "0";

const normalizeTranscriptEvent = (
  value: unknown,
): HelixAskTurnCheckpointTranscriptEvent | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = normalizeOptionalString(record.id) ?? `transcript:${crypto.randomUUID()}`;
  const atMs = readNumber(record.at_ms) ?? Date.now();
  const role = normalizeOptionalString(record.role);
  const type = normalizeOptionalString(record.type);
  const text = clipCheckpointText(record.text);
  if (!role || !type || !text) return null;
  return {
    id,
    turn_id: normalizeOptionalString(record.turn_id),
    seq: readNumber(record.seq) ?? undefined,
    at_ms: atMs,
    role:
      role === "user" ||
      role === "agent" ||
      role === "tool" ||
      role === "final" ||
      role === "system"
        ? role
        : "system",
    type,
    status: normalizeOptionalString(record.status),
    text,
    detail: clipCheckpointText(record.detail, 1_000),
    source_event_type: normalizeOptionalString(record.source_event_type),
    event_source:
      record.event_source === "live" ||
      record.event_source === "runtime" ||
      record.event_source === "reconstructed"
        ? record.event_source
        : undefined,
    reconstructed: record.reconstructed === true ? true : undefined,
  };
};

const normalizeCheckpointRecord = (
  value: unknown,
): HelixAskTurnCheckpointRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Partial<HelixAskTurnCheckpointRecord>;
  if (
    record.schema !== HELIX_ASK_TURN_CHECKPOINT_SCHEMA ||
    typeof record.record_id !== "string" ||
    typeof record.recorded_at !== "string" ||
    typeof record.thread_id !== "string" ||
    typeof record.turn_id !== "string"
  ) {
    return null;
  }
  const checkpointType = normalizeCheckpointType(record.checkpoint_type);
  const status = normalizeCheckpointStatus(record.status);
  if (!checkpointType || !status) return null;
  return {
    schema: HELIX_ASK_TURN_CHECKPOINT_SCHEMA,
    record_id: record.record_id.trim(),
    recorded_at: record.recorded_at.trim(),
    thread_id: record.thread_id.trim(),
    turn_id: record.turn_id.trim(),
    session_id: normalizeOptionalString(record.session_id),
    trace_id: normalizeOptionalString(record.trace_id),
    route: normalizeOptionalString(record.route) ?? "/ask/turn",
    checkpoint_type: checkpointType,
    status,
    prompt_text: clipCheckpointText(record.prompt_text),
    transcript_event: normalizeTranscriptEvent(record.transcript_event),
    terminal_text: clipCheckpointText(record.terminal_text),
    terminal_text_hash: normalizeOptionalString(record.terminal_text_hash),
    terminal_artifact_kind: normalizeOptionalString(record.terminal_artifact_kind),
    final_answer_source: normalizeOptionalString(record.final_answer_source),
    error_code: normalizeOptionalString(record.error_code),
    authority: CHECKPOINT_AUTHORITY,
  };
};

const normalizeCheckpointType = (
  value: unknown,
): HelixAskTurnCheckpointType | null =>
  value === "turn_started" ||
  value === "transcript_event" ||
  value === "terminal_payload" ||
  value === "turn_completed" ||
  value === "turn_failed" ||
  value === "turn_interrupted"
    ? value
    : null;

const normalizeCheckpointStatus = (
  value: unknown,
): HelixAskTurnCheckpointStatus | null =>
  value === "running" ||
  value === "checkpointed" ||
  value === "final_answer" ||
  value === "final_failure" ||
  value === "pending_input" ||
  value === "completed" ||
  value === "failed" ||
  value === "interrupted"
    ? value
    : null;

export function recordHelixAskTurnCheckpoint(input: {
  thread_id: string;
  turn_id: string;
  session_id?: string | null;
  trace_id?: string | null;
  route?: string | null;
  checkpoint_type: HelixAskTurnCheckpointType;
  status: HelixAskTurnCheckpointStatus;
  prompt_text?: string | null;
  transcript_event?: unknown;
  terminal_text?: string | null;
  terminal_text_hash?: string | null;
  terminal_artifact_kind?: string | null;
  final_answer_source?: string | null;
  error_code?: string | null;
  recorded_at?: string | null;
}): HelixAskTurnCheckpointRecord {
  const record: HelixAskTurnCheckpointRecord = {
    schema: HELIX_ASK_TURN_CHECKPOINT_SCHEMA,
    record_id: `ask_checkpoint:${crypto.randomUUID()}`,
    recorded_at: input.recorded_at?.trim() || new Date().toISOString(),
    thread_id: input.thread_id.trim(),
    turn_id: input.turn_id.trim(),
    session_id: normalizeOptionalString(input.session_id),
    trace_id: normalizeOptionalString(input.trace_id),
    route: normalizeOptionalString(input.route) ?? "/ask/turn",
    checkpoint_type: input.checkpoint_type,
    status: input.status,
    prompt_text: clipCheckpointText(input.prompt_text),
    transcript_event: normalizeTranscriptEvent(input.transcript_event),
    terminal_text: clipCheckpointText(input.terminal_text),
    terminal_text_hash: normalizeOptionalString(input.terminal_text_hash),
    terminal_artifact_kind: normalizeOptionalString(input.terminal_artifact_kind),
    final_answer_source: normalizeOptionalString(input.final_answer_source),
    error_code: normalizeOptionalString(input.error_code),
    authority: CHECKPOINT_AUTHORITY,
  };
  if (!checkpointPersistEnabled()) return record;
  const checkpointPath = resolveCheckpointPath();
  fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
  fs.appendFileSync(checkpointPath, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function readHelixAskTurnCheckpointRecords(options?: {
  thread_id?: string | null;
  session_id?: string | null;
  turn_id?: string | null;
  limit?: number | null;
}): HelixAskTurnCheckpointRecord[] {
  if (!checkpointPersistEnabled()) return [];
  const checkpointPath = resolveCheckpointPath();
  if (!fs.existsSync(checkpointPath)) return [];
  const threadId = normalizeOptionalString(options?.thread_id);
  const sessionId = normalizeOptionalString(options?.session_id);
  const turnId = normalizeOptionalString(options?.turn_id);
  const limit =
    options?.limit === null || options?.limit === undefined
      ? null
      : Math.max(1, Math.floor(options.limit));
  const records: HelixAskTurnCheckpointRecord[] = [];
  const raw = fs.readFileSync(checkpointPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const record = normalizeCheckpointRecord(JSON.parse(trimmed));
      if (!record) continue;
      if (threadId && record.thread_id !== threadId) continue;
      if (sessionId && record.session_id !== sessionId) continue;
      if (turnId && record.turn_id !== turnId) continue;
      records.push(record);
    } catch {
      continue;
    }
  }
  const ordered = records.sort(
    (left, right) =>
      left.recorded_at.localeCompare(right.recorded_at) ||
      left.record_id.localeCompare(right.record_id),
  );
  return limit === null ? ordered : ordered.slice(-limit);
}

const groupRecordsByTurn = (
  records: readonly HelixAskTurnCheckpointRecord[],
): Map<string, HelixAskTurnCheckpointRecord[]> => {
  const grouped = new Map<string, HelixAskTurnCheckpointRecord[]>();
  for (const record of records) {
    const group = grouped.get(record.turn_id) ?? [];
    group.push(record);
    grouped.set(record.turn_id, group);
  }
  return grouped;
};

const latestRecord = (
  records: readonly HelixAskTurnCheckpointRecord[],
): HelixAskTurnCheckpointRecord | null =>
  records
    .slice()
    .sort(
      (left, right) =>
        left.recorded_at.localeCompare(right.recorded_at) ||
        left.record_id.localeCompare(right.record_id),
    )
    .at(-1) ?? null;

const latestTurnIdFromRecords = (
  records: readonly HelixAskTurnCheckpointRecord[],
): string | null => {
  const grouped = groupRecordsByTurn(records);
  let selected: HelixAskTurnCheckpointRecord | null = null;
  for (const group of grouped.values()) {
    const candidate = latestRecord(group);
    if (!candidate) continue;
    if (
      !selected ||
      selected.recorded_at.localeCompare(candidate.recorded_at) < 0 ||
      (selected.recorded_at === candidate.recorded_at &&
        selected.record_id.localeCompare(candidate.record_id) < 0)
    ) {
      selected = candidate;
    }
  }
  return selected?.turn_id ?? null;
};

export function buildHelixAskTurnRecovery(input: {
  thread_id?: string | null;
  session_id?: string | null;
  turn_id: string;
  limit?: number | null;
}): HelixAskTurnRecovery {
  const records = readHelixAskTurnCheckpointRecords({
    thread_id: input.thread_id ?? null,
    session_id: input.session_id ?? null,
    turn_id: input.turn_id,
    limit: input.limit ?? null,
  });
  const first = records[0] ?? null;
  const last = records.at(-1) ?? null;
  const terminal = [...records].reverse().find((record) => record.terminal_text);
  const transcriptEvents = records
    .map((record) => record.transcript_event)
    .filter((event): event is HelixAskTurnCheckpointTranscriptEvent => Boolean(event));
  const latestVisible =
    [...transcriptEvents].reverse().find((event) => event.text)?.text ??
    terminal?.terminal_text ??
    null;
  return {
    schema: HELIX_ASK_TURN_RECOVERY_SCHEMA,
    thread_id: first?.thread_id ?? input.thread_id ?? "unknown",
    turn_id: first?.turn_id ?? input.turn_id,
    session_id: last?.session_id ?? first?.session_id ?? null,
    trace_id: last?.trace_id ?? first?.trace_id ?? null,
    status: last?.status ?? "unknown",
    recoverable: records.length > 0,
    checkpoint_count: records.length,
    last_checkpoint_at: last?.recorded_at ?? null,
    prompt_text: first?.prompt_text ?? null,
    transcript_events: transcriptEvents,
    latest_visible_text: latestVisible,
    terminal_text: terminal?.terminal_text ?? null,
    terminal_text_hash: terminal?.terminal_text_hash ?? null,
    terminal_artifact_kind: terminal?.terminal_artifact_kind ?? null,
    final_answer_source: terminal?.final_answer_source ?? null,
    authority: CHECKPOINT_AUTHORITY,
  };
}

export function buildLatestHelixAskTurnRecovery(input: {
  thread_id?: string | null;
  session_id?: string | null;
  limit?: number | null;
}): HelixAskTurnRecovery | null {
  const records = readHelixAskTurnCheckpointRecords({
    thread_id: input.thread_id ?? null,
    session_id: input.session_id ?? null,
    limit: null,
  });
  const turnId = latestTurnIdFromRecords(records);
  if (!turnId) return null;
  return buildHelixAskTurnRecovery({
    thread_id: input.thread_id ?? null,
    session_id: input.session_id ?? null,
    turn_id: turnId,
    limit: input.limit ?? null,
  });
}

const buildJournalSummary = (
  records: readonly HelixAskTurnCheckpointRecord[],
): HelixAskTurnJournalSummary => {
  const latest = latestRecord(records);
  const grouped = groupRecordsByTurn(records);
  return {
    checkpoint_count: records.length,
    transcript_event_count: records.filter((record) => record.checkpoint_type === "transcript_event").length,
    terminal_payload_count: records.filter((record) => record.checkpoint_type === "terminal_payload").length,
    completed_turn_count: records.filter((record) => record.checkpoint_type === "turn_completed").length,
    failed_turn_count: records.filter((record) => record.checkpoint_type === "turn_failed").length,
    interrupted_turn_count: records.filter((record) => record.checkpoint_type === "turn_interrupted").length,
    latest_turn_id: latest?.turn_id ?? null,
    latest_status: latest?.status ?? "unknown",
    latest_checkpoint_at: latest?.recorded_at ?? null,
    recoverable_turn_count: grouped.size,
  };
};

export function buildHelixAskTurnJournal(input: {
  thread_id?: string | null;
  session_id?: string | null;
  turn_id?: string | null;
  limit?: number | null;
}): HelixAskTurnJournal {
  const requestedTurnId = normalizeOptionalString(input.turn_id);
  const allMatchingRecords = readHelixAskTurnCheckpointRecords({
    thread_id: input.thread_id ?? null,
    session_id: input.session_id ?? null,
    turn_id: requestedTurnId,
    limit: null,
  });
  const selectedTurnId = requestedTurnId ?? latestTurnIdFromRecords(allMatchingRecords);
  const selectedRecords = selectedTurnId
    ? readHelixAskTurnCheckpointRecords({
        thread_id: input.thread_id ?? null,
        session_id: input.session_id ?? null,
        turn_id: selectedTurnId,
        limit: input.limit ?? null,
      })
    : [];
  const recovery = selectedTurnId
    ? buildHelixAskTurnRecovery({
        thread_id: input.thread_id ?? null,
        session_id: input.session_id ?? null,
        turn_id: selectedTurnId,
        limit: input.limit ?? null,
      })
    : null;
  return {
    schema: HELIX_ASK_TURN_JOURNAL_SCHEMA,
    generated_at: new Date().toISOString(),
    thread_id: normalizeOptionalString(input.thread_id),
    session_id: normalizeOptionalString(input.session_id),
    turn_id: selectedTurnId,
    records: selectedRecords,
    recovery,
    summary: buildJournalSummary(requestedTurnId ? selectedRecords : allMatchingRecords),
    authority: CHECKPOINT_AUTHORITY,
  };
}

export function getHelixAskTurnCheckpointPath(): string {
  return resolveCheckpointPath();
}
