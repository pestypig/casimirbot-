export const THEORY_MASTER_PROBLEM_ARTIFACT_ID = "theory_master_problem" as const;
export const THEORY_MASTER_PROBLEM_SCHEMA_VERSION = "theory_master_problem/v1" as const;

export const THEORY_MASTER_PROBLEM_OPERATIONS = [
  "compare",
  "predict",
  "derive",
  "explain",
  "prove",
  "bound",
] as const;

export const THEORY_MASTER_PROBLEM_COMPILE_STATUSES = [
  "executable",
  "partially_executable",
  "unidentifiable",
  "missing_bridge_relation",
  "dimensionally_incompatible",
  "domain_mismatch",
  "noncomputable",
  "insufficient_evidence",
] as const;

export const THEORY_MASTER_PROBLEM_RESULT_KINDS = [
  "scalar_value",
  "probability_distribution",
  "interval_bound",
  "symbolic_relation",
  "asymptotic_result",
  "equivalence_class",
  "counterexample",
  "contradiction",
  "unresolved",
] as const;

export const THEORY_MASTER_PROBLEM_BRIDGE_OPERATORS = [
  "derives",
  "requires",
  "specializes",
  "approximates_with_error",
  "bounds",
  "unit_compatible",
  "parameter_binding",
  "numerical_solver",
  "diagnostic_check",
  "provenance",
  "blocks",
] as const;

export type TheoryMasterProblemOperationV1 = (typeof THEORY_MASTER_PROBLEM_OPERATIONS)[number];
export type TheoryMasterProblemCompileStatusV1 = (typeof THEORY_MASTER_PROBLEM_COMPILE_STATUSES)[number];
export type TheoryMasterProblemResultKindV1 = (typeof THEORY_MASTER_PROBLEM_RESULT_KINDS)[number];
export type TheoryMasterProblemBridgeOperatorV1 = (typeof THEORY_MASTER_PROBLEM_BRIDGE_OPERATORS)[number];

export type TheoryMasterProblemRequestV1 = {
  operation: TheoryMasterProblemOperationV1;
  target: string;
  targetObservable: string | null;
  scaleLog10M: { min: number | null; max: number | null } | null;
  coordinateFrame: string | null;
  initialBoundaryConditions: string[];
  formalSystem: string | null;
  requestedPrecision: string | null;
  evidenceMaturityCeiling: "exploratory" | "reduced_order" | "diagnostic" | "certified";
  normalizationStatus: "explicit" | "provisional";
};

export type TheoryMasterProblemNodeV1 = {
  id: string;
  badgeId: string;
  equationId: string | null;
  kind: "concept" | "equation" | "observable" | "constraint" | "gate" | "boundary" | "reference";
  title: string;
  displayLatex: string | null;
  expression: string | null;
  inputSymbols: string[];
  outputSymbols: string[];
  units: Array<{ symbol: string; unit: string | null; dimensionSignature: string | null }>;
  assumptions: string[];
  sourceRefs: string[];
  derivationClass: "retrieved" | "algebraic_derivation" | "approximation" | "fitted_closure" | "conjecture";
  computabilityStatus:
    | "closed_form"
    | "runtime_required"
    | "gate_required"
    | "noncomputable_reference"
    | "unknown";
  claimBoundaryNotes: string[];
};

export type TheoryMasterProblemEdgeV1 = {
  id: string;
  sourceEdgeId: string;
  fromNodeId: string;
  toNodeId: string;
  operator: TheoryMasterProblemBridgeOperatorV1;
  derivationClass: "retrieved" | "algebraic_derivation" | "approximation" | "fitted_closure" | "conjecture";
  symbolMap: Array<{
    fromSymbol: string;
    toSymbol: string;
    status: "verified" | "partial" | "missing";
  }>;
  dimensionalStatus: "compatible" | "partial" | "unknown" | "incompatible";
  domainStatus: "compatible" | "partial" | "unknown" | "incompatible";
  verificationRequirements: string[];
  claimBoundaryNote: string;
};

export type TheoryMasterProblemV1 = {
  artifactId: typeof THEORY_MASTER_PROBLEM_ARTIFACT_ID;
  schemaVersion: typeof THEORY_MASTER_PROBLEM_SCHEMA_VERSION;
  generatedAt: string;
  planId: string;
  graphId: string;
  request: TheoryMasterProblemRequestV1;
  selectedBadgeIds: string[];
  nodes: TheoryMasterProblemNodeV1[];
  edges: TheoryMasterProblemEdgeV1[];
  compile: {
    status: TheoryMasterProblemCompileStatusV1;
    allowedResultKinds: TheoryMasterProblemResultKindV1[];
    missingBindings: string[];
    unresolvedReasons: string[];
    hardFailures: string[];
    runtimeAdmission: "eligible_for_completed_solver_path" | "blocked" | "not_admitted";
  };
  uncertaintyLedger: {
    placementEntropyBits: number;
    openWorldEntropyBits: number;
    outOfGraphProbability: number;
    modelUncertainty: "unquantified" | "not_applicable";
    parameterUncertainty: "unquantified" | "not_applicable";
    processStochasticity: "unspecified" | "deterministic" | "stochastic" | "mixed";
    numericalUncertainty: "not_run" | "unquantified";
    formalStatus: "not_assessed" | "noncomputable_reference_present" | "proof_obligation_present";
  };
  claimBoundary: {
    validatesTheory: false;
    solvesPhysicalMechanism: false;
    promotionAllowed: false;
    assistantAnswer: false;
    terminalEligible: false;
    completedSolverPathRequired: true;
  };
};

type BuildTheoryMasterProblemV1Input = Omit<
  TheoryMasterProblemV1,
  "artifactId" | "schemaVersion" | "generatedAt"
> & { generatedAt?: string };

export function buildTheoryMasterProblemV1(input: BuildTheoryMasterProblemV1Input): TheoryMasterProblemV1 {
  return {
    artifactId: THEORY_MASTER_PROBLEM_ARTIFACT_ID,
    schemaVersion: THEORY_MASTER_PROBLEM_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    planId: input.planId,
    graphId: input.graphId,
    request: input.request,
    selectedBadgeIds: input.selectedBadgeIds,
    nodes: input.nodes,
    edges: input.edges,
    compile: input.compile,
    uncertaintyLedger: input.uncertaintyLedger,
    claimBoundary: input.claimBoundary,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const includes = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
  typeof value === "string" && values.includes(value);

export function validateTheoryMasterProblemV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["master problem must be an object"];
  if (value.artifactId !== THEORY_MASTER_PROBLEM_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_MASTER_PROBLEM_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_MASTER_PROBLEM_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_MASTER_PROBLEM_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "planId", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isRecord(value.request)) {
    issues.push("request must be an object");
  } else {
    if (!includes(THEORY_MASTER_PROBLEM_OPERATIONS, value.request.operation)) issues.push("request.operation is invalid");
    if (!isNonEmptyString(value.request.target)) issues.push("request.target must be a non-empty string");
    if (value.request.targetObservable !== null && typeof value.request.targetObservable !== "string") {
      issues.push("request.targetObservable must be a string or null");
    }
    if (!isStringArray(value.request.initialBoundaryConditions)) {
      issues.push("request.initialBoundaryConditions must be strings");
    }
    if (!["exploratory", "reduced_order", "diagnostic", "certified"].includes(String(value.request.evidenceMaturityCeiling))) {
      issues.push("request.evidenceMaturityCeiling is invalid");
    }
    if (!["explicit", "provisional"].includes(String(value.request.normalizationStatus))) {
      issues.push("request.normalizationStatus is invalid");
    }
  }
  if (!isStringArray(value.selectedBadgeIds)) issues.push("selectedBadgeIds must be strings");
  const nodeIds = new Set<string>();
  if (!Array.isArray(value.nodes)) {
    issues.push("nodes must be an array");
  } else {
    value.nodes.forEach((node, index) => {
      const prefix = `nodes[${index}]`;
      if (!isRecord(node)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(node.id)) issues.push(`${prefix}.id must be a non-empty string`);
      else if (nodeIds.has(node.id)) issues.push(`duplicate node id: ${node.id}`);
      else nodeIds.add(node.id);
      for (const field of ["badgeId", "title"] as const) {
        if (!isNonEmptyString(node[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
      }
      if (!["concept", "equation", "observable", "constraint", "gate", "boundary", "reference"].includes(String(node.kind))) {
        issues.push(`${prefix}.kind is invalid`);
      }
      for (const field of ["inputSymbols", "outputSymbols", "assumptions", "sourceRefs", "claimBoundaryNotes"] as const) {
        if (!isStringArray(node[field])) issues.push(`${prefix}.${field} must be strings`);
      }
      if (!["retrieved", "algebraic_derivation", "approximation", "fitted_closure", "conjecture"].includes(String(node.derivationClass))) {
        issues.push(`${prefix}.derivationClass is invalid`);
      }
      if (!["closed_form", "runtime_required", "gate_required", "noncomputable_reference", "unknown"].includes(String(node.computabilityStatus))) {
        issues.push(`${prefix}.computabilityStatus is invalid`);
      }
    });
  }
  if (!Array.isArray(value.edges)) {
    issues.push("edges must be an array");
  } else {
    const edgeIds = new Set<string>();
    value.edges.forEach((edge, index) => {
      const prefix = `edges[${index}]`;
      if (!isRecord(edge)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(edge.id)) issues.push(`${prefix}.id must be a non-empty string`);
      else if (edgeIds.has(edge.id)) issues.push(`duplicate edge id: ${edge.id}`);
      else edgeIds.add(edge.id);
      if (!isNonEmptyString(edge.sourceEdgeId)) issues.push(`${prefix}.sourceEdgeId must be a non-empty string`);
      for (const field of ["fromNodeId", "toNodeId"] as const) {
        if (!isNonEmptyString(edge[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
        else if (!nodeIds.has(edge[field])) issues.push(`${prefix}.${field} references a missing node`);
      }
      if (!includes(THEORY_MASTER_PROBLEM_BRIDGE_OPERATORS, edge.operator)) issues.push(`${prefix}.operator is invalid`);
      if (!["retrieved", "algebraic_derivation", "approximation", "fitted_closure", "conjecture"].includes(String(edge.derivationClass))) {
        issues.push(`${prefix}.derivationClass is invalid`);
      }
      if (!["compatible", "partial", "unknown", "incompatible"].includes(String(edge.dimensionalStatus))) {
        issues.push(`${prefix}.dimensionalStatus is invalid`);
      }
      if (!["compatible", "partial", "unknown", "incompatible"].includes(String(edge.domainStatus))) {
        issues.push(`${prefix}.domainStatus is invalid`);
      }
      if (!Array.isArray(edge.symbolMap)) issues.push(`${prefix}.symbolMap must be an array`);
      if (!isStringArray(edge.verificationRequirements)) issues.push(`${prefix}.verificationRequirements must be strings`);
      if (!isNonEmptyString(edge.claimBoundaryNote)) issues.push(`${prefix}.claimBoundaryNote must be a non-empty string`);
    });
  }
  if (!isRecord(value.compile)) {
    issues.push("compile must be an object");
  } else {
    if (!includes(THEORY_MASTER_PROBLEM_COMPILE_STATUSES, value.compile.status)) issues.push("compile.status is invalid");
    if (!Array.isArray(value.compile.allowedResultKinds) || !value.compile.allowedResultKinds.every((kind) => includes(THEORY_MASTER_PROBLEM_RESULT_KINDS, kind))) {
      issues.push("compile.allowedResultKinds is invalid");
    }
    for (const field of ["missingBindings", "unresolvedReasons", "hardFailures"] as const) {
      if (!isStringArray(value.compile[field])) issues.push(`compile.${field} must be strings`);
    }
    if (!["eligible_for_completed_solver_path", "blocked", "not_admitted"].includes(String(value.compile.runtimeAdmission))) {
      issues.push("compile.runtimeAdmission is invalid");
    }
  }
  if (!isRecord(value.uncertaintyLedger)) {
    issues.push("uncertaintyLedger must be an object");
  } else {
    for (const field of ["placementEntropyBits", "openWorldEntropyBits", "outOfGraphProbability"] as const) {
      if (!isFiniteNumber(value.uncertaintyLedger[field]) || value.uncertaintyLedger[field] < 0) {
        issues.push(`uncertaintyLedger.${field} must be a non-negative finite number`);
      }
    }
    if (isFiniteNumber(value.uncertaintyLedger.outOfGraphProbability) && value.uncertaintyLedger.outOfGraphProbability > 1) {
      issues.push("uncertaintyLedger.outOfGraphProbability must be at most 1");
    }
    if (!["unquantified", "not_applicable"].includes(String(value.uncertaintyLedger.modelUncertainty))) {
      issues.push("uncertaintyLedger.modelUncertainty is invalid");
    }
    if (!["unquantified", "not_applicable"].includes(String(value.uncertaintyLedger.parameterUncertainty))) {
      issues.push("uncertaintyLedger.parameterUncertainty is invalid");
    }
    if (!["unspecified", "deterministic", "stochastic", "mixed"].includes(String(value.uncertaintyLedger.processStochasticity))) {
      issues.push("uncertaintyLedger.processStochasticity is invalid");
    }
    if (!["not_run", "unquantified"].includes(String(value.uncertaintyLedger.numericalUncertainty))) {
      issues.push("uncertaintyLedger.numericalUncertainty is invalid");
    }
    if (!["not_assessed", "noncomputable_reference_present", "proof_obligation_present"].includes(String(value.uncertaintyLedger.formalStatus))) {
      issues.push("uncertaintyLedger.formalStatus is invalid");
    }
  }
  if (!isRecord(value.claimBoundary)) {
    issues.push("claimBoundary must be an object");
  } else {
    for (const field of ["validatesTheory", "solvesPhysicalMechanism", "promotionAllowed", "assistantAnswer", "terminalEligible"] as const) {
      if (value.claimBoundary[field] !== false) issues.push(`claimBoundary.${field} must be false`);
    }
    if (value.claimBoundary.completedSolverPathRequired !== true) {
      issues.push("claimBoundary.completedSolverPathRequired must be true");
    }
  }
  return issues;
}

export function isTheoryMasterProblemV1(value: unknown): value is TheoryMasterProblemV1 {
  return validateTheoryMasterProblemV1(value).length === 0;
}
