export const MORAL_OBJECTIVE_BINDING_ARTIFACT = "moral_objective_binding" as const;
export const MORAL_OBJECTIVE_BINDING_VERSION = "v1" as const;

export const MORAL_OBJECTIVE_BINDING_SUBJECT_KINDS = [
  "situation",
  "wisdom_preset",
  "character_preset",
  "workstation_event",
  "user_prompt",
] as const;

export const MORAL_OBJECTIVE_BINDING_ROLES = [
  "core",
  "lens",
  "constraint",
  "safeguard",
  "tension",
  "action_gate",
] as const;

export const MORAL_OBJECTIVE_BINDING_SOURCES = [
  "exact",
  "inferred",
  "preset",
  "ideology_tree",
  "user_context",
] as const;

export const MORAL_OBJECTIVE_BINDING_CONSTRAINT_TYPES = [
  "non_harm",
  "right_speech",
  "evidence_required",
  "consent_required",
  "uncertainty_required",
  "review_required",
] as const;

export const MORAL_OBJECTIVE_BINDING_CONSTRAINT_SEVERITIES = ["low", "medium", "high", "hard"] as const;

export type MoralObjectiveBindingSubjectKindV1 = (typeof MORAL_OBJECTIVE_BINDING_SUBJECT_KINDS)[number];
export type MoralObjectiveBindingRoleV1 = (typeof MORAL_OBJECTIVE_BINDING_ROLES)[number];
export type MoralObjectiveBindingSourceV1 = (typeof MORAL_OBJECTIVE_BINDING_SOURCES)[number];
export type MoralObjectiveBindingConstraintTypeV1 = (typeof MORAL_OBJECTIVE_BINDING_CONSTRAINT_TYPES)[number];
export type MoralObjectiveBindingConstraintSeverityV1 =
  (typeof MORAL_OBJECTIVE_BINDING_CONSTRAINT_SEVERITIES)[number];

export type MoralObjectiveBindingSubjectV1 = {
  kind: MoralObjectiveBindingSubjectKindV1;
  label?: string;
  refs?: string[];
};

export type MoralObjectiveBindingObjectiveStateV1 = {
  id: string;
  label: string;
  description?: string;
};

export type MoralObjectiveBindingBadgeBindingV1 = {
  badgeId: string;
  principleId?: string;
  role: MoralObjectiveBindingRoleV1;
  weight: number;
  confidence: number;
  source: MoralObjectiveBindingSourceV1;
  pathToRoot?: string[];
};

export type MoralObjectiveBindingConstraintV1 = {
  id: string;
  type: MoralObjectiveBindingConstraintTypeV1;
  label: string;
  severity: MoralObjectiveBindingConstraintSeverityV1;
};

export type MoralObjectiveBindingTraceStepV1 = {
  step: string;
  nodeIds: string[];
  badgeIds: string[];
  reason: string;
};

export type MoralObjectiveBindingMissingEvidenceV1 = {
  id: string;
  description: string;
  requiredFor: string;
};

export type MoralObjectiveBindingClaimBoundariesV1 = {
  diagnosticOnly: true;
  avoidCharacterJudgment: true;
  avoidMoralFinality: true;
  requiresUserConsentForAction: true;
};

export type MoralObjectiveBindingAuthorityBoundaryV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
};

export type MoralObjectiveBindingV1 = {
  artifact: typeof MORAL_OBJECTIVE_BINDING_ARTIFACT;
  version: typeof MORAL_OBJECTIVE_BINDING_VERSION;
  subject: MoralObjectiveBindingSubjectV1;
  objectiveState: MoralObjectiveBindingObjectiveStateV1;
  bindings: MoralObjectiveBindingBadgeBindingV1[];
  constraints: MoralObjectiveBindingConstraintV1[];
  trace: MoralObjectiveBindingTraceStepV1[];
  missingEvidence: MoralObjectiveBindingMissingEvidenceV1[];
  claimBoundaries: MoralObjectiveBindingClaimBoundariesV1;
  authorityBoundary: MoralObjectiveBindingAuthorityBoundaryV1;
};

export type BuildMoralObjectiveBindingV1Input = Omit<
  MoralObjectiveBindingV1,
  "artifact" | "version" | "claimBoundaries" | "authorityBoundary"
> & {
  claimBoundaries?: Partial<MoralObjectiveBindingClaimBoundariesV1>;
  authorityBoundary?: Partial<MoralObjectiveBindingAuthorityBoundaryV1>;
};

const CLAIM_BOUNDARIES: MoralObjectiveBindingClaimBoundariesV1 = {
  diagnosticOnly: true,
  avoidCharacterJudgment: true,
  avoidMoralFinality: true,
  requiresUserConsentForAction: true,
};

const AUTHORITY_BOUNDARY: MoralObjectiveBindingAuthorityBoundaryV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isFiniteUnit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function includes<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be a string array`);
}

function validateSubject(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("subject must be an object");
    return;
  }
  if (!includes(MORAL_OBJECTIVE_BINDING_SUBJECT_KINDS, value.kind)) issues.push("subject.kind is invalid");
  if (value.label !== undefined && !isNonEmptyString(value.label)) {
    issues.push("subject.label must be a non-empty string when present");
  }
  validateOptionalStringArray("subject.refs", value.refs, issues);
}

function validateObjectiveState(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("objectiveState must be an object");
    return;
  }
  for (const field of ["id", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`objectiveState.${field} must be a non-empty string`);
  }
  if (value.description !== undefined && !isNonEmptyString(value.description)) {
    issues.push("objectiveState.description must be a non-empty string when present");
  }
}

function validateBinding(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
  if (value.principleId !== undefined && !isNonEmptyString(value.principleId)) {
    issues.push(`${prefix}.principleId must be a non-empty string when present`);
  }
  if (!includes(MORAL_OBJECTIVE_BINDING_ROLES, value.role)) issues.push(`${prefix}.role is invalid`);
  if (!isFiniteUnit(value.weight)) issues.push(`${prefix}.weight must be between 0 and 1`);
  if (!isFiniteUnit(value.confidence)) issues.push(`${prefix}.confidence must be between 0 and 1`);
  if (!includes(MORAL_OBJECTIVE_BINDING_SOURCES, value.source)) issues.push(`${prefix}.source is invalid`);
  validateOptionalStringArray(`${prefix}.pathToRoot`, value.pathToRoot, issues);
}

function validateConstraint(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(MORAL_OBJECTIVE_BINDING_CONSTRAINT_TYPES, value.type)) issues.push(`${prefix}.type is invalid`);
  if (!includes(MORAL_OBJECTIVE_BINDING_CONSTRAINT_SEVERITIES, value.severity)) {
    issues.push(`${prefix}.severity is invalid`);
  }
}

function validateTraceStep(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["step", "reason"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isStringArray(value.nodeIds)) issues.push(`${prefix}.nodeIds must be a string array`);
  if (!isStringArray(value.badgeIds)) issues.push(`${prefix}.badgeIds must be a string array`);
}

function validateMissingEvidence(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "description", "requiredFor"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
}

function validateClaimBoundaries(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("claimBoundaries must be an object");
    return;
  }
  if (value.diagnosticOnly !== true) issues.push("claimBoundaries.diagnosticOnly must be true");
  if (value.avoidCharacterJudgment !== true) issues.push("claimBoundaries.avoidCharacterJudgment must be true");
  if (value.avoidMoralFinality !== true) issues.push("claimBoundaries.avoidMoralFinality must be true");
  if (value.requiresUserConsentForAction !== true) {
    issues.push("claimBoundaries.requiresUserConsentForAction must be true");
  }
}

function validateAuthorityBoundary(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authorityBoundary must be an object");
    return;
  }
  if (value.assistant_answer !== false) issues.push("authorityBoundary.assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("authorityBoundary.raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("authorityBoundary.terminal_eligible must be false");
  if (value.context_role !== "tool_policy") issues.push("authorityBoundary.context_role must be tool_policy");
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authorityBoundary.ask_context_policy must be evidence_only");
  }
  if (value.agent_executable !== false) issues.push("authorityBoundary.agent_executable must be false");
}

export function buildMoralObjectiveBindingV1(input: BuildMoralObjectiveBindingV1Input): MoralObjectiveBindingV1 {
  return {
    artifact: MORAL_OBJECTIVE_BINDING_ARTIFACT,
    version: MORAL_OBJECTIVE_BINDING_VERSION,
    subject: input.subject,
    objectiveState: input.objectiveState,
    bindings: input.bindings,
    constraints: input.constraints,
    trace: input.trace,
    missingEvidence: input.missingEvidence,
    claimBoundaries: {
      ...input.claimBoundaries,
      ...CLAIM_BOUNDARIES,
    },
    authorityBoundary: {
      ...input.authorityBoundary,
      ...AUTHORITY_BOUNDARY,
    },
  };
}

export function validateMoralObjectiveBindingV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["moral objective binding must be an object"];

  if (value.artifact !== MORAL_OBJECTIVE_BINDING_ARTIFACT) {
    issues.push(`artifact must be ${MORAL_OBJECTIVE_BINDING_ARTIFACT}`);
  }
  if (value.version !== MORAL_OBJECTIVE_BINDING_VERSION) {
    issues.push(`version must be ${MORAL_OBJECTIVE_BINDING_VERSION}`);
  }

  validateSubject(value.subject, issues);
  validateObjectiveState(value.objectiveState, issues);

  if (!Array.isArray(value.bindings)) {
    issues.push("bindings must be an array");
  } else {
    value.bindings.forEach((entry, index) => validateBinding(`bindings[${index}]`, entry, issues));
  }

  if (!Array.isArray(value.constraints)) {
    issues.push("constraints must be an array");
  } else {
    value.constraints.forEach((entry, index) => validateConstraint(`constraints[${index}]`, entry, issues));
  }

  if (!Array.isArray(value.trace)) {
    issues.push("trace must be an array");
  } else {
    value.trace.forEach((entry, index) => validateTraceStep(`trace[${index}]`, entry, issues));
  }

  if (!Array.isArray(value.missingEvidence)) {
    issues.push("missingEvidence must be an array");
  } else {
    value.missingEvidence.forEach((entry, index) => validateMissingEvidence(`missingEvidence[${index}]`, entry, issues));
  }

  validateClaimBoundaries(value.claimBoundaries, issues);
  validateAuthorityBoundary(value.authorityBoundary, issues);

  return issues;
}

export function isMoralObjectiveBindingV1(value: unknown): value is MoralObjectiveBindingV1 {
  return validateMoralObjectiveBindingV1(value).length === 0;
}
