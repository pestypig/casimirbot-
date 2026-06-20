import {
  isTheoryFrontierVectorFieldTraceV1,
  type TheoryBadgeRelationTensorV1,
  type TheoryFrontierVectorCandidateTraceV1,
  type TheoryFrontierVectorFieldTraceV1,
} from "./theory-frontier-vector-field.v1";

export const HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY =
  "helix.theory.frontierVectorFieldTrace" as const;

export const HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID =
  "helix_theory_frontier_vector_field_tool_receipt" as const;

export const HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION =
  "helix_theory_frontier_vector_field_tool_receipt/v1" as const;

export const HELIX_THEORY_FRONTIER_VECTOR_FIELD_FAILURE_CODES = [
  "graph_unavailable",
  "no_badge_matches",
  "no_candidate_pairs",
  "vector_trace_invalid",
  "claim_boundary_blocked",
  "dimensional_mapping_incomplete",
  "evidence_gap_unclosed",
  "exact_verification_required",
  "live_scholarly_lookup_not_available",
] as const;

export type HelixTheoryFrontierVectorFieldFailureCode =
  (typeof HELIX_THEORY_FRONTIER_VECTOR_FIELD_FAILURE_CODES)[number];

export type HelixTheoryFrontierVectorFieldToolReceiptAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

export type HelixTheoryFrontierVectorFieldDebugReceiptV1 = {
  admissionReason: string;
  selectedRoute: "theory_locator";
  selectedCapability: typeof HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY;
  query: string;
  selectedBadgeIds: string[];
  graphHash: string;
  searchSeed: string;
  basisVersion: string;
  scoringVersion: string;
  vectorTraceId: string;
  candidateCount: number;
  relationTensorCount: number;
  validationIssues: string[];
  evidenceGaps: string[];
  claimBoundaryBlocks: string[];
  exactVerificationRequirements: string[];
  replayKeys: {
    graphHash: string;
    query: string;
    searchSeed: string;
    basisVersion: string;
    scoringVersion: string;
    taxonomyVersion: string;
    evidenceReferenceIds: string[];
  };
};

export type HelixTheoryFrontierVectorFieldToolReceiptV1 = {
  artifactId: typeof HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID;
  schemaVersion: typeof HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  receiptId: string;
  capability: typeof HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY;
  status: "ok" | "partial" | "failed";
  typedFailures: HelixTheoryFrontierVectorFieldFailureCode[];

  turnId: string;
  threadId: string | null;

  query: string;
  originBadgeIds: string[];
  maxDepth: number | null;

  vectorFieldTrace: TheoryFrontierVectorFieldTraceV1 | null;
  candidateTraces: TheoryFrontierVectorCandidateTraceV1[];
  relationTensors: TheoryBadgeRelationTensorV1[];
  evidenceGaps: string[];
  exactVerificationRequirements: string[];
  validationIssues: string[];
  debugReceipt: HelixTheoryFrontierVectorFieldDebugReceiptV1;

  authority: HelixTheoryFrontierVectorFieldToolReceiptAuthorityV1;

  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

type BuildHelixTheoryFrontierVectorFieldToolReceiptInput = Omit<
  HelixTheoryFrontierVectorFieldToolReceiptV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "receiptId"
  | "capability"
  | "authority"
  | "assistant_answer"
  | "raw_content_included"
  | "terminal_eligible"
  | "panel_generated_answer"
  | "context_role"
  | "ask_context_policy"
  | "deterministic_content_role"
> & {
  generatedAt?: string;
  receiptId?: string;
};

const AUTHORITY: HelixTheoryFrontierVectorFieldToolReceiptAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  panel_generated_answer: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  deterministic_content_role: "observation_not_assistant_answer",
};

const FORBIDDEN_FRONTIER_VECTOR_FIELD_RECEIPT_PATTERNS = [
  /\bvalidates?\s+(?:the\s+)?theor(?:y|ies)\b/i,
  /\bvalidated\s+(?:the\s+)?edge\b/i,
  /\bpromot(?:e|ed|ion)\s+(?:is\s+)?allowed\b/i,
  /\bphysical\s+mechanism\s+(?:is\s+)?(?:solved|confirmed|validated)\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry: unknown) => typeof entry === "string");

const isFailureCode = (value: unknown): value is HelixTheoryFrontierVectorFieldFailureCode =>
  typeof value === "string" &&
  (HELIX_THEORY_FRONTIER_VECTOR_FIELD_FAILURE_CODES as readonly string[]).includes(value);

function validateAuthority(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (value.assistant_answer !== false) issues.push(`${prefix}.assistant_answer must be false`);
  if (value.raw_content_included !== false) issues.push(`${prefix}.raw_content_included must be false`);
  if (value.terminal_eligible !== false) issues.push(`${prefix}.terminal_eligible must be false`);
  if (value.panel_generated_answer !== false) issues.push(`${prefix}.panel_generated_answer must be false`);
  if (value.context_role !== "tool_evidence") issues.push(`${prefix}.context_role must be tool_evidence`);
  if (value.ask_context_policy !== "evidence_only") issues.push(`${prefix}.ask_context_policy must be evidence_only`);
  if (value.deterministic_content_role !== "observation_not_assistant_answer") {
    issues.push(`${prefix}.deterministic_content_role must be observation_not_assistant_answer`);
  }
}

function validateDebugReceipt(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("debugReceipt must be an object");
    return;
  }
  for (
    const field of [
      "admissionReason",
      "selectedCapability",
      "query",
      "graphHash",
      "searchSeed",
      "basisVersion",
      "scoringVersion",
      "vectorTraceId",
    ] as const
  ) {
    if (!isNonEmptyString(value[field])) issues.push(`debugReceipt.${field} must be a non-empty string`);
  }
  if (value.selectedRoute !== "theory_locator") issues.push("debugReceipt.selectedRoute must be theory_locator");
  if (value.selectedCapability !== HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY) {
    issues.push(`debugReceipt.selectedCapability must be ${HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY}`);
  }
  for (const field of ["candidateCount", "relationTensorCount"] as const) {
    if (typeof value[field] !== "number" || !Number.isFinite(value[field]) || value[field] < 0) {
      issues.push(`debugReceipt.${field} must be a non-negative finite number`);
    }
  }
  for (
    const field of [
      "selectedBadgeIds",
      "validationIssues",
      "evidenceGaps",
      "claimBoundaryBlocks",
      "exactVerificationRequirements",
    ] as const
  ) {
    if (!isStringArray(value[field])) issues.push(`debugReceipt.${field} must be an array of strings`);
  }
  if (!isRecord(value.replayKeys)) {
    issues.push("debugReceipt.replayKeys must be an object");
  } else {
    for (
      const field of ["graphHash", "query", "searchSeed", "basisVersion", "scoringVersion", "taxonomyVersion"] as const
    ) {
      if (!isNonEmptyString(value.replayKeys[field])) {
        issues.push(`debugReceipt.replayKeys.${field} must be a non-empty string`);
      }
    }
    if (!isStringArray(value.replayKeys.evidenceReferenceIds)) {
      issues.push("debugReceipt.replayKeys.evidenceReferenceIds must be an array of strings");
    }
  }
}

export function buildHelixTheoryFrontierVectorFieldToolReceiptV1(
  input: BuildHelixTheoryFrontierVectorFieldToolReceiptInput,
): HelixTheoryFrontierVectorFieldToolReceiptV1 {
  return {
    artifactId: HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID,
    schemaVersion: HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    receiptId: input.receiptId ?? `helix-theory-frontier-vector-field:${input.debugReceipt.vectorTraceId}`,
    capability: HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY,
    status: input.status,
    typedFailures: input.typedFailures,
    turnId: input.turnId,
    threadId: input.threadId,
    query: input.query,
    originBadgeIds: input.originBadgeIds,
    maxDepth: input.maxDepth,
    vectorFieldTrace: input.vectorFieldTrace,
    candidateTraces: input.candidateTraces,
    relationTensors: input.relationTensors,
    evidenceGaps: input.evidenceGaps,
    exactVerificationRequirements: input.exactVerificationRequirements,
    validationIssues: input.validationIssues,
    debugReceipt: input.debugReceipt,
    authority: { ...AUTHORITY },
    ...AUTHORITY,
  };
}

export function validateHelixTheoryFrontierVectorFieldToolReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["helix theory frontier vector-field tool receipt must be an object"];

  if (value.artifactId !== HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION}`);
  }
  if (value.capability !== HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY) {
    issues.push(`capability must be ${HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY}`);
  }
  for (const field of ["generatedAt", "receiptId", "turnId", "query"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isNullableString(value.threadId)) issues.push("threadId must be a string or null");
  if (!["ok", "partial", "failed"].includes(String(value.status))) issues.push("status is invalid");
  if (!Array.isArray(value.typedFailures) || !value.typedFailures.every(isFailureCode)) {
    issues.push("typedFailures must contain only known frontier vector-field failure codes");
  }
  if (!isStringArray(value.originBadgeIds)) issues.push("originBadgeIds must be an array of strings");
  if (value.maxDepth !== null && (typeof value.maxDepth !== "number" || !Number.isFinite(value.maxDepth))) {
    issues.push("maxDepth must be a finite number or null");
  }
  if (value.vectorFieldTrace !== null && !isTheoryFrontierVectorFieldTraceV1(value.vectorFieldTrace)) {
    issues.push("vectorFieldTrace must be null or a valid theory_frontier_vector_field/v1 artifact");
  }
  for (const field of ["candidateTraces", "relationTensors", "evidenceGaps", "exactVerificationRequirements", "validationIssues"] as const) {
    if (!Array.isArray(value[field])) issues.push(`${field} must be an array`);
  }
  validateDebugReceipt(value.debugReceipt, issues);
  validateAuthority("authority", value.authority, issues);
  validateAuthority("top-level authority", value, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_FRONTIER_VECTOR_FIELD_RECEIPT_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }

  return issues;
}

export function isHelixTheoryFrontierVectorFieldToolReceiptV1(
  value: unknown,
): value is HelixTheoryFrontierVectorFieldToolReceiptV1 {
  return validateHelixTheoryFrontierVectorFieldToolReceiptV1(value).length === 0;
}
