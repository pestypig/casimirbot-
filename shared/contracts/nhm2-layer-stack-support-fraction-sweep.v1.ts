import { buildNhm2LayerStackMechanicalReceipt } from "./nhm2-layer-stack-mechanical-receipt.v1";

export const NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT_VERSION =
  "nhm2_layer_stack_support_fraction_sweep/v1";

export const NHM2_LAYER_STACK_SUPPORT_SWEEP_STATUSES = [
  "pass",
  "review",
  "fail",
] as const;

export const NHM2_LAYER_STACK_GO_NO_GO_STATUSES = [
  "candidate_window",
  "review",
  "fail",
] as const;

export type Nhm2LayerStackSupportSweepStatus =
  (typeof NHM2_LAYER_STACK_SUPPORT_SWEEP_STATUSES)[number];
export type Nhm2LayerStackGoNoGoStatus =
  (typeof NHM2_LAYER_STACK_GO_NO_GO_STATUSES)[number];

export type Nhm2LayerStackSupportMaterialPresetV1 = {
  materialPresetId: "high_stress_sin" | "aln_like_mems" | "ultra_high_stress_tin";
  label: string;
  allowableStressPa: number;
  literatureRef: string;
  receiptTier: "literature_comparator";
};

export type Nhm2LayerStackSupportFractionSweepRowV1 = {
  rowId: string;
  supportFraction: number;
  activeFraction: number;
  materialPresetId: Nhm2LayerStackSupportMaterialPresetV1["materialPresetId"];
  allowableStressPa: number;
  safetyFactor: number;
  designStressLimitPa: number;
  materialCorrection: number;
  layerScalingEfficiency: number;
  sourceRetention: number;
  retainedWallT00Fraction: number;
  supportStressPa: number;
  supportStressMPa: number;
  stressStatus: Nhm2LayerStackSupportSweepStatus;
  activeAreaStatus: Nhm2LayerStackSupportSweepStatus;
  sourceRetentionStatus: Nhm2LayerStackSupportSweepStatus;
  tensorContaminationStatus: Nhm2LayerStackSupportSweepStatus;
  goNoGoStatus: Nhm2LayerStackGoNoGoStatus;
  blockers: string[];
};

export type Nhm2LayerStackSupportFractionSweepV1 = {
  contractVersion: typeof NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  mechanicalReceiptRef: "nhm2_layer_stack_mechanical_receipt/v1";
  scalarInputs: {
    tileAreaMeters2: number;
    stackForceN: number;
    layerCount: number;
    stackThicknessMeters: number;
  };
  sweepConfig: {
    supportFractions: number[];
    materialPresets: Nhm2LayerStackSupportMaterialPresetV1[];
    safetyFactor: number;
    materialCorrection: number;
    layerScalingEfficiency: number;
    minimumActiveFraction: number;
    minimumSourceRetention: number;
    supportDriveTensorTermsSupplied: boolean;
  };
  rows: Nhm2LayerStackSupportFractionSweepRowV1[];
  summary: {
    rowCount: number;
    bestCandidateRows: Nhm2LayerStackSupportFractionSweepRowV1[];
    minimumSupportFractionForStress: number | null;
    maximumSupportFractionForSourceRetention: number | null;
    feasibleWindowExists: boolean;
    firstBlocker: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  researchRefs: [
    "pmc_2024_casimir_mems_review",
    "physrevb_87_125413_roughness_mems_actuation",
    "arxiv_1207_4429_surface_potential_nanomebrane",
    "revmodphys_81_1827_real_material_casimir",
    "physrevapplied_15_034063_high_stress_sin",
    "apl_127_222202_high_stress_tin"
  ];
  claimBoundary: {
    diagnosticOnly: true;
    supportFractionSweepOnly: true;
    idealScalarLoadIsNotMaterialEvidence: true;
    supportDriveTermsMustEnterFullTensor: true;
    internalLoadIsNotThrust: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2LayerStackSupportFractionSweepInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  supportFractions?: number[] | null;
  safetyFactor?: number | null;
  materialCorrection?: number | null;
  layerScalingEfficiency?: number | null;
  minimumActiveFraction?: number | null;
  minimumSourceRetention?: number | null;
  supportDriveTensorTermsSupplied?: boolean | null;
};

const DEFAULT_SUPPORT_FRACTIONS = [
  0.02,
  0.05,
  0.1,
  0.15,
  0.2,
  0.25,
  0.3,
  0.4,
  0.5,
  0.6,
  0.7,
  0.8,
] as const;

const MATERIAL_PRESETS: Nhm2LayerStackSupportMaterialPresetV1[] = [
  {
    materialPresetId: "aln_like_mems",
    label: "AlN-like MEMS review comparator",
    allowableStressPa: 5e8,
    literatureRef: "critical_reviews_2024_aln_cmos_mems",
    receiptTier: "literature_comparator",
  },
  {
    materialPresetId: "high_stress_sin",
    label: "High-stress SiN comparator",
    allowableStressPa: 1e9,
    literatureRef: "physrevapplied_15_034063_high_stress_sin",
    receiptTier: "literature_comparator",
  },
  {
    materialPresetId: "ultra_high_stress_tin",
    label: "Ultra-high-stress TiN comparator",
    allowableStressPa: 2.3e9,
    literatureRef: "apl_127_222202_high_stress_tin",
    receiptTier: "literature_comparator",
  },
] as const;

const DEFAULT_SAFETY_FACTOR = 3;
const DEFAULT_MATERIAL_CORRECTION = 0.85;
const DEFAULT_LAYER_SCALING_EFFICIENCY = 0.9;
const DEFAULT_MINIMUM_ACTIVE_FRACTION = 0.7;
const DEFAULT_MINIMUM_SOURCE_RETENTION = 0.7;

const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const statusFromMargin = (
  value: number,
  passLimit: number,
  reviewLimit: number,
  direction: "below" | "above",
): Nhm2LayerStackSupportSweepStatus => {
  if (direction === "below") {
    if (value <= passLimit) return "pass";
    if (value <= reviewLimit) return "review";
    return "fail";
  }
  if (value >= passLimit) return "pass";
  if (value >= reviewLimit) return "review";
  return "fail";
};

const firstBlocker = (rows: Nhm2LayerStackSupportFractionSweepRowV1[]): string => {
  if (rows.some((row) => row.goNoGoStatus === "candidate_window")) {
    return "none";
  }
  const stressPassRows = rows.filter((row) => row.stressStatus === "pass");
  const retentionPassRows = rows.filter((row) => row.sourceRetentionStatus === "pass");
  if (stressPassRows.length === 0) return "support_fraction_stress_window_missing";
  if (retentionPassRows.length === 0) return "active_area_source_retention_window_missing";
  const overlapRows = rows.filter(
    (row) => row.stressStatus === "pass" && row.sourceRetentionStatus === "pass",
  );
  if (overlapRows.length === 0) return "stress_retention_overlap_missing";
  return "support_drive_tensor_terms_missing";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStatus = (value: unknown): value is Nhm2LayerStackSupportSweepStatus =>
  typeof value === "string" &&
  (NHM2_LAYER_STACK_SUPPORT_SWEEP_STATUSES as readonly string[]).includes(value);

const isGoNoGoStatus = (value: unknown): value is Nhm2LayerStackGoNoGoStatus =>
  typeof value === "string" &&
  (NHM2_LAYER_STACK_GO_NO_GO_STATUSES as readonly string[]).includes(value);

export const buildNhm2LayerStackSupportFractionSweep = (
  input: BuildNhm2LayerStackSupportFractionSweepInput = {},
): Nhm2LayerStackSupportFractionSweepV1 => {
  const mechanicalReceipt = buildNhm2LayerStackMechanicalReceipt({
    generatedAt: input.generatedAt,
    selectedProfileId: input.selectedProfileId,
  });
  const supportFractions = input.supportFractions ?? [...DEFAULT_SUPPORT_FRACTIONS];
  const safetyFactor = input.safetyFactor ?? DEFAULT_SAFETY_FACTOR;
  const materialCorrection = input.materialCorrection ?? DEFAULT_MATERIAL_CORRECTION;
  const layerScalingEfficiency =
    input.layerScalingEfficiency ?? DEFAULT_LAYER_SCALING_EFFICIENCY;
  const minimumActiveFraction = input.minimumActiveFraction ?? DEFAULT_MINIMUM_ACTIVE_FRACTION;
  const minimumSourceRetention =
    input.minimumSourceRetention ?? DEFAULT_MINIMUM_SOURCE_RETENTION;
  const supportDriveTensorTermsSupplied = input.supportDriveTensorTermsSupplied ?? false;
  const stackForceN = mechanicalReceipt.idealCasimirLoad.forcePer447LayerStackN.valueSI ?? 0;
  const tileAreaMeters2 = mechanicalReceipt.inputGeometry.tileAreaMeters2.valueSI ?? 0;
  const rows = MATERIAL_PRESETS.flatMap((preset) =>
    supportFractions.map((supportFraction) => {
      const activeFraction = 1 - supportFraction;
      const designStressLimitPa = preset.allowableStressPa / safetyFactor;
      const sourceRetention = activeFraction * materialCorrection * layerScalingEfficiency;
      const supportStressPa = stackForceN / (tileAreaMeters2 * supportFraction);
      const stressStatus = statusFromMargin(
        supportStressPa,
        designStressLimitPa,
        preset.allowableStressPa,
        "below",
      );
      const activeAreaStatus = statusFromMargin(
        activeFraction,
        minimumActiveFraction,
        minimumActiveFraction * 0.85,
        "above",
      );
      const sourceRetentionStatus = statusFromMargin(
        sourceRetention,
        minimumSourceRetention,
        minimumSourceRetention * 0.85,
        "above",
      );
      const tensorContaminationStatus: Nhm2LayerStackSupportSweepStatus =
        supportDriveTensorTermsSupplied ? "pass" : "review";
      const blockers = [
        ...(stressStatus === "fail" ? ["support_stress_exceeds_material_limit"] : []),
        ...(stressStatus === "review" ? ["support_stress_inside_safety_factor_review_band"] : []),
        ...(activeAreaStatus === "fail" ? ["active_area_retention_below_threshold"] : []),
        ...(activeAreaStatus === "review" ? ["active_area_retention_review_band"] : []),
        ...(sourceRetentionStatus === "fail" ? ["wall_source_retention_below_threshold"] : []),
        ...(sourceRetentionStatus === "review" ? ["wall_source_retention_review_band"] : []),
        ...(tensorContaminationStatus !== "pass" ? ["support_drive_tensor_terms_missing"] : []),
      ];
      const goNoGoStatus: Nhm2LayerStackGoNoGoStatus =
        stressStatus === "pass" &&
        activeAreaStatus === "pass" &&
        sourceRetentionStatus === "pass" &&
        tensorContaminationStatus === "pass"
          ? "candidate_window"
          : stressStatus === "fail" ||
              activeAreaStatus === "fail" ||
              sourceRetentionStatus === "fail"
            ? "fail"
            : "review";
      return {
        rowId: `${preset.materialPresetId}:support_${supportFraction.toFixed(2)}`,
        supportFraction: round(supportFraction),
        activeFraction: round(activeFraction),
        materialPresetId: preset.materialPresetId,
        allowableStressPa: preset.allowableStressPa,
        safetyFactor,
        designStressLimitPa: round(designStressLimitPa),
        materialCorrection,
        layerScalingEfficiency,
        sourceRetention: round(sourceRetention),
        retainedWallT00Fraction: round(sourceRetention),
        supportStressPa: round(supportStressPa),
        supportStressMPa: round(supportStressPa / 1e6),
        stressStatus,
        activeAreaStatus,
        sourceRetentionStatus,
        tensorContaminationStatus,
        goNoGoStatus,
        blockers,
      };
    }),
  );
  const stressPassRows = rows.filter((row) => row.stressStatus === "pass");
  const sourceRetentionPassRows = rows.filter((row) => row.sourceRetentionStatus === "pass");
  const feasibleWindowRows = rows.filter((row) => row.goNoGoStatus === "candidate_window");
  return {
    contractVersion: NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT_VERSION,
    generatedAt: mechanicalReceipt.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: mechanicalReceipt.selectedProfileId,
    mechanicalReceiptRef: "nhm2_layer_stack_mechanical_receipt/v1",
    scalarInputs: {
      tileAreaMeters2,
      stackForceN,
      layerCount: mechanicalReceipt.inputGeometry.layerCount.valueSI ?? 0,
      stackThicknessMeters: mechanicalReceipt.inputGeometry.stackThicknessMeters.valueSI ?? 0,
    },
    sweepConfig: {
      supportFractions: supportFractions.map((entry) => round(entry)),
      materialPresets: MATERIAL_PRESETS.map((entry) => ({ ...entry })),
      safetyFactor,
      materialCorrection,
      layerScalingEfficiency,
      minimumActiveFraction,
      minimumSourceRetention,
      supportDriveTensorTermsSupplied,
    },
    rows,
    summary: {
      rowCount: rows.length,
      bestCandidateRows: feasibleWindowRows,
      minimumSupportFractionForStress:
        stressPassRows.length > 0
          ? Math.min(...stressPassRows.map((row) => row.supportFraction))
          : null,
      maximumSupportFractionForSourceRetention:
        sourceRetentionPassRows.length > 0
          ? Math.max(...sourceRetentionPassRows.map((row) => row.supportFraction))
          : null,
      feasibleWindowExists: feasibleWindowRows.length > 0,
      firstBlocker: firstBlocker(rows),
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    researchRefs: [
      "pmc_2024_casimir_mems_review",
      "physrevb_87_125413_roughness_mems_actuation",
      "arxiv_1207_4429_surface_potential_nanomebrane",
      "revmodphys_81_1827_real_material_casimir",
      "physrevapplied_15_034063_high_stress_sin",
      "apl_127_222202_high_stress_tin",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      supportFractionSweepOnly: true,
      idealScalarLoadIsNotMaterialEvidence: true,
      supportDriveTermsMustEnterFullTensor: true,
      internalLoadIsNotThrust: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2LayerStackSupportFractionSweep = (
  value: unknown,
): value is Nhm2LayerStackSupportFractionSweepV1 => {
  if (!isRecord(value)) return false;
  const scalarInputs = isRecord(value.scalarInputs) ? value.scalarInputs : null;
  const sweepConfig = isRecord(value.sweepConfig) ? value.sweepConfig : null;
  const rows = Array.isArray(value.rows) ? value.rows : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_LAYER_STACK_SUPPORT_FRACTION_SWEEP_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.mechanicalReceiptRef === "nhm2_layer_stack_mechanical_receipt/v1" &&
    scalarInputs != null &&
    typeof scalarInputs.tileAreaMeters2 === "number" &&
    typeof scalarInputs.stackForceN === "number" &&
    typeof scalarInputs.layerCount === "number" &&
    typeof scalarInputs.stackThicknessMeters === "number" &&
    sweepConfig != null &&
    Array.isArray(sweepConfig.supportFractions) &&
    Array.isArray(sweepConfig.materialPresets) &&
    typeof sweepConfig.safetyFactor === "number" &&
    typeof sweepConfig.materialCorrection === "number" &&
    typeof sweepConfig.layerScalingEfficiency === "number" &&
    typeof sweepConfig.minimumActiveFraction === "number" &&
    typeof sweepConfig.minimumSourceRetention === "number" &&
    typeof sweepConfig.supportDriveTensorTermsSupplied === "boolean" &&
    rows != null &&
    rows.length > 0 &&
    rows.every(
      (row) =>
        isRecord(row) &&
        typeof row.rowId === "string" &&
        typeof row.supportFraction === "number" &&
        typeof row.activeFraction === "number" &&
        typeof row.materialPresetId === "string" &&
        typeof row.allowableStressPa === "number" &&
        typeof row.safetyFactor === "number" &&
        typeof row.designStressLimitPa === "number" &&
        typeof row.materialCorrection === "number" &&
        typeof row.layerScalingEfficiency === "number" &&
        typeof row.sourceRetention === "number" &&
        typeof row.retainedWallT00Fraction === "number" &&
        typeof row.supportStressPa === "number" &&
        typeof row.supportStressMPa === "number" &&
        isStatus(row.stressStatus) &&
        isStatus(row.activeAreaStatus) &&
        isStatus(row.sourceRetentionStatus) &&
        isStatus(row.tensorContaminationStatus) &&
        isGoNoGoStatus(row.goNoGoStatus) &&
        Array.isArray(row.blockers) &&
        row.blockers.every((entry) => typeof entry === "string"),
    ) &&
    summary != null &&
    summary.rowCount === rows.length &&
    Array.isArray(summary.bestCandidateRows) &&
    (summary.minimumSupportFractionForStress === null ||
      typeof summary.minimumSupportFractionForStress === "number") &&
    (summary.maximumSupportFractionForSourceRetention === null ||
      typeof summary.maximumSupportFractionForSourceRetention === "number") &&
    typeof summary.feasibleWindowExists === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    Array.isArray(value.researchRefs) &&
    value.researchRefs.length > 0 &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.supportFractionSweepOnly === true &&
    boundary.idealScalarLoadIsNotMaterialEvidence === true &&
    boundary.supportDriveTermsMustEnterFullTensor === true &&
    boundary.internalLoadIsNotThrust === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
