const uniqueAskTurnStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const readAskTurnString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const STAGE_PLAY_MAIL_LOOP_PROGRESS_REF_RE =
  /\b(?:stage_play_processed_mail_packet|stage_play_live_source_mail_decision|stage_play_live_source_narrative_state|stage_play_live_source_mail_wake_result|stage_play_live_source_voice_delivery_receipt|helix_interim_voice_callout_receipt|dottie_voice_receipt|voice_receipt):[A-Za-z0-9._:-]+\b/g;

export const isMailLoopProgressRef = (value: string): boolean =>
  /^(?:stage_play_processed_mail_packet|stage_play_live_source_mail_decision|stage_play_live_source_narrative_state|stage_play_live_source_mail_wake_result|stage_play_live_source_voice_delivery_receipt|helix_interim_voice_callout_receipt|dottie_voice_receipt|voice_receipt):/i.test(value);

export const collectMailLoopProgressRefs = (value: unknown, seen = new Set<unknown>()): string[] => {
  if (value == null) return [];
  if (typeof value === "string") {
    return Array.from(value.matchAll(STAGE_PLAY_MAIL_LOOP_PROGRESS_REF_RE)).map((match) => match[0]);
  }
  if (typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) {
    return uniqueAskTurnStrings(value.flatMap((entry) => collectMailLoopProgressRefs(entry, seen)));
  }
  const record = value as Record<string, unknown>;
  const directRefs = [
    readAskTurnString(record.packetId ?? record.packet_id),
    readAskTurnString(record.decisionId ?? record.decision_id),
    readAskTurnString(record.narrativeStateId ?? record.narrative_state_id ?? record.narrativeStateRef ?? record.narrative_state_ref),
    readAskTurnString(record.wakeResultId ?? record.wake_result_id),
    readAskTurnString(record.receiptId ?? record.receipt_id),
  ].filter((entry): entry is string => Boolean(entry));
  return uniqueAskTurnStrings([
    ...directRefs.filter(isMailLoopProgressRef),
    ...Object.values(record).flatMap((entry) => collectMailLoopProgressRefs(entry, seen)),
  ]);
};
