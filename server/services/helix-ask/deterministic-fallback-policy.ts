import {
  detectRichModelOnlyConceptPrompt,
  isSimpleElectronDefinitionPrompt,
} from "./model-only-rich-concept";

type RecordLike = Record<string, unknown>;

export type HelixDeterministicFallbackPolicy = {
  schema: "helix.deterministic_fallback_policy.v1";
  fallback_id?: string;
  fallback_text?: string;
  terminal_allowed: boolean;
  demote_to_observation: boolean;
  reason_codes: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixDeterministicFallbackObservation = {
  schema: "helix.deterministic_fallback_observation.v1";
  kind: "deterministic_fallback_observation";
  fallback_id?: string;
  fallback_text?: string;
  terminal_allowed: false;
  reason: "fallback_demoted_requires_model_turn";
  reason_codes: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const hasCompoundContract = (payload: RecordLike): boolean => {
  const trace = readRecord(payload.ask_turn_solver_trace);
  return Boolean(
    readRecord(payload.compound_prompt_contract) ||
    readRecord(payload.compound_contract) ||
    readRecord(readRecord(payload.prompt_interpretation)?.compound_contract) ||
    readRecord(trace?.compound_prompt_contract),
  );
};

const isSourceTargeted = (payload: RecordLike): boolean => {
  const source = readString(readRecord(payload.source_target_intent)?.target_source);
  const strength = readString(readRecord(payload.source_target_intent)?.strength);
  return Boolean(source && source !== "model_only" && (strength === "hard" || source !== "conversation"));
};

const hasRecoverableSolverFailure = (payload: RecordLike): boolean => {
  const terminalErrorCode = readString(payload.terminal_error_code);
  const hardGate = readRecord(payload.solver_hard_gate);
  const primary = readString(hardGate?.primary_failure_code);
  const codes = Array.isArray(hardGate?.failure_codes) ? hardGate.failure_codes.map(String) : [];
  return [terminalErrorCode, primary, ...codes].some((code) =>
    Boolean(code && /missing_followup_reasoning|route_authority_missing|receipt_terminal_without_reentry|hard_gate|solver|route_contract_missing|terminal_authority/i.test(code)));
};

const looksGenericElectronFallback = (fallbackId?: string, fallbackText?: string): boolean =>
  /generic_electron|electron/i.test(fallbackId ?? "") ||
  /^An electron is a fundamental subatomic particle/i.test(fallbackText ?? "");

export function classifyDeterministicFallbackUse(input: {
  promptText: string;
  fallbackId?: string;
  fallbackText?: string;
  payload: RecordLike;
}): HelixDeterministicFallbackPolicy {
  const reasonCodes: string[] = [];
  const richSignal = detectRichModelOnlyConceptPrompt(input.promptText);
  const simpleElectron = looksGenericElectronFallback(input.fallbackId, input.fallbackText) &&
    isSimpleElectronDefinitionPrompt(input.promptText);
  const simpleDefinition = simpleElectron ||
    /^(?:what(?:'s| is)|define|briefly explain)\s+[\w -]+\??$/i.test(input.promptText.trim());
  const safeToolNameExplanation = input.fallbackId === "model_only_fallback.tool_name_explanation";
  if (richSignal.applies) reasonCodes.push("rich_model_only_concept_signal");
  if (hasCompoundContract(input.payload)) reasonCodes.push("compound_contract_present");
  if (
    /[?？]/.test(input.promptText) &&
    /\b(?:and|also|then|because|since|compare|relate|connect|explain)\b/i.test(input.promptText)
  ) {
    reasonCodes.push("compound_prompt_shape");
  }
  if (isSourceTargeted(input.payload)) reasonCodes.push("source_targeted_prompt");
  if (hasRecoverableSolverFailure(input.payload)) reasonCodes.push("recoverable_solver_failure_present");
  if (looksGenericElectronFallback(input.fallbackId, input.fallbackText) && !simpleElectron) {
    reasonCodes.push("generic_electron_not_exact_simple_definition");
  }
  const terminalAllowed =
    reasonCodes.length === 0 &&
    (simpleDefinition ||
      safeToolNameExplanation ||
      /receipt|typed_failure|request_user_input/i.test(input.fallbackId ?? "") ||
      readString(input.payload.terminal_artifact_kind) === "typed_failure" ||
      readString(input.payload.terminal_artifact_kind) === "request_user_input");
  return {
    schema: "helix.deterministic_fallback_policy.v1",
    fallback_id: input.fallbackId,
    fallback_text: input.fallbackText,
    terminal_allowed: terminalAllowed,
    demote_to_observation: !terminalAllowed,
    reason_codes: terminalAllowed ? ["safe_simple_or_contract_allowed_fallback"] : reasonCodes.length ? reasonCodes : ["fallback_requires_model_turn"],
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildDeterministicFallbackObservation(
  policy: HelixDeterministicFallbackPolicy,
): HelixDeterministicFallbackObservation | null {
  if (!policy.demote_to_observation) return null;
  return {
    schema: "helix.deterministic_fallback_observation.v1",
    kind: "deterministic_fallback_observation",
    fallback_id: policy.fallback_id,
    fallback_text: policy.fallback_text,
    terminal_allowed: false,
    reason: "fallback_demoted_requires_model_turn",
    reason_codes: policy.reason_codes,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export const buildFallbackDemotedObservation = buildDeterministicFallbackObservation;

export function canDeterministicFallbackBeTerminal(input: {
  promptText: string;
  payload: RecordLike;
  fallbackRuleId: string;
  fallbackText?: string;
}): boolean {
  return classifyDeterministicFallbackUse({
    promptText: input.promptText,
    payload: input.payload,
    fallbackId: input.fallbackRuleId,
    fallbackText: input.fallbackText,
  }).terminal_allowed;
}
