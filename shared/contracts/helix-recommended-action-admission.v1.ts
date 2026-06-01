export const HELIX_RECOMMENDED_ACTION_ADMISSION_ARTIFACT_ID =
  "helix_recommended_action_admission" as const;

export const HELIX_RECOMMENDED_ACTION_ADMISSION_SCHEMA_VERSION =
  "helix_recommended_action_admission/v1" as const;

export const HELIX_RECOMMENDED_ACTION_RISKS = [
  "read_only",
  "mutating",
  "expensive",
  "claim_sensitive",
  "unknown",
] as const;

export const HELIX_RECOMMENDED_ACTION_ADMISSIONS = [
  "auto",
  "ask_user",
  "blocked",
] as const;

export const HELIX_RECOMMENDED_ACTION_OBJECTIVE_FITS = [
  "high",
  "medium",
  "low",
] as const;

export const HELIX_RECOMMENDED_ACTION_DISPLAY_POLICIES = [
  "actionable",
  "diagnostic_only",
  "hidden",
] as const;

export const HELIX_RECOMMENDED_ACTION_REASON_CODES = [
  "read_only_allowlisted",
  "unknown_action_not_allowlisted",
  "calculator_mutation_requires_confirmation",
  "workspace_mutation_requires_confirmation",
  "runtime_execution_requires_confirmation",
  "long_job_requires_confirmation",
  "claim_sensitive_language",
  "diagnostic_only_not_executable",
  "solve_requires_confirmation",
  "missing_evidence",
] as const;

export type HelixRecommendedActionRiskV1 =
  (typeof HELIX_RECOMMENDED_ACTION_RISKS)[number];

export type HelixRecommendedActionAdmissionDecisionV1 =
  (typeof HELIX_RECOMMENDED_ACTION_ADMISSIONS)[number];

export type HelixRecommendedActionObjectiveFitV1 =
  (typeof HELIX_RECOMMENDED_ACTION_OBJECTIVE_FITS)[number];

export type HelixRecommendedActionDisplayPolicyV1 =
  (typeof HELIX_RECOMMENDED_ACTION_DISPLAY_POLICIES)[number];

export type HelixRecommendedActionReasonCodeV1 =
  (typeof HELIX_RECOMMENDED_ACTION_REASON_CODES)[number];

export type HelixRecommendedActionEvidenceRequirementsV1 = {
  required?: string[];
  satisfied?: string[];
  missing?: string[];
};

export type HelixRecommendedActionAdmissionSourceV1 = {
  workstation?: string;
  panel?: string;
  panelId?: string;
  route?: string;
  tool?: string;
  toolId?: string | null;
  artifact_type?: string;
  artifactKind?: string | null;
  artifact_id?: string;
  artifactId?: string | null;
};

export type HelixRecommendedActionAdmissionEntryV1 = {
  actionId: string;
  panelId: "theory-badge-graph" | "scientific-calculator" | string;
  label: string;
  mutatesCalculator: boolean;
  solves: boolean;
  objectiveFit: HelixRecommendedActionObjectiveFitV1;
  risk: HelixRecommendedActionRiskV1;
  admission: HelixRecommendedActionAdmissionDecisionV1;
  requiresConfirmation: boolean;
  agentExecutable: boolean;
  reason: string;
  reasonCode: HelixRecommendedActionReasonCodeV1;
  source?: HelixRecommendedActionAdmissionSourceV1;
  display_policy?: HelixRecommendedActionDisplayPolicyV1;
  evidenceRefs?: string[];
  evidenceRequirements?: HelixRecommendedActionEvidenceRequirementsV1;
  reasonCodes?: string[];
};

export type HelixRecommendedActionAdmissionV1 = {
  artifactId: typeof HELIX_RECOMMENDED_ACTION_ADMISSION_ARTIFACT_ID;
  schemaVersion: typeof HELIX_RECOMMENDED_ACTION_ADMISSION_SCHEMA_VERSION;
  generatedAt: string;
  admissionId: string;
  prompt: string;
  sourceReceiptId: string | null;
  source?: HelixRecommendedActionAdmissionSourceV1;
  actions: HelixRecommendedActionAdmissionEntryV1[];
  evidenceRefs?: string[];
  evidenceRequirements?: HelixRecommendedActionEvidenceRequirementsV1;
  reasonCodes?: string[];
  summary: {
    actionCount: number;
    autoCount: number;
    askUserCount: number;
    blockedCount: number;
  };
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    context_role: "tool_policy";
    ask_context_policy: "evidence_only";
    agent_executable: false;
  };
};

type BuildHelixRecommendedActionAdmissionInput = Omit<
  HelixRecommendedActionAdmissionV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "admissionId" | "summary" | "authority"
> & {
  generatedAt?: string;
  admissionId?: string;
};

const AUTHORITY: HelixRecommendedActionAdmissionV1["authority"] = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
};

const FORBIDDEN_RECOMMENDED_ACTION_ADMISSION_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\bcertified transport solution\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newAdmissionId(): string {
  return `helix-recommended-action-admission:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function summarizeActions(actions: HelixRecommendedActionAdmissionEntryV1[]): HelixRecommendedActionAdmissionV1["summary"] {
  return {
    actionCount: actions.length,
    autoCount: actions.filter((action) => action.admission === "auto").length,
    askUserCount: actions.filter((action) => action.admission === "ask_user").length,
    blockedCount: actions.filter((action) => action.admission === "blocked").length,
  };
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  if (value.assistant_answer !== false) issues.push("authority.assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("authority.raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("authority.terminal_eligible must be false");
  if (value.context_role !== "tool_policy") issues.push("authority.context_role must be tool_policy");
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authority.ask_context_policy must be evidence_only");
  }
  if (value.agent_executable !== false) issues.push("authority.agent_executable must be false");
  if (value.ask_context_policy === "evidence_only" && value.assistant_answer !== false) {
    issues.push("authority.evidence_only cannot be assistant answer");
  }
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateEvidenceRequirements(
  prefix: string,
  value: unknown,
  issues: string[],
): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["required", "satisfied", "missing"] as const) {
    validateOptionalStringArray(`${prefix}.${field}`, value[field], issues);
  }
}

function validateSource(value: unknown, issues: string[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push("source must be an object");
    return;
  }
  for (const field of [
    "workstation",
    "panel",
    "panelId",
    "route",
    "tool",
    "toolId",
    "artifact_type",
    "artifactKind",
    "artifact_id",
    "artifactId",
  ] as const) {
    if (value[field] !== undefined && value[field] !== null && typeof value[field] !== "string") {
      issues.push(`source.${field} must be a string or null`);
    }
  }
}

function validateAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["actionId", "panelId", "label", "reason"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (typeof value.mutatesCalculator !== "boolean") issues.push(`${prefix}.mutatesCalculator must be boolean`);
  if (typeof value.solves !== "boolean") issues.push(`${prefix}.solves must be boolean`);
  if (!includes(HELIX_RECOMMENDED_ACTION_OBJECTIVE_FITS, value.objectiveFit)) {
    issues.push(`${prefix}.objectiveFit is invalid`);
  }
  if (!includes(HELIX_RECOMMENDED_ACTION_RISKS, value.risk)) issues.push(`${prefix}.risk is invalid`);
  if (!includes(HELIX_RECOMMENDED_ACTION_ADMISSIONS, value.admission)) {
    issues.push(`${prefix}.admission is invalid`);
  }
  if (typeof value.requiresConfirmation !== "boolean") {
    issues.push(`${prefix}.requiresConfirmation must be boolean`);
  }
  if (typeof value.agentExecutable !== "boolean") {
    issues.push(`${prefix}.agentExecutable must be boolean`);
  }
  if (!includes(HELIX_RECOMMENDED_ACTION_REASON_CODES, value.reasonCode)) {
    issues.push(`${prefix}.reasonCode is invalid`);
  }
  if (value.risk === "unknown" && value.admission === "auto") {
    issues.push(`${prefix} unknown actions cannot be auto admitted`);
  }
  if (value.admission === "blocked" && value.requiresConfirmation !== true) {
    issues.push(`${prefix} blocked actions must require confirmation`);
  }
  if (value.admission === "blocked" && value.agentExecutable === true) {
    issues.push(`${prefix} blocked actions cannot be agent executable`);
  }
  if (value.display_policy === "diagnostic_only" && value.agentExecutable === true) {
    issues.push(`${prefix} diagnostic_only actions cannot be agent executable`);
  }
  if (value.admission === "auto") {
    const isReadOnlyAuto =
      value.risk === "read_only" &&
      value.display_policy !== "diagnostic_only" &&
      value.reasonCode === "read_only_allowlisted";
    const isReadOnlyDiagnosticAuto =
      value.risk === "read_only" &&
      value.display_policy === "diagnostic_only" &&
      value.agentExecutable === false &&
      value.reasonCode === "read_only_allowlisted";
    const isDiagnosticEvidenceAuto =
      value.risk === "claim_sensitive" &&
      value.display_policy === "diagnostic_only" &&
      value.agentExecutable === false &&
      value.reasonCode === "diagnostic_only_not_executable";
    if (!isReadOnlyAuto && !isReadOnlyDiagnosticAuto && !isDiagnosticEvidenceAuto) {
      issues.push(`${prefix} auto actions must be read_only or diagnostic evidence-only`);
    }
    if (value.solves === true) issues.push(`${prefix} auto actions cannot solve`);
    if (value.mutatesCalculator === true) issues.push(`${prefix} auto actions cannot mutate calculator state`);
    if (!isReadOnlyAuto && !isReadOnlyDiagnosticAuto && !isDiagnosticEvidenceAuto) {
      issues.push(`${prefix} auto actions must use an allowed auto reasonCode`);
    }
  }
  validateSource(value.source, issues);
  if (value.display_policy !== undefined && !includes(HELIX_RECOMMENDED_ACTION_DISPLAY_POLICIES, value.display_policy)) {
    issues.push(`${prefix}.display_policy is invalid`);
  }
  validateOptionalStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateEvidenceRequirements(`${prefix}.evidenceRequirements`, value.evidenceRequirements, issues);
  validateOptionalStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
}

function hasMissingEvidence(value: unknown): boolean {
  const requirements = isRecord(value) ? value.evidenceRequirements : undefined;
  const missing = isRecord(requirements) ? requirements.missing : undefined;
  return Array.isArray(missing) && missing.some((entry) => typeof entry === "string" && entry.trim().length > 0);
}

function validateExecutionInvariants(value: Record<string, unknown>, issues: string[]): void {
  const actions = Array.isArray(value.actions) ? value.actions.filter(isRecord) : [];
  if (actions.some((action) => action.agentExecutable === true && action.admission === "blocked")) {
    issues.push("blocked actions cannot be agent executable");
  }
  if (actions.some((action) => action.agentExecutable === true && action.display_policy === "diagnostic_only")) {
    issues.push("diagnostic_only actions cannot be agent executable");
  }
  if (actions.some((action) => action.agentExecutable === true) && hasMissingEvidence(value)) {
    issues.push("missing required evidence cannot produce an executable action");
  }
  if (actions.some((action) => action.agentExecutable === true && hasMissingEvidence(action))) {
    issues.push("missing required evidence cannot produce an executable action");
  }
}

export function buildHelixRecommendedActionAdmissionV1(
  input: BuildHelixRecommendedActionAdmissionInput,
): HelixRecommendedActionAdmissionV1 {
  return {
    artifactId: HELIX_RECOMMENDED_ACTION_ADMISSION_ARTIFACT_ID,
    schemaVersion: HELIX_RECOMMENDED_ACTION_ADMISSION_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    admissionId: input.admissionId ?? newAdmissionId(),
    prompt: input.prompt,
    sourceReceiptId: input.sourceReceiptId,
    ...(input.source ? { source: input.source } : {}),
    actions: input.actions,
    ...(input.evidenceRefs ? { evidenceRefs: input.evidenceRefs } : {}),
    ...(input.evidenceRequirements ? { evidenceRequirements: input.evidenceRequirements } : {}),
    ...(input.reasonCodes ? { reasonCodes: input.reasonCodes } : {}),
    summary: summarizeActions(input.actions),
    authority: { ...AUTHORITY },
  };
}

export function validateHelixRecommendedActionAdmissionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["helix recommended action admission must be an object"];

  if (value.artifactId !== HELIX_RECOMMENDED_ACTION_ADMISSION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${HELIX_RECOMMENDED_ACTION_ADMISSION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== HELIX_RECOMMENDED_ACTION_ADMISSION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${HELIX_RECOMMENDED_ACTION_ADMISSION_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "admissionId", "prompt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isNullableString(value.sourceReceiptId)) issues.push("sourceReceiptId must be a string or null");
  validateSource(value.source, issues);
  validateOptionalStringArray("evidenceRefs", value.evidenceRefs, issues);
  validateEvidenceRequirements("evidenceRequirements", value.evidenceRequirements, issues);
  validateOptionalStringArray("reasonCodes", value.reasonCodes, issues);
  validateAuthority(value.authority, issues);

  if (!Array.isArray(value.actions)) {
    issues.push("actions must be an array");
  } else {
    value.actions.forEach((action, index) => validateAction(`actions[${index}]`, action, issues));
  }

  const expectedSummary = Array.isArray(value.actions)
    ? summarizeActions(value.actions as HelixRecommendedActionAdmissionEntryV1[])
    : null;
  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else if (expectedSummary) {
    for (const [key, expected] of Object.entries(expectedSummary)) {
      if (value.summary[key] !== expected) issues.push(`summary.${key} must be ${expected}`);
    }
  }

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_RECOMMENDED_ACTION_ADMISSION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }
  validateExecutionInvariants(value, issues);

  return issues;
}

export function isHelixRecommendedActionAdmissionV1(
  value: unknown,
): value is HelixRecommendedActionAdmissionV1 {
  return validateHelixRecommendedActionAdmissionV1(value).length === 0;
}
