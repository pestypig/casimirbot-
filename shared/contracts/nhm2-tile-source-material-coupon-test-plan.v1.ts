import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_MATERIAL_COUPON_TEST_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_material_coupon_test_plan/v1";

export type Nhm2MaterialCouponTestId =
  | "coupon_provenance"
  | "candidate_material_identity"
  | "tensile_stress"
  | "fracture_yield_margin"
  | "cryogenic_state"
  | "dielectric_response"
  | "conductivity"
  | "roughness_metrology"
  | "fabrication_tolerance";

export type Nhm2MaterialCouponTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2MaterialCouponTestPlanItemV1 = {
  testId: Nhm2MaterialCouponTestId;
  status: Nhm2MaterialCouponTestStatus;
  blockerIds: string[];
  requiredMeasurement: string;
  acceptanceCriterion: string;
  artifactToProduce: string;
};

export type Nhm2TileSourceMaterialCouponTestPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_MATERIAL_COUPON_TEST_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
  };
  couponTarget: {
    material: "ultra_high_stress_tin";
    layerCount: 447;
    operatingTemperatureK: 4;
    supportStressPa: number;
    materialSafetyFactor: 2;
    requiredFractureOrYieldStressPa: number;
    roughnessRmsMaxMeters: 1e-10;
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2MaterialCouponTestPlanItemV1[];
  summary: {
    materialCouponReceiptStatus: "pass" | "review" | "fail" | "missing";
    nextRequiredTestId: Nhm2MaterialCouponTestId | "none";
    openTestCount: number;
    falsifyingTestCount: number;
    satisfiedTestCount: number;
    couponEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    couponPlanOnly: true;
    planDoesNotSupplyEvidence: true;
    measuredCouponIsNotFullApparatusTensor: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceMaterialCouponTestPlanInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  materialEvidenceReceiptsRef?: string | null;
};

const SUPPORT_STRESS_PA = 5.45707087858e8;
const MATERIAL_SAFETY_FACTOR = 2;

const TEST_POLICY: Record<
  Nhm2MaterialCouponTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    artifactToProduce: string;
  }
> = {
  coupon_provenance: {
    blockers: ["material_coupon_receipt_missing", "material_coupon_tier_not_measured_or_validated"],
    requiredMeasurement:
      "Measured or validated-simulation coupon receipt with apparatus, specimen, temperature, and data provenance.",
    acceptanceCriterion: "Evidence tier is measured or validated_simulation, not declared_model or missing.",
    artifactToProduce: "receipt://material_coupon/provenance_v1",
  },
  candidate_material_identity: {
    blockers: ["candidate_material_mismatch"],
    requiredMeasurement: "Material identity receipt for the selected ultra-high-stress TiN candidate stack.",
    acceptanceCriterion: "Coupon material is ultra_high_stress_tin.",
    artifactToProduce: "receipt://material_coupon/tin_identity_v1",
  },
  tensile_stress: {
    blockers: ["measured_tensile_stress_missing"],
    requiredMeasurement: "Cryogenic thin-film tensile stress curve for the coupon stack.",
    acceptanceCriterion: "Measured tensile stress is supplied and finite at the 4 K operating state.",
    artifactToProduce: "receipt://material_coupon/tensile_stress_4k_v1",
  },
  fracture_yield_margin: {
    blockers: [
      "fracture_or_yield_margin_missing",
      "fracture_or_yield_margin_below_2x_support_stress",
    ],
    requiredMeasurement: "Fracture or yield stress measurement for the coupon stack.",
    acceptanceCriterion: "Fracture/yield stress is at least 2x the selected support stress.",
    artifactToProduce: "receipt://material_coupon/fracture_yield_margin_v1",
  },
  cryogenic_state: {
    blockers: ["cryogenic_4k_coupon_receipt_missing"],
    requiredMeasurement: "Cryogenic material-state receipt at or below 4 K.",
    acceptanceCriterion: "Coupon behavior is characterized at the 4 K operating state.",
    artifactToProduce: "receipt://material_coupon/cryogenic_4k_state_v1",
  },
  dielectric_response: {
    blockers: ["dielectric_response_ref_missing"],
    requiredMeasurement: "Dielectric response reference for the selected TiN stack.",
    acceptanceCriterion: "Dielectric response reference is present and traceable to the coupon material.",
    artifactToProduce: "receipt://material_coupon/dielectric_response_v1",
  },
  conductivity: {
    blockers: ["conductivity_ref_missing"],
    requiredMeasurement: "Conductivity reference for the selected TiN stack.",
    acceptanceCriterion: "Conductivity reference is present and traceable to the coupon material.",
    artifactToProduce: "receipt://material_coupon/conductivity_v1",
  },
  roughness_metrology: {
    blockers: ["coupon_roughness_rms_above_0p1nm_or_missing"],
    requiredMeasurement: "Coupon roughness RMS metrology.",
    acceptanceCriterion: "RMS roughness is supplied and no greater than 0.1 nm.",
    artifactToProduce: "receipt://material_coupon/roughness_rms_v1",
  },
  fabrication_tolerance: {
    blockers: ["fabrication_tolerance_receipt_missing"],
    requiredMeasurement: "Fabrication tolerance receipt for the coupon and layer stack.",
    acceptanceCriterion: "Fabrication tolerance is supplied for the 8 nm operating-gap stack.",
    artifactToProduce: "receipt://material_coupon/fabrication_tolerance_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const materialCouponSurface = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const surface = receipts.receiptSurfaces.find((entry) => entry.surfaceId === "material_coupon");
  if (surface == null) {
    throw new Error("material_coupon surface missing from nhm2 material evidence receipts");
  }
  return surface;
};

const itemStatus = (
  surface: Nhm2TileSourceReceiptSurfaceStatusV1,
  blockers: string[],
): Nhm2MaterialCouponTestStatus => {
  if (!blockers.some((blocker) => surface.blockers.includes(blocker))) return "satisfied";
  return surface.status === "fail" ? "falsifying" : "open";
};

export const buildNhm2TileSourceMaterialCouponTestPlan = (
  input: BuildNhm2TileSourceMaterialCouponTestPlanInput,
): Nhm2TileSourceMaterialCouponTestPlanV1 => {
  const receipts = input.materialEvidenceReceipts;
  const surface = materialCouponSurface(receipts);
  const testItems = (Object.keys(TEST_POLICY) as Nhm2MaterialCouponTestId[]).map((testId) => {
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
  const supportStressPa =
    surface.numericalMargins.requiredStressPa == null
      ? SUPPORT_STRESS_PA
      : surface.numericalMargins.requiredStressPa / MATERIAL_SAFETY_FACTOR;
  return {
    contractVersion: NHM2_TILE_SOURCE_MATERIAL_COUPON_TEST_PLAN_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    couponTarget: {
      material: "ultra_high_stress_tin",
      layerCount: 447,
      operatingTemperatureK: 4,
      supportStressPa,
      materialSafetyFactor: MATERIAL_SAFETY_FACTOR,
      requiredFractureOrYieldStressPa: supportStressPa * MATERIAL_SAFETY_FACTOR,
      roughnessRmsMaxMeters: 1e-10,
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      materialCouponReceiptStatus: surface.status,
      nextRequiredTestId: nextItem?.testId ?? "none",
      openTestCount: openItems.length,
      falsifyingTestCount: falsifyingItems.length,
      satisfiedTestCount: satisfiedItems.length,
      couponEvidenceReady: surface.status === "pass",
      falsifiesCurrentCandidate: surface.status === "fail",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      couponPlanOnly: true,
      planDoesNotSupplyEvidence: true,
      measuredCouponIsNotFullApparatusTensor: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceMaterialCouponTestPlan = (
  value: unknown,
): value is Nhm2TileSourceMaterialCouponTestPlanV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.couponTarget) ? value.couponTarget : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_MATERIAL_COUPON_TEST_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    target.material === "ultra_high_stress_tin" &&
    target.layerCount === 447 &&
    target.operatingTemperatureK === 4 &&
    typeof target.supportStressPa === "number" &&
    target.materialSafetyFactor === 2 &&
    typeof target.requiredFractureOrYieldStressPa === "number" &&
    target.roughnessRmsMaxMeters === 1e-10 &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 9 &&
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
    typeof summary.materialCouponReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
    typeof summary.openTestCount === "number" &&
    typeof summary.falsifyingTestCount === "number" &&
    typeof summary.satisfiedTestCount === "number" &&
    typeof summary.couponEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.couponPlanOnly === true &&
    boundary.planDoesNotSupplyEvidence === true &&
    boundary.measuredCouponIsNotFullApparatusTensor === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
