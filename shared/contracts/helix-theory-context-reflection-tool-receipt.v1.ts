import {
  isTheoryContextExplanationPlanV1,
  type TheoryContextExplanationPlanV1,
} from "./theory-context-explanation-plan.v1";
import {
  isTheoryContextReflectionV1,
  type TheoryContextReflectionRecommendedActionV1,
  type TheoryContextReflectionV1,
} from "./theory-context-reflection.v1";
import {
  isTheoryFrontierSearchV1,
  type TheoryFrontierSearchV1,
} from "./theory-frontier-search.v1";
import {
  isTheoryFrontierLiteratureMapV1,
  type TheoryFrontierLiteratureMapV1,
} from "./theory-frontier-literature-map.v1";
import {
  isTheoryFrontierExactContractVerificationV1,
  type TheoryFrontierExactContractVerificationV1,
} from "./theory-frontier-exact-contract-verification.v1";
import {
  isTheoryCongruenceTraceV1,
  type TheoryCongruenceTraceV1,
} from "../helix-theory-congruence-trace";

export const HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID =
  "helix_theory_context_reflection_tool_receipt" as const;

export const HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION =
  "helix_theory_context_reflection_tool_receipt/v1" as const;

export const HELIX_THEORY_CONTEXT_REFLECTION_PANEL_SYNC_OVERLAY_MODES = [
  "none",
  "live_answer_context",
  "discussion_zone",
] as const;

export type HelixTheoryContextReflectionPanelSyncOverlayMode =
  (typeof HELIX_THEORY_CONTEXT_REFLECTION_PANEL_SYNC_OVERLAY_MODES)[number];

export type HelixTheoryContextReflectionToolReceiptAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

export type HelixTheoryContextReflectionToolReceiptV1 = {
  artifactId: typeof HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID;
  schemaVersion: typeof HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  receiptId: string;

  turnId: string;
  threadId: string | null;

  prompt: string;
  conversationContext: string | null;

  reflectionV1: TheoryContextReflectionV1;
  explanationPlanV1: TheoryContextExplanationPlanV1 | null;
  theoryCongruenceTraceV1: TheoryCongruenceTraceV1 | null;
  frontierSearchV1: TheoryFrontierSearchV1 | null;
  frontierLiteratureMapV1: TheoryFrontierLiteratureMapV1 | null;
  frontierExactVerificationResultsV1: TheoryFrontierExactContractVerificationV1[];

  panelSync: {
    requested: boolean;
    applied: boolean;
    panelId: "theory-badge-graph";
    selectedLiveContextBlock: boolean;
    openPanel: boolean;
    overlayMode: HelixTheoryContextReflectionPanelSyncOverlayMode;
  };

  authority: HelixTheoryContextReflectionToolReceiptAuthorityV1;

  recommendedNextActions: TheoryContextReflectionRecommendedActionV1[];

  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

type BuildHelixTheoryContextReflectionToolReceiptInput = Omit<
  HelixTheoryContextReflectionToolReceiptV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "receiptId"
  | "authority"
  | "theoryCongruenceTraceV1"
  | "frontierSearchV1"
  | "frontierLiteratureMapV1"
  | "frontierExactVerificationResultsV1"
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
  theoryCongruenceTraceV1?: TheoryCongruenceTraceV1 | null;
  frontierSearchV1?: TheoryFrontierSearchV1 | null;
  frontierLiteratureMapV1?: TheoryFrontierLiteratureMapV1 | null;
  frontierExactVerificationResultsV1?: TheoryFrontierExactContractVerificationV1[];
};

const AUTHORITY: HelixTheoryContextReflectionToolReceiptAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  panel_generated_answer: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  deterministic_content_role: "observation_not_assistant_answer",
};

const FORBIDDEN_HELIX_THEORY_REFLECTION_TOOL_RECEIPT_PATTERNS = [
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

const isOverlayMode = (value: unknown): value is HelixTheoryContextReflectionPanelSyncOverlayMode =>
  typeof value === "string" &&
  (HELIX_THEORY_CONTEXT_REFLECTION_PANEL_SYNC_OVERLAY_MODES as readonly string[]).includes(value);

function newReceiptId(): string {
  return `helix-theory-reflection-tool-receipt:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

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
  if (value.ask_context_policy !== "evidence_only") {
    issues.push(`${prefix}.ask_context_policy must be evidence_only`);
  }
  if (value.deterministic_content_role !== "observation_not_assistant_answer") {
    issues.push(`${prefix}.deterministic_content_role must be observation_not_assistant_answer`);
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

export function buildHelixTheoryContextReflectionToolReceiptV1(
  input: BuildHelixTheoryContextReflectionToolReceiptInput,
): HelixTheoryContextReflectionToolReceiptV1 {
  return {
    artifactId: HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID,
    schemaVersion: HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    receiptId: input.receiptId ?? newReceiptId(),
    turnId: input.turnId,
    threadId: input.threadId,
    prompt: input.prompt,
    conversationContext: input.conversationContext,
    reflectionV1: input.reflectionV1,
    explanationPlanV1: input.explanationPlanV1,
    theoryCongruenceTraceV1: input.theoryCongruenceTraceV1 ?? null,
    frontierSearchV1: input.frontierSearchV1 ?? null,
    frontierLiteratureMapV1: input.frontierLiteratureMapV1 ?? null,
    frontierExactVerificationResultsV1: input.frontierExactVerificationResultsV1 ?? [],
    panelSync: input.panelSync,
    authority: { ...AUTHORITY },
    recommendedNextActions: input.recommendedNextActions,
    ...AUTHORITY,
  };
}

export function validateHelixTheoryContextReflectionToolReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["helix theory context reflection tool receipt must be an object"];

  if (value.artifactId !== HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${HELIX_THEORY_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "receiptId", "turnId", "prompt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isNullableString(value.threadId)) issues.push("threadId must be a string or null");
  if (!isNullableString(value.conversationContext)) {
    issues.push("conversationContext must be a string or null");
  }

  if (!isTheoryContextReflectionV1(value.reflectionV1)) {
    issues.push("reflectionV1 must be a valid theory_context_reflection/v1 artifact");
  }
  if (value.explanationPlanV1 !== null && !isTheoryContextExplanationPlanV1(value.explanationPlanV1)) {
    issues.push("explanationPlanV1 must be null or a valid theory_context_explanation_plan/v1 artifact");
  }
  if (
    value.theoryCongruenceTraceV1 !== undefined &&
    value.theoryCongruenceTraceV1 !== null &&
    !isTheoryCongruenceTraceV1(value.theoryCongruenceTraceV1)
  ) {
    issues.push("theoryCongruenceTraceV1 must be null or a valid helix.theory_congruence_trace.v1 artifact");
  }
  if (
    value.frontierSearchV1 !== undefined &&
    value.frontierSearchV1 !== null &&
    !isTheoryFrontierSearchV1(value.frontierSearchV1)
  ) {
    issues.push("frontierSearchV1 must be null or a valid theory_frontier_search/v1 artifact");
  }
  if (
    value.frontierLiteratureMapV1 !== undefined &&
    value.frontierLiteratureMapV1 !== null &&
    !isTheoryFrontierLiteratureMapV1(value.frontierLiteratureMapV1)
  ) {
    issues.push("frontierLiteratureMapV1 must be null or a valid theory_frontier_literature_map/v1 artifact");
  }
  if (!Array.isArray(value.frontierExactVerificationResultsV1)) {
    issues.push("frontierExactVerificationResultsV1 must be an array");
  } else {
    value.frontierExactVerificationResultsV1.forEach((result: unknown, index: number) => {
      const prefix = `frontierExactVerificationResultsV1[${index}]`;
      if (!isTheoryFrontierExactContractVerificationV1(result)) {
        issues.push(`${prefix} must be a valid theory_frontier_exact_contract_verification/v1 artifact`);
      }
    });
  }

  if (!isRecord(value.panelSync)) {
    issues.push("panelSync must be an object");
  } else {
    for (const field of ["requested", "applied", "selectedLiveContextBlock", "openPanel"] as const) {
      if (typeof value.panelSync[field] !== "boolean") issues.push(`panelSync.${field} must be boolean`);
    }
    if (value.panelSync.panelId !== "theory-badge-graph") {
      issues.push("panelSync.panelId must be theory-badge-graph");
    }
    if (!isOverlayMode(value.panelSync.overlayMode)) {
      issues.push("panelSync.overlayMode is invalid");
    }
  }

  validateAuthority("authority", value.authority, issues);
  validateAuthority("top-level authority", value, issues);

  if (!Array.isArray(value.recommendedNextActions)) {
    issues.push("recommendedNextActions must be an array");
  } else {
    value.recommendedNextActions.forEach((action: unknown, index: number) =>
      validateRecommendedAction(`recommendedNextActions[${index}]`, action, issues),
    );
  }

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_HELIX_THEORY_REFLECTION_TOOL_RECEIPT_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }

  return issues;
}

export function isHelixTheoryContextReflectionToolReceiptV1(
  value: unknown,
): value is HelixTheoryContextReflectionToolReceiptV1 {
  return validateHelixTheoryContextReflectionToolReceiptV1(value).length === 0;
}
