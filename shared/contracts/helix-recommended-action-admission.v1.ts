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

export type HelixRecommendedActionRiskV1 =
  (typeof HELIX_RECOMMENDED_ACTION_RISKS)[number];

export type HelixRecommendedActionAdmissionDecisionV1 =
  (typeof HELIX_RECOMMENDED_ACTION_ADMISSIONS)[number];

export type HelixRecommendedActionObjectiveFitV1 =
  (typeof HELIX_RECOMMENDED_ACTION_OBJECTIVE_FITS)[number];

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
  reason: string;
};

export type HelixRecommendedActionAdmissionV1 = {
  artifactId: typeof HELIX_RECOMMENDED_ACTION_ADMISSION_ARTIFACT_ID;
  schemaVersion: typeof HELIX_RECOMMENDED_ACTION_ADMISSION_SCHEMA_VERSION;
  generatedAt: string;
  admissionId: string;
  prompt: string;
  sourceReceiptId: string | null;
  actions: HelixRecommendedActionAdmissionEntryV1[];
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
  if (value.risk === "unknown" && value.admission === "auto") {
    issues.push(`${prefix} unknown actions cannot be auto admitted`);
  }
  if (value.admission === "blocked" && value.requiresConfirmation !== true) {
    issues.push(`${prefix} blocked actions must require confirmation`);
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
    actions: input.actions,
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

  return issues;
}

export function isHelixRecommendedActionAdmissionV1(
  value: unknown,
): value is HelixRecommendedActionAdmissionV1 {
  return validateHelixRecommendedActionAdmissionV1(value).length === 0;
}
