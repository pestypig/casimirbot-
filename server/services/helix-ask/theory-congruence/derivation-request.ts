import type { TheoryMasterProblemRequestV1 } from "../../../../shared/contracts/theory-master-problem.v1";

const THEORY_DERIVATION_OPERATIONS = [
  "compare",
  "predict",
  "derive",
  "explain",
  "prove",
  "bound",
] as const satisfies readonly TheoryMasterProblemRequestV1["operation"][];

const THEORY_EVIDENCE_MATURITY_LEVELS = [
  "exploratory",
  "reduced_order",
  "diagnostic",
  "certified",
] as const satisfies readonly TheoryMasterProblemRequestV1["evidenceMaturityCeiling"][];

const stringArg = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const nullableStringArg = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

/**
 * Normalizes explicit tool arguments into the theory-congruence request contract.
 * It intentionally does not infer an operation from prompt text: lexical cues are
 * not sufficient authority to admit a derivation or proof operation.
 */
export function parseTheoryDerivationRequestArgs(
  args: Record<string, unknown>,
  fallbackTarget: string,
): TheoryMasterProblemRequestV1 | undefined {
  const operation = args.operation;
  if (!THEORY_DERIVATION_OPERATIONS.includes(
    operation as TheoryMasterProblemRequestV1["operation"],
  )) return undefined;

  const maturity = args.evidence_maturity_ceiling;
  const evidenceMaturityCeiling = THEORY_EVIDENCE_MATURITY_LEVELS.includes(
    maturity as TheoryMasterProblemRequestV1["evidenceMaturityCeiling"],
  )
    ? maturity as TheoryMasterProblemRequestV1["evidenceMaturityCeiling"]
    : "diagnostic";
  const scaleMin = typeof args.scale_min_log10_m === "number" && Number.isFinite(args.scale_min_log10_m)
    ? args.scale_min_log10_m
    : null;
  const scaleMax = typeof args.scale_max_log10_m === "number" && Number.isFinite(args.scale_max_log10_m)
    ? args.scale_max_log10_m
    : null;
  const initialBoundaryConditions = Array.isArray(args.initial_boundary_conditions)
    ? args.initial_boundary_conditions.filter((value): value is string => typeof value === "string")
    : [];

  return {
    operation: operation as TheoryMasterProblemRequestV1["operation"],
    target: stringArg(args.target, fallbackTarget),
    targetObservable: nullableStringArg(args.target_observable),
    scaleLog10M: scaleMin !== null || scaleMax !== null ? { min: scaleMin, max: scaleMax } : null,
    coordinateFrame: nullableStringArg(args.coordinate_frame),
    initialBoundaryConditions,
    formalSystem: nullableStringArg(args.formal_system),
    requestedPrecision: nullableStringArg(args.requested_precision),
    evidenceMaturityCeiling,
    normalizationStatus: "explicit",
  };
}

/** Capability-schema fragment consumed by the retiring route as a thin pointer. */
export const THEORY_DERIVATION_REQUEST_INPUT_PROPERTIES: Readonly<Record<string, unknown>> = Object.freeze({
  operation: {
    type: "string",
    enum: THEORY_DERIVATION_OPERATIONS,
    description: "Explicit normalized derivation operation; omitted requests remain provisional explanation plans.",
  },
  target: { type: "string", description: "Normalized derivation target." },
  target_observable: {
    type: "string",
    description: "Canonical observable or output symbol to compare, predict, derive, prove, or bound.",
  },
  scale_min_log10_m: { type: "number", description: "Optional lower log10(m) scale bound." },
  scale_max_log10_m: { type: "number", description: "Optional upper log10(m) scale bound." },
  coordinate_frame: { type: "string", description: "Declared coordinate or observer frame." },
  initial_boundary_conditions: {
    type: "array",
    items: { type: "string" },
    description: "Initial and boundary conditions required by the derivation.",
  },
  formal_system: { type: "string", description: "Named formal system for proof-status requests." },
  requested_precision: {
    type: "string",
    description: "Requested tolerance, bound, or comparison precision.",
  },
  evidence_maturity_ceiling: {
    type: "string",
    enum: THEORY_EVIDENCE_MATURITY_LEVELS,
  },
});
