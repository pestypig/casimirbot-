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

const THEORY_DERIVATION_ASSIGNMENT_KEYS = [
  "operation",
  "target",
  "target_observable",
  "scale_min_log10_m",
  "scale_max_log10_m",
  "coordinate_frame",
  "initial_boundary_conditions",
  "formal_system",
  "requested_precision",
  "evidence_maturity_ceiling",
] as const;

const trimExplicitAssignmentValue = (value: string): string => {
  const trimmed = value
    .replace(/^[\s,;]+/, "")
    .replace(/\s+(?:and\s+)?(?:report|return|include|show)\b[\s\S]*$/i, "")
    .replace(/[\s,;.]+$/, "")
    .trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const parseBoundaryConditions = (value: string): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    }
  } catch {
    // A compact comma/pipe list is also an explicit assignment form.
  }
  return value
    .replace(/^\[|\]$/g, "")
    .split(/[|,]/)
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
};

/**
 * Preserves machine-readable fields written inside an affirmative prompt-named
 * capability request. This is transport, not intent inference: only canonical
 * field names followed by `=` or `:` are accepted.
 */
export function extractExplicitTheoryDerivationRequestAssignments(
  text: string,
): Record<string, unknown> {
  const keyPattern = THEORY_DERIVATION_ASSIGNMENT_KEYS.join("|");
  const assignmentPattern = new RegExp(`\\b(${keyPattern})\\s*[:=]\\s*`, "gi");
  const matches = Array.from(text.matchAll(assignmentPattern));
  const assignments: Record<string, unknown> = {};

  matches.forEach((match, index) => {
    const key = match[1]?.toLowerCase();
    if (!key || !THEORY_DERIVATION_ASSIGNMENT_KEYS.includes(
      key as (typeof THEORY_DERIVATION_ASSIGNMENT_KEYS)[number],
    )) return;
    const start = (match.index ?? 0) + match[0].length;
    const nextStart = matches[index + 1]?.index ?? text.length;
    const bounded = text.slice(start, nextStart).split(/[;\n]/, 1)[0] ?? "";
    const value = trimExplicitAssignmentValue(bounded);
    if (!value) return;

    if (key === "scale_min_log10_m" || key === "scale_max_log10_m") {
      const number = Number(value);
      if (Number.isFinite(number)) assignments[key] = number;
      return;
    }
    if (key === "initial_boundary_conditions") {
      const conditions = parseBoundaryConditions(value);
      if (conditions.length > 0) assignments[key] = conditions;
      return;
    }
    assignments[key] = value;
  });

  return assignments;
}

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
