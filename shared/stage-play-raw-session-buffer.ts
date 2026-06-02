export const STAGE_PLAY_RAW_SESSION_BUFFER_ENTRY_SCHEMA =
  "stage_play_raw_session_buffer_entry/v1" as const;

export const STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS = [
  "transcript",
  "frame_ref",
  "audio_ref",
  "world_event_ref",
  "debug_log",
] as const;

export const STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES = [
  "session_ttl",
  "manual_clear",
  "disabled",
] as const;

export type StagePlayRawSessionBufferRawKindV1 =
  (typeof STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS)[number];

export type StagePlayRawSessionBufferRetentionPolicyV1 =
  (typeof STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES)[number];

export type StagePlayRawSessionBufferEntryV1 = {
  schema: typeof STAGE_PLAY_RAW_SESSION_BUFFER_ENTRY_SCHEMA;
  entryId: string;
  sessionId: string;
  threadId: string;
  roomId?: string | null;
  sourceId: string;
  modality:
    | "visual_frame"
    | "audio_transcript"
    | "world_event"
    | "text_chat"
    | string;
  sourceEventId?: string | null;
  fromTs: string;
  toTs: string;
  rawKind: StagePlayRawSessionBufferRawKindV1;
  rawRef: string;
  rawTextPreview?: string | null;
  retention: {
    policy: StagePlayRawSessionBufferRetentionPolicyV1;
    ttlMs?: number | null;
    expiresAt?: string | null;
  };
  evidenceRefs: string[];
  assistant_answer: false;
  context_role: "audit_buffer_not_graph";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

export function validateStagePlayRawSessionBufferEntryV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["entry must be an object"];

  if (value.schema !== STAGE_PLAY_RAW_SESSION_BUFFER_ENTRY_SCHEMA) {
    issues.push(`schema must be ${STAGE_PLAY_RAW_SESSION_BUFFER_ENTRY_SCHEMA}`);
  }
  for (const field of ["entryId", "sessionId", "threadId", "sourceId", "modality", "fromTs", "toTs", "rawRef"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (value.roomId != null && typeof value.roomId !== "string") issues.push("roomId must be a string or null");
  if (value.sourceEventId != null && typeof value.sourceEventId !== "string") issues.push("sourceEventId must be a string or null");
  if (!includes(STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS, value.rawKind)) issues.push("rawKind is invalid");
  if (value.rawTextPreview != null && typeof value.rawTextPreview !== "string") {
    issues.push("rawTextPreview must be a string or null");
  }
  if (!isRecord(value.retention)) {
    issues.push("retention must be an object");
  } else {
    if (!includes(STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES, value.retention.policy)) {
      issues.push("retention.policy is invalid");
    }
    if (value.retention.ttlMs != null && (typeof value.retention.ttlMs !== "number" || !Number.isFinite(value.retention.ttlMs) || value.retention.ttlMs < 0)) {
      issues.push("retention.ttlMs must be a non-negative finite number or null");
    }
    if (value.retention.expiresAt != null && typeof value.retention.expiresAt !== "string") {
      issues.push("retention.expiresAt must be a string or null");
    }
  }
  if (!isStringArray(value.evidenceRefs)) issues.push("evidenceRefs must be strings");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "audit_buffer_not_graph") {
    issues.push("context_role must be audit_buffer_not_graph");
  }

  return issues;
}

export function isStagePlayRawSessionBufferEntryV1(value: unknown): value is StagePlayRawSessionBufferEntryV1 {
  return validateStagePlayRawSessionBufferEntryV1(value).length === 0;
}
