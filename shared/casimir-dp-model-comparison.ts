// math-stage: diagnostic
import {
  preflightCasimirDpManifoldBridge,
  type CasimirDpManifoldKernelEntryResult,
  type CasimirDpManifoldKernelRegistryInput,
} from "./casimir-dp-manifold-kernel-registry";

export const CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS = [
  "qed_hamiltonian",
  "technical_dephasing",
  "qed_environmental_decoherence",
  "ordinary_gravity",
] as const;

export type CasimirDpOrdinaryBaselineComponent =
  (typeof CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS)[number];

export type CasimirDpModelComparisonStatus =
  | "not_disfavored_within_powered_region"
  | "disfavored"
  | "not_identifiable"
  | "not_ready"
  | "blocked";

export type CasimirDpStage3Prediction = {
  row_id: string;
  value: number;
};

export type CasimirDpStage3DesignCell = {
  cell_id: string;
  partition: "pilot" | "confirmatory";
  blind_boundary_label: string;
  /** A populated true label is prohibited input to feature construction. */
  true_boundary_state?: string | null;
  object_id: string;
  mass_kg: number;
  density_profile_id: string;
  branch_separation_m: number;
  hold_time_s: number;
  probe_to_boundary_distance_m: number;
  cavity_gap_m: number;
  boundary_material_id: string;
  boundary_loss_response_id: string;
  boundary_temperature_K: number;
  environment_temperature_K: number;
  path_orientation: -1 | 1;
  path_swap: boolean;
  echo_sequence_id: string;
};

export type CasimirDpStage3Observation = {
  row_id: string;
  cell_id: string;
  observable_id: string;
  channel:
    | "coherence_re"
    | "coherence_im"
    | "raw_visibility"
    | "phase_conditioned_visibility"
    | "qed_phase"
    | "force_noise"
    | "heating"
    | "dp_companion"
    | "gravity_control"
    | "bridge_companion";
  value: number;
  sigma: number;
};

export type CasimirDpStage3BaselineComponent = {
  component_id: CasimirDpOrdinaryBaselineComponent;
  source_ref: string;
  equation_ids: string[];
  frozen_signature_sha256: string;
  predictions: CasimirDpStage3Prediction[];
};

export type CasimirDpStage3AlternativeModel = {
  model_id: string;
  model_kind: "named_dynamical_dp" | "registered_bridge";
  model_version: string;
  source_refs: string[];
  equation_ids: string[];
  nested_baseline_id: "M0_ordinary_physics";
  parameter_manifest_sha256: string;
  frozen_signature_sha256: string;
  incremental_predictions: CasimirDpStage3Prediction[];
  companion_observable_ids: string[];
  proper_prior: {
    required: boolean;
    is_proper: boolean;
    receipt_sha256: string | null;
    sensitivity_report_sha256: string | null;
  };
  falsifier: {
    criterion: "maximum_weighted_residual_chi_square";
    rejection_threshold_chi_square: number;
  };
  power: {
    minimum_power: number;
    achieved_power: number;
    parameter_region_ids: string[];
    covered_parameter_region_ids: string[];
  };
  maximum_claim:
    | "named_dp_implementation_compatibility_or_exclusion"
    | "specific_registered_bridge_compatibility_or_exclusion";
  bridge_registry?: {
    registry: CasimirDpManifoldKernelRegistryInput;
    entry_model_id: string;
  };
};

export type CasimirDpBlindedModelComparisonInput = {
  schema_version: "casimir_dp_blinded_model_comparison/1";
  campaign_id: string;
  evidence_class: "synthetic" | "measured";
  freeze_receipt: {
    frozen_at: string;
    model_registry_sha256: string;
    likelihood_registry_sha256: string;
    nuisance_registry_sha256: string;
    prior_registry_sha256: string;
    falsifier_registry_sha256: string;
    confirmatory_cells_sha256: string;
  };
  blinding: {
    state: "sealed" | "unblinded_by_custodian";
    mapping_available_during_feature_construction: boolean;
    mapping_available_during_nuisance_fit: boolean;
    custodian_receipt_sha256: string | null;
    unblinded_at: string | null;
  };
  nuisance_fit: {
    training_cell_ids: string[];
    heldout_cell_ids: string[];
    fit_frozen_at: string;
    sensitivity_passed: boolean;
    sensitivity_receipt_sha256: string;
  };
  inference: {
    scoring_rule:
      | "heldout_gaussian_log_score"
      | "bayes_factor_point_hypotheses";
    bayes_factor_proper_prior_receipt_sha256: string | null;
    bayes_factor_prior_sensitivity_sha256: string | null;
    maximum_abs_signature_cosine: number;
    minimum_whitened_signal_norm: number;
    minimum_confirmatory_rows: number;
    required_design_rank: number;
    observed_design_rank: number;
    simulation_calibration_passed: boolean;
    multiple_testing_control: string;
    baseline_rejection_threshold_chi_square: number;
    baseline_minimum_power: number;
    baseline_achieved_power: number;
    baseline_covered_region_id: string;
  };
  design_cells: CasimirDpStage3DesignCell[];
  observations: CasimirDpStage3Observation[];
  ordinary_baseline_components: CasimirDpStage3BaselineComponent[];
  alternative_models: CasimirDpStage3AlternativeModel[];
};

export type CasimirDpModelComparisonFailure = {
  code: string;
  reason: string;
};

export type CasimirDpModelComparisonModelResult = {
  model_id: string;
  model_kind:
    | "composite_ordinary_physics_baseline"
    | "named_dynamical_dp"
    | "registered_bridge";
  nested_baseline_id: "M0_ordinary_physics" | null;
  status: CasimirDpModelComparisonStatus;
  first_failure_code: string | null;
  failures: CasimirDpModelComparisonFailure[];
  heldout_log_score: number | null;
  weighted_residual_chi_square: number | null;
  delta_log_score_vs_M0: number | null;
  bayes_factor_vs_M0: number | null;
  whitened_signature_norm: number | null;
  maximum_abs_signature_cosine: number | null;
  powered_parameter_region_ids: string[];
  excluded_parameter_region_ids: string[];
  maximum_claim:
    | "ordinary_physics_closure_or_residual_only"
    | "named_dp_implementation_compatibility_or_exclusion"
    | "specific_registered_bridge_compatibility_or_exclusion";
  bridge_registry_preflight: CasimirDpManifoldKernelEntryResult | null;
  confirmation_claim_allowed: false;
  ontology_or_proof_verdict: null;
};

export type CasimirDpBlindedModelComparisonResult = {
  schema_version: "casimir_dp_blinded_model_comparison_result/1";
  campaign_id: string;
  evidence_class: "synthetic" | "measured";
  status: CasimirDpModelComparisonStatus;
  comparison_executed: boolean;
  first_failure_code: string | null;
  failures: CasimirDpModelComparisonFailure[];
  composite_baseline: {
    model_id: "M0_ordinary_physics";
    components: readonly CasimirDpOrdinaryBaselineComponent[];
  };
  model_results: CasimirDpModelComparisonModelResult[];
  heldout_row_ids: string[];
  nuisance_training_row_ids: string[];
  bayes_factor_gate: "not_requested" | "pass" | "blocked";
  measured_evidence_gate: "not_ready";
  collapse_identification: "blocked";
  manifold_dynamics: "blocked";
  claim_ceiling: "diagnostic";
  maximum_global_claim: "comparison_among_specified_models_only";
  status_language: "not_disfavored_within_powered_region_is_not_confirmation";
  ontology_or_proof_verdict: null;
};

const SHA256 = /^[a-f0-9]{64}$/;

function validSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256.test(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validInstant(value: unknown): value is string {
  return nonEmpty(value) && Number.isFinite(Date.parse(value));
}

function failure(code: string, reason: string): CasimirDpModelComparisonFailure {
  return { code, reason };
}

function predictionMap(
  predictions: CasimirDpStage3Prediction[],
): Map<string, number> | null {
  const map = new Map<string, number>();
  for (const prediction of predictions) {
    if (
      !nonEmpty(prediction.row_id) ||
      !Number.isFinite(prediction.value) ||
      map.has(prediction.row_id)
    ) {
      return null;
    }
    map.set(prediction.row_id, prediction.value);
  }
  return map;
}

function gaussianScore(
  observations: CasimirDpStage3Observation[],
  predictions: Map<string, number>,
): { logScore: number; chiSquare: number } | null {
  let logScore = 0;
  let chiSquare = 0;
  for (const observation of observations) {
    const predicted = predictions.get(observation.row_id);
    if (
      predicted == null ||
      !Number.isFinite(observation.value) ||
      !Number.isFinite(observation.sigma) ||
      observation.sigma <= 0
    ) {
      return null;
    }
    const residual = (observation.value - predicted) / observation.sigma;
    chiSquare += residual ** 2;
    logScore +=
      -0.5 * residual ** 2 -
      Math.log(observation.sigma * Math.sqrt(2 * Math.PI));
  }
  return { logScore, chiSquare };
}

function cosine(left: number[], right: number[]): number {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const norm = Math.hypot(...left) * Math.hypot(...right);
  return dot / Math.max(norm, Number.MIN_VALUE);
}

function blockedModelResult(args: {
  model: CasimirDpStage3AlternativeModel;
  status?: "blocked" | "not_ready" | "not_identifiable";
  failure: CasimirDpModelComparisonFailure;
  bridgePreflight?: CasimirDpManifoldKernelEntryResult | null;
  signatureNorm?: number | null;
  signatureCosine?: number | null;
}): CasimirDpModelComparisonModelResult {
  const status = args.status ?? "blocked";
  const diagnosticNumbersAllowed = status !== "blocked";
  return {
    model_id: args.model.model_id,
    model_kind: args.model.model_kind,
    nested_baseline_id: "M0_ordinary_physics",
    status,
    first_failure_code: args.failure.code,
    failures: [args.failure],
    heldout_log_score: null,
    weighted_residual_chi_square: null,
    delta_log_score_vs_M0: null,
    bayes_factor_vs_M0: null,
    whitened_signature_norm: diagnosticNumbersAllowed
      ? args.signatureNorm ?? null
      : null,
    maximum_abs_signature_cosine: diagnosticNumbersAllowed
      ? args.signatureCosine ?? null
      : null,
    powered_parameter_region_ids: [],
    excluded_parameter_region_ids: [],
    maximum_claim: args.model.maximum_claim,
    bridge_registry_preflight: args.bridgePreflight ?? null,
    confirmation_claim_allowed: false,
    ontology_or_proof_verdict: null,
  };
}

function globalFailureResult(
  input: CasimirDpBlindedModelComparisonInput,
  status: "blocked" | "not_ready",
  problem: CasimirDpModelComparisonFailure,
): CasimirDpBlindedModelComparisonResult {
  const baseline: CasimirDpModelComparisonModelResult = {
    model_id: "M0_ordinary_physics",
    model_kind: "composite_ordinary_physics_baseline",
    nested_baseline_id: null,
    status,
    first_failure_code: problem.code,
    failures: [problem],
    heldout_log_score: null,
    weighted_residual_chi_square: null,
    delta_log_score_vs_M0: null,
    bayes_factor_vs_M0: null,
    whitened_signature_norm: null,
    maximum_abs_signature_cosine: null,
    powered_parameter_region_ids: [],
    excluded_parameter_region_ids: [],
    maximum_claim: "ordinary_physics_closure_or_residual_only",
    bridge_registry_preflight: null,
    confirmation_claim_allowed: false,
    ontology_or_proof_verdict: null,
  };
  const alternatives = [...input.alternative_models]
    .sort((left, right) => left.model_id.localeCompare(right.model_id))
    .map((model) =>
      blockedModelResult({
        model,
        status,
        failure: problem,
      })
    );
  return {
    schema_version: "casimir_dp_blinded_model_comparison_result/1",
    campaign_id: input.campaign_id,
    evidence_class: input.evidence_class,
    status,
    comparison_executed: false,
    first_failure_code: problem.code,
    failures: [problem],
    composite_baseline: {
      model_id: "M0_ordinary_physics",
      components: CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS,
    },
    model_results: [baseline, ...alternatives],
    heldout_row_ids: [],
    nuisance_training_row_ids: [],
    bayes_factor_gate:
      input.inference.scoring_rule === "bayes_factor_point_hypotheses"
        ? "blocked"
        : "not_requested",
    measured_evidence_gate: "not_ready",
    collapse_identification: "blocked",
    manifold_dynamics: "blocked",
    claim_ceiling: "diagnostic",
    maximum_global_claim: "comparison_among_specified_models_only",
    status_language:
      "not_disfavored_within_powered_region_is_not_confirmation",
    ontology_or_proof_verdict: null,
  };
}

function findGlobalFailure(
  input: CasimirDpBlindedModelComparisonInput,
): { status: "blocked" | "not_ready"; failure: CasimirDpModelComparisonFailure } | null {
  if (input.schema_version !== "casimir_dp_blinded_model_comparison/1") {
    return {
      status: "blocked",
      failure: failure("MC_SCHEMA_VERSION_INVALID", "The Stage-3 model-comparison schema version is invalid."),
    };
  }
  if (
    input.alternative_models.some(
      (model) =>
        !["named_dynamical_dp", "registered_bridge"].includes(
          model.model_kind as string,
        ) ||
        /generic[_ -]?collapse/i.test(model.model_id),
    )
  ) {
    return {
      status: "blocked",
      failure: failure("MC_GENERIC_COLLAPSE_MODEL_FORBIDDEN", "Only named dynamical-DP and registered-bridge alternatives are admitted."),
    };
  }
  const alternativeModelIds = input.alternative_models.map(
    (model) => model.model_id,
  );
  if (
    alternativeModelIds.some((modelId) => !nonEmpty(modelId)) ||
    new Set(alternativeModelIds).size !== alternativeModelIds.length
  ) {
    return {
      status: "blocked",
      failure: failure(
        "MC_MODEL_IDENTITY_INVALID",
        "Every nested alternative requires a unique, nonempty model id.",
      ),
    };
  }
  if (
    input.blinding.mapping_available_during_feature_construction ||
    input.blinding.mapping_available_during_nuisance_fit ||
    input.design_cells.some((cell) => nonEmpty(cell.true_boundary_state))
  ) {
    return {
      status: "blocked",
      failure: failure("MC_BLIND_LABEL_LEAK", "True boundary labels may not enter feature construction or nuisance fitting."),
    };
  }

  const freezeHashes = [
    input.freeze_receipt.model_registry_sha256,
    input.freeze_receipt.likelihood_registry_sha256,
    input.freeze_receipt.nuisance_registry_sha256,
    input.freeze_receipt.prior_registry_sha256,
    input.freeze_receipt.falsifier_registry_sha256,
    input.freeze_receipt.confirmatory_cells_sha256,
  ];
  if (
    !validInstant(input.freeze_receipt.frozen_at) ||
    freezeHashes.some((hash) => !validSha256(hash))
  ) {
    return {
      status: "blocked",
      failure: failure("MC_FREEZE_RECEIPT_INVALID", "Model, likelihood, nuisance, prior, falsifier, and confirmatory-cell freezes require valid receipts."),
    };
  }
  if (input.blinding.state !== "unblinded_by_custodian") {
    return {
      status: "not_ready",
      failure: failure("MC_CUSTODIAN_UNBLINDING_REQUIRED", "The confirmatory job remains sealed pending explicit custodian unblinding."),
    };
  }
  if (
    !validSha256(input.blinding.custodian_receipt_sha256) ||
    !validInstant(input.blinding.unblinded_at)
  ) {
    return {
      status: "blocked",
      failure: failure("MC_CUSTODIAN_RECEIPT_INVALID", "Explicit custodian unblinding requires a valid timestamp and receipt hash."),
    };
  }
  if (
    Date.parse(input.freeze_receipt.frozen_at) >=
      Date.parse(input.blinding.unblinded_at) ||
    !validInstant(input.nuisance_fit.fit_frozen_at) ||
    Date.parse(input.nuisance_fit.fit_frozen_at) >=
      Date.parse(input.blinding.unblinded_at)
  ) {
    return {
      status: "blocked",
      failure: failure("MC_SIGNATURES_NOT_FROZEN_BEFORE_UNBLINDING", "Every model and nuisance fit must be frozen before custodian unblinding."),
    };
  }

  const training = new Set(input.nuisance_fit.training_cell_ids);
  const heldout = new Set(input.nuisance_fit.heldout_cell_ids);
  if ([...training].some((id) => heldout.has(id))) {
    return {
      status: "blocked",
      failure: failure("MC_HELDOUT_NUISANCE_LEAKAGE", "Held-out cells may not be used for nuisance training."),
    };
  }
  const cellsById = new Map(input.design_cells.map((cell) => [cell.cell_id, cell]));
  const observationRowIds = input.observations.map((row) => row.row_id);
  if (
    cellsById.size !== input.design_cells.length ||
    input.design_cells.some((cell) => !nonEmpty(cell.cell_id)) ||
    new Set(observationRowIds).size !== observationRowIds.length ||
    observationRowIds.some((rowId) => !nonEmpty(rowId))
  ) {
    return {
      status: "blocked",
      failure: failure(
        "MC_DESIGN_IDENTIFIERS_INVALID",
        "Design-cell and observation-row identifiers must be unique and nonempty.",
      ),
    };
  }
  if (
    [...training].some((id) => cellsById.get(id)?.partition !== "pilot") ||
    [...heldout].some((id) => cellsById.get(id)?.partition !== "confirmatory")
  ) {
    return {
      status: "blocked",
      failure: failure("MC_PARTITION_CONTRACT_INVALID", "Training cells must be pilot cells and held-out cells must be confirmatory cells."),
    };
  }
  if (
    !input.nuisance_fit.sensitivity_passed ||
    !validSha256(input.nuisance_fit.sensitivity_receipt_sha256)
  ) {
    return {
      status: "not_ready",
      failure: failure("MC_NUISANCE_SENSITIVITY_NOT_READY", "Nuisance sensitivity and its receipt must close before comparison."),
    };
  }

  const hierarchy = new Map<
    string,
    { mass_kg: number; density_profile_id: string; material: string }
  >();
  for (const cell of input.design_cells) {
    const prior = hierarchy.get(cell.object_id);
    const identity = {
      mass_kg: cell.mass_kg,
      density_profile_id: cell.density_profile_id,
      material: cell.boundary_material_id,
    };
    if (
      prior != null &&
      (prior.mass_kg !== identity.mass_kg ||
        prior.density_profile_id !== identity.density_profile_id ||
        prior.material !== identity.material)
    ) {
      return {
        status: "blocked",
        failure: failure("MC_HIERARCHY_WITHIN_OBJECT_MUTATION", "Mass, density profile, and bulk material scans must remain between-object hierarchical factors."),
      };
    }
    hierarchy.set(cell.object_id, identity);
  }

  const baselineIds = input.ordinary_baseline_components.map(
    (component) => component.component_id,
  );
  if (
    input.ordinary_baseline_components.length !==
      CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS.length ||
    CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS.some(
      (id) => baselineIds.filter((candidate) => candidate === id).length !== 1,
    )
  ) {
    return {
      status: "blocked",
      failure: failure("MC_COMPOSITE_M0_INCOMPLETE", "M0 must contain exactly QED Hamiltonian, technical dephasing, QED/environmental decoherence, and ordinary gravity."),
    };
  }
  if (
    input.ordinary_baseline_components.some(
      (component) =>
        !nonEmpty(component.source_ref) ||
        component.equation_ids.length === 0 ||
        component.equation_ids.some((equationId) => !nonEmpty(equationId)) ||
        !validSha256(component.frozen_signature_sha256),
    )
  ) {
    return {
      status: "blocked",
      failure: failure("MC_BASELINE_SIGNATURE_RECEIPT_INVALID", "Every ordinary-physics component requires sources, equations, and a frozen signature receipt."),
    };
  }
  if (
    !Number.isFinite(input.inference.maximum_abs_signature_cosine) ||
    input.inference.maximum_abs_signature_cosine < 0 ||
    input.inference.maximum_abs_signature_cosine >= 1 ||
    !Number.isFinite(input.inference.minimum_whitened_signal_norm) ||
    input.inference.minimum_whitened_signal_norm <= 0 ||
    !Number.isInteger(input.inference.minimum_confirmatory_rows) ||
    input.inference.minimum_confirmatory_rows <= 0 ||
    !Number.isInteger(input.inference.required_design_rank) ||
    !Number.isInteger(input.inference.observed_design_rank) ||
    !Number.isFinite(
      input.inference.baseline_rejection_threshold_chi_square,
    ) ||
    input.inference.baseline_rejection_threshold_chi_square <= 0 ||
    !Number.isFinite(input.inference.baseline_minimum_power) ||
    input.inference.baseline_minimum_power <= 0 ||
    input.inference.baseline_minimum_power >= 1 ||
    !Number.isFinite(input.inference.baseline_achieved_power) ||
    input.inference.baseline_achieved_power < 0 ||
    input.inference.baseline_achieved_power > 1 ||
    !nonEmpty(input.inference.baseline_covered_region_id)
  ) {
    return {
      status: "blocked",
      failure: failure(
        "MC_INFERENCE_THRESHOLDS_INVALID",
        "Identifiability, row-count, rank, falsifier, power, and covered-region thresholds must be finite and preregistered.",
      ),
    };
  }
  if (
    input.inference.observed_design_rank <
      input.inference.required_design_rank ||
    input.inference.required_design_rank <= 0
  ) {
    return {
      status: "not_ready",
      failure: failure("MC_DESIGN_RANK_NOT_READY", "The preregistered design rank has not been reached."),
    };
  }
  if (
    !input.inference.simulation_calibration_passed ||
    !nonEmpty(input.inference.multiple_testing_control)
  ) {
    return {
      status: "not_ready",
      failure: failure("MC_INFERENCE_CALIBRATION_NOT_READY", "Simulation calibration and multiple-testing control are required."),
    };
  }
  const heldoutRows = input.observations.filter((observation) =>
    heldout.has(observation.cell_id)
  );
  if (
    heldoutRows.length < input.inference.minimum_confirmatory_rows ||
    heldoutRows.some(
      (row) =>
        !Number.isFinite(row.value) ||
        !Number.isFinite(row.sigma) ||
        row.sigma <= 0,
    )
  ) {
    return {
      status: "not_ready",
      failure: failure("MC_CONFIRMATORY_ROWS_NOT_READY", "The held-out joint observation vector is incomplete or invalid."),
    };
  }
  return null;
}

function overallStatus(
  results: CasimirDpModelComparisonModelResult[],
): CasimirDpModelComparisonStatus {
  const priority: CasimirDpModelComparisonStatus[] = [
    "blocked",
    "not_ready",
    "not_identifiable",
    "disfavored",
    "not_disfavored_within_powered_region",
  ];
  return priority.find((status) => results.some((result) => result.status === status)) ??
    "blocked";
}

export function runCasimirDpBlindedModelComparison(
  input: CasimirDpBlindedModelComparisonInput,
): CasimirDpBlindedModelComparisonResult {
  const globalFailure = findGlobalFailure(input);
  if (globalFailure != null) {
    return globalFailureResult(
      input,
      globalFailure.status,
      globalFailure.failure,
    );
  }

  const heldoutCellIds = new Set(input.nuisance_fit.heldout_cell_ids);
  const trainingCellIds = new Set(input.nuisance_fit.training_cell_ids);
  const heldoutObservations = input.observations.filter((row) =>
    heldoutCellIds.has(row.cell_id)
  );
  const trainingRows = input.observations
    .filter((row) => trainingCellIds.has(row.cell_id))
    .map((row) => row.row_id);

  const baselinePredictions = new Map<string, number>(
    heldoutObservations.map((row) => [row.row_id, 0]),
  );
  for (const component of input.ordinary_baseline_components) {
    const predictions = predictionMap(component.predictions);
    if (
      predictions == null ||
      heldoutObservations.some((row) => !predictions.has(row.row_id))
    ) {
      return globalFailureResult(
        input,
        "blocked",
        failure("MC_BASELINE_PREDICTION_MISSING", "Every M0 component must predict every held-out joint row."),
      );
    }
    for (const row of heldoutObservations) {
      baselinePredictions.set(
        row.row_id,
        baselinePredictions.get(row.row_id)! + predictions.get(row.row_id)!,
      );
    }
  }
  const baselineScore = gaussianScore(heldoutObservations, baselinePredictions);
  if (baselineScore == null) {
    return globalFailureResult(
      input,
      "blocked",
      failure("MC_BASELINE_SCORE_INVALID", "The frozen M0 prediction cannot be scored against the held-out vector."),
    );
  }

  const baselinePowered =
    input.inference.baseline_achieved_power >=
      input.inference.baseline_minimum_power;
  const baselineStatus: CasimirDpModelComparisonStatus = !baselinePowered
    ? "not_ready"
    : baselineScore.chiSquare >
        input.inference.baseline_rejection_threshold_chi_square
      ? "disfavored"
      : "not_disfavored_within_powered_region";
  const baselineResult: CasimirDpModelComparisonModelResult = {
    model_id: "M0_ordinary_physics",
    model_kind: "composite_ordinary_physics_baseline",
    nested_baseline_id: null,
    status: baselineStatus,
    first_failure_code: baselinePowered ? null : "MC_BASELINE_POWER_NOT_READY",
    failures: baselinePowered
      ? []
      : [failure("MC_BASELINE_POWER_NOT_READY", "M0 cannot be excluded outside its powered baseline region.")],
    heldout_log_score: baselineScore.logScore,
    weighted_residual_chi_square: baselineScore.chiSquare,
    delta_log_score_vs_M0: 0,
    bayes_factor_vs_M0:
      input.inference.scoring_rule === "bayes_factor_point_hypotheses" ? 1 : null,
    whitened_signature_norm: 0,
    maximum_abs_signature_cosine: null,
    powered_parameter_region_ids: baselinePowered
      ? [input.inference.baseline_covered_region_id]
      : [],
    excluded_parameter_region_ids:
      baselinePowered && baselineStatus === "disfavored"
        ? [input.inference.baseline_covered_region_id]
        : [],
    maximum_claim: "ordinary_physics_closure_or_residual_only",
    bridge_registry_preflight: null,
    confirmation_claim_allowed: false,
    ontology_or_proof_verdict: null,
  };

  const properBayesianReceipts =
    input.inference.scoring_rule !== "bayes_factor_point_hypotheses" ||
    (validSha256(
      input.inference.bayes_factor_proper_prior_receipt_sha256,
    ) &&
      validSha256(
        input.inference.bayes_factor_prior_sensitivity_sha256,
      ));

  type PreparedAlternative = {
    model: CasimirDpStage3AlternativeModel;
    bridgePreflight: CasimirDpManifoldKernelEntryResult | null;
    predictions: Map<string, number>;
    signature: number[];
    signatureNorm: number;
  };
  const prepared: PreparedAlternative[] = [];
  const preResults = new Map<string, CasimirDpModelComparisonModelResult>();

  for (const model of [...input.alternative_models].sort((left, right) =>
    left.model_id.localeCompare(right.model_id)
  )) {
    if (
      !nonEmpty(model.model_id) ||
      !nonEmpty(model.model_version) ||
      model.source_refs.length === 0 ||
      model.source_refs.some((sourceRef) => !nonEmpty(sourceRef)) ||
      model.equation_ids.length === 0 ||
      model.equation_ids.some((equationId) => !nonEmpty(equationId)) ||
      !validSha256(model.parameter_manifest_sha256) ||
      !validSha256(model.frozen_signature_sha256) ||
      model.nested_baseline_id !== "M0_ordinary_physics" ||
      (model.model_kind === "named_dynamical_dp" &&
        model.maximum_claim !==
          "named_dp_implementation_compatibility_or_exclusion") ||
      (model.model_kind === "registered_bridge" &&
        model.maximum_claim !==
          "specific_registered_bridge_compatibility_or_exclusion") ||
      model.falsifier.criterion !==
        "maximum_weighted_residual_chi_square" ||
      !Number.isFinite(model.falsifier.rejection_threshold_chi_square) ||
      model.falsifier.rejection_threshold_chi_square <= 0 ||
      !Number.isFinite(model.power.minimum_power) ||
      model.power.minimum_power <= 0 ||
      model.power.minimum_power >= 1 ||
      !Number.isFinite(model.power.achieved_power) ||
      model.power.achieved_power < 0 ||
      model.power.achieved_power > 1 ||
      model.power.parameter_region_ids.length === 0 ||
      new Set(model.power.parameter_region_ids).size !==
        model.power.parameter_region_ids.length ||
      new Set(model.power.covered_parameter_region_ids).size !==
        model.power.covered_parameter_region_ids.length
    ) {
      preResults.set(model.model_id, blockedModelResult({
        model,
        failure: failure("MC_MODEL_REGISTRATION_INCOMPLETE", "The named nested model is missing frozen sources, equations, parameters, or signature receipts."),
      }));
      continue;
    }

    let bridgePreflight: CasimirDpManifoldKernelEntryResult | null = null;
    if (model.model_kind === "registered_bridge") {
      if (model.bridge_registry == null) {
        preResults.set(model.model_id, blockedModelResult({
          model,
          failure: failure("MC_BRIDGE_REGISTRY_PREFLIGHT_MISSING", "A bridge must pass the manifold-kernel registry before any numerical comparison."),
        }));
        continue;
      }
      bridgePreflight = preflightCasimirDpManifoldBridge(
        model.bridge_registry.registry,
        model.bridge_registry.entry_model_id,
      );
      if (
        bridgePreflight.status !== "registered" ||
        model.bridge_registry.entry_model_id !== model.model_id ||
        bridgePreflight.registered_companion_observable_id == null ||
        !model.companion_observable_ids.includes(
          bridgePreflight.registered_companion_observable_id,
        )
      ) {
        preResults.set(model.model_id, blockedModelResult({
          model,
          failure: failure(
            bridgePreflight.first_failure_code ??
              "MC_BRIDGE_REGISTRY_PREFLIGHT_FAILED",
            "The bridge registry failed closed before prediction construction or scoring.",
          ),
          bridgePreflight,
        }));
        continue;
      }
    }

    if (
      input.inference.scoring_rule === "bayes_factor_point_hypotheses" &&
      (!properBayesianReceipts ||
        model.proper_prior.required !== true ||
        model.proper_prior.is_proper !== true ||
        !validSha256(model.proper_prior.receipt_sha256) ||
        !validSha256(model.proper_prior.sensitivity_report_sha256))
    ) {
      preResults.set(model.model_id, blockedModelResult({
        model,
        failure: failure("MC_BAYES_FACTOR_PRIOR_BLOCKED", "A Bayes factor requires frozen proper-prior and prior-sensitivity receipts."),
        bridgePreflight,
      }));
      continue;
    }
    if (
      model.companion_observable_ids.length === 0 ||
      !model.companion_observable_ids.some((observableId) =>
        heldoutObservations.some(
          (row) => row.observable_id === observableId,
        )
      )
    ) {
      preResults.set(model.model_id, blockedModelResult({
        model,
        failure: failure("MC_COMPANION_CHANNEL_MISSING", "A named intrinsic or bridge model requires a registered companion channel in the held-out vector."),
        bridgePreflight,
      }));
      continue;
    }

    const increments = predictionMap(model.incremental_predictions);
    if (
      increments == null ||
      heldoutObservations.some((row) => !increments.has(row.row_id))
    ) {
      preResults.set(model.model_id, blockedModelResult({
        model,
        failure: failure("MC_PREDICTION_MISSING", "The nested model must predict every held-out joint row."),
        bridgePreflight,
      }));
      continue;
    }
    const predictions = new Map<string, number>();
    const signature = heldoutObservations.map((row) => {
      const increment = increments.get(row.row_id)!;
      predictions.set(
        row.row_id,
        baselinePredictions.get(row.row_id)! + increment,
      );
      return increment / row.sigma;
    });
    prepared.push({
      model,
      bridgePreflight,
      predictions,
      signature,
      signatureNorm: Math.hypot(...signature),
    });
  }

  const maximumCosines = new Map<string, number>();
  for (const left of prepared) {
    let maximum = 0;
    for (const right of prepared) {
      if (left.model.model_id === right.model.model_id) continue;
      maximum = Math.max(
        maximum,
        Math.abs(cosine(left.signature, right.signature)),
      );
    }
    maximumCosines.set(left.model.model_id, maximum);
  }

  const evaluatedResults = new Map<string, CasimirDpModelComparisonModelResult>();
  for (const item of prepared) {
    const maximumCosine = maximumCosines.get(item.model.model_id) ?? 0;
    if (
      item.signatureNorm <
        input.inference.minimum_whitened_signal_norm ||
      maximumCosine >
        input.inference.maximum_abs_signature_cosine
    ) {
      evaluatedResults.set(item.model.model_id, blockedModelResult({
        model: item.model,
        status: "not_identifiable",
        failure: failure("MC_SIGNATURES_NOT_IDENTIFIABLE", "The whitened held-out signatures are too small or too collinear for model discrimination."),
        bridgePreflight: item.bridgePreflight,
        signatureNorm: item.signatureNorm,
        signatureCosine: maximumCosine,
      }));
      continue;
    }

    const coveredRegionIds = item.model.power.covered_parameter_region_ids.filter(
      (regionId) => item.model.power.parameter_region_ids.includes(regionId),
    );
    const powered =
      item.model.power.minimum_power > 0.5 &&
      item.model.power.minimum_power < 1 &&
      item.model.power.achieved_power >= item.model.power.minimum_power &&
      coveredRegionIds.length > 0;
    if (!powered) {
      evaluatedResults.set(item.model.model_id, blockedModelResult({
        model: item.model,
        status: "not_ready",
        failure: failure("MC_PARAMETER_REGION_POWER_NOT_READY", "No preregistered parameter region has demonstrated the required sensitivity."),
        bridgePreflight: item.bridgePreflight,
        signatureNorm: item.signatureNorm,
        signatureCosine: maximumCosine,
      }));
      continue;
    }

    const score = gaussianScore(heldoutObservations, item.predictions);
    if (score == null) {
      evaluatedResults.set(item.model.model_id, blockedModelResult({
        model: item.model,
        failure: failure("MC_MODEL_SCORE_INVALID", "The nested held-out prediction could not be scored."),
        bridgePreflight: item.bridgePreflight,
        signatureNorm: item.signatureNorm,
        signatureCosine: maximumCosine,
      }));
      continue;
    }
    const status: CasimirDpModelComparisonStatus =
      score.chiSquare >
        item.model.falsifier.rejection_threshold_chi_square
        ? "disfavored"
        : "not_disfavored_within_powered_region";
    const deltaLogScore = score.logScore - baselineScore.logScore;
    evaluatedResults.set(item.model.model_id, {
      model_id: item.model.model_id,
      model_kind: item.model.model_kind,
      nested_baseline_id: "M0_ordinary_physics",
      status,
      first_failure_code: null,
      failures: [],
      heldout_log_score: score.logScore,
      weighted_residual_chi_square: score.chiSquare,
      delta_log_score_vs_M0: deltaLogScore,
      bayes_factor_vs_M0:
        input.inference.scoring_rule === "bayes_factor_point_hypotheses"
          ? Math.exp(Math.min(700, deltaLogScore))
          : null,
      whitened_signature_norm: item.signatureNorm,
      maximum_abs_signature_cosine: maximumCosine,
      powered_parameter_region_ids: coveredRegionIds,
      excluded_parameter_region_ids:
        status === "disfavored" ? coveredRegionIds : [],
      maximum_claim: item.model.maximum_claim,
      bridge_registry_preflight: item.bridgePreflight,
      confirmation_claim_allowed: false,
      ontology_or_proof_verdict: null,
    });
  }

  const alternativeResults = [...input.alternative_models]
    .sort((left, right) => left.model_id.localeCompare(right.model_id))
    .map((model) =>
      preResults.get(model.model_id) ??
      evaluatedResults.get(model.model_id) ??
      blockedModelResult({
        model,
        failure: failure("MC_INTERNAL_RESULT_MISSING", "The model did not produce a deterministic comparison result."),
      })
    );
  const modelResults = [baselineResult, ...alternativeResults];
  const firstFailed = modelResults.find(
    (result) =>
      result.status === "blocked" ||
      result.status === "not_ready" ||
      result.status === "not_identifiable",
  );
  const bayesFactorGate =
    input.inference.scoring_rule !== "bayes_factor_point_hypotheses"
      ? "not_requested" as const
      : properBayesianReceipts &&
          alternativeResults.every(
            (result) => result.first_failure_code !== "MC_BAYES_FACTOR_PRIOR_BLOCKED",
          )
        ? "pass" as const
        : "blocked" as const;

  return {
    schema_version: "casimir_dp_blinded_model_comparison_result/1",
    campaign_id: input.campaign_id,
    evidence_class: input.evidence_class,
    status: overallStatus(modelResults),
    comparison_executed: true,
    first_failure_code: firstFailed?.first_failure_code ?? null,
    failures: firstFailed?.failures ?? [],
    composite_baseline: {
      model_id: "M0_ordinary_physics",
      components: CASIMIR_DP_ORDINARY_BASELINE_COMPONENTS,
    },
    model_results: modelResults,
    heldout_row_ids: heldoutObservations.map((row) => row.row_id),
    nuisance_training_row_ids: trainingRows,
    bayes_factor_gate: bayesFactorGate,
    measured_evidence_gate: "not_ready",
    collapse_identification: "blocked",
    manifold_dynamics: "blocked",
    claim_ceiling: "diagnostic",
    maximum_global_claim: "comparison_among_specified_models_only",
    status_language:
      "not_disfavored_within_powered_region_is_not_confirmation",
    ontology_or_proof_verdict: null,
  };
}

export const evaluateCasimirDpModelComparison =
  runCasimirDpBlindedModelComparison;
