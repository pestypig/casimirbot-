export const NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION =
  "nhm2_experiment_facing_theory_roadmap/v1";

export const NHM2_EXPERIMENT_FACING_STAGE_IDS = [
  "prediction_freeze",
  "tile_metrology",
  "cycle_energy_balance",
  "array_scaling",
  "full_apparatus_tensor",
  "vacuum_weight",
  "metric_response",
  "qei_observer_admissibility",
  "independent_replication",
] as const;

export const NHM2_EXPERIMENT_FACING_SCALAR_CHECK_IDS = [
  "delta_m_energy_equivalent",
  "delta_F_weight_equivalent",
  "array_scaling_ratio",
  "weak_field_h00_proxy",
] as const;

export type Nhm2ExperimentFacingStageId =
  (typeof NHM2_EXPERIMENT_FACING_STAGE_IDS)[number];
export type Nhm2ExperimentFacingScalarCheckId =
  (typeof NHM2_EXPERIMENT_FACING_SCALAR_CHECK_IDS)[number];

export type Nhm2ExperimentFacingTheoryRoadmapStageV1 = {
  stageId: Nhm2ExperimentFacingStageId;
  title: string;
  theoreticalSolveRequired: string;
  requiredObservables: string[];
  requiredReceipts: string[];
  falsifiers: string[];
  blockerIds: string[];
  researchRefs: string[];
  nonComputableRuntimeArtifactRequired: boolean;
};

export type Nhm2ExperimentFacingScalarSanityCheckV1 = {
  checkId: Nhm2ExperimentFacingScalarCheckId;
  expression: string;
  displayLatex: string;
  purpose: string;
  stageIds: Nhm2ExperimentFacingStageId[];
  calculatorLoadable: true;
  cannotSubstituteForReceipt: true;
};

export type Nhm2ExperimentFacingTheoryRoadmapV1 = {
  contractVersion: typeof NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  physicalViabilityCampaignRef: string | null;
  diagnosticCampaignRef: string | null;
  leanCertificateRef: string | null;
  stages: Nhm2ExperimentFacingTheoryRoadmapStageV1[];
  scalarSanityChecks: Nhm2ExperimentFacingScalarSanityCheckV1[];
  summary: {
    stageCount: number;
    receiptBlockedStageCount: number;
    firstBlocker: string;
    calculatorLoadableScalarCheckIds: Nhm2ExperimentFacingScalarCheckId[];
    nonComputableStageIds: Nhm2ExperimentFacingStageId[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    roadmapOnly: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    scalarChecksCannotSubstituteForExperimentalReceipts: true;
    diagnosticCampaignCannotSubstituteForExperimentalReceipts: true;
    leanCertificateCannotSubstituteForExperimentalReceipts: true;
  };
};

export type BuildNhm2ExperimentFacingTheoryRoadmapInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  physicalViabilityCampaignRef?: string | null;
  diagnosticCampaignRef?: string | null;
  leanCertificateRef?: string | null;
};

const DEFAULT_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const RESEARCH = {
  dynamicalCasimirNature2011: "nature_2011_dynamical_casimir_effect",
  casimirMass: "arxiv_0710_3841_casimir_gravitational_inertial_mass",
  scharnhorstCaution: "scharnhorst_light_between_plates_caution",
  archimedesBalancePrototype: "epjp_2024_archimedes_balance_prototype",
  archimedes2025Status: "archimedes_2025_status",
  ligoSensitivity: "ligo_p1500260_advanced_ligo_sensitivity",
  siliconCasimirChip: "nature_communications_2013_silicon_casimir_chip",
  patchPotentials: "arxiv_1409_5012_patch_potentials",
  millimetreGravity: "nature_2021_millimetre_scale_gravitational_coupling",
  pfenningFord: "gr-qc_9702026_pfenning_ford_warp_qi",
  realMaterialCasimir: "arxiv_0902_4022_real_material_casimir_review",
  arbitraryMaterialCasimir: "arxiv_1010_5539_arbitrary_material_casimir",
  stationaryWorldlineQei: "arxiv_2301_01698_stationary_worldline_qei",
  genericWarpNec: "arxiv_2105_03079_generic_warp_nec",
} as const;

const stage = (
  input: Nhm2ExperimentFacingTheoryRoadmapStageV1,
): Nhm2ExperimentFacingTheoryRoadmapStageV1 => input;

const buildStages = (): Nhm2ExperimentFacingTheoryRoadmapStageV1[] => [
  stage({
    stageId: "prediction_freeze",
    title: "Prediction Freeze",
    theoreticalSolveRequired:
      "Freeze Delta T_mu_nu(x,t), optical phase, clock shift, force transfer, metric response, null controls, and uncertainty budget before data collection.",
    requiredObservables: [
      "DeltaTmunu_xt",
      "delta_phi_f",
      "delta_tau",
      "delta_F",
      "h00_proxy",
      "R_0i0j",
    ],
    requiredReceipts: [
      "pre_registered_prediction_receipt",
      "uncertainty_budget_receipt",
      "null_control_plan_receipt",
    ],
    falsifiers: [
      "prediction_changed_after_data_collection",
      "observable_sign_or_phase_not_pre_registered",
      "null_controls_missing",
    ],
    blockerIds: ["prediction_freeze_receipt_missing"],
    researchRefs: [
      RESEARCH.casimirMass,
      RESEARCH.ligoSensitivity,
      RESEARCH.millimetreGravity,
    ],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "tile_metrology",
    title: "Tile Metrology",
    theoreticalSolveRequired:
      "Derive a real-material tile model with gap, roughness, finite conductivity, temperature, dielectric response, patch potentials, force-gap curves, hysteresis, and energy-cycle coupling.",
    requiredObservables: [
      "force_vs_gap",
      "dielectric_response",
      "roughness_map",
      "patch_potential_map",
      "temperature_dependence",
      "hysteresis_loss",
    ],
    requiredReceipts: [
      "gap_metrology_receipt",
      "dielectric_response_receipt",
      "roughness_receipt",
      "patch_potential_receipt",
      "force_gap_curve_receipt",
    ],
    falsifiers: [
      "lifshitz_model_outside_uncertainty",
      "patch_potential_dominates_force_delta",
      "mechanical_pull_in_or_hysteresis_unbounded",
    ],
    blockerIds: ["tile_metrology_receipts_missing"],
    researchRefs: [
      RESEARCH.realMaterialCasimir,
      RESEARCH.arbitraryMaterialCasimir,
      RESEARCH.siliconCasimirChip,
      RESEARCH.patchPotentials,
    ],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "cycle_energy_balance",
    title: "Cycle Energy Balance",
    theoreticalSolveRequired:
      "Close electrical input, mechanical work, heat, radiation, elastic energy, and loss channels for a complete modulated tile cycle.",
    requiredObservables: [
      "electrical_input_work",
      "mechanical_work",
      "heat_flow",
      "radiated_energy",
      "elastic_energy",
      "loss_budget",
    ],
    requiredReceipts: ["cycle_energy_ledger_receipt", "drive_boundary_condition_receipt"],
    falsifiers: [
      "energy_ledger_not_closed",
      "apparent_output_tracks_drive_artifact",
      "thermal_or_elastic_channel_unbounded",
    ],
    blockerIds: ["cycle_energy_balance_receipt_missing"],
    researchRefs: [RESEARCH.dynamicalCasimirNature2011, RESEARCH.casimirMass],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "array_scaling",
    title: "Array Scaling",
    theoreticalSolveRequired:
      "Predict and measure DeltaE_N/(N DeltaE_1), cross-coupling, heat flow, elastic stress, and support effects from one cavity to array modules.",
    requiredObservables: [
      "DeltaE_N",
      "DeltaE_1",
      "cross_coupling_bound",
      "thermal_gradient",
      "support_strain",
    ],
    requiredReceipts: [
      "array_scaling_receipt",
      "cross_coupling_receipt",
      "thermal_mechanical_support_receipt",
    ],
    falsifiers: [
      "array_scaling_not_predictive",
      "support_energy_dominates_source_delta",
      "cross_coupling_unbounded",
    ],
    blockerIds: ["array_scaling_receipts_missing"],
    researchRefs: [RESEARCH.arbitraryMaterialCasimir, RESEARCH.realMaterialCasimir],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "full_apparatus_tensor",
    title: "Full Apparatus Source Tensor",
    theoreticalSolveRequired:
      "Derive source-side T00, T0i, diagonal Tij, and off-diagonal Tij for the whole apparatus, including plates, supports, drive fields, elastic stresses, and interaction energy.",
    requiredObservables: [
      "T00_source",
      "T0i_source",
      "Tij_diagonal_source",
      "Tij_off_diagonal_source",
      "support_stress",
      "drive_field_momentum",
    ],
    requiredReceipts: [
      "full_apparatus_tensor_receipt",
      "component_authority_ledger",
      "same_basis_metadata_receipt",
    ],
    falsifiers: [
      "diagonal_only_tensor_claimed_full",
      "metric_target_echo_detected",
      "support_or_drive_stress_missing",
    ],
    blockerIds: ["full_apparatus_tensor_receipt_missing"],
    researchRefs: [RESEARCH.casimirMass, RESEARCH.arbitraryMaterialCasimir],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "vacuum_weight",
    title: "Vacuum Weight",
    theoreticalSolveRequired:
      "Predict DeltaF = g DeltaE/c^2 with active/dummy samples, sign, phase, scaling, orientation, and environmental null controls.",
    requiredObservables: [
      "DeltaE_measured",
      "DeltaF_measured",
      "phase_lag",
      "orientation_dependence",
      "dummy_rejection",
    ],
    requiredReceipts: [
      "vacuum_weight_receipt",
      "active_dummy_equivalence_receipt",
      "environmental_null_receipt",
    ],
    falsifiers: [
      "force_not_phase_locked_to_DeltaE",
      "dummy_sample_reproduces_signal",
      "orientation_or_scaling_mismatch",
    ],
    blockerIds: ["vacuum_weight_receipt_missing"],
    researchRefs: [
      RESEARCH.archimedesBalancePrototype,
      RESEARCH.archimedes2025Status,
      RESEARCH.casimirMass,
    ],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "metric_response",
    title: "Invariant Metric Response",
    theoreticalSolveRequired:
      "Bound weak-field response and require optical, clock or atom, and mechanical probes to agree with one invariant metric model.",
    requiredObservables: [
      "h00_proxy",
      "optical_phase_response",
      "clock_or_atom_response",
      "mechanical_free_mass_response",
      "spatial_falloff",
    ],
    requiredReceipts: [
      "metric_response_receipt",
      "multi_probe_agreement_receipt",
      "non_metric_systematics_receipt",
    ],
    falsifiers: [
      "single_probe_only_response",
      "wavelength_or_polarization_specific_artifact",
      "weak_field_bound_below_noise_floor_without_sensitivity_plan",
    ],
    blockerIds: ["metric_response_receipt_missing"],
    researchRefs: [
      RESEARCH.scharnhorstCaution,
      RESEARCH.ligoSensitivity,
      RESEARCH.millimetreGravity,
    ],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "qei_observer_admissibility",
    title: "QEI And Observer Admissibility",
    theoreticalSolveRequired:
      "Run worldline-specific QEI receipts and observer-family WEC/NEC/SEC/DEC checks against the measured or simulated full apparatus tensor.",
    requiredObservables: [
      "worldline_sampled_density",
      "qei_bound",
      "WEC_family_min",
      "NEC_family_min",
      "SEC_family_min",
      "DEC_family_min",
    ],
    requiredReceipts: [
      "qei_worldline_receipt",
      "observer_family_energy_condition_receipt",
      "continuous_optimizer_or_equivalent_receipt",
    ],
    falsifiers: [
      "scalar_qei_margin_without_worldlines",
      "eulerian_only_energy_condition_claim",
      "observer_family_violation",
    ],
    blockerIds: ["qei_observer_admissibility_receipts_missing"],
    researchRefs: [
      RESEARCH.pfenningFord,
      RESEARCH.stationaryWorldlineQei,
      RESEARCH.genericWarpNec,
    ],
    nonComputableRuntimeArtifactRequired: true,
  }),
  stage({
    stageId: "independent_replication",
    title: "Independent Replication And Falsification",
    theoreticalSolveRequired:
      "Define independent laboratory replication, blind analysis, null-result classification, and falsification mapping for every campaign stage.",
    requiredObservables: [
      "independent_lab_result",
      "blind_analysis_result",
      "null_result_bound",
      "falsified_model_id",
    ],
    requiredReceipts: [
      "independent_replication_receipt",
      "blind_analysis_receipt",
      "falsification_disposition_receipt",
    ],
    falsifiers: [
      "positive_result_not_replicated",
      "null_result_reaches_pre_registered_sensitivity",
      "analysis_depends_on_post_hoc_model_fit",
    ],
    blockerIds: ["independent_replication_receipt_missing"],
    researchRefs: [
      RESEARCH.archimedes2025Status,
      RESEARCH.millimetreGravity,
      RESEARCH.ligoSensitivity,
    ],
    nonComputableRuntimeArtifactRequired: true,
  }),
];

const buildScalarChecks = (): Nhm2ExperimentFacingScalarSanityCheckV1[] => [
  {
    checkId: "delta_m_energy_equivalent",
    expression: "delta_m = DeltaE/c^2",
    displayLatex: "\\Delta m=\\Delta E/c^2",
    purpose: "Mass-equivalent scale check for controlled source energy differences.",
    stageIds: ["cycle_energy_balance", "vacuum_weight"],
    calculatorLoadable: true,
    cannotSubstituteForReceipt: true,
  },
  {
    checkId: "delta_F_weight_equivalent",
    expression: "delta_F = g*DeltaE/c^2",
    displayLatex: "\\Delta F=g\\Delta E/c^2",
    purpose: "Weight-equivalent sanity check for a vacuum-weight campaign.",
    stageIds: ["vacuum_weight"],
    calculatorLoadable: true,
    cannotSubstituteForReceipt: true,
  },
  {
    checkId: "array_scaling_ratio",
    expression: "array_scaling = DeltaE_N/(N*DeltaE_1)",
    displayLatex: "S_N=\\Delta E_N/(N\\Delta E_1)",
    purpose: "Array scaling diagnostic that cannot replace measured cross-coupling receipts.",
    stageIds: ["array_scaling"],
    calculatorLoadable: true,
    cannotSubstituteForReceipt: true,
  },
  {
    checkId: "weak_field_h00_proxy",
    expression: "h00_proxy = 2*G*DeltaE/(r*c^4)",
    displayLatex: "h_{00}\\simeq2G\\Delta E/(rc^4)",
    purpose: "Weak-field detectability scale check for metric-response proposals.",
    stageIds: ["metric_response"],
    calculatorLoadable: true,
    cannotSubstituteForReceipt: true,
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isStringOrNull = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

export const buildNhm2ExperimentFacingTheoryRoadmap = (
  input: BuildNhm2ExperimentFacingTheoryRoadmapInput = {},
): Nhm2ExperimentFacingTheoryRoadmapV1 => {
  const stages = buildStages();
  const scalarSanityChecks = buildScalarChecks();
  const blockers = stages.flatMap((entry) => entry.blockerIds);
  return {
    contractVersion: NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_PROFILE_ID,
    physicalViabilityCampaignRef: input.physicalViabilityCampaignRef ?? null,
    diagnosticCampaignRef: input.diagnosticCampaignRef ?? null,
    leanCertificateRef: input.leanCertificateRef ?? null,
    stages,
    scalarSanityChecks,
    summary: {
      stageCount: stages.length,
      receiptBlockedStageCount: stages.filter((entry) => entry.blockerIds.length > 0).length,
      firstBlocker: blockers[0] ?? "none",
      calculatorLoadableScalarCheckIds: scalarSanityChecks.map((entry) => entry.checkId),
      nonComputableStageIds: stages
        .filter((entry) => entry.nonComputableRuntimeArtifactRequired)
        .map((entry) => entry.stageId),
    },
    claimBoundary: {
      diagnosticOnly: true,
      roadmapOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      scalarChecksCannotSubstituteForExperimentalReceipts: true,
      diagnosticCampaignCannotSubstituteForExperimentalReceipts: true,
      leanCertificateCannotSubstituteForExperimentalReceipts: true,
    },
  };
};

export const isNhm2ExperimentFacingTheoryRoadmap = (
  value: unknown,
): value is Nhm2ExperimentFacingTheoryRoadmapV1 => {
  if (!isRecord(value)) return false;
  const stages = Array.isArray(value.stages) ? value.stages : null;
  const scalarChecks = Array.isArray(value.scalarSanityChecks) ? value.scalarSanityChecks : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const claimBoundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    isStringOrNull(value.physicalViabilityCampaignRef) &&
    isStringOrNull(value.diagnosticCampaignRef) &&
    isStringOrNull(value.leanCertificateRef) &&
    stages != null &&
    stages.length === NHM2_EXPERIMENT_FACING_STAGE_IDS.length &&
    stages.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.stageId === "string" &&
        (NHM2_EXPERIMENT_FACING_STAGE_IDS as readonly string[]).includes(entry.stageId) &&
        typeof entry.title === "string" &&
        typeof entry.theoreticalSolveRequired === "string" &&
        isStringArray(entry.requiredObservables) &&
        isStringArray(entry.requiredReceipts) &&
        isStringArray(entry.falsifiers) &&
        isStringArray(entry.blockerIds) &&
        isStringArray(entry.researchRefs) &&
        entry.nonComputableRuntimeArtifactRequired === true,
    ) &&
    scalarChecks != null &&
    scalarChecks.length === NHM2_EXPERIMENT_FACING_SCALAR_CHECK_IDS.length &&
    scalarChecks.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.checkId === "string" &&
        (NHM2_EXPERIMENT_FACING_SCALAR_CHECK_IDS as readonly string[]).includes(entry.checkId) &&
        typeof entry.expression === "string" &&
        typeof entry.displayLatex === "string" &&
        typeof entry.purpose === "string" &&
        isStringArray(entry.stageIds) &&
        entry.calculatorLoadable === true &&
        entry.cannotSubstituteForReceipt === true,
    ) &&
    summary != null &&
    summary.stageCount === NHM2_EXPERIMENT_FACING_STAGE_IDS.length &&
    typeof summary.receiptBlockedStageCount === "number" &&
    typeof summary.firstBlocker === "string" &&
    isStringArray(summary.calculatorLoadableScalarCheckIds) &&
    isStringArray(summary.nonComputableStageIds) &&
    claimBoundary != null &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.roadmapOnly === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false &&
    claimBoundary.speedAuthorityClaimAllowed === false &&
    claimBoundary.scalarChecksCannotSubstituteForExperimentalReceipts === true &&
    claimBoundary.diagnosticCampaignCannotSubstituteForExperimentalReceipts === true &&
    claimBoundary.leanCertificateCannotSubstituteForExperimentalReceipts === true
  );
};
