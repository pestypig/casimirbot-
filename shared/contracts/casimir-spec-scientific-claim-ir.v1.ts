import {
  THEORY_BADGE_OBSERVABLE_BRIDGE_KINDS,
  THEORY_BADGE_OBSERVABLE_ERROR_KINDS,
  THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES,
  type TheoryBadgeObservableBridgeKindV1,
  type TheoryBadgeObservableErrorKindV1,
  type TheoryBadgeObservableMathematicalTypeV1,
} from "./theory-badge-graph.v1";

export const CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_ARTIFACT_ID =
  "casimir_spec_scientific_claim_ir" as const;
export const CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION =
  "casimir_spec_scientific_claim_ir/v1" as const;
export const CASIMIR_SPEC_LANGUAGE_VERSION = "casimir_spec/v1" as const;

export const CASIMIR_SPEC_PROVENANCE_KINDS = [
  "prompt",
  "paper",
  "dataset",
  "repo_artifact",
  "graph_badge",
  "catalog",
  "observation_receipt",
  "formal_certificate",
] as const;

export const CASIMIR_SPEC_DEFINITION_KINDS = [
  "mathematical",
  "operational",
  "model",
  "unit",
  "frame",
  "boundary_condition",
] as const;

export const CASIMIR_SPEC_ASSUMPTION_KINDS = [
  "typed_hypothesis",
  "model_assumption",
  "empirical_placeholder",
  "initial_condition",
  "boundary_condition",
] as const;

export const CASIMIR_SPEC_SYMBOL_ROLES = [
  "physical_quantity",
  "mathematical_object",
  "parameter",
  "coordinate",
  "proposition",
] as const;

export const CASIMIR_SPEC_COMPUTATIONAL_STATUSES = [
  "executable",
  "noncomputable",
  "partial",
  "reference_only",
  "unassessed",
] as const;

export const CASIMIR_SPEC_SCIENTIFIC_STATUSES = [
  "model_assumption",
  "formal_model_consequence",
  "diagnostic",
  "measurement_definition",
  "measured",
  "calibrated",
  "empirically_unvalidated",
  "not_applicable",
] as const;

export const CASIMIR_SPEC_COVERAGE_STATUSES = [
  "represented",
  "out_of_graph",
  "unknown",
  "bridge_missing",
  "independence_not_established",
] as const;

export const CASIMIR_SPEC_BLOCKER_KINDS = [
  "missing_definition",
  "missing_evidence",
  "missing_observable",
  "missing_bridge",
  "out_of_graph",
  "unresolved_unit",
  "unresolved_frame",
  "formal_environment_unpinned",
  "formal_proof_not_run",
  "independence_not_established",
] as const;

export const CASIMIR_SPEC_EXCLUDED_CLAIM_KINDS = [
  "theory_completeness",
  "physical_truth",
  "physical_mechanism",
  "empirical_validation",
  "numerical_convergence",
  "implementation_correctness",
  "floating_point_refinement",
  "independence",
  "generalization_beyond_domain",
  "custom",
] as const;

export const CASIMIR_SPEC_REQUIRED_EXCLUDED_CLAIM_KINDS = [
  "theory_completeness",
  "physical_truth",
  "empirical_validation",
  "implementation_correctness",
] as const;

export const CASIMIR_SPEC_MATURITY_LEVELS = [
  "exploratory",
  "reduced_order",
  "diagnostic",
  "certified",
] as const;

export const CASIMIR_SPEC_CORE_OPERATOR_IDS = [
  "casimir.core::add",
  "casimir.core::and",
  "casimir.core::declares",
  "casimir.core::eq",
  "casimir.core::field",
  "casimir.core::frame_definition",
  "casimir.core::ge",
  "casimir.core::implies",
  "casimir.core::is_constant",
  "casimir.core::mul",
  "casimir.core::neg",
  "casimir.core::partial_t",
  "casimir.core::partial_x",
  "casimir.core::partial_xx",
] as const;

export type CasimirSpecProvenanceKindV1 =
  (typeof CASIMIR_SPEC_PROVENANCE_KINDS)[number];
export type CasimirSpecDefinitionKindV1 =
  (typeof CASIMIR_SPEC_DEFINITION_KINDS)[number];
export type CasimirSpecAssumptionKindV1 =
  (typeof CASIMIR_SPEC_ASSUMPTION_KINDS)[number];
export type CasimirSpecSymbolRoleV1 =
  (typeof CASIMIR_SPEC_SYMBOL_ROLES)[number];
export type CasimirSpecComputationalStatusV1 =
  (typeof CASIMIR_SPEC_COMPUTATIONAL_STATUSES)[number];
export type CasimirSpecScientificStatusV1 =
  (typeof CASIMIR_SPEC_SCIENTIFIC_STATUSES)[number];
export type CasimirSpecCoverageStatusV1 =
  (typeof CASIMIR_SPEC_COVERAGE_STATUSES)[number];
export type CasimirSpecBlockerKindV1 =
  (typeof CASIMIR_SPEC_BLOCKER_KINDS)[number];
export type CasimirSpecExcludedClaimKindV1 =
  (typeof CASIMIR_SPEC_EXCLUDED_CLAIM_KINDS)[number];
export type CasimirSpecMaturityLevelV1 =
  (typeof CASIMIR_SPEC_MATURITY_LEVELS)[number];

export type CasimirSpecDimensionVectorV1 = {
  mass: string;
  length: string;
  time: string;
  current: string;
  temperature: string;
  amount: string;
  luminousIntensity: string;
};

export type CasimirSpecUnitBindingV1 =
  | {
      status: "specified";
      unit: string;
      dimensions: CasimirSpecDimensionVectorV1;
    }
  | {
      status: "dimensionless";
      unit: "1";
      dimensions: CasimirSpecDimensionVectorV1;
    }
  | {
      status: "not_applicable" | "unresolved";
      unit: null;
      dimensions: null;
    };

export type CasimirSpecFrameBindingV1 =
  | { status: "bound"; frameDefinitionId: string }
  | {
      status: "invariant" | "not_applicable" | "unresolved";
      frameDefinitionId: null;
    };

export type CasimirSpecValidityDomainV1 = {
  scaleLog10M: { min: number | null; max: number | null } | null;
  frameDefinitionIds: string[];
  conditions: string[];
};

export type CasimirSpecExpressionV1 =
  | { kind: "symbol_ref"; symbolId: string }
  | { kind: "definition_ref"; definitionId: string }
  | { kind: "assumption_ref"; assumptionId: string }
  | { kind: "axiom_ref"; axiomId: string }
  | { kind: "rational_literal"; numerator: string; denominator: string }
  | {
      kind: "apply";
      operatorId: string;
      arguments: CasimirSpecExpressionV1[];
    }
  | {
      kind: "binder";
      binder: "forall" | "exists" | "lambda";
      boundSymbolIds: string[];
      body: CasimirSpecExpressionV1;
    };

export type CasimirSpecSymbolIdentityV1 =
  | { kind: "local"; semanticId: string }
  | {
      kind: "catalog";
      semanticId: string;
      catalogId: string;
      entryId: string;
      entrySemanticSha256: string;
    }
  | {
      kind: "registered";
      semanticId: string;
      bindingId: string;
      bindingSha256: string;
      provenanceIds: string[];
    };

export type CasimirSpecProvenanceV1 = {
  provenanceId: string;
  kind: CasimirSpecProvenanceKindV1;
  locator: string;
  contentSha256: string | null;
  fragment: string | null;
  citation: string | null;
};

export type CasimirSpecCatalogBindingV1 = {
  catalogId: string;
  version: string;
  semanticSha256: string;
};

export type CasimirSpecFoundationV1 = {
  foundationId: string;
  formalSystem: string;
  formalSystemVersion: string | null;
  logicProfileId: string;
  profileSemanticSha256: string | null;
  environmentLockProvenanceId: string | null;
  provenanceIds: string[];
};

export type CasimirSpecSymbolV1 = {
  symbolId: string;
  localName: string;
  displayName: string;
  identity: CasimirSpecSymbolIdentityV1;
  role: CasimirSpecSymbolRoleV1;
  typeExpression: string;
  mathematicalType: TheoryBadgeObservableMathematicalTypeV1;
  unitBinding: CasimirSpecUnitBindingV1;
  frameBinding: CasimirSpecFrameBindingV1;
  definitionId: string;
  provenanceIds: string[];
};

export type CasimirSpecDefinitionV1 = {
  definitionId: string;
  kind: CasimirSpecDefinitionKindV1;
  name: string;
  display: string;
  expression: CasimirSpecExpressionV1;
  expressionSha256: string;
  definesSymbolIds: string[];
  dependencyDefinitionIds: string[];
  assumptionIds: string[];
  validityDomain: CasimirSpecValidityDomainV1;
  provenanceIds: string[];
};

export type CasimirSpecAssumptionV1 = {
  assumptionId: string;
  kind: CasimirSpecAssumptionKindV1;
  displayStatement: string;
  proposition: CasimirSpecExpressionV1;
  propositionSha256: string;
  provenanceIds: string[];
};

export type CasimirSpecAxiomV1 = {
  axiomId: string;
  foundationId: string;
  displayStatement: string;
  typeExpression: CasimirSpecExpressionV1;
  typeExpressionSha256: string;
  provenanceIds: string[];
};

export type CasimirSpecObservableV1 = {
  observableId: string;
  canonicalObservableId: string;
  symbolId: string;
  quantity: string;
  mathematicalType: TheoryBadgeObservableMathematicalTypeV1;
  unitBinding: CasimirSpecUnitBindingV1;
  frameBinding: CasimirSpecFrameBindingV1;
  operationalDefinitionId: string;
  responseModelDefinitionId: string | null;
  validityDomain: CasimirSpecValidityDomainV1;
  provenanceIds: string[];
};

export type CasimirSpecObservableBridgeV1 = {
  bridgeId: string;
  fromObservableId: string;
  toObservableId: string;
  kind: TheoryBadgeObservableBridgeKindV1;
  authority: "registered";
  registration: {
    graphId: string;
    edgeId: string;
    edgeSemanticSha256: string;
  };
  reversible: boolean;
  inverseBridgeId: string | null;
  assumptionIds: string[];
  validityDomain: CasimirSpecValidityDomainV1;
  errorContract: {
    kind: TheoryBadgeObservableErrorKindV1;
    expression: string | null;
  };
  provenanceIds: string[];
};

export type CasimirSpecBlockerV1 = {
  blockerId: string;
  kind: CasimirSpecBlockerKindV1;
  description: string;
  claimIds: string[];
  resolutionRequirement: string;
  provenanceIds: string[];
};

export type CasimirSpecExcludedClaimV1 = {
  excludedClaimId: string;
  kind: CasimirSpecExcludedClaimKindV1;
  statement: string;
  reason: string;
  requiredEvidenceKinds: string[];
};

export type CasimirSpecClaimSourceMapEntryV1 = {
  mapId: string;
  displayFragment: string;
  expressionPath: string;
  definitionIds: string[];
  symbolIds: string[];
};

export type CasimirSpecClaimV1 = {
  claimId: string;
  name: string;
  displayStatement: string;
  proposition: CasimirSpecExpressionV1;
  propositionSha256: string;
  foundationId: string;
  definitionIds: string[];
  assumptionIds: string[];
  allowedAxiomIds: string[];
  symbolIds: string[];
  observableIds: string[];
  bridgeIds: string[];
  excludedClaimIds: string[];
  provenanceIds: string[];
  sourceMap: CasimirSpecClaimSourceMapEntryV1[];
  axes: {
    logical: {
      declaration: "conjecture" | "theorem";
      resolution: "unassessed";
    };
    computational: {
      status: CasimirSpecComputationalStatusV1;
      reason: string | null;
      blockerIds: string[];
    };
    scientific: {
      status: CasimirSpecScientificStatusV1;
      receiptProvenanceIds: string[];
    };
    coverage: {
      status: CasimirSpecCoverageStatusV1;
      blockerIds: string[];
    };
  };
  maturityCeiling: CasimirSpecMaturityLevelV1;
};

export type CasimirSpecScientificClaimIrV1 = {
  artifactId: typeof CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION;
  generatedAt: string;
  specId: string;
  title: string;
  semanticSha256: string;
  artifactSha256: string;
  source: {
    kind: "ir_native" | "parsed_surface";
    language: "casimir_spec";
    languageVersion: typeof CASIMIR_SPEC_LANGUAGE_VERSION;
    artifact: { path: string | null; sha256: string | null };
  };
  world: {
    model: "open_world";
    exhaustive: false;
    graphId: string | null;
    masterProblemPlanId: string | null;
    badgeIds: string[];
    coverageBasis:
      "unmeasured" | "semantic_coverage_heuristic" | "caller_calibrated";
    representedProbabilityMass: number | null;
    outOfGraphProbability: number | null;
    interpretation: "coverage_uncertainty_not_truth_probability";
  };
  catalogBindings: CasimirSpecCatalogBindingV1[];
  foundations: CasimirSpecFoundationV1[];
  provenanceLedger: CasimirSpecProvenanceV1[];
  symbols: CasimirSpecSymbolV1[];
  definitions: CasimirSpecDefinitionV1[];
  assumptions: CasimirSpecAssumptionV1[];
  axiomLedger: {
    admissionPolicy: "exact_allowlist";
    hiddenAxiomsAllowed: false;
    entries: CasimirSpecAxiomV1[];
  };
  observables: CasimirSpecObservableV1[];
  bridges: CasimirSpecObservableBridgeV1[];
  blockers: CasimirSpecBlockerV1[];
  excludedClaims: CasimirSpecExcludedClaimV1[];
  claims: CasimirSpecClaimV1[];
  claimBoundary: {
    semanticSpecificationOnly: true;
    externalSemanticAdmissionRequired: true;
    proofStatusRequiresExternalCertificate: true;
    empiricalStatusRequiresExternalReceipt: true;
    humanRenderingAuthority: false;
    semanticIdentityAuthority: false;
    executesTools: false;
    validatesTheory: false;
    validatesPhysicalMechanism: false;
    proofAuthority: false;
    empiricalAuthority: false;
    implementationCorrectnessAuthority: false;
    promotionAllowed: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

type UnhashedDefinitionV1 = Omit<CasimirSpecDefinitionV1, "expressionSha256">;
type UnhashedAssumptionV1 = Omit<CasimirSpecAssumptionV1, "propositionSha256">;
type UnhashedAxiomV1 = Omit<CasimirSpecAxiomV1, "typeExpressionSha256">;
type UnhashedClaimV1 = Omit<CasimirSpecClaimV1, "propositionSha256">;

export type BuildCasimirSpecScientificClaimIrV1Input = Omit<
  CasimirSpecScientificClaimIrV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "semanticSha256"
  | "artifactSha256"
  | "definitions"
  | "assumptions"
  | "axiomLedger"
  | "claims"
> & {
  generatedAt?: string;
  definitions: UnhashedDefinitionV1[];
  assumptions: UnhashedAssumptionV1[];
  axiomLedger: Omit<
    CasimirSpecScientificClaimIrV1["axiomLedger"],
    "entries"
  > & {
    entries: UnhashedAxiomV1[];
  };
  claims: UnhashedClaimV1[];
};

const SHA256 = /^[a-f0-9]{64}$/;
const INTEGER = /^-?(?:0|[1-9][0-9]*)$/;
const RATIONAL_EXPONENT = /^-?(?:0|[1-9][0-9]*)(?:\/(?:[1-9][0-9]*))?$/;
const PORTABLE_RELATIVE_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)(?![A-Za-z]:)[^\0]+$/;
const EXPRESSION_MAX_DEPTH = 32;
const EXPRESSION_MAX_NODES = 2048;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;
const includes = <T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] => typeof value === "string" && values.includes(value);

function issue(
  issues: string[],
  code: string,
  path: string,
  detail: string,
): void {
  issues.push(`${code}:${path}:${detail}`);
}

function exactShape(
  issues: string[],
  code: string,
  path: string,
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issue(issues, code, path, "must be an object");
    return false;
  }
  const expected = new Set(keys);
  const actual = Object.keys(value);
  const missing = keys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  const unexpected = actual.filter((key) => !expected.has(key)).sort();
  if (missing.length > 0)
    issue(issues, code, path, `missing fields ${missing.join(",")}`);
  if (unexpected.length > 0) {
    issue(issues, code, path, `unexpected fields ${unexpected.join(",")}`);
  }
  return true;
}

function requireNonEmptyString(
  issues: string[],
  path: string,
  value: unknown,
): value is string {
  if (!isNonEmptyString(value)) {
    issue(
      issues,
      "non_empty_string_required",
      path,
      "must be a non-empty string",
    );
    return false;
  }
  return true;
}

function requireSha256(
  issues: string[],
  path: string,
  value: unknown,
): value is string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    issue(
      issues,
      "sha256_invalid",
      path,
      "must be a lowercase SHA-256 hex string",
    );
    return false;
  }
  return true;
}

function requireNullableSha256(
  issues: string[],
  path: string,
  value: unknown,
): value is string | null {
  if (value === null) return true;
  return requireSha256(issues, path, value);
}

function requireSortedUniqueStrings(
  issues: string[],
  path: string,
  value: unknown,
  options: { nonEmpty?: boolean } = {},
): value is string[] {
  if (!isStringArray(value)) {
    issue(
      issues,
      "sorted_unique_string_array_required",
      path,
      "must be an array of strings",
    );
    return false;
  }
  if (options.nonEmpty && value.length === 0) {
    issue(
      issues,
      "sorted_unique_string_array_required",
      path,
      "must not be empty",
    );
  }
  if (value.some((entry) => entry.trim().length === 0)) {
    issue(
      issues,
      "sorted_unique_string_array_required",
      path,
      "must not contain empty strings",
    );
  }
  const sorted = [...new Set(value)].sort(compareCodeUnits);
  if (
    sorted.length !== value.length ||
    sorted.some((entry, index) => entry !== value[index])
  ) {
    issue(
      issues,
      "sorted_unique_string_array_required",
      path,
      "must be sorted and unique",
    );
  }
  return true;
}

function requireSortedById(
  issues: string[],
  path: string,
  value: unknown,
  idField: string,
): value is Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    issue(issues, "sorted_entity_array_required", path, "must be an array");
    return false;
  }
  const ids = value.map((entry) => (isRecord(entry) ? entry[idField] : null));
  if (!ids.every(isNonEmptyString)) {
    issue(
      issues,
      "sorted_entity_array_required",
      path,
      `each entry must have ${idField}`,
    );
    return value.every(isRecord);
  }
  const typedIds = ids as string[];
  const sorted = [...new Set(typedIds)].sort(compareCodeUnits);
  if (
    sorted.length !== typedIds.length ||
    sorted.some((entry, index) => entry !== typedIds[index])
  ) {
    issue(
      issues,
      "sorted_entity_array_required",
      path,
      `must be sorted and unique by ${idField}`,
    );
  }
  return value.every(isRecord);
}

function isIsoTimestamp(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("canonical JSON forbids non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort(compareCodeUnits)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  throw new Error(`canonical JSON forbids ${typeof value}`);
}

export function canonicalizeCasimirSpecValueV1(value: unknown): string {
  return canonicalize(value);
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  try {
    return canonicalize(left) === canonicalize(right);
  } catch {
    return false;
  }
}

function canonicalSignature(value: unknown): string {
  try {
    return canonicalize(value);
  } catch {
    return "<invalid>";
  }
}

function validateDimensionVector(
  value: unknown,
  path: string,
  issues: string[],
): value is CasimirSpecDimensionVectorV1 {
  if (
    !exactShape(issues, "dimension_vector_shape_invalid", path, value, [
      "mass",
      "length",
      "time",
      "current",
      "temperature",
      "amount",
      "luminousIntensity",
    ])
  ) {
    return false;
  }
  for (const key of [
    "mass",
    "length",
    "time",
    "current",
    "temperature",
    "amount",
    "luminousIntensity",
  ] as const) {
    if (typeof value[key] !== "string" || !RATIONAL_EXPONENT.test(value[key])) {
      issue(
        issues,
        "dimension_exponent_invalid",
        `${path}.${key}`,
        "must be an integer or reduced-form-compatible rational string",
      );
    }
  }
  return true;
}

function validateUnitBinding(
  value: unknown,
  path: string,
  issues: string[],
): value is CasimirSpecUnitBindingV1 {
  if (
    !exactShape(issues, "unit_binding_shape_invalid", path, value, [
      "status",
      "unit",
      "dimensions",
    ])
  ) {
    return false;
  }
  if (
    !["specified", "dimensionless", "not_applicable", "unresolved"].includes(
      String(value.status),
    )
  ) {
    issue(
      issues,
      "unit_binding_status_invalid",
      `${path}.status`,
      "is invalid",
    );
    return true;
  }
  if (value.status === "specified") {
    requireNonEmptyString(issues, `${path}.unit`, value.unit);
    validateDimensionVector(value.dimensions, `${path}.dimensions`, issues);
  } else if (value.status === "dimensionless") {
    if (value.unit !== "1")
      issue(issues, "dimensionless_unit_invalid", `${path}.unit`, "must be 1");
    if (
      validateDimensionVector(value.dimensions, `${path}.dimensions`, issues)
    ) {
      for (const exponent of Object.values(value.dimensions)) {
        if (exponent !== "0") {
          issue(
            issues,
            "dimensionless_vector_invalid",
            `${path}.dimensions`,
            "all exponents must be 0",
          );
          break;
        }
      }
    }
  } else if (value.unit !== null || value.dimensions !== null) {
    issue(
      issues,
      "unresolved_unit_payload_invalid",
      path,
      "not_applicable and unresolved bindings must use null unit and dimensions",
    );
  }
  return true;
}

function validateFrameBinding(
  value: unknown,
  path: string,
  issues: string[],
): value is CasimirSpecFrameBindingV1 {
  if (
    !exactShape(issues, "frame_binding_shape_invalid", path, value, [
      "status",
      "frameDefinitionId",
    ])
  ) {
    return false;
  }
  if (
    !["bound", "invariant", "not_applicable", "unresolved"].includes(
      String(value.status),
    )
  ) {
    issue(
      issues,
      "frame_binding_status_invalid",
      `${path}.status`,
      "is invalid",
    );
  } else if (value.status === "bound") {
    requireNonEmptyString(
      issues,
      `${path}.frameDefinitionId`,
      value.frameDefinitionId,
    );
  } else if (value.frameDefinitionId !== null) {
    issue(
      issues,
      "frame_binding_payload_invalid",
      `${path}.frameDefinitionId`,
      "must be null unless status is bound",
    );
  }
  return true;
}

function validateValidityDomain(
  value: unknown,
  path: string,
  issues: string[],
): value is CasimirSpecValidityDomainV1 {
  if (
    !exactShape(issues, "validity_domain_shape_invalid", path, value, [
      "scaleLog10M",
      "frameDefinitionIds",
      "conditions",
    ])
  ) {
    return false;
  }
  requireSortedUniqueStrings(
    issues,
    `${path}.frameDefinitionIds`,
    value.frameDefinitionIds,
  );
  requireSortedUniqueStrings(issues, `${path}.conditions`, value.conditions);
  if (value.scaleLog10M !== null) {
    if (
      exactShape(
        issues,
        "scale_domain_shape_invalid",
        `${path}.scaleLog10M`,
        value.scaleLog10M,
        ["min", "max"],
      )
    ) {
      for (const key of ["min", "max"] as const) {
        const entry = value.scaleLog10M[key];
        if (entry !== null && !isFiniteNumber(entry)) {
          issue(
            issues,
            "scale_domain_value_invalid",
            `${path}.scaleLog10M.${key}`,
            "must be finite or null",
          );
        }
      }
      if (
        isFiniteNumber(value.scaleLog10M.min) &&
        isFiniteNumber(value.scaleLog10M.max) &&
        value.scaleLog10M.min > value.scaleLog10M.max
      ) {
        issue(
          issues,
          "scale_domain_order_invalid",
          `${path}.scaleLog10M`,
          "min must not exceed max",
        );
      }
    }
  }
  return true;
}

type ExpressionReferences = {
  symbolIds: Set<string>;
  definitionIds: Set<string>;
  assumptionIds: Set<string>;
  axiomIds: Set<string>;
  catalogIds: Set<string>;
};

function validateExpression(
  value: unknown,
  path: string,
  issues: string[],
  refs: ExpressionReferences,
  state: { nodes: number },
  depth = 0,
): void {
  state.nodes += 1;
  if (depth > EXPRESSION_MAX_DEPTH) {
    issue(
      issues,
      "expression_depth_exceeded",
      path,
      `maximum depth is ${EXPRESSION_MAX_DEPTH}`,
    );
    return;
  }
  if (state.nodes > EXPRESSION_MAX_NODES) {
    issue(
      issues,
      "expression_node_limit_exceeded",
      path,
      `maximum nodes is ${EXPRESSION_MAX_NODES}`,
    );
    return;
  }
  if (!isRecord(value)) {
    issue(issues, "expression_shape_invalid", path, "must be an object");
    return;
  }
  switch (value.kind) {
    case "symbol_ref":
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "symbolId",
      ]);
      if (
        !isNonEmptyString(value.symbolId) ||
        !refs.symbolIds.has(value.symbolId)
      ) {
        issue(
          issues,
          "expression_reference_unresolved",
          `${path}.symbolId`,
          "must identify a declared symbol",
        );
      }
      return;
    case "definition_ref":
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "definitionId",
      ]);
      if (
        !isNonEmptyString(value.definitionId) ||
        !refs.definitionIds.has(value.definitionId)
      ) {
        issue(
          issues,
          "expression_reference_unresolved",
          `${path}.definitionId`,
          "must identify a declared definition",
        );
      }
      return;
    case "assumption_ref":
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "assumptionId",
      ]);
      if (
        !isNonEmptyString(value.assumptionId) ||
        !refs.assumptionIds.has(value.assumptionId)
      ) {
        issue(
          issues,
          "expression_reference_unresolved",
          `${path}.assumptionId`,
          "must identify a declared assumption",
        );
      }
      return;
    case "axiom_ref":
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "axiomId",
      ]);
      if (
        !isNonEmptyString(value.axiomId) ||
        !refs.axiomIds.has(value.axiomId)
      ) {
        issue(
          issues,
          "expression_reference_unresolved",
          `${path}.axiomId`,
          "must identify an allowed axiom",
        );
      }
      return;
    case "rational_literal":
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "numerator",
        "denominator",
      ]);
      if (
        typeof value.numerator !== "string" ||
        !INTEGER.test(value.numerator)
      ) {
        issue(
          issues,
          "rational_literal_invalid",
          `${path}.numerator`,
          "must be an integer string",
        );
      }
      if (
        typeof value.denominator !== "string" ||
        !/^(?:[1-9][0-9]*)$/.test(value.denominator)
      ) {
        issue(
          issues,
          "rational_literal_invalid",
          `${path}.denominator`,
          "must be a positive integer string",
        );
      }
      return;
    case "apply": {
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "operatorId",
        "arguments",
      ]);
      if (!isNonEmptyString(value.operatorId)) {
        issue(
          issues,
          "operator_id_invalid",
          `${path}.operatorId`,
          "must be a non-empty string",
        );
      } else {
        const operatorId = value.operatorId;
        const admittedCore = includes(
          CASIMIR_SPEC_CORE_OPERATOR_IDS,
          operatorId,
        );
        const admittedCatalog = [...refs.catalogIds].some((catalogId) =>
          operatorId.startsWith(`${catalogId}::`),
        );
        if (!admittedCore && !admittedCatalog) {
          issue(
            issues,
            "operator_not_admitted",
            `${path}.operatorId`,
            "must be a core operator or belong to a bound catalog",
          );
        }
      }
      if (!Array.isArray(value.arguments)) {
        issue(
          issues,
          "expression_shape_invalid",
          `${path}.arguments`,
          "must be an array",
        );
      } else {
        for (let index = 0; index < value.arguments.length; index += 1) {
          if (state.nodes >= EXPRESSION_MAX_NODES) {
            issue(
              issues,
              "expression_node_limit_exceeded",
              `${path}.arguments`,
              `maximum nodes is ${EXPRESSION_MAX_NODES}`,
            );
            break;
          }
          validateExpression(
            value.arguments[index],
            `${path}.arguments[${index}]`,
            issues,
            refs,
            state,
            depth + 1,
          );
        }
      }
      return;
    }
    case "binder":
      exactShape(issues, "expression_shape_invalid", path, value, [
        "kind",
        "binder",
        "boundSymbolIds",
        "body",
      ]);
      if (!["forall", "exists", "lambda"].includes(String(value.binder))) {
        issue(issues, "binder_kind_invalid", `${path}.binder`, "is invalid");
      }
      if (
        requireSortedUniqueStrings(
          issues,
          `${path}.boundSymbolIds`,
          value.boundSymbolIds,
          { nonEmpty: true },
        )
      ) {
        value.boundSymbolIds.forEach((symbolId) => {
          if (!refs.symbolIds.has(symbolId)) {
            issue(
              issues,
              "expression_reference_unresolved",
              `${path}.boundSymbolIds`,
              `missing symbol ${symbolId}`,
            );
          }
        });
      }
      validateExpression(
        value.body,
        `${path}.body`,
        issues,
        refs,
        state,
        depth + 1,
      );
      return;
    default:
      issue(
        issues,
        "expression_kind_invalid",
        `${path}.kind`,
        "raw backend text and unknown expression nodes are forbidden",
      );
  }
}

function collectExpressionReferenceIds(
  value: unknown,
  collected: {
    symbolIds: Set<string>;
    definitionIds: Set<string>;
    assumptionIds: Set<string>;
    axiomIds: Set<string>;
  },
): void {
  const stack: unknown[] = [value];
  const seen = new WeakSet<object>();
  let visited = 0;
  while (stack.length > 0 && visited < EXPRESSION_MAX_NODES) {
    const current = stack.pop();
    if (!isRecord(current) || seen.has(current)) continue;
    seen.add(current);
    visited += 1;
    if (current.kind === "symbol_ref" && isNonEmptyString(current.symbolId)) {
      collected.symbolIds.add(current.symbolId);
    } else if (
      current.kind === "definition_ref" &&
      isNonEmptyString(current.definitionId)
    ) {
      collected.definitionIds.add(current.definitionId);
    } else if (
      current.kind === "assumption_ref" &&
      isNonEmptyString(current.assumptionId)
    ) {
      collected.assumptionIds.add(current.assumptionId);
    } else if (
      current.kind === "axiom_ref" &&
      isNonEmptyString(current.axiomId)
    ) {
      collected.axiomIds.add(current.axiomId);
    } else if (current.kind === "apply" && Array.isArray(current.arguments)) {
      const remaining = EXPRESSION_MAX_NODES - visited - stack.length;
      for (
        let index = Math.min(current.arguments.length, remaining) - 1;
        index >= 0;
        index -= 1
      ) {
        stack.push(current.arguments[index]);
      }
    } else if (current.kind === "binder") {
      stack.push(current.body);
    }
  }
}

function newExpressionReferenceSet(): {
  symbolIds: Set<string>;
  definitionIds: Set<string>;
  assumptionIds: Set<string>;
  axiomIds: Set<string>;
} {
  return {
    symbolIds: new Set<string>(),
    definitionIds: new Set<string>(),
    assumptionIds: new Set<string>(),
    axiomIds: new Set<string>(),
  };
}

function resolveExpressionPath(
  root: unknown,
  pointer: string,
): { found: boolean; value: unknown } {
  if (pointer === "/") return { found: true, value: root };
  if (!pointer.startsWith("/") || pointer.length < 2)
    return { found: false, value: undefined };
  let current: unknown = root;
  for (const rawSegment of pointer.slice(1).split("/")) {
    if (/~(?![01])/u.test(rawSegment))
      return { found: false, value: undefined };
    const segment = rawSegment.replace(/~1/gu, "/").replace(/~0/gu, "~");
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(segment))
        return { found: false, value: undefined };
      const index = Number(segment);
      if (!Number.isSafeInteger(index) || index >= current.length)
        return { found: false, value: undefined };
      current = current[index];
    } else if (
      isRecord(current) &&
      Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      current = current[segment];
    } else {
      return { found: false, value: undefined };
    }
  }
  return { found: current !== undefined, value: current };
}

function validateReferenceList(
  value: unknown,
  path: string,
  issues: string[],
  admitted: Set<string>,
  options: { nonEmpty?: boolean } = {},
): value is string[] {
  if (!requireSortedUniqueStrings(issues, path, value, options)) return false;
  for (const id of value) {
    if (!admitted.has(id))
      issue(issues, "reference_unresolved", path, `missing ${id}`);
  }
  return true;
}

function registerGlobalId(
  id: unknown,
  path: string,
  issues: string[],
  ids: Map<string, string>,
): void {
  if (!isNonEmptyString(id)) return;
  const previous = ids.get(id);
  if (previous)
    issue(
      issues,
      "global_entity_id_duplicate",
      path,
      `already used at ${previous}`,
    );
  else ids.set(id, path);
}

function validateEntityArrayShapes(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function validateCasimirSpecScientificClaimIrV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactShape(issues, "root_shape_invalid", "$", value, [
      "artifactId",
      "schemaVersion",
      "generatedAt",
      "specId",
      "title",
      "semanticSha256",
      "artifactSha256",
      "source",
      "world",
      "catalogBindings",
      "foundations",
      "provenanceLedger",
      "symbols",
      "definitions",
      "assumptions",
      "axiomLedger",
      "observables",
      "bridges",
      "blockers",
      "excludedClaims",
      "claims",
      "claimBoundary",
    ])
  ) {
    return issues;
  }

  if (value.artifactId !== CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_ARTIFACT_ID) {
    issue(
      issues,
      "artifact_id_invalid",
      "$.artifactId",
      `must be ${CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_ARTIFACT_ID}`,
    );
  }
  if (value.schemaVersion !== CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION) {
    issue(
      issues,
      "schema_version_invalid",
      "$.schemaVersion",
      `must be ${CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION}`,
    );
  }
  if (
    !isNonEmptyString(value.generatedAt) ||
    !isIsoTimestamp(value.generatedAt)
  ) {
    issue(
      issues,
      "timestamp_invalid",
      "$.generatedAt",
      "must be an exact ISO-8601 timestamp",
    );
  }
  requireNonEmptyString(issues, "$.specId", value.specId);
  requireNonEmptyString(issues, "$.title", value.title);
  requireSha256(issues, "$.semanticSha256", value.semanticSha256);
  requireSha256(issues, "$.artifactSha256", value.artifactSha256);

  if (
    exactShape(issues, "source_shape_invalid", "$.source", value.source, [
      "kind",
      "language",
      "languageVersion",
      "artifact",
    ])
  ) {
    if (!["ir_native", "parsed_surface"].includes(String(value.source.kind))) {
      issue(issues, "source_kind_invalid", "$.source.kind", "is invalid");
    }
    if (value.source.language !== "casimir_spec") {
      issue(
        issues,
        "source_language_invalid",
        "$.source.language",
        "must be casimir_spec",
      );
    }
    if (value.source.languageVersion !== CASIMIR_SPEC_LANGUAGE_VERSION) {
      issue(
        issues,
        "source_language_version_invalid",
        "$.source.languageVersion",
        `must be ${CASIMIR_SPEC_LANGUAGE_VERSION}`,
      );
    }
    if (
      exactShape(
        issues,
        "source_artifact_shape_invalid",
        "$.source.artifact",
        value.source.artifact,
        ["path", "sha256"],
      )
    ) {
      const path = value.source.artifact.path;
      const sha256 = value.source.artifact.sha256;
      if (
        path !== null &&
        (!isNonEmptyString(path) || !PORTABLE_RELATIVE_PATH.test(path))
      ) {
        issue(
          issues,
          "portable_path_invalid",
          "$.source.artifact.path",
          "must be a portable repository-relative path or null",
        );
      }
      requireNullableSha256(issues, "$.source.artifact.sha256", sha256);
      if ((path === null) !== (sha256 === null)) {
        issue(
          issues,
          "source_artifact_binding_invalid",
          "$.source.artifact",
          "path and sha256 must both be present or both be null",
        );
      }
      if (
        value.source.kind === "ir_native" &&
        (path !== null || sha256 !== null)
      ) {
        issue(
          issues,
          "source_artifact_binding_invalid",
          "$.source.artifact",
          "ir_native must not claim a parsed source artifact",
        );
      }
      if (
        value.source.kind === "parsed_surface" &&
        (path === null || sha256 === null)
      ) {
        issue(
          issues,
          "source_artifact_binding_invalid",
          "$.source.artifact",
          "parsed_surface requires a path and sha256",
        );
      }
    }
  }

  if (
    exactShape(issues, "world_shape_invalid", "$.world", value.world, [
      "model",
      "exhaustive",
      "graphId",
      "masterProblemPlanId",
      "badgeIds",
      "coverageBasis",
      "representedProbabilityMass",
      "outOfGraphProbability",
      "interpretation",
    ])
  ) {
    if (value.world.model !== "open_world") {
      issue(
        issues,
        "open_world_model_required",
        "$.world.model",
        "must be open_world",
      );
    }
    if (value.world.exhaustive !== false) {
      issue(
        issues,
        "open_world_exhaustiveness_invalid",
        "$.world.exhaustive",
        "must be false",
      );
    }
    if (value.world.graphId !== null) {
      requireNonEmptyString(issues, "$.world.graphId", value.world.graphId);
    }
    if (value.world.masterProblemPlanId !== null) {
      requireNonEmptyString(
        issues,
        "$.world.masterProblemPlanId",
        value.world.masterProblemPlanId,
      );
    }
    if (
      requireSortedUniqueStrings(
        issues,
        "$.world.badgeIds",
        value.world.badgeIds,
      )
    ) {
      if (value.world.graphId === null && value.world.badgeIds.length > 0) {
        issue(
          issues,
          "world_graph_binding_invalid",
          "$.world.badgeIds",
          "badges require graphId",
        );
      }
    }
    if (
      ![
        "unmeasured",
        "semantic_coverage_heuristic",
        "caller_calibrated",
      ].includes(String(value.world.coverageBasis))
    ) {
      issue(
        issues,
        "coverage_basis_invalid",
        "$.world.coverageBasis",
        "is invalid",
      );
    }
    if (value.world.coverageBasis === "unmeasured") {
      if (
        value.world.representedProbabilityMass !== null ||
        value.world.outOfGraphProbability !== null
      ) {
        issue(
          issues,
          "coverage_probability_invalid",
          "$.world",
          "unmeasured coverage requires null probability masses",
        );
      }
    } else {
      for (const field of [
        "representedProbabilityMass",
        "outOfGraphProbability",
      ] as const) {
        const probability = value.world[field];
        if (
          !isFiniteNumber(probability) ||
          probability < 0 ||
          probability > 1
        ) {
          issue(
            issues,
            "coverage_probability_invalid",
            `$.world.${field}`,
            "must be in [0,1]",
          );
        }
      }
      if (
        isFiniteNumber(value.world.representedProbabilityMass) &&
        isFiniteNumber(value.world.outOfGraphProbability) &&
        Math.abs(
          value.world.representedProbabilityMass +
            value.world.outOfGraphProbability -
            1,
        ) > 1e-12
      ) {
        issue(
          issues,
          "coverage_probability_invalid",
          "$.world",
          "probability masses must sum to 1",
        );
      }
    }
    if (
      value.world.interpretation !==
      "coverage_uncertainty_not_truth_probability"
    ) {
      issue(
        issues,
        "coverage_interpretation_invalid",
        "$.world.interpretation",
        "is invalid",
      );
    }
  }

  requireSortedById(
    issues,
    "$.catalogBindings",
    value.catalogBindings,
    "catalogId",
  );
  requireSortedById(issues, "$.foundations", value.foundations, "foundationId");
  requireSortedById(
    issues,
    "$.provenanceLedger",
    value.provenanceLedger,
    "provenanceId",
  );
  requireSortedById(issues, "$.symbols", value.symbols, "symbolId");
  requireSortedById(issues, "$.definitions", value.definitions, "definitionId");
  requireSortedById(issues, "$.assumptions", value.assumptions, "assumptionId");
  requireSortedById(issues, "$.observables", value.observables, "observableId");
  requireSortedById(issues, "$.bridges", value.bridges, "bridgeId");
  requireSortedById(issues, "$.blockers", value.blockers, "blockerId");
  requireSortedById(
    issues,
    "$.excludedClaims",
    value.excludedClaims,
    "excludedClaimId",
  );
  requireSortedById(issues, "$.claims", value.claims, "claimId");

  const catalogs = validateEntityArrayShapes(value.catalogBindings);
  const foundations = validateEntityArrayShapes(value.foundations);
  const provenance = validateEntityArrayShapes(value.provenanceLedger);
  const symbols = validateEntityArrayShapes(value.symbols);
  const definitions = validateEntityArrayShapes(value.definitions);
  const assumptions = validateEntityArrayShapes(value.assumptions);
  const observables = validateEntityArrayShapes(value.observables);
  const bridges = validateEntityArrayShapes(value.bridges);
  const blockers = validateEntityArrayShapes(value.blockers);
  const excludedClaims = validateEntityArrayShapes(value.excludedClaims);
  const claims = validateEntityArrayShapes(value.claims);

  let axioms: Record<string, unknown>[] = [];
  if (
    exactShape(
      issues,
      "axiom_ledger_shape_invalid",
      "$.axiomLedger",
      value.axiomLedger,
      ["admissionPolicy", "hiddenAxiomsAllowed", "entries"],
    )
  ) {
    if (value.axiomLedger.admissionPolicy !== "exact_allowlist") {
      issue(
        issues,
        "axiom_admission_policy_invalid",
        "$.axiomLedger.admissionPolicy",
        "must be exact_allowlist",
      );
    }
    if (value.axiomLedger.hiddenAxiomsAllowed !== false) {
      issue(
        issues,
        "hidden_axioms_forbidden",
        "$.axiomLedger.hiddenAxiomsAllowed",
        "must be false",
      );
    }
    requireSortedById(
      issues,
      "$.axiomLedger.entries",
      value.axiomLedger.entries,
      "axiomId",
    );
    axioms = validateEntityArrayShapes(value.axiomLedger.entries);
  }

  const catalogIds = new Set(
    catalogs.map((entry) => entry.catalogId).filter(isNonEmptyString),
  );
  const foundationIds = new Set(
    foundations.map((entry) => entry.foundationId).filter(isNonEmptyString),
  );
  const provenanceIds = new Set(
    provenance.map((entry) => entry.provenanceId).filter(isNonEmptyString),
  );
  const symbolIds = new Set(
    symbols.map((entry) => entry.symbolId).filter(isNonEmptyString),
  );
  const definitionIds = new Set(
    definitions.map((entry) => entry.definitionId).filter(isNonEmptyString),
  );
  const assumptionIds = new Set(
    assumptions.map((entry) => entry.assumptionId).filter(isNonEmptyString),
  );
  const axiomIds = new Set(
    axioms.map((entry) => entry.axiomId).filter(isNonEmptyString),
  );
  const observableIds = new Set(
    observables.map((entry) => entry.observableId).filter(isNonEmptyString),
  );
  const bridgeIds = new Set(
    bridges.map((entry) => entry.bridgeId).filter(isNonEmptyString),
  );
  const blockerIds = new Set(
    blockers.map((entry) => entry.blockerId).filter(isNonEmptyString),
  );
  const excludedClaimIds = new Set(
    excludedClaims
      .map((entry) => entry.excludedClaimId)
      .filter(isNonEmptyString),
  );
  const claimIds = new Set(
    claims.map((entry) => entry.claimId).filter(isNonEmptyString),
  );
  const globalIds = new Map<string, string>();
  for (const [path, entries, field] of [
    ["$.catalogBindings", catalogs, "catalogId"],
    ["$.foundations", foundations, "foundationId"],
    ["$.provenanceLedger", provenance, "provenanceId"],
    ["$.symbols", symbols, "symbolId"],
    ["$.definitions", definitions, "definitionId"],
    ["$.assumptions", assumptions, "assumptionId"],
    ["$.axiomLedger.entries", axioms, "axiomId"],
    ["$.observables", observables, "observableId"],
    ["$.bridges", bridges, "bridgeId"],
    ["$.blockers", blockers, "blockerId"],
    ["$.excludedClaims", excludedClaims, "excludedClaimId"],
    ["$.claims", claims, "claimId"],
  ] as const) {
    entries.forEach((entry, index) =>
      registerGlobalId(
        entry[field],
        `${path}[${index}].${field}`,
        issues,
        globalIds,
      ),
    );
  }

  catalogs.forEach((entry, index) => {
    const path = `$.catalogBindings[${index}]`;
    exactShape(issues, "catalog_binding_shape_invalid", path, entry, [
      "catalogId",
      "version",
      "semanticSha256",
    ]);
    requireNonEmptyString(issues, `${path}.catalogId`, entry.catalogId);
    requireNonEmptyString(issues, `${path}.version`, entry.version);
    requireSha256(issues, `${path}.semanticSha256`, entry.semanticSha256);
  });

  provenance.forEach((entry, index) => {
    const path = `$.provenanceLedger[${index}]`;
    exactShape(issues, "provenance_shape_invalid", path, entry, [
      "provenanceId",
      "kind",
      "locator",
      "contentSha256",
      "fragment",
      "citation",
    ]);
    requireNonEmptyString(issues, `${path}.provenanceId`, entry.provenanceId);
    if (!includes(CASIMIR_SPEC_PROVENANCE_KINDS, entry.kind)) {
      issue(issues, "provenance_kind_invalid", `${path}.kind`, "is invalid");
    }
    requireNonEmptyString(issues, `${path}.locator`, entry.locator);
    requireNullableSha256(issues, `${path}.contentSha256`, entry.contentSha256);
    for (const field of ["fragment", "citation"] as const) {
      if (entry[field] !== null && !isNonEmptyString(entry[field])) {
        issue(
          issues,
          "nullable_text_invalid",
          `${path}.${field}`,
          "must be non-empty or null",
        );
      }
    }
    if (entry.kind !== "prompt" && entry.contentSha256 === null) {
      issue(
        issues,
        "provenance_content_hash_required",
        `${path}.contentSha256`,
        "non-prompt provenance must be content-hash bound",
      );
    }
  });

  foundations.forEach((entry, index) => {
    const path = `$.foundations[${index}]`;
    exactShape(issues, "foundation_shape_invalid", path, entry, [
      "foundationId",
      "formalSystem",
      "formalSystemVersion",
      "logicProfileId",
      "profileSemanticSha256",
      "environmentLockProvenanceId",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.foundationId`, entry.foundationId);
    requireNonEmptyString(issues, `${path}.formalSystem`, entry.formalSystem);
    if (entry.formalSystemVersion !== null) {
      requireNonEmptyString(
        issues,
        `${path}.formalSystemVersion`,
        entry.formalSystemVersion,
      );
    }
    requireNonEmptyString(
      issues,
      `${path}.logicProfileId`,
      entry.logicProfileId,
    );
    requireNullableSha256(
      issues,
      `${path}.profileSemanticSha256`,
      entry.profileSemanticSha256,
    );
    if (entry.environmentLockProvenanceId !== null) {
      if (
        !isNonEmptyString(entry.environmentLockProvenanceId) ||
        !provenanceIds.has(entry.environmentLockProvenanceId)
      ) {
        issue(
          issues,
          "reference_unresolved",
          `${path}.environmentLockProvenanceId`,
          "must identify provenance or be null",
        );
      }
    }
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );
  });

  const expressionRefs: ExpressionReferences = {
    symbolIds,
    definitionIds,
    assumptionIds,
    axiomIds,
    catalogIds,
  };
  const definitionKinds = new Map<string, unknown>(
    definitions
      .filter((entry) => isNonEmptyString(entry.definitionId))
      .map((entry) => [entry.definitionId as string, entry.kind]),
  );

  const localNameOwners = new Map<
    string,
    { symbolId: string; semanticId: string }
  >();
  const semanticIdentityOwners = new Map<
    string,
    Array<{
      path: string;
      symbolId: string;
      authorityKey: string | null;
      semanticSignature: string;
    }>
  >();
  symbols.forEach((entry, index) => {
    const path = `$.symbols[${index}]`;
    exactShape(issues, "symbol_shape_invalid", path, entry, [
      "symbolId",
      "localName",
      "displayName",
      "identity",
      "role",
      "typeExpression",
      "mathematicalType",
      "unitBinding",
      "frameBinding",
      "definitionId",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.symbolId`, entry.symbolId);
    requireNonEmptyString(issues, `${path}.localName`, entry.localName);
    requireNonEmptyString(issues, `${path}.displayName`, entry.displayName);
    if (!includes(CASIMIR_SPEC_SYMBOL_ROLES, entry.role)) {
      issue(issues, "symbol_role_invalid", `${path}.role`, "is invalid");
    }
    requireNonEmptyString(
      issues,
      `${path}.typeExpression`,
      entry.typeExpression,
    );
    if (
      !includes(
        THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES,
        entry.mathematicalType,
      )
    ) {
      issue(
        issues,
        "mathematical_type_invalid",
        `${path}.mathematicalType`,
        "is invalid",
      );
    }
    validateUnitBinding(entry.unitBinding, `${path}.unitBinding`, issues);
    validateFrameBinding(entry.frameBinding, `${path}.frameBinding`, issues);
    if (
      entry.role === "physical_quantity" &&
      isRecord(entry.unitBinding) &&
      entry.unitBinding.status === "not_applicable"
    ) {
      issue(
        issues,
        "physical_quantity_unit_invalid",
        `${path}.unitBinding.status`,
        "physical quantities cannot use not_applicable",
      );
    }
    if (
      !isNonEmptyString(entry.definitionId) ||
      !definitionIds.has(entry.definitionId)
    ) {
      issue(
        issues,
        "symbol_definition_required",
        `${path}.definitionId`,
        "must identify the symbol's explicit definition",
      );
    }
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );

    let semanticId: string | null = null;
    let authorityKey: string | null = null;
    if (!isRecord(entry.identity)) {
      issue(
        issues,
        "symbol_identity_shape_invalid",
        `${path}.identity`,
        "must be an object",
      );
    } else if (entry.identity.kind === "local") {
      exactShape(
        issues,
        "symbol_identity_shape_invalid",
        `${path}.identity`,
        entry.identity,
        ["kind", "semanticId"],
      );
      if (
        requireNonEmptyString(
          issues,
          `${path}.identity.semanticId`,
          entry.identity.semanticId,
        )
      ) {
        semanticId = entry.identity.semanticId;
      }
    } else if (entry.identity.kind === "catalog") {
      exactShape(
        issues,
        "symbol_identity_shape_invalid",
        `${path}.identity`,
        entry.identity,
        ["kind", "semanticId", "catalogId", "entryId", "entrySemanticSha256"],
      );
      if (
        requireNonEmptyString(
          issues,
          `${path}.identity.semanticId`,
          entry.identity.semanticId,
        )
      ) {
        semanticId = entry.identity.semanticId;
      }
      if (
        !isNonEmptyString(entry.identity.catalogId) ||
        !catalogIds.has(entry.identity.catalogId)
      ) {
        issue(
          issues,
          "catalog_identity_unresolved",
          `${path}.identity.catalogId`,
          "must identify a bound catalog",
        );
      }
      requireNonEmptyString(
        issues,
        `${path}.identity.entryId`,
        entry.identity.entryId,
      );
      if (
        requireSha256(
          issues,
          `${path}.identity.entrySemanticSha256`,
          entry.identity.entrySemanticSha256,
        )
      ) {
        authorityKey = `catalog:${entry.identity.catalogId}:${entry.identity.entryId}:${entry.identity.entrySemanticSha256}`;
      }
    } else if (entry.identity.kind === "registered") {
      exactShape(
        issues,
        "symbol_identity_shape_invalid",
        `${path}.identity`,
        entry.identity,
        ["kind", "semanticId", "bindingId", "bindingSha256", "provenanceIds"],
      );
      if (
        requireNonEmptyString(
          issues,
          `${path}.identity.semanticId`,
          entry.identity.semanticId,
        )
      ) {
        semanticId = entry.identity.semanticId;
      }
      requireNonEmptyString(
        issues,
        `${path}.identity.bindingId`,
        entry.identity.bindingId,
      );
      if (
        requireSha256(
          issues,
          `${path}.identity.bindingSha256`,
          entry.identity.bindingSha256,
        )
      ) {
        authorityKey = `registered:${entry.identity.bindingId}:${entry.identity.bindingSha256}`;
      }
      validateReferenceList(
        entry.identity.provenanceIds,
        `${path}.identity.provenanceIds`,
        issues,
        provenanceIds,
        { nonEmpty: true },
      );
    } else {
      issue(
        issues,
        "symbol_identity_kind_invalid",
        `${path}.identity.kind`,
        "is invalid",
      );
    }

    if (
      isNonEmptyString(entry.localName) &&
      semanticId &&
      isNonEmptyString(entry.symbolId)
    ) {
      const previous = localNameOwners.get(entry.localName);
      if (previous) {
        issue(
          issues,
          "lexical_symbol_collision",
          `${path}.localName`,
          `already used by ${previous.symbolId}; spelling cannot establish identity`,
        );
      } else {
        localNameOwners.set(entry.localName, {
          symbolId: entry.symbolId,
          semanticId,
        });
      }
      const owners = semanticIdentityOwners.get(semanticId) ?? [];
      owners.push({
        path,
        symbolId: entry.symbolId,
        authorityKey,
        semanticSignature: canonicalSignature({
          role: entry.role,
          typeExpression: entry.typeExpression,
          mathematicalType: entry.mathematicalType,
          unitBinding: entry.unitBinding,
          frameBinding: entry.frameBinding,
        }),
      });
      semanticIdentityOwners.set(semanticId, owners);
    }
  });

  for (const [semanticId, owners] of semanticIdentityOwners.entries()) {
    if (owners.length < 2) continue;
    const authorityKeys = new Set(owners.map((owner) => owner.authorityKey));
    if (authorityKeys.size !== 1 || authorityKeys.has(null)) {
      owners.forEach((owner) =>
        issue(
          issues,
          "semantic_identity_authority_invalid",
          `${owner.path}.identity`,
          `semantic identity ${semanticId} is reused without one matching catalog or registered binding`,
        ),
      );
    }
    const signatures = new Set(owners.map((owner) => owner.semanticSignature));
    if (signatures.size !== 1) {
      owners.forEach((owner) =>
        issue(
          issues,
          "semantic_identity_signature_mismatch",
          `${owner.path}.identity`,
          `semantic identity ${semanticId} is reused across incompatible type, unit, or frame signatures`,
        ),
      );
    }
  }

  const symbolsById = new Map<string, Record<string, unknown>>(
    symbols
      .filter((entry) => isNonEmptyString(entry.symbolId))
      .map((entry) => [entry.symbolId as string, entry]),
  );
  const definitionsById = new Map<string, Record<string, unknown>>(
    definitions
      .filter((entry) => isNonEmptyString(entry.definitionId))
      .map((entry) => [entry.definitionId as string, entry]),
  );
  const assumptionsById = new Map<string, Record<string, unknown>>(
    assumptions
      .filter((entry) => isNonEmptyString(entry.assumptionId))
      .map((entry) => [entry.assumptionId as string, entry]),
  );
  const axiomsById = new Map<string, Record<string, unknown>>(
    axioms
      .filter((entry) => isNonEmptyString(entry.axiomId))
      .map((entry) => [entry.axiomId as string, entry]),
  );
  const observablesById = new Map<string, Record<string, unknown>>(
    observables
      .filter((entry) => isNonEmptyString(entry.observableId))
      .map((entry) => [entry.observableId as string, entry]),
  );
  const bridgesById = new Map<string, Record<string, unknown>>(
    bridges
      .filter((entry) => isNonEmptyString(entry.bridgeId))
      .map((entry) => [entry.bridgeId as string, entry]),
  );
  const directDefinitionDependencies = new Map<string, Set<string>>();

  const addSymbolDefinitionDependencies = (
    ownerDefinitionId: string | null,
    symbolId: string,
    target: Set<string>,
  ): void => {
    const symbol = symbolsById.get(symbolId);
    const symbolDefinitionId = symbol?.definitionId;
    if (
      isNonEmptyString(symbolDefinitionId) &&
      symbolDefinitionId !== ownerDefinitionId
    ) {
      target.add(symbolDefinitionId);
    }
    const frameBinding = symbol?.frameBinding;
    if (
      isRecord(frameBinding) &&
      frameBinding.status === "bound" &&
      isNonEmptyString(frameBinding.frameDefinitionId) &&
      frameBinding.frameDefinitionId !== ownerDefinitionId
    ) {
      target.add(frameBinding.frameDefinitionId);
    }
  };

  definitions.forEach((entry) => {
    if (!isNonEmptyString(entry.definitionId)) return;
    const refs = newExpressionReferenceSet();
    collectExpressionReferenceIds(entry.expression, refs);
    const dependencies = new Set(refs.definitionIds);
    refs.symbolIds.forEach((symbolId) =>
      addSymbolDefinitionDependencies(
        entry.definitionId as string,
        symbolId,
        dependencies,
      ),
    );
    if (isStringArray(entry.assumptionIds)) {
      for (const assumptionId of entry.assumptionIds) {
        const assumptionRefs = newExpressionReferenceSet();
        collectExpressionReferenceIds(
          assumptionsById.get(assumptionId)?.proposition,
          assumptionRefs,
        );
        assumptionRefs.definitionIds.forEach((definitionId) =>
          dependencies.add(definitionId),
        );
        assumptionRefs.symbolIds.forEach((symbolId) =>
          addSymbolDefinitionDependencies(
            entry.definitionId as string,
            symbolId,
            dependencies,
          ),
        );
      }
    }
    const definitionDomain = entry.validityDomain;
    if (
      isRecord(definitionDomain) &&
      isStringArray(definitionDomain.frameDefinitionIds)
    ) {
      definitionDomain.frameDefinitionIds.forEach((definitionId) => {
        if (definitionId !== entry.definitionId) dependencies.add(definitionId);
      });
    }
    directDefinitionDependencies.set(entry.definitionId, dependencies);
  });

  const visitedActualDefinitions = new Set<string>();
  for (const rootDefinitionId of directDefinitionDependencies.keys()) {
    if (visitedActualDefinitions.has(rootDefinitionId)) continue;
    const activeActualDefinitions = new Set<string>();
    const stack: Array<{ definitionId: string; exiting: boolean }> = [
      { definitionId: rootDefinitionId, exiting: false },
    ];
    while (stack.length > 0) {
      const frame = stack.pop();
      if (!frame) break;
      if (frame.exiting) {
        activeActualDefinitions.delete(frame.definitionId);
        visitedActualDefinitions.add(frame.definitionId);
        continue;
      }
      if (visitedActualDefinitions.has(frame.definitionId)) continue;
      if (activeActualDefinitions.has(frame.definitionId)) {
        issue(
          issues,
          "definition_dependency_cycle",
          "$.definitions",
          `actual expression dependency cycle includes ${frame.definitionId}`,
        );
        continue;
      }
      activeActualDefinitions.add(frame.definitionId);
      stack.push({ definitionId: frame.definitionId, exiting: true });
      const dependencies = [
        ...(directDefinitionDependencies.get(frame.definitionId) ?? []),
      ];
      for (let index = dependencies.length - 1; index >= 0; index -= 1) {
        const dependencyId = dependencies[index];
        if (activeActualDefinitions.has(dependencyId)) {
          issue(
            issues,
            "definition_dependency_cycle",
            "$.definitions",
            `actual expression dependency cycle includes ${dependencyId}`,
          );
        } else if (!visitedActualDefinitions.has(dependencyId)) {
          stack.push({ definitionId: dependencyId, exiting: false });
        }
      }
    }
  }

  const collectDefinitionClosure = (seedIds: Iterable<string>): Set<string> => {
    const closure = new Set<string>();
    const stack = [...seedIds];
    while (stack.length > 0) {
      const definitionId = stack.pop();
      if (!definitionId || closure.has(definitionId)) continue;
      closure.add(definitionId);
      for (const dependencyId of directDefinitionDependencies.get(
        definitionId,
      ) ?? []) {
        if (!closure.has(dependencyId)) stack.push(dependencyId);
      }
    }
    return closure;
  };

  definitions.forEach((entry, index) => {
    const path = `$.definitions[${index}]`;
    exactShape(issues, "definition_shape_invalid", path, entry, [
      "definitionId",
      "kind",
      "name",
      "display",
      "expression",
      "expressionSha256",
      "definesSymbolIds",
      "dependencyDefinitionIds",
      "assumptionIds",
      "validityDomain",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.definitionId`, entry.definitionId);
    if (!includes(CASIMIR_SPEC_DEFINITION_KINDS, entry.kind)) {
      issue(issues, "definition_kind_invalid", `${path}.kind`, "is invalid");
    }
    requireNonEmptyString(issues, `${path}.name`, entry.name);
    requireNonEmptyString(issues, `${path}.display`, entry.display);
    requireSha256(issues, `${path}.expressionSha256`, entry.expressionSha256);
    validateExpression(
      entry.expression,
      `${path}.expression`,
      issues,
      expressionRefs,
      { nodes: 0 },
    );
    const usedRefs = newExpressionReferenceSet();
    collectExpressionReferenceIds(entry.expression, usedRefs);
    if (usedRefs.axiomIds.size > 0) {
      issue(
        issues,
        "definition_axiom_reference_forbidden",
        `${path}.expression`,
        "definitions cannot hide axiom dependencies; axioms belong to claim allowlists",
      );
    }
    if (
      validateReferenceList(
        entry.definesSymbolIds,
        `${path}.definesSymbolIds`,
        issues,
        symbolIds,
      )
    ) {
      entry.definesSymbolIds.forEach((symbolId) => {
        const symbol = symbols.find(
          (candidate) => candidate.symbolId === symbolId,
        );
        if (symbol?.definitionId !== entry.definitionId) {
          issue(
            issues,
            "definition_symbol_binding_invalid",
            `${path}.definesSymbolIds`,
            `${symbolId} must point back to ${String(entry.definitionId)}`,
          );
        }
      });
    }
    const declaredDefinitionDependenciesValid = validateReferenceList(
      entry.dependencyDefinitionIds,
      `${path}.dependencyDefinitionIds`,
      issues,
      definitionIds,
    );
    if (
      isNonEmptyString(entry.definitionId) &&
      Array.isArray(entry.dependencyDefinitionIds) &&
      entry.dependencyDefinitionIds.includes(entry.definitionId)
    ) {
      issue(
        issues,
        "definition_dependency_cycle",
        `${path}.dependencyDefinitionIds`,
        "self-cycle is forbidden",
      );
    }
    validateReferenceList(
      entry.assumptionIds,
      `${path}.assumptionIds`,
      issues,
      assumptionIds,
    );
    if (
      declaredDefinitionDependenciesValid &&
      isNonEmptyString(entry.definitionId)
    ) {
      const expectedDependencies = collectDefinitionClosure(
        directDefinitionDependencies.get(entry.definitionId) ?? [],
      );
      expectedDependencies.delete(entry.definitionId);
      const declaredDependencies = new Set<string>(
        isStringArray(entry.dependencyDefinitionIds)
          ? entry.dependencyDefinitionIds
          : [],
      );
      for (const dependencyId of expectedDependencies) {
        if (!declaredDependencies.has(dependencyId)) {
          issue(
            issues,
            "definition_dependency_undeclared",
            `${path}.dependencyDefinitionIds`,
            `actual expression closure requires ${dependencyId}`,
          );
        }
      }
      for (const dependencyId of declaredDependencies) {
        if (!expectedDependencies.has(dependencyId)) {
          issue(
            issues,
            "definition_dependency_unreferenced",
            `${path}.dependencyDefinitionIds`,
            `${dependencyId} is not in the actual expression closure`,
          );
        }
      }

      const declaredAssumptions = new Set(
        isStringArray(entry.assumptionIds) ? entry.assumptionIds : [],
      );
      const requiredAssumptions = new Set(usedRefs.assumptionIds);
      for (const dependencyId of expectedDependencies) {
        const dependency = definitionsById.get(dependencyId);
        if (isStringArray(dependency?.assumptionIds)) {
          dependency.assumptionIds.forEach((assumptionId) =>
            requiredAssumptions.add(assumptionId),
          );
        }
      }
      for (const assumptionId of requiredAssumptions) {
        if (!declaredAssumptions.has(assumptionId)) {
          issue(
            issues,
            "definition_assumption_dependency_undeclared",
            `${path}.assumptionIds`,
            `actual dependency closure requires ${assumptionId}`,
          );
        }
      }
    }
    validateValidityDomain(
      entry.validityDomain,
      `${path}.validityDomain`,
      issues,
    );
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );
  });

  const definitionDependencies = new Map<string, string[]>();
  definitions.forEach((entry) => {
    if (
      isNonEmptyString(entry.definitionId) &&
      isStringArray(entry.dependencyDefinitionIds)
    ) {
      definitionDependencies.set(
        entry.definitionId,
        entry.dependencyDefinitionIds,
      );
    }
  });
  const declaredDependencyIndegree = new Map<string, number>();
  const declaredDependencyDependents = new Map<string, Set<string>>();
  for (const definitionId of definitionDependencies.keys()) {
    declaredDependencyIndegree.set(definitionId, 0);
  }
  for (const [definitionId, dependencies] of definitionDependencies) {
    for (const dependencyId of dependencies) {
      if (!definitionDependencies.has(dependencyId)) continue;
      declaredDependencyIndegree.set(
        definitionId,
        (declaredDependencyIndegree.get(definitionId) ?? 0) + 1,
      );
      const dependents =
        declaredDependencyDependents.get(dependencyId) ?? new Set<string>();
      dependents.add(definitionId);
      declaredDependencyDependents.set(dependencyId, dependents);
    }
  }
  const dependencyQueue = [...declaredDependencyIndegree]
    .filter(([, indegree]) => indegree === 0)
    .map(([definitionId]) => definitionId);
  const removedDeclaredDependencies = new Set<string>();
  while (dependencyQueue.length > 0) {
    const definitionId = dependencyQueue.pop();
    if (!definitionId || removedDeclaredDependencies.has(definitionId))
      continue;
    removedDeclaredDependencies.add(definitionId);
    for (const dependentId of declaredDependencyDependents.get(definitionId) ??
      []) {
      const nextIndegree =
        (declaredDependencyIndegree.get(dependentId) ?? 0) - 1;
      declaredDependencyIndegree.set(dependentId, nextIndegree);
      if (nextIndegree === 0) dependencyQueue.push(dependentId);
    }
  }
  for (const definitionId of definitionDependencies.keys()) {
    if (!removedDeclaredDependencies.has(definitionId)) {
      issue(
        issues,
        "definition_dependency_cycle",
        "$.definitions",
        `declared dependency cycle includes ${definitionId}`,
      );
    }
  }

  assumptions.forEach((entry, index) => {
    const path = `$.assumptions[${index}]`;
    exactShape(issues, "assumption_shape_invalid", path, entry, [
      "assumptionId",
      "kind",
      "displayStatement",
      "proposition",
      "propositionSha256",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.assumptionId`, entry.assumptionId);
    if (!includes(CASIMIR_SPEC_ASSUMPTION_KINDS, entry.kind)) {
      issue(issues, "assumption_kind_invalid", `${path}.kind`, "is invalid");
    }
    requireNonEmptyString(
      issues,
      `${path}.displayStatement`,
      entry.displayStatement,
    );
    requireSha256(issues, `${path}.propositionSha256`, entry.propositionSha256);
    validateExpression(
      entry.proposition,
      `${path}.proposition`,
      issues,
      expressionRefs,
      { nodes: 0 },
    );
    const usedRefs = newExpressionReferenceSet();
    collectExpressionReferenceIds(entry.proposition, usedRefs);
    if (usedRefs.assumptionIds.size > 0 || usedRefs.axiomIds.size > 0) {
      issue(
        issues,
        "assumption_dependency_reference_forbidden",
        `${path}.proposition`,
        "atomic assumption entries cannot hide assumption or axiom dependencies",
      );
    }
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );
  });

  axioms.forEach((entry, index) => {
    const path = `$.axiomLedger.entries[${index}]`;
    exactShape(issues, "axiom_shape_invalid", path, entry, [
      "axiomId",
      "foundationId",
      "displayStatement",
      "typeExpression",
      "typeExpressionSha256",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.axiomId`, entry.axiomId);
    if (
      !isNonEmptyString(entry.foundationId) ||
      !foundationIds.has(entry.foundationId)
    ) {
      issue(
        issues,
        "reference_unresolved",
        `${path}.foundationId`,
        "must identify a foundation",
      );
    }
    requireNonEmptyString(
      issues,
      `${path}.displayStatement`,
      entry.displayStatement,
    );
    requireSha256(
      issues,
      `${path}.typeExpressionSha256`,
      entry.typeExpressionSha256,
    );
    validateExpression(
      entry.typeExpression,
      `${path}.typeExpression`,
      issues,
      expressionRefs,
      {
        nodes: 0,
      },
    );
    const usedRefs = newExpressionReferenceSet();
    collectExpressionReferenceIds(entry.typeExpression, usedRefs);
    if (usedRefs.assumptionIds.size > 0 || usedRefs.axiomIds.size > 0) {
      issue(
        issues,
        "axiom_dependency_reference_forbidden",
        `${path}.typeExpression`,
        "axiom entries cannot hide assumption or axiom dependencies",
      );
    }
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );
  });

  const referencedFrameDefinitionIds = new Set<string>();
  const collectFrameBinding = (binding: unknown): void => {
    if (
      isRecord(binding) &&
      binding.status === "bound" &&
      isNonEmptyString(binding.frameDefinitionId)
    ) {
      referencedFrameDefinitionIds.add(binding.frameDefinitionId);
    }
  };
  symbols.forEach((entry) => collectFrameBinding(entry.frameBinding));

  const collectDomainFrames = (domain: unknown): void => {
    if (isRecord(domain) && isStringArray(domain.frameDefinitionIds)) {
      domain.frameDefinitionIds.forEach((definitionId) =>
        referencedFrameDefinitionIds.add(definitionId),
      );
    }
  };
  definitions.forEach((entry) => collectDomainFrames(entry.validityDomain));

  const observableById = new Map<string, Record<string, unknown>>();
  observables.forEach((entry, index) => {
    const path = `$.observables[${index}]`;
    exactShape(issues, "observable_shape_invalid", path, entry, [
      "observableId",
      "canonicalObservableId",
      "symbolId",
      "quantity",
      "mathematicalType",
      "unitBinding",
      "frameBinding",
      "operationalDefinitionId",
      "responseModelDefinitionId",
      "validityDomain",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.observableId`, entry.observableId);
    requireNonEmptyString(
      issues,
      `${path}.canonicalObservableId`,
      entry.canonicalObservableId,
    );
    if (!isNonEmptyString(entry.symbolId) || !symbolIds.has(entry.symbolId)) {
      issue(
        issues,
        "reference_unresolved",
        `${path}.symbolId`,
        "must identify a symbol",
      );
    }
    requireNonEmptyString(issues, `${path}.quantity`, entry.quantity);
    if (
      !includes(
        THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES,
        entry.mathematicalType,
      )
    ) {
      issue(
        issues,
        "mathematical_type_invalid",
        `${path}.mathematicalType`,
        "is invalid",
      );
    }
    validateUnitBinding(entry.unitBinding, `${path}.unitBinding`, issues);
    validateFrameBinding(entry.frameBinding, `${path}.frameBinding`, issues);
    collectFrameBinding(entry.frameBinding);
    if (
      !isNonEmptyString(entry.operationalDefinitionId) ||
      !definitionIds.has(entry.operationalDefinitionId)
    ) {
      issue(
        issues,
        "reference_unresolved",
        `${path}.operationalDefinitionId`,
        "must identify an operational definition",
      );
    } else if (
      definitionKinds.get(entry.operationalDefinitionId) !== "operational"
    ) {
      issue(
        issues,
        "operational_definition_kind_invalid",
        `${path}.operationalDefinitionId`,
        "must identify a definition with kind operational",
      );
    }
    if (entry.responseModelDefinitionId !== null) {
      if (
        !isNonEmptyString(entry.responseModelDefinitionId) ||
        !definitionIds.has(entry.responseModelDefinitionId)
      ) {
        issue(
          issues,
          "reference_unresolved",
          `${path}.responseModelDefinitionId`,
          "must identify a definition or be null",
        );
      }
    }
    validateValidityDomain(
      entry.validityDomain,
      `${path}.validityDomain`,
      issues,
    );
    collectDomainFrames(entry.validityDomain);
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );

    const symbol = symbols.find(
      (candidate) => candidate.symbolId === entry.symbolId,
    );
    if (symbol) {
      if (symbol.mathematicalType !== entry.mathematicalType) {
        issue(
          issues,
          "observable_symbol_type_mismatch",
          path,
          "mathematicalType differs from symbol",
        );
      }
      if (!canonicalEqual(symbol.unitBinding, entry.unitBinding)) {
        issue(
          issues,
          "observable_symbol_unit_mismatch",
          path,
          "unit binding differs from symbol",
        );
      }
      if (!canonicalEqual(symbol.frameBinding, entry.frameBinding)) {
        issue(
          issues,
          "observable_symbol_frame_mismatch",
          path,
          "frame binding differs from symbol",
        );
      }
    }
    if (isNonEmptyString(entry.observableId))
      observableById.set(entry.observableId, entry);
  });

  const bridgeById = new Map<string, Record<string, unknown>>();
  bridges.forEach((entry, index) => {
    const path = `$.bridges[${index}]`;
    exactShape(issues, "bridge_shape_invalid", path, entry, [
      "bridgeId",
      "fromObservableId",
      "toObservableId",
      "kind",
      "authority",
      "registration",
      "reversible",
      "inverseBridgeId",
      "assumptionIds",
      "validityDomain",
      "errorContract",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.bridgeId`, entry.bridgeId);
    for (const field of ["fromObservableId", "toObservableId"] as const) {
      if (!isNonEmptyString(entry[field]) || !observableIds.has(entry[field])) {
        issue(
          issues,
          "reference_unresolved",
          `${path}.${field}`,
          "must identify an observable",
        );
      }
    }
    if (
      isNonEmptyString(entry.fromObservableId) &&
      entry.fromObservableId === entry.toObservableId
    ) {
      issue(
        issues,
        "bridge_endpoint_invalid",
        path,
        "bridge endpoints must be distinct",
      );
    }
    if (!includes(THEORY_BADGE_OBSERVABLE_BRIDGE_KINDS, entry.kind)) {
      issue(issues, "bridge_kind_invalid", `${path}.kind`, "is invalid");
    }
    if (entry.authority !== "registered") {
      issue(
        issues,
        "bridge_authority_invalid",
        `${path}.authority`,
        "must be registered",
      );
    }
    if (
      exactShape(
        issues,
        "bridge_registration_shape_invalid",
        `${path}.registration`,
        entry.registration,
        ["graphId", "edgeId", "edgeSemanticSha256"],
      )
    ) {
      requireNonEmptyString(
        issues,
        `${path}.registration.graphId`,
        entry.registration.graphId,
      );
      requireNonEmptyString(
        issues,
        `${path}.registration.edgeId`,
        entry.registration.edgeId,
      );
      requireSha256(
        issues,
        `${path}.registration.edgeSemanticSha256`,
        entry.registration.edgeSemanticSha256,
      );
      if (
        !isRecord(value.world) ||
        value.world.graphId === null ||
        entry.registration.graphId !== value.world.graphId
      ) {
        issue(
          issues,
          "bridge_registration_graph_invalid",
          `${path}.registration.graphId`,
          "must match the bound world graph",
        );
      }
    }
    if (typeof entry.reversible !== "boolean") {
      issue(
        issues,
        "bridge_reversibility_invalid",
        `${path}.reversible`,
        "must be boolean",
      );
    }
    if (entry.inverseBridgeId !== null) {
      if (
        !isNonEmptyString(entry.inverseBridgeId) ||
        !bridgeIds.has(entry.inverseBridgeId)
      ) {
        issue(
          issues,
          "reference_unresolved",
          `${path}.inverseBridgeId`,
          "must identify a bridge or be null",
        );
      }
    }
    if (entry.reversible === true && entry.inverseBridgeId === null) {
      issue(
        issues,
        "bridge_inverse_required",
        `${path}.inverseBridgeId`,
        "reversible bridges require an explicit inverse bridge",
      );
    }
    validateReferenceList(
      entry.assumptionIds,
      `${path}.assumptionIds`,
      issues,
      assumptionIds,
    );
    validateValidityDomain(
      entry.validityDomain,
      `${path}.validityDomain`,
      issues,
    );
    collectDomainFrames(entry.validityDomain);
    if (
      exactShape(
        issues,
        "bridge_error_contract_shape_invalid",
        `${path}.errorContract`,
        entry.errorContract,
        ["kind", "expression"],
      )
    ) {
      if (
        !includes(THEORY_BADGE_OBSERVABLE_ERROR_KINDS, entry.errorContract.kind)
      ) {
        issue(
          issues,
          "bridge_error_kind_invalid",
          `${path}.errorContract.kind`,
          "is invalid",
        );
      }
      if (entry.errorContract.expression !== null) {
        requireNonEmptyString(
          issues,
          `${path}.errorContract.expression`,
          entry.errorContract.expression,
        );
      }
      if (
        entry.errorContract.kind === "exact" &&
        entry.errorContract.expression !== null
      ) {
        issue(
          issues,
          "exact_bridge_error_invalid",
          `${path}.errorContract.expression`,
          "must be null for exact bridges",
        );
      }
      if (
        ["calibrated_response", "coarse_graining", "approximation"].includes(
          String(entry.kind),
        ) &&
        (entry.errorContract.kind === "exact" ||
          !isNonEmptyString(entry.errorContract.expression))
      ) {
        issue(
          issues,
          "bridge_error_contract_missing",
          `${path}.errorContract`,
          "calibrated, coarse-graining, and approximate bridges require bounded/statistical error",
        );
      }
      if (
        ["identity", "unit_conversion"].includes(String(entry.kind)) &&
        entry.errorContract.kind !== "exact"
      ) {
        issue(
          issues,
          "exact_bridge_required",
          `${path}.errorContract.kind`,
          "must be exact",
        );
      }
    }
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );

    const from = observableById.get(String(entry.fromObservableId));
    const to = observableById.get(String(entry.toObservableId));
    if (from && to) {
      const fromUnit = isRecord(from.unitBinding) ? from.unitBinding : null;
      const toUnit = isRecord(to.unitBinding) ? to.unitBinding : null;
      const fromDimensions = fromUnit?.dimensions;
      const toDimensions = toUnit?.dimensions;
      if (
        ["identity", "unit_conversion", "coordinate_transform"].includes(
          String(entry.kind),
        ) &&
        !canonicalEqual(fromDimensions, toDimensions)
      ) {
        issue(
          issues,
          "bridge_dimension_mismatch",
          path,
          "bridge endpoints must have matching dimensions",
        );
      }
      if (entry.kind === "identity") {
        if (from.canonicalObservableId !== to.canonicalObservableId) {
          issue(
            issues,
            "identity_bridge_observable_mismatch",
            path,
            "canonical observable IDs must match",
          );
        }
        if (
          !canonicalEqual(from.unitBinding, to.unitBinding) ||
          !canonicalEqual(from.frameBinding, to.frameBinding)
        ) {
          issue(
            issues,
            "identity_bridge_binding_mismatch",
            path,
            "identity endpoints must share unit and frame",
          );
        }
      }
    }
    if (isNonEmptyString(entry.bridgeId)) bridgeById.set(entry.bridgeId, entry);
  });

  for (const [bridgeId, bridge] of bridgeById.entries()) {
    if (bridge.reversible !== true || !isNonEmptyString(bridge.inverseBridgeId))
      continue;
    const inverse = bridgeById.get(bridge.inverseBridgeId);
    if (
      !inverse ||
      inverse.fromObservableId !== bridge.toObservableId ||
      inverse.toObservableId !== bridge.fromObservableId ||
      inverse.inverseBridgeId !== bridgeId
    ) {
      issue(
        issues,
        "bridge_inverse_invalid",
        `$.bridges.${bridgeId}`,
        "inverse must reverse endpoints and point back to this bridge",
      );
    }
  }

  blockers.forEach((entry, index) => {
    const path = `$.blockers[${index}]`;
    exactShape(issues, "blocker_shape_invalid", path, entry, [
      "blockerId",
      "kind",
      "description",
      "claimIds",
      "resolutionRequirement",
      "provenanceIds",
    ]);
    requireNonEmptyString(issues, `${path}.blockerId`, entry.blockerId);
    if (!includes(CASIMIR_SPEC_BLOCKER_KINDS, entry.kind)) {
      issue(issues, "blocker_kind_invalid", `${path}.kind`, "is invalid");
    }
    requireNonEmptyString(issues, `${path}.description`, entry.description);
    validateReferenceList(
      entry.claimIds,
      `${path}.claimIds`,
      issues,
      claimIds,
      { nonEmpty: true },
    );
    requireNonEmptyString(
      issues,
      `${path}.resolutionRequirement`,
      entry.resolutionRequirement,
    );
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
    );
  });

  const excludedKindById = new Map<string, unknown>();
  excludedClaims.forEach((entry, index) => {
    const path = `$.excludedClaims[${index}]`;
    exactShape(issues, "excluded_claim_shape_invalid", path, entry, [
      "excludedClaimId",
      "kind",
      "statement",
      "reason",
      "requiredEvidenceKinds",
    ]);
    requireNonEmptyString(
      issues,
      `${path}.excludedClaimId`,
      entry.excludedClaimId,
    );
    if (!includes(CASIMIR_SPEC_EXCLUDED_CLAIM_KINDS, entry.kind)) {
      issue(
        issues,
        "excluded_claim_kind_invalid",
        `${path}.kind`,
        "is invalid",
      );
    }
    requireNonEmptyString(issues, `${path}.statement`, entry.statement);
    requireNonEmptyString(issues, `${path}.reason`, entry.reason);
    requireSortedUniqueStrings(
      issues,
      `${path}.requiredEvidenceKinds`,
      entry.requiredEvidenceKinds,
      {
        nonEmpty: true,
      },
    );
    if (isNonEmptyString(entry.excludedClaimId))
      excludedKindById.set(entry.excludedClaimId, entry.kind);
  });

  const provenanceKindById = new Map<string, unknown>(
    provenance
      .filter((entry) => isNonEmptyString(entry.provenanceId))
      .map((entry) => [entry.provenanceId as string, entry.kind]),
  );
  const blockerById = new Map<string, Record<string, unknown>>(
    blockers
      .filter((entry) => isNonEmptyString(entry.blockerId))
      .map((entry) => [entry.blockerId as string, entry]),
  );
  if (claims.length === 0) {
    issue(
      issues,
      "claim_required",
      "$.claims",
      "at least one claim is required",
    );
  }
  if (foundations.length === 0) {
    issue(
      issues,
      "foundation_required",
      "$.foundations",
      "at least one foundation is required",
    );
  }

  claims.forEach((entry, index) => {
    const path = `$.claims[${index}]`;
    exactShape(issues, "claim_shape_invalid", path, entry, [
      "claimId",
      "name",
      "displayStatement",
      "proposition",
      "propositionSha256",
      "foundationId",
      "definitionIds",
      "assumptionIds",
      "allowedAxiomIds",
      "symbolIds",
      "observableIds",
      "bridgeIds",
      "excludedClaimIds",
      "provenanceIds",
      "sourceMap",
      "axes",
      "maturityCeiling",
    ]);
    requireNonEmptyString(issues, `${path}.claimId`, entry.claimId);
    requireNonEmptyString(issues, `${path}.name`, entry.name);
    requireNonEmptyString(
      issues,
      `${path}.displayStatement`,
      entry.displayStatement,
    );
    requireSha256(issues, `${path}.propositionSha256`, entry.propositionSha256);
    validateExpression(
      entry.proposition,
      `${path}.proposition`,
      issues,
      expressionRefs,
      { nodes: 0 },
    );
    if (
      !isNonEmptyString(entry.foundationId) ||
      !foundationIds.has(entry.foundationId)
    ) {
      issue(
        issues,
        "reference_unresolved",
        `${path}.foundationId`,
        "must identify a foundation",
      );
    }
    validateReferenceList(
      entry.definitionIds,
      `${path}.definitionIds`,
      issues,
      definitionIds,
      {
        nonEmpty: true,
      },
    );
    validateReferenceList(
      entry.assumptionIds,
      `${path}.assumptionIds`,
      issues,
      assumptionIds,
    );
    const allowedAxiomsValid = validateReferenceList(
      entry.allowedAxiomIds,
      `${path}.allowedAxiomIds`,
      issues,
      axiomIds,
    );
    if (allowedAxiomsValid && isNonEmptyString(entry.foundationId)) {
      const allowedAxiomIds = isStringArray(entry.allowedAxiomIds)
        ? entry.allowedAxiomIds
        : [];
      allowedAxiomIds.forEach((axiomId) => {
        const axiomFoundationId = axiomsById.get(axiomId)?.foundationId;
        if (axiomFoundationId !== entry.foundationId) {
          issue(
            issues,
            "claim_axiom_foundation_mismatch",
            `${path}.allowedAxiomIds`,
            `${axiomId} belongs to ${String(axiomFoundationId)}, not ${entry.foundationId}`,
          );
        }
      });
    }
    validateReferenceList(
      entry.symbolIds,
      `${path}.symbolIds`,
      issues,
      symbolIds,
      { nonEmpty: true },
    );
    validateReferenceList(
      entry.observableIds,
      `${path}.observableIds`,
      issues,
      observableIds,
    );
    validateReferenceList(
      entry.bridgeIds,
      `${path}.bridgeIds`,
      issues,
      bridgeIds,
    );
    if (
      validateReferenceList(
        entry.excludedClaimIds,
        `${path}.excludedClaimIds`,
        issues,
        excludedClaimIds,
        { nonEmpty: true },
      )
    ) {
      const includedKinds = new Set(
        entry.excludedClaimIds.map((id) => excludedKindById.get(id)),
      );
      for (const requiredKind of CASIMIR_SPEC_REQUIRED_EXCLUDED_CLAIM_KINDS) {
        if (!includedKinds.has(requiredKind)) {
          issue(
            issues,
            "excluded_claims_incomplete",
            `${path}.excludedClaimIds`,
            `must include an exclusion of kind ${requiredKind}`,
          );
        }
      }
    }
    validateReferenceList(
      entry.provenanceIds,
      `${path}.provenanceIds`,
      issues,
      provenanceIds,
      {
        nonEmpty: true,
      },
    );

    const usedRefs = newExpressionReferenceSet();
    collectExpressionReferenceIds(entry.proposition, usedRefs);
    const requiredDefinitionSeeds = new Set(usedRefs.definitionIds);
    const requiredSymbolIds = new Set(usedRefs.symbolIds);
    const requiredAssumptionIds = new Set(usedRefs.assumptionIds);
    const addRequiredSymbol = (symbolId: string): void => {
      requiredSymbolIds.add(symbolId);
      addSymbolDefinitionDependencies(null, symbolId, requiredDefinitionSeeds);
    };
    usedRefs.symbolIds.forEach(addRequiredSymbol);

    const declaredAllowedAxiomIds = isStringArray(entry.allowedAxiomIds)
      ? entry.allowedAxiomIds
      : [];
    for (const axiomId of declaredAllowedAxiomIds) {
      const axiomRefs = newExpressionReferenceSet();
      collectExpressionReferenceIds(
        axiomsById.get(axiomId)?.typeExpression,
        axiomRefs,
      );
      axiomRefs.definitionIds.forEach((definitionId) =>
        requiredDefinitionSeeds.add(definitionId),
      );
      axiomRefs.symbolIds.forEach(addRequiredSymbol);
    }

    const declaredObservableIds = new Set(
      isStringArray(entry.observableIds) ? entry.observableIds : [],
    );
    const requiredObservableIds = new Set(declaredObservableIds);
    const declaredBridgeIds = isStringArray(entry.bridgeIds)
      ? entry.bridgeIds
      : [];
    for (const bridgeId of declaredBridgeIds) {
      const bridge = bridgesById.get(bridgeId);
      for (const endpointField of [
        "fromObservableId",
        "toObservableId",
      ] as const) {
        const observableId = bridge?.[endpointField];
        if (!isNonEmptyString(observableId)) continue;
        requiredObservableIds.add(observableId);
        if (!declaredObservableIds.has(observableId)) {
          issue(
            issues,
            "claim_bridge_observable_dependency_undeclared",
            `${path}.observableIds`,
            `${bridgeId} requires endpoint ${observableId}`,
          );
        }
      }
      if (isStringArray(bridge?.assumptionIds)) {
        bridge.assumptionIds.forEach((assumptionId) =>
          requiredAssumptionIds.add(assumptionId),
        );
      }
      const bridgeDomain = bridge?.validityDomain;
      if (
        isRecord(bridgeDomain) &&
        isStringArray(bridgeDomain.frameDefinitionIds)
      ) {
        bridgeDomain.frameDefinitionIds.forEach((definitionId) =>
          requiredDefinitionSeeds.add(definitionId),
        );
      }
    }

    for (const observableId of requiredObservableIds) {
      const observable = observablesById.get(observableId);
      if (isNonEmptyString(observable?.symbolId)) {
        addRequiredSymbol(observable.symbolId);
      }
      for (const definitionField of [
        "operationalDefinitionId",
        "responseModelDefinitionId",
      ] as const) {
        const definitionId = observable?.[definitionField];
        if (isNonEmptyString(definitionId)) {
          requiredDefinitionSeeds.add(definitionId);
        }
      }
      const frameBinding = observable?.frameBinding;
      if (
        isRecord(frameBinding) &&
        frameBinding.status === "bound" &&
        isNonEmptyString(frameBinding.frameDefinitionId)
      ) {
        requiredDefinitionSeeds.add(frameBinding.frameDefinitionId);
      }
      const observableDomain = observable?.validityDomain;
      if (
        isRecord(observableDomain) &&
        isStringArray(observableDomain.frameDefinitionIds)
      ) {
        observableDomain.frameDefinitionIds.forEach((definitionId) =>
          requiredDefinitionSeeds.add(definitionId),
        );
      }
    }

    let requiredDefinitionIds = collectDefinitionClosure(
      requiredDefinitionSeeds,
    );
    let dependencyCount = -1;
    while (
      dependencyCount !==
      requiredDefinitionIds.size + requiredAssumptionIds.size
    ) {
      dependencyCount = requiredDefinitionIds.size + requiredAssumptionIds.size;
      for (const definitionId of requiredDefinitionIds) {
        const definition = definitionsById.get(definitionId);
        const definitionRefs = newExpressionReferenceSet();
        collectExpressionReferenceIds(definition?.expression, definitionRefs);
        definitionRefs.symbolIds.forEach(addRequiredSymbol);
        if (isStringArray(definition?.assumptionIds)) {
          definition.assumptionIds.forEach((assumptionId) =>
            requiredAssumptionIds.add(assumptionId),
          );
        }
      }
      for (const assumptionId of requiredAssumptionIds) {
        const assumptionRefs = newExpressionReferenceSet();
        collectExpressionReferenceIds(
          assumptionsById.get(assumptionId)?.proposition,
          assumptionRefs,
        );
        assumptionRefs.symbolIds.forEach(addRequiredSymbol);
        assumptionRefs.definitionIds.forEach((definitionId) =>
          requiredDefinitionSeeds.add(definitionId),
        );
      }
      requiredDefinitionIds = collectDefinitionClosure(requiredDefinitionSeeds);
    }

    const requireExactClaimDependencies = (
      field:
        "symbolIds" | "definitionIds" | "assumptionIds" | "allowedAxiomIds",
      required: Set<string>,
      missingCode: string,
      extraCode: string,
    ): void => {
      const declared = new Set(isStringArray(entry[field]) ? entry[field] : []);
      for (const referencedId of required) {
        if (!declared.has(referencedId)) {
          issue(
            issues,
            missingCode,
            `${path}.${field}`,
            `semantic dependency closure requires ${referencedId}`,
          );
        }
      }
      for (const declaredId of declared) {
        if (!required.has(declaredId)) {
          issue(
            issues,
            extraCode,
            `${path}.${field}`,
            `${declaredId} is not in the semantic dependency closure`,
          );
        }
      }
    };
    requireExactClaimDependencies(
      "symbolIds",
      requiredSymbolIds,
      "claim_symbol_dependency_undeclared",
      "claim_symbol_dependency_unreferenced",
    );
    requireExactClaimDependencies(
      "definitionIds",
      requiredDefinitionIds,
      "claim_definition_dependency_undeclared",
      "claim_definition_dependency_unreferenced",
    );
    requireExactClaimDependencies(
      "assumptionIds",
      requiredAssumptionIds,
      "claim_assumption_dependency_undeclared",
      "claim_assumption_dependency_unreferenced",
    );
    const declaredAllowedAxioms = new Set(declaredAllowedAxiomIds);
    for (const axiomId of usedRefs.axiomIds) {
      if (!declaredAllowedAxioms.has(axiomId)) {
        issue(
          issues,
          "claim_axiom_dependency_undeclared",
          `${path}.allowedAxiomIds`,
          `proposition references ${axiomId} outside the exact allowlist`,
        );
      }
    }

    const collectExpressionSemanticClosure = (
      expression: unknown,
    ): { definitionIds: Set<string>; symbolIds: Set<string> } => {
      const expressionRefs = newExpressionReferenceSet();
      collectExpressionReferenceIds(expression, expressionRefs);
      const definitionSeeds = new Set(expressionRefs.definitionIds);
      const collectedSymbolIds = new Set<string>();
      const collectedAssumptionIds = new Set(expressionRefs.assumptionIds);
      const addSymbol = (symbolId: string): void => {
        collectedSymbolIds.add(symbolId);
        addSymbolDefinitionDependencies(null, symbolId, definitionSeeds);
      };
      expressionRefs.symbolIds.forEach(addSymbol);
      expressionRefs.axiomIds.forEach((axiomId) => {
        const axiomRefs = newExpressionReferenceSet();
        collectExpressionReferenceIds(
          axiomsById.get(axiomId)?.typeExpression,
          axiomRefs,
        );
        axiomRefs.definitionIds.forEach((definitionId) =>
          definitionSeeds.add(definitionId),
        );
        axiomRefs.symbolIds.forEach(addSymbol);
      });

      let collectedDefinitionIds = collectDefinitionClosure(definitionSeeds);
      let previousSize = -1;
      while (
        previousSize !==
        collectedDefinitionIds.size +
          collectedAssumptionIds.size +
          collectedSymbolIds.size
      ) {
        previousSize =
          collectedDefinitionIds.size +
          collectedAssumptionIds.size +
          collectedSymbolIds.size;
        for (const definitionId of collectedDefinitionIds) {
          const definition = definitionsById.get(definitionId);
          const definitionRefs = newExpressionReferenceSet();
          collectExpressionReferenceIds(definition?.expression, definitionRefs);
          definitionRefs.symbolIds.forEach(addSymbol);
          if (isStringArray(definition?.assumptionIds)) {
            definition.assumptionIds.forEach((assumptionId) =>
              collectedAssumptionIds.add(assumptionId),
            );
          }
        }
        for (const assumptionId of collectedAssumptionIds) {
          const assumptionRefs = newExpressionReferenceSet();
          collectExpressionReferenceIds(
            assumptionsById.get(assumptionId)?.proposition,
            assumptionRefs,
          );
          assumptionRefs.definitionIds.forEach((definitionId) =>
            definitionSeeds.add(definitionId),
          );
          assumptionRefs.symbolIds.forEach(addSymbol);
        }
        collectedDefinitionIds = collectDefinitionClosure(definitionSeeds);
      }
      return {
        definitionIds: collectedDefinitionIds,
        symbolIds: collectedSymbolIds,
      };
    };

    if (!Array.isArray(entry.sourceMap) || entry.sourceMap.length === 0) {
      issue(
        issues,
        "claim_source_map_required",
        `${path}.sourceMap`,
        "must be a non-empty array",
      );
    } else {
      requireSortedById(issues, `${path}.sourceMap`, entry.sourceMap, "mapId");
      entry.sourceMap.forEach((rawMap, mapIndex) => {
        const mapPath = `${path}.sourceMap[${mapIndex}]`;
        if (
          !exactShape(
            issues,
            "claim_source_map_shape_invalid",
            mapPath,
            rawMap,
            [
              "mapId",
              "displayFragment",
              "expressionPath",
              "definitionIds",
              "symbolIds",
            ],
          )
        ) {
          return;
        }
        requireNonEmptyString(issues, `${mapPath}.mapId`, rawMap.mapId);
        requireNonEmptyString(
          issues,
          `${mapPath}.displayFragment`,
          rawMap.displayFragment,
        );
        let sourceMapTarget: unknown = undefined;
        let sourceMapTargetClosure: {
          definitionIds: Set<string>;
          symbolIds: Set<string>;
        } | null = null;
        if (
          !isNonEmptyString(rawMap.expressionPath) ||
          !rawMap.expressionPath.startsWith("/")
        ) {
          issue(
            issues,
            "expression_path_invalid",
            `${mapPath}.expressionPath`,
            "must be a JSON-pointer-like path beginning with /",
          );
        } else {
          const resolved = resolveExpressionPath(
            entry.proposition,
            rawMap.expressionPath,
          );
          sourceMapTarget = resolved.value;
          if (!resolved.found) {
            issue(
              issues,
              "claim_source_map_path_unresolved",
              `${mapPath}.expressionPath`,
              "must resolve to a node in the authoritative proposition AST",
            );
          } else if (
            !isRecord(sourceMapTarget) ||
            ![
              "symbol_ref",
              "definition_ref",
              "assumption_ref",
              "axiom_ref",
              "rational_literal",
              "apply",
              "binder",
            ].includes(String(sourceMapTarget.kind))
          ) {
            issue(
              issues,
              "claim_source_map_target_not_expression",
              `${mapPath}.expressionPath`,
              "must select an expression node rather than a primitive field or container",
            );
          } else {
            sourceMapTargetClosure =
              collectExpressionSemanticClosure(sourceMapTarget);
          }
        }
        validateReferenceList(
          rawMap.definitionIds,
          `${mapPath}.definitionIds`,
          issues,
          definitionIds,
        );
        validateReferenceList(
          rawMap.symbolIds,
          `${mapPath}.symbolIds`,
          issues,
          symbolIds,
        );
        const mapDefinitionIds = isStringArray(rawMap.definitionIds)
          ? rawMap.definitionIds
          : [];
        const mapSymbolIds = isStringArray(rawMap.symbolIds)
          ? rawMap.symbolIds
          : [];
        if (mapDefinitionIds.length + mapSymbolIds.length === 0) {
          issue(
            issues,
            "claim_source_map_anchor_required",
            mapPath,
            "must include at least one definition or symbol anchor",
          );
        }
        for (const definitionId of mapDefinitionIds) {
          if (
            sourceMapTargetClosure &&
            !sourceMapTargetClosure.definitionIds.has(definitionId)
          ) {
            issue(
              issues,
              "claim_source_map_anchor_out_of_subtree",
              `${mapPath}.definitionIds`,
              `${definitionId} is outside the selected expression subtree closure`,
            );
          }
        }
        for (const symbolId of mapSymbolIds) {
          if (
            sourceMapTargetClosure &&
            !sourceMapTargetClosure.symbolIds.has(symbolId)
          ) {
            issue(
              issues,
              "claim_source_map_anchor_out_of_subtree",
              `${mapPath}.symbolIds`,
              `${symbolId} is outside the selected expression subtree closure`,
            );
          }
        }
      });
    }

    if (
      !exactShape(
        issues,
        "claim_axes_shape_invalid",
        `${path}.axes`,
        entry.axes,
        ["logical", "computational", "scientific", "coverage"],
      )
    ) {
      return;
    }
    const logical = entry.axes.logical;
    if (
      exactShape(
        issues,
        "logical_axis_shape_invalid",
        `${path}.axes.logical`,
        logical,
        ["declaration", "resolution"],
      )
    ) {
      if (!["conjecture", "theorem"].includes(String(logical.declaration))) {
        issue(
          issues,
          "logical_declaration_invalid",
          `${path}.axes.logical.declaration`,
          "is invalid",
        );
      }
      if (logical.resolution !== "unassessed") {
        issue(
          issues,
          "logical_resolution_external_certificate_required",
          `${path}.axes.logical.resolution`,
          "source IR resolution must be unassessed; proof/refutation/independence require an external certificate",
        );
      }
    }

    const computational = entry.axes.computational;
    let computationalStatus: unknown = null;
    if (
      exactShape(
        issues,
        "computational_axis_shape_invalid",
        `${path}.axes.computational`,
        computational,
        ["status", "reason", "blockerIds"],
      )
    ) {
      computationalStatus = computational.status;
      if (
        !includes(CASIMIR_SPEC_COMPUTATIONAL_STATUSES, computational.status)
      ) {
        issue(
          issues,
          "computational_status_invalid",
          `${path}.axes.computational.status`,
          "is invalid",
        );
      }
      if (computational.status === "executable") {
        issue(
          issues,
          "executable_requires_external_semantic_admission",
          `${path}.axes.computational.status`,
          "source IR cannot self-declare executable before operator signature, type, dimension, unit, and frame admission",
        );
      }
      const computationalBlockersValid = validateReferenceList(
        computational.blockerIds,
        `${path}.axes.computational.blockerIds`,
        issues,
        blockerIds,
      );
      const computationalBlockerIds = isStringArray(computational.blockerIds)
        ? computational.blockerIds
        : [];
      if (computational.status === "executable") {
        if (
          computational.reason !== null ||
          (Array.isArray(computational.blockerIds) &&
            computational.blockerIds.length > 0)
        ) {
          issue(
            issues,
            "executable_axis_payload_invalid",
            `${path}.axes.computational`,
            "executable requires null reason and no blockers",
          );
        }
      } else {
        requireNonEmptyString(
          issues,
          `${path}.axes.computational.reason`,
          computational.reason,
        );
        if (
          ["partial", "reference_only", "unassessed"].includes(
            String(computational.status),
          ) &&
          Array.isArray(computational.blockerIds) &&
          computational.blockerIds.length === 0
        ) {
          issue(
            issues,
            "computational_blocker_required",
            `${path}.axes.computational.blockerIds`,
            `${String(computational.status)} requires a blocker`,
          );
        }
      }
      if (computationalBlockersValid && isNonEmptyString(entry.claimId)) {
        const claimId = entry.claimId;
        computationalBlockerIds.forEach((blockerId) => {
          const blocker = blockerById.get(blockerId);
          if (
            !isStringArray(blocker?.claimIds) ||
            !blocker.claimIds.includes(claimId)
          ) {
            issue(
              issues,
              "blocker_claim_binding_invalid",
              `${path}.axes.computational.blockerIds`,
              `${blockerId} must name this claim`,
            );
          }
        });
      }
    }

    const scientific = entry.axes.scientific;
    if (
      exactShape(
        issues,
        "scientific_axis_shape_invalid",
        `${path}.axes.scientific`,
        scientific,
        ["status", "receiptProvenanceIds"],
      )
    ) {
      if (!includes(CASIMIR_SPEC_SCIENTIFIC_STATUSES, scientific.status)) {
        issue(
          issues,
          "scientific_status_invalid",
          `${path}.axes.scientific.status`,
          "is invalid",
        );
      }
      if (["measured", "calibrated"].includes(String(scientific.status))) {
        issue(
          issues,
          "scientific_status_external_receipt_required",
          `${path}.axes.scientific.status`,
          "source IR cannot self-promote measured or calibrated status; a verified external receipt projection is required",
        );
      }
      if (scientific.status === "formal_model_consequence") {
        issue(
          issues,
          "scientific_status_external_formal_certificate_required",
          `${path}.axes.scientific.status`,
          "source IR cannot self-promote formal-model consequence status; a verified external proof certificate projection is required",
        );
      }
      if (
        validateReferenceList(
          scientific.receiptProvenanceIds,
          `${path}.axes.scientific.receiptProvenanceIds`,
          issues,
          provenanceIds,
        )
      ) {
        if (["measured", "calibrated"].includes(String(scientific.status))) {
          if (scientific.receiptProvenanceIds.length === 0) {
            issue(
              issues,
              "scientific_receipt_required",
              `${path}.axes.scientific.receiptProvenanceIds`,
              `${String(scientific.status)} requires observation receipts`,
            );
          }
          scientific.receiptProvenanceIds.forEach((provenanceId) => {
            if (
              provenanceKindById.get(provenanceId) !== "observation_receipt"
            ) {
              issue(
                issues,
                "scientific_receipt_kind_invalid",
                `${path}.axes.scientific.receiptProvenanceIds`,
                `${provenanceId} is not an observation receipt`,
              );
            }
          });
        } else if (scientific.receiptProvenanceIds.length > 0) {
          issue(
            issues,
            "scientific_receipt_scope_invalid",
            `${path}.axes.scientific.receiptProvenanceIds`,
            "only measured or calibrated status may consume observation receipts",
          );
        }
      }
    }

    const coverage = entry.axes.coverage;
    if (
      exactShape(
        issues,
        "coverage_axis_shape_invalid",
        `${path}.axes.coverage`,
        coverage,
        ["status", "blockerIds"],
      )
    ) {
      if (!includes(CASIMIR_SPEC_COVERAGE_STATUSES, coverage.status)) {
        issue(
          issues,
          "coverage_status_invalid",
          `${path}.axes.coverage.status`,
          "is invalid",
        );
      }
      if (coverage.status === "represented") {
        issue(
          issues,
          "represented_coverage_requires_external_semantic_admission",
          `${path}.axes.coverage.status`,
          "source IR cannot self-attest graph representation before external semantic admission",
        );
      }
      const coverageBlockersValid = validateReferenceList(
        coverage.blockerIds,
        `${path}.axes.coverage.blockerIds`,
        issues,
        blockerIds,
      );
      const coverageBlockerIds = isStringArray(coverage.blockerIds)
        ? coverage.blockerIds
        : [];
      if (coverage.status === "represented") {
        if (
          Array.isArray(coverage.blockerIds) &&
          coverage.blockerIds.length > 0
        ) {
          issue(
            issues,
            "represented_coverage_blocker_invalid",
            `${path}.axes.coverage.blockerIds`,
            "must be empty",
          );
        }
        if (
          !isRecord(value.world) ||
          !isNonEmptyString(value.world.graphId) ||
          !Array.isArray(value.world.badgeIds) ||
          value.world.badgeIds.length === 0
        ) {
          issue(
            issues,
            "represented_coverage_graph_binding_missing",
            `${path}.axes.coverage`,
            "represented coverage requires a graph and at least one badge",
          );
        }
      } else if (
        Array.isArray(coverage.blockerIds) &&
        coverage.blockerIds.length === 0
      ) {
        issue(
          issues,
          "coverage_blocker_required",
          `${path}.axes.coverage.blockerIds`,
          `${String(coverage.status)} requires a blocker`,
        );
      }
      if (coverageBlockersValid && isNonEmptyString(entry.claimId)) {
        const claimId = entry.claimId;
        coverageBlockerIds.forEach((blockerId) => {
          const blocker = blockerById.get(blockerId);
          if (
            !isStringArray(blocker?.claimIds) ||
            !blocker.claimIds.includes(claimId)
          ) {
            issue(
              issues,
              "blocker_claim_binding_invalid",
              `${path}.axes.coverage.blockerIds`,
              `${blockerId} must name this claim`,
            );
          }
        });
      }
      if (
        computationalStatus === "executable" &&
        coverage.status !== "represented"
      ) {
        issue(
          issues,
          "coverage_claim_inconsistent",
          `${path}.axes`,
          "executable claims require represented coverage",
        );
      }
    }

    if (
      computationalStatus === "executable" &&
      isStringArray(entry.symbolIds)
    ) {
      entry.symbolIds.forEach((symbolId) => {
        const symbol = symbols.find(
          (candidate) => candidate.symbolId === symbolId,
        );
        if (
          isRecord(symbol?.unitBinding) &&
          symbol.unitBinding.status === "unresolved"
        ) {
          issue(
            issues,
            "executable_unit_unresolved",
            `${path}.symbolIds`,
            `${symbolId} has unresolved units`,
          );
        }
        if (
          isRecord(symbol?.frameBinding) &&
          symbol.frameBinding.status === "unresolved"
        ) {
          issue(
            issues,
            "executable_frame_unresolved",
            `${path}.symbolIds`,
            `${symbolId} has unresolved frame`,
          );
        }
      });
    }
    if (!includes(CASIMIR_SPEC_MATURITY_LEVELS, entry.maturityCeiling)) {
      issue(
        issues,
        "maturity_ceiling_invalid",
        `${path}.maturityCeiling`,
        "is invalid",
      );
    }
  });

  symbols.forEach((symbol, index) => {
    if (
      !isNonEmptyString(symbol.symbolId) ||
      !isNonEmptyString(symbol.definitionId)
    )
      return;
    const definition = definitions.find(
      (candidate) => candidate.definitionId === symbol.definitionId,
    );
    if (
      !isStringArray(definition?.definesSymbolIds) ||
      !definition.definesSymbolIds.includes(symbol.symbolId)
    ) {
      issue(
        issues,
        "definition_symbol_binding_invalid",
        `$.symbols[${index}].definitionId`,
        `${symbol.definitionId} must list ${symbol.symbolId}`,
      );
    }
  });

  for (const definitionId of referencedFrameDefinitionIds) {
    if (!definitionIds.has(definitionId)) {
      issue(
        issues,
        "reference_unresolved",
        "$.frameBindings",
        `missing frame definition ${definitionId}`,
      );
    } else if (definitionKinds.get(definitionId) !== "frame") {
      issue(
        issues,
        "frame_definition_kind_invalid",
        "$.frameBindings",
        `${definitionId} must have definition kind frame`,
      );
    }
  }

  if (
    exactShape(
      issues,
      "claim_boundary_shape_invalid",
      "$.claimBoundary",
      value.claimBoundary,
      [
        "semanticSpecificationOnly",
        "externalSemanticAdmissionRequired",
        "proofStatusRequiresExternalCertificate",
        "empiricalStatusRequiresExternalReceipt",
        "humanRenderingAuthority",
        "semanticIdentityAuthority",
        "executesTools",
        "validatesTheory",
        "validatesPhysicalMechanism",
        "proofAuthority",
        "empiricalAuthority",
        "implementationCorrectnessAuthority",
        "promotionAllowed",
        "assistantAnswer",
        "terminalEligible",
        "postToolModelStepRequired",
      ],
    )
  ) {
    for (const field of [
      "semanticSpecificationOnly",
      "externalSemanticAdmissionRequired",
      "proofStatusRequiresExternalCertificate",
      "empiricalStatusRequiresExternalReceipt",
      "postToolModelStepRequired",
    ] as const) {
      if (value.claimBoundary[field] !== true) {
        issue(
          issues,
          "claim_boundary_true_required",
          `$.claimBoundary.${field}`,
          "must be true",
        );
      }
    }
    for (const field of [
      "humanRenderingAuthority",
      "semanticIdentityAuthority",
      "executesTools",
      "validatesTheory",
      "validatesPhysicalMechanism",
      "proofAuthority",
      "empiricalAuthority",
      "implementationCorrectnessAuthority",
      "promotionAllowed",
      "assistantAnswer",
      "terminalEligible",
    ] as const) {
      if (value.claimBoundary[field] !== false) {
        issue(
          issues,
          "claim_boundary_false_required",
          `$.claimBoundary.${field}`,
          "must be false",
        );
      }
    }
  }

  return issues;
}

/** Shape only. Never use this guard as hash, identity, proof, or execution admission. */
export function isCasimirSpecScientificClaimIrStructurallyValidV1(
  value: unknown,
): value is CasimirSpecScientificClaimIrV1 {
  return validateCasimirSpecScientificClaimIrV1(value).length === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto SHA-256 is unavailable");
  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function computeCasimirSpecValueSha256V1(
  value: unknown,
): Promise<string> {
  return sha256Hex(canonicalize(value));
}

export async function computeCasimirSpecScientificClaimIrSemanticSha256V1(
  value: CasimirSpecScientificClaimIrV1,
): Promise<string> {
  const {
    semanticSha256: _semanticSha256,
    artifactSha256: _artifactSha256,
    generatedAt: _generatedAt,
    title: _title,
    source,
    symbols,
    definitions,
    assumptions,
    axiomLedger,
    claims,
    ...semanticPayloadRest
  } = value;
  const semanticPayload = {
    ...semanticPayloadRest,
    source: {
      ...source,
      artifact: { ...source.artifact, path: null },
    },
    symbols: symbols.map(
      ({ localName: _localName, displayName: _displayName, ...symbol }) =>
        symbol,
    ),
    definitions: definitions.map(
      ({ name: _name, display: _display, ...definition }) => definition,
    ),
    assumptions: assumptions.map(
      ({ displayStatement: _displayStatement, ...assumption }) => assumption,
    ),
    axiomLedger: {
      ...axiomLedger,
      entries: axiomLedger.entries.map(
        ({ displayStatement: _displayStatement, ...axiom }) => axiom,
      ),
    },
    claims: claims.map(
      ({
        name: _name,
        displayStatement: _displayStatement,
        sourceMap,
        ...claim
      }) => ({
        ...claim,
        sourceMap: sourceMap.map(
          ({ displayFragment: _displayFragment, ...mapEntry }) => mapEntry,
        ),
      }),
    ),
  };
  return computeCasimirSpecValueSha256V1(semanticPayload);
}

export async function computeCasimirSpecScientificClaimIrArtifactSha256V1(
  value: CasimirSpecScientificClaimIrV1,
): Promise<string> {
  const { artifactSha256: _artifactSha256, ...artifactPayload } = value;
  return computeCasimirSpecValueSha256V1(artifactPayload);
}

/** Hashes without admission. Intended only for fixtures and controlled mutation tests. */
export async function unsafeSealCasimirSpecScientificClaimIrV1(
  value: CasimirSpecScientificClaimIrV1,
): Promise<CasimirSpecScientificClaimIrV1> {
  const definitions = await Promise.all(
    value.definitions.map(async (definition) => ({
      ...definition,
      expressionSha256: await computeCasimirSpecValueSha256V1(
        definition.expression,
      ),
    })),
  );
  const assumptions = await Promise.all(
    value.assumptions.map(async (assumption) => ({
      ...assumption,
      propositionSha256: await computeCasimirSpecValueSha256V1(
        assumption.proposition,
      ),
    })),
  );
  const axiomEntries = await Promise.all(
    value.axiomLedger.entries.map(async (axiom) => ({
      ...axiom,
      typeExpressionSha256: await computeCasimirSpecValueSha256V1(
        axiom.typeExpression,
      ),
    })),
  );
  const claims = await Promise.all(
    value.claims.map(async (claim) => ({
      ...claim,
      propositionSha256: await computeCasimirSpecValueSha256V1(
        claim.proposition,
      ),
    })),
  );
  const unhashed: CasimirSpecScientificClaimIrV1 = {
    ...value,
    semanticSha256: "0".repeat(64),
    artifactSha256: "0".repeat(64),
    definitions,
    assumptions,
    axiomLedger: { ...value.axiomLedger, entries: axiomEntries },
    claims,
  };
  const semanticBound = {
    ...unhashed,
    semanticSha256:
      await computeCasimirSpecScientificClaimIrSemanticSha256V1(unhashed),
  };
  return {
    ...semanticBound,
    artifactSha256:
      await computeCasimirSpecScientificClaimIrArtifactSha256V1(semanticBound),
  };
}

export async function buildCasimirSpecScientificClaimIrV1(
  input: BuildCasimirSpecScientificClaimIrV1Input,
): Promise<CasimirSpecScientificClaimIrV1> {
  const draft: CasimirSpecScientificClaimIrV1 = {
    artifactId: CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_ARTIFACT_ID,
    schemaVersion: CASIMIR_SPEC_SCIENTIFIC_CLAIM_IR_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    specId: input.specId,
    title: input.title,
    semanticSha256: "0".repeat(64),
    artifactSha256: "0".repeat(64),
    source: input.source,
    world: input.world,
    catalogBindings: input.catalogBindings,
    foundations: input.foundations,
    provenanceLedger: input.provenanceLedger,
    symbols: input.symbols,
    definitions: input.definitions.map((definition) => ({
      ...definition,
      expressionSha256: "0".repeat(64),
    })),
    assumptions: input.assumptions.map((assumption) => ({
      ...assumption,
      propositionSha256: "0".repeat(64),
    })),
    axiomLedger: {
      ...input.axiomLedger,
      entries: input.axiomLedger.entries.map((axiom) => ({
        ...axiom,
        typeExpressionSha256: "0".repeat(64),
      })),
    },
    observables: input.observables,
    bridges: input.bridges,
    blockers: input.blockers,
    excludedClaims: input.excludedClaims,
    claims: input.claims.map((claim) => ({
      ...claim,
      propositionSha256: "0".repeat(64),
    })),
    claimBoundary: input.claimBoundary,
  };
  const structuralIssues = validateCasimirSpecScientificClaimIrV1(draft);
  if (structuralIssues.length > 0) {
    throw new Error(
      `Casimir Spec source IR structural admission failed: ${structuralIssues.join(" | ")}`,
    );
  }
  const sealed = await unsafeSealCasimirSpecScientificClaimIrV1(draft);
  const integrityIssues =
    await validateCasimirSpecScientificClaimIrIntegrityV1(sealed);
  if (integrityIssues.length > 0) {
    throw new Error(
      `Casimir Spec source IR integrity admission failed: ${integrityIssues.join(" | ")}`,
    );
  }
  return sealed;
}

export async function validateCasimirSpecScientificClaimIrIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const structuralIssues = validateCasimirSpecScientificClaimIrV1(value);
  if (structuralIssues.length > 0 || !isRecord(value)) return structuralIssues;
  const typed = value as CasimirSpecScientificClaimIrV1;
  const issues: string[] = [];
  try {
    for (const [index, definition] of typed.definitions.entries()) {
      const expected = await computeCasimirSpecValueSha256V1(
        definition.expression,
      );
      if (definition.expressionSha256 !== expected) {
        issue(
          issues,
          "definition_expression_sha256_mismatch",
          `$.definitions[${index}].expressionSha256`,
          `expected ${expected}`,
        );
      }
    }
    for (const [index, assumption] of typed.assumptions.entries()) {
      const expected = await computeCasimirSpecValueSha256V1(
        assumption.proposition,
      );
      if (assumption.propositionSha256 !== expected) {
        issue(
          issues,
          "assumption_proposition_sha256_mismatch",
          `$.assumptions[${index}].propositionSha256`,
          `expected ${expected}`,
        );
      }
    }
    for (const [index, axiom] of typed.axiomLedger.entries.entries()) {
      const expected = await computeCasimirSpecValueSha256V1(
        axiom.typeExpression,
      );
      if (axiom.typeExpressionSha256 !== expected) {
        issue(
          issues,
          "axiom_type_expression_sha256_mismatch",
          `$.axiomLedger.entries[${index}].typeExpressionSha256`,
          `expected ${expected}`,
        );
      }
    }
    for (const [index, claim] of typed.claims.entries()) {
      const expected = await computeCasimirSpecValueSha256V1(claim.proposition);
      if (claim.propositionSha256 !== expected) {
        issue(
          issues,
          "claim_proposition_sha256_mismatch",
          `$.claims[${index}].propositionSha256`,
          `expected ${expected}`,
        );
      }
    }
    const expectedSemanticSha256 =
      await computeCasimirSpecScientificClaimIrSemanticSha256V1(typed);
    if (typed.semanticSha256 !== expectedSemanticSha256) {
      issue(
        issues,
        "ir_semantic_sha256_mismatch",
        "$.semanticSha256",
        `expected ${expectedSemanticSha256}`,
      );
    }
    const expectedArtifactSha256 =
      await computeCasimirSpecScientificClaimIrArtifactSha256V1(typed);
    if (typed.artifactSha256 !== expectedArtifactSha256) {
      issue(
        issues,
        "ir_artifact_sha256_mismatch",
        "$.artifactSha256",
        `expected ${expectedArtifactSha256}`,
      );
    }
  } catch (error) {
    issue(
      issues,
      "integrity_hashing_failed",
      "$",
      error instanceof Error ? error.message : String(error),
    );
  }
  return issues;
}

export async function isCasimirSpecScientificClaimIrIntegrityValidV1(
  value: unknown,
): Promise<boolean> {
  return (
    (await validateCasimirSpecScientificClaimIrIntegrityV1(value)).length === 0
  );
}

export async function verifyCasimirSpecScientificClaimIrSemanticCommitmentV1(
  value: unknown,
  expectedSemanticSha256: string,
): Promise<string[]> {
  const issues = await validateCasimirSpecScientificClaimIrIntegrityV1(value);
  if (!SHA256.test(expectedSemanticSha256)) {
    issue(
      issues,
      "external_commitment_sha256_invalid",
      "$expectedSemanticSha256",
      "must be a lowercase SHA-256 hex string",
    );
    return issues;
  }
  if (isRecord(value) && value.semanticSha256 !== expectedSemanticSha256) {
    issue(
      issues,
      "ir_external_commitment_sha256_mismatch",
      "$.semanticSha256",
      `expected external commitment ${expectedSemanticSha256}`,
    );
  }
  return issues;
}

export async function verifyCasimirSpecScientificClaimIrCommitmentsV1(
  value: unknown,
  expected: { semanticSha256: string; artifactSha256: string },
): Promise<string[]> {
  const issues = await verifyCasimirSpecScientificClaimIrSemanticCommitmentV1(
    value,
    expected.semanticSha256,
  );
  if (!SHA256.test(expected.artifactSha256)) {
    issue(
      issues,
      "external_artifact_commitment_sha256_invalid",
      "$expected.artifactSha256",
      "must be a lowercase SHA-256 hex string",
    );
    return issues;
  }
  if (isRecord(value) && value.artifactSha256 !== expected.artifactSha256) {
    issue(
      issues,
      "ir_external_artifact_commitment_sha256_mismatch",
      "$.artifactSha256",
      `expected external artifact commitment ${expected.artifactSha256}`,
    );
  }
  return issues;
}
