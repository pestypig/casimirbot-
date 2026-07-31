// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  evaluateCasimirDpApparatusIdentifiabilityStage4_2B,
} from "./casimir-dp-apparatus-identifiability-stage4-2b";
import {
  CASIMIR_DP_DP_MODEL_REGISTRATION,
  evaluateCasimirDpDpRegisteredPoint,
  sha256CasimirDpDpParameterManifest,
  type CasimirDpDpParameterManifest,
} from "./casimir-dp-dp-companion";
import {
  CASIMIR_DP_STAGE4_2G_CORE_PILOT_PRODUCT_IDS,
  type CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig,
  type CasimirDpEmpiricalPilotPacketStage4_2G,
} from "./contracts/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") {
    return Object.is(value, -0) ? 0 : value;
  }
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  );
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) /
    Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function buildDpManifest(
  config: CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig,
): CasimirDpDpParameterManifest {
  return {
    schema_version: "casimir_dp_dp_parameter_manifest/1",
    model_id: config.dp_model.model_id,
    model_version: "1",
    physical_regularization: {
      kind: "gaussian_mass_density_smearing",
      R0_m: config.dp_model.R0_m,
    },
    numerical_regularization: {
      kind: "fourier_simpson_quadrature",
      softening_m: config.dp_model.numerical_softening_m,
      used_as_physical_cutoff: false,
      integration_upper_u: config.dp_model.integration_upper_u,
      even_intervals: config.dp_model.even_intervals,
      crosscheck_relative_tolerance:
        config.dp_model.crosscheck_relative_tolerance,
    },
    composition: {
      kind: "single_effective_particle",
      density_profile: "gaussian_smeared_point",
    },
    dynamics: {
      dissipation: "none",
      dissipative_temperature_K: null,
      friction_s: null,
    },
    scan: {
      masses_kg: [config.apparatus_identity.mass_kg],
      branch_separations_m: [
        config.apparatus_identity.branch_separation_m,
      ],
      hold_times_s: [config.apparatus_identity.hold_time_s],
    },
  };
}

function productMap(packet: CasimirDpEmpiricalPilotPacketStage4_2G) {
  return new Map(packet.products.map((row) => [row.product_id, row]));
}

function isMeasuredOrProtocol(
  packet: CasimirDpEmpiricalPilotPacketStage4_2G,
  productId: typeof packet.products[number]["product_id"],
): boolean {
  const product = productMap(packet).get(productId);
  return product?.authority_class === "measured_empirical" ||
    product?.authority_class === "registered_protocol";
}

function apparatusIdentityMatches(
  config: CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig,
  packet: CasimirDpEmpiricalPilotPacketStage4_2G,
): boolean {
  return sha256(config.apparatus_identity) ===
    sha256(packet.apparatus_identity);
}

export function evaluateCasimirDpEmpiricalFeasibilityPilotStage4_2G(args: {
  config: CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig;
  packet: CasimirDpEmpiricalPilotPacketStage4_2G;
  artifactIntegrityPass: boolean;
}) {
  const { config, packet, artifactIntegrityPass } = args;
  const identityMatches = apparatusIdentityMatches(config, packet);
  const manifest = buildDpManifest(config);
  const manifestSha256 = sha256CasimirDpDpParameterManifest(manifest);
  const prediction = evaluateCasimirDpDpRegisteredPoint({
    mass_kg: config.apparatus_identity.mass_kg,
    branch_separation_m:
      config.apparatus_identity.branch_separation_m,
    parameter_manifest: manifest,
    parameter_manifest_sha256: manifestSha256,
  });
  const coherence = prediction.coherence.find(
    (row) =>
      row.hold_time_s === config.apparatus_identity.hold_time_s,
  );
  const expectedVisibility = Math.exp(
    -prediction.Gamma_DP_s * config.apparatus_identity.hold_time_s,
  );
  const coherenceIdentityError = relativeError(
    coherence?.visibility_ratio ?? Number.NaN,
    expectedVisibility,
  );
  const companionSamples =
    config.thresholds.companion_independent_samples;
  const companionTargetSnr = config.thresholds.minimum_companion_snr;
  const maximumOneShotUncertaintyForTargetSnr_W =
    prediction.heating_W * Math.sqrt(companionSamples) /
    companionTargetSnr;
  const dpCompanionConsistency =
    CASIMIR_DP_DP_MODEL_REGISTRATION.model_id ===
      config.dp_model.model_id &&
      prediction.E_G_crosscheck_gate === "pass" &&
      coherenceIdentityError <= 1e-12 &&
      !config.dp_model.boundary_variable_in_generator &&
      !config.dp_model.transfer_kernel_registered
      ? "pass"
      : "blocked";

  const identifiability = packet.identifiability_input == null
    ? null
    : evaluateCasimirDpApparatusIdentifiabilityStage4_2B(
      packet.identifiability_input,
    );
  const identifiabilityGate =
    identifiability == null
      ? "not_evaluated"
      : identifiability.gate === "pass" &&
          identifiability.feasibility_verdict ===
            "powered_parameter_region_available"
      ? "pass"
      : "blocked";

  const measuredProductIds = packet.products
    .filter((row) => row.authority_class === "measured_empirical")
    .map((row) => row.product_id);
  const protocolProductIds = packet.products
    .filter((row) => row.authority_class === "registered_protocol")
    .map((row) => row.product_id);
  const coreProductsReady =
    CASIMIR_DP_STAGE4_2G_CORE_PILOT_PRODUCT_IDS.every((productId) =>
      isMeasuredOrProtocol(packet, productId)
    );
  const packetIsMeasured =
    packet.evidence_class === "measured_empirical_packet";
  const physicalIdentityReady =
    packetIsMeasured &&
    identityMatches &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "apparatus_mass_geometry");
  const finiteGeometryReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "material_response") &&
    isMeasuredOrProtocol(packet, "finite_geometry_maxwell_green");
  const statePreparationReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "state_preparation");
  const branchMetrologyReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "branch_hold_metrology");
  const modulationReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "boundary_modulation_transfer");
  const covarianceReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "environment_backgrounds") &&
    isMeasuredOrProtocol(packet, "complex_coherence_response") &&
    isMeasuredOrProtocol(packet, "block_covariance");
  const companionReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "companion_detector") &&
    (packet.identifiability_input?.companion.independently_powered ?? false) &&
    (packet.identifiability_input?.companion.forecast_snr ?? 0) >=
      companionTargetSnr;
  const blindReplicationReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "blind_custody_freeze") &&
    isMeasuredOrProtocol(packet, "independent_solver_replication") &&
    packet.automatic_unblinding_allowed === false &&
    packet.confirmatory_refit_allowed === false;
  const completeStressEnergyReady =
    packetIsMeasured &&
    artifactIntegrityPass &&
    isMeasuredOrProtocol(packet, "complete_apparatus_stress_energy");
  const empiricalPilotReady =
    physicalIdentityReady &&
    finiteGeometryReady &&
    statePreparationReady &&
    branchMetrologyReady &&
    modulationReady &&
    covarianceReady &&
    companionReady &&
    blindReplicationReady &&
    coreProductsReady &&
    identifiabilityGate === "pass";

  return {
    schema_version:
      "casimir_dp_empirical_feasibility_pilot_stage4_2g_result/1",
    evidence_class: config.evidence_class,
    packet_evidence_class: packet.evidence_class,
    claim_ceiling: config.claim_ceiling,
    promotion_allowed: false,
    apparatus_design_identity: {
      gate: identityMatches ? "pass" : "blocked",
      identity: config.apparatus_identity,
      identity_sha256: sha256(config.apparatus_identity),
      packet_identity_matches: identityMatches,
      interpretation:
        "This freezes one design identity. It does not assert that the object or superposition has been built or measured.",
    },
    named_dp_prediction: {
      gate: dpCompanionConsistency,
      model_id: config.dp_model.model_id,
      parameter_manifest_sha256: manifestSha256,
      R0_m: config.dp_model.R0_m,
      R0_authority: config.dp_model.parameter_region_authority,
      mass_kg: config.apparatus_identity.mass_kg,
      branch_separation_m:
        config.apparatus_identity.branch_separation_m,
      hold_time_s: config.apparatus_identity.hold_time_s,
      E_G_J: prediction.E_G_analytic_J,
      Gamma_DP_s: prediction.Gamma_DP_s,
      tau_DP_s: prediction.tau_DP_s,
      visibility_ratio: coherence?.visibility_ratio ?? null,
      visibility_loss_fraction:
        coherence == null ? null : 1 - coherence.visibility_ratio,
      diffusion_D_pp_kg2_m2_s3:
        prediction.master_equation_D_pp_kg2_m2_s3,
      heating_W: prediction.heating_W,
      crosscheck_relative_error:
        prediction.E_G_crosscheck_relative_error,
      crosscheck_gate: prediction.E_G_crosscheck_gate,
      cavity_or_maxwell_variable_enters_generator: false,
    },
    companion_detection_requirement: {
      observable: "heating_W",
      predicted_signal_W: prediction.heating_W,
      independent_samples: companionSamples,
      minimum_snr: companionTargetSnr,
      maximum_one_shot_standard_uncertainty_for_target_snr_W:
        maximumOneShotUncertaintyForTargetSnr_W,
      detector_authority:
        companionReady ? "pilot_ready" : "not_ready",
      interpretation:
        "This is an instrument requirement derived from the same frozen object and DP generator, not a claim that such a detector exists.",
    },
    packet_audit: {
      gate: "pass",
      packet_id: packet.packet_id,
      partition: packet.partition,
      blinded: packet.blinded,
      artifact_integrity:
        packetIsMeasured
          ? artifactIntegrityPass ? "pass" : "blocked"
          : "not_applicable",
      measured_product_ids: measuredProductIds,
      registered_protocol_product_ids: protocolProductIds,
      core_product_count:
        CASIMIR_DP_STAGE4_2G_CORE_PILOT_PRODUCT_IDS.length,
      core_products_ready: coreProductsReady,
      identifiability_gate: identifiabilityGate,
      identifiability,
    },
    readiness: {
      physical_apparatus_identity:
        physicalIdentityReady ? "ready" : "not_ready",
      finite_geometry_maxwell_and_material:
        finiteGeometryReady ? "ready" : "not_ready",
      state_preparation:
        statePreparationReady ? "ready" : "not_ready",
      branch_hold_metrology:
        branchMetrologyReady ? "ready" : "not_ready",
      quasistatic_modulation:
        modulationReady ? "ready" : "not_ready",
      measured_background_covariance:
        covarianceReady ? "ready" : "not_ready",
      companion_detector:
        companionReady ? "ready" : "not_ready",
      blind_custody_and_replication:
        blindReplicationReady ? "ready" : "not_ready",
      empirical_pilot_readiness:
        empiricalPilotReady ? "ready" : "not_ready",
      complete_apparatus_stress_energy:
        completeStressEnergyReady ? "ready" : "not_ready",
    },
    hypothesis_separation: {
      gate:
        !config.observable_bridge_edges_allowed &&
          !config.dp_model.boundary_variable_in_generator &&
          !config.dp_model.transfer_kernel_registered
          ? "pass"
          : "blocked",
      lanes: [
        "H0_ordinary_maxwell_macroscopic_qed_material_and_environment",
        "H1_frozen_regularized_mass_density_dp",
        "H2_separately_registered_casimir_to_collapse_extension",
      ],
      observable_bridge_edges_added: 0,
      complete_stress_energy_required_for_manifold_claim: true,
      complete_stress_energy_required_for_core_pilot: false,
    },
    bounded_status: {
      software_and_packet_contract: "pass",
      design_identity_freeze: identityMatches ? "pass" : "blocked",
      dp_companion_internal_consistency: dpCompanionConsistency,
      empirical_pilot_readiness:
        empiricalPilotReady ? "ready" : "not_ready",
      measured_evidence:
        empiricalPilotReady
          ? "pilot_inputs_available_not_confirmatory_evidence"
          : "not_ready",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
    },
  };
}
