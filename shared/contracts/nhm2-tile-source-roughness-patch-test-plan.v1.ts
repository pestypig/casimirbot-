import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_ROUGHNESS_PATCH_TEST_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_roughness_patch_test_plan/v1";

export type Nhm2RoughnessPatchTestId =
  | "roughness_patch_provenance"
  | "roughness_rms"
  | "asperity_p99"
  | "asperity_tail"
  | "patch_voltage_rms"
  | "residual_electrostatic_force"
  | "roughness_patch_correction";

export type Nhm2RoughnessPatchTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2RoughnessPatchBlockedCampaignDomain =
  | "force_gap_pull_in"
  | "active_control_energy_noise_heat_timing"
  | "fatigue_layer_scaling"
  | "full_apparatus_tensor"
  | "material_credibility_gate"
  | "covariant_conservation";

export type Nhm2RoughnessPatchTargetValue = string | number | boolean | null;

export type Nhm2RoughnessPatchTestPlanItemV1 = {
  testId: Nhm2RoughnessPatchTestId;
  status: Nhm2RoughnessPatchTestStatus;
  blockerIds: string[];
  measurementTargets: Record<string, Nhm2RoughnessPatchTargetValue>;
  requiredMeasurement: string;
  acceptanceCriterion: string;
  falsificationRule: string;
  blocksCampaignDomains: Nhm2RoughnessPatchBlockedCampaignDomain[];
  artifactToProduce: string;
};

export type Nhm2TileSourceRoughnessPatchTestPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_ROUGHNESS_PATCH_TEST_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
  };
  roughnessPatchTarget: {
    operatingGapMeters: 8e-9;
    roughnessRmsMaxMeters: 1e-10;
    roughnessMapLateralResolutionMaxMeters: 5e-10;
    roughnessScanAreaFractionMin: 0.95;
    asperityP99MaxMeters: 2e-9;
    asperityP999MaxMeters: 3e-9;
    asperityMaxMeters: 4e-9;
    patchVoltageRmsMaxVolts: 0.01;
    residualElectrostaticForceFractionMax: 0.05;
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2RoughnessPatchTestPlanItemV1[];
  summary: {
    roughnessPatchReceiptStatus: "pass" | "review" | "fail" | "missing";
    nextRequiredTestId: Nhm2RoughnessPatchTestId | "none";
    nextRequiredArtifactToProduce: string | null;
    nextRequiredFalsificationRule: string | null;
    nextBlockedCampaignDomains: Nhm2RoughnessPatchBlockedCampaignDomain[];
    openTestCount: number;
    falsifyingTestCount: number;
    satisfiedTestCount: number;
    roughnessRmsMeters: number | null;
    asperityMaxMargin: number | null;
    patchVoltageRmsVolts: number | null;
    residualElectrostaticForceFraction: number | null;
    roughnessPatchEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    roughnessPatchPlanOnly: true;
    planDoesNotSupplyEvidence: true;
    roughnessPatchPassIsNotFullApparatusTensor: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceRoughnessPatchTestPlanInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  materialEvidenceReceiptsRef?: string | null;
};

const OPERATING_GAP_METERS = 8e-9;
const ROUGHNESS_RMS_MAX_METERS = 1e-10;
const ROUGHNESS_MAP_LATERAL_RESOLUTION_MAX_METERS = 5e-10;
const ROUGHNESS_SCAN_AREA_FRACTION_MIN = 0.95;
const ASPERITY_P99_MAX_METERS = 2e-9;
const ASPERITY_P999_MAX_METERS = 3e-9;
const ASPERITY_MAX_METERS = 4e-9;
const PATCH_VOLTAGE_RMS_MAX_VOLTS = 0.01;
const PATCH_VOLTAGE_CORRELATION_LENGTH_POSITIVE = true;
const RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX = 0.05;
const RESIDUAL_ELECTROSTATIC_FORCE_MAX_N = 709.419214214;

const DEFAULT_BLOCKED_DOMAINS: Nhm2RoughnessPatchBlockedCampaignDomain[] = [
  "force_gap_pull_in",
  "active_control_energy_noise_heat_timing",
  "full_apparatus_tensor",
  "material_credibility_gate",
  "covariant_conservation",
];

const TEST_POLICY: Record<
  Nhm2RoughnessPatchTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    falsificationRule: string;
    blocksCampaignDomains: Nhm2RoughnessPatchBlockedCampaignDomain[];
    artifactToProduce: string;
  }
> = {
  roughness_patch_provenance: {
    blockers: [
      "roughness_asperity_tail_and_patch_potential_map_missing",
      "roughness_patch_tier_not_measured_or_validated",
      "roughness_gap_metrology_ref_missing",
      "roughness_surface_pairing_ref_missing",
      "roughness_map_ref_missing",
      "asperity_tail_distribution_ref_missing",
      "asperity_tail_fit_ref_missing",
      "patch_voltage_map_ref_missing",
      "patch_voltage_calibration_ref_missing",
      "residual_electrostatic_model_ref_missing",
    ],
    requiredMeasurement:
      "Measured or validated-simulation paired-surface 8 nm gap metrology, roughness, asperity-tail, patch-voltage, and residual electrostatic maps with provenance.",
    acceptanceCriterion: "Evidence tier is measured or validated_simulation, not declared_model or missing.",
    falsificationRule:
      "If roughness/patch provenance cannot identify paired 8 nm surfaces, roughness maps, asperity-tail fits, patch-voltage maps, calibration, and residual electrostatic model refs, the candidate cannot enter force-gap correction or full-apparatus tensor evidence.",
    blocksCampaignDomains: DEFAULT_BLOCKED_DOMAINS,
    artifactToProduce: "receipt://roughness_patch_metrology/provenance_v1",
  },
  roughness_rms: {
    blockers: [
      "roughness_map_lateral_resolution_missing",
      "roughness_map_lateral_resolution_above_0p5nm",
      "roughness_scan_area_fraction_missing",
      "roughness_scan_area_fraction_below_0p95",
      "roughness_rms_above_0p1nm_or_missing",
    ],
    requiredMeasurement:
      "Registered RMS roughness metrology for the paired 8 nm operating-gap surfaces.",
    acceptanceCriterion:
      "Map lateral resolution is at most 0.5 nm, scan coverage is at least 95%, and RMS roughness is supplied and no greater than 0.1 nm.",
    falsificationRule:
      "If roughness RMS exceeds 0.1 nm, map lateral resolution exceeds 0.5 nm, or scan coverage is below 95%, the 8 nm surface front remains inadmissible until surface process or metrology changes.",
    blocksCampaignDomains: DEFAULT_BLOCKED_DOMAINS,
    artifactToProduce: "receipt://roughness_patch_metrology/roughness_rms_v1",
  },
  asperity_p99: {
    blockers: ["asperity_p99_missing", "asperity_p99_above_2nm"],
    requiredMeasurement: "Asperity p99 map for the 8 nm operating-gap surfaces.",
    acceptanceCriterion: "Asperity p99 is supplied with surface-map provenance and is no greater than 2 nm.",
    falsificationRule:
      "If p99 asperity height exceeds 2 nm, the candidate must revise polishing/coating/process control before preserving the 8 nm gap can be admitted.",
    blocksCampaignDomains: ["force_gap_pull_in", "full_apparatus_tensor", "material_credibility_gate"],
    artifactToProduce: "receipt://roughness_patch_metrology/asperity_p99_v1",
  },
  asperity_tail: {
    blockers: [
      "asperity_p999_missing",
      "asperity_p999_above_3nm",
      "asperity_tail_margin_missing",
      "asperity_tail_exceeds_half_gap",
    ],
    requiredMeasurement: "Maximum asperity-tail map for the 8 nm operating-gap surfaces.",
    acceptanceCriterion: "Asperity p999 is no greater than 3 nm and maximum asperity remains below half the 8 nm gap.",
    falsificationRule:
      "If asperity p999 exceeds 3 nm or the maximum asperity exceeds half the 8 nm gap, the current surface pair is a pull-in/stiction and gap-closure falsifier.",
    blocksCampaignDomains: ["force_gap_pull_in", "active_control_energy_noise_heat_timing", "full_apparatus_tensor", "material_credibility_gate"],
    artifactToProduce: "receipt://roughness_patch_metrology/asperity_tail_v1",
  },
  patch_voltage_rms: {
    blockers: [
      "patch_voltage_correlation_length_missing",
      "patch_voltage_rms_above_10mv_or_missing",
    ],
    requiredMeasurement: "Patch-voltage RMS map for the selected material stack.",
    acceptanceCriterion:
      "Patch voltage RMS is supplied and no greater than 10 mV with a correlation-length receipt.",
    falsificationRule:
      "If patch-voltage RMS exceeds 10 mV or lacks correlation-length provenance, electrostatic contamination cannot be bounded for the source tensor.",
    blocksCampaignDomains: ["force_gap_pull_in", "active_control_energy_noise_heat_timing", "full_apparatus_tensor", "material_credibility_gate", "covariant_conservation"],
    artifactToProduce: "receipt://roughness_patch_metrology/patch_voltage_rms_v1",
  },
  residual_electrostatic_force: {
    blockers: ["residual_electrostatic_force_correction_above_5pct_or_missing"],
    requiredMeasurement: "Residual electrostatic force correction after roughness and patch treatment.",
    acceptanceCriterion: "Residual electrostatic force fraction is supplied and no greater than 5%.",
    falsificationRule:
      "If residual electrostatic correction exceeds 5% of the frozen ideal stack load, patch/electrostatic terms dominate the material-source evidence and must enter full apparatus T_munu before admission.",
    blocksCampaignDomains: ["force_gap_pull_in", "active_control_energy_noise_heat_timing", "full_apparatus_tensor", "material_credibility_gate", "covariant_conservation"],
    artifactToProduce: "receipt://roughness_patch_metrology/residual_electrostatic_force_v1",
  },
  roughness_patch_correction: {
    blockers: ["roughness_patch_correction_ref_missing"],
    requiredMeasurement: "Correction model tying roughness and patch potentials into the source tensor budget.",
    acceptanceCriterion: "Roughness/patch correction reference is present.",
    falsificationRule:
      "If the roughness/patch correction model is missing, scalar surface measurements cannot be promoted into force-gap or full-apparatus tensor corrections.",
    blocksCampaignDomains: ["force_gap_pull_in", "full_apparatus_tensor", "material_credibility_gate", "covariant_conservation"],
    artifactToProduce: "receipt://roughness_patch_metrology/correction_model_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const roughnessPatchSurface = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const surface = receipts.receiptSurfaces.find((entry) => entry.surfaceId === "roughness_patch_metrology");
  if (surface == null) {
    throw new Error("roughness_patch_metrology surface missing from nhm2 material evidence receipts");
  }
  return surface;
};

const itemStatus = (
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  blockers: string[],
): Nhm2RoughnessPatchTestStatus => {
  if (!blockers.some((blocker) => surface.blockers.includes(blocker))) return "satisfied";
  return surface.status === "fail" ? "falsifying" : "open";
};

const measurementTargetsForTest = (
  testId: Nhm2RoughnessPatchTestId,
): Record<string, Nhm2RoughnessPatchTargetValue> => {
  switch (testId) {
    case "roughness_patch_provenance":
      return {
        requiredEvidenceTier: "measured_or_validated_simulation",
        requiredMapAndModelRefCount: 8,
        operatingGapMeters: OPERATING_GAP_METERS,
        pairedSurfaceRegistrationRequired: true,
      };
    case "roughness_rms":
      return {
        roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
        roughnessMapLateralResolutionMaxMeters: ROUGHNESS_MAP_LATERAL_RESOLUTION_MAX_METERS,
        roughnessScanAreaFractionMin: ROUGHNESS_SCAN_AREA_FRACTION_MIN,
        operatingGapMeters: OPERATING_GAP_METERS,
      };
    case "asperity_p99":
      return {
        asperityP99MaxMeters: ASPERITY_P99_MAX_METERS,
        operatingGapMeters: OPERATING_GAP_METERS,
      };
    case "asperity_tail":
      return {
        asperityP999MaxMeters: ASPERITY_P999_MAX_METERS,
        asperityMaxMeters: ASPERITY_MAX_METERS,
        minimumGapClearanceRequiredMeters: OPERATING_GAP_METERS - ASPERITY_MAX_METERS,
        operatingGapMeters: OPERATING_GAP_METERS,
      };
    case "patch_voltage_rms":
      return {
        patchVoltageRmsMaxVolts: PATCH_VOLTAGE_RMS_MAX_VOLTS,
        patchVoltageCorrelationLengthPositive: PATCH_VOLTAGE_CORRELATION_LENGTH_POSITIVE,
      };
    case "residual_electrostatic_force":
      return {
        residualElectrostaticForceFractionMax: RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
        residualElectrostaticForceMaxN: RESIDUAL_ELECTROSTATIC_FORCE_MAX_N,
      };
    case "roughness_patch_correction":
      return {
        correctionModelRefRequired: true,
        patchElectrostaticTermsMustEnterFullTensor: true,
      };
  }
};

export const buildNhm2TileSourceRoughnessPatchTestPlan = (
  input: BuildNhm2TileSourceRoughnessPatchTestPlanInput,
): Nhm2TileSourceRoughnessPatchTestPlanV1 => {
  const receipts = input.materialEvidenceReceipts;
  const surface = roughnessPatchSurface(receipts);
  const testItems = (Object.keys(TEST_POLICY) as Nhm2RoughnessPatchTestId[]).map((testId) => {
    const policy = TEST_POLICY[testId];
    const blockerIds = surface.blockers.filter((blocker) => policy.blockers.includes(blocker));
    return {
      testId,
      status: itemStatus(surface, policy.blockers),
      blockerIds,
      measurementTargets: measurementTargetsForTest(testId),
      requiredMeasurement: policy.requiredMeasurement,
      acceptanceCriterion: policy.acceptanceCriterion,
      falsificationRule: policy.falsificationRule,
      blocksCampaignDomains: policy.blocksCampaignDomains,
      artifactToProduce: policy.artifactToProduce,
    };
  });
  const openItems = testItems.filter((item) => item.status === "open");
  const falsifyingItems = testItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = testItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_ROUGHNESS_PATCH_TEST_PLAN_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    roughnessPatchTarget: {
      operatingGapMeters: OPERATING_GAP_METERS,
      roughnessRmsMaxMeters: ROUGHNESS_RMS_MAX_METERS,
      roughnessMapLateralResolutionMaxMeters: ROUGHNESS_MAP_LATERAL_RESOLUTION_MAX_METERS,
      roughnessScanAreaFractionMin: ROUGHNESS_SCAN_AREA_FRACTION_MIN,
      asperityP99MaxMeters: ASPERITY_P99_MAX_METERS,
      asperityP999MaxMeters: ASPERITY_P999_MAX_METERS,
      asperityMaxMeters: ASPERITY_MAX_METERS,
      patchVoltageRmsMaxVolts: PATCH_VOLTAGE_RMS_MAX_VOLTS,
      residualElectrostaticForceFractionMax: RESIDUAL_ELECTROSTATIC_FORCE_FRACTION_MAX,
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      roughnessPatchReceiptStatus: surface.status,
      nextRequiredTestId: nextItem?.testId ?? "none",
      nextRequiredArtifactToProduce: nextItem?.artifactToProduce ?? null,
      nextRequiredFalsificationRule: nextItem?.falsificationRule ?? null,
      nextBlockedCampaignDomains: nextItem?.blocksCampaignDomains ?? [],
      openTestCount: openItems.length,
      falsifyingTestCount: falsifyingItems.length,
      satisfiedTestCount: satisfiedItems.length,
      roughnessRmsMeters: surface.numericalMargins.roughnessRmsMeters ?? null,
      asperityMaxMargin: surface.numericalMargins.asperityMaxMargin ?? null,
      patchVoltageRmsVolts: surface.numericalMargins.patchVoltageRmsVolts ?? null,
      residualElectrostaticForceFraction:
        surface.numericalMargins.residualElectrostaticForceFraction ?? null,
      roughnessPatchEvidenceReady: surface.status === "pass",
      falsifiesCurrentCandidate: surface.status === "fail",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      roughnessPatchPlanOnly: true,
      planDoesNotSupplyEvidence: true,
      roughnessPatchPassIsNotFullApparatusTensor: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceRoughnessPatchTestPlan = (
  value: unknown,
): value is Nhm2TileSourceRoughnessPatchTestPlanV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.roughnessPatchTarget) ? value.roughnessPatchTarget : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_ROUGHNESS_PATCH_TEST_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    target.operatingGapMeters === 8e-9 &&
    target.roughnessRmsMaxMeters === 1e-10 &&
    target.roughnessMapLateralResolutionMaxMeters === 5e-10 &&
    target.roughnessScanAreaFractionMin === 0.95 &&
    target.asperityP99MaxMeters === 2e-9 &&
    target.asperityP999MaxMeters === 3e-9 &&
    target.asperityMaxMeters === 4e-9 &&
    target.patchVoltageRmsMaxVolts === 0.01 &&
    target.residualElectrostaticForceFractionMax === 0.05 &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 7 &&
    value.testItems.every(
      (item) =>
        isRecord(item) &&
        typeof item.testId === "string" &&
        ["satisfied", "open", "falsifying"].includes(String(item.status)) &&
        Array.isArray(item.blockerIds) &&
        isRecord(item.measurementTargets) &&
        Object.values(item.measurementTargets).every(
          (targetValue) =>
            targetValue === null ||
            typeof targetValue === "string" ||
            typeof targetValue === "number" ||
            typeof targetValue === "boolean",
        ) &&
        typeof item.requiredMeasurement === "string" &&
        typeof item.acceptanceCriterion === "string" &&
        typeof item.falsificationRule === "string" &&
        Array.isArray(item.blocksCampaignDomains) &&
        item.blocksCampaignDomains.every((domain) => typeof domain === "string") &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.roughnessPatchReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
    (summary.nextRequiredArtifactToProduce === null ||
      typeof summary.nextRequiredArtifactToProduce === "string") &&
    (summary.nextRequiredFalsificationRule === null ||
      typeof summary.nextRequiredFalsificationRule === "string") &&
    Array.isArray(summary.nextBlockedCampaignDomains) &&
    summary.nextBlockedCampaignDomains.every((domain) => typeof domain === "string") &&
    typeof summary.openTestCount === "number" &&
    typeof summary.falsifyingTestCount === "number" &&
    typeof summary.satisfiedTestCount === "number" &&
    (summary.roughnessRmsMeters === null || typeof summary.roughnessRmsMeters === "number") &&
    (summary.asperityMaxMargin === null || typeof summary.asperityMaxMargin === "number") &&
    (summary.patchVoltageRmsVolts === null || typeof summary.patchVoltageRmsVolts === "number") &&
    (summary.residualElectrostaticForceFraction === null ||
      typeof summary.residualElectrostaticForceFraction === "number") &&
    typeof summary.roughnessPatchEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.roughnessPatchPlanOnly === true &&
    boundary.planDoesNotSupplyEvidence === true &&
    boundary.roughnessPatchPassIsNotFullApparatusTensor === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
