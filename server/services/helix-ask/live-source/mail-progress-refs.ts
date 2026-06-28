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

export type MailLoopToolProgressKind =
  | "processed_packet"
  | "mail_decision"
  | "narrative_state"
  | "voice_candidate"
  | "voice_receipt"
  | "wake_result"
  | "no_progress";

export type MailLoopToolProgressReceipt = {
  schema: "helix.mail_loop_tool_progress_receipt.v1";
  turn_id: string;
  iteration: number;
  toolName: string;
  producedRefs: string[];
  newRefs: string[];
  progressKind: MailLoopToolProgressKind;
  assistant_answer: false;
  raw_content_included: false;
};

export type MailLoopToolProgressReceiptDependencies = {
  readRuntimeRecord: (value: unknown) => Record<string, unknown> | null;
  processedMailReadObservationNeedsProcessFallback: (
    observation: Record<string, unknown> | null | undefined,
  ) => boolean;
  processedMailReadObservationHasPacket: (
    observation: Record<string, unknown> | null | undefined,
  ) => boolean;
};

export type BuildMailLoopToolProgressReceiptArgs = {
  turnId: string;
  iteration: number;
  toolName: string;
  observation: Record<string, unknown> | null | undefined;
  previousRefs: Set<string>;
};

export const mailLoopProgressKindForRefs = (
  refs: string[],
  observation: Record<string, unknown> | null | undefined,
): MailLoopToolProgressKind => {
  if (refs.length === 0) return "no_progress";
  if (refs.some((ref) => /^stage_play_live_source_mail_decision:/i.test(ref))) return "mail_decision";
  if (refs.some((ref) => /^stage_play_live_source_narrative_state:/i.test(ref))) return "narrative_state";
  if (refs.some((ref) => /^stage_play_live_source_mail_wake_result:/i.test(ref))) return "wake_result";
  if (refs.some((ref) => /^(?:stage_play_live_source_voice_delivery_receipt|helix_interim_voice_callout_receipt|dottie_voice_receipt|voice_receipt):/i.test(ref))) {
    return "voice_receipt";
  }
  const observationText = JSON.stringify(observation ?? {});
  if (/\bvoiceCandidate["']?\s*:\s*true|\bvoice_candidate["']?\s*:\s*true|voice_callout_request/i.test(observationText)) {
    return "voice_candidate";
  }
  if (refs.some((ref) => /^stage_play_processed_mail_packet:/i.test(ref))) return "processed_packet";
  return "no_progress";
};

export const createMailLoopToolProgressReceiptBuilder = (
  dependencies: MailLoopToolProgressReceiptDependencies,
) => (args: BuildMailLoopToolProgressReceiptArgs): MailLoopToolProgressReceipt => {
  const outerObservation = args.observation;
  const observation = dependencies.readRuntimeRecord(outerObservation?.observation) ?? outerObservation;
  const producedRefs = uniqueAskTurnStrings(collectMailLoopProgressRefs(observation));
  const newRefs = producedRefs.filter((ref) => !args.previousRefs.has(ref));
  const processFallbackNeeded =
    args.toolName === "live_env.read_processed_live_source_mail" &&
    dependencies.processedMailReadObservationNeedsProcessFallback(observation);
  const processToolProgress =
    args.toolName === "live_env.process_live_source_mail" &&
    (
      outerObservation?.ok === true ||
      dependencies.processedMailReadObservationHasPacket(observation)
    );
  return {
    schema: "helix.mail_loop_tool_progress_receipt.v1",
    turn_id: args.turnId,
    iteration: args.iteration,
    toolName: args.toolName,
    producedRefs,
    newRefs,
    progressKind: newRefs.length > 0
      ? mailLoopProgressKindForRefs(newRefs, observation)
      : processFallbackNeeded
        ? "processed_packet"
        : processToolProgress
          ? "processed_packet"
          : "no_progress",
    assistant_answer: false,
    raw_content_included: false,
  };
};
