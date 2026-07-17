import {
  THEORY_MASTER_PROBLEM_OPERATIONS,
  type TheoryMasterProblemOperationV1,
} from "./theory-master-problem.v1";

export const THEORY_DERIVATION_PROGRAM_ARTIFACT_ID = "theory_derivation_program" as const;
export const THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION = "theory_derivation_program/v1" as const;

export const THEORY_DERIVATION_PROGRAM_STATUSES = [
  "ready",
  "conditional",
  "reference_only",
  "blocked",
] as const;

export const THEORY_DERIVATION_SOLVER_FAMILIES = [
  "symbolic_algebra",
  "numerical_runtime",
  "observational_comparison",
  "formal_proof",
  "evidence_synthesis",
  "symbolic_reference",
  "none",
] as const;

export const THEORY_DERIVATION_ROUTE_ADMISSIONS = [
  "admitted",
  "conditional",
  "not_admitted",
  "blocked",
] as const;

export const THEORY_DERIVATION_STEP_KINDS = [
  "bind_observable",
  "retrieve_relation",
  "evaluate_relation",
  "apply_graph_relation",
  "apply_registered_bridge",
  "propagate_uncertainty",
  "compare_observables",
  "request_runtime_observation",
  "evaluate_gate",
  "preserve_symbolic_reference",
  "assemble_solver_input",
  "report_typed_failure",
] as const;

export const THEORY_DERIVATION_STEP_ADMISSIONS = [
  "admitted",
  "conditional",
  "reference_only",
  "blocked",
] as const;

export const THEORY_DERIVATION_OBLIGATION_KINDS = [
  "evidence_coverage",
  "input_binding",
  "target_observable",
  "observable_identity",
  "bridge_registration",
  "bridge_domain",
  "bridge_error_contract",
  "dimensional_consistency",
  "scale_domain",
  "runtime_receipt",
  "gate_receipt",
  "formal_system",
  "uncertainty_propagation",
] as const;

export const THEORY_DERIVATION_OBLIGATION_STATUSES = [
  "satisfied",
  "required",
  "blocked",
  "not_applicable",
] as const;

export const THEORY_DERIVATION_FAILURE_CODES = [
  "insufficient_evidence",
  "target_unidentifiable",
  "observable_unidentifiable",
  "input_binding_missing",
  "missing_bridge_relation",
  "dimensionally_incompatible",
  "domain_mismatch",
  "noncomputable_reference",
  "cyclic_dependency",
  "solver_route_not_admitted",
] as const;

export const THEORY_DERIVATION_FAILURE_STAGES = [
  "master_problem_admission",
  "dependency_analysis",
  "observable_resolution",
  "solver_route_admission",
] as const;

export type TheoryDerivationProgramStatusV1 = (typeof THEORY_DERIVATION_PROGRAM_STATUSES)[number];
export type TheoryDerivationSolverFamilyV1 = (typeof THEORY_DERIVATION_SOLVER_FAMILIES)[number];
export type TheoryDerivationRouteAdmissionV1 = (typeof THEORY_DERIVATION_ROUTE_ADMISSIONS)[number];
export type TheoryDerivationStepKindV1 = (typeof THEORY_DERIVATION_STEP_KINDS)[number];
export type TheoryDerivationStepAdmissionV1 = (typeof THEORY_DERIVATION_STEP_ADMISSIONS)[number];
export type TheoryDerivationObligationKindV1 = (typeof THEORY_DERIVATION_OBLIGATION_KINDS)[number];
export type TheoryDerivationObligationStatusV1 = (typeof THEORY_DERIVATION_OBLIGATION_STATUSES)[number];
export type TheoryDerivationFailureCodeV1 = (typeof THEORY_DERIVATION_FAILURE_CODES)[number];
export type TheoryDerivationFailureStageV1 = (typeof THEORY_DERIVATION_FAILURE_STAGES)[number];

export type TheoryDerivationProgramStepV1 = {
  id: string;
  ordinal: number;
  kind: TheoryDerivationStepKindV1;
  label: string;
  dependsOnStepIds: string[];
  sourceNodeIds: string[];
  sourceEdgeIds: string[];
  inputSymbols: string[];
  outputSymbols: string[];
  expression: string | null;
  assumptions: string[];
  sourceRefs: string[];
  admission: TheoryDerivationStepAdmissionV1;
  executionStatus: "not_started";
};

export type TheoryDerivationObligationV1 = {
  id: string;
  kind: TheoryDerivationObligationKindV1;
  phase: "preflight" | "execution" | "post_execution";
  status: TheoryDerivationObligationStatusV1;
  description: string;
  relatedIds: string[];
  sourceRefs: string[];
  repair: string | null;
};

export type TheoryDerivationFailureReceiptV1 = {
  id: string;
  code: TheoryDerivationFailureCodeV1;
  stage: TheoryDerivationFailureStageV1;
  message: string;
  relatedIds: string[];
  sourceRefs: string[];
  retryable: boolean;
  repair: string;
  assistantAnswer: false;
  terminalEligible: false;
};

export type TheoryDerivationProgramV1 = {
  artifactId: typeof THEORY_DERIVATION_PROGRAM_ARTIFACT_ID;
  schemaVersion: typeof THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION;
  generatedAt: string;
  programId: string;
  sourceMasterProblemPlanId: string;
  graphId: string;
  operation: TheoryMasterProblemOperationV1;
  target: string;
  targetObservable: string | null;
  status: TheoryDerivationProgramStatusV1;
  solverRoute: {
    family: TheoryDerivationSolverFamilyV1;
    admission: TheoryDerivationRouteAdmissionV1;
    solverRequirements: string[];
    reason: string;
    executorOwner: "agent_runtime";
    postToolModelStepRequired: true;
  };
  steps: TheoryDerivationProgramStepV1[];
  obligations: TheoryDerivationObligationV1[];
  failureReceipts: TheoryDerivationFailureReceiptV1[];
  uncertaintyPlan: {
    placementEntropyBits: number;
    openWorldEntropyBits: number;
    outOfGraphProbability: number;
    bridgeErrorExpressions: string[];
    propagationRequired: boolean;
    interpretation: "routing_and_derivation_telemetry_not_truth_probability";
  };
  claimBoundary: {
    temporaryProgram: true;
    executesTools: false;
    assistantAnswer: false;
    terminalEligible: false;
    completedSolverPathRequired: true;
  };
};

type BuildTheoryDerivationProgramV1Input = Omit<
  TheoryDerivationProgramV1,
  "artifactId" | "schemaVersion" | "generatedAt"
> & { generatedAt?: string };

export function buildTheoryDerivationProgramV1(
  input: BuildTheoryDerivationProgramV1Input,
): TheoryDerivationProgramV1 {
  return {
    artifactId: THEORY_DERIVATION_PROGRAM_ARTIFACT_ID,
    schemaVersion: THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    programId: input.programId,
    sourceMasterProblemPlanId: input.sourceMasterProblemPlanId,
    graphId: input.graphId,
    operation: input.operation,
    target: input.target,
    targetObservable: input.targetObservable,
    status: input.status,
    solverRoute: input.solverRoute,
    steps: input.steps,
    obligations: input.obligations,
    failureReceipts: input.failureReceipts,
    uncertaintyPlan: input.uncertaintyPlan,
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

export function validateTheoryDerivationProgramV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["derivation program must be an object"];
  if (value.artifactId !== THEORY_DERIVATION_PROGRAM_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_DERIVATION_PROGRAM_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_DERIVATION_PROGRAM_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "programId", "sourceMasterProblemPlanId", "graphId", "target"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(THEORY_MASTER_PROBLEM_OPERATIONS, value.operation)) issues.push("operation is invalid");
  if (value.targetObservable !== null && typeof value.targetObservable !== "string") {
    issues.push("targetObservable must be a string or null");
  }
  if (!includes(THEORY_DERIVATION_PROGRAM_STATUSES, value.status)) issues.push("status is invalid");

  if (!isRecord(value.solverRoute)) {
    issues.push("solverRoute must be an object");
  } else {
    if (!includes(THEORY_DERIVATION_SOLVER_FAMILIES, value.solverRoute.family)) {
      issues.push("solverRoute.family is invalid");
    }
    if (!includes(THEORY_DERIVATION_ROUTE_ADMISSIONS, value.solverRoute.admission)) {
      issues.push("solverRoute.admission is invalid");
    }
    if (!isStringArray(value.solverRoute.solverRequirements)) {
      issues.push("solverRoute.solverRequirements must be strings");
    }
    if (!isNonEmptyString(value.solverRoute.reason)) issues.push("solverRoute.reason must be a non-empty string");
    if (value.solverRoute.executorOwner !== "agent_runtime") {
      issues.push("solverRoute.executorOwner must be agent_runtime");
    }
    if (value.solverRoute.postToolModelStepRequired !== true) {
      issues.push("solverRoute.postToolModelStepRequired must be true");
    }
    const expectedAdmission = value.status === "ready"
      ? "admitted"
      : value.status === "conditional"
        ? "conditional"
        : value.status === "reference_only"
          ? "not_admitted"
          : value.status === "blocked"
            ? "blocked"
            : null;
    if (expectedAdmission && value.solverRoute.admission !== expectedAdmission) {
      issues.push(`solverRoute.admission must be ${expectedAdmission} when status is ${value.status}`);
    }
    if (value.status === "blocked" && value.solverRoute.family !== "none") {
      issues.push("solverRoute.family must be none when status is blocked");
    }
  }

  const stepIds = new Set<string>();
  const stepIndexById = new Map<string, number>();
  if (!Array.isArray(value.steps)) {
    issues.push("steps must be an array");
  } else {
    value.steps.forEach((step, index) => {
      const prefix = `steps[${index}]`;
      if (!isRecord(step)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(step.id)) issues.push(`${prefix}.id must be a non-empty string`);
      else if (stepIds.has(step.id)) issues.push(`duplicate step id: ${step.id}`);
      else {
        stepIds.add(step.id);
        stepIndexById.set(step.id, index);
      }
      if (!Number.isInteger(step.ordinal) || Number(step.ordinal) < 0) issues.push(`${prefix}.ordinal must be a non-negative integer`);
      else if (step.ordinal !== index) issues.push(`${prefix}.ordinal must equal its dependency-order index`);
      if (!includes(THEORY_DERIVATION_STEP_KINDS, step.kind)) issues.push(`${prefix}.kind is invalid`);
      if (!isNonEmptyString(step.label)) issues.push(`${prefix}.label must be a non-empty string`);
      for (const field of [
        "dependsOnStepIds",
        "sourceNodeIds",
        "sourceEdgeIds",
        "inputSymbols",
        "outputSymbols",
        "assumptions",
        "sourceRefs",
      ] as const) {
        if (!isStringArray(step[field])) issues.push(`${prefix}.${field} must be strings`);
      }
      if (step.expression !== null && typeof step.expression !== "string") {
        issues.push(`${prefix}.expression must be a string or null`);
      }
      if (!includes(THEORY_DERIVATION_STEP_ADMISSIONS, step.admission)) issues.push(`${prefix}.admission is invalid`);
      if (step.executionStatus !== "not_started") issues.push(`${prefix}.executionStatus must be not_started`);
    });
    value.steps.forEach((step, index) => {
      if (!isRecord(step) || !Array.isArray(step.dependsOnStepIds)) return;
      step.dependsOnStepIds.forEach((dependency) => {
        if (typeof dependency === "string" && !stepIds.has(dependency)) {
          issues.push(`steps[${index}].dependsOnStepIds references a missing step: ${dependency}`);
        } else if (typeof dependency === "string" && (stepIndexById.get(dependency) ?? Infinity) >= index) {
          issues.push(`steps[${index}].dependsOnStepIds must reference an earlier step: ${dependency}`);
        }
      });
    });
    if (value.status === "blocked" && value.steps.some((step) => isRecord(step) && step.kind !== "report_typed_failure")) {
      issues.push("blocked programs may contain only report_typed_failure steps");
    }
  }

  const obligationIds = new Set<string>();
  if (!Array.isArray(value.obligations)) {
    issues.push("obligations must be an array");
  } else {
    value.obligations.forEach((obligation, index) => {
      const prefix = `obligations[${index}]`;
      if (!isRecord(obligation)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(obligation.id)) issues.push(`${prefix}.id must be a non-empty string`);
      else if (obligationIds.has(obligation.id)) issues.push(`duplicate obligation id: ${obligation.id}`);
      else obligationIds.add(obligation.id);
      if (!includes(THEORY_DERIVATION_OBLIGATION_KINDS, obligation.kind)) issues.push(`${prefix}.kind is invalid`);
      if (!["preflight", "execution", "post_execution"].includes(String(obligation.phase))) {
        issues.push(`${prefix}.phase is invalid`);
      }
      if (!includes(THEORY_DERIVATION_OBLIGATION_STATUSES, obligation.status)) issues.push(`${prefix}.status is invalid`);
      if (!isNonEmptyString(obligation.description)) issues.push(`${prefix}.description must be a non-empty string`);
      if (!isStringArray(obligation.relatedIds)) issues.push(`${prefix}.relatedIds must be strings`);
      if (!isStringArray(obligation.sourceRefs)) issues.push(`${prefix}.sourceRefs must be strings`);
      if (obligation.repair !== null && typeof obligation.repair !== "string") {
        issues.push(`${prefix}.repair must be a string or null`);
      }
    });
  }

  const failureIds = new Set<string>();
  if (!Array.isArray(value.failureReceipts)) {
    issues.push("failureReceipts must be an array");
  } else {
    value.failureReceipts.forEach((receipt, index) => {
      const prefix = `failureReceipts[${index}]`;
      if (!isRecord(receipt)) {
        issues.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(receipt.id)) issues.push(`${prefix}.id must be a non-empty string`);
      else if (failureIds.has(receipt.id)) issues.push(`duplicate failure receipt id: ${receipt.id}`);
      else failureIds.add(receipt.id);
      if (!includes(THEORY_DERIVATION_FAILURE_CODES, receipt.code)) issues.push(`${prefix}.code is invalid`);
      if (!includes(THEORY_DERIVATION_FAILURE_STAGES, receipt.stage)) issues.push(`${prefix}.stage is invalid`);
      if (!isNonEmptyString(receipt.message)) issues.push(`${prefix}.message must be a non-empty string`);
      if (!isStringArray(receipt.relatedIds)) issues.push(`${prefix}.relatedIds must be strings`);
      if (!isStringArray(receipt.sourceRefs)) issues.push(`${prefix}.sourceRefs must be strings`);
      if (typeof receipt.retryable !== "boolean") issues.push(`${prefix}.retryable must be boolean`);
      if (!isNonEmptyString(receipt.repair)) issues.push(`${prefix}.repair must be a non-empty string`);
      if (receipt.assistantAnswer !== false) issues.push(`${prefix}.assistantAnswer must be false`);
      if (receipt.terminalEligible !== false) issues.push(`${prefix}.terminalEligible must be false`);
    });
    if (value.status === "blocked" && value.failureReceipts.length === 0) {
      issues.push("blocked programs must include at least one typed failure receipt");
    }
  }

  if (!isRecord(value.uncertaintyPlan)) {
    issues.push("uncertaintyPlan must be an object");
  } else {
    for (const field of ["placementEntropyBits", "openWorldEntropyBits", "outOfGraphProbability"] as const) {
      if (!isFiniteNumber(value.uncertaintyPlan[field]) || Number(value.uncertaintyPlan[field]) < 0) {
        issues.push(`uncertaintyPlan.${field} must be a non-negative finite number`);
      }
    }
    if (isFiniteNumber(value.uncertaintyPlan.outOfGraphProbability) && value.uncertaintyPlan.outOfGraphProbability > 1) {
      issues.push("uncertaintyPlan.outOfGraphProbability must be at most 1");
    }
    if (!isStringArray(value.uncertaintyPlan.bridgeErrorExpressions)) {
      issues.push("uncertaintyPlan.bridgeErrorExpressions must be strings");
    }
    if (typeof value.uncertaintyPlan.propagationRequired !== "boolean") {
      issues.push("uncertaintyPlan.propagationRequired must be boolean");
    }
    if (
      Array.isArray(value.uncertaintyPlan.bridgeErrorExpressions) &&
      value.uncertaintyPlan.bridgeErrorExpressions.length > 0 &&
      value.uncertaintyPlan.propagationRequired !== true
    ) {
      issues.push("uncertaintyPlan.propagationRequired must be true when bridge errors are present");
    }
    if (value.uncertaintyPlan.interpretation !== "routing_and_derivation_telemetry_not_truth_probability") {
      issues.push("uncertaintyPlan.interpretation is invalid");
    }
  }

  if (!isRecord(value.claimBoundary)) {
    issues.push("claimBoundary must be an object");
  } else {
    if (value.claimBoundary.temporaryProgram !== true) issues.push("claimBoundary.temporaryProgram must be true");
    if (value.claimBoundary.executesTools !== false) issues.push("claimBoundary.executesTools must be false");
    if (value.claimBoundary.assistantAnswer !== false) issues.push("claimBoundary.assistantAnswer must be false");
    if (value.claimBoundary.terminalEligible !== false) issues.push("claimBoundary.terminalEligible must be false");
    if (value.claimBoundary.completedSolverPathRequired !== true) {
      issues.push("claimBoundary.completedSolverPathRequired must be true");
    }
  }
  return issues;
}

export function isTheoryDerivationProgramV1(value: unknown): value is TheoryDerivationProgramV1 {
  return validateTheoryDerivationProgramV1(value).length === 0;
}
