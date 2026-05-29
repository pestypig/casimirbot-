import {
  isScientificCalculatorStepTraceArtifactV1,
  type ScientificCalculatorStepTraceArtifactV1,
} from "./scientific-calculator-step-schema.v1";
import { isTheoryRuntimeMathTraceV1, type TheoryRuntimeMathTraceV1 } from "./theory-runtime-math-trace.v1";
import { isTheoryRuntimeReceiptV1, type TheoryRuntimeReceiptV1 } from "./theory-runtime-receipt.v1";

export const THEORY_COMPOUND_RUN_ARTIFACT_ID = "theory_compound_run" as const;
export const THEORY_COMPOUND_RUN_SCHEMA_VERSION = "theory_compound_run/v1" as const;

export const THEORY_COMPOUND_RUN_SOURCE_KIND_VALUES = [
  "theory_badge_graph",
  "helix_ask",
  "manual",
  "workstation_action",
] as const;

export const THEORY_COMPOUND_RUN_ROW_KIND_VALUES = [
  "scalar",
  "tensor",
  "runtime",
  "sweep",
  "evidence",
  "gate",
  "boundary",
  "reference",
] as const;

export const THEORY_COMPOUND_RUN_ROW_STATUS_VALUES = [
  "pending",
  "running",
  "solved",
  "computed",
  "skipped",
  "blocked",
  "failed",
] as const;

export const THEORY_COMPOUND_RUN_SOLVER_VALUES = [
  "scientific_calculator",
  "tensor_runtime",
  "backend_runtime",
  "sweep_runner",
  "artifact_resolver",
  "gate_evaluator",
  "none",
] as const;

export type TheoryCompoundRunSourceKind = (typeof THEORY_COMPOUND_RUN_SOURCE_KIND_VALUES)[number];
export type TheoryCompoundRunRowKind = (typeof THEORY_COMPOUND_RUN_ROW_KIND_VALUES)[number];
export type TheoryCompoundRunRowStatus = (typeof THEORY_COMPOUND_RUN_ROW_STATUS_VALUES)[number];
export type TheoryCompoundRunSolver = (typeof THEORY_COMPOUND_RUN_SOLVER_VALUES)[number];

export type TheoryCompoundRunEvidenceRefV1 = {
  kind: string;
  path: string;
  id?: string | null;
  note?: string | null;
};

export type TheoryCompoundRunRowV1 = {
  id: string;
  index: number;
  badgeId: string;
  badgeTitle: string;
  title: string;
  kind: TheoryCompoundRunRowKind;
  displayLatex: string | null;
  expression: string | null;
  status: TheoryCompoundRunRowStatus;
  solver: TheoryCompoundRunSolver;
  sourcePath: string;
  dependsOn: string[];
  calculatorArtifactV1?: ScientificCalculatorStepTraceArtifactV1 | null;
  runtimeMathTraceV1?: TheoryRuntimeMathTraceV1 | null;
  runtimeReceiptV1?: TheoryRuntimeReceiptV1 | null;
  evidenceRefs?: TheoryCompoundRunEvidenceRefV1[];
  claimBoundaryNotes: string[];
  warnings: string[];
};

export type TheoryCompoundRunV1 = {
  artifactId: typeof THEORY_COMPOUND_RUN_ARTIFACT_ID;
  schemaVersion: typeof THEORY_COMPOUND_RUN_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  graphId: string;
  targetBadgeIds: string[];
  source: {
    kind: TheoryCompoundRunSourceKind;
    label: string | null;
  };
  rows: TheoryCompoundRunRowV1[];
  summary: {
    rowCount: number;
    scalarCount: number;
    tensorCount: number;
    runtimeCount: number;
    sweepCount: number;
    evidenceCount: number;
    gateCount: number;
    boundaryCount: number;
    referenceCount: number;
    blockedCount: number;
    solvedCount: number;
    computedCount: number;
    failedCount: number;
    claimBoundaryNoteCount: number;
  };
};

type BuildTheoryCompoundRunV1Input = Omit<
  TheoryCompoundRunV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary"
> & {
  generatedAt?: string;
  summary?: Partial<TheoryCompoundRunV1["summary"]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function countKind(rows: TheoryCompoundRunRowV1[], kind: TheoryCompoundRunRowKind): number {
  return rows.filter((row) => row.kind === kind).length;
}

function buildSummary(rows: TheoryCompoundRunRowV1[]): TheoryCompoundRunV1["summary"] {
  return {
    rowCount: rows.length,
    scalarCount: countKind(rows, "scalar"),
    tensorCount: countKind(rows, "tensor"),
    runtimeCount: countKind(rows, "runtime"),
    sweepCount: countKind(rows, "sweep"),
    evidenceCount: countKind(rows, "evidence"),
    gateCount: countKind(rows, "gate"),
    boundaryCount: countKind(rows, "boundary"),
    referenceCount: countKind(rows, "reference"),
    blockedCount: rows.filter((row) => row.status === "blocked").length,
    solvedCount: rows.filter((row) => row.status === "solved").length,
    computedCount: rows.filter((row) => row.status === "computed").length,
    failedCount: rows.filter((row) => row.status === "failed").length,
    claimBoundaryNoteCount: rows.reduce((sum, row) => sum + row.claimBoundaryNotes.length, 0),
  };
}

export function buildTheoryCompoundRunV1(input: BuildTheoryCompoundRunV1Input): TheoryCompoundRunV1 {
  return {
    artifactId: THEORY_COMPOUND_RUN_ARTIFACT_ID,
    schemaVersion: THEORY_COMPOUND_RUN_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    runId: input.runId,
    graphId: input.graphId,
    targetBadgeIds: input.targetBadgeIds,
    source: input.source,
    rows: input.rows,
    summary: buildSummary(input.rows),
  };
}

function validateEvidenceRefs(prefix: string, value: unknown, issues: string[]): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  for (const [index, rawRef] of value.entries()) {
    const refPrefix = `${prefix}[${index}]`;
    if (!isRecord(rawRef)) {
      issues.push(`${refPrefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawRef.kind)) issues.push(`${refPrefix}.kind must be a non-empty string`);
    if (!isNonEmptyString(rawRef.path)) issues.push(`${refPrefix}.path must be a non-empty string`);
    if (rawRef.id !== undefined && !isNullableString(rawRef.id)) issues.push(`${refPrefix}.id must be a string or null`);
    if (rawRef.note !== undefined && !isNullableString(rawRef.note)) {
      issues.push(`${refPrefix}.note must be a string or null`);
    }
  }
}

function validateSummary(value: Record<string, unknown>, rows: TheoryCompoundRunRowV1[], issues: string[]): void {
  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
    return;
  }
  const expected = buildSummary(rows);
  for (const field of Object.keys(expected) as Array<keyof TheoryCompoundRunV1["summary"]>) {
    if (value.summary[field] !== expected[field]) issues.push(`summary.${field} must be ${expected[field]}`);
  }
}

export function validateTheoryCompoundRunV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["compound run must be an object"];

  if (value.artifactId !== THEORY_COMPOUND_RUN_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_COMPOUND_RUN_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_COMPOUND_RUN_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_COMPOUND_RUN_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "runId", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.targetBadgeIds)) issues.push("targetBadgeIds must be an array of strings");
  if (!isRecord(value.source)) {
    issues.push("source must be an object");
  } else {
    if (!includes(THEORY_COMPOUND_RUN_SOURCE_KIND_VALUES, value.source.kind)) issues.push("source.kind is invalid");
    if (!isNullableString(value.source.label)) issues.push("source.label must be a string or null");
  }

  if (!Array.isArray(value.rows)) issues.push("rows must be an array");
  const rows: TheoryCompoundRunRowV1[] = [];
  const rowIds = new Set<string>();
  for (const [index, rawRow] of (Array.isArray(value.rows) ? value.rows : []).entries()) {
    const prefix = `rows[${index}]`;
    if (!isRecord(rawRow)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawRow.id)) issues.push(`${prefix}.id must be a non-empty string`);
    else if (rowIds.has(rawRow.id)) issues.push(`duplicate row id: ${rawRow.id}`);
    else rowIds.add(rawRow.id);
    if (rawRow.index !== index + 1) issues.push(`${prefix}.index must be ${index + 1}`);
    for (const field of ["badgeId", "badgeTitle", "title", "sourcePath"] as const) {
      if (!isNonEmptyString(rawRow[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
    }
    if (!includes(THEORY_COMPOUND_RUN_ROW_KIND_VALUES, rawRow.kind)) issues.push(`${prefix}.kind is invalid`);
    if (!isNullableString(rawRow.displayLatex)) issues.push(`${prefix}.displayLatex must be a string or null`);
    if (!isNullableString(rawRow.expression)) issues.push(`${prefix}.expression must be a string or null`);
    if (!includes(THEORY_COMPOUND_RUN_ROW_STATUS_VALUES, rawRow.status)) issues.push(`${prefix}.status is invalid`);
    if (!includes(THEORY_COMPOUND_RUN_SOLVER_VALUES, rawRow.solver)) issues.push(`${prefix}.solver is invalid`);
    if (!isStringArray(rawRow.dependsOn)) issues.push(`${prefix}.dependsOn must be an array of strings`);
    if (
      rawRow.calculatorArtifactV1 !== undefined &&
      rawRow.calculatorArtifactV1 !== null &&
      !isScientificCalculatorStepTraceArtifactV1(rawRow.calculatorArtifactV1)
    ) {
      issues.push(`${prefix}.calculatorArtifactV1 is invalid`);
    }
    if (
      rawRow.runtimeMathTraceV1 !== undefined &&
      rawRow.runtimeMathTraceV1 !== null &&
      !isTheoryRuntimeMathTraceV1(rawRow.runtimeMathTraceV1)
    ) {
      issues.push(`${prefix}.runtimeMathTraceV1 is invalid`);
    }
    if (
      rawRow.runtimeReceiptV1 !== undefined &&
      rawRow.runtimeReceiptV1 !== null &&
      !isTheoryRuntimeReceiptV1(rawRow.runtimeReceiptV1)
    ) {
      issues.push(`${prefix}.runtimeReceiptV1 is invalid`);
    }
    validateEvidenceRefs(`${prefix}.evidenceRefs`, rawRow.evidenceRefs, issues);
    if (!isStringArray(rawRow.claimBoundaryNotes)) issues.push(`${prefix}.claimBoundaryNotes must be an array of strings`);
    if (!isStringArray(rawRow.warnings)) issues.push(`${prefix}.warnings must be an array of strings`);
    rows.push({
      ...(rawRow as TheoryCompoundRunRowV1),
      claimBoundaryNotes: isStringArray(rawRow.claimBoundaryNotes) ? rawRow.claimBoundaryNotes : [],
    });
  }

  validateSummary(value, rows, issues);
  return issues;
}

export function isTheoryCompoundRunV1(value: unknown): value is TheoryCompoundRunV1 {
  return validateTheoryCompoundRunV1(value).length === 0;
}
