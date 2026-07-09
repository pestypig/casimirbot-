export const NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT_VERSION =
  "nhm2_layer_stack_mechanical_receipt/v1";

export const NHM2_LAYER_STACK_MECHANICAL_STATUSES = [
  "pass",
  "review",
  "fail",
  "missing",
  "not_evaluated",
] as const;

export const NHM2_LAYER_STACK_EVIDENCE_STATUSES = [
  "computed_ideal",
  "design",
  "measured",
  "simulated",
  "missing",
] as const;

export type Nhm2LayerStackMechanicalStatus =
  (typeof NHM2_LAYER_STACK_MECHANICAL_STATUSES)[number];
export type Nhm2LayerStackEvidenceStatus =
  (typeof NHM2_LAYER_STACK_EVIDENCE_STATUSES)[number];

export type Nhm2LayerStackMechanicalQuantityV1 = {
  valueSI: number | null;
  unit: string;
  status: Nhm2LayerStackEvidenceStatus;
  sourceRef: string;
  notes: string[];
};

export type Nhm2LayerStackMechanicalReceiptV1 = {
  contractVersion: typeof NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  layerCandidateRef: string;
  inputGeometry: {
    gapMeters: Nhm2LayerStackMechanicalQuantityV1;
    tileAreaMeters2: Nhm2LayerStackMechanicalQuantityV1;
    mirrorThicknessMeters: Nhm2LayerStackMechanicalQuantityV1;
    layerCount: Nhm2LayerStackMechanicalQuantityV1;
    stackThicknessMeters: Nhm2LayerStackMechanicalQuantityV1;
  };
  idealCasimirLoad: {
    pressurePa: Nhm2LayerStackMechanicalQuantityV1;
    forcePerTileN: Nhm2LayerStackMechanicalQuantityV1;
    forcePer447LayerStackN: Nhm2LayerStackMechanicalQuantityV1;
    effectiveStackPressurePa: Nhm2LayerStackMechanicalQuantityV1;
    idealTileEnergyJ: Nhm2LayerStackMechanicalQuantityV1;
    idealStackEnergyJ: Nhm2LayerStackMechanicalQuantityV1;
  };
  engineeringReceipts: {
    materialCouponStatus: Nhm2LayerStackMechanicalStatus;
    forceGapCurveStatus: Nhm2LayerStackMechanicalStatus;
    pullInMarginStatus: Nhm2LayerStackMechanicalStatus;
    supportFractionStatus: Nhm2LayerStackMechanicalStatus;
    roughnessMarginStatus: Nhm2LayerStackMechanicalStatus;
    patchPotentialBoundStatus: Nhm2LayerStackMechanicalStatus;
    thermalLoadStatus: Nhm2LayerStackMechanicalStatus;
    fatigueMarginStatus: Nhm2LayerStackMechanicalStatus;
    activeControlEnergyStatus: Nhm2LayerStackMechanicalStatus;
    linearScalingValidityStatus: Nhm2LayerStackMechanicalStatus;
  };
  supportWindow: {
    materialPresetId: "ultra_high_stress_tin_literature_comparator";
    allowableStressPa: number;
    safetyFactor: number;
    designStressLimitPa: number;
    materialCorrection: number;
    layerScalingEfficiency: number;
    minimumSourceRetention: number;
    minimumSupportFractionForStress: number;
    maximumSupportFractionForSourceRetention: number;
    minimumSupportAreaMeters2: number;
    maximumSupportAreaForRetentionMeters2: number;
    overlapMargin: number;
    feasibleSupportRetentionWindow: boolean;
    requiredSupportFractionReductionForOverlap: number;
    requiredSourceRetentionIncreaseForStressSupport: number;
    status: "candidate_window" | "review" | "fail";
    blockers: string[];
    notes: string[];
  };
  blockers: string[];
  summary: {
    scalarForceComputed: boolean;
    forceScaleKilonewtons: number;
    effectiveStackPressureMPa: number;
    stackThicknessMm: number;
    supportRetentionOverlapMargin: number;
    mechanicalReceiptComplete: boolean;
    materialReceiptComplete: boolean;
    fullTensorSourceAuthorityAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
  };
  researchRefs: [
    "revmodphys_81_1827_real_material_casimir",
    "pmc_2024_casimir_mems_review",
    "physrevb_87_125413_roughness_mems_actuation",
    "arxiv_1207_4429_surface_potential_nanomebrane",
    "physrevapplied_15_034063_high_stress_sin",
    "apl_127_222202_high_stress_tin"
  ];
  claimBoundary: {
    diagnosticOnly: true;
    mechanicalReceiptOnly: true;
    idealScalarLoadIsNotMaterialReceipt: true;
    linearLayerScalingIsNotAssumed: true;
    internalLoadIsNotThrust: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2LayerStackMechanicalReceiptInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  gapMeters?: number | null;
  tileAreaMeters2?: number | null;
  mirrorThicknessMeters?: number | null;
  layerCount?: number | null;
};

const DEFAULT_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";
const WHITEPAPER = "docs/research/nhm2-current-status-whitepaper.md";
const PARAMETER_TARGETS_CONTRACT =
  "shared/contracts/nhm2-experiment-parameter-targets.v1.ts";
const HBAR_SI = 1.054571817e-34;
const C_SI = 299792458;
const DEFAULT_GAP_M = 8e-9;
const DEFAULT_TILE_AREA_M2 = 1e-4;
const DEFAULT_MIRROR_THICKNESS_M = 1.5e-6;
const DEFAULT_LAYER_COUNT = 447;
const TIN_ALLOWABLE_STRESS_PA = 2.3e9;
const SUPPORT_WINDOW_SAFETY_FACTOR = 3;
const SUPPORT_WINDOW_MATERIAL_CORRECTION = 0.85;
const SUPPORT_WINDOW_LAYER_SCALING_EFFICIENCY = 0.9;
const SUPPORT_WINDOW_MINIMUM_SOURCE_RETENTION = 0.7;

const quantity = (
  valueSI: number | null,
  unit: string,
  status: Nhm2LayerStackEvidenceStatus,
  sourceRef: string,
  notes: string[] = [],
): Nhm2LayerStackMechanicalQuantityV1 => ({
  valueSI,
  unit,
  status,
  sourceRef,
  notes,
});

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isQuantity = (value: unknown): value is Nhm2LayerStackMechanicalQuantityV1 =>
  isRecord(value) &&
  (value.valueSI === null || typeof value.valueSI === "number") &&
  typeof value.unit === "string" &&
  typeof value.status === "string" &&
  (NHM2_LAYER_STACK_EVIDENCE_STATUSES as readonly string[]).includes(value.status) &&
  typeof value.sourceRef === "string" &&
  Array.isArray(value.notes) &&
  value.notes.every((entry) => typeof entry === "string");

const isStatus = (value: unknown): value is Nhm2LayerStackMechanicalStatus =>
  typeof value === "string" &&
  (NHM2_LAYER_STACK_MECHANICAL_STATUSES as readonly string[]).includes(value);

export const buildNhm2LayerStackMechanicalReceipt = (
  input: BuildNhm2LayerStackMechanicalReceiptInput = {},
): Nhm2LayerStackMechanicalReceiptV1 => {
  const gapMeters = input.gapMeters ?? DEFAULT_GAP_M;
  const tileAreaMeters2 = input.tileAreaMeters2 ?? DEFAULT_TILE_AREA_M2;
  const mirrorThicknessMeters = input.mirrorThicknessMeters ?? DEFAULT_MIRROR_THICKNESS_M;
  const layerCount = input.layerCount ?? DEFAULT_LAYER_COUNT;
  const rowThicknessMeters = 2 * mirrorThicknessMeters + gapMeters;
  const stackThicknessMeters = rowThicknessMeters * layerCount;
  const pressurePa = (Math.PI ** 2 * HBAR_SI * C_SI) / (240 * gapMeters ** 4);
  const forcePerTileN = pressurePa * tileAreaMeters2;
  const forcePerStackN = forcePerTileN * layerCount;
  const effectiveStackPressurePa = pressurePa * layerCount;
  const idealTileEnergyJ =
    (Math.PI ** 2 * HBAR_SI * C_SI * tileAreaMeters2) / (720 * gapMeters ** 3);
  const idealStackEnergyJ = idealTileEnergyJ * layerCount;
  const designStressLimitPa = TIN_ALLOWABLE_STRESS_PA / SUPPORT_WINDOW_SAFETY_FACTOR;
  const minimumSupportFractionForStress =
    forcePerStackN / (tileAreaMeters2 * designStressLimitPa);
  const maximumSupportFractionForSourceRetention =
    1 -
    SUPPORT_WINDOW_MINIMUM_SOURCE_RETENTION /
      (SUPPORT_WINDOW_MATERIAL_CORRECTION * SUPPORT_WINDOW_LAYER_SCALING_EFFICIENCY);
  const minimumSupportAreaMeters2 = tileAreaMeters2 * minimumSupportFractionForStress;
  const maximumSupportAreaForRetentionMeters2 =
    tileAreaMeters2 * maximumSupportFractionForSourceRetention;
  const supportRetentionOverlapMargin = round(
    maximumSupportFractionForSourceRetention / minimumSupportFractionForStress,
  );
  const feasibleSupportRetentionWindow = supportRetentionOverlapMargin >= 1;
  const requiredSupportFractionReductionForOverlap = round(
    Math.max(0, minimumSupportFractionForStress - maximumSupportFractionForSourceRetention),
  );
  const sourceRetentionAtStressSupport = Math.max(
    0,
    (1 - minimumSupportFractionForStress) *
      SUPPORT_WINDOW_MATERIAL_CORRECTION *
      SUPPORT_WINDOW_LAYER_SCALING_EFFICIENCY,
  );
  const requiredSourceRetentionIncreaseForStressSupport = round(
    Math.max(0, SUPPORT_WINDOW_MINIMUM_SOURCE_RETENTION - sourceRetentionAtStressSupport),
  );
  const supportWindowBlockers = [
    ...(!feasibleSupportRetentionWindow ? ["support_retention_overlap_window_missing"] : []),
    "support_fraction_receipt_missing",
    "support_drive_tensor_terms_missing",
  ];
  const blockers = [
    "material_coupon_receipt_missing",
    "force_gap_curve_receipt_missing",
    "pull_in_margin_not_evaluated",
    "support_fraction_receipt_missing",
    "roughness_margin_receipt_missing",
    "patch_potential_bound_receipt_missing",
    "thermal_load_receipt_missing",
    "fatigue_margin_receipt_missing",
    "active_control_energy_receipt_missing",
    "linear_scaling_receipt_missing",
    ...supportWindowBlockers,
  ];
  return {
    contractVersion: NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId ?? DEFAULT_PROFILE_ID,
    layerCandidateRef: "nhm2_layered_wall_source_candidate/v1:447-fixed-control-volume",
    inputGeometry: {
      gapMeters: quantity(gapMeters, "m", "design", `${PARAMETER_TARGETS_CONTRACT}:tile_metrology.gap_m`, [
        "Frozen cavity contract gap.",
      ]),
      tileAreaMeters2: quantity(
        tileAreaMeters2,
        "m^2",
        "design",
        `${PARAMETER_TARGETS_CONTRACT}:tile_metrology.tile_area_m2`,
        ["Derived from 10 mm x 10 mm projected tile area."],
      ),
      mirrorThicknessMeters: quantity(
        mirrorThicknessMeters,
        "m",
        "design",
        `${WHITEPAPER}:416`,
        ["Engineering-freeze mirror thickness used in the 447-layer stack arithmetic."],
      ),
      layerCount: quantity(layerCount, "layers", "design", `${PARAMETER_TARGETS_CONTRACT}:array_scaling.layer_count`, [
        "Scalar fixed-control-volume layer candidate.",
      ]),
      stackThicknessMeters: quantity(
        round(stackThicknessMeters),
        "m",
        "computed_ideal",
        `${PARAMETER_TARGETS_CONTRACT}:array_scaling.stack_thickness_m`,
        ["Computed as layerCount * (2 * mirrorThickness + gap)."],
      ),
    },
    idealCasimirLoad: {
      pressurePa: quantity(round(pressurePa), "Pa", "computed_ideal", `${PARAMETER_TARGETS_CONTRACT}:tile_metrology.ideal_pressure_pa`, [
        "Ideal perfect-conductor pressure scale; not a material receipt.",
      ]),
      forcePerTileN: quantity(round(forcePerTileN), "N", "computed_ideal", "F_tile = P_ideal * A_tile", [
        "Internal normal attraction between plates, not thrust.",
      ]),
      forcePer447LayerStackN: quantity(round(forcePerStackN), "N", "computed_ideal", "F_stack = N_layer * F_tile", [
        "Naive linear fixed-control-volume stack load.",
      ]),
      effectiveStackPressurePa: quantity(
        round(effectiveStackPressurePa),
        "Pa",
        "computed_ideal",
        "P_stack = N_layer * P_ideal",
        ["Effective projected stress scale for the 447-layer scalar candidate."],
      ),
      idealTileEnergyJ: quantity(
        round(idealTileEnergyJ),
        "J",
        "computed_ideal",
        `${PARAMETER_TARGETS_CONTRACT}:cycle_energy_balance.ideal_tile_energy_j`,
        ["Ideal scalar one-tile replay energy magnitude."],
      ),
      idealStackEnergyJ: quantity(round(idealStackEnergyJ), "J", "computed_ideal", "E_stack = N_layer * E_tile", [
        "Naive scalar energy magnitude for the 447-layer candidate.",
      ]),
    },
    engineeringReceipts: {
      materialCouponStatus: "missing",
      forceGapCurveStatus: "missing",
      pullInMarginStatus: "not_evaluated",
      supportFractionStatus: "missing",
      roughnessMarginStatus: "missing",
      patchPotentialBoundStatus: "missing",
      thermalLoadStatus: "missing",
      fatigueMarginStatus: "missing",
      activeControlEnergyStatus: "missing",
      linearScalingValidityStatus: "missing",
    },
    supportWindow: {
      materialPresetId: "ultra_high_stress_tin_literature_comparator",
      allowableStressPa: TIN_ALLOWABLE_STRESS_PA,
      safetyFactor: SUPPORT_WINDOW_SAFETY_FACTOR,
      designStressLimitPa: round(designStressLimitPa),
      materialCorrection: SUPPORT_WINDOW_MATERIAL_CORRECTION,
      layerScalingEfficiency: SUPPORT_WINDOW_LAYER_SCALING_EFFICIENCY,
      minimumSourceRetention: SUPPORT_WINDOW_MINIMUM_SOURCE_RETENTION,
      minimumSupportFractionForStress: round(minimumSupportFractionForStress),
      maximumSupportFractionForSourceRetention: round(
        maximumSupportFractionForSourceRetention,
      ),
      minimumSupportAreaMeters2: round(minimumSupportAreaMeters2),
      maximumSupportAreaForRetentionMeters2: round(maximumSupportAreaForRetentionMeters2),
      overlapMargin: supportRetentionOverlapMargin,
      feasibleSupportRetentionWindow,
      requiredSupportFractionReductionForOverlap,
      requiredSourceRetentionIncreaseForStressSupport,
      status: feasibleSupportRetentionWindow ? "review" : "fail",
      blockers: supportWindowBlockers,
      notes: [
        "Computed diagnostic overlap between load-bearing support fraction and retained active/source fraction.",
        "Uses literature-comparator TiN allowable stress; this is not a measured material coupon receipt.",
        "Support and spacer stress-energy terms must still enter the full apparatus tensor.",
      ],
    },
    blockers,
    summary: {
      scalarForceComputed: true,
      forceScaleKilonewtons: round(forcePerStackN / 1000),
      effectiveStackPressureMPa: round(effectiveStackPressurePa / 1e6),
      stackThicknessMm: round(stackThicknessMeters * 1000),
      supportRetentionOverlapMargin,
      mechanicalReceiptComplete: false,
      materialReceiptComplete: false,
      fullTensorSourceAuthorityAllowed: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
    },
    researchRefs: [
      "revmodphys_81_1827_real_material_casimir",
      "pmc_2024_casimir_mems_review",
      "physrevb_87_125413_roughness_mems_actuation",
      "arxiv_1207_4429_surface_potential_nanomebrane",
      "physrevapplied_15_034063_high_stress_sin",
      "apl_127_222202_high_stress_tin",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      mechanicalReceiptOnly: true,
      idealScalarLoadIsNotMaterialReceipt: true,
      linearLayerScalingIsNotAssumed: true,
      internalLoadIsNotThrust: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2LayerStackMechanicalReceipt = (
  value: unknown,
): value is Nhm2LayerStackMechanicalReceiptV1 => {
  if (!isRecord(value)) return false;
  const inputGeometry = isRecord(value.inputGeometry) ? value.inputGeometry : null;
  const idealCasimirLoad = isRecord(value.idealCasimirLoad) ? value.idealCasimirLoad : null;
  const receipts = isRecord(value.engineeringReceipts) ? value.engineeringReceipts : null;
  const supportWindow = isRecord(value.supportWindow) ? value.supportWindow : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_LAYER_STACK_MECHANICAL_RECEIPT_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    typeof value.layerCandidateRef === "string" &&
    inputGeometry != null &&
    isQuantity(inputGeometry.gapMeters) &&
    isQuantity(inputGeometry.tileAreaMeters2) &&
    isQuantity(inputGeometry.mirrorThicknessMeters) &&
    isQuantity(inputGeometry.layerCount) &&
    isQuantity(inputGeometry.stackThicknessMeters) &&
    idealCasimirLoad != null &&
    isQuantity(idealCasimirLoad.pressurePa) &&
    isQuantity(idealCasimirLoad.forcePerTileN) &&
    isQuantity(idealCasimirLoad.forcePer447LayerStackN) &&
    isQuantity(idealCasimirLoad.effectiveStackPressurePa) &&
    isQuantity(idealCasimirLoad.idealTileEnergyJ) &&
    isQuantity(idealCasimirLoad.idealStackEnergyJ) &&
    receipts != null &&
    Object.values(receipts).every(isStatus) &&
    supportWindow != null &&
    supportWindow.materialPresetId === "ultra_high_stress_tin_literature_comparator" &&
    typeof supportWindow.allowableStressPa === "number" &&
    typeof supportWindow.safetyFactor === "number" &&
    typeof supportWindow.designStressLimitPa === "number" &&
    typeof supportWindow.materialCorrection === "number" &&
    typeof supportWindow.layerScalingEfficiency === "number" &&
    typeof supportWindow.minimumSourceRetention === "number" &&
    typeof supportWindow.minimumSupportFractionForStress === "number" &&
    typeof supportWindow.maximumSupportFractionForSourceRetention === "number" &&
    typeof supportWindow.minimumSupportAreaMeters2 === "number" &&
    typeof supportWindow.maximumSupportAreaForRetentionMeters2 === "number" &&
    typeof supportWindow.overlapMargin === "number" &&
    typeof supportWindow.feasibleSupportRetentionWindow === "boolean" &&
    typeof supportWindow.requiredSupportFractionReductionForOverlap === "number" &&
    typeof supportWindow.requiredSourceRetentionIncreaseForStressSupport === "number" &&
    (supportWindow.status === "candidate_window" ||
      supportWindow.status === "review" ||
      supportWindow.status === "fail") &&
    Array.isArray(supportWindow.blockers) &&
    supportWindow.blockers.every((entry) => typeof entry === "string") &&
    Array.isArray(supportWindow.notes) &&
    supportWindow.notes.every((entry) => typeof entry === "string") &&
    Array.isArray(value.blockers) &&
    value.blockers.every((entry) => typeof entry === "string") &&
    value.blockers.length > 0 &&
    summary != null &&
    summary.scalarForceComputed === true &&
    typeof summary.forceScaleKilonewtons === "number" &&
    typeof summary.effectiveStackPressureMPa === "number" &&
    typeof summary.stackThicknessMm === "number" &&
    typeof summary.supportRetentionOverlapMargin === "number" &&
    summary.mechanicalReceiptComplete === false &&
    summary.materialReceiptComplete === false &&
    summary.fullTensorSourceAuthorityAllowed === false &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    Array.isArray(value.researchRefs) &&
    value.researchRefs.length > 0 &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.mechanicalReceiptOnly === true &&
    boundary.idealScalarLoadIsNotMaterialReceipt === true &&
    boundary.linearLayerScalingIsNotAssumed === true &&
    boundary.internalLoadIsNotThrust === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
