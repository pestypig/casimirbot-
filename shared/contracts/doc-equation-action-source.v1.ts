import {
  DOC_EQUATION_ACTION_KIND_VALUES,
  DOC_EQUATION_ACTION_COMPOUND_RUN_MODE_VALUES,
  type DocEquationActionV1,
} from "./doc-equation-action-manifest.v1";

export const DOC_EQUATION_ACTION_SOURCE_VERSION = "doc_equation_action_source/v1" as const;

export type DocEquationActionSourceEntryV1 = {
  equationId: string;
  label: string;
  aliases?: string[];
  mathBlockCount?: number;
  actions: DocEquationActionV1[];
  claimBoundaryNotes: string[];
};

export type DocEquationActionSourceV1 = {
  contractVersion: typeof DOC_EQUATION_ACTION_SOURCE_VERSION;
  docPath: string;
  generatedAt: string;
  entries: DocEquationActionSourceEntryV1[];
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
  if (value.aliases !== undefined && !isStringArray(value.aliases)) {
    issues.push(`${path}.aliases must be a string array`);
  }
  const mathBlockCount = value.mathBlockCount;
  if (
    mathBlockCount !== undefined &&
    (typeof mathBlockCount !== "number" || !Number.isInteger(mathBlockCount) || mathBlockCount < 1)
  ) {
    issues.push(`${path}.mathBlockCount must be a positive integer when present`);
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

export function validateDocEquationActionSourceV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["source must be an object"];

  if (value.contractVersion !== DOC_EQUATION_ACTION_SOURCE_VERSION) {
    issues.push(`contractVersion must be ${DOC_EQUATION_ACTION_SOURCE_VERSION}`);
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

export function isDocEquationActionSourceV1(value: unknown): value is DocEquationActionSourceV1 {
  return validateDocEquationActionSourceV1(value).length === 0;
}
