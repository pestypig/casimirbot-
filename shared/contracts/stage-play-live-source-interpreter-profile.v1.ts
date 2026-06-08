export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_SCHEMA =
  "stage_play_live_source_interpreter_profile/v1" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA =
  "stage_play_live_source_interpreter_profile_comparison/v1" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_ARTIFACT_ID =
  "stage_play_live_source_interpreter_profile" as const;

export const STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID =
  "stage_play_live_source_interpreter_profile_comparison" as const;

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

  evidenceRefs: string[];
  createdAt: string;

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
    artifactId: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_COMPARISON_SCHEMA,
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
  if (!includes(STAGE_PLAY_LIVE_SOURCE_INTERPRETER_PROFILE_DECISIONS, value.recommendedDecision)) {
    issues.push("recommendedDecision is invalid");
  }
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
