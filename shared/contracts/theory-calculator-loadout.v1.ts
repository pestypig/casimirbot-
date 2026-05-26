import type { HelixCalculatorSetupContext } from "../helix-calculator-setup-context";
import type { ScientificCalculatorStepTraceArtifactV1 } from "./scientific-calculator-step-schema.v1";

export const THEORY_CALCULATOR_LOADOUT_ARTIFACT_ID = "theory_calculator_loadout" as const;
export const THEORY_CALCULATOR_LOADOUT_SCHEMA_VERSION = "theory_calculator_loadout/v1" as const;

export const THEORY_CALCULATOR_LOADOUT_ITEM_KINDS = [
  "calculator_payload",
  "runtime_context",
  "claim_boundary",
  "reference_context",
] as const;

export const THEORY_CALCULATOR_LOADOUT_SOURCES = [
  "achievement_map",
  "helix_ask",
  "manual",
  "path_playback",
  "workstation_action",
] as const;

export type TheoryCalculatorLoadoutItemKind = (typeof THEORY_CALCULATOR_LOADOUT_ITEM_KINDS)[number];
export type TheoryCalculatorLoadoutSource = (typeof THEORY_CALCULATOR_LOADOUT_SOURCES)[number];

export type TheoryCalculatorObjectContextV1 = {
  kind: "starsim_star" | "generic_physics_object" | "manual_symbol_bindings";
  objectId: string | null;
  label: string | null;
  observables: Record<string, string | number | boolean | null>;
  variableBindings: Record<string, string | number>;
  units: Record<string, string>;
  source: "manual" | "helix_ask" | "live_source" | "simulation_runtime" | "calculator_result";
  assumptions: string[];
  claimBoundaryNotes: string[];
};

export type TheoryCalculatorLoadoutItemV1 = {
  id: string;
  index: number;
  kind: TheoryCalculatorLoadoutItemKind;
  badgeId: string;
  badgeTitle: string;
  payloadId: string | null;
  sourcePath: string;
  expression: string | null;
  displayLatex: string | null;
  solveExpression: string | null;
  usedBindings: Record<string, string | number>;
  bindingWarnings: string[];
  setupContext: HelixCalculatorSetupContext | null;
  resultText: string | null;
  resultLatex: string | null;
  resultKind: string | null;
  confidence: number | null;
  fallbackReason: string | null;
  calculatorArtifactV1: ScientificCalculatorStepTraceArtifactV1 | null;
  warnings: string[];
};

export type TheoryCalculatorLoadoutV1 = {
  artifactId: typeof THEORY_CALCULATOR_LOADOUT_ARTIFACT_ID;
  schemaVersion: typeof THEORY_CALCULATOR_LOADOUT_SCHEMA_VERSION;
  generatedAt: string;
  loadoutId: string;
  graphId: string;
  source: TheoryCalculatorLoadoutSource;
  mode: "selected_badges" | "dependency_path";
  targetBadgeIds: string[];
  objectContext: TheoryCalculatorObjectContextV1 | null;
  items: TheoryCalculatorLoadoutItemV1[];
  summary: {
    badgeCount: number;
    payloadCount: number;
    scalarCount: number;
    contextCount: number;
    solvedCount: number;
    failedCount: number;
    skippedCount: number;
    bindingWarningCount: number;
    claimBoundaryNoteCount: number;
  };
  claimBoundaryNotes: string[];
};

type BuildTheoryCalculatorLoadoutInput = Omit<
  TheoryCalculatorLoadoutV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary"
> & {
  generatedAt?: string;
  summary?: Partial<TheoryCalculatorLoadoutV1["summary"]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function countItems(items: TheoryCalculatorLoadoutItemV1[]) {
  return {
    payloadCount: items.filter((item) => item.payloadId).length,
    scalarCount: items.filter((item) => item.kind === "calculator_payload").length,
    contextCount: items.filter((item) => item.kind !== "calculator_payload").length,
    solvedCount: items.filter((item) => item.calculatorArtifactV1).length,
    failedCount: items.filter((item) => item.warnings.some((warning) => /failed|error/i.test(warning))).length,
    skippedCount: items.filter((item) => item.kind !== "calculator_payload").length,
    bindingWarningCount: items.reduce((sum, item) => sum + item.bindingWarnings.length, 0),
  };
}

export function buildTheoryCalculatorLoadoutV1(
  input: BuildTheoryCalculatorLoadoutInput,
): TheoryCalculatorLoadoutV1 {
  const itemCounts = countItems(input.items);
  const claimBoundaryNotes = Array.from(new Set(input.claimBoundaryNotes));
  const summary = {
    badgeCount: new Set(input.items.map((item) => item.badgeId)).size,
    payloadCount: itemCounts.payloadCount,
    scalarCount: itemCounts.scalarCount,
    contextCount: itemCounts.contextCount,
    solvedCount: itemCounts.solvedCount,
    failedCount: itemCounts.failedCount,
    skippedCount: itemCounts.skippedCount,
    bindingWarningCount: itemCounts.bindingWarningCount,
    claimBoundaryNoteCount: claimBoundaryNotes.length,
    ...input.summary,
  };

  return {
    artifactId: THEORY_CALCULATOR_LOADOUT_ARTIFACT_ID,
    schemaVersion: THEORY_CALCULATOR_LOADOUT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    loadoutId: input.loadoutId,
    graphId: input.graphId,
    source: input.source,
    mode: input.mode,
    targetBadgeIds: input.targetBadgeIds,
    objectContext: input.objectContext,
    items: input.items,
    summary,
    claimBoundaryNotes,
  };
}

export function validateTheoryCalculatorLoadoutV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["loadout must be an object"];
  if (value.artifactId !== THEORY_CALCULATOR_LOADOUT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_CALCULATOR_LOADOUT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_CALCULATOR_LOADOUT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_CALCULATOR_LOADOUT_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "loadoutId", "graphId", "source", "mode"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.targetBadgeIds)) issues.push("targetBadgeIds must be an array of strings");
  if (!Array.isArray(value.items)) issues.push("items must be an array");
  const items = Array.isArray(value.items) ? value.items : [];
  const itemIds = new Set<string>();
  for (const [index, rawItem] of items.entries()) {
    const prefix = `items[${index}]`;
    if (!isRecord(rawItem)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawItem.id)) issues.push(`${prefix}.id must be a non-empty string`);
    else if (itemIds.has(rawItem.id)) issues.push(`duplicate item id: ${rawItem.id}`);
    else itemIds.add(rawItem.id);
    if (rawItem.index !== index + 1) issues.push(`${prefix}.index must be ${index + 1}`);
    if (!THEORY_CALCULATOR_LOADOUT_ITEM_KINDS.includes(rawItem.kind as TheoryCalculatorLoadoutItemKind)) {
      issues.push(`${prefix}.kind is invalid`);
    }
    if (!isNonEmptyString(rawItem.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
    if (!isNonEmptyString(rawItem.badgeTitle)) issues.push(`${prefix}.badgeTitle must be a non-empty string`);
    if (!isNonEmptyString(rawItem.sourcePath)) issues.push(`${prefix}.sourcePath must be a non-empty string`);
    if (rawItem.kind === "calculator_payload") {
      if (!isNonEmptyString(rawItem.payloadId)) issues.push(`${prefix}.payloadId must be set for calculator rows`);
      if (!isNonEmptyString(rawItem.expression)) issues.push(`${prefix}.expression must be set for calculator rows`);
      if (!isNonEmptyString(rawItem.solveExpression)) {
        issues.push(`${prefix}.solveExpression must be set for calculator rows`);
      }
    }
    if (!isRecord(rawItem.usedBindings)) issues.push(`${prefix}.usedBindings must be an object`);
    if (!Array.isArray(rawItem.bindingWarnings)) issues.push(`${prefix}.bindingWarnings must be an array`);
    if (!Array.isArray(rawItem.warnings)) issues.push(`${prefix}.warnings must be an array`);
  }
  if (!isRecord(value.summary)) issues.push("summary must be an object");
  if (!Array.isArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be an array");
  return issues;
}

export function isTheoryCalculatorLoadoutV1(value: unknown): value is TheoryCalculatorLoadoutV1 {
  return validateTheoryCalculatorLoadoutV1(value).length === 0;
}
