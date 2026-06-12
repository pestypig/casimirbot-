export const THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_ARTIFACT_ID =
  "theory_context_scientific_method_reflection" as const;

export const THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_SCHEMA_VERSION =
  "theory_context_scientific_method_reflection/v1" as const;

export const THEORY_CONTEXT_SCIENTIFIC_METHOD_OBSERVABLE_STATUSES = [
  "available_in_graph",
  "missing_evidence",
  "proxy_only",
] as const;

export const THEORY_CONTEXT_SCIENTIFIC_METHOD_NEXT_ACTION_KINDS = [
  "inspect_badge_path",
  "load_proxy",
  "retrieve_observable",
  "ask_clarification",
  "stop_at_boundary",
] as const;

export type TheoryContextScientificMethodObservableStatusV1 =
  (typeof THEORY_CONTEXT_SCIENTIFIC_METHOD_OBSERVABLE_STATUSES)[number];

export type TheoryContextScientificMethodNextActionKindV1 =
  (typeof THEORY_CONTEXT_SCIENTIFIC_METHOD_NEXT_ACTION_KINDS)[number];

export type TheoryContextScientificMethodHypothesisCandidateV1 = {
  hypothesisId: string;
  badgeIds: string[];
  summary: string;
  status: "candidate" | "needs_evidence" | "blocked_by_boundary";
  role: "prompt_center" | "theory_extension" | "analogy_context";
};

export type TheoryContextScientificMethodObservableRequirementV1 = {
  requirementId: string;
  badgeIds: string[];
  requiredObservable: string;
  whyNeeded: string;
  status: TheoryContextScientificMethodObservableStatusV1;
};

export type TheoryContextScientificMethodCalculatorProxyV1 = {
  badgeId: string;
  payloadIds: string[];
  proxyBoundary: string;
};

export type TheoryContextScientificMethodFalsificationCheckV1 = {
  checkId: string;
  badgeIds: string[];
  check: string;
  missingEvidence: string[];
};

export type TheoryContextScientificMethodNextStepV1 = {
  stepId: string;
  label: string;
  actionKind: TheoryContextScientificMethodNextActionKindV1;
  badgeIds: string[];
  solves: false;
};

export type TheoryContextScientificMethodReflectionV1 = {
  artifactId: typeof THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_ARTIFACT_ID;
  schemaVersion: typeof THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_SCHEMA_VERSION;
  generatedAt: string;
  methodId: string;
  graphId: string;
  reflectionId: string;
  prompt: string;
  observationTarget: {
    promptCenterBadgeIds: string[];
    targetDomainTitles: string[];
    resolutionMode: "focused" | "path" | "wide_context";
  };
  hypothesisCandidates: TheoryContextScientificMethodHypothesisCandidateV1[];
  firstPrinciplesAnchors: string[];
  theoryExtensionPath: string[];
  observableRequirements: TheoryContextScientificMethodObservableRequirementV1[];
  calculatorProxyCandidates: TheoryContextScientificMethodCalculatorProxyV1[];
  falsificationChecks: TheoryContextScientificMethodFalsificationCheckV1[];
  uncertaintyBoundaries: string[];
  claimBoundaries: string[];
  proceduralNextSteps: TheoryContextScientificMethodNextStepV1[];
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

type BuildTheoryContextScientificMethodReflectionInput = Omit<
  TheoryContextScientificMethodReflectionV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "methodId"
  | "assistant_answer"
  | "raw_content_included"
  | "terminal_eligible"
  | "panel_generated_answer"
  | "context_role"
  | "ask_context_policy"
  | "deterministic_content_role"
> & {
  generatedAt?: string;
  methodId?: string;
};

const FORBIDDEN_SCIENTIFIC_METHOD_REFLECTION_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\bcertified transport solution\b/i,
  /\bscientific method proves\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newMethodId(): string {
  return `theory-context-scientific-method:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function validateObservationTarget(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("observationTarget must be an object");
    return;
  }
  if (!isStringArray(value.promptCenterBadgeIds)) {
    issues.push("observationTarget.promptCenterBadgeIds must be an array of strings");
  }
  if (!isStringArray(value.targetDomainTitles)) {
    issues.push("observationTarget.targetDomainTitles must be an array of strings");
  }
  if (!["focused", "path", "wide_context"].includes(String(value.resolutionMode))) {
    issues.push("observationTarget.resolutionMode is invalid");
  }
}

function validateHypothesis(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.hypothesisId)) issues.push(`${prefix}.hypothesisId must be a non-empty string`);
  if (!isStringArray(value.badgeIds)) issues.push(`${prefix}.badgeIds must be an array of strings`);
  if (!isNonEmptyString(value.summary)) issues.push(`${prefix}.summary must be a non-empty string`);
  if (!["candidate", "needs_evidence", "blocked_by_boundary"].includes(String(value.status))) {
    issues.push(`${prefix}.status is invalid`);
  }
  if (!["prompt_center", "theory_extension", "analogy_context"].includes(String(value.role))) {
    issues.push(`${prefix}.role is invalid`);
  }
}

function validateObservableRequirement(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["requirementId", "requiredObservable", "whyNeeded"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isStringArray(value.badgeIds)) issues.push(`${prefix}.badgeIds must be an array of strings`);
  if (!includes(THEORY_CONTEXT_SCIENTIFIC_METHOD_OBSERVABLE_STATUSES, value.status)) {
    issues.push(`${prefix}.status is invalid`);
  }
}

function validateCalculatorProxy(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
  if (!isStringArray(value.payloadIds)) issues.push(`${prefix}.payloadIds must be an array of strings`);
  if (!isNonEmptyString(value.proxyBoundary)) issues.push(`${prefix}.proxyBoundary must be a non-empty string`);
}

function validateFalsificationCheck(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.checkId)) issues.push(`${prefix}.checkId must be a non-empty string`);
  if (!isStringArray(value.badgeIds)) issues.push(`${prefix}.badgeIds must be an array of strings`);
  if (!isNonEmptyString(value.check)) issues.push(`${prefix}.check must be a non-empty string`);
  if (!isStringArray(value.missingEvidence)) issues.push(`${prefix}.missingEvidence must be an array of strings`);
}

function validateNextStep(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.stepId)) issues.push(`${prefix}.stepId must be a non-empty string`);
  if (!isNonEmptyString(value.label)) issues.push(`${prefix}.label must be a non-empty string`);
  if (!includes(THEORY_CONTEXT_SCIENTIFIC_METHOD_NEXT_ACTION_KINDS, value.actionKind)) {
    issues.push(`${prefix}.actionKind is invalid`);
  }
  if (!isStringArray(value.badgeIds)) issues.push(`${prefix}.badgeIds must be an array of strings`);
  if (value.solves !== false) issues.push(`${prefix}.solves must be false`);
}

export function buildTheoryContextScientificMethodReflectionV1(
  input: BuildTheoryContextScientificMethodReflectionInput,
): TheoryContextScientificMethodReflectionV1 {
  return {
    artifactId: THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_ARTIFACT_ID,
    schemaVersion: THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    methodId: input.methodId ?? newMethodId(),
    graphId: input.graphId,
    reflectionId: input.reflectionId,
    prompt: input.prompt,
    observationTarget: {
      ...input.observationTarget,
      promptCenterBadgeIds: unique(input.observationTarget.promptCenterBadgeIds),
      targetDomainTitles: unique(input.observationTarget.targetDomainTitles),
    },
    hypothesisCandidates: input.hypothesisCandidates,
    firstPrinciplesAnchors: unique(input.firstPrinciplesAnchors),
    theoryExtensionPath: unique(input.theoryExtensionPath),
    observableRequirements: input.observableRequirements,
    calculatorProxyCandidates: input.calculatorProxyCandidates.map((proxy) => ({
      ...proxy,
      payloadIds: unique(proxy.payloadIds),
    })),
    falsificationChecks: input.falsificationChecks,
    uncertaintyBoundaries: unique(input.uncertaintyBoundaries),
    claimBoundaries: unique(input.claimBoundaries),
    proceduralNextSteps: input.proceduralNextSteps,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    panel_generated_answer: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    deterministic_content_role: "observation_not_assistant_answer",
  };
}

export function emptyTheoryContextScientificMethodReflectionV1(args: {
  graphId: string;
  reflectionId: string;
  prompt: string;
  generatedAt?: string;
}): TheoryContextScientificMethodReflectionV1 {
  return buildTheoryContextScientificMethodReflectionV1({
    generatedAt: args.generatedAt,
    graphId: args.graphId,
    reflectionId: args.reflectionId,
    prompt: args.prompt,
    observationTarget: {
      promptCenterBadgeIds: [],
      targetDomainTitles: [],
      resolutionMode: "path",
    },
    hypothesisCandidates: [],
    firstPrinciplesAnchors: [],
    theoryExtensionPath: [],
    observableRequirements: [],
    calculatorProxyCandidates: [],
    falsificationChecks: [],
    uncertaintyBoundaries: [],
    claimBoundaries: [],
    proceduralNextSteps: [],
  });
}

export function validateTheoryContextScientificMethodReflectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["theory context scientific method reflection must be an object"];

  if (value.artifactId !== THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_CONTEXT_SCIENTIFIC_METHOD_REFLECTION_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "methodId", "graphId", "reflectionId", "prompt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  validateObservationTarget(value.observationTarget, issues);

  if (!Array.isArray(value.hypothesisCandidates)) {
    issues.push("hypothesisCandidates must be an array");
  } else {
    value.hypothesisCandidates.forEach((entry, index) =>
      validateHypothesis(`hypothesisCandidates[${index}]`, entry, issues),
    );
  }
  for (const field of ["firstPrinciplesAnchors", "theoryExtensionPath", "uncertaintyBoundaries", "claimBoundaries"] as const) {
    if (!isStringArray(value[field])) issues.push(`${field} must be an array of strings`);
  }
  if (!Array.isArray(value.observableRequirements)) {
    issues.push("observableRequirements must be an array");
  } else {
    value.observableRequirements.forEach((entry, index) =>
      validateObservableRequirement(`observableRequirements[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.calculatorProxyCandidates)) {
    issues.push("calculatorProxyCandidates must be an array");
  } else {
    value.calculatorProxyCandidates.forEach((entry, index) =>
      validateCalculatorProxy(`calculatorProxyCandidates[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.falsificationChecks)) {
    issues.push("falsificationChecks must be an array");
  } else {
    value.falsificationChecks.forEach((entry, index) =>
      validateFalsificationCheck(`falsificationChecks[${index}]`, entry, issues),
    );
  }
  if (!Array.isArray(value.proceduralNextSteps)) {
    issues.push("proceduralNextSteps must be an array");
  } else {
    value.proceduralNextSteps.forEach((entry, index) => validateNextStep(`proceduralNextSteps[${index}]`, entry, issues));
  }

  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.panel_generated_answer !== false) issues.push("panel_generated_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("ask_context_policy must be evidence_only");
  if (value.deterministic_content_role !== "observation_not_assistant_answer") {
    issues.push("deterministic_content_role must be observation_not_assistant_answer");
  }

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_SCIENTIFIC_METHOD_REFLECTION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }

  return issues;
}

export function isTheoryContextScientificMethodReflectionV1(
  value: unknown,
): value is TheoryContextScientificMethodReflectionV1 {
  return validateTheoryContextScientificMethodReflectionV1(value).length === 0;
}
