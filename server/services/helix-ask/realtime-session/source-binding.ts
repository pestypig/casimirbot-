type RecordLike = Record<string, unknown>;

const SOURCE_BINDING_KEYS = [
  "thread_id",
  "room_id",
  "room_runtime_id",
  "participant_id",
  "shared_context_mode",
  "source_id",
  "source_kind",
  "panel_id",
  "focus_panel_id",
  "document_ref",
  "document_path",
] as const;

const WORKSTATION_CONTEXT_KEYS = [
  "panel_id",
  "focus_panel_id",
  "document_ref",
  "document_path",
] as const;

const readRecord = (value: unknown): RecordLike =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const isSafeBindingValue = (value: string): boolean =>
  value.length <= 260 &&
  !/\b(?:api[_-]?key|authorization|bearer|secret|password|token|cookie)\b/i.test(value) &&
  !/\b(?:sk|sess|key)-[A-Za-z0-9_-]{16,}\b/.test(value);

export const readSafeRealtimeSourceBinding = (value: unknown): RecordLike | null => {
  const raw = readRecord(value);
  const safe: RecordLike = {};
  for (const key of SOURCE_BINDING_KEYS) {
    const entry = readString(raw[key]);
    if (entry && isSafeBindingValue(entry)) safe[key] = entry;
  }
  return Object.keys(safe).length > 0 ? safe : null;
};

export const mergeRealtimeWorkstationSourceBinding = (input: {
  base: RecordLike | null | undefined;
  current: RecordLike | null | undefined;
}): RecordLike | null => {
  const base = readSafeRealtimeSourceBinding(input.base);
  const current = readSafeRealtimeSourceBinding(input.current);
  if (!current) return base;

  const merged: RecordLike = { ...(base ?? {}) };
  for (const key of WORKSTATION_CONTEXT_KEYS) delete merged[key];
  for (const key of WORKSTATION_CONTEXT_KEYS) {
    if (current[key] !== undefined) merged[key] = current[key];
  }
  for (const key of [
    "thread_id",
    "room_id",
    "room_runtime_id",
    "participant_id",
    "shared_context_mode",
    "source_id",
    "source_kind",
  ] as const) {
    if (merged[key] === undefined && current[key] !== undefined) merged[key] = current[key];
  }
  return Object.keys(merged).length > 0 ? merged : null;
};
