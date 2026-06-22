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

export type Nhm2RoughnessPatchTestPlanItemV1 = {
  testId: Nhm2RoughnessPatchTestId;
  status: Nhm2RoughnessPatchTestStatus;
  blockerIds: string[];
  requiredMeasurement: string;
  acceptanceCriterion: string;
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
    asperityMaxMeters: 4e-9;
    patchVoltageRmsMaxVolts: 0.01;
    residualElectrostaticForceFractionMax: 0.05;
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2RoughnessPatchTestPlanItemV1[];
  summary: {
    roughnessPatchReceiptStatus: "pass" | "review" | "fail" | "missing";
    nextRequiredTestId: Nhm2RoughnessPatchTestId | "none";
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

const TEST_POLICY: Record<
  Nhm2RoughnessPatchTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    artifactToProduce: string;
  }
> = {
  roughness_patch_provenance: {
    blockers: [
      "roughness_asperity_tail_and_patch_potential_map_missing",
      "roughness_patch_tier_not_measured_or_validated",
    ],
    requiredMeasurement:
      "Measured or validated-simulation roughness, asperity-tail, patch-voltage, and residual electrostatic map with provenance.",
    acceptanceCriterion: "Evidence tier is measured or validated_simulation, not declared_model or missing.",
    artifactToProduce: "receipt://roughness_patch_metrology/provenance_v1",
  },
  roughness_rms: {
    blockers: ["roughness_rms_above_0p1nm_or_missing"],
    requiredMeasurement: "RMS roughness metrology for the 8 nm operating-gap surfaces.",
    acceptanceCriterion: "RMS roughness is supplied and no greater than 0.1 nm.",
    artifactToProduce: "receipt://roughness_patch_metrology/roughness_rms_v1",
  },
  asperity_p99: {
    blockers: ["asperity_p99_missing"],
    requiredMeasurement: "Asperity p99 map for the 8 nm operating-gap surfaces.",
    acceptanceCriterion: "Asperity p99 is supplied with surface-map provenance.",
    artifactToProduce: "receipt://roughness_patch_metrology/asperity_p99_v1",
  },
  asperity_tail: {
    blockers: ["asperity_tail_margin_missing", "asperity_tail_exceeds_half_gap"],
    requiredMeasurement: "Maximum asperity-tail map for the 8 nm operating-gap surfaces.",
    acceptanceCriterion: "Maximum asperity remains below half the 8 nm gap.",
    artifactToProduce: "receipt://roughness_patch_metrology/asperity_tail_v1",
  },
  patch_voltage_rms: {
    blockers: ["patch_voltage_rms_above_10mv_or_missing"],
    requiredMeasurement: "Patch-voltage RMS map for the selected material stack.",
    acceptanceCriterion: "Patch voltage RMS is supplied and no greater than 10 mV.",
    artifactToProduce: "receipt://roughness_patch_metrology/patch_voltage_rms_v1",
  },
  residual_electrostatic_force: {
    blockers: ["residual_electrostatic_force_correction_above_5pct_or_missing"],
    requiredMeasurement: "Residual electrostatic force correction after roughness and patch treatment.",
    acceptanceCriterion: "Residual electrostatic force fraction is supplied and no greater than 5%.",
    artifactToProduce: "receipt://roughness_patch_metrology/residual_electrostatic_force_v1",
  },
  roughness_patch_correction: {
    blockers: ["roughness_patch_correction_ref_missing"],
    requiredMeasurement: "Correction model tying roughness and patch potentials into the source tensor budget.",
    acceptanceCriterion: "Roughness/patch correction reference is present.",
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
      requiredMeasurement: policy.requiredMeasurement,
      acceptanceCriterion: policy.acceptanceCriterion,
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
      operatingGapMeters: 8e-9,
      roughnessRmsMaxMeters: 1e-10,
      asperityMaxMeters: 4e-9,
      patchVoltageRmsMaxVolts: 0.01,
      residualElectrostaticForceFractionMax: 0.05,
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      roughnessPatchReceiptStatus: surface.status,
      nextRequiredTestId: nextItem?.testId ?? "none",
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
        typeof item.requiredMeasurement === "string" &&
        typeof item.acceptanceCriterion === "string" &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.roughnessPatchReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
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
