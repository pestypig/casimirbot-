import {
  IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS,
  type IdeologyContextReflectionInputKindV1,
  type IdeologyContextReflectionRecommendedActionV1,
  type IdeologyContextReflectionV1,
  validateIdeologyContextReflectionV1,
} from "../ideology-context-reflection";
import {
  type HelixRecommendedActionAdmissionV1,
  validateHelixRecommendedActionAdmissionV1,
} from "./helix-recommended-action-admission.v1";
import {
  type ProceduralZenClassificationV1,
  validateProceduralZenClassificationV1,
} from "./procedural-zen-classification.v1";
import { type ZenObjectiveBindingV1, validateZenObjectiveBindingV1 } from "./zen-objective-binding.v1";
import { type ZenBadgeLocatorV1, validateZenBadgeLocatorV1 } from "./zen-badge-locator.v1";

export const ZEN_GRAPH_REFLECTION_TOOL_REQUEST_SCHEMA_VERSION = "zen_graph_reflection_tool_request/v1" as const;
export const ZEN_GRAPH_REFLECTION_TOOL_RESPONSE_SCHEMA_VERSION = "zen_graph_reflection_tool_response/v1" as const;
export const ZEN_GRAPH_REFLECTION_MAX_LOOP_DEPTH = 2 as const;

export const ZEN_GRAPH_REFLECTION_SOURCE_KINDS = [
  "user_text",
  "workstation_content",
  "document_selection",
  "repo_evidence",
  "assistant_summary",
  "prior_reflection",
] as const;

export const ZEN_GRAPH_REFLECTION_SOURCE_TRUST_LEVELS = ["primary", "derived", "low_trust"] as const;

export type ZenGraphReflectionSourceKindV1 = (typeof ZEN_GRAPH_REFLECTION_SOURCE_KINDS)[number];
export type ZenGraphReflectionSourceTrustV1 = (typeof ZEN_GRAPH_REFLECTION_SOURCE_TRUST_LEVELS)[number];

export type ZenGraphRecommendedAction = IdeologyContextReflectionRecommendedActionV1;

export type ZenGraphReflectionToolOptionsV1 = {
  includeObjectiveBinding?: boolean;
  includeTrace?: boolean;
  includeRecommendedActions?: boolean;
  includeAdmissions?: boolean;
  includeProceduralClassification?: boolean;
};

export type ZenGraphReflectionToolRequestV1 = {
  reflectionId?: string;
  parentReflectionId?: string;
  loopDepth: number;
  sourceKind: ZenGraphReflectionSourceKindV1;
  inputKind: IdeologyContextReflectionInputKindV1;
  text: string;
  refs?: string[];
  requestedPresetIds?: string[];
  comparePresetIds?: string[];
  options?: ZenGraphReflectionToolOptionsV1;
};

export type ZenGraphReflectionProvenanceV1 = {
  reflectionId: string;
  parentReflectionId?: string;
  loopDepth: number;
  sourceKind: ZenGraphReflectionSourceKindV1;
  sourceTrust: ZenGraphReflectionSourceTrustV1;
  continuityOnly: boolean;
  confirmationEligible: boolean;
  confidenceCap: number;
};

export type ZenGraphReflectionToolResponseV1 = {
  provenance: ZenGraphReflectionProvenanceV1;
  reflection: IdeologyContextReflectionV1;
  proceduralClassification?: ProceduralZenClassificationV1;
  locator?: ZenBadgeLocatorV1;
  objectiveBinding: ZenObjectiveBindingV1;
  presetOverlays?: ZenObjectiveBindingV1[];
  recommendedActions: ZenGraphRecommendedAction[];
  admissions: HelixRecommendedActionAdmissionV1[];
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

function includes<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be a string array`);
}

function validateOptions(value: unknown, issues: string[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push("options must be an object");
    return;
  }
  for (const field of [
    "includeObjectiveBinding",
    "includeTrace",
    "includeRecommendedActions",
    "includeAdmissions",
    "includeProceduralClassification",
  ] as const) {
    if (value[field] !== undefined && typeof value[field] !== "boolean") {
      issues.push(`options.${field} must be boolean`);
    }
  }
}

function validateSourceKind(value: unknown, issues: string[]): void {
  if (!includes(ZEN_GRAPH_REFLECTION_SOURCE_KINDS, value)) {
    issues.push("sourceKind is invalid");
  }
}

function validateSourceTrust(value: unknown, issues: string[]): void {
  if (!includes(ZEN_GRAPH_REFLECTION_SOURCE_TRUST_LEVELS, value)) {
    issues.push("sourceTrust is invalid");
  }
}

function validateLoopDepth(value: unknown, issues: string[]): void {
  if (!Number.isInteger(value) || typeof value !== "number") {
    issues.push("loopDepth must be an integer");
    return;
  }
  if (value < 0 || value > ZEN_GRAPH_REFLECTION_MAX_LOOP_DEPTH) {
    issues.push(`loopDepth must be between 0 and ${ZEN_GRAPH_REFLECTION_MAX_LOOP_DEPTH}`);
  }
}

function validateRecommendedAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "type", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateOptionalStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
}

function validateEvidenceOnlyAuthority(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (value.assistant_answer !== false) issues.push(`${prefix}.assistant_answer must be false`);
  if (value.raw_content_included !== false) issues.push(`${prefix}.raw_content_included must be false`);
  if (value.terminal_eligible !== false) issues.push(`${prefix}.terminal_eligible must be false`);
  if (value.context_role !== "tool_policy") issues.push(`${prefix}.context_role must be tool_policy`);
  if (value.ask_context_policy !== "evidence_only") issues.push(`${prefix}.ask_context_policy must be evidence_only`);
  if (value.agent_executable !== false) issues.push(`${prefix}.agent_executable must be false`);
}

export function validateZenGraphReflectionToolRequestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["ZenGraph reflection tool request must be an object"];

  if (value.reflectionId !== undefined && !isNonEmptyString(value.reflectionId)) {
    issues.push("reflectionId must be a non-empty string when present");
  }
  if (value.parentReflectionId !== undefined && !isNonEmptyString(value.parentReflectionId)) {
    issues.push("parentReflectionId must be a non-empty string when present");
  }
  validateLoopDepth(value.loopDepth, issues);
  validateSourceKind(value.sourceKind, issues);
  if (value.sourceKind === "prior_reflection" && !isNonEmptyString(value.parentReflectionId)) {
    issues.push("prior_reflection requires parentReflectionId");
  }
  if (!includes(IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS, value.inputKind)) {
    issues.push("inputKind is invalid");
  }
  if (!isNonEmptyString(value.text)) issues.push("text must be a non-empty string");
  validateOptionalStringArray("refs", value.refs, issues);
  validateOptionalStringArray("requestedPresetIds", value.requestedPresetIds, issues);
  validateOptionalStringArray("comparePresetIds", value.comparePresetIds, issues);
  validateOptions(value.options, issues);

  return issues;
}

function validateProvenance(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("provenance must be an object");
    return;
  }
  if (!isNonEmptyString(value.reflectionId)) issues.push("provenance.reflectionId must be a non-empty string");
  if (value.parentReflectionId !== undefined && !isNonEmptyString(value.parentReflectionId)) {
    issues.push("provenance.parentReflectionId must be a non-empty string when present");
  }
  validateLoopDepth(value.loopDepth, issues);
  validateSourceKind(value.sourceKind, issues);
  validateSourceTrust(value.sourceTrust, issues);
  if (typeof value.continuityOnly !== "boolean") issues.push("provenance.continuityOnly must be boolean");
  if (typeof value.confirmationEligible !== "boolean") issues.push("provenance.confirmationEligible must be boolean");
  if (typeof value.confidenceCap !== "number" || !Number.isFinite(value.confidenceCap) || value.confidenceCap < 0 || value.confidenceCap > 1) {
    issues.push("provenance.confidenceCap must be between 0 and 1");
  }
  if (value.sourceKind === "assistant_summary" && value.sourceTrust === "primary") {
    issues.push("assistant_summary cannot be primary evidence");
  }
  if (value.sourceKind === "prior_reflection" && value.sourceTrust === "primary") {
    issues.push("prior_reflection cannot be primary evidence");
  }
  if (value.sourceKind === "prior_reflection" && !isNonEmptyString(value.parentReflectionId)) {
    issues.push("prior_reflection provenance requires parentReflectionId");
  }
  if (value.sourceKind === "prior_reflection" && value.confirmationEligible !== false) {
    issues.push("prior_reflection cannot be confirmation eligible");
  }
}

export function validateZenGraphReflectionToolResponseV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["ZenGraph reflection tool response must be an object"];

  validateProvenance(value.provenance, issues);
  issues.push(...validateIdeologyContextReflectionV1(value.reflection).map((issue) => `reflection.${issue}`));
  if (value.proceduralClassification !== undefined) {
    issues.push(
      ...validateProceduralZenClassificationV1(value.proceduralClassification).map(
        (issue) => `proceduralClassification.${issue}`,
      ),
    );
  }
  if (value.locator !== undefined) {
    issues.push(...validateZenBadgeLocatorV1(value.locator).map((issue) => `locator.${issue}`));
  }
  issues.push(...validateZenObjectiveBindingV1(value.objectiveBinding).map((issue) => `objectiveBinding.${issue}`));

  if (Array.isArray(value.presetOverlays)) {
    value.presetOverlays.forEach((overlay, index) => {
      issues.push(...validateZenObjectiveBindingV1(overlay).map((issue) => `presetOverlays[${index}].${issue}`));
    });
  } else if (value.presetOverlays !== undefined) {
    issues.push("presetOverlays must be an array when present");
  }

  if (!Array.isArray(value.recommendedActions)) {
    issues.push("recommendedActions must be an array");
  } else {
    value.recommendedActions.forEach((action, index) => validateRecommendedAction(`recommendedActions[${index}]`, action, issues));
  }

  if (!Array.isArray(value.admissions)) {
    issues.push("admissions must be an array");
  } else {
    value.admissions.forEach((admission, index) => {
      issues.push(...validateHelixRecommendedActionAdmissionV1(admission).map((issue) => `admissions[${index}].${issue}`));
    });
  }

  if (isRecord(value.reflection)) validateEvidenceOnlyAuthority("reflection.authority", value.reflection.authority, issues);
  if (isRecord(value.objectiveBinding)) {
    validateEvidenceOnlyAuthority("objectiveBinding.authorityBoundary", value.objectiveBinding.authorityBoundary, issues);
  }
  if (Array.isArray(value.presetOverlays)) {
    value.presetOverlays.forEach((overlay, index) => {
      if (isRecord(overlay)) {
        validateEvidenceOnlyAuthority(`presetOverlays[${index}].authorityBoundary`, overlay.authorityBoundary, issues);
      }
    });
  }

  return issues;
}

export function isZenGraphReflectionToolRequestV1(value: unknown): value is ZenGraphReflectionToolRequestV1 {
  return validateZenGraphReflectionToolRequestV1(value).length === 0;
}

export function isZenGraphReflectionToolResponseV1(value: unknown): value is ZenGraphReflectionToolResponseV1 {
  return validateZenGraphReflectionToolResponseV1(value).length === 0;
}
