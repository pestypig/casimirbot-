export const HELIX_VOICE_STEERING_EVENT_SCHEMA =
  "helix.voice_steering_event.v1" as const;

export const HELIX_VOICE_STEERING_DECISION_SCHEMA =
  "helix.voice_steering_decision.v1" as const;

export type HelixVoiceSteeringTiming =
  | "during_reasoning"
  | "during_tool_call"
  | "between_steps"
  | "before_final_synthesis"
  | "idle";

export type HelixVoiceSteeringClassification =
  | "on_topic_additive"
  | "constraint"
  | "correction"
  | "off_topic_new_goal"
  | "cancel_or_stop"
  | "ambient"
  | "unsafe_or_untrusted";

export type HelixVoiceSteeringQueueDecision =
  | "queued_for_safe_boundary"
  | "applied_to_next_step"
  | "deferred_to_new_turn"
  | "rejected_off_topic"
  | "cancel_requested"
  | "ambient_ignored";

export type HelixVoiceSteeringEventV1 = {
  artifactId: "helix_voice_steering_event";
  schemaVersion: typeof HELIX_VOICE_STEERING_EVENT_SCHEMA;

  steeringEventId: string;
  threadId: string;
  turnId?: string | null;
  expectedTurnId?: string | null;

  source: "voice_capture" | "text_capture" | "ui_button";
  transcriptText: string;
  normalizedText: string;
  capturedAt: string;

  timing: HelixVoiceSteeringTiming;
  classification: HelixVoiceSteeringClassification;
  queueDecision: HelixVoiceSteeringQueueDecision;

  target:
    | "active_turn"
    | "next_solver_step"
    | "before_final_answer"
    | "new_turn"
    | "none";

  confidence: "low" | "medium" | "high";
  evidenceRefs: string[];
  reasonCodes: string[];

  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  instruction_authority: "none";
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

export type HelixVoiceSteeringDecisionV1 = {
  artifactId: "helix_voice_steering_decision";
  schemaVersion: typeof HELIX_VOICE_STEERING_DECISION_SCHEMA;

  decisionId: string;
  steeringEventId: string;
  threadId: string;
  turnId?: string | null;

  decision:
    | "steering_applied"
    | "steering_deferred"
    | "steering_rejected_off_topic"
    | "steering_requires_new_turn"
    | "turn_cancel_requested"
    | "ambient_ignored";

  appliedAtBoundary?:
    | "after_tool_result"
    | "before_next_model_step"
    | "before_final_synthesis"
    | "after_turn_complete"
    | null;

  modelVisibleSummary?: string | null;
  newTurnCandidateText?: string | null;
  interimVoiceCalloutRequestRef?: string | null;

  evidenceRefs: string[];
  reasonCodes: string[];

  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  instruction_authority: "none";
  context_role: "tool_evidence";
};

const TIMINGS = new Set<HelixVoiceSteeringTiming>([
  "during_reasoning",
  "during_tool_call",
  "between_steps",
  "before_final_synthesis",
  "idle",
]);

const CLASSIFICATIONS = new Set<HelixVoiceSteeringClassification>([
  "on_topic_additive",
  "constraint",
  "correction",
  "off_topic_new_goal",
  "cancel_or_stop",
  "ambient",
  "unsafe_or_untrusted",
]);

const QUEUE_DECISIONS = new Set<HelixVoiceSteeringQueueDecision>([
  "queued_for_safe_boundary",
  "applied_to_next_step",
  "deferred_to_new_turn",
  "rejected_off_topic",
  "cancel_requested",
  "ambient_ignored",
]);

const TARGETS = new Set<HelixVoiceSteeringEventV1["target"]>([
  "active_turn",
  "next_solver_step",
  "before_final_answer",
  "new_turn",
  "none",
]);

const SOURCES = new Set<HelixVoiceSteeringEventV1["source"]>([
  "voice_capture",
  "text_capture",
  "ui_button",
]);

const CONFIDENCES = new Set<HelixVoiceSteeringEventV1["confidence"]>([
  "low",
  "medium",
  "high",
]);

const DECISIONS = new Set<HelixVoiceSteeringDecisionV1["decision"]>([
  "steering_applied",
  "steering_deferred",
  "steering_rejected_off_topic",
  "steering_requires_new_turn",
  "turn_cancel_requested",
  "ambient_ignored",
]);

const BOUNDARIES = new Set<NonNullable<HelixVoiceSteeringDecisionV1["appliedAtBoundary"]>>([
  "after_tool_result",
  "before_next_model_step",
  "before_final_synthesis",
  "after_turn_complete",
]);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const validateEvidenceAuthority = (
  value: Record<string, unknown>,
  issues: string[],
  options: { requireAskInstructionAuthority: boolean; requireAskContextPolicy: boolean },
) => {
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.instruction_authority !== "none") issues.push("instruction_authority must be none");
  if (options.requireAskInstructionAuthority && value.ask_instruction_authority !== "none") {
    issues.push("ask_instruction_authority must be none");
  }
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (options.requireAskContextPolicy && value.ask_context_policy !== "evidence_only") {
    issues.push("ask_context_policy must be evidence_only");
  }
};

export function validateHelixVoiceSteeringEventV1(value: unknown): string[] {
  const issues: string[] = [];
  const record = asRecord(value);
  if (!record) return ["value must be an object"];

  if (record.artifactId !== "helix_voice_steering_event") {
    issues.push("artifactId must be helix_voice_steering_event");
  }
  if (record.schemaVersion !== HELIX_VOICE_STEERING_EVENT_SCHEMA) {
    issues.push(`schemaVersion must be ${HELIX_VOICE_STEERING_EVENT_SCHEMA}`);
  }
  if (!isNonEmptyString(record.steeringEventId)) issues.push("steeringEventId is required");
  if (!isNonEmptyString(record.threadId)) issues.push("threadId is required");
  if (!SOURCES.has(record.source as HelixVoiceSteeringEventV1["source"])) issues.push("source is invalid");
  if (!isNonEmptyString(record.transcriptText)) issues.push("transcriptText is required");
  if (!isNonEmptyString(record.normalizedText)) issues.push("normalizedText is required");
  if (!isNonEmptyString(record.capturedAt)) issues.push("capturedAt is required");
  if (!TIMINGS.has(record.timing as HelixVoiceSteeringTiming)) issues.push("timing is invalid");
  if (!CLASSIFICATIONS.has(record.classification as HelixVoiceSteeringClassification)) {
    issues.push("classification is invalid");
  }
  if (!QUEUE_DECISIONS.has(record.queueDecision as HelixVoiceSteeringQueueDecision)) {
    issues.push("queueDecision is invalid");
  }
  if (!TARGETS.has(record.target as HelixVoiceSteeringEventV1["target"])) issues.push("target is invalid");
  if (!CONFIDENCES.has(record.confidence as HelixVoiceSteeringEventV1["confidence"])) {
    issues.push("confidence is invalid");
  }
  if (!isStringArray(record.evidenceRefs)) issues.push("evidenceRefs must be a string array");
  if (!isStringArray(record.reasonCodes)) issues.push("reasonCodes must be a string array");
  validateEvidenceAuthority(record, issues, {
    requireAskInstructionAuthority: true,
    requireAskContextPolicy: true,
  });

  if (record.target === "active_turn" && !isNonEmptyString(record.expectedTurnId)) {
    issues.push("target active_turn requires expectedTurnId");
  }
  if (record.classification === "ambient" && record.queueDecision === "applied_to_next_step") {
    issues.push("ambient cannot be applied_to_next_step");
  }
  if (record.classification === "off_topic_new_goal" && record.queueDecision === "applied_to_next_step") {
    issues.push("off_topic_new_goal cannot be applied_to_next_step");
  }

  return issues;
}

export function validateHelixVoiceSteeringDecisionV1(value: unknown): string[] {
  const issues: string[] = [];
  const record = asRecord(value);
  if (!record) return ["value must be an object"];

  if (record.artifactId !== "helix_voice_steering_decision") {
    issues.push("artifactId must be helix_voice_steering_decision");
  }
  if (record.schemaVersion !== HELIX_VOICE_STEERING_DECISION_SCHEMA) {
    issues.push(`schemaVersion must be ${HELIX_VOICE_STEERING_DECISION_SCHEMA}`);
  }
  if (!isNonEmptyString(record.decisionId)) issues.push("decisionId is required");
  if (!isNonEmptyString(record.steeringEventId)) issues.push("steeringEventId is required");
  if (!isNonEmptyString(record.threadId)) issues.push("threadId is required");
  if (!DECISIONS.has(record.decision as HelixVoiceSteeringDecisionV1["decision"])) {
    issues.push("decision is invalid");
  }
  if (
    record.appliedAtBoundary !== undefined &&
    record.appliedAtBoundary !== null &&
    !BOUNDARIES.has(record.appliedAtBoundary as NonNullable<HelixVoiceSteeringDecisionV1["appliedAtBoundary"]>)
  ) {
    issues.push("appliedAtBoundary is invalid");
  }
  if (!isStringArray(record.evidenceRefs)) issues.push("evidenceRefs must be a string array");
  if (!isStringArray(record.reasonCodes)) issues.push("reasonCodes must be a string array");
  validateEvidenceAuthority(record, issues, {
    requireAskInstructionAuthority: false,
    requireAskContextPolicy: false,
  });

  return issues;
}
