// math-stage: diagnostic
import {
  CasimirDpStage4SyntheticBlindingState,
  type CasimirDpPolarizationCongruenceStage4Config,
} from "./contracts/casimir-dp-polarization-congruence-stage4.v1";

export type Stage4GateStatus =
  | "pass"
  | "diagnostic"
  | "not_ready"
  | "blocked"
  | "not_evaluated";

export type Stage4IntegrityRow = {
  role: string;
  path: string;
  expected_sha256: string;
  actual_sha256: string | null;
  gate: "pass" | "not_ready";
  required_at_runtime: boolean;
  tracked_expected?: boolean | null;
  tracked_actual?: boolean | null;
};

export type Stage4RuntimeEnvelope = {
  schema_version?: string;
  status?: string;
  evidence_class?: string;
  promotion_allowed?: boolean;
  collapse_identification?: string;
  manifold_dynamics?: string;
  [key: string]: unknown;
};

export type Stage4RuntimeBundle = {
  polarization_qed: Stage4RuntimeEnvelope;
  thermal_radiative: Stage4RuntimeEnvelope;
  tensor_congruence: Stage4RuntimeEnvelope;
};

export const CASIMIR_DP_STAGE4_OUTCOME_TO_CLAIM_MAP = [
  {
    outcome_id: "integrity_or_convention_failure",
    observation:
      "An authority hash, fixture hash, unit, frequency-density, PSD, frame, handedness, or mirror convention fails.",
    establishes: "The affected Stage-4 prediction run is invalid.",
    disfavors: "No physical model.",
    does_not_establish:
      "A polarization anomaly, collapse, gravity, or manifold dynamics.",
    maximum_claim: "invalid_or_exploratory",
  },
  {
    outcome_id: "ordinary_polarization_qed_closure",
    observation:
      "Helicity, linear-basis, mirror, and cavity contrasts follow the measured material/scattering response with basis-invariant predictions.",
    establishes:
      "Compatibility with the polarization-resolved ordinary-QED control.",
    disfavors:
      "Only registered alternatives predicting a powered excess over that control.",
    does_not_establish:
      "That circular polarization modifies objective collapse or spacetime.",
    maximum_claim: "polarization_resolved_qed_control",
  },
  {
    outcome_id: "thermal_fdt_closure",
    observation:
      "Planck occupation, Stefan-Boltzmann recovery, near/far-field routing, detailed balance, heating, recoil, and noise close within frozen tolerances.",
    establishes:
      "Compatibility with the registered thermal-radiative ordinary-physics lane.",
    disfavors:
      "Only powered models requiring an additional thermal-correlated residual.",
    does_not_establish:
      "A vacuum-collapse bridge or a gravitational interpretation of blackbody radiation.",
    maximum_claim: "thermal_radiative_control",
  },
  {
    outcome_id: "fixed_delta_rho_polarization_null",
    observation:
      "After ordinary polarization and thermal closure, no helicity or mirror-odd coherence residual remains at fixed branch mass-density difference.",
    establishes:
      "An upper bound on preregistered polarization-dependent excess terms.",
    disfavors:
      "Only covered bridge kernels that predict a nonzero polarization signature.",
    does_not_establish:
      "That Penrose OR or Diósi-Penrose dynamics never occurs.",
    maximum_claim: "bridge_parameter_region_exclusion",
  },
  {
    outcome_id: "unexplained_helicity_residual",
    observation:
      "A replicated helicity- or mirror-odd residual persists after the expanded ordinary-physics null closes, but no registered numerical bridge predicts it.",
    establishes:
      "A reproducible unexplained optical or boundary-correlated anomaly.",
    disfavors:
      "The closed ordinary-QED model in the powered region and unextended DP as its explanation.",
    does_not_establish:
      "Objective collapse, gravitational causation, quantum foam, or manifold dynamics.",
    maximum_claim: "unexplained_anomaly",
  },
  {
    outcome_id: "registered_bridge_joint_signature",
    observation:
      "A preregistered numerical bridge predicts and survives held-out helicity, mirror, material, distance, temperature, time, and independent-companion tests.",
    establishes:
      "Replication-contingent support for that specific registered extension.",
    disfavors:
      "Registered alternatives that fail the same held-out joint signature.",
    does_not_establish:
      "A generic proof of quantum foam or manifold dynamics.",
    maximum_claim: "specific_bridge_support",
  },
  {
    outcome_id: "frequency_coincidence_only",
    observation:
      "Compton, E_G/hbar, cavity, thermal, or polarization modulation frequencies share units or happen to be numerically close.",
    establishes: "Only dimensional comparability.",
    disfavors: "Nothing.",
    does_not_establish:
      "A resonance, beat, energy transfer, collapse channel, or causal bridge.",
    maximum_claim: "same_dimension_not_connected",
  },
] as const;

export const CASIMIR_DP_STAGE4_PREDICTION_SIGNATURES = [
  {
    axis_id: "helicity",
    expanded_ordinary_null:
      "Material/scattering response may be helicity dependent only through calibrated reciprocal or nonreciprocal optical response.",
    unchanged_named_dp:
      "No helicity dependence at fixed delta_rho and unchanged branch trajectories.",
    registered_bridge:
      "Only the sign and magnitude frozen by the registered numerical kernel.",
  },
  {
    axis_id: "active_mirror",
    expanded_ordinary_null:
      "Pseudoscalar optical terms transform with the frozen mirror convention; reciprocal scalar terms are mirror even.",
    unchanged_named_dp:
      "Mirror invariant at fixed delta_rho.",
    registered_bridge:
      "Must predict a preregistered mirror parity and independent companion.",
  },
  {
    axis_id: "material_and_distance",
    expanded_ordinary_null:
      "Strong dependence through reflection matrices, Green tensors, geometry, loss, and temperature.",
    unchanged_named_dp:
      "No boundary/material dependence at fixed delta_rho.",
    registered_bridge:
      "Must follow the frozen causal stress/noise transfer kernel.",
  },
  {
    axis_id: "temperature",
    expanded_ordinary_null:
      "Planck occupation, FDT noise, emissivity, detailed balance, heating, and recoil dependence.",
    unchanged_named_dp:
      "No standard thermal boundary term in the unchanged manifest.",
    registered_bridge:
      "Only the preregistered thermal/noise scaling with no double counting.",
  },
  {
    axis_id: "hold_time_and_echo",
    expanded_ordinary_null:
      "Unitary phase and open-system filter-function response; conditionable terms may refocus.",
    unchanged_named_dp:
      "Frozen master-equation coherence and companion signature.",
    registered_bridge:
      "Frozen kernel-specific line shape, echo behavior, and companion channel.",
  },
] as const;

function nestedValue(
  runtime: Stage4RuntimeEnvelope,
  objectKey: string,
  valueKey: string,
): unknown {
  const object = runtime[objectKey];
  if (object == null || typeof object !== "object" || Array.isArray(object)) {
    return undefined;
  }
  return (object as Record<string, unknown>)[valueKey];
}

function schemaMatches(
  runtime: Stage4RuntimeEnvelope,
  schemaVersion: string,
): boolean {
  return runtime.schema_version === schemaVersion;
}

function nestedMatches(
  runtime: Stage4RuntimeEnvelope,
  objectKey: string,
  valueKey: string,
  expected: unknown,
): boolean {
  return nestedValue(runtime, objectKey, valueKey) === expected;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" &&
      !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function basename(filePath: string): string {
  const segments = filePath.replaceAll("\\", "/").split("/");
  return segments[segments.length - 1] ?? filePath;
}

type Stage4IntegrityExpectation = {
  role: string;
  path: string;
  sha256: string;
  required_at_runtime: boolean;
  tracked: boolean | null;
};

function integrityClosureMatches(
  rows: Stage4IntegrityRow[],
  expected: Stage4IntegrityExpectation[],
): boolean {
  if (rows.length !== expected.length) return false;
  if (new Set(rows.map((row) => row.path)).size !== rows.length) return false;
  if (new Set(expected.map((row) => row.path)).size !== expected.length) {
    return false;
  }

  const rowsByPath = new Map(rows.map((row) => [row.path, row]));
  return expected.every((reference) => {
    const row = rowsByPath.get(reference.path);
    if (row == null) return false;
    const trackingMatches = reference.tracked == null
      ? row.tracked_expected == null && row.tracked_actual == null
      : row.tracked_expected === reference.tracked &&
        row.tracked_actual === reference.tracked;
    return row.role === reference.role &&
      row.expected_sha256 === reference.sha256 &&
      row.actual_sha256 === reference.sha256 &&
      row.required_at_runtime === reference.required_at_runtime &&
      row.gate === "pass" &&
      trackingMatches;
  });
}

function hasSha256(value: unknown): boolean {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

export function buildCasimirDpPolarizationCongruenceStage4Report(args: {
  config: CasimirDpPolarizationCongruenceStage4Config;
  authorityIntegrity: Stage4IntegrityRow[];
  sourceIntegrity: Stage4IntegrityRow[];
  fixtureIntegrity: Stage4IntegrityRow[];
  runtimes: Stage4RuntimeBundle;
  bridgeNumericallyAdmitted: boolean;
  now?: Date;
}) {
  const authorityExpectations: Stage4IntegrityExpectation[] = [
    args.config.stage3_authority_manifest,
    ...args.config.upstream_authorities,
  ].map((reference) => ({
    role: reference.role,
    path: reference.path,
    sha256: reference.sha256,
    required_at_runtime: reference.required_at_runtime,
    tracked: reference.tracked,
  }));
  const sourceExpectations: Stage4IntegrityExpectation[] =
    args.config.software.source_authorities.map((reference) => ({
      role: reference.role,
      path: reference.path,
      sha256: reference.sha256,
      required_at_runtime: reference.required_at_runtime,
      tracked: reference.tracked,
    }));
  const fixtureExpectations: Stage4IntegrityExpectation[] =
    Object.values(args.config.runtime_fixtures).map((reference) => ({
      role: basename(reference.path),
      path: reference.path,
      sha256: reference.sha256,
      required_at_runtime: true,
      tracked: null,
    }));
  const requiredAuthoritiesPass = integrityClosureMatches(
    args.authorityIntegrity,
    authorityExpectations,
  );
  const fixturesPass = integrityClosureMatches(
    args.fixtureIntegrity,
    fixtureExpectations,
  );
  const sourcesPass = integrityClosureMatches(
    args.sourceIntegrity,
    sourceExpectations,
  );
  const syntheticBlindingPass =
    CasimirDpStage4SyntheticBlindingState.safeParse(
      args.config.blinding,
    ).success;
  const runtimesRecognized =
    schemaMatches(
      args.runtimes.polarization_qed,
      "casimir_dp_polarization_qed_control_result/1",
    ) &&
    schemaMatches(
      args.runtimes.thermal_radiative,
      "casimir_dp_radiative_thermal_closure_result/1",
    ) &&
    schemaMatches(
      args.runtimes.tensor_congruence,
      "casimir_dp_tensor_dimensional_congruence_result/1",
    ) &&
    args.runtimes.thermal_radiative.input_schema_version ===
      "casimir_dp_radiative_thermal_closure/1" &&
    args.runtimes.tensor_congruence.campaign_id ===
      args.config.campaign_id &&
    nestedMatches(
      args.runtimes.polarization_qed,
      "provenance",
      "forward_model_formula_ref",
      "casimir_dp_stage4_polarization_reduced_order_transfer/1",
    ) &&
    hasSha256(
      nestedValue(
        args.runtimes.polarization_qed,
        "provenance",
        "model_binding_sha256",
      ),
    ) &&
    hasSha256(args.runtimes.thermal_radiative.model_binding_sha256) &&
    nestedMatches(
      args.runtimes.thermal_radiative,
      "constants",
      "canonical_spectral_variable",
      "omega_rad_s",
    ) &&
    nestedMatches(
      args.runtimes.thermal_radiative,
      "constants",
      "h_equals_two_pi_hbar",
      true,
    ) &&
    nestedMatches(
      args.runtimes.tensor_congruence,
      "qed_chain",
      "chain",
      "G_ij + alpha_ij -> S_FF_ij -> S_DeltaU -> chi",
    ) &&
    nestedMatches(
      args.runtimes.tensor_congruence,
      "tensor_bridge_chain",
      "chain",
      "T_munu + N_munu_rho_sigma -> G_ret -> h_munu -> phase/rate",
    );
  const polarizationClosurePass = [
    ["provenance", "receipt_integrity_gate"],
    ["provenance", "shared_model_binding_gate"],
    ["provenance", "receipt_reference_gate"],
    ["polarization_convention", "frame_gate"],
    ["state_physicality", "gate"],
    ["response_diagnostics", "gate"],
    ["basis_invariance", "gate"],
    ["matched_controls", "gate"],
    ["double_contrasts", "gate"],
    ["sensitivity", "gate"],
    ["limits", "gate"],
  ].every(([objectKey, valueKey]) =>
    nestedMatches(
      args.runtimes.polarization_qed,
      objectKey,
      valueKey,
      "pass",
    )
  );
  const transferRegime = asRecord(
    args.runtimes.thermal_radiative.transfer_regime,
  );
  const nearFieldValidation = asRecord(
    args.runtimes.thermal_radiative.near_field_validation,
  );
  const nearFieldCovariance = asRecord(
    nearFieldValidation?.covariance,
  );
  const nearFieldPowerConsistency = asRecord(
    nearFieldValidation?.power_consistency,
  );
  const nearFieldValidationPass =
    transferRegime?.active_model ===
      "far_field_greybody_stefan_boltzmann"
      ? nearFieldValidation?.applicable === false &&
        nearFieldValidation.covariance == null &&
        nearFieldValidation.power_consistency == null &&
        nearFieldValidation.gate === "not_applicable"
      : transferRegime?.active_model === "near_field_green_fdt_supplied" &&
        nearFieldValidation?.applicable === true &&
        nearFieldValidation.gate === "pass" &&
        nearFieldCovariance?.square_gate === "pass" &&
        nearFieldCovariance.finite_gate === "pass" &&
        nearFieldCovariance.symmetry_gate === "pass" &&
        nearFieldCovariance.positive_semidefinite_gate === "pass" &&
        nearFieldPowerConsistency
          ?.gross_not_less_than_absolute_net_gate === "pass";
  const activeTransferPass =
    transferRegime?.active_model ===
      "far_field_greybody_stefan_boltzmann"
      ? transferRegime.far_field_validity_gate === "pass" &&
        transferRegime.near_field_green_fdt_gate === "not_applicable" &&
        nearFieldValidationPass
      : transferRegime?.active_model === "near_field_green_fdt_supplied" &&
        transferRegime.far_field_validity_gate === "not_applicable" &&
        transferRegime.near_field_green_fdt_gate === "pass" &&
        nearFieldValidationPass;
  const thermalReceiptChecks = asRecord(
    nestedValue(
      args.runtimes.thermal_radiative,
      "provenance",
      "receipt_checks",
    ),
  );
  const thermalReceiptChecksPass =
    thermalReceiptChecks != null &&
    thermalReceiptChecks.authority === true &&
    thermalReceiptChecks.material === true &&
    thermalReceiptChecks.geometry === true &&
    thermalReceiptChecks.solar_benchmark === true &&
    (transferRegime?.active_model ===
        "far_field_greybody_stefan_boltzmann"
      ? thermalReceiptChecks.near_field_fdt == null
      : thermalReceiptChecks.near_field_fdt === true);
  const thermalNumericalChecks = asRecord(
    nestedValue(
      args.runtimes.thermal_radiative,
      "numerical_validity",
      "checks",
    ),
  );
  const thermalNumericalChecksPass =
    thermalNumericalChecks != null &&
    [
      "spectral_checkpoints",
      "planck_stefan_boltzmann",
      "thermal_wavelength",
      "far_field_transfer",
      "active_transfer_and_noise",
      "residual_covariance",
      "entropy_production",
      "solar_benchmark",
    ].every((key) => thermalNumericalChecks[key] === true);
  const thermalClosurePass = [
    ["frequency_congruence", "gate"],
    ["planck_stefan_boltzmann", "gate"],
    ["mode_energy_accounting", "gate"],
    ["transfer_regime", "double_counting_gate"],
    ["emissivity", "opaque_limit_gate"],
    ["thermal_transfer", "detailed_balance_gate"],
    ["thermal_transfer", "nonnegative_entropy_production_gate"],
    ["recoil", "direction_gate"],
    ["solar_benchmark", "gate"],
    ["provenance", "gate"],
    ["numerical_validity", "gate"],
    ["readiness", "thermal_closure_gate"],
  ].every(([objectKey, valueKey]) =>
    nestedMatches(
      args.runtimes.thermal_radiative,
      objectKey,
      valueKey,
      "pass",
    )
  ) &&
    activeTransferPass &&
    thermalReceiptChecksPass &&
    thermalNumericalChecksPass;
  const tensorFailures = args.runtimes.tensor_congruence.failures;
  const tensorBridgePass = args.bridgeNumericallyAdmitted
    ? nestedMatches(
      args.runtimes.tensor_congruence,
      "tensor_bridge_chain",
      "status",
      "registered_numeric_kernel",
    ) &&
      nestedValue(
        args.runtimes.tensor_congruence,
        "tensor_bridge_chain",
        "numerical_bridge_output",
      ) != null
    : nestedMatches(
      args.runtimes.tensor_congruence,
      "tensor_bridge_chain",
      "status",
      "registered_congruence_only",
    ) &&
      nestedValue(
        args.runtimes.tensor_congruence,
        "tensor_bridge_chain",
        "numerical_bridge_output",
      ) == null;
  const frequencyCongruencePass = args.bridgeNumericallyAdmitted
    ? nestedMatches(
      args.runtimes.tensor_congruence,
      "frequency_non_bridge",
      "sourced_transfer_kernel_present",
      true,
    ) &&
      nestedMatches(
        args.runtimes.tensor_congruence,
        "frequency_non_bridge",
        "status",
        "connected_only_by_registered_kernel",
      )
    : nestedMatches(
      args.runtimes.tensor_congruence,
      "frequency_non_bridge",
      "shared_dimension",
      "T^-1",
    ) &&
      nestedMatches(
        args.runtimes.tensor_congruence,
        "frequency_non_bridge",
        "sourced_transfer_kernel_present",
        false,
      ) &&
      nestedMatches(
        args.runtimes.tensor_congruence,
        "frequency_non_bridge",
        "status",
        "same_dimension_not_connected",
      );
  const congruencePass =
    args.runtimes.tensor_congruence.status === "pass" &&
    args.runtimes.tensor_congruence.first_failure_code == null &&
    Array.isArray(tensorFailures) &&
    tensorFailures.length === 0 &&
    [
      ["convention_diagnostics", "h_hbar_2pi_gate"],
      ["convention_diagnostics", "spectral_jacobian_gate"],
      ["qed_chain", "status"],
      ["invariance", "basis_round_trip_gate"],
      ["invariance", "unit_round_trip_gate"],
    ].every(([objectKey, valueKey]) =>
      nestedMatches(
        args.runtimes.tensor_congruence,
        objectKey,
        valueKey,
        "pass",
      )
    ) &&
    nestedMatches(
      args.runtimes.tensor_congruence,
      "qed_chain",
      "explicit_coupling_required",
      true,
    ) &&
    nestedMatches(
      args.runtimes.tensor_congruence,
      "tensor_bridge_chain",
      "empirically_validated",
      false,
    ) &&
    tensorBridgePass &&
    frequencyCongruencePass;
  const thermalEvidenceClasses = asRecord(
    nestedValue(
      args.runtimes.thermal_radiative,
      "provenance",
      "receipt_evidence_classes",
    ),
  );
  const thermalSyntheticReceiptsPass =
    thermalEvidenceClasses != null &&
    thermalEvidenceClasses.authority === "synthetic_fixture" &&
    thermalEvidenceClasses.material === "synthetic_fixture" &&
    thermalEvidenceClasses.geometry === "synthetic_fixture" &&
    thermalEvidenceClasses.solar_benchmark === "synthetic_fixture" &&
    (transferRegime?.active_model ===
        "far_field_greybody_stefan_boltzmann"
      ? thermalEvidenceClasses.near_field_fdt == null
      : thermalEvidenceClasses.near_field_fdt === "synthetic_fixture") &&
    nestedMatches(
      args.runtimes.thermal_radiative,
      "provenance",
      "all_active_receipts_measured",
      false,
    );
  const configEvidenceBoundaryPass =
    args.config.promotion_allowed === false &&
    args.config.evidence_policy.synthetic_can_validate_software_only ===
      true &&
    args.config.evidence_policy.synthetic_can_satisfy_measured_gate ===
      false &&
    args.config.evidence_policy.same_dimension_implies_connection ===
      false &&
    args.config.evidence_policy.polarization_residual_is_collapse ===
      false &&
    args.config.evidence_policy.polarization_residual_is_manifold_evidence ===
      false &&
    args.config.evidence_policy.bridge_requires_registered_numerical_kernel ===
      true &&
    args.config.evidence_policy.blackbody_closure_is_collapse_bridge ===
      false;
  const syntheticBoundaryPass =
    configEvidenceBoundaryPass &&
    nestedMatches(
      args.runtimes.polarization_qed,
      "readiness",
      "evidence_class",
      "synthetic_fixture",
    ) &&
    nestedMatches(
      args.runtimes.thermal_radiative,
      "readiness",
      "evidence_class",
      "synthetic_fixture",
    ) &&
    args.runtimes.tensor_congruence.evidence_class ===
      "synthetic_fixture" &&
    nestedMatches(
      args.runtimes.polarization_qed,
      "readiness",
      "measured_polarization_qed_lane",
      "not_ready",
    ) &&
    nestedMatches(
      args.runtimes.polarization_qed,
      "readiness",
      "maximum_claim",
      "synthetic_pipeline_validation",
    ) &&
    nestedMatches(
      args.runtimes.thermal_radiative,
      "readiness",
      "measured_thermal_lane",
      "not_ready",
    ) &&
    nestedMatches(
      args.runtimes.thermal_radiative,
      "readiness",
      "maximum_claim",
      "synthetic_pipeline_validation",
    ) &&
    thermalSyntheticReceiptsPass &&
    args.runtimes.tensor_congruence.maximum_claim ===
      "synthetic_congruence_validation" &&
    args.runtimes.tensor_congruence.claim_ceiling === "diagnostic" &&
    args.runtimes.tensor_congruence.physical_viability ===
      "not_evaluated" &&
    args.runtimes.polarization_qed.promotion_allowed === false &&
    args.runtimes.thermal_radiative.promotion_allowed === false &&
    args.runtimes.tensor_congruence.promotion_allowed === false &&
    [
      args.runtimes.polarization_qed,
      args.runtimes.thermal_radiative,
      args.runtimes.tensor_congruence,
    ].every((runtime) =>
      runtime.collapse_identification === "blocked" &&
      runtime.manifold_dynamics === "blocked"
    );
  const softwarePass =
    requiredAuthoritiesPass &&
    sourcesPass &&
    fixturesPass &&
    syntheticBlindingPass &&
    runtimesRecognized &&
    polarizationClosurePass &&
    thermalClosurePass &&
    syntheticBoundaryPass &&
    congruencePass;

  const bridgeRegistryState =
    nestedValue(
      args.runtimes.tensor_congruence,
      "tensor_bridge_chain",
      "status",
    ) ?? "blocked";
  const frequencyBridgeState =
    nestedValue(
      args.runtimes.tensor_congruence,
      "frequency_non_bridge",
      "status",
    ) ?? "blocked";

  const runOrder = args.config.run_order.map((stage, index) => {
    let gate: Stage4GateStatus = "pass";
    if (!softwarePass) gate = "blocked";
    if (
      stage ===
      "freeze_polarization_states_randomization_blinding_and_calibration"
    ) {
      gate = softwarePass ? "not_ready" : "blocked";
    } else if (
      stage ===
      "validate_jones_stokes_mueller_and_matched_control_sidecars"
    ) {
      gate = softwarePass ? "diagnostic" : "blocked";
    } else if (
      stage === "run_blinded_synthetic_prediction_comparison" ||
      stage ===
        "populate_stage4_outcome_falsifier_and_nonclaim_ledger"
    ) {
      gate = softwarePass ? "diagnostic" : "blocked";
    }
    return { index: index + 1, stage, gate };
  });

  const modelComparator = {
    status: softwarePass ? "synthetic_prediction_only" : "blocked",
    blinding_lane_status: args.config.blinding.lane_status,
    blinded_measured_comparison_run: false,
    measured_comparison_allowed:
      args.config.blinding.measured_comparison_allowed,
    unblinding_allowed:
      args.config.blinding.automatic_unblinding_allowed,
    models: [
      {
        model_id: args.config.preregistration.expanded_null_model_id,
        role: "expanded_ordinary_physics_null",
        components:
          args.config.preregistration.expanded_null_components,
        state: softwarePass
          ? "synthetic_prediction_available"
          : "blocked",
        maximum_claim: "ordinary_physics_control_prediction",
      },
      {
        model_id: args.config.preregistration.named_dp_model_id,
        role: "unchanged_named_dp",
        parameter_manifest_sha256:
          args.config.preregistration.named_dp_parameter_manifest_sha256,
        reuse_policy:
          args.config.preregistration.named_dp_reuse_policy,
        state: "reused_without_mutation",
        polarization_rule:
          args.config.preregistration.named_dp_boundary_rule,
        maximum_claim: "named_model_comparison_baseline",
      },
      {
        model_id:
          args.config.preregistration.bridge_registry_model_id,
        role: "registered_bridge",
        state: args.bridgeNumericallyAdmitted
          ? "admitted_frozen_numeric_kernel"
          : "blocked_no_registered_numeric_kernel",
        admitted_to_numeric_comparison:
          args.bridgeNumericallyAdmitted,
        registry_state: bridgeRegistryState,
        maximum_claim: args.bridgeNumericallyAdmitted
          ? "specific_registered_extension_prediction"
          : "schema_congruence_only",
      },
    ],
    compatibility_wording:
      args.config.preregistration.compatibility_wording,
  };

  return {
    schema_version:
      "casimir_dp_polarization_congruence_stage4_report/1",
    study_id: args.config.study_id,
    campaign_id: args.config.campaign_id,
    generated_at: (args.now ?? new Date()).toISOString(),
    evidence_cutoff: args.config.evidence_cutoff,
    claim_ceiling: args.config.claim_ceiling,
    promotion_allowed: args.config.promotion_allowed,
    scientific_question:
      "After polarization-resolved QED and thermal/FDT controls are added to the ordinary-physics null, does any separately prepared material coherence residual remain that matches a preregistered model-specific signature?",
    immutable_stage3_rule:
      "Stage 3 is hash-linked upstream evidence and is not recomputed, edited, promoted, or replaced by Stage 4.",
    authority_integrity: args.authorityIntegrity,
    software_source_integrity: args.sourceIntegrity,
    software_source_snapshot: args.config.software.source_snapshot,
    fixture_integrity: args.fixtureIntegrity,
    conventions: args.config.conventions,
    blinding: {
      ...args.config.blinding,
      gate: syntheticBlindingPass ? "pass" : "blocked",
      scope:
        "Reserved blind labels for synthetic prediction contracts only; no custodian receipt, mapping, measured comparison, or unblinding exists.",
    },
    run_order: runOrder,
    expanded_null: {
      model_id: args.config.preregistration.expanded_null_model_id,
      components:
        args.config.preregistration.expanded_null_components,
      relation:
        "M0_prime = M0_stage3 + M_polarization_resolved_qed + M_thermal_radiative_fdt",
    },
    unchanged_named_dp: {
      model_id: args.config.preregistration.named_dp_model_id,
      parameter_manifest_sha256:
        args.config.preregistration.named_dp_parameter_manifest_sha256,
      reuse_policy:
        args.config.preregistration.named_dp_reuse_policy,
      polarization_rule:
        args.config.preregistration.named_dp_boundary_rule,
    },
    bridge_admission: {
      model_id:
        args.config.preregistration.bridge_registry_model_id,
      registry_state: bridgeRegistryState,
      frequency_bridge_state: frequencyBridgeState,
      registered_numeric_kernel_present:
        args.bridgeNumericallyAdmitted,
      admitted_to_numeric_comparison:
        args.bridgeNumericallyAdmitted,
      registration_is_empirical_validation: false,
    },
    runtimes: args.runtimes,
    model_comparator: modelComparator,
    prediction_signature_matrix:
      CASIMIR_DP_STAGE4_PREDICTION_SIGNATURES,
    preregistered_prediction_axes:
      args.config.preregistration.prediction_axes,
    outcome_to_claim_map: CASIMIR_DP_STAGE4_OUTCOME_TO_CLAIM_MAP,
    prediction_playground: {
      evidence_class: "synthetic",
      editable_inputs: {
        polarization_qed:
          args.config.runtime_fixtures.polarization_qed.path,
        thermal_radiative:
          args.config.runtime_fixtures.thermal_radiative.path,
        tensor_congruence:
          args.config.runtime_fixtures.tensor_congruence.path,
      },
      safe_knob_families: [
        "Jones/Stokes polarization state and helicity",
        "reciprocal/nonreciprocal reflection response and cavity geometry",
        "temperature, emissivity, frequency grid, and near/far-field routing",
        "branch mass-density equivalence tolerance",
        "unit, omega/nu, PSD, frame, handedness, and mirror-convention checks",
      ],
      invariant_claim_boundary:
        "Changing a synthetic fixture explores predictions only; it cannot satisfy measured evidence, collapse identification, manifold dynamics, or physical viability.",
    },
    final_gates: {
      software_and_synthetic_predictions:
        softwarePass ? "pass" : "blocked",
      polarization_qed_synthetic_closure:
        polarizationClosurePass ? "pass" : "blocked",
      thermal_radiative_synthetic_closure:
        thermalClosurePass ? "pass" : "blocked",
      synthetic_evidence_boundary:
        syntheticBoundaryPass ? "pass" : "blocked",
      synthetic_blinding_contract:
        syntheticBlindingPass ? "pass" : "blocked",
      measured_evidence: "not_ready",
      ordinary_physics_closure: "not_ready",
      polarization_qed_measured_lane:
        nestedValue(
          args.runtimes.polarization_qed,
          "readiness",
          "measured_polarization_qed_lane",
        ) ?? "not_ready",
      thermal_measured_lane:
        nestedValue(
          args.runtimes.thermal_radiative,
          "readiness",
          "measured_thermal_lane",
        ) ?? "not_ready",
      tensor_dimensional_congruence:
        congruencePass ? "pass" : "blocked",
      unchanged_named_dp: "reused_without_mutation",
      registered_bridge_numeric_comparison:
        args.bridgeNumericallyAdmitted ? "diagnostic" : "blocked",
      collapse_identification: "blocked",
      manifold_dynamics: "blocked",
      physical_viability: "not_evaluated",
      publication_claim: "diagnostic_protocol_only",
    },
    claim_boundaries: [
      "The Stage-4 blinding lane reserves labels for synthetic contract tests only; no custodian receipt, mapping, measured comparison, or unblinding has been created or authorized.",
      "Two transverse photon polarization degrees of freedom are included through Jones/Stokes states and material scattering response; this does not add a gravitational degree of freedom.",
      "Circular polarization can expose ordinary reciprocal/nonreciprocal optical systematics. Standard unextended DP remains polarization-blind at fixed delta_rho.",
      "Planck-to-Stefan-Boltzmann recovery validates thermal-radiative normalization and mode accounting, not a collapse mechanism.",
      "Equal dimensions among omega_C, E_G/hbar, cavity modes, or modulation rates do not connect them without a sourced transfer kernel.",
      "A residual first establishes an anomaly after the expanded ordinary-physics null closes; it is not automatically collapse or manifold evidence.",
      "Synthetic predictions validate code paths and falsifier logic only.",
    ],
  };
}
