import type { TheoryContextReflectionConfidenceMode } from "./theory-context-reflection.v1";

export const THEORY_CONTEXT_EXPLANATION_PLAN_ARTIFACT_ID =
  "theory_context_explanation_plan" as const;
export const THEORY_CONTEXT_EXPLANATION_PLAN_SCHEMA_VERSION =
  "theory_context_explanation_plan/v1" as const;

export const THEORY_CONTEXT_EXPLANATION_NODE_ROLES = [
  "first_principle_root",
  "model_branch",
  "diagnostic_branch",
  "runtime_or_evidence",
  "claim_boundary",
  "selected_context",
] as const;

export const THEORY_CONTEXT_EXPLANATION_STEP_ROLES = [
  "first_principles",
  "branch_context",
  "diagnostic_context",
  "runtime_evidence_context",
  "claim_boundary",
] as const;

export type TheoryContextExplanationNodeRoleV1 =
  (typeof THEORY_CONTEXT_EXPLANATION_NODE_ROLES)[number];

export type TheoryContextExplanationStepRoleV1 =
  (typeof THEORY_CONTEXT_EXPLANATION_STEP_ROLES)[number];

export type TheoryContextExplanationSourceRefV1 = {
  kind: string;
  path?: string | null;
  id?: string | null;
  note?: string | null;
};

export type TheoryContextExplanationNodeV1 = {
  badgeId: string;
  title: string;
  level: string;
  subjects: string[];
  role: TheoryContextExplanationNodeRoleV1;
  displayLatex: string | null;
  expression: string | null;
  claimBoundaryNotes: string[];
  sourceRefs: TheoryContextExplanationSourceRefV1[];
};

export type TheoryContextExplanationEdgeV1 = {
  edgeId: string;
  from: string;
  to: string;
  relation: string;
  label: string | null;
};

export type TheoryContextExplanationStepV1 = {
  id: string;
  index: number;
  title: string;
  badgeIds: string[];
  role: TheoryContextExplanationStepRoleV1;
  summary: string;
  calculatorReady: boolean;
  runtimeReady: boolean;
  boundaryOnly: boolean;
  claimBoundaryNotes: string[];
};

export type TheoryContextExplanationRecommendedActionV1 = {
  actionId: string;
  label: string;
  panelId: "theory-badge-graph" | "scientific-calculator";
  args: Record<string, unknown>;
  mutatesCalculator: boolean;
  solves: boolean;
};

export type TheoryContextExplanationPlanV1 = {
  artifactId: typeof THEORY_CONTEXT_EXPLANATION_PLAN_ARTIFACT_ID;
  schemaVersion: typeof THEORY_CONTEXT_EXPLANATION_PLAN_SCHEMA_VERSION;
  generatedAt: string;
  planId: string;
  graphId: string;
  reflectionId: string;
  source: {
    kind: "theory_context_reflection";
    prompt: string;
    confidenceMode: TheoryContextReflectionConfidenceMode;
  };
  inferredDomains: Array<{
    atlasBlockId: string;
    title: string;
    score: number;
    reasons: string[];
  }>;
  selectedBadgeIds: string[];
  firstPrincipleRoots: TheoryContextExplanationNodeV1[];
  branchNodes: TheoryContextExplanationNodeV1[];
  diagnosticNodes: TheoryContextExplanationNodeV1[];
  runtimeNodes: TheoryContextExplanationNodeV1[];
  claimBoundaryNodes: TheoryContextExplanationNodeV1[];
  connectingEdges: TheoryContextExplanationEdgeV1[];
  explanationSteps: TheoryContextExplanationStepV1[];
  scalarCutBadgeIds: string[];
  runtimeTraceBadgeIds: string[];
  claimBoundaryNotes: string[];
  summary: {
    rootCount: number;
    branchCount: number;
    diagnosticCount: number;
    runtimeCount: number;
    claimBoundaryCount: number;
    scalarCutCount: number;
    pathCount: number;
  };
  recommendedNextActions: TheoryContextExplanationRecommendedActionV1[];
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

type BuildTheoryContextExplanationPlanInput = Omit<
  TheoryContextExplanationPlanV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "planId"
  | "summary"
  | "assistant_answer"
  | "raw_content_included"
  | "terminal_eligible"
  | "panel_generated_answer"
  | "context_role"
  | "ask_context_policy"
  | "deterministic_content_role"
> & {
  generatedAt?: string;
  planId?: string;
};

const FORBIDDEN_THEORY_CONTEXT_EXPLANATION_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\bcertified transport solution\b/i,
  /\bclosed-loop solved transport result\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newPlanId(): string {
  return `theory-context-explanation:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function validateSourceRef(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.kind)) issues.push(`${prefix}.kind must be a non-empty string`);
  if (!isNullableString(value.path)) issues.push(`${prefix}.path must be a string or null`);
  if (!isNullableString(value.id)) issues.push(`${prefix}.id must be a string or null`);
  if (!isNullableString(value.note)) issues.push(`${prefix}.note must be a string or null`);
}

function validateNode(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["badgeId", "title", "level"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isStringArray(value.subjects)) issues.push(`${prefix}.subjects must be an array of strings`);
  if (!includes(THEORY_CONTEXT_EXPLANATION_NODE_ROLES, value.role)) {
    issues.push(`${prefix}.role is invalid`);
  }
  if (!isNullableString(value.displayLatex)) issues.push(`${prefix}.displayLatex must be a string or null`);
  if (!isNullableString(value.expression)) issues.push(`${prefix}.expression must be a string or null`);
  if (!isStringArray(value.claimBoundaryNotes)) {
    issues.push(`${prefix}.claimBoundaryNotes must be an array of strings`);
  }
  if (!Array.isArray(value.sourceRefs)) {
    issues.push(`${prefix}.sourceRefs must be an array`);
  } else {
    value.sourceRefs.forEach((ref, index) => validateSourceRef(`${prefix}.sourceRefs[${index}]`, ref, issues));
  }
}

function validateNodeArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry, index) => validateNode(`${prefix}[${index}]`, entry, issues));
}

function validateEdge(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["edgeId", "from", "to", "relation"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isNullableString(value.label)) issues.push(`${prefix}.label must be a string or null`);
}

function validateStep(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "title", "summary"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isFiniteNumber(value.index)) issues.push(`${prefix}.index must be a finite number`);
  if (!isStringArray(value.badgeIds)) issues.push(`${prefix}.badgeIds must be an array of strings`);
  if (!includes(THEORY_CONTEXT_EXPLANATION_STEP_ROLES, value.role)) {
    issues.push(`${prefix}.role is invalid`);
  }
  for (const field of ["calculatorReady", "runtimeReady", "boundaryOnly"] as const) {
    if (typeof value[field] !== "boolean") issues.push(`${prefix}.${field} must be boolean`);
  }
  if (!isStringArray(value.claimBoundaryNotes)) {
    issues.push(`${prefix}.claimBoundaryNotes must be an array of strings`);
  }
}

function validateRecommendedAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["actionId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (value.panelId !== "theory-badge-graph" && value.panelId !== "scientific-calculator") {
    issues.push(`${prefix}.panelId is invalid`);
  }
  if (!isRecord(value.args)) issues.push(`${prefix}.args must be an object`);
  if (typeof value.mutatesCalculator !== "boolean") issues.push(`${prefix}.mutatesCalculator must be boolean`);
  if (typeof value.solves !== "boolean") issues.push(`${prefix}.solves must be boolean`);
}

function buildSummary(input: BuildTheoryContextExplanationPlanInput): TheoryContextExplanationPlanV1["summary"] {
  return {
    rootCount: input.firstPrincipleRoots.length,
    branchCount: input.branchNodes.length,
    diagnosticCount: input.diagnosticNodes.length,
    runtimeCount: input.runtimeNodes.length,
    claimBoundaryCount: input.claimBoundaryNodes.length,
    scalarCutCount: input.scalarCutBadgeIds.length,
    pathCount: input.connectingEdges.length,
  };
}

export function buildTheoryContextExplanationPlanV1(
  input: BuildTheoryContextExplanationPlanInput,
): TheoryContextExplanationPlanV1 {
  return {
    artifactId: THEORY_CONTEXT_EXPLANATION_PLAN_ARTIFACT_ID,
    schemaVersion: THEORY_CONTEXT_EXPLANATION_PLAN_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    planId: input.planId ?? newPlanId(),
    graphId: input.graphId,
    reflectionId: input.reflectionId,
    source: input.source,
    inferredDomains: input.inferredDomains,
    selectedBadgeIds: unique(input.selectedBadgeIds),
    firstPrincipleRoots: input.firstPrincipleRoots,
    branchNodes: input.branchNodes,
    diagnosticNodes: input.diagnosticNodes,
    runtimeNodes: input.runtimeNodes,
    claimBoundaryNodes: input.claimBoundaryNodes,
    connectingEdges: input.connectingEdges,
    explanationSteps: input.explanationSteps,
    scalarCutBadgeIds: unique(input.scalarCutBadgeIds),
    runtimeTraceBadgeIds: unique(input.runtimeTraceBadgeIds),
    claimBoundaryNotes: unique(input.claimBoundaryNotes),
    summary: buildSummary(input),
    recommendedNextActions: input.recommendedNextActions,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    panel_generated_answer: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    deterministic_content_role: "observation_not_assistant_answer",
  };
}

export function validateTheoryContextExplanationPlanV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["theory context explanation plan must be an object"];

  if (value.artifactId !== THEORY_CONTEXT_EXPLANATION_PLAN_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_CONTEXT_EXPLANATION_PLAN_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_CONTEXT_EXPLANATION_PLAN_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_CONTEXT_EXPLANATION_PLAN_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "planId", "graphId", "reflectionId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!isRecord(value.source)) {
    issues.push("source must be an object");
  } else {
    if (value.source.kind !== "theory_context_reflection") {
      issues.push("source.kind must be theory_context_reflection");
    }
    if (!isNonEmptyString(value.source.prompt)) issues.push("source.prompt must be a non-empty string");
    if (value.source.confidenceMode !== "soft_locator" && value.source.confidenceMode !== "strict_badge_match") {
      issues.push("source.confidenceMode is invalid");
    }
  }

  if (!Array.isArray(value.inferredDomains)) {
    issues.push("inferredDomains must be an array");
  } else {
    value.inferredDomains.forEach((domain, index) => {
      if (!isRecord(domain)) {
        issues.push(`inferredDomains[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(domain.atlasBlockId)) issues.push(`inferredDomains[${index}].atlasBlockId must be a non-empty string`);
      if (!isNonEmptyString(domain.title)) issues.push(`inferredDomains[${index}].title must be a non-empty string`);
      if (!isFiniteNumber(domain.score)) issues.push(`inferredDomains[${index}].score must be a finite number`);
      if (!isStringArray(domain.reasons)) issues.push(`inferredDomains[${index}].reasons must be an array of strings`);
    });
  }

  if (!isStringArray(value.selectedBadgeIds)) issues.push("selectedBadgeIds must be an array of strings");
  validateNodeArray("firstPrincipleRoots", value.firstPrincipleRoots, issues);
  validateNodeArray("branchNodes", value.branchNodes, issues);
  validateNodeArray("diagnosticNodes", value.diagnosticNodes, issues);
  validateNodeArray("runtimeNodes", value.runtimeNodes, issues);
  validateNodeArray("claimBoundaryNodes", value.claimBoundaryNodes, issues);

  if (!Array.isArray(value.connectingEdges)) {
    issues.push("connectingEdges must be an array");
  } else {
    value.connectingEdges.forEach((edge, index) => validateEdge(`connectingEdges[${index}]`, edge, issues));
  }

  if (!Array.isArray(value.explanationSteps)) {
    issues.push("explanationSteps must be an array");
  } else {
    value.explanationSteps.forEach((step, index) => validateStep(`explanationSteps[${index}]`, step, issues));
  }

  if (!isStringArray(value.scalarCutBadgeIds)) issues.push("scalarCutBadgeIds must be an array of strings");
  if (!isStringArray(value.runtimeTraceBadgeIds)) issues.push("runtimeTraceBadgeIds must be an array of strings");
  if (!isStringArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be an array of strings");

  if (!Array.isArray(value.recommendedNextActions)) {
    issues.push("recommendedNextActions must be an array");
  } else {
    value.recommendedNextActions.forEach((action, index) =>
      validateRecommendedAction(`recommendedNextActions[${index}]`, action, issues),
    );
  }

  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else {
    const expected = {
      rootCount: Array.isArray(value.firstPrincipleRoots) ? value.firstPrincipleRoots.length : -1,
      branchCount: Array.isArray(value.branchNodes) ? value.branchNodes.length : -1,
      diagnosticCount: Array.isArray(value.diagnosticNodes) ? value.diagnosticNodes.length : -1,
      runtimeCount: Array.isArray(value.runtimeNodes) ? value.runtimeNodes.length : -1,
      claimBoundaryCount: Array.isArray(value.claimBoundaryNodes) ? value.claimBoundaryNodes.length : -1,
      scalarCutCount: Array.isArray(value.scalarCutBadgeIds) ? value.scalarCutBadgeIds.length : -1,
      pathCount: Array.isArray(value.connectingEdges) ? value.connectingEdges.length : -1,
    };
    for (const [field, count] of Object.entries(expected)) {
      if (value.summary[field] !== count) issues.push(`summary.${field} must match computed count`);
    }
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
  for (const pattern of FORBIDDEN_THEORY_CONTEXT_EXPLANATION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }

  return issues;
}

export function isTheoryContextExplanationPlanV1(
  value: unknown,
): value is TheoryContextExplanationPlanV1 {
  return validateTheoryContextExplanationPlanV1(value).length === 0;
}
