// math-stage: diagnostic
import { HBAR } from "./physics-const";
import {
  CasimirDpProposalClosureConfig,
  REQUIRED_CASIMIR_DP_SYSTEMATICS,
  type CasimirDpProposalClosureConfig as CasimirDpProposalClosureConfigType,
} from "./contracts/casimir-dp-proposal-closure.v1";

const ELEMENTARY_CHARGE_C = 1.602_176_634e-19;

export function evaluateCasimirDpProposalReadiness(
  rawConfig: CasimirDpProposalClosureConfigType,
) {
  const config = CasimirDpProposalClosureConfig.parse(rawConfig);
  const architecture = config.architecture;
  const particleMass =
    (4 / 3) * Math.PI * architecture.particle_radius_m ** 3 * architecture.particle_density_kg_m3;
  const c4 =
    config.casimir_polder_reference.c4_coefficient_J_m *
    architecture.particle_radius_m ** 3;
  const distance = architecture.nominal_surface_distance_m;
  const cpPotential = -c4 / distance ** 4;
  const cpForce = -(4 * c4) / distance ** 5;
  const maximumDifferentialForceNoise =
    (HBAR * config.phase_stability.maximum_phase_noise_rad) /
    (architecture.branch_separation_m * architecture.observation_time_s);
  const singleChargeElectricFieldEquivalent =
    maximumDifferentialForceNoise / ELEMENTARY_CHARGE_C;

  const presentSystematics = new Set(config.systematics.map((entry) => entry.family));
  const missingSystematics = REQUIRED_CASIMIR_DP_SYSTEMATICS.filter(
    (family) => !presentSystematics.has(family),
  );
  const duplicateSystematics = config.systematics
    .map((entry) => entry.family)
    .filter((family, index, all) => all.indexOf(family) !== index);
  const systematicsGate = missingSystematics.length === 0 && duplicateSystematics.length === 0;

  const stages = [...config.commissioning].sort((left, right) => left.order - right.order);
  const stageIds = new Set(stages.map((stage) => stage.stage_id));
  const commissioningOrderReady = stages.every((stage, index) =>
    stage.order === index &&
    stage.depends_on.every((dependency) => stageIds.has(dependency) &&
      stages.findIndex((candidate) => candidate.stage_id === dependency) < index),
  );

  const requiredRoles = [
    "ordinary_decoherence",
    "casimir_open_system",
    "dp_rate_only",
    "collapse_dynamics",
    "manifold_response",
  ] as const;
  const modelRoles = new Set(config.model_lanes.map((lane) => lane.role));
  const modelSeparationReady = requiredRoles.every((role) => modelRoles.has(role));
  const collapseLane = config.model_lanes.find((lane) => lane.role === "collapse_dynamics");
  const manifoldLane = config.model_lanes.find((lane) => lane.role === "manifold_response");

  const requiredOutcomes = [
    "integrity_failure",
    "null_consistent",
    "environment_explained_residual",
    "unexplained_residual",
    "model_discriminating_residual",
  ] as const;
  const outcomeIds = new Set(config.decision_table.map((outcome) => outcome.outcome_id));
  const decisionTableReady = requiredOutcomes.every((outcome) => outcomeIds.has(outcome));
  const powerPlanReady =
    config.acquisition.main_paired_windows >=
    config.acquisition.required_paired_windows_for_smallest_correlation;
  const blindingReady =
    config.acquisition.preregistration_freeze_required &&
    config.phase_stability.maximum_label_prediction_accuracy <= 0.55 &&
    config.acquisition.blind_custodian_role.length > 0;
  const architectureReady =
    architecture.branch_orientation === "transverse_to_surface_normal" &&
    architecture.boundary_operation === "randomized_sample_and_hold_between_shots" &&
    architecture.force_calibrator === "independent_cofabricated_nanomechanical_reference";
  const signalContractReady =
    config.signal_contract.primary_observable === architecture.primary_estimand &&
    config.signal_contract.observation_window_s === architecture.observation_time_s &&
    config.signal_contract.secondary_observables.length >= 4 &&
    config.signal_contract.preprocessing_freeze_required;
  const finiteGeometryMaterialContractReady =
    config.finite_geometry_material_contract.distance_grid_m.includes(
      architecture.commissioning_distance_range_m[0],
    ) &&
    config.finite_geometry_material_contract.distance_grid_m.includes(distance) &&
    config.finite_geometry_material_contract.distance_grid_m.includes(
      architecture.commissioning_distance_range_m[1],
    ) &&
    config.finite_geometry_material_contract.required_material_receipts.length >= 5 &&
    config.finite_geometry_material_contract.required_surface_receipts.length >= 4 &&
    config.finite_geometry_material_contract.independent_force_calibrator_required &&
    config.finite_geometry_material_contract.minimum_force_contrast_significance_sigma >= 5 &&
    config.finite_geometry_material_contract.maximum_model_residual_fraction <= 0.05;
  const calibrationContractReady =
    config.calibration_contract.calibration_sidecar_hash_required &&
    config.calibration_contract.traceability_chain_required;
  const synchronizationContractReady =
    config.synchronization_contract.maximum_clock_skew_s ===
      config.phase_stability.maximum_clock_skew_s &&
    config.synchronization_contract.timestamped_channels.length >= 6 &&
    config.synchronization_contract.raw_trigger_edges_recorded &&
    config.synchronization_contract.clock_audit_required_before_unblinding;
  const blindingContractReady =
    config.blinding_contract.blind_custodian_role === config.acquisition.blind_custodian_role &&
    config.blinding_contract.label_prediction_accuracy_maximum ===
      config.phase_stability.maximum_label_prediction_accuracy &&
    config.blinding_contract.freeze_artifacts.length >= 6;
  const covarianceContractReady =
    config.covariance_contract.required_channels.length >= 8 &&
    config.covariance_contract.pilot_estimation_only &&
    config.covariance_contract.freeze_before_main_run &&
    config.covariance_contract.maximum_condition_number <= 1e8;
  const statisticalDecisionContractReady =
    config.statistical_decision_contract.familywise_alpha === config.acquisition.familywise_alpha &&
    config.statistical_decision_contract.target_power === config.acquisition.target_power &&
    config.statistical_decision_contract.pilot_paired_windows ===
      config.acquisition.pilot_paired_windows &&
    config.statistical_decision_contract.minimum_main_paired_windows ===
      config.acquisition.main_paired_windows &&
    !config.statistical_decision_contract.sequential_peeking_allowed;
  const allNamedContractsReady =
    signalContractReady && finiteGeometryMaterialContractReady && calibrationContractReady &&
    synchronizationContractReady && blindingContractReady && covarianceContractReady &&
    statisticalDecisionContractReady;
  const protocolReady =
    architectureReady && systematicsGate && commissioningOrderReady &&
    modelSeparationReady && decisionTableReady && powerPlanReady && blindingReady &&
    allNamedContractsReady;

  return {
    schema_version: "casimir_dp_proposal_readiness_result/1" as const,
    proposal_id: config.proposal_id,
    architecture: {
      architecture_id: architecture.architecture_id,
      particle_mass_kg: particleMass,
      branch_orientation: architecture.branch_orientation,
      nominal_surface_distance_m: distance,
      boundary_operation: architecture.boundary_operation,
      architecture_definition_gate: architectureReady ? "pass" as const : "not_ready" as const,
      integrated_hardware_evidence_gate: "not_ready" as const,
    },
    reference_physics: {
      c4_J_m4: c4,
      casimir_polder_potential_J: cpPotential,
      casimir_polder_force_N: cpForce,
      authority: config.casimir_polder_reference.authority,
      apparatus_specific_boundary_contrast_gate: "not_ready" as const,
    },
    phase_stability: {
      maximum_phase_noise_rad: config.phase_stability.maximum_phase_noise_rad,
      maximum_differential_force_noise_N: maximumDifferentialForceNoise,
      single_charge_electric_field_equivalent_V_m: singleChargeElectricFieldEquivalent,
      status: "high_risk_commissioning_requirement" as const,
    },
    contracts: {
      signal: signalContractReady ? "pass" as const : "not_ready" as const,
      finite_geometry_and_material: finiteGeometryMaterialContractReady ? "pass" as const : "not_ready" as const,
      calibration: calibrationContractReady ? "pass" as const : "not_ready" as const,
      synchronization: synchronizationContractReady ? "pass" as const : "not_ready" as const,
      blinding: blindingContractReady ? "pass" as const : "not_ready" as const,
      covariance: covarianceContractReady ? "pass" as const : "not_ready" as const,
      statistical_decision: statisticalDecisionContractReady ? "pass" as const : "not_ready" as const,
      systematics_transfer: systematicsGate ? "pass" as const : "not_ready" as const,
      commissioning: commissioningOrderReady ? "pass" as const : "not_ready" as const,
    },
    systematics: {
      coverage_gate: systematicsGate ? "pass" as const : "not_ready" as const,
      registered_count: config.systematics.length,
      missing_families: missingSystematics,
      duplicate_families: [...new Set(duplicateSystematics)],
      measured_transfer_functions_gate: "not_ready" as const,
    },
    commissioning: {
      dependency_order_gate: commissioningOrderReady ? "pass" as const : "not_ready" as const,
      stages,
      hardware_completion_gate: "not_ready" as const,
    },
    inference: {
      power_plan_gate: powerPlanReady ? "pass" as const : "not_ready" as const,
      blinding_plan_gate: blindingReady ? "pass" as const : "not_ready" as const,
      covariance_plan_gate: covarianceContractReady ? "pass" as const : "not_ready" as const,
      statistical_contract_gate: statisticalDecisionContractReady ? "pass" as const : "not_ready" as const,
      decision_table_gate: decisionTableReady ? "pass" as const : "not_ready" as const,
      model_lane_separation_gate: modelSeparationReady ? "pass" as const : "not_ready" as const,
      main_paired_windows: config.acquisition.main_paired_windows,
      required_paired_windows: config.acquisition.required_paired_windows_for_smallest_correlation,
    },
    gate_ledger: {
      proposal_package: protocolReady ? "pass" as const : "not_ready" as const,
      commissioning_entry: protocolReady ? "conditional_pass" as const : "not_ready" as const,
      measured_optical_and_surface_response: "not_ready" as const,
      measured_switching_and_decoherence_evidence: "not_ready" as const,
      finite_geometry_boundary_contrast: "not_ready" as const,
      collapse_identification: collapseLane?.status === "registered" ? "diagnostic_ready" as const : "blocked" as const,
      manifold_dynamics: manifoldLane?.status === "registered" ? "diagnostic_ready" as const : "blocked" as const,
      publication_claim: "diagnostic_protocol_only" as const,
    },
    promotion_allowed: false,
    blockers: [
      "integrated_cryogenic_near_surface_quantum_superposition_not_demonstrated",
      "apparatus_specific_gate_state_optical_response_not_measured",
      "finite_geometry_gate_dependent_casimir_polder_contrast_not_validated",
      "measured_systematics_transfer_functions_not_acquired",
      "source_backed_collapse_secondary_signature_missing",
      "tensor_noise_metric_coherence_manifold_dynamics_missing",
    ],
    design_correction: [
      "The superposition separation is transverse to the surface normal so the large normal Casimir-Polder force is common-mode to first order.",
      "Boundary states are switched and settled between shots rather than modulated during coherent evolution.",
      "A cofabricated force calibrator must establish boundary contrast before the coherence campaign begins.",
      "The 4-10 micrometre approach range is commissioned before any attempt to reduce the particle-surface distance.",
    ],
  };
}
