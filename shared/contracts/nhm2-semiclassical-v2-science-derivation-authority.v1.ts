import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
} from "./nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
} from "./nhm2-semiclassical-v2-scientific-preseal.v1";
import { NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS } from "./nhm2-semiclassical-state-realizability.v2";

export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_ARTIFACT_ID =
  "nhm2.semiclassical_v2_science_derivation_authority" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_science_derivation_authority/v2" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_PHASE =
  "pre_execution_science_derivation_preflight" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_WITNESS_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_science_derivation_witness/v1" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_INPUT_CLOSURE_DOMAIN =
  "nhm2-semiclassical-v2-science-derivation-input-closure/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_DOMAIN =
  "nhm2-semiclassical-v2-science-derivation-dag/v2\n" as const;

/**
 * The normalization and approved tolerance policy are frozen control inputs.
 * The remaining twenty inputs carry scientific semantics and must each have
 * a versioned contract before any producer is launched.
 */
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS =
  Object.freeze([
    {
      inputId: "geometry",
      artifactId: "nhm2.semiclassical_v2.geometry_definition",
      contractVersion: "nhm2_semiclassical_v2_geometry_definition/v1",
    },
    {
      inputId: "quantum_state",
      artifactId: "nhm2.semiclassical_v2.quantum_state_definition",
      contractVersion: "nhm2_semiclassical_v2_quantum_state_definition/v1",
    },
    {
      inputId: "chart",
      artifactId: "nhm2.semiclassical_v2.chart_definition",
      contractVersion: "nhm2_semiclassical_v2_chart_definition/v1",
    },
    {
      inputId: "smearing_definition",
      artifactId: "nhm2.semiclassical_v2.smearing_definition",
      contractVersion: "nhm2_semiclassical_v2_smearing_definition/v1",
    },
    {
      inputId: "sampling_basis",
      artifactId: "nhm2.semiclassical_v2.sampling_basis",
      contractVersion: "nhm2_semiclassical_v2_sampling_basis/v1",
    },
    {
      inputId: "field_model",
      artifactId: "nhm2.semiclassical_v2.field_model",
      contractVersion: "nhm2_semiclassical_v2_field_model/v1",
    },
    {
      inputId: "lagrangian",
      artifactId: "nhm2.semiclassical_v2.lagrangian",
      contractVersion: "nhm2_semiclassical_v2_lagrangian/v1",
    },
    {
      inputId: "field_equations",
      artifactId: "nhm2.semiclassical_v2.field_equations",
      contractVersion: "nhm2_semiclassical_v2_field_equations/v1",
    },
    {
      inputId: "boundary_conditions",
      artifactId: "nhm2.semiclassical_v2.boundary_conditions",
      contractVersion: "nhm2_semiclassical_v2_boundary_conditions/v1",
    },
    {
      inputId: "state_construction",
      artifactId: "nhm2.semiclassical_v2.state_construction",
      contractVersion: "nhm2_semiclassical_v2_state_construction/v1",
    },
    {
      inputId: "renormalization_prescription",
      artifactId: "nhm2.semiclassical_v2.renormalization_prescription",
      contractVersion: "nhm2_semiclassical_v2_renormalization_prescription/v1",
    },
    {
      inputId: "renormalization_counterterms",
      artifactId: "nhm2.semiclassical_v2.renormalization_counterterms",
      contractVersion: "nhm2_semiclassical_v2_renormalization_counterterms/v1",
    },
    {
      inputId: "finite_renormalization_freedom",
      artifactId: "nhm2.semiclassical_v2.finite_renormalization_freedom",
      contractVersion:
        "nhm2_semiclassical_v2_finite_renormalization_freedom/v1",
    },
    {
      inputId: "constraint_formulation",
      artifactId: "nhm2.semiclassical_v2.constraint_formulation",
      contractVersion: "nhm2_semiclassical_v2_constraint_formulation/v1",
    },
    {
      inputId: "regulator_definition",
      artifactId: "nhm2.semiclassical_v2.regulator_definition",
      contractVersion: "nhm2_semiclassical_v2_regulator_definition/v1",
    },
    {
      inputId: "operator_ordering",
      artifactId: "nhm2.semiclassical_v2.operator_ordering",
      contractVersion: "nhm2_semiclassical_v2_operator_ordering/v1",
    },
    {
      inputId: "classical_structure_functions",
      artifactId: "nhm2.semiclassical_v2.classical_structure_functions",
      contractVersion: "nhm2_semiclassical_v2_classical_structure_functions/v1",
    },
    {
      inputId: "metric_demand_tensor",
      artifactId: "nhm2.semiclassical_v2.metric_demand_tensor",
      contractVersion: "nhm2_semiclassical_v2_metric_demand_tensor/v1",
    },
    {
      inputId: "metric_demand_absolute_error_bound",
      artifactId: "nhm2.semiclassical_v2.metric_demand_absolute_error_bound",
      contractVersion:
        "nhm2_semiclassical_v2_metric_demand_absolute_error_bound/v1",
    },
    {
      inputId: "metric_demand_derivation_receipt",
      artifactId: "nhm2.semiclassical_v2_metric_demand_derivation_receipt",
      contractVersion:
        "nhm2_semiclassical_v2_metric_demand_derivation_receipt/v1",
    },
  ] as const);

export type Nhm2SemiclassicalV2ScienceDerivationSemanticInputId =
  (typeof NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS)[number]["inputId"];

export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_IDS =
  Object.freeze(
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.map(
      (entry) => entry.inputId,
    ),
  ) as readonly Nhm2SemiclassicalV2ScienceDerivationSemanticInputId[];

export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_UNCERTAINTY_OUTPUT_ROLES =
  Object.freeze([
    "mean_rset_absolute_uncertainty95",
    "noise_kernel_absolute_uncertainty95",
    "constraint_bracket.H_H.absolute_uncertainty95",
    "constraint_bracket.H_Hi.absolute_uncertainty95",
    "constraint_bracket.Hi_Hj.absolute_uncertainty95",
    "antisymmetry.absolute_uncertainty95",
    "jacobi.absolute_uncertainty95",
    "regulator_level.0.absolute_uncertainty95",
    "regulator_level.1.absolute_uncertainty95",
    "regulator_level.2.absolute_uncertainty95",
  ] as const);

export type Nhm2SemiclassicalV2ScienceDerivationDagEdgeV1 = Readonly<{
  from: string;
  to: string;
  relation: string;
}>;

const edge = (from: string, to: string, relation: string) =>
  Object.freeze({ from, to, relation });

/**
 * Frozen scientific dependency graph. The validator checks both exact edge
 * identity and acyclicity; an `acyclic: true` producer assertion is never
 * accepted as evidence.
 */
export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES = Object.freeze(
  [
    edge("geometry", "chart", "defines_chart_domain"),
    edge("geometry", "sampling_basis", "defines_sampling_domain"),
    edge("chart", "sampling_basis", "coordinates_sampling_basis"),
    edge("smearing_definition", "sampling_basis", "defines_sampling_weights"),
    edge("geometry", "metric_demand_tensor", "geometry_to_metric_demand"),
    edge("chart", "metric_demand_tensor", "same_chart_metric_projection"),
    edge("sampling_basis", "metric_demand_tensor", "metric_sample_order"),
    edge(
      "geometry",
      "metric_demand_error_bound_derivation_witness",
      "metric_error_geometry",
    ),
    edge(
      "chart",
      "metric_demand_error_bound_derivation_witness",
      "metric_error_same_chart",
    ),
    edge(
      "sampling_basis",
      "metric_demand_error_bound_derivation_witness",
      "metric_error_sample_order",
    ),
    edge(
      "metric_demand_tensor",
      "metric_demand_error_bound_derivation_witness",
      "central_tensor_for_deterministic_error_bound",
    ),
    edge(
      "metric_demand_absolute_error_bound",
      "metric_demand_error_bound_derivation_witness",
      "encoded_deterministic_error_bound",
    ),
    edge(
      "metric_demand_derivation_receipt",
      "metric_demand_error_bound_derivation_witness",
      "executor_derivation_receipt",
    ),
    edge("field_model", "lagrangian", "field_content_to_lagrangian"),
    edge("lagrangian", "field_equations", "euler_lagrange_derivation"),
    edge("field_equations", "boundary_conditions", "boundary_value_problem"),
    edge("field_equations", "state_construction", "state_dynamical_operator"),
    edge("boundary_conditions", "state_construction", "state_boundary_data"),
    edge("sampling_basis", "state_construction", "state_mode_sampling"),
    edge("state_construction", "quantum_state", "constructs_quantum_state"),
    edge(
      "field_equations",
      "state_admissibility_evidence",
      "hadamard_field_operator",
    ),
    edge(
      "boundary_conditions",
      "state_admissibility_evidence",
      "hadamard_boundary_compatibility",
    ),
    edge(
      "state_construction",
      "state_admissibility_evidence",
      "hadamard_construction",
    ),
    edge(
      "quantum_state",
      "state_admissibility_evidence",
      "hadamard_state_under_test",
    ),
    edge("geometry", "mean_rset_derivation_witness", "mean_rset_geometry"),
    edge("chart", "mean_rset_derivation_witness", "mean_rset_chart"),
    edge(
      "sampling_basis",
      "mean_rset_derivation_witness",
      "mean_rset_sampling",
    ),
    edge(
      "field_equations",
      "mean_rset_derivation_witness",
      "mean_rset_operator",
    ),
    edge("quantum_state", "mean_rset_derivation_witness", "mean_rset_state"),
    edge(
      "state_admissibility_evidence",
      "mean_rset_derivation_witness",
      "mean_rset_admissibility",
    ),
    edge(
      "renormalization_prescription",
      "mean_rset_derivation_witness",
      "mean_rset_renormalization",
    ),
    edge(
      "renormalization_counterterms",
      "mean_rset_derivation_witness",
      "mean_rset_counterterms",
    ),
    edge(
      "finite_renormalization_freedom",
      "mean_rset_derivation_witness",
      "mean_rset_finite_freedom",
    ),
    edge("geometry", "noise_kernel_derivation_witness", "noise_geometry"),
    edge("chart", "noise_kernel_derivation_witness", "noise_chart"),
    edge("sampling_basis", "noise_kernel_derivation_witness", "noise_sampling"),
    edge(
      "field_equations",
      "noise_kernel_derivation_witness",
      "noise_operator",
    ),
    edge("quantum_state", "noise_kernel_derivation_witness", "noise_state"),
    edge(
      "state_admissibility_evidence",
      "noise_kernel_derivation_witness",
      "noise_admissibility",
    ),
    edge(
      "renormalization_prescription",
      "noise_kernel_derivation_witness",
      "noise_renormalization",
    ),
    edge(
      "renormalization_counterterms",
      "noise_kernel_derivation_witness",
      "noise_counterterms",
    ),
    edge(
      "finite_renormalization_freedom",
      "noise_kernel_derivation_witness",
      "noise_finite_freedom",
    ),
    edge(
      "constraint_formulation",
      "computed_bracket_operands_witness",
      "computed_constraint_definition",
    ),
    edge(
      "regulator_definition",
      "computed_bracket_operands_witness",
      "computed_constraint_regulator",
    ),
    edge(
      "operator_ordering",
      "computed_bracket_operands_witness",
      "computed_constraint_ordering",
    ),
    edge(
      "field_equations",
      "computed_bracket_operands_witness",
      "computed_constraint_dynamics",
    ),
    edge(
      "quantum_state",
      "computed_bracket_operands_witness",
      "computed_constraint_state",
    ),
    edge(
      "state_admissibility_evidence",
      "computed_bracket_operands_witness",
      "computed_constraint_admissibility",
    ),
    edge(
      "renormalization_counterterms",
      "computed_bracket_operands_witness",
      "computed_constraint_counterterms",
    ),
    edge(
      "constraint_formulation",
      "classical_bracket_targets_witness",
      "classical_constraint_definition",
    ),
    edge(
      "classical_structure_functions",
      "classical_bracket_targets_witness",
      "classical_structure_target",
    ),
    edge(
      "geometry",
      "classical_bracket_targets_witness",
      "classical_target_geometry",
    ),
    edge(
      "chart",
      "classical_bracket_targets_witness",
      "classical_target_chart",
    ),
    edge(
      "sampling_basis",
      "classical_bracket_targets_witness",
      "classical_target_sampling",
    ),
    edge(
      "computed_bracket_operands_witness",
      "constraint_anomaly_evidence",
      "computed_anomaly_operand",
    ),
    edge(
      "classical_bracket_targets_witness",
      "constraint_anomaly_evidence",
      "classical_anomaly_target",
    ),
    edge(
      "constraint_formulation",
      "constraint_anomaly_evidence",
      "anomaly_formulation",
    ),
    edge(
      "regulator_definition",
      "constraint_anomaly_evidence",
      "anomaly_regulator",
    ),
    edge(
      "operator_ordering",
      "constraint_anomaly_evidence",
      "anomaly_ordering",
    ),
    edge(
      "renormalization_counterterms",
      "constraint_anomaly_evidence",
      "anomaly_counterterms",
    ),
    edge(
      "finite_renormalization_freedom",
      "constraint_anomaly_evidence",
      "anomaly_finite_freedom",
    ),
    edge(
      "quantum_state",
      "uncertainty_budget_derivation_witness",
      "uncertainty_state",
    ),
    edge(
      "state_admissibility_evidence",
      "uncertainty_budget_derivation_witness",
      "uncertainty_state_admissibility",
    ),
    edge(
      "sampling_basis",
      "uncertainty_budget_derivation_witness",
      "uncertainty_sampling",
    ),
    edge(
      "renormalization_prescription",
      "uncertainty_budget_derivation_witness",
      "uncertainty_renormalization",
    ),
    edge(
      "renormalization_counterterms",
      "uncertainty_budget_derivation_witness",
      "uncertainty_counterterms",
    ),
    edge(
      "finite_renormalization_freedom",
      "uncertainty_budget_derivation_witness",
      "uncertainty_finite_freedom",
    ),
    edge(
      "regulator_definition",
      "uncertainty_budget_derivation_witness",
      "uncertainty_regulator",
    ),
    edge(
      "mean_rset_derivation_witness",
      "uncertainty_budget_derivation_witness",
      "mean_uncertainty_operand",
    ),
    edge(
      "noise_kernel_derivation_witness",
      "uncertainty_budget_derivation_witness",
      "noise_uncertainty_operand",
    ),
    edge(
      "computed_bracket_operands_witness",
      "uncertainty_budget_derivation_witness",
      "computed_bracket_uncertainty_operand",
    ),
    edge(
      "classical_bracket_targets_witness",
      "uncertainty_budget_derivation_witness",
      "classical_target_uncertainty_operand",
    ),
    edge(
      "mean_rset_derivation_witness",
      "mean_metric_demand_closure",
      "state_derived_mean_operand",
    ),
    edge(
      "uncertainty_budget_derivation_witness",
      "mean_metric_demand_closure",
      "mean_uncertainty_operand",
    ),
    edge(
      "metric_demand_tensor",
      "mean_metric_demand_closure",
      "geometry_derived_demand_operand",
    ),
    edge(
      "metric_demand_absolute_error_bound",
      "mean_metric_demand_closure",
      "deterministic_demand_error_operand",
    ),
    edge(
      "metric_demand_error_bound_derivation_witness",
      "mean_metric_demand_closure",
      "demand_error_derivation_authority_operand",
    ),
  ] as const,
);

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("canonical JSON requires finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value == null || typeof value !== "object") {
    throw new TypeError("canonical JSON requires JSON values");
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    )
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sha256Domain = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(canonicalJson(value), "utf8")
    .digest("hex");

export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 = sha256Domain(
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_DOMAIN,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
);

export type Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1 = {
  ordinal: number;
  inputId: Nhm2SemiclassicalV2ScienceDerivationSemanticInputId;
  artifactId: string;
  contractVersion: string;
  scientificObjectId: string;
  sha256: string;
  sizeBytes: number;
};

export const computeNhm2SemiclassicalV2ScienceDerivationInputClosureSha256 = (
  bindings: readonly Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1[],
): string =>
  sha256Domain(
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_INPUT_CLOSURE_DOMAIN,
    bindings,
  );

export type Nhm2SemiclassicalV2ScienceEvidenceIdentityV1 = {
  evidenceId: string;
  artifactId: string;
  contractVersion: string;
  sha256: string;
  semanticInputClosureSha256: string;
};

export type Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1 =
  Nhm2SemiclassicalV2ScienceEvidenceIdentityV1 & {
    witnessKind:
      | "renormalized_state_expectation_derivation"
      | "connected_symmetrized_noise_derivation"
      | "metric_demand_deterministic_error_bound_derivation"
      | "computed_constraint_bracket_operand_derivation"
      | "classical_structure_function_operand_derivation";
    outputRole: string;
  };

export type Nhm2SemiclassicalV2ScienceDerivationUncertaintyWitnessV1 =
  Nhm2SemiclassicalV2ScienceEvidenceIdentityV1 & {
    witnessKind: "pointwise_absolute_uncertainty95_derivation";
    outputRoles: string[];
  };

export type Nhm2SemiclassicalV2ScienceDerivationAnomalyDispositionV1 =
  | "undetermined_pending_replay"
  | "no_anomaly_claimed_pending_replay"
  | "counterterms_declared_pending_replay"
  | "anomaly_detected";

export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_REQUIRED_BLOCKERS =
  Object.freeze([
    "server_science_derivation_replay_missing",
    "state_admissibility_derivation_not_replayed",
    "mean_rset_derivation_not_replayed",
    "noise_kernel_derivation_not_replayed",
    "uncertainty_derivation_not_replayed",
    "metric_demand_error_bound_derivation_not_replayed",
    "metric_demand_derivation_executor_provenance_unverified",
    "interval_trace_not_server_replayed",
    "constraint_bracket_operands_derivation_not_replayed",
    "constraint_anomaly_derivation_not_replayed",
    "mean_metric_demand_closure_not_replayed",
    "independent_science_derivation_agreement_missing",
  ] as const);

export const NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_CLAIM_LOCKS =
  Object.freeze({
    replayAuthority: false as const,
    stateAdmissibilityAuthority: false as const,
    meanRsetDerivationAuthority: false as const,
    noiseKernelDerivationAuthority: false as const,
    uncertaintyDerivationAuthority: false as const,
    metricDemandErrorBoundDerivationAuthority: false as const,
    constraintBracketDerivationAuthority: false as const,
    anomalyDispositionAuthority: false as const,
    meanMetricDemandClosureAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
    empiricalValidation: false as const,
  });

export type Nhm2SemiclassicalV2ScienceDerivationAuthorityV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_CONTRACT_VERSION;
  phase: typeof NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_PHASE;
  generatedAt: string;
  candidateBinding: {
    candidateManifestArtifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID;
    candidateManifestContractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION;
    candidateId: string;
    candidateManifestId: string;
    selectedProfileId: string;
    geometryId: string;
    quantumStateId: string;
    chartId: string;
    normalizationId: string;
    smearingFunctionId: string;
    samplingBasisId: string;
    metricDemandInputId: "metric_demand_tensor";
    metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound";
    metricDemandDerivationWitnessInputId: "metric_demand_derivation_receipt";
    candidateFrozenAt: string;
    candidateManifestSha256: string;
  };
  presealBinding: {
    artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID;
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION;
    sealKey: string;
    presealArtifactSha256: string;
    candidateManifestSha256: string;
    scientificContentSha256: string;
    sealedInventorySha256: string;
    sealedAt: string;
    serverPersistenceReceiptSha256: string;
  };
  frozenControlBindings: {
    normalization: {
      inputId: "normalization";
      artifactId: "nhm2.semiclassical_v2.normalization";
      contractVersion: "nhm2_semiclassical_v2_normalization/v1";
      scientificObjectId: string;
      sha256: string;
      sizeBytes: number;
    };
    tolerancePolicy: {
      inputId: "tolerance_policy";
      artifactId: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID;
      contractVersion: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION;
      policyId: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID;
      sha256: string;
      sizeBytes: number;
    };
  };
  semanticInputBindings: Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1[];
  semanticInputClosureSha256: string;
  dependencyDag: {
    ordering: "frozen_science_derivation_edge_order_v2";
    edges: Nhm2SemiclassicalV2ScienceDerivationDagEdgeV1[];
    edgeCount: number;
    dagSha256: string;
    validationMethod: "server_contract_exact_edges_and_topological_cycle_check";
  };
  evidencePolicy: {
    admittedProofKind: "server_recomputed_byte_derivation_plus_independent_implementation_agreement";
    booleanOnlyAssertionDisposition: "rejected";
    artifactIdentityDisposition: "binding_only_not_proof";
    producerDeclarationDisposition: "binding_only_not_proof";
  };
  stateAdmissibility: {
    criterionId: "hadamard_microlocal_spectrum_boundary_and_state_construction/v1";
    evidenceInputIds: [
      "field_equations",
      "boundary_conditions",
      "state_construction",
      "quantum_state",
    ];
    evidence: Nhm2SemiclassicalV2ScienceEvidenceIdentityV1;
    serverReplayStatus: "not_replayed";
    authorityStatus: "blocked";
  };
  derivationWitnesses: {
    meanRset: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1;
    noiseKernel: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1;
    uncertaintyBudget: Nhm2SemiclassicalV2ScienceDerivationUncertaintyWitnessV1;
    metricDemandErrorBound: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1;
    bracketOperands: Array<{
      bracketId: (typeof NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS)[number];
      computed: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1;
      classicalTarget: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1;
    }>;
  };
  anomalyAssessment: {
    declaredDisposition: Nhm2SemiclassicalV2ScienceDerivationAnomalyDispositionV1;
    evidence: Nhm2SemiclassicalV2ScienceEvidenceIdentityV1;
    countertermBinding: {
      inputId: "renormalization_counterterms";
      inputSha256: string;
      evidence: Nhm2SemiclassicalV2ScienceEvidenceIdentityV1;
    };
    serverReplayStatus: "not_replayed";
    authorityStatus: "blocked";
  };
  meanDemandClosure: {
    requirement: "mandatory_before_diagnostic_lamp_authority";
    comparisonId: "pointwise_same_chart_mean_rset_minus_metric_demand_with_uncertainty/v2";
    meanRsetWitnessSha256: string;
    meanRsetUncertaintyWitnessSha256: string;
    metricDemandInputSha256: string;
    metricDemandErrorBoundWitnessSha256: string;
    metricDemandErrorBoundInputSha256: string;
    normalizationInputSha256: string;
    replayStatus: "not_replayed";
    residualEvidence: null;
    authorityStatus: "blocked";
  };
  authorityState: {
    status: "blocked";
    firstBlocker: "server_science_derivation_replay_missing";
    blockers: string[];
  };
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_CLAIM_LOCKS;
};

export type BuildNhm2SemiclassicalV2ScienceDerivationAuthorityInput = {
  generatedAt: string;
  candidateBinding: Nhm2SemiclassicalV2ScienceDerivationAuthorityV1["candidateBinding"];
  presealBinding: Nhm2SemiclassicalV2ScienceDerivationAuthorityV1["presealBinding"];
  frozenControlBindings: Nhm2SemiclassicalV2ScienceDerivationAuthorityV1["frozenControlBindings"];
  semanticInputBindings: Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1[];
  stateAdmissibilityEvidence: Nhm2SemiclassicalV2ScienceEvidenceIdentityV1;
  derivationWitnesses: Nhm2SemiclassicalV2ScienceDerivationAuthorityV1["derivationWitnesses"];
  anomalyAssessment: Pick<
    Nhm2SemiclassicalV2ScienceDerivationAuthorityV1["anomalyAssessment"],
    "declaredDisposition" | "evidence" | "countertermBinding"
  >;
};

const blockersFor = (
  disposition: Nhm2SemiclassicalV2ScienceDerivationAnomalyDispositionV1,
): string[] => [
  ...NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_REQUIRED_BLOCKERS,
  ...(disposition === "anomaly_detected"
    ? ["declared_constraint_anomaly_detected"]
    : []),
];

const deepFreeze = <T>(value: T): T => {
  if (value == null || typeof value !== "object" || Object.isFrozen(value))
    return value;
  for (const key of Reflect.ownKeys(value as object)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  }
  return Object.freeze(value);
};

export const buildNhm2SemiclassicalV2ScienceDerivationAuthority = (
  input: BuildNhm2SemiclassicalV2ScienceDerivationAuthorityInput,
): Nhm2SemiclassicalV2ScienceDerivationAuthorityV1 => {
  const semanticInputBindings = input.semanticInputBindings.map((entry) => ({
    ...entry,
  }));
  const closure = computeNhm2SemiclassicalV2ScienceDerivationInputClosureSha256(
    semanticInputBindings,
  );
  const metricDemand = semanticInputBindings.find(
    (entry) => entry.inputId === "metric_demand_tensor",
  );
  const metricDemandErrorBound = semanticInputBindings.find(
    (entry) => entry.inputId === "metric_demand_absolute_error_bound",
  );
  return deepFreeze({
    artifactId: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_CONTRACT_VERSION,
    phase: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_PHASE,
    generatedAt: input.generatedAt,
    candidateBinding: { ...input.candidateBinding },
    presealBinding: { ...input.presealBinding },
    frozenControlBindings: {
      normalization: { ...input.frozenControlBindings.normalization },
      tolerancePolicy: { ...input.frozenControlBindings.tolerancePolicy },
    },
    semanticInputBindings,
    semanticInputClosureSha256: closure,
    dependencyDag: {
      ordering: "frozen_science_derivation_edge_order_v2",
      edges: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.map(
        (entry) => ({ ...entry }),
      ),
      edgeCount: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.length,
      dagSha256: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
      validationMethod:
        "server_contract_exact_edges_and_topological_cycle_check",
    },
    evidencePolicy: {
      admittedProofKind:
        "server_recomputed_byte_derivation_plus_independent_implementation_agreement",
      booleanOnlyAssertionDisposition: "rejected",
      artifactIdentityDisposition: "binding_only_not_proof",
      producerDeclarationDisposition: "binding_only_not_proof",
    },
    stateAdmissibility: {
      criterionId:
        "hadamard_microlocal_spectrum_boundary_and_state_construction/v1",
      evidenceInputIds: [
        "field_equations",
        "boundary_conditions",
        "state_construction",
        "quantum_state",
      ],
      evidence: { ...input.stateAdmissibilityEvidence },
      serverReplayStatus: "not_replayed",
      authorityStatus: "blocked",
    },
    derivationWitnesses: {
      meanRset: { ...input.derivationWitnesses.meanRset },
      noiseKernel: { ...input.derivationWitnesses.noiseKernel },
      uncertaintyBudget: {
        ...input.derivationWitnesses.uncertaintyBudget,
        outputRoles: [
          ...input.derivationWitnesses.uncertaintyBudget.outputRoles,
        ],
      },
      metricDemandErrorBound: {
        ...input.derivationWitnesses.metricDemandErrorBound,
      },
      bracketOperands: input.derivationWitnesses.bracketOperands.map(
        (entry) => ({
          bracketId: entry.bracketId,
          computed: { ...entry.computed },
          classicalTarget: { ...entry.classicalTarget },
        }),
      ),
    },
    anomalyAssessment: {
      declaredDisposition: input.anomalyAssessment.declaredDisposition,
      evidence: { ...input.anomalyAssessment.evidence },
      countertermBinding: {
        inputId: "renormalization_counterterms",
        inputSha256: input.anomalyAssessment.countertermBinding.inputSha256,
        evidence: { ...input.anomalyAssessment.countertermBinding.evidence },
      },
      serverReplayStatus: "not_replayed",
      authorityStatus: "blocked",
    },
    meanDemandClosure: {
      requirement: "mandatory_before_diagnostic_lamp_authority",
      comparisonId:
        "pointwise_same_chart_mean_rset_minus_metric_demand_with_uncertainty/v2",
      meanRsetWitnessSha256: input.derivationWitnesses.meanRset.sha256,
      meanRsetUncertaintyWitnessSha256:
        input.derivationWitnesses.uncertaintyBudget.sha256,
      metricDemandInputSha256: metricDemand?.sha256 ?? "",
      metricDemandErrorBoundWitnessSha256:
        input.derivationWitnesses.metricDemandErrorBound.sha256,
      metricDemandErrorBoundInputSha256: metricDemandErrorBound?.sha256 ?? "",
      normalizationInputSha256:
        input.frozenControlBindings.normalization.sha256,
      replayStatus: "not_replayed",
      residualEvidence: null,
      authorityStatus: "blocked",
    },
    authorityState: {
      status: "blocked",
      firstBlocker: "server_science_derivation_replay_missing",
      blockers: blockersFor(input.anomalyAssessment.declaredDisposition),
    },
    claimLocks: { ...NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_CLAIM_LOCKS },
  });
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "phase",
  "generatedAt",
  "candidateBinding",
  "presealBinding",
  "frozenControlBindings",
  "semanticInputBindings",
  "semanticInputClosureSha256",
  "dependencyDag",
  "evidencePolicy",
  "stateAdmissibility",
  "derivationWitnesses",
  "anomalyAssessment",
  "meanDemandClosure",
  "authorityState",
  "claimLocks",
] as const;
const CANDIDATE_KEYS = [
  "candidateManifestArtifactId",
  "candidateManifestContractVersion",
  "candidateId",
  "candidateManifestId",
  "selectedProfileId",
  "geometryId",
  "quantumStateId",
  "chartId",
  "normalizationId",
  "smearingFunctionId",
  "samplingBasisId",
  "metricDemandInputId",
  "metricDemandErrorBoundInputId",
  "metricDemandDerivationWitnessInputId",
  "candidateFrozenAt",
  "candidateManifestSha256",
] as const;
const PRESEAL_KEYS = [
  "artifactId",
  "contractVersion",
  "sealKey",
  "presealArtifactSha256",
  "candidateManifestSha256",
  "scientificContentSha256",
  "sealedInventorySha256",
  "sealedAt",
  "serverPersistenceReceiptSha256",
] as const;
const CONTROL_KEYS = ["normalization", "tolerancePolicy"] as const;
const NORMALIZATION_KEYS = [
  "inputId",
  "artifactId",
  "contractVersion",
  "scientificObjectId",
  "sha256",
  "sizeBytes",
] as const;
const POLICY_KEYS = [
  "inputId",
  "artifactId",
  "contractVersion",
  "policyId",
  "sha256",
  "sizeBytes",
] as const;
const INPUT_KEYS = [
  "ordinal",
  "inputId",
  "artifactId",
  "contractVersion",
  "scientificObjectId",
  "sha256",
  "sizeBytes",
] as const;
const DAG_KEYS = [
  "ordering",
  "edges",
  "edgeCount",
  "dagSha256",
  "validationMethod",
] as const;
const EDGE_KEYS = ["from", "to", "relation"] as const;
const EVIDENCE_POLICY_KEYS = [
  "admittedProofKind",
  "booleanOnlyAssertionDisposition",
  "artifactIdentityDisposition",
  "producerDeclarationDisposition",
] as const;
const STATE_KEYS = [
  "criterionId",
  "evidenceInputIds",
  "evidence",
  "serverReplayStatus",
  "authorityStatus",
] as const;
const EVIDENCE_KEYS = [
  "evidenceId",
  "artifactId",
  "contractVersion",
  "sha256",
  "semanticInputClosureSha256",
] as const;
const WITNESS_KEYS = [...EVIDENCE_KEYS, "witnessKind", "outputRole"] as const;
const UNCERTAINTY_WITNESS_KEYS = [
  ...EVIDENCE_KEYS,
  "witnessKind",
  "outputRoles",
] as const;
const WITNESSES_KEYS = [
  "meanRset",
  "noiseKernel",
  "uncertaintyBudget",
  "metricDemandErrorBound",
  "bracketOperands",
] as const;
const BRACKET_WITNESS_KEYS = [
  "bracketId",
  "computed",
  "classicalTarget",
] as const;
const ANOMALY_KEYS = [
  "declaredDisposition",
  "evidence",
  "countertermBinding",
  "serverReplayStatus",
  "authorityStatus",
] as const;
const COUNTERTERM_KEYS = ["inputId", "inputSha256", "evidence"] as const;
const CLOSURE_KEYS = [
  "requirement",
  "comparisonId",
  "meanRsetWitnessSha256",
  "meanRsetUncertaintyWitnessSha256",
  "metricDemandInputSha256",
  "metricDemandErrorBoundWitnessSha256",
  "metricDemandErrorBoundInputSha256",
  "normalizationInputSha256",
  "replayStatus",
  "residualEvidence",
  "authorityStatus",
] as const;
const AUTHORITY_KEYS = ["status", "firstBlocker", "blockers"] as const;
const CLAIM_LOCK_KEYS = Object.keys(
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_CLAIM_LOCKS,
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
};
const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 512 &&
  value.trim() === value &&
  /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/.test(value) &&
  !value.includes("//");
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{64}$/.test(value) &&
  !/^0{64}$/.test(value);
const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};
const sameJson = (left: unknown, right: unknown): boolean =>
  canonicalJson(left) === canonicalJson(right);
const unique = (values: string[]): string[] => [...new Set(values)];

const containsForbiddenLeverIdentity = (value: unknown): boolean => {
  if (typeof value === "string") {
    const folded = value.toLocaleLowerCase("en-US");
    return NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS.some((entry) =>
      folded.includes(entry.toLocaleLowerCase("en-US")),
    );
  }
  if (Array.isArray(value)) return value.some(containsForbiddenLeverIdentity);
  return (
    isRecord(value) && Object.values(value).some(containsForbiddenLeverIdentity)
  );
};

const containsTrueBooleanProofAssertion = (value: unknown): boolean => {
  if (Array.isArray(value))
    return value.some(containsTrueBooleanProofAssertion);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    const proofLike =
      /(pass|valid|verified|admissible|closed|authority|established)/i.test(
        key,
      );
    return (
      (proofLike && entry === true) || containsTrueBooleanProofAssertion(entry)
    );
  });
};

const graphIsAcyclic = (
  edges: readonly Nhm2SemiclassicalV2ScienceDerivationDagEdgeV1[],
): boolean => {
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const { from, to } of edges) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    if (!adjacency.has(to)) adjacency.set(to, []);
    adjacency.get(from)!.push(to);
    indegree.set(from, indegree.get(from) ?? 0);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
  }
  const queue = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([node]) => node);
  let visited = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited += 1;
    for (const target of adjacency.get(node) ?? []) {
      const next = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, next);
      if (next === 0) queue.push(target);
    }
  }
  return visited === indegree.size;
};

const evidenceIdentityValid = (value: unknown, closure: string): boolean =>
  isRecord(value) &&
  hasExactKeys(value, EVIDENCE_KEYS) &&
  isIdentifier(value.evidenceId) &&
  isIdentifier(value.artifactId) &&
  value.contractVersion ===
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_WITNESS_CONTRACT_VERSION &&
  isSha256(value.sha256) &&
  value.semanticInputClosureSha256 === closure;

const witnessIdentityValid = (
  value: unknown,
  closure: string,
  witnessKind: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1["witnessKind"],
  outputRole: string,
): boolean =>
  isRecord(value) &&
  hasExactKeys(value, WITNESS_KEYS) &&
  isIdentifier(value.evidenceId) &&
  isIdentifier(value.artifactId) &&
  value.contractVersion ===
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_WITNESS_CONTRACT_VERSION &&
  isSha256(value.sha256) &&
  value.semanticInputClosureSha256 === closure &&
  value.witnessKind === witnessKind &&
  value.outputRole === outputRole;

const uncertaintyWitnessValid = (value: unknown, closure: string): boolean =>
  isRecord(value) &&
  hasExactKeys(value, UNCERTAINTY_WITNESS_KEYS) &&
  isIdentifier(value.evidenceId) &&
  isIdentifier(value.artifactId) &&
  value.contractVersion ===
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_WITNESS_CONTRACT_VERSION &&
  isSha256(value.sha256) &&
  value.semanticInputClosureSha256 === closure &&
  value.witnessKind === "pointwise_absolute_uncertainty95_derivation" &&
  sameJson(
    value.outputRoles,
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_UNCERTAINTY_OUTPUT_ROLES,
  );

export const nhm2SemiclassicalV2ScienceDerivationAuthorityViolations = (
  value: unknown,
): string[] => {
  try {
    if (!isRecord(value)) return ["science_derivation_authority_shape_invalid"];
    const violations: string[] = [];
    if (!hasExactKeys(value, ROOT_KEYS)) violations.push("root_keys_not_exact");
    if (
      value.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_ARTIFACT_ID ||
      value.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_CONTRACT_VERSION ||
      value.phase !==
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_PHASE ||
      !isIsoTimestamp(value.generatedAt)
    ) {
      violations.push("authority_identity_or_time_invalid");
    }
    if (containsForbiddenLeverIdentity(value))
      violations.push("declared_lever_identity_forbidden");
    if (containsTrueBooleanProofAssertion(value))
      violations.push("boolean_only_true_proof_assertion_forbidden");

    const candidate = isRecord(value.candidateBinding)
      ? value.candidateBinding
      : null;
    if (
      candidate == null ||
      !hasExactKeys(candidate, CANDIDATE_KEYS) ||
      candidate.candidateManifestArtifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID ||
      candidate.candidateManifestContractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION ||
      ![
        candidate.candidateId,
        candidate.candidateManifestId,
        candidate.selectedProfileId,
        candidate.geometryId,
        candidate.quantumStateId,
        candidate.chartId,
        candidate.normalizationId,
        candidate.smearingFunctionId,
        candidate.samplingBasisId,
      ].every(isIdentifier) ||
      candidate.metricDemandInputId !== "metric_demand_tensor" ||
      candidate.metricDemandErrorBoundInputId !==
        "metric_demand_absolute_error_bound" ||
      candidate.metricDemandDerivationWitnessInputId !==
        "metric_demand_derivation_receipt" ||
      !isIsoTimestamp(candidate.candidateFrozenAt) ||
      !isSha256(candidate.candidateManifestSha256)
    ) {
      violations.push("candidate_binding_invalid");
    }

    const preseal = isRecord(value.presealBinding)
      ? value.presealBinding
      : null;
    if (
      preseal == null ||
      !hasExactKeys(preseal, PRESEAL_KEYS) ||
      preseal.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID ||
      preseal.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION ||
      !isIdentifier(preseal.sealKey) ||
      ![
        preseal.presealArtifactSha256,
        preseal.candidateManifestSha256,
        preseal.scientificContentSha256,
        preseal.sealedInventorySha256,
        preseal.serverPersistenceReceiptSha256,
      ].every(isSha256) ||
      !isIsoTimestamp(preseal.sealedAt) ||
      (candidate != null &&
        preseal.candidateManifestSha256 !== candidate.candidateManifestSha256)
    ) {
      violations.push("preseal_binding_invalid");
    }
    if (
      candidate != null &&
      preseal != null &&
      isIsoTimestamp(candidate.candidateFrozenAt) &&
      isIsoTimestamp(preseal.sealedAt) &&
      isIsoTimestamp(value.generatedAt) &&
      !(
        Date.parse(candidate.candidateFrozenAt) <=
          Date.parse(preseal.sealedAt) &&
        Date.parse(preseal.sealedAt) <= Date.parse(value.generatedAt)
      )
    ) {
      violations.push("freeze_preseal_authority_chronology_invalid");
    }

    const controls = isRecord(value.frozenControlBindings)
      ? value.frozenControlBindings
      : null;
    const normalization =
      controls != null && isRecord(controls.normalization)
        ? controls.normalization
        : null;
    const tolerance =
      controls != null && isRecord(controls.tolerancePolicy)
        ? controls.tolerancePolicy
        : null;
    if (controls == null || !hasExactKeys(controls, CONTROL_KEYS))
      violations.push("frozen_control_bindings_shape_invalid");
    if (
      normalization == null ||
      !hasExactKeys(normalization, NORMALIZATION_KEYS) ||
      normalization.inputId !== "normalization" ||
      normalization.artifactId !== "nhm2.semiclassical_v2.normalization" ||
      normalization.contractVersion !==
        "nhm2_semiclassical_v2_normalization/v1" ||
      !isIdentifier(normalization.scientificObjectId) ||
      (candidate != null &&
        normalization.scientificObjectId !== candidate.normalizationId) ||
      !isSha256(normalization.sha256) ||
      !Number.isSafeInteger(normalization.sizeBytes) ||
      Number(normalization.sizeBytes) <= 0
    )
      violations.push("normalization_control_binding_invalid");
    if (
      tolerance == null ||
      !hasExactKeys(tolerance, POLICY_KEYS) ||
      tolerance.inputId !== "tolerance_policy" ||
      tolerance.artifactId !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID ||
      tolerance.contractVersion !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION ||
      tolerance.policyId !== NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID ||
      tolerance.sha256 !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256 ||
      tolerance.sizeBytes !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes
    )
      violations.push("tolerance_policy_control_binding_invalid");

    const inputs = Array.isArray(value.semanticInputBindings)
      ? value.semanticInputBindings
      : [];
    if (
      inputs.length !==
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.length
    ) {
      violations.push("semantic_input_count_invalid");
    }
    inputs.forEach((entry, index) => {
      const expected =
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS[
          index
        ];
      if (
        expected == null ||
        !isRecord(entry) ||
        !hasExactKeys(entry, INPUT_KEYS) ||
        entry.ordinal !== index ||
        entry.inputId !== expected.inputId ||
        entry.artifactId !== expected.artifactId ||
        entry.contractVersion !== expected.contractVersion ||
        !isIdentifier(entry.scientificObjectId) ||
        !isSha256(entry.sha256) ||
        !Number.isSafeInteger(entry.sizeBytes) ||
        Number(entry.sizeBytes) <= 0
      )
        violations.push(`semantic_input_binding_invalid:${index}`);
    });
    const objectBinding = new Map(
      inputs
        .filter(isRecord)
        .map((entry) => [entry.inputId, entry.scientificObjectId]),
    );
    if (
      candidate != null &&
      (objectBinding.get("geometry") !== candidate.geometryId ||
        objectBinding.get("quantum_state") !== candidate.quantumStateId ||
        objectBinding.get("chart") !== candidate.chartId ||
        objectBinding.get("smearing_definition") !==
          candidate.smearingFunctionId ||
        objectBinding.get("sampling_basis") !== candidate.samplingBasisId)
    )
      violations.push("candidate_semantic_object_binding_mismatch");
    const typedInputs =
      inputs as Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1[];
    const expectedClosure =
      inputs.length ===
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.length
        ? computeNhm2SemiclassicalV2ScienceDerivationInputClosureSha256(
            typedInputs,
          )
        : null;
    if (
      expectedClosure == null ||
      value.semanticInputClosureSha256 !== expectedClosure
    ) {
      violations.push("semantic_input_closure_sha256_invalid");
    }
    const closure =
      typeof value.semanticInputClosureSha256 === "string"
        ? value.semanticInputClosureSha256
        : "";

    const dag = isRecord(value.dependencyDag) ? value.dependencyDag : null;
    const dagEdges = dag != null && Array.isArray(dag.edges) ? dag.edges : [];
    if (
      dag == null ||
      !hasExactKeys(dag, DAG_KEYS) ||
      dag.ordering !== "frozen_science_derivation_edge_order_v2" ||
      dag.edgeCount !==
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.length ||
      dag.dagSha256 !== NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 ||
      dag.validationMethod !==
        "server_contract_exact_edges_and_topological_cycle_check" ||
      !sameJson(dagEdges, NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES) ||
      dagEdges.some(
        (entry) => !isRecord(entry) || !hasExactKeys(entry, EDGE_KEYS),
      )
    )
      violations.push("dependency_dag_binding_invalid");
    if (
      !graphIsAcyclic(
        dagEdges as Nhm2SemiclassicalV2ScienceDerivationDagEdgeV1[],
      )
    ) {
      violations.push("dependency_dag_cycle_detected");
    }

    const evidencePolicy = isRecord(value.evidencePolicy)
      ? value.evidencePolicy
      : null;
    if (
      evidencePolicy == null ||
      !hasExactKeys(evidencePolicy, EVIDENCE_POLICY_KEYS) ||
      evidencePolicy.admittedProofKind !==
        "server_recomputed_byte_derivation_plus_independent_implementation_agreement" ||
      evidencePolicy.booleanOnlyAssertionDisposition !== "rejected" ||
      evidencePolicy.artifactIdentityDisposition !== "binding_only_not_proof" ||
      evidencePolicy.producerDeclarationDisposition !== "binding_only_not_proof"
    )
      violations.push("evidence_policy_invalid");

    const state = isRecord(value.stateAdmissibility)
      ? value.stateAdmissibility
      : null;
    if (
      state == null ||
      !hasExactKeys(state, STATE_KEYS) ||
      state.criterionId !==
        "hadamard_microlocal_spectrum_boundary_and_state_construction/v1" ||
      !sameJson(state.evidenceInputIds, [
        "field_equations",
        "boundary_conditions",
        "state_construction",
        "quantum_state",
      ]) ||
      !evidenceIdentityValid(state.evidence, closure) ||
      state.serverReplayStatus !== "not_replayed" ||
      state.authorityStatus !== "blocked"
    )
      violations.push("state_admissibility_preflight_invalid");

    const witnesses = isRecord(value.derivationWitnesses)
      ? value.derivationWitnesses
      : null;
    if (witnesses == null || !hasExactKeys(witnesses, WITNESSES_KEYS)) {
      violations.push("derivation_witnesses_shape_invalid");
    } else {
      if (
        !witnessIdentityValid(
          witnesses.meanRset,
          closure,
          "renormalized_state_expectation_derivation",
          "mean_rset",
        )
      )
        violations.push("mean_rset_witness_invalid");
      if (
        !witnessIdentityValid(
          witnesses.noiseKernel,
          closure,
          "connected_symmetrized_noise_derivation",
          "noise_kernel",
        )
      )
        violations.push("noise_kernel_witness_invalid");
      if (!uncertaintyWitnessValid(witnesses.uncertaintyBudget, closure)) {
        violations.push("uncertainty_budget_witness_invalid");
      }
      const derivationReceiptInput = inputs.find(
        (entry) =>
          isRecord(entry) &&
          entry.inputId === "metric_demand_derivation_receipt",
      ) as Record<string, unknown> | undefined;
      if (
        !witnessIdentityValid(
          witnesses.metricDemandErrorBound,
          closure,
          "metric_demand_deterministic_error_bound_derivation",
          "metric_demand_absolute_error_bound",
        ) ||
        !isRecord(witnesses.metricDemandErrorBound) ||
        witnesses.metricDemandErrorBound.sha256 !==
          derivationReceiptInput?.sha256
      ) {
        violations.push("metric_demand_error_bound_witness_invalid");
      }
      const brackets = Array.isArray(witnesses.bracketOperands)
        ? witnesses.bracketOperands
        : [];
      if (brackets.length !== NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.length)
        violations.push("bracket_operand_witness_count_invalid");
      brackets.forEach((entry, index) => {
        const bracketId = NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS[index];
        if (
          !isRecord(entry) ||
          !hasExactKeys(entry, BRACKET_WITNESS_KEYS) ||
          entry.bracketId !== bracketId ||
          !witnessIdentityValid(
            entry.computed,
            closure,
            "computed_constraint_bracket_operand_derivation",
            `constraint_bracket.${bracketId}.computed`,
          ) ||
          !witnessIdentityValid(
            entry.classicalTarget,
            closure,
            "classical_structure_function_operand_derivation",
            `constraint_bracket.${bracketId}.target`,
          ) ||
          (isRecord(entry.computed) &&
            isRecord(entry.classicalTarget) &&
            entry.computed.sha256 === entry.classicalTarget.sha256)
        )
          violations.push(`bracket_operand_witness_invalid:${index}`);
      });
    }

    const anomaly = isRecord(value.anomalyAssessment)
      ? value.anomalyAssessment
      : null;
    const anomalyDispositions = [
      "undetermined_pending_replay",
      "no_anomaly_claimed_pending_replay",
      "counterterms_declared_pending_replay",
      "anomaly_detected",
    ];
    const counterterms =
      anomaly != null && isRecord(anomaly.countertermBinding)
        ? anomaly.countertermBinding
        : null;
    const countertermInput = inputs.find(
      (entry) =>
        isRecord(entry) && entry.inputId === "renormalization_counterterms",
    ) as Record<string, unknown> | undefined;
    if (
      anomaly == null ||
      !hasExactKeys(anomaly, ANOMALY_KEYS) ||
      !anomalyDispositions.includes(String(anomaly.declaredDisposition)) ||
      !evidenceIdentityValid(anomaly.evidence, closure) ||
      anomaly.serverReplayStatus !== "not_replayed" ||
      anomaly.authorityStatus !== "blocked" ||
      counterterms == null ||
      !hasExactKeys(counterterms, COUNTERTERM_KEYS) ||
      counterterms.inputId !== "renormalization_counterterms" ||
      counterterms.inputSha256 !== countertermInput?.sha256 ||
      !evidenceIdentityValid(counterterms.evidence, closure)
    )
      violations.push("anomaly_assessment_or_counterterm_binding_invalid");

    const meanWitness =
      witnesses != null && isRecord(witnesses.meanRset)
        ? witnesses.meanRset
        : null;
    const uncertaintyWitness =
      witnesses != null && isRecord(witnesses.uncertaintyBudget)
        ? witnesses.uncertaintyBudget
        : null;
    const metricInput = inputs.find(
      (entry) => isRecord(entry) && entry.inputId === "metric_demand_tensor",
    ) as Record<string, unknown> | undefined;
    const metricErrorInput = inputs.find(
      (entry) =>
        isRecord(entry) &&
        entry.inputId === "metric_demand_absolute_error_bound",
    ) as Record<string, unknown> | undefined;
    const metricErrorWitness =
      witnesses != null && isRecord(witnesses.metricDemandErrorBound)
        ? witnesses.metricDemandErrorBound
        : null;
    const meanDemand = isRecord(value.meanDemandClosure)
      ? value.meanDemandClosure
      : null;
    if (
      meanDemand == null ||
      !hasExactKeys(meanDemand, CLOSURE_KEYS) ||
      meanDemand.requirement !== "mandatory_before_diagnostic_lamp_authority" ||
      meanDemand.comparisonId !==
        "pointwise_same_chart_mean_rset_minus_metric_demand_with_uncertainty/v2" ||
      meanDemand.meanRsetWitnessSha256 !== meanWitness?.sha256 ||
      meanDemand.meanRsetUncertaintyWitnessSha256 !==
        uncertaintyWitness?.sha256 ||
      meanDemand.metricDemandInputSha256 !== metricInput?.sha256 ||
      meanDemand.metricDemandErrorBoundWitnessSha256 !==
        metricErrorWitness?.sha256 ||
      meanDemand.metricDemandErrorBoundInputSha256 !==
        metricErrorInput?.sha256 ||
      meanDemand.normalizationInputSha256 !== normalization?.sha256 ||
      meanDemand.replayStatus !== "not_replayed" ||
      meanDemand.residualEvidence !== null ||
      meanDemand.authorityStatus !== "blocked"
    )
      violations.push("mean_metric_demand_closure_preflight_invalid");

    const disposition =
      anomaly?.declaredDisposition as Nhm2SemiclassicalV2ScienceDerivationAnomalyDispositionV1;
    const expectedBlockers = anomalyDispositions.includes(String(disposition))
      ? blockersFor(disposition)
      : [];
    const authority = isRecord(value.authorityState)
      ? value.authorityState
      : null;
    if (
      authority == null ||
      !hasExactKeys(authority, AUTHORITY_KEYS) ||
      authority.status !== "blocked" ||
      authority.firstBlocker !== "server_science_derivation_replay_missing" ||
      !sameJson(authority.blockers, expectedBlockers)
    )
      violations.push("authority_state_not_fail_closed");

    const locks = isRecord(value.claimLocks) ? value.claimLocks : null;
    if (
      locks == null ||
      !hasExactKeys(locks, CLAIM_LOCK_KEYS) ||
      CLAIM_LOCK_KEYS.some((key) => locks[key] !== false)
    )
      violations.push("claim_locks_not_all_false");
    return unique(violations);
  } catch {
    return ["science_derivation_authority_shape_invalid"];
  }
};

export const isNhm2SemiclassicalV2ScienceDerivationAuthority = (
  value: unknown,
): value is Nhm2SemiclassicalV2ScienceDerivationAuthorityV1 =>
  nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value).length === 0;
