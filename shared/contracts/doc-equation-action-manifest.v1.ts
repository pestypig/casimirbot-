export const DOC_EQUATION_ACTION_MANIFEST_VERSION = "doc_equation_actions/v1" as const;

export const DOC_EQUATION_ACTION_KIND_VALUES = [
  "calculator_ingest",
  "artifact_backed_theory_run",
] as const;

export const DOC_EQUATION_ACTION_COMPOUND_RUN_MODE_VALUES = [
  "selected_badges",
  "dependency_path",
  "locator_matches",
] as const;

export type DocEquationActionKindV1 = (typeof DOC_EQUATION_ACTION_KIND_VALUES)[number];
export type DocEquationActionCompoundRunModeV1 =
  (typeof DOC_EQUATION_ACTION_COMPOUND_RUN_MODE_VALUES)[number];

export type DocEquationCalculatorPayloadRefV1 = {
  badgeId: string;
  payloadId: string;
};

export type DocEquationActionV1 = {
  actionId: string;
  kind: DocEquationActionKindV1;
  label: string;
  badgeIds?: string[];
  preferredBadgeId?: string;
  compoundRunMode?: DocEquationActionCompoundRunModeV1;
  atlasLensId?: string;
  atlasGroupId?: string;
  calculatorPayloadRef?: DocEquationCalculatorPayloadRefV1;
  openPanels?: string[];
  alsoIngestLatex?: boolean;
  claimBoundaryNote?: string;
};

export type DocEquationActionEntryV1 = {
  equationId: string;
  label: string;
  sectionAnchor?: string;
  latex: string;
  aliases?: string[];
  actions: DocEquationActionV1[];
  claimBoundaryNotes: string[];
};

export type DocEquationActionManifestV1 = {
  contractVersion: typeof DOC_EQUATION_ACTION_MANIFEST_VERSION;
  docPath: string;
  generatedAt: string;
  entries: DocEquationActionEntryV1[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateAction(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.actionId)) issues.push(`${path}.actionId must be a non-empty string`);
  if (!includes(DOC_EQUATION_ACTION_KIND_VALUES, value.kind)) {
    issues.push(`${path}.kind must be one of ${DOC_EQUATION_ACTION_KIND_VALUES.join(", ")}`);
  }
  if (!isNonEmptyString(value.label)) issues.push(`${path}.label must be a non-empty string`);
  if (value.badgeIds !== undefined && !isStringArray(value.badgeIds)) {
    issues.push(`${path}.badgeIds must be a string array`);
  }
  if (value.preferredBadgeId !== undefined && !isNonEmptyString(value.preferredBadgeId)) {
    issues.push(`${path}.preferredBadgeId must be a non-empty string when present`);
  }
  if (
    value.compoundRunMode !== undefined &&
    !includes(DOC_EQUATION_ACTION_COMPOUND_RUN_MODE_VALUES, value.compoundRunMode)
  ) {
    issues.push(`${path}.compoundRunMode must be a supported compound-run mode`);
  }
  if (value.atlasLensId !== undefined && !isNonEmptyString(value.atlasLensId)) {
    issues.push(`${path}.atlasLensId must be a non-empty string when present`);
  }
  if (value.atlasGroupId !== undefined && !isNonEmptyString(value.atlasGroupId)) {
    issues.push(`${path}.atlasGroupId must be a non-empty string when present`);
  }
  if (value.calculatorPayloadRef !== undefined) {
    if (!isRecord(value.calculatorPayloadRef)) {
      issues.push(`${path}.calculatorPayloadRef must be an object when present`);
    } else {
      if (!isNonEmptyString(value.calculatorPayloadRef.badgeId)) {
        issues.push(`${path}.calculatorPayloadRef.badgeId must be a non-empty string`);
      }
      if (!isNonEmptyString(value.calculatorPayloadRef.payloadId)) {
        issues.push(`${path}.calculatorPayloadRef.payloadId must be a non-empty string`);
      }
    }
  }
  if (value.openPanels !== undefined && !isStringArray(value.openPanels)) {
    issues.push(`${path}.openPanels must be a string array`);
  }
  if (value.alsoIngestLatex !== undefined && typeof value.alsoIngestLatex !== "boolean") {
    issues.push(`${path}.alsoIngestLatex must be boolean when present`);
  }
  if (value.claimBoundaryNote !== undefined && !isNonEmptyString(value.claimBoundaryNote)) {
    issues.push(`${path}.claimBoundaryNote must be a non-empty string when present`);
  }
}

function validateEntry(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.equationId)) issues.push(`${path}.equationId must be a non-empty string`);
  if (!isNonEmptyString(value.label)) issues.push(`${path}.label must be a non-empty string`);
  if (value.sectionAnchor !== undefined && !isNonEmptyString(value.sectionAnchor)) {
    issues.push(`${path}.sectionAnchor must be a non-empty string when present`);
  }
  if (!isNonEmptyString(value.latex)) issues.push(`${path}.latex must be a non-empty string`);
  if (value.aliases !== undefined && !isStringArray(value.aliases)) {
    issues.push(`${path}.aliases must be a string array`);
  }
  if (!Array.isArray(value.actions) || value.actions.length === 0) {
    issues.push(`${path}.actions must be a non-empty array`);
  } else {
    value.actions.forEach((action, index) => validateAction(`${path}.actions[${index}]`, action, issues));
  }
  if (!isStringArray(value.claimBoundaryNotes)) {
    issues.push(`${path}.claimBoundaryNotes must be a string array`);
  }
}

export function validateDocEquationActionManifestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }
  if (value.contractVersion !== DOC_EQUATION_ACTION_MANIFEST_VERSION) {
    issues.push(`contractVersion must be ${DOC_EQUATION_ACTION_MANIFEST_VERSION}`);
  }
  if (!isNonEmptyString(value.docPath)) issues.push("docPath must be a non-empty string");
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!Array.isArray(value.entries)) {
    issues.push("entries must be an array");
  } else {
    value.entries.forEach((entry, index) => validateEntry(`entries[${index}]`, entry, issues));
  }
  return issues;
}

export function isDocEquationActionManifestV1(value: unknown): value is DocEquationActionManifestV1 {
  return validateDocEquationActionManifestV1(value).length === 0;
}
