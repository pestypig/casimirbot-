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

export type MailLoopToolProgressBudget = {
  maxContinuationWakesPerCycle: number;
  maxNoProgressRepeats: number;
};

export type MailLoopToolProgressLoopState = {
  tool_progress_receipts?: MailLoopToolProgressReceipt[];
  mail_loop_no_progress_repeat_count?: number;
  mail_loop_continuation_wake_count?: number;
};

export type MailLoopToolProgressPayloadState = {
  mail_loop_tool_progress_receipts?: MailLoopToolProgressReceipt[];
  mail_loop_continuation_budget?: unknown;
  debug?: unknown;
};

export type MailLoopToolProgressLoopIteration = {
  tool_progress_receipt?: MailLoopToolProgressReceipt;
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

export type AppendMailLoopToolProgressReceiptArgs = {
  mailLoopContinuationBudget: unknown | null | undefined;
  turnId: string;
  iteration: number;
  toolName: string;
  observation: Record<string, unknown> | null | undefined;
  loop: MailLoopToolProgressLoopState;
  payload: MailLoopToolProgressPayloadState;
  loopIteration: MailLoopToolProgressLoopIteration;
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

export type MailLoopToolProgressReceiptAppenderDependencies = {
  buildMailLoopToolProgressReceipt: (args: BuildMailLoopToolProgressReceiptArgs) => MailLoopToolProgressReceipt;
};

export const createMailLoopToolProgressReceiptAppender = (
  dependencies: MailLoopToolProgressReceiptAppenderDependencies,
) => (args: AppendMailLoopToolProgressReceiptArgs): MailLoopToolProgressReceipt | null => {
  if (!args.mailLoopContinuationBudget) return null;
  const previousReceipts = args.loop.tool_progress_receipts ?? [];
  const previousRefs = new Set(previousReceipts.flatMap((receipt) => receipt.producedRefs));
  let receipt = dependencies.buildMailLoopToolProgressReceipt({
    turnId: args.turnId,
    iteration: args.iteration,
    toolName: args.toolName,
    observation: args.observation,
    previousRefs,
  });
  const previousReceipt = previousReceipts.at(-1) ?? null;
  if (
    receipt.toolName === "live_env.read_processed_live_source_mail" &&
    receipt.progressKind === "no_progress" &&
    receipt.producedRefs.length > 0 &&
    previousReceipt?.toolName === "live_env.process_live_source_mail" &&
    previousReceipt.progressKind === "processed_packet" &&
    receipt.producedRefs.some((ref) => previousReceipt.producedRefs.includes(ref))
  ) {
    receipt = {
      ...receipt,
      progressKind: "processed_packet",
    };
  }
  args.loop.tool_progress_receipts = [...(args.loop.tool_progress_receipts ?? []), receipt];
  args.loopIteration.tool_progress_receipt = receipt;
  if (receipt.progressKind === "no_progress") {
    args.loop.mail_loop_no_progress_repeat_count = (args.loop.mail_loop_no_progress_repeat_count ?? 0) + 1;
  } else {
    args.loop.mail_loop_no_progress_repeat_count = 0;
  }
  if (receipt.progressKind === "wake_result") {
    args.loop.mail_loop_continuation_wake_count = (args.loop.mail_loop_continuation_wake_count ?? 0) + 1;
  }
  args.payload.mail_loop_tool_progress_receipts = args.loop.tool_progress_receipts;
  args.payload.mail_loop_continuation_budget = args.mailLoopContinuationBudget;
  if (args.payload.debug && typeof args.payload.debug === "object") {
    const debug = args.payload.debug as Record<string, unknown>;
    debug.mail_loop_tool_progress_receipts = args.loop.tool_progress_receipts;
    debug.mail_loop_continuation_budget = args.mailLoopContinuationBudget;
  }
  return receipt;
};

export type MailLoopProgressStopReasonDependencies = {
  hasStagePlayLiveSourceMailDecisionObservation: (artifacts: unknown[]) => boolean;
};

export type ResolveMailLoopProgressStopReasonArgs = {
  mailLoopContinuationBudget: MailLoopToolProgressBudget | null | undefined;
  receipt: MailLoopToolProgressReceipt | null;
  goalSatisfaction: string | null | undefined;
  currentTurnArtifacts: unknown[];
  loop: MailLoopToolProgressLoopState;
};

export const createMailLoopProgressStopReasonResolver = (
  dependencies: MailLoopProgressStopReasonDependencies,
) => (args: ResolveMailLoopProgressStopReasonArgs): string | null => {
  if (!args.mailLoopContinuationBudget || !args.receipt) return null;
  if (args.goalSatisfaction === "satisfied") return null;
  const emptyMailboxReadRequiresDecision =
    args.receipt.toolName === "live_env.read_live_source_mail" &&
    args.receipt.progressKind === "no_progress" &&
    !dependencies.hasStagePlayLiveSourceMailDecisionObservation(args.currentTurnArtifacts);
  if (
    args.receipt.progressKind === "no_progress" &&
    !emptyMailboxReadRequiresDecision &&
    (args.loop.mail_loop_no_progress_repeat_count ?? 0) > args.mailLoopContinuationBudget.maxNoProgressRepeats
  ) {
    return "mail_loop_no_progress";
  }
  if (
    args.receipt.progressKind === "wake_result" &&
    (args.loop.mail_loop_continuation_wake_count ?? 0) > args.mailLoopContinuationBudget.maxContinuationWakesPerCycle
  ) {
    return "mail_loop_wake_continuation_budget_exhausted";
  }
  return null;
};
