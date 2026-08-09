// math-stage: diagnostic
import {
  CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS,
  CASIMIR_DP_STAGE4_2R_RUN_ORDER,
  CasimirDpIntegratedFeasibilityPilotStage4_2RConfig,
  type CasimirDpIntegratedFeasibilityPilotStage4_2RConfig as Config,
} from "./contracts/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1";

const completeStatuses = new Set(["measured", "computed_from_measured", "published_external_recast"]);

export function evaluateCasimirDpIntegratedFeasibilityPilotStage4_2R(rawConfig: Config) {
  const config = CasimirDpIntegratedFeasibilityPilotStage4_2RConfig.parse(rawConfig);
  const runOrderPass = config.run_order.every(
    (entry, index) => entry === CASIMIR_DP_STAGE4_2R_RUN_ORDER[index],
  );
  const ids = config.authority_packets.map((packet) => packet.authority_id);
  const uniqueAuthoritySet = new Set(ids);
  const authorityCoveragePass = CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS.every((id) => uniqueAuthoritySet.has(id)) &&
    uniqueAuthoritySet.size === CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS.length;

  const packetRows = config.authority_packets.map((packet) => {
    const contentAddressed = packet.receipt_path !== null && packet.receipt_sha256 !== null;
    const statusComplete = completeStatuses.has(packet.status);
    const apparatusRequirement = packet.authority_id === "exact_registered_model_external_bound_recast"
      ? true
      : packet.measured_on_leading_apparatus;
    const custodyRequirement = packet.independent_custodian !== null;
    const covarianceRequirement = [
      "worldline_and_phase_covariance",
      "four_cell_complex_coherence",
      "independent_companion_channel",
    ].includes(packet.authority_id)
      ? packet.covariance_ancestry_frozen
      : true;
    const ready = statusComplete && contentAddressed && apparatusRequirement && custodyRequirement && covarianceRequirement;
    return {
      authority_id: packet.authority_id,
      status: packet.status,
      content_addressed: contentAddressed,
      apparatus_requirement: apparatusRequirement,
      custody_requirement: custodyRequirement,
      covariance_requirement: covarianceRequirement,
      ready,
      notes: packet.notes,
    };
  });
  const missingAuthorities = packetRows.filter((row) => !row.ready).map((row) => row.authority_id);

  const exponent = config.frozen_diosi.gaussian_exponent_at_hold;
  const predictedDpVisibility = Math.exp(-exponent);
  const predictedDpVisibilityLoss = 1 - predictedDpVisibility;
  const maximumPrimaryMagnitudeSigma = predictedDpVisibilityLoss /
    config.pilot_design.minimum_primary_signal_snr;

  // For C_as C_rc / (C_ac C_rs), a boundary-independent factor multiplying both
  // separated cells cancels exactly. This statistic therefore tests interaction,
  // not the primary standard-Diosi contraction.
  const dpFactor = Math.exp(-exponent);
  const fourCellRatioWithDp = (dpFactor * 1) / (1 * dpFactor);
  const fourCellDpCancellationError = Math.abs(fourCellRatioWithDp - 1);

  const packetContractPass = runOrderPass && authorityCoveragePass &&
    config.pilot_design.require_train_holdout_split &&
    config.pilot_design.require_blinding_before_confirmatory_analysis &&
    config.pilot_design.require_zero_cross_apparatus_covariance_fusion &&
    !config.frozen_diosi.modified_by_campaign &&
    !config.frozen_diosi.boundary_state_dependence;
  const empiricalInputReady = packetContractPass && missingAuthorities.length === 0;

  return {
    schema_version: "casimir_dp_integrated_feasibility_pilot_stage4_2r_result/1" as const,
    campaign_id: config.campaign_id,
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    upstream_binding: {
      leading_design: config.leading_design,
      stage4_2o_component_replay_preserved: true as const,
      stage4_2p_proper_time_budget_preserved: true as const,
      stage4_2q_boundary_control_preserved: true as const,
      run_order_gate: runOrderPass ? "pass" as const : "not_ready" as const,
    },
    primary_diosi_estimand: {
      estimand: config.pilot_design.primary_estimand,
      gaussian_exponent_at_hold: exponent,
      predicted_visibility: predictedDpVisibility,
      predicted_visibility_loss: predictedDpVisibilityLoss,
      minimum_signal_snr: config.pilot_design.minimum_primary_signal_snr,
      maximum_one_sigma_magnitude_uncertainty: maximumPrimaryMagnitudeSigma,
      interpretation: "This is the frozen regularized-Diosi comparator, conditional on preparation of the registered mass distribution; it is not measured evidence." as const,
    },
    boundary_interaction_estimand: {
      estimand: config.pilot_design.boundary_estimand,
      cells: config.pilot_design.four_cells,
      ratio: "R4=(C_active,separated*C_reference,compact)/(C_active,compact*C_reference,separated)" as const,
      standard_diosi_ratio_factor: fourCellRatioWithDp,
      standard_diosi_cancellation_error: fourCellDpCancellationError,
      interpretation: "Standard boundary-independent Diosi attenuation cancels from R4; non-unit R4 diagnoses boundary-by-superposition nonfactorization after ordinary calibration, not standard collapse by itself." as const,
    },
    acceptance_contract: {
      maximum_phase_sigma_rad: config.pilot_design.maximum_phase_sigma_rad,
      maximum_covariance_relative_drift: config.pilot_design.maximum_covariance_relative_drift,
      train_holdout_split_required: config.pilot_design.require_train_holdout_split,
      confirmatory_blinding_required: config.pilot_design.require_blinding_before_confirmatory_analysis,
      cross_apparatus_covariance_fusion_allowed: false as const,
      covariance_uncertainty_must_be_propagated: true as const,
    },
    authority_audit: {
      rows: packetRows,
      required_count: CASIMIR_DP_STAGE4_2R_AUTHORITY_IDS.length,
      ready_count: packetRows.length - missingAuthorities.length,
      missing_count: missingAuthorities.length,
      missing_authorities: missingAuthorities,
      empirical_input_readiness: empiricalInputReady ? "ready" as const : "no_go" as const,
    },
    decision: {
      packet_contract: packetContractPass ? "pass" as const : "not_ready" as const,
      empirical_feasibility_pilot: empiricalInputReady ? "authorized" as const : "not_authorized" as const,
      confirmatory_campaign: "not_authorized" as const,
      next_action: empiricalInputReady
        ? "freeze_pilot_likelihood_and_begin_blinded_acquisition" as const
        : "acquire_missing_same_apparatus_authority_receipts_before_pilot" as const,
    },
    graph_policy: {
      frozen_diosi_law_modified: false as const,
      casimir_to_collapse_kernel_registered: false as const,
      collapse_bridge_edges_added: 0 as const,
      badge_promotable: false as const,
    },
    standing: config.standing,
  };
}

