export const ZEN_OBJECTIVE_BINDING_ARTIFACT = "zen_objective_binding" as const;
export const ZEN_OBJECTIVE_BINDING_VERSION = "v1" as const;

export const ZEN_OBJECTIVE_BINDING_SUBJECT_KINDS = [
  "situation",
  "wisdom_preset",
  "character_preset",
  "workstation_event",
  "user_prompt",
] as const;

export const ZEN_OBJECTIVE_BINDING_ROLES = [
  "core",
  "lens",
  "constraint",
  "safeguard",
  "tension",
  "action_gate",
] as const;

export const ZEN_OBJECTIVE_BINDING_SOURCES = [
  "exact",
  "inferred",
  "preset",
  "ideology_tree",
  "user_context",
] as const;

export const ZEN_OBJECTIVE_BINDING_CONSTRAINT_TYPES = [
  "non_harm",
  "right_speech",
  "evidence_required",
  "consent_required",
  "uncertainty_required",
  "review_required",
] as const;

export const ZEN_OBJECTIVE_BINDING_CONSTRAINT_SEVERITIES = ["low", "medium", "high", "hard"] as const;

export type ZenObjectiveBindingSubjectKindV1 = (typeof ZEN_OBJECTIVE_BINDING_SUBJECT_KINDS)[number];
export type ZenObjectiveBindingRoleV1 = (typeof ZEN_OBJECTIVE_BINDING_ROLES)[number];
export type ZenObjectiveBindingSourceV1 = (typeof ZEN_OBJECTIVE_BINDING_SOURCES)[number];
export type ZenObjectiveBindingConstraintTypeV1 = (typeof ZEN_OBJECTIVE_BINDING_CONSTRAINT_TYPES)[number];
export type ZenObjectiveBindingConstraintSeverityV1 =
  (typeof ZEN_OBJECTIVE_BINDING_CONSTRAINT_SEVERITIES)[number];

export type ZenObjectiveBindingSubjectV1 = {
  kind: ZenObjectiveBindingSubjectKindV1;
  label?: string;
  refs?: string[];
};

export type ZenObjectiveBindingObjectiveStateV1 = {
  id: string;
  label: string;
  description?: string;
};

export type ZenObjectiveBindingBadgeBindingV1 = {
  badgeId: string;
  principleId?: string;
  role: ZenObjectiveBindingRoleV1;
  weight: number;
  confidence: number;
  source: ZenObjectiveBindingSourceV1;
  pathToRoot?: string[];
};

export type ZenObjectiveBindingConstraintV1 = {
  id: string;
  type: ZenObjectiveBindingConstraintTypeV1;
  label: string;
  severity: ZenObjectiveBindingConstraintSeverityV1;
};

export type ZenObjectiveBindingTraceStepV1 = {
  step: string;
  nodeIds: string[];
  badgeIds: string[];
  reason: string;
};

export type ZenObjectiveBindingMissingEvidenceV1 = {
  id: string;
  description: string;
  requiredFor: string;
};

export type ZenObjectiveBindingClaimBoundariesV1 = {
  diagnosticOnly: true;
  avoidCharacterJudgment: true;
  avoidMoralFinality: true;
  requiresUserConsentForAction: true;
};

export type ZenObjectiveBindingAuthorityBoundaryV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
};

export type ZenObjectiveBindingV1 = {
  artifact: typeof ZEN_OBJECTIVE_BINDING_ARTIFACT;
  version: typeof ZEN_OBJECTIVE_BINDING_VERSION;
  subject: ZenObjectiveBindingSubjectV1;
  objectiveState: ZenObjectiveBindingObjectiveStateV1;
  bindings: ZenObjectiveBindingBadgeBindingV1[];
  constraints: ZenObjectiveBindingConstraintV1[];
  trace: ZenObjectiveBindingTraceStepV1[];
  missingEvidence: ZenObjectiveBindingMissingEvidenceV1[];
  claimBoundaries: ZenObjectiveBindingClaimBoundariesV1;
  authorityBoundary: ZenObjectiveBindingAuthorityBoundaryV1;
};

export type BuildZenObjectiveBindingV1Input = Omit<
  ZenObjectiveBindingV1,
  "artifact" | "version" | "claimBoundaries" | "authorityBoundary"
> & {
  claimBoundaries?: Partial<ZenObjectiveBindingClaimBoundariesV1>;
  authorityBoundary?: Partial<ZenObjectiveBindingAuthorityBoundaryV1>;
};

const CLAIM_BOUNDARIES: ZenObjectiveBindingClaimBoundariesV1 = {
  diagnosticOnly: true,
  avoidCharacterJudgment: true,
  avoidMoralFinality: true,
  requiresUserConsentForAction: true,
};

const AUTHORITY_BOUNDARY: ZenObjectiveBindingAuthorityBoundaryV1 = {
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
  if (!includes(ZEN_OBJECTIVE_BINDING_SUBJECT_KINDS, value.kind)) issues.push("subject.kind is invalid");
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
  if (!includes(ZEN_OBJECTIVE_BINDING_ROLES, value.role)) issues.push(`${prefix}.role is invalid`);
  if (!isFiniteUnit(value.weight)) issues.push(`${prefix}.weight must be between 0 and 1`);
  if (!isFiniteUnit(value.confidence)) issues.push(`${prefix}.confidence must be between 0 and 1`);
  if (!includes(ZEN_OBJECTIVE_BINDING_SOURCES, value.source)) issues.push(`${prefix}.source is invalid`);
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
  if (!includes(ZEN_OBJECTIVE_BINDING_CONSTRAINT_TYPES, value.type)) issues.push(`${prefix}.type is invalid`);
  if (!includes(ZEN_OBJECTIVE_BINDING_CONSTRAINT_SEVERITIES, value.severity)) {
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

export function buildZenObjectiveBindingV1(input: BuildZenObjectiveBindingV1Input): ZenObjectiveBindingV1 {
  return {
    artifact: ZEN_OBJECTIVE_BINDING_ARTIFACT,
    version: ZEN_OBJECTIVE_BINDING_VERSION,
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

export function validateZenObjectiveBindingV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["zen objective binding must be an object"];

  if (value.artifact !== ZEN_OBJECTIVE_BINDING_ARTIFACT) {
    issues.push(`artifact must be ${ZEN_OBJECTIVE_BINDING_ARTIFACT}`);
  }
  if (value.version !== ZEN_OBJECTIVE_BINDING_VERSION) {
    issues.push(`version must be ${ZEN_OBJECTIVE_BINDING_VERSION}`);
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

export function isZenObjectiveBindingV1(value: unknown): value is ZenObjectiveBindingV1 {
  return validateZenObjectiveBindingV1(value).length === 0;
}
