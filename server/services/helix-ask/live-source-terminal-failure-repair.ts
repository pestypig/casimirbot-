const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const routeContractAllowedTerminalKinds = (payload: Record<string, unknown>): string[] => {
  const contract = readRecord(payload.route_product_contract);
  return readArray(contract?.allowed_terminal_artifact_kinds)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
};

const isProcessedLiveSourceMailSummaryText = (value: unknown): boolean =>
  /^The processed visual mail (?:shows|contains)\b/i.test(readString(value) ?? "");

const liveSourceMailboxRequiresModelSynthesizedAnswer = (payload: Record<string, unknown>): boolean => {
  const goal = readRecord(payload.canonical_goal_frame);
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeContract = readRecord(payload.route_product_contract);
  const resolvedTurnSummary = readRecord(payload.resolved_turn_summary);
  const goalKind = readString(goal?.goal_kind);
  const requiredTerminalKind = readString(goal?.required_terminal_kind);
  const targetSource =
    readString(sourceTargetIntent?.target_source) ??
    readString(sourceTargetIntent?.targetSource) ??
    readString(routeContract?.source_target);
  const resolvedRoute = readString(resolvedTurnSummary?.resolved_route_label) ?? "";
  const liveSourceMailboxGoal =
    goalKind === "live_source_processed_mail_interpretation" ||
    targetSource === "live_source_mailbox" ||
    /live_source_processed_mail_interpretation|processed_mail_interpretation|live_source_mailbox/i.test(resolvedRoute);
  const modelSynthesizedRequired =
    requiredTerminalKind === "model_synthesized_answer" ||
    routeContractAllowedTerminalKinds(payload).includes("model_synthesized_answer") ||
    /model_synthesized_answer/i.test(resolvedRoute);
  return liveSourceMailboxGoal && modelSynthesizedRequired;
};

export type LiveSourceTerminalFailureRepair = {
  code: "post_tool_model_step_missing" | "fresh_source_unbound";
  text: string;
};

const liveSourceIdentityFailure = (payload: Record<string, unknown>): LiveSourceTerminalFailureRepair | null => {
  const audit = readRecord(payload.live_source_identity_audit);
  const diagnosis = readString(audit?.diagnosis);
  if (audit?.identity_ok !== false || diagnosis !== "fresh_source_unbound") return null;
  return {
    code: "fresh_source_unbound",
    text: "I could not complete this visual-source turn because the freshest visual source is not bound to the active SituationRun. Cause: fresh_source_unbound.",
  };
};

export const liveSourceModelSynthesisMissingFailure = (
  payload: Record<string, unknown>,
  candidateText: string,
): LiveSourceTerminalFailureRepair | null => {
  const identityFailure = liveSourceIdentityFailure(payload);
  if (identityFailure) return identityFailure;
  if (!isProcessedLiveSourceMailSummaryText(candidateText)) return null;
  if (!liveSourceMailboxRequiresModelSynthesizedAnswer(payload)) return null;
  return {
    code: "post_tool_model_step_missing",
    text: "I could not complete this live-source mailbox turn because processed mail was observed, but no valid model-synthesized answer passed terminal authority.",
  };
};
