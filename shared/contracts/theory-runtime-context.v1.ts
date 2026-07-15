import type { TheoryRuntimeReceiptV1 } from "./theory-runtime-receipt.v1";

export const THEORY_RUNTIME_CONTEXT_SCHEMA = "helix.theory_run_context_observation.v1" as const;
export const THEORY_RUNTIME_CONTEXT_MAX_SCALARS = 40;
export const THEORY_RUNTIME_CONTEXT_MAX_GATES = 40;
export const THEORY_RUNTIME_CONTEXT_MAX_WARNINGS = 12;
export const THEORY_RUNTIME_CONTEXT_MAX_ARTIFACTS = 24;
export const THEORY_RUNTIME_CONTEXT_MAX_TEXT_CHARS = 1_000;

export type TheoryRuntimeContextObservationV1 = {
  schema: typeof THEORY_RUNTIME_CONTEXT_SCHEMA;
  contextId: string;
  capturedAt: string;
  requestId: string;
  runId: string | null;
  rowId: string | null;
  receiptId: string;
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  status: TheoryRuntimeReceiptV1["status"];
  command: string | null;
  outputs: TheoryRuntimeReceiptV1["outputs"];
  provenance: TheoryRuntimeReceiptV1["provenance"];
  claimBoundary: TheoryRuntimeReceiptV1["claimBoundary"];
  outputRole: "evidence_for_synthesis";
  terminalEligible: false;
  postToolModelStepRequired: true;
  assistantAnswer: false;
  rawContentIncluded: false;
};

const clipText = (value: string): string => value.slice(0, THEORY_RUNTIME_CONTEXT_MAX_TEXT_CHARS);

const clipScalar = (value: number | string | boolean | null): number | string | boolean | null =>
  typeof value === "string" ? clipText(value) : value;

const limitRecord = <T, U>(
  record: Record<string, T>,
  limit: number,
  mapValue: (value: T) => U,
): Record<string, U> => Object.fromEntries(
  Object.entries(record).slice(0, limit).map(([key, value]) => [clipText(key), mapValue(value)]),
);

const clipTextArray = (values: string[], limit: number): string[] =>
  values.slice(0, limit).map(clipText);

export function buildTheoryRuntimeContextObservationV1(input: {
  requestId: string;
  receipt: TheoryRuntimeReceiptV1;
  runId?: string | null;
  rowId?: string | null;
  capturedAt?: string;
}): TheoryRuntimeContextObservationV1 {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  return {
    schema: THEORY_RUNTIME_CONTEXT_SCHEMA,
    contextId: `theory-runtime-context:${input.requestId}:${input.receipt.receiptId}`,
    capturedAt,
    requestId: input.requestId,
    runId: input.runId ?? null,
    rowId: input.rowId ?? null,
    receiptId: input.receipt.receiptId,
    runtimeId: input.receipt.runtimeId,
    graphId: input.receipt.graphId,
    badgeIds: clipTextArray(input.receipt.badgeIds, 40),
    status: input.receipt.status,
    command: input.receipt.command === null ? null : clipText(input.receipt.command),
    outputs: {
      artifacts: clipTextArray(input.receipt.outputs.artifacts, THEORY_RUNTIME_CONTEXT_MAX_ARTIFACTS),
      scalars: limitRecord(input.receipt.outputs.scalars, THEORY_RUNTIME_CONTEXT_MAX_SCALARS, clipScalar),
      units: limitRecord(input.receipt.outputs.units, THEORY_RUNTIME_CONTEXT_MAX_SCALARS, (value) => value === null ? null : clipText(value)),
      gates: limitRecord(input.receipt.outputs.gates, THEORY_RUNTIME_CONTEXT_MAX_GATES, (value) => value),
      missingSignals: clipTextArray(input.receipt.outputs.missingSignals, THEORY_RUNTIME_CONTEXT_MAX_WARNINGS),
      warnings: clipTextArray(input.receipt.outputs.warnings, THEORY_RUNTIME_CONTEXT_MAX_WARNINGS),
    },
    provenance: { ...input.receipt.provenance },
    claimBoundary: {
      ...input.receipt.claimBoundary,
      promotionBlockedBy: clipTextArray(input.receipt.claimBoundary.promotionBlockedBy, THEORY_RUNTIME_CONTEXT_MAX_WARNINGS),
    },
    outputRole: "evidence_for_synthesis",
    terminalEligible: false,
    postToolModelStepRequired: true,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
}

export function isTheoryRuntimeContextObservationV1(value: unknown): value is TheoryRuntimeContextObservationV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.schema === THEORY_RUNTIME_CONTEXT_SCHEMA &&
    typeof record.contextId === "string" && Boolean(record.contextId.trim()) &&
    typeof record.requestId === "string" && Boolean(record.requestId.trim()) &&
    typeof record.receiptId === "string" && Boolean(record.receiptId.trim()) &&
    typeof record.runtimeId === "string" && Boolean(record.runtimeId.trim()) &&
    record.outputRole === "evidence_for_synthesis" &&
    record.terminalEligible === false &&
    record.postToolModelStepRequired === true &&
    record.assistantAnswer === false &&
    record.rawContentIncluded === false;
}
