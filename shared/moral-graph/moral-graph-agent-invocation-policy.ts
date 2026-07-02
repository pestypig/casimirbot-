import type { IdeologyContextReflectionInputKindV1 } from "../ideology-context-reflection";

export const MORAL_GRAPH_INVOCATION_DECISIONS = ["eligible", "not_applicable", "blocked"] as const;
export type MoralGraphInvocationDecisionKindV1 = (typeof MORAL_GRAPH_INVOCATION_DECISIONS)[number];

export const MORAL_GRAPH_INVOCATION_REASON_CODES = [
  "explicit_moral_graph_request",
  "wisdom_reflection_request",
  "character_perspective_request",
  "ethical_or_values_tension",
  "wise_next_step_request",
  "motive_action_reflection",
  "living_substrate_reflection_request",
  "theory_first_mechanism_request",
  "competing_values",
  "missing_evidence_or_uncertainty",
  "workstation_ideology_reflection",
  "pure_factual_no_values_component",
  "contextual_or_quoted_tool_mention",
  "legal_medical_financial_authority_request",
  "person_character_diagnosis",
  "action_bypass_request",
  "consent_override_request",
  "recursive_self_evidence",
] as const;

export type MoralGraphInvocationReasonCodeV1 = (typeof MORAL_GRAPH_INVOCATION_REASON_CODES)[number];

export type MoralGraphAgentInvocationPolicyInputV1 = {
  inputKind: IdeologyContextReflectionInputKindV1;
  text: string;
  refs?: string[];
  requestedPresetIds?: string[];
  comparePresetIds?: string[];
};

export type MoralGraphAgentInvocationPolicyDecisionV1 = {
  decision: MoralGraphInvocationDecisionKindV1;
  eligible: boolean;
  reasonCodes: MoralGraphInvocationReasonCodeV1[];
  positiveReasonCodes: MoralGraphInvocationReasonCodeV1[];
  blockingReasonCodes: MoralGraphInvocationReasonCodeV1[];
  recommendedInputKind: IdeologyContextReflectionInputKindV1;
  recommendedPresetIds: string[];
  comparePresetIds: string[];
  authorityBoundary: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    context_role: "tool_policy";
    ask_context_policy: "evidence_only";
    agent_executable: false;
  };
  notes: string[];
};

const AUTHORITY_BOUNDARY: MoralGraphAgentInvocationPolicyDecisionV1["authorityBoundary"] = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function has(pattern: RegExp, text: string): boolean {
  return pattern.test(text);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function positiveReasons(input: MoralGraphAgentInvocationPolicyInputV1, text: string): MoralGraphInvocationReasonCodeV1[] {
  const reasons: MoralGraphInvocationReasonCodeV1[] = [];

  if (has(/\b(moral\s*graph|moralgraph|moral badge graph|moral badges?)\b/, text)) {
    reasons.push("explicit_moral_graph_request");
  }
  if (has(/\b(wisdom|wise|moral|ethos|ideology)\b.*\b(reflect|reflection|lens|principle|perspective)\b|\breflect\b.*\b(wisdom|wise|moral|ethos|ideology)\b/, text)) {
    reasons.push("wisdom_reflection_request");
  }
  if (
    has(
      /\b(character|perspective|preset|would .* do|what would|through .* perspective|compare .* perspective)\b/,
      text,
    ) ||
    (input.requestedPresetIds?.length ?? 0) > 0 ||
    (input.comparePresetIds?.length ?? 0) > 0
  ) {
    reasons.push("character_perspective_request");
  }
  if (has(/\b(ethical|ethics|moral|values?|principles?|non[- ]?harm|right speech|fairness|duty|responsibility)\b/, text)) {
    reasons.push("ethical_or_values_tension");
  }
  if (has(/\b(wise next step|wisest next step|what should i do wisely|wise thing to do|next step)\b/, text)) {
    reasons.push("wise_next_step_request");
  }
  if (has(/\b(motive|motivation|intent|intention|why did|why would|action reflection|reflect .* action)\b/, text)) {
    reasons.push("motive_action_reflection");
  }
  if (
    has(
      /\b(?:living[-\s]?system|organism|organisms|single[-\s]?cell|multicellular|homeostasis|homeostatic|organism[-\s]?environment|entropy\s+(?:pressure|gradient|flow)|sensing|state discrimination|perturbation response|non[-\s]?human moral|moral relevance|moral mandates?)\b/,
      text,
    ) &&
    has(/\b(?:moral|morality|obligation|care|constraint|priority|mandate|relevance|classification|derive|emerge|reflection)\b/, text)
  ) {
    reasons.push("living_substrate_reflection_request");
  }
  if (
    has(/\b(?:orch[-\s]?or|hameroff|penrose|objective reduction|microtubule|anesthetic|fourier|frequency mapping)\b/, text) &&
    has(/\b(?:theory|mechanism|equation|calculator|physics|scientific|source theory)\b/, text)
  ) {
    reasons.push("theory_first_mechanism_request");
  }
  if (has(/\b(competing values|trade[- ]?off|tension between|conflict between|on one hand|on the other hand|balance)\b/, text)) {
    reasons.push("competing_values");
  }
  if (has(/\b(uncertain|uncertainty|missing evidence|not sure|unknown|ambiguous|incomplete|lack evidence|without evidence)\b/, text)) {
    reasons.push("missing_evidence_or_uncertainty");
  }
  if (
    input.inputKind !== "user_prompt" &&
    has(/\b(ideology|ethos|wisdom|moral|values?|reflection|principle)\b/, text)
  ) {
    reasons.push("workstation_ideology_reflection");
  }

  return unique(reasons);
}

function blockingReasons(text: string): MoralGraphInvocationReasonCodeV1[] {
  const reasons: MoralGraphInvocationReasonCodeV1[] = [];

  if (
    has(
      /["'`][^"'`]*(?:moral-graph\.reflect_living_substrate_context|reflect_living_substrate_context|moral\s*graph)[^"'`]*["'`]/,
      text,
    ) ||
    has(
      /\b(?:will|would|could|might|later|eventually|previously|historically|not\s+asking\s+to)\b[\s\S]{0,90}\b(?:moral-graph\.reflect_living_substrate_context|reflect_living_substrate_context|moral\s*graph)\b/,
      text,
    )
  ) {
    reasons.push("contextual_or_quoted_tool_mention");
  }

  if (
    has(
      /\b(legal|lawyer|lawsuit|sue|contract|court|medical|doctor|diagnos(?:e|is)|treatment|medication|financial|finance|investment|invest|tax|loan|insurance)\b.*\b(advise|advice|tell me what to do|should i|authorize|authority|definitive|final answer)\b|\b(should i sue|should i invest|should i buy|should i sell|should i take .* medication|do i have .*)\b/,
      text,
    )
  ) {
    reasons.push("legal_medical_financial_authority_request");
  }
  if (has(/\b(diagnose|label|prove|determine|tell me if)\b.*\b(character|personality|narcissist|sociopath|psychopath|manipulative|evil|bad person)\b/, text)) {
    reasons.push("person_character_diagnosis");
  }
  if (has(/\b(justify|bypass|override|skip|ignore|get around)\b.*\b(action|approval|admission|gate|safeguard|policy|rule|review)\b|\b(use .* to justify)\b/, text)) {
    reasons.push("action_bypass_request");
  }
  if (has(/\b(override|ignore|bypass|without)\b.*\b(consent|permission|user confirmation|approval)\b/, text)) {
    reasons.push("consent_override_request");
  }
  if (has(/\b(moral\s*graph|moralgraph|reflection|tool output|its conclusion|previous conclusion)\b.*\b(as evidence|prove itself|feed back|self[- ]?evidence|source of truth)\b/, text)) {
    reasons.push("recursive_self_evidence");
  }

  return unique(reasons);
}

function isPureFactual(text: string, positives: MoralGraphInvocationReasonCodeV1[]): boolean {
  if (positives.length > 0) return false;
  return has(/\b(what is|when is|where is|who is|how many|define|capital of|population of|current time|weather|price of)\b/, text);
}

export function decideMoralGraphAgentInvocationPolicyV1(
  input: MoralGraphAgentInvocationPolicyInputV1,
): MoralGraphAgentInvocationPolicyDecisionV1 {
  const text = normalize(input.text);
  const positives = positiveReasons(input, text);
  const blockers = blockingReasons(text);
  if (isPureFactual(text, positives)) blockers.push("pure_factual_no_values_component");

  const blockingReasonCodes = unique(blockers);
  const positiveReasonCodes = unique(positives);
  const eligible = positiveReasonCodes.length > 0 && blockingReasonCodes.length === 0;
  const decision: MoralGraphInvocationDecisionKindV1 =
    blockingReasonCodes.length > 0 ? "blocked" : eligible ? "eligible" : "not_applicable";

  return {
    decision,
    eligible,
    reasonCodes: unique([...positiveReasonCodes, ...blockingReasonCodes]),
    positiveReasonCodes,
    blockingReasonCodes,
    recommendedInputKind: input.inputKind,
    recommendedPresetIds: input.requestedPresetIds ?? [],
    comparePresetIds: input.comparePresetIds ?? [],
    authorityBoundary: { ...AUTHORITY_BOUNDARY },
    notes:
      decision === "eligible"
        ? ["MoralGraph may be invoked as diagnostic evidence only; it cannot answer, execute, or authorize action."]
        : decision === "blocked"
          ? ["MoralGraph invocation is suppressed because the prompt asks for authority, diagnosis, bypass, consent override, or self-evidence."]
          : ["MoralGraph is not applicable because no wisdom, values, perspective, uncertainty, or ideology reflection trigger was detected."],
  };
}

export function moralGraphPolicyAllowsLivingSubstrateReflection(
  input: MoralGraphAgentInvocationPolicyInputV1,
): boolean {
  const decision = decideMoralGraphAgentInvocationPolicyV1(input);
  return (
    decision.eligible &&
    decision.reasonCodes.includes("living_substrate_reflection_request") &&
    !decision.reasonCodes.includes("contextual_or_quoted_tool_mention")
  );
}

export function moralGraphPolicyPrefersTheoryFirst(
  input: MoralGraphAgentInvocationPolicyInputV1,
): boolean {
  const decision = decideMoralGraphAgentInvocationPolicyV1(input);
  return decision.reasonCodes.includes("theory_first_mechanism_request");
}
