type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null);

const readString = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

const readStringArray = (value: unknown, limit: number): string[] =>
  Array.isArray(value) ? Array.from(new Set(value.map(readString).filter((entry): entry is string => Boolean(entry)))).slice(0, limit) : [];

export const summarizeHelixTerminalRejectionObservationForDebugExport = (value: unknown): RecordLike | null => {
  const record = readRecord(value);
  if (!record) return null;
  return {
    schema: readString(record.schema),
    turn_id: readString(record.turn_id),
    observation_id: readString(record.observation_id),
    rejected_candidate_kind: readString(record.rejected_candidate_kind),
    rejected_candidate_ref: readString(record.rejected_candidate_ref),
    rejection_reason: readString(record.rejection_reason),
    gate: readString(record.gate),
    reason_codes: readStringArray(record.reason_codes, 16),
    evidence_refs: readStringArray(record.evidence_refs, 32),
    recoverable: record.recoverable === true,
    failure_class: readString(record.failure_class),
    retryability: readString(record.retryability),
    next_affordances: Array.isArray(record.next_affordances) ? record.next_affordances.slice(0, 6) : [],
    terminal_eligible: record.terminal_eligible === true,
    assistant_answer: record.assistant_answer === true,
  };
};
