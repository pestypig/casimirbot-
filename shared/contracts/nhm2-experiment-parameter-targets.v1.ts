import {
  NHM2_EXPERIMENT_FACING_STAGE_IDS,
  type Nhm2ExperimentFacingStageId,
} from "./nhm2-experiment-facing-theory-roadmap.v1";

export const NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT_VERSION =
  "nhm2_experiment_parameter_targets/v1";

export const NHM2_EXPERIMENT_TARGET_KINDS = [
  "design_parameter",
  "modeled_scalar",
  "derived_scale_check",
  "measurement_threshold",
  "material_property",
  "systematics_bound",
  "full_tensor_requirement",
  "observer_qei_requirement",
  "replication_requirement",
] as const;

export const NHM2_EXPERIMENT_FEASIBILITY_STATUSES = [
  "modeled_target",
  "literature_supported",
  "engineering_review",
  "systematics_limited",
  "detector_limited",
  "blocked_missing_receipt",
] as const;

export type Nhm2ExperimentTargetKind = (typeof NHM2_EXPERIMENT_TARGET_KINDS)[number];
export type Nhm2ExperimentFeasibilityStatus =
  (typeof NHM2_EXPERIMENT_FEASIBILITY_STATUSES)[number];

export type Nhm2ExperimentParameterTargetValueV1 = {
  value: number | string | null;
  valueSI?: number | null;
  unit: string | null;
  provenance:
    | "repo_whitepaper"
    | "repo_contract"
    | "derived_from_repo_values"
    | "literature_target"
    | "not_yet_defined";
  sourceRef: string;
  notes: string[];
};

export type Nhm2ExperimentLiteratureRangeV1 = {
  summary: string;
  minSI?: number | null;
  maxSI?: number | null;
  unit?: string | null;
  confidence: "reference_anchor" | "rough_scale" | "not_applicable";
};

export type Nhm2ExperimentParameterTargetRowV1 = {
  stageId: Nhm2ExperimentFacingStageId;
  parameterId: string;
  currentNhm2Target: Nhm2ExperimentParameterTargetValueV1;
  unit: string | null;
  targetKind: Nhm2ExperimentTargetKind;
  literatureRange: Nhm2ExperimentLiteratureRangeV1;
  feasibilityStatus: Nhm2ExperimentFeasibilityStatus;
  measurementMethod: string;
  requiredReceipt: string;
  blockers: string[];
  researchRefs: string[];
  claimBoundary: {
    diagnosticOnly: true;
    parameterTargetOnly: true;
    notMeasured: true;
    cannotSubstituteForReceipt: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type Nhm2ExperimentParameterTargetsV1 = {
  contractVersion: typeof NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  roadmapContractRef: "nhm2_experiment_facing_theory_roadmap/v1";
  rows: Nhm2ExperimentParameterTargetRowV1[];
  summary: {
    rowCount: number;
    stageIdsCovered: Nhm2ExperimentFacingStageId[];
    receiptBlockedRowCount: number;
    firstBlocker: string;
    scalarTargetIds: string[];
    nonReceiptTargetIds: string[];
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    parameterTargetLayerOnly: true;
    parameterTargetsCannotSubstituteForExperimentalReceipts: true;
    scalarTargetsCannotSubstituteForExperimentalReceipts: true;
    literatureRangesCannotSubstituteForMeasurements: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2ExperimentParameterTargetsInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
};

const DEFAULT_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const WHITEPAPER = "docs/research/nhm2-current-status-whitepaper.md";
const ROADMAP_CONTRACT = "shared/contracts/nhm2-experiment-facing-theory-roadmap.v1.ts";

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
  highStressSin: "physrevapplied_2021_high_stress_nanomechanical_resonators",
  alnMemsReview: "critical_reviews_2024_aln_cmos_mems",
  tinMembraneResonators: "apl_2025_ultra_high_stress_tin_membranes",
} as const;

const claimBoundary = (): Nhm2ExperimentParameterTargetRowV1["claimBoundary"] => ({
  diagnosticOnly: true,
  parameterTargetOnly: true,
  notMeasured: true,
  cannotSubstituteForReceipt: true,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  routeEtaClaimAllowed: false,
  propulsionClaimAllowed: false,
  speedAuthorityClaimAllowed: false,
});

const row = (
  input: Omit<Nhm2ExperimentParameterTargetRowV1, "claimBoundary">,
): Nhm2ExperimentParameterTargetRowV1 => ({
  ...input,
  claimBoundary: claimBoundary(),
});

const buildRows = (): Nhm2ExperimentParameterTargetRowV1[] => [
  row({
    stageId: "prediction_freeze",
    parameterId: "prediction_freeze.observable_vector",
    currentNhm2Target: {
      value:
        "DeltaTmunu_xt, delta_phi_f, delta_tau, delta_F, h00_proxy, R_0i0j frozen before data",
      unit: null,
      provenance: "repo_contract",
      sourceRef: `${ROADMAP_CONTRACT}:prediction_freeze`,
      notes: [
        "Freezes source, clock, force, metric-response, null-control, and falsifier predictions before data collection.",
      ],
    },
    unit: null,
    targetKind: "measurement_threshold",
    literatureRange: {
      summary:
        "Comparable campaigns pre-register force, metric, and gravity-coupling observables before interpreting weak signals.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "blocked_missing_receipt",
    measurementMethod:
      "Pre-registered artifact with observable definitions, uncertainty budget, null controls, and falsifier IDs.",
    requiredReceipt: "pre_registered_prediction_receipt",
    blockers: ["prediction_freeze_receipt_missing"],
    researchRefs: [RESEARCH.casimirMass, RESEARCH.ligoSensitivity, RESEARCH.millimetreGravity],
  }),
  row({
    stageId: "tile_metrology",
    parameterId: "tile_metrology.gap_m",
    currentNhm2Target: {
      value: 8e-9,
      valueSI: 8e-9,
      unit: "m",
      provenance: "repo_whitepaper",
      sourceRef: `${WHITEPAPER}:396`,
      notes: ["Frozen NHM2 cavity contract gap is 8 nm."],
    },
    unit: "m",
    targetKind: "design_parameter",
    literatureRange: {
      summary:
        "Real-material Casimir interpretation requires calibrated force-distance data, dielectric response, temperature, roughness, and patch-potential control.",
      unit: "m",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "systematics_limited",
    measurementMethod:
      "Gap metrology plus force-versus-gap curve, roughness map, patch-potential map, temperature, and dielectric-response receipt.",
    requiredReceipt: "gap_metrology_receipt",
    blockers: ["gap_metrology_receipt_missing", "patch_potential_receipt_missing"],
    researchRefs: [
      RESEARCH.realMaterialCasimir,
      RESEARCH.siliconCasimirChip,
      RESEARCH.patchPotentials,
    ],
  }),
  row({
    stageId: "tile_metrology",
    parameterId: "tile_metrology.tile_area_m2",
    currentNhm2Target: {
      value: 1e-4,
      valueSI: 1e-4,
      unit: "m^2",
      provenance: "derived_from_repo_values",
      sourceRef: `${WHITEPAPER}:396`,
      notes: ["Derived from the frozen 10 mm x 10 mm tile area."],
    },
    unit: "m^2",
    targetKind: "design_parameter",
    literatureRange: {
      summary:
        "On-chip Casimir experiments demonstrate lithographic alignment and parallelism, but not hull-scale source authority.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "engineering_review",
    measurementMethod:
      "Lithographic area and parallelism receipt tied to the same force-gap and material model.",
    requiredReceipt: "tile_geometry_metrology_receipt",
    blockers: ["tile_geometry_metrology_receipt_missing"],
    researchRefs: [RESEARCH.siliconCasimirChip, RESEARCH.arbitraryMaterialCasimir],
  }),
  row({
    stageId: "tile_metrology",
    parameterId: "tile_metrology.ideal_pressure_pa",
    currentNhm2Target: {
      value: 3.17e5,
      valueSI: 3.17e5,
      unit: "Pa",
      provenance: "derived_from_repo_values",
      sourceRef: `${WHITEPAPER}:396`,
      notes: [
        "Ideal perfect-conductor 8 nm pressure scale; diagnostic scalar only until real-material and mechanical receipts exist.",
      ],
    },
    unit: "Pa",
    targetKind: "modeled_scalar",
    literatureRange: {
      summary:
        "Real devices require Lifshitz/material corrections and mechanical stress review; high-stress SiN/AlN/TiN literature is only a comparator for material plausibility.",
      unit: "Pa",
      confidence: "rough_scale",
    },
    feasibilityStatus: "engineering_review",
    measurementMethod:
      "Force curve plus material stress, pull-in, hysteresis, thermal, roughness, and patch-potential receipts.",
    requiredReceipt: "tile_force_gap_and_mechanical_stress_receipt",
    blockers: [
      "ideal_scalar_pressure_not_material_receipt",
      "mechanical_support_model_missing",
    ],
    researchRefs: [
      RESEARCH.realMaterialCasimir,
      RESEARCH.highStressSin,
      RESEARCH.alnMemsReview,
      RESEARCH.tinMembraneResonators,
    ],
  }),
  row({
    stageId: "tile_metrology",
    parameterId: "tile_metrology.material_stack",
    currentNhm2Target: {
      value: "Au-SiN-AlN engineering-freeze stack",
      unit: null,
      provenance: "repo_whitepaper",
      sourceRef: `${WHITEPAPER}:396`,
      notes: ["Engineering-freeze stack name; not a measured material receipt."],
    },
    unit: null,
    targetKind: "material_property",
    literatureRange: {
      summary:
        "High-stress SiN/AlN/TiN literature can bound plausible film stress and MEMS compatibility, but NHM2 still needs coupon-level receipts.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "blocked_missing_receipt",
    measurementMethod:
      "Material coupon with dielectric response, residual stress, roughness, temperature, conductivity, and fatigue receipts.",
    requiredReceipt: "material_coupon_receipt",
    blockers: ["material_coupon_receipt_missing"],
    researchRefs: [RESEARCH.highStressSin, RESEARCH.alnMemsReview, RESEARCH.tinMembraneResonators],
  }),
  row({
    stageId: "cycle_energy_balance",
    parameterId: "cycle_energy_balance.ideal_tile_energy_j",
    currentNhm2Target: {
      value: 8.46e-8,
      valueSI: 8.46e-8,
      unit: "J",
      provenance: "repo_whitepaper",
      sourceRef: `${WHITEPAPER}:396`,
      notes: ["Magnitude of the ideal 8 nm one-tile scalar replay energy."],
    },
    unit: "J",
    targetKind: "modeled_scalar",
    literatureRange: {
      summary:
        "Dynamical Casimir observations and gravitational-mass proposals motivate energy-ledger tests, but do not close NHM2 source authority.",
      unit: "J",
      confidence: "rough_scale",
    },
    feasibilityStatus: "modeled_target",
    measurementMethod:
      "Cycle energy ledger closing electrical input, mechanical work, heat, radiation, elastic energy, and loss channels.",
    requiredReceipt: "cycle_energy_ledger_receipt",
    blockers: ["cycle_energy_balance_receipt_missing"],
    researchRefs: [RESEARCH.dynamicalCasimirNature2011, RESEARCH.casimirMass],
  }),
  row({
    stageId: "array_scaling",
    parameterId: "array_scaling.layer_count",
    currentNhm2Target: {
      value: 447,
      valueSI: 447,
      unit: "layers",
      provenance: "repo_whitepaper",
      sourceRef: `${WHITEPAPER}:419`,
      notes: [
        "Scalar fixed-control-volume layer candidate; does not establish material source closure.",
      ],
    },
    unit: "layers",
    targetKind: "derived_scale_check",
    literatureRange: {
      summary:
        "Array scaling must measure cross-coupling, support stress, heat, and geometry corrections rather than assume linear layer multiplication.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "engineering_review",
    measurementMethod:
      "Module array scaling receipt comparing DeltaE_N to N DeltaE_1 with cross-coupling and support-stress bounds.",
    requiredReceipt: "array_scaling_receipt",
    blockers: ["array_scaling_receipt_missing", "scalar_layer_count_not_source_receipt"],
    researchRefs: [RESEARCH.arbitraryMaterialCasimir, RESEARCH.realMaterialCasimir],
  }),
  row({
    stageId: "array_scaling",
    parameterId: "array_scaling.stack_thickness_m",
    currentNhm2Target: {
      value: 0.001345,
      valueSI: 0.001345,
      unit: "m",
      provenance: "derived_from_repo_values",
      sourceRef: `${WHITEPAPER}:416-419`,
      notes: ["Derived from 447 layers of 3.008 um mirror-gap-mirror rows."],
    },
    unit: "m",
    targetKind: "derived_scale_check",
    literatureRange: {
      summary:
        "A millimetre-scale stack is an engineering envelope; physical review still needs thermal, elastic, wiring, and support geometry receipts.",
      unit: "m",
      confidence: "rough_scale",
    },
    feasibilityStatus: "engineering_review",
    measurementMethod:
      "Layer-stack geometry receipt with packing, orientation, thermal, and stress integration evidence.",
    requiredReceipt: "layer_stack_geometry_receipt",
    blockers: ["layer_stack_geometry_receipt_missing"],
    researchRefs: [RESEARCH.highStressSin, RESEARCH.alnMemsReview, RESEARCH.realMaterialCasimir],
  }),
  row({
    stageId: "full_apparatus_tensor",
    parameterId: "full_apparatus_tensor.required_components",
    currentNhm2Target: {
      value: "T00, T0i, diagonal Tij, off-diagonal Tij for plates/supports/drive/material",
      unit: null,
      provenance: "repo_contract",
      sourceRef: `${ROADMAP_CONTRACT}:full_apparatus_tensor`,
      notes: ["The whole apparatus stress-energy tensor is required, not just ideal interaction energy."],
    },
    unit: null,
    targetKind: "full_tensor_requirement",
    literatureRange: {
      summary:
        "Casimir gravitational-mass and arbitrary-material Casimir references support whole-apparatus accounting rather than scalar interaction-energy shortcuts.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "blocked_missing_receipt",
    measurementMethod:
      "Source-side component authority ledger with same-basis metadata and no metric-target echo.",
    requiredReceipt: "full_apparatus_tensor_receipt",
    blockers: ["full_apparatus_tensor_receipt_missing"],
    researchRefs: [RESEARCH.casimirMass, RESEARCH.arbitraryMaterialCasimir],
  }),
  row({
    stageId: "vacuum_weight",
    parameterId: "vacuum_weight.one_tile_weight_equivalent_n",
    currentNhm2Target: {
      value: 9.24e-24,
      valueSI: 9.24e-24,
      unit: "N",
      provenance: "derived_from_repo_values",
      sourceRef: `${WHITEPAPER}:396`,
      notes: ["Computed as g*|E_tile|/c^2 using the ideal one-tile scalar energy magnitude."],
    },
    unit: "N",
    targetKind: "derived_scale_check",
    literatureRange: {
      summary:
        "Archimedes-style balance work targets modulated vacuum-energy weight detection with sensitive balances; NHM2 one-tile scalar force is far below direct standalone detection.",
      unit: "N",
      confidence: "rough_scale",
    },
    feasibilityStatus: "detector_limited",
    measurementMethod:
      "Lock-in balance with active/dummy samples, orientation reversal, phase/sign checks, and environmental nulls.",
    requiredReceipt: "vacuum_weight_receipt",
    blockers: ["vacuum_weight_receipt_missing", "one_tile_force_below_direct_detection"],
    researchRefs: [
      RESEARCH.archimedesBalancePrototype,
      RESEARCH.archimedes2025Status,
      RESEARCH.casimirMass,
    ],
  }),
  row({
    stageId: "metric_response",
    parameterId: "metric_response.weak_field_h00_proxy",
    currentNhm2Target: {
      value: "h00_proxy = 2*G*DeltaE/(r*c^4)",
      unit: null,
      provenance: "repo_contract",
      sourceRef: `${ROADMAP_CONTRACT}:weak_field_h00_proxy`,
      notes: ["Calculator sanity bound only; not a measured metric-response receipt."],
    },
    unit: null,
    targetKind: "derived_scale_check",
    literatureRange: {
      summary:
        "Advanced LIGO reaches strain sensitivity better than 1e-23/sqrtHz around 100 Hz; small-source gravity experiments demonstrate millimetre-scale force metrology, not NHM2 metric validation.",
      unit: "strain",
      maxSI: 1e-23,
      confidence: "rough_scale",
    },
    feasibilityStatus: "detector_limited",
    measurementMethod:
      "Multi-probe optical, clock/atom, and mechanical free-mass response fitted to one invariant metric model.",
    requiredReceipt: "metric_response_receipt",
    blockers: ["metric_response_receipt_missing", "weak_field_scalar_not_detector_response"],
    researchRefs: [
      RESEARCH.ligoSensitivity,
      RESEARCH.millimetreGravity,
      RESEARCH.scharnhorstCaution,
    ],
  }),
  row({
    stageId: "qei_observer_admissibility",
    parameterId: "qei_observer_admissibility.worldline_and_observer_receipts",
    currentNhm2Target: {
      value:
        "worldline QEI dossier plus WEC/NEC/SEC/DEC observer-family checks against the apparatus tensor",
      unit: null,
      provenance: "repo_contract",
      sourceRef: `${ROADMAP_CONTRACT}:qei_observer_admissibility`,
      notes: ["Scalar qei_margin and Eulerian-only checks are explicitly insufficient."],
    },
    unit: null,
    targetKind: "observer_qei_requirement",
    literatureRange: {
      summary:
        "Pfenning-Ford and generic warp NEC analyses are caution rails; stationary-worldline QEI work supplies bound-planning context.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "blocked_missing_receipt",
    measurementMethod:
      "Worldline sampling/bound dossier and observer-family energy-condition artifact over the same tensor and atlas.",
    requiredReceipt: "qei_worldline_and_observer_family_receipts",
    blockers: ["qei_observer_admissibility_receipts_missing"],
    researchRefs: [RESEARCH.pfenningFord, RESEARCH.stationaryWorldlineQei, RESEARCH.genericWarpNec],
  }),
  row({
    stageId: "independent_replication",
    parameterId: "independent_replication.replication_receipt",
    currentNhm2Target: {
      value: "independent apparatus, blind analysis, null-result bound, falsified model ID",
      unit: null,
      provenance: "repo_contract",
      sourceRef: `${ROADMAP_CONTRACT}:independent_replication`,
      notes: ["Unreplicated positive or local-generated results cannot unlock claim boundaries."],
    },
    unit: null,
    targetKind: "replication_requirement",
    literatureRange: {
      summary:
        "Gravity, balance, and detector-scale programs require independent systematics and replication before stronger claims.",
      confidence: "reference_anchor",
    },
    feasibilityStatus: "blocked_missing_receipt",
    measurementMethod:
      "Independent lab replication with blind analysis and pre-registered null-result disposition.",
    requiredReceipt: "independent_replication_receipt",
    blockers: ["independent_replication_receipt_missing"],
    researchRefs: [RESEARCH.archimedes2025Status, RESEARCH.millimetreGravity, RESEARCH.ligoSensitivity],
  }),
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isTargetKind = (value: unknown): value is Nhm2ExperimentTargetKind =>
  typeof value === "string" && (NHM2_EXPERIMENT_TARGET_KINDS as readonly string[]).includes(value);

const isFeasibilityStatus = (value: unknown): value is Nhm2ExperimentFeasibilityStatus =>
  typeof value === "string" &&
  (NHM2_EXPERIMENT_FEASIBILITY_STATUSES as readonly string[]).includes(value);

export const buildNhm2ExperimentParameterTargets = (
  input: BuildNhm2ExperimentParameterTargetsInput = {},
): Nhm2ExperimentParameterTargetsV1 => {
  const rows = buildRows();
  const blockers = rows.flatMap((entry) => entry.blockers);
  const scalarTargetIds = rows
    .filter((entry) => ["modeled_scalar", "derived_scale_check"].includes(entry.targetKind))
    .map((entry) => entry.parameterId);
  return {
    contractVersion: NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_PROFILE_ID,
    roadmapContractRef: "nhm2_experiment_facing_theory_roadmap/v1",
    rows,
    summary: {
      rowCount: rows.length,
      stageIdsCovered: [...new Set(rows.map((entry) => entry.stageId))],
      receiptBlockedRowCount: rows.filter((entry) => entry.blockers.length > 0).length,
      firstBlocker: blockers[0] ?? "none",
      scalarTargetIds,
      nonReceiptTargetIds: rows
        .filter((entry) => entry.claimBoundary.cannotSubstituteForReceipt)
        .map((entry) => entry.parameterId),
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      parameterTargetLayerOnly: true,
      parameterTargetsCannotSubstituteForExperimentalReceipts: true,
      scalarTargetsCannotSubstituteForExperimentalReceipts: true,
      literatureRangesCannotSubstituteForMeasurements: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2ExperimentParameterTargets = (
  value: unknown,
): value is Nhm2ExperimentParameterTargetsV1 => {
  if (!isRecord(value)) return false;
  const rows = Array.isArray(value.rows) ? value.rows : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_EXPERIMENT_PARAMETER_TARGETS_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.roadmapContractRef === "nhm2_experiment_facing_theory_roadmap/v1" &&
    rows != null &&
    rows.length > 0 &&
    rows.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.stageId === "string" &&
        (NHM2_EXPERIMENT_FACING_STAGE_IDS as readonly string[]).includes(entry.stageId) &&
        typeof entry.parameterId === "string" &&
        isRecord(entry.currentNhm2Target) &&
        ("value" in entry.currentNhm2Target) &&
        (entry.unit === null || typeof entry.unit === "string") &&
        isTargetKind(entry.targetKind) &&
        isRecord(entry.literatureRange) &&
        typeof entry.literatureRange.summary === "string" &&
        isFeasibilityStatus(entry.feasibilityStatus) &&
        typeof entry.measurementMethod === "string" &&
        typeof entry.requiredReceipt === "string" &&
        isStringArray(entry.blockers) &&
        entry.blockers.length > 0 &&
        isStringArray(entry.researchRefs) &&
        entry.researchRefs.length > 0 &&
        isRecord(entry.claimBoundary) &&
        entry.claimBoundary.diagnosticOnly === true &&
        entry.claimBoundary.parameterTargetOnly === true &&
        entry.claimBoundary.notMeasured === true &&
        entry.claimBoundary.cannotSubstituteForReceipt === true &&
        entry.claimBoundary.physicalViabilityClaimAllowed === false &&
        entry.claimBoundary.transportClaimAllowed === false &&
        entry.claimBoundary.routeEtaClaimAllowed === false &&
        entry.claimBoundary.propulsionClaimAllowed === false &&
        entry.claimBoundary.speedAuthorityClaimAllowed === false,
    ) &&
    summary != null &&
    typeof summary.rowCount === "number" &&
    summary.rowCount === rows.length &&
    Array.isArray(summary.stageIdsCovered) &&
    typeof summary.receiptBlockedRowCount === "number" &&
    typeof summary.firstBlocker === "string" &&
    isStringArray(summary.scalarTargetIds) &&
    isStringArray(summary.nonReceiptTargetIds) &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.parameterTargetLayerOnly === true &&
    boundary.parameterTargetsCannotSubstituteForExperimentalReceipts === true &&
    boundary.scalarTargetsCannotSubstituteForExperimentalReceipts === true &&
    boundary.literatureRangesCannotSubstituteForMeasurements === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
