import type { LiveSourceCausalTraceV1 } from "./stage-play-live-source-mail.v1";

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SCHEMA =
  "stage_play_live_source_interpreter_profile/v1" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA =
  "stage_play_live_source_interpreter_profile_comparison/v1" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_SCHEMA =
  "stage_play_live_source_interpreter_profile_criterion_ledger/v1" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_ARTIFACT_ID =
  "stage_play_live_source_interpreter_profile" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID =
  "stage_play_live_source_interpreter_profile_comparison" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_ARTIFACT_ID =
  "stage_play_live_source_interpreter_profile_criterion_ledger" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SOURCE_KINDS = [
  "visual_frame",
  "audio_transcript",
  "minecraft_world_event",
  "screen_summary",
  "manual_feed",
  "custom",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DOMAINS = [
  "minecraft",
  "browser",
  "video",
  "code_logs",
  "desktop_app",
  "custom",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_STATUSES = [
  "active",
  "paused",
  "archived",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_TEXT_STYLES = [
  "one_sentence",
  "brief_explanation",
  "structured",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_VOICE_STYLES = [
  "short_callout",
  "coach",
  "warning_only",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DECISIONS = [
  "wait_for_next_summary",
  "record_interpretation",
  "draft_text_answer",
  "request_voice_callout",
  "request_more_evidence",
  "request_stage_play_checkpoint",
  "fail_closed",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_KINDS = [
  "salience",
  "suppress",
  "risk",
  "opportunity",
  "voice_callout",
  "contradiction",
  "uncertainty",
  "generic",
] as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_STATUSES = [
  "matched",
  "still_matched",
  "resolved",
  "contradicted",
  "uncertain",
] as const;

export type StagePlayLiveSourceInterpreterProfileSourceKindV1 =
  | (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SOURCE_KINDS)[number]
  | string;

export type StagePlayLiveSourceInterpreterProfileDomainV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DOMAINS)[number];

export type StagePlayLiveSourceInterpreterProfileStatusV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_STATUSES)[number];

export type StagePlayLiveSourceInterpreterProfileTextStyleV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_TEXT_STYLES)[number];

export type StagePlayLiveSourceInterpreterProfileVoiceStyleV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_VOICE_STYLES)[number];

export type StagePlayLiveSourceInterpreterProfileDecisionV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DECISIONS)[number];

export type StagePlayLiveSourceInterpreterProfileCriterionKindV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_KINDS)[number];

export type StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1 =
  (typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_STATUSES)[number];

export type StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusSummaryV1 = {
  ledgerId: string;
  criterionId: string;
  criterionText: string;
  criterionKind: StagePlayLiveSourceInterpreterProfileCriterionKindV1;
  status: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1;
  previousStatus?: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1 | null;
};

export type StagePlayLiveSourceInterpreterProfileV1 = {
  artifactId: typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SCHEMA;

  profileId: string;
  title: string;

  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;

  sourceKinds: StagePlayLiveSourceInterpreterProfileSourceKindV1[];
  domain: StagePlayLiveSourceInterpreterProfileDomainV1;

  objectiveText: string;
  interpretationGuidelines: string;

  lenses: string[];

  salienceCriteria: string[];
  suppressCriteria: string[];
  riskCriteria: string[];
  opportunityCriteria: string[];
  voiceCalloutCriteria: string[];

  evidenceRules: {
    preserveRawObservation: true;
    distinguishObservedVsInferred: true;
    requireEvidenceRefs: true;
    askWhenUncertain: boolean;
  };

  outputStyle: {
    textAnswerStyle: StagePlayLiveSourceInterpreterProfileTextStyleV1;
    voiceStyle: StagePlayLiveSourceInterpreterProfileVoiceStyleV1;
  };

  linkedNoteId?: string | null;
  linkedNoteTitle?: string | null;

  status: StagePlayLiveSourceInterpreterProfileStatusV1;

  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;

  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceInterpreterProfileComparisonV1 = {
  artifactId: typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA;

  comparisonId: string;
  profileId: string;
  jobId?: string | null;
  policyId?: string | null;

  mailIds: string[];
  narrativeStateRef?: string | null;

  observedFacts: string[];
  inferredMeaning: string[];

  matchedCriteria: string[];
  suppressedCriteria: string[];
  riskMatches: string[];
  opportunityMatches: string[];
  voiceCalloutMatches: string[];

  contradictions: string[];
  uncertainties: string[];

  recommendedDecision: StagePlayLiveSourceInterpreterProfileDecisionV1;
  recommendedNextWatch: string[];

  criterionLedgerRefs?: string[];
  criterionLedgerStatuses?: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusSummaryV1[];

  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;

  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceInterpreterProfileCriterionLedgerV1 = {
  artifactId: typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_SCHEMA;

  ledgerId: string;
  profileId: string;
  jobId?: string | null;
  policyId?: string | null;

  criterionId: string;
  criterionText: string;
  criterionKind: StagePlayLiveSourceInterpreterProfileCriterionKindV1;
  status: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1;
  previousStatus?: StagePlayLiveSourceInterpreterProfileCriterionLedgerStatusV1 | null;

  firstMatchedMailId?: string | null;
  lastMatchedMailId?: string | null;
  lastComparisonId?: string | null;

  firstMatchedAt?: string | null;
  lastUpdatedAt: string;
  resolvedAt?: string | null;
  contradictedAt?: string | null;
  uncertainAt?: string | null;

  matchCount: number;
  supportingEvidenceRefs: string[];
  contradictingEvidenceRefs: string[];
  currentConfidence: number;

  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;

  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type BuildStagePlayLiveSourceInterpreterProfileV1Input = Omit<
  StagePlayLiveSourceInterpreterProfileV1,
  | "artifactId"
  | "schemaVersion"
  | "assistant_answer"
  | "terminal_eligible"
  | "context_role"
  | "raw_content_included"
>;

export type BuildStagePlayLiveSourceInterpreterProfileComparisonV1Input = Omit<
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  | "artifactId"
  | "schemaVersion"
  | "assistant_answer"
  | "terminal_eligible"
  | "context_role"
  | "raw_content_included"
>;

export type BuildStagePlayLiveSourceInterpreterProfileCriterionLedgerV1Input = Omit<
  StagePlayLiveSourceInterpreterProfileCriterionLedgerV1,
  | "artifactId"
  | "schemaVersion"
  | "assistant_answer"
  | "terminal_eligible"
  | "context_role"
  | "raw_content_included"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isOptionalString = (value: unknown): value is string | null | undefined =>
  value == null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

const validateEvidenceAuthority = (value: Record<string, unknown>, issues: string[]): void => {
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
};

const validateOptionalRefs = (
  value: Record<string, unknown>,
  fields: readonly string[],
  issues: string[],
): void => {
  for (const field of fields) {
    if (!isOptionalString(value[field])) issues.push(`${field} must be a string, null, or undefined`);
  }
};

const validateStringArrayFields = (
  value: Record<string, unknown>,
  fields: readonly string[],
  issues: string[],
): void => {
  for (const field of fields) {
    if (!isStringArray(value[field])) issues.push(`${field} must be strings`);
  }
};

export function buildStagePlayLiveSourceInterpreterProfileV1(
  input: BuildStagePlayLiveSourceInterpreterProfileV1Input,
): StagePlayLiveSourceInterpreterProfileV1 {
  return {
    ...input,
    artifactId: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SCHEMA,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function buildStagePlayLiveSourceInterpreterProfileComparisonV1(
  input: BuildStagePlayLiveSourceInterpreterProfileComparisonV1Input,
): StagePlayLiveSourceInterpreterProfileComparisonV1 {
  return {
    ...input,
    criterionLedgerRefs: input.criterionLedgerRefs ?? [],
    criterionLedgerStatuses: input.criterionLedgerStatuses ?? [],
    artifactId: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function buildStagePlayLiveSourceInterpreterProfileCriterionLedgerV1(
  input: BuildStagePlayLiveSourceInterpreterProfileCriterionLedgerV1Input,
): StagePlayLiveSourceInterpreterProfileCriterionLedgerV1 {
  return {
    ...input,
    artifactId: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_SCHEMA,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function validateStagePlayLiveSourceInterpreterProfileV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["interpreter profile must be an object"];

  if (value.artifactId !== STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SCHEMA) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SCHEMA}`);
  }
  for (const field of ["profileId", "title", "threadId", "objectiveText", "interpretationGuidelines", "createdAt", "updatedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  validateOptionalRefs(value, ["roomId", "environmentId", "jobId", "policyId", "linkedNoteId", "linkedNoteTitle"], issues);
  if (!isStringArray(value.sourceKinds) || value.sourceKinds.length === 0) {
    issues.push("sourceKinds must contain at least one string");
  }
  if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DOMAINS, value.domain)) {
    issues.push("domain is invalid");
  }
  validateStringArrayFields(value, [
    "lenses",
    "salienceCriteria",
    "suppressCriteria",
    "riskCriteria",
    "opportunityCriteria",
    "voiceCalloutCriteria",
    "evidenceRefs",
  ], issues);
  if (!isRecord(value.evidenceRules)) {
    issues.push("evidenceRules must be an object");
  } else {
    if (value.evidenceRules.preserveRawObservation !== true) issues.push("evidenceRules.preserveRawObservation must be true");
    if (value.evidenceRules.distinguishObservedVsInferred !== true) issues.push("evidenceRules.distinguishObservedVsInferred must be true");
    if (value.evidenceRules.requireEvidenceRefs !== true) issues.push("evidenceRules.requireEvidenceRefs must be true");
    if (typeof value.evidenceRules.askWhenUncertain !== "boolean") issues.push("evidenceRules.askWhenUncertain must be boolean");
  }
  if (!isRecord(value.outputStyle)) {
    issues.push("outputStyle must be an object");
  } else {
    if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_TEXT_STYLES, value.outputStyle.textAnswerStyle)) {
      issues.push("outputStyle.textAnswerStyle is invalid");
    }
    if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_VOICE_STYLES, value.outputStyle.voiceStyle)) {
      issues.push("outputStyle.voiceStyle is invalid");
    }
  }
  if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_STATUSES, value.status)) {
    issues.push("status is invalid");
  }
  validateEvidenceAuthority(value, issues);

  return issues;
}

export function validateStagePlayLiveSourceInterpreterProfileComparisonV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["interpreter profile comparison must be an object"];

  if (value.artifactId !== STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA}`);
  }
  for (const field of ["comparisonId", "profileId", "createdAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  validateOptionalRefs(value, ["jobId", "policyId", "narrativeStateRef"], issues);
  validateStringArrayFields(value, [
    "mailIds",
    "observedFacts",
    "inferredMeaning",
    "matchedCriteria",
    "suppressedCriteria",
    "riskMatches",
    "opportunityMatches",
    "voiceCalloutMatches",
    "contradictions",
    "uncertainties",
    "recommendedNextWatch",
    "evidenceRefs",
  ], issues);
  if (value.criterionLedgerRefs !== undefined && !isStringArray(value.criterionLedgerRefs)) {
    issues.push("criterionLedgerRefs must be strings when present");
  }
  if (value.criterionLedgerStatuses !== undefined) {
    if (!Array.isArray(value.criterionLedgerStatuses)) {
      issues.push("criterionLedgerStatuses must be an array when present");
    } else {
      for (const [index, status] of value.criterionLedgerStatuses.entries()) {
        if (!isRecord(status)) {
          issues.push(`criterionLedgerStatuses[${index}] must be an object`);
          continue;
        }
        for (const field of ["ledgerId", "criterionId", "criterionText"] as const) {
          if (!isNonEmptyString(status[field])) issues.push(`criterionLedgerStatuses[${index}].${field} must be a non-empty string`);
        }
        if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_KINDS, status.criterionKind)) {
          issues.push(`criterionLedgerStatuses[${index}].criterionKind is invalid`);
        }
        if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_STATUSES, status.status)) {
          issues.push(`criterionLedgerStatuses[${index}].status is invalid`);
        }
        if (status.previousStatus != null && !includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_STATUSES, status.previousStatus)) {
          issues.push(`criterionLedgerStatuses[${index}].previousStatus is invalid`);
        }
      }
    }
  }
  if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DECISIONS, value.recommendedDecision)) {
    issues.push("recommendedDecision is invalid");
  }
  validateEvidenceAuthority(value, issues);

  return issues;
}

export function validateStagePlayLiveSourceInterpreterProfileCriterionLedgerV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["interpreter profile criterion ledger must be an object"];

  if (value.artifactId !== STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_SCHEMA) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_SCHEMA}`);
  }
  for (const field of ["ledgerId", "profileId", "criterionId", "criterionText", "lastUpdatedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  validateOptionalRefs(value, [
    "jobId",
    "policyId",
    "previousStatus",
    "firstMatchedMailId",
    "lastMatchedMailId",
    "lastComparisonId",
    "firstMatchedAt",
    "resolvedAt",
    "contradictedAt",
    "uncertainAt",
  ], issues);
  if (value.previousStatus != null && !includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_STATUSES, value.previousStatus)) {
    issues.push("previousStatus is invalid");
  }
  if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_KINDS, value.criterionKind)) {
    issues.push("criterionKind is invalid");
  }
  if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_CRITERION_LEDGER_STATUSES, value.status)) {
    issues.push("status is invalid");
  }
  if (typeof value.matchCount !== "number" || !Number.isFinite(value.matchCount) || value.matchCount < 0) {
    issues.push("matchCount must be a non-negative number");
  }
  if (typeof value.currentConfidence !== "number" || !Number.isFinite(value.currentConfidence) || value.currentConfidence < 0 || value.currentConfidence > 1) {
    issues.push("currentConfidence must be between 0 and 1");
  }
  validateStringArrayFields(value, [
    "supportingEvidenceRefs",
    "contradictingEvidenceRefs",
    "evidenceRefs",
  ], issues);
  validateEvidenceAuthority(value, issues);

  return issues;
}

export function isStagePlayLiveSourceInterpreterProfileV1(
  value: unknown,
): value is StagePlayLiveSourceInterpreterProfileV1 {
  return validateStagePlayLiveSourceInterpreterProfileV1(value).length === 0;
}

export function isStagePlayLiveSourceInterpreterProfileComparisonV1(
  value: unknown,
): value is StagePlayLiveSourceInterpreterProfileComparisonV1 {
  return validateStagePlayLiveSourceInterpreterProfileComparisonV1(value).length === 0;
}

export function isStagePlayLiveSourceInterpreterProfileCriterionLedgerV1(
  value: unknown,
): value is StagePlayLiveSourceInterpreterProfileCriterionLedgerV1 {
  return validateStagePlayLiveSourceInterpreterProfileCriterionLedgerV1(value).length === 0;
}
