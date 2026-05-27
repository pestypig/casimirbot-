export type HelixVisibleAnswerPolicyFaithfulnessGate = {
  schema: "helix.visible_answer_policy_faithfulness_gate.v1";
  turn_id: string;
  applies: boolean;
  ok: boolean;
  checked_text_ref?: string;
  violations: Array<
    | "receipt_promoted_to_authority"
    | "tool_observation_promoted_to_answer"
    | "voice_proposal_promoted_to_spoken"
    | "repo_evidence_claim_inverted"
  >;
  repair_allowed: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

export function evaluateVisibleAnswerPolicyFaithfulnessGate(input: {
  turnId: string;
  text: string;
  payload?: RecordLike;
  checkedTextRef?: string;
}): HelixVisibleAnswerPolicyFaithfulnessGate {
  const text = String(input.text ?? "").replace(/\s+/g, " ").trim();
  const terminalKind = readString(input.payload?.terminal_artifact_kind);
  const sourceTarget = readString(readRecord(input.payload?.source_target_intent)?.target_source);
  const applies = Boolean(text) && (
    /repo|doc|tool|receipt|voice|dottie/i.test(text) ||
    /repo|doc|tool|voice|situation/i.test(`${terminalKind} ${sourceTarget}`)
  );
  const violations: HelixVisibleAnswerPolicyFaithfulnessGate["violations"] = [];
  if (/\breceipts?\b.{0,140}\b(validat(?:e|es|ing)|authoriz(?:e|es|ing)|confirm(?:s|ing)?|derive[sd]?|determine)\b.{0,140}\b(final|terminal|visible)\s+answers?\b/i.test(text)) {
    violations.push("receipt_promoted_to_authority");
  }
  if (/\b(final|terminal|visible)\s+answers?\b.{0,140}\b(derived from|validated by|confirmed by|based on)\b.{0,80}\breceipts?\b/i.test(text)) {
    violations.push("receipt_promoted_to_authority");
  }
  if (/\breceipts?\b/i.test(text) && /\bfinal answers?\s+must\s+be\s+derived\s+from\s+(?:the\s+)?observations?\b/i.test(text)) {
    violations.push("receipt_promoted_to_authority");
  }
  if (/\b(tool outputs?|tool observations?|workspace action receipts?)\b.{0,120}\b(are|become|serve as)\b.{0,40}\b(final|terminal|visible)\s+answers?\b/i.test(text)) {
    violations.push("tool_observation_promoted_to_answer");
  }
  if (/\bvoice (?:proposal|draft|callout)\b.{0,120}\b(spoken|read aloud|said out loud|delivered)\b/i.test(text)) {
    violations.push("voice_proposal_promoted_to_spoken");
  }
  if (/\bno\s+(?:repo|repository|code)\s+evidence\b/i.test(text) && /repo_code_evidence_observation|repo_docs_synthesis_packet/i.test(JSON.stringify(input.payload ?? {}).slice(0, 6000))) {
    violations.push("repo_evidence_claim_inverted");
  }
  const uniqueViolations = Array.from(new Set(violations));
  return {
    schema: "helix.visible_answer_policy_faithfulness_gate.v1",
    turn_id: input.turnId,
    applies,
    ok: uniqueViolations.length === 0,
    checked_text_ref: input.checkedTextRef,
    violations: uniqueViolations,
    repair_allowed: uniqueViolations.length > 0,
    assistant_answer: false,
    raw_content_included: false,
  };
}
