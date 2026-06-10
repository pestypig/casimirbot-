export const DOC_EQUATION_CONTEXT_VERSION = "doc_equation_context/v1" as const;

export const DOC_EQUATION_CONTEXT_ACTION_KIND_VALUES = [
  "calculator_ingest",
  "artifact_backed_theory_run",
] as const;

export const DOC_EQUATION_CONTEXT_SCOPE_VALUES = [
  "scalar_replay",
  "runtime_artifact",
  "theory_orientation",
] as const;

export const DOC_EQUATION_CONTEXT_LINK_REL_VALUES = [
  "opens_panel",
  "supports_doc_section",
  "opens_runtime_artifact",
  "orients_theory_graph",
] as const;

export type DocEquationContextActionKindV1 =
  (typeof DOC_EQUATION_CONTEXT_ACTION_KIND_VALUES)[number];

export type DocEquationContextScopeV1 =
  (typeof DOC_EQUATION_CONTEXT_SCOPE_VALUES)[number];

export type DocEquationContextLinkRelV1 =
  (typeof DOC_EQUATION_CONTEXT_LINK_REL_VALUES)[number];

export type DocEquationContextCalculatorPayloadRefV1 = {
  badgeId: string;
  payloadId: string;
};

export type DocEquationContextPathRefV1 = {
  root: "workspace";
  relativePath: string;
  displaySegments: string[];
  virtualUri: string;
};

export type DocEquationContextLinkV1 = {
  rel: DocEquationContextLinkRelV1;
  panelId?: string;
  docPath?: string;
  anchor?: string;
  artifactId?: string;
  artifactKind?: string;
};

export type DocEquationContextArtifactV1 = {
  contractVersion: typeof DOC_EQUATION_CONTEXT_VERSION;
  generatedAt: string;
  docPath: string;
  equationId: string;
  equationLabel: string;
  sectionAnchor?: string;
  uri?: string;
  pathRef?: DocEquationContextPathRefV1;
  anchor?: string;
  latex: string;
  actionId: string;
  actionKind: DocEquationContextActionKindV1;
  badgeIds: string[];
  preferredBadgeId?: string;
  calculatorPayloadRef?: DocEquationContextCalculatorPayloadRefV1;
  atlasLensId?: string;
  atlasGroupId?: string;
  openedPanels: string[];
  claimBoundaryNotes: string[];
  actionClaimBoundaryNote?: string;
  links?: DocEquationContextLinkV1[];
  commentaryHints: {
    summary: string;
    scope: DocEquationContextScopeV1;
    prohibitedClaims: string[];
    suggestedExplanationFocus: string[];
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateCalculatorPayloadRef(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.badgeId)) issues.push(`${path}.badgeId must be a non-empty string`);
  if (!isNonEmptyString(value.payloadId)) issues.push(`${path}.payloadId must be a non-empty string`);
}

function validatePathRef(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (value.root !== "workspace") issues.push(`${path}.root must be workspace`);
  if (!isNonEmptyString(value.relativePath)) issues.push(`${path}.relativePath must be a non-empty string`);
  if (!isStringArray(value.displaySegments) || value.displaySegments.length === 0) {
    issues.push(`${path}.displaySegments must be a non-empty string array`);
  }
  if (!isNonEmptyString(value.virtualUri)) issues.push(`${path}.virtualUri must be a non-empty string`);
}

function validateLink(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (!includes(DOC_EQUATION_CONTEXT_LINK_REL_VALUES, value.rel)) {
    issues.push(`${path}.rel must be one of ${DOC_EQUATION_CONTEXT_LINK_REL_VALUES.join(", ")}`);
  }
  if (value.panelId !== undefined && !isNonEmptyString(value.panelId)) {
    issues.push(`${path}.panelId must be a non-empty string when present`);
  }
  if (value.docPath !== undefined && !isNonEmptyString(value.docPath)) {
    issues.push(`${path}.docPath must be a non-empty string when present`);
  }
  if (value.anchor !== undefined && !isNonEmptyString(value.anchor)) {
    issues.push(`${path}.anchor must be a non-empty string when present`);
  }
  if (value.artifactId !== undefined && !isNonEmptyString(value.artifactId)) {
    issues.push(`${path}.artifactId must be a non-empty string when present`);
  }
  if (value.artifactKind !== undefined && !isNonEmptyString(value.artifactKind)) {
    issues.push(`${path}.artifactKind must be a non-empty string when present`);
  }
}

function validateCommentaryHints(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.summary)) issues.push(`${path}.summary must be a non-empty string`);
  if (!includes(DOC_EQUATION_CONTEXT_SCOPE_VALUES, value.scope)) {
    issues.push(`${path}.scope must be one of ${DOC_EQUATION_CONTEXT_SCOPE_VALUES.join(", ")}`);
  }
  if (!isStringArray(value.prohibitedClaims) || value.prohibitedClaims.length === 0) {
    issues.push(`${path}.prohibitedClaims must be a non-empty string array`);
  }
  if (!isStringArray(value.suggestedExplanationFocus) || value.suggestedExplanationFocus.length === 0) {
    issues.push(`${path}.suggestedExplanationFocus must be a non-empty string array`);
  }
}

export function validateDocEquationContextArtifactV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["artifact must be an object"];

  if (value.contractVersion !== DOC_EQUATION_CONTEXT_VERSION) {
    issues.push(`contractVersion must be ${DOC_EQUATION_CONTEXT_VERSION}`);
  }
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.docPath)) issues.push("docPath must be a non-empty string");
  if (!isNonEmptyString(value.equationId)) issues.push("equationId must be a non-empty string");
  if (!isNonEmptyString(value.equationLabel)) issues.push("equationLabel must be a non-empty string");
  if (value.sectionAnchor !== undefined && !isNonEmptyString(value.sectionAnchor)) {
    issues.push("sectionAnchor must be a non-empty string when present");
  }
  if (value.uri !== undefined && !isNonEmptyString(value.uri)) {
    issues.push("uri must be a non-empty string when present");
  }
  if (value.pathRef !== undefined) {
    validatePathRef("pathRef", value.pathRef, issues);
  }
  if (value.anchor !== undefined && !isNonEmptyString(value.anchor)) {
    issues.push("anchor must be a non-empty string when present");
  }
  if (!isNonEmptyString(value.latex)) issues.push("latex must be a non-empty string");
  if (!isNonEmptyString(value.actionId)) issues.push("actionId must be a non-empty string");
  if (!includes(DOC_EQUATION_CONTEXT_ACTION_KIND_VALUES, value.actionKind)) {
    issues.push(`actionKind must be one of ${DOC_EQUATION_CONTEXT_ACTION_KIND_VALUES.join(", ")}`);
  }
  if (!isStringArray(value.badgeIds)) issues.push("badgeIds must be a string array");
  if (value.preferredBadgeId !== undefined && !isNonEmptyString(value.preferredBadgeId)) {
    issues.push("preferredBadgeId must be a non-empty string when present");
  }
  if (value.calculatorPayloadRef !== undefined) {
    validateCalculatorPayloadRef("calculatorPayloadRef", value.calculatorPayloadRef, issues);
  }
  if (value.atlasLensId !== undefined && !isNonEmptyString(value.atlasLensId)) {
    issues.push("atlasLensId must be a non-empty string when present");
  }
  if (value.atlasGroupId !== undefined && !isNonEmptyString(value.atlasGroupId)) {
    issues.push("atlasGroupId must be a non-empty string when present");
  }
  if (!isStringArray(value.openedPanels)) issues.push("openedPanels must be a string array");
  if (!isStringArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be a string array");
  if (value.actionClaimBoundaryNote !== undefined && !isNonEmptyString(value.actionClaimBoundaryNote)) {
    issues.push("actionClaimBoundaryNote must be a non-empty string when present");
  }
  if (value.links !== undefined) {
    if (!Array.isArray(value.links)) {
      issues.push("links must be an array when present");
    } else {
      value.links.forEach((link, index) => validateLink(`links[${index}]`, link, issues));
    }
  }
  validateCommentaryHints("commentaryHints", value.commentaryHints, issues);

  return issues;
}

export function isDocEquationContextArtifactV1(value: unknown): value is DocEquationContextArtifactV1 {
  return validateDocEquationContextArtifactV1(value).length === 0;
}
