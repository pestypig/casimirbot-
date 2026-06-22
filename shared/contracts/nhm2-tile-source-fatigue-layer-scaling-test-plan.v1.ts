import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptStatus,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";

export const NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_TEST_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_fatigue_layer_scaling_test_plan/v1";

export type Nhm2FatigueLayerScalingTestId =
  | "fatigue_scaling_provenance"
  | "cycle_count_to_failure"
  | "required_cycle_count"
  | "cycle_margin"
  | "thermal_cycle_drift"
  | "creep_drift"
  | "layer_scaling_efficiency"
  | "nonadditivity_fraction"
  | "active_area_retention"
  | "support_coupling";

export type Nhm2FatigueLayerScalingTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2FatigueLayerScalingTestPlanItemV1 = {
  testId: Nhm2FatigueLayerScalingTestId;
  status: Nhm2FatigueLayerScalingTestStatus;
  blockerIds: string[];
  requiredMeasurement: string;
  acceptanceCriterion: string;
  artifactToProduce: string;
};

export type Nhm2TileSourceFatigueLayerScalingTestPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_TEST_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
  };
  fatigueLayerScalingTarget: {
    layerCount: 447;
    layerScalingEfficiencyMin: 0.9;
    layerNonadditivityFractionMax: 0.1;
    activeAreaRetentionMin: 0.6;
    thermalCycleDriftFractionMax: 0.01;
    creepDriftFractionMax: 0.01;
    supportCouplingStatusRequired: "pass";
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2FatigueLayerScalingTestPlanItemV1[];
  summary: {
    fatigueReceiptStatus: Nhm2TileSourceReceiptStatus;
    layerScalingReceiptStatus: Nhm2TileSourceReceiptStatus;
    combinedReceiptStatus: Nhm2TileSourceReceiptStatus;
    nextRequiredTestId: Nhm2FatigueLayerScalingTestId | "none";
    openTestCount: number;
    falsifyingTestCount: number;
    satisfiedTestCount: number;
    cycleMargin: number | null;
    thermalCycleDriftMargin: number | null;
    creepDriftMargin: number | null;
    scalingMargin: number | null;
    nonadditivityMargin: number | null;
    activeAreaMargin: number | null;
    fatigueLayerScalingEvidenceReady: boolean;
    falsifiesCurrentCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    fatigueLayerScalingPlanOnly: true;
    planDoesNotSupplyEvidence: true;
    fatigueLayerScalingPassIsNotFullApparatusTensor: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceFatigueLayerScalingTestPlanInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  materialEvidenceReceiptsRef?: string | null;
};

const TEST_POLICY: Record<
  Nhm2FatigueLayerScalingTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    artifactToProduce: string;
  }
> = {
  fatigue_scaling_provenance: {
    blockers: [
      "fatigue_lifetime_receipt_missing",
      "layer_scaling_nonadditivity_measurement_missing",
      "fatigue_layer_scaling_tier_not_measured_or_validated",
      "fatigue_cycle_protocol_ref_missing",
      "fatigue_curve_ref_missing",
      "thermal_cycle_ref_missing",
      "creep_drift_ref_missing",
      "layer_scaling_map_ref_missing",
      "layer_nonadditivity_model_ref_missing",
      "active_area_map_ref_missing",
      "support_coupling_map_ref_missing",
      "multiphysics_coupling_ref_missing",
    ],
    requiredMeasurement:
      "Measured or validated-simulation fatigue and layer-scaling receipt with cycle protocol, fatigue curve, thermal-cycle, creep/drift, layer map, nonadditivity model, support-coupling map, active-area map, and multiphysics coupling provenance.",
    acceptanceCriterion:
      "Evidence tier is measured or validated_simulation and all fatigue/layer-scaling provenance refs are present.",
    artifactToProduce: "receipt://fatigue_layer_scaling/provenance_v1",
  },
  cycle_count_to_failure: {
    blockers: ["fatigue_cycle_margin_missing", "fatigue_curve_ref_missing"],
    requiredMeasurement:
      "Cycle count to failure and fatigue curve for the selected 447-layer operating protocol.",
    acceptanceCriterion: "Finite cycle count to failure is supplied with fatigue-curve provenance.",
    artifactToProduce: "receipt://fatigue_layer_scaling/cycle_count_to_failure_v1",
  },
  required_cycle_count: {
    blockers: ["fatigue_cycle_margin_missing", "fatigue_cycle_protocol_ref_missing"],
    requiredMeasurement:
      "Required cycle count and cycle protocol for the selected campaign duty, switching cadence, and operating duration.",
    acceptanceCriterion: "Finite required cycle count is supplied with protocol provenance.",
    artifactToProduce: "receipt://fatigue_layer_scaling/required_cycle_count_v1",
  },
  cycle_margin: {
    blockers: ["fatigue_cycle_margin_missing", "fatigue_cycle_margin_below_required"],
    requiredMeasurement: "Fatigue margin from cycle count to failure divided by required cycle count.",
    acceptanceCriterion: "Fatigue cycle margin is at least 1.",
    artifactToProduce: "receipt://fatigue_layer_scaling/cycle_margin_v1",
  },
  thermal_cycle_drift: {
    blockers: [
      "thermal_cycle_drift_fraction_missing",
      "thermal_cycle_drift_above_0p01",
      "thermal_cycle_ref_missing",
    ],
    requiredMeasurement:
      "Thermal-cycle drift fraction for the selected 447-layer stack across the declared duty and temperature protocol.",
    acceptanceCriterion:
      "Thermal-cycle drift fraction is finite, positive, no greater than 0.01, and traceable to thermal-cycle evidence.",
    artifactToProduce: "receipt://fatigue_layer_scaling/thermal_cycle_drift_v1",
  },
  creep_drift: {
    blockers: [
      "creep_drift_fraction_missing",
      "creep_drift_above_0p01",
      "creep_drift_ref_missing",
    ],
    requiredMeasurement:
      "Creep/drift fraction for the selected 447-layer stack under campaign stress, timing, and temperature conditions.",
    acceptanceCriterion:
      "Creep/drift fraction is finite, positive, no greater than 0.01, and traceable to creep/drift evidence.",
    artifactToProduce: "receipt://fatigue_layer_scaling/creep_drift_v1",
  },
  layer_scaling_efficiency: {
    blockers: [
      "layer_scaling_efficiency_missing",
      "layer_scaling_efficiency_below_0p9",
      "layer_scaling_map_ref_missing",
      "multiphysics_coupling_ref_missing",
    ],
    requiredMeasurement:
      "447-layer scaling efficiency map including mechanical and electromagnetic coupling losses.",
    acceptanceCriterion:
      "Layer scaling efficiency is at least 0.9 and traceable to a layer map plus multiphysics coupling receipt.",
    artifactToProduce: "receipt://fatigue_layer_scaling/scaling_efficiency_v1",
  },
  nonadditivity_fraction: {
    blockers: [
      "layer_nonadditivity_fraction_missing",
      "layer_nonadditivity_above_0p1",
      "layer_nonadditivity_model_ref_missing",
    ],
    requiredMeasurement: "Layer nonadditivity fraction for the 447-layer stack.",
    acceptanceCriterion: "Layer nonadditivity fraction is no greater than 0.1.",
    artifactToProduce: "receipt://fatigue_layer_scaling/nonadditivity_fraction_v1",
  },
  active_area_retention: {
    blockers: ["active_area_retention_missing", "active_area_retention_below_0p6", "active_area_map_ref_missing"],
    requiredMeasurement:
      "Active Casimir area map retained after supports, controls, routing, and layer spacing.",
    acceptanceCriterion: "Active-area retention is at least 0.6 and traceable to an active-area map.",
    artifactToProduce: "receipt://fatigue_layer_scaling/active_area_retention_v1",
  },
  support_coupling: {
    blockers: [
      "support_coupling_status_not_pass",
      "support_coupling_map_ref_missing",
      "multiphysics_coupling_ref_missing",
    ],
    requiredMeasurement:
      "Support-coupling map and multiphysics receipt for mechanical, thermal, and electromagnetic cross-coupling across layers.",
    acceptanceCriterion: "Support-coupling status is pass with map and multiphysics provenance.",
    artifactToProduce: "receipt://fatigue_layer_scaling/support_coupling_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const requiredSurface = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
  surfaceId: "fatigue_lifetime" | "layer_scaling",
): Nhm2TileSourceReceiptSurfaceStatusV1 => {
  const surface = receipts.receiptSurfaces.find((entry) => entry.surfaceId === surfaceId);
  if (surface == null) {
    throw new Error(`${surfaceId} surface missing from nhm2 material evidence receipts`);
  }
  return surface;
};

const combinedStatus = (
  fatigue: Nhm2TileSourceReceiptSurfaceStatusV1,
  scaling: Nhm2TileSourceReceiptSurfaceStatusV1,
): Nhm2TileSourceReceiptStatus => {
  if (fatigue.status === "fail" || scaling.status === "fail") return "fail";
  if (fatigue.status === "pass" && scaling.status === "pass") return "pass";
  if (fatigue.status === "missing" && scaling.status === "missing") return "missing";
  return "review";
};

const itemStatus = (
  surfaces: Nhm2TileSourceReceiptSurfaceStatusV1[],
  blockers: string[],
): Nhm2FatigueLayerScalingTestStatus => {
  const relevantSurfaces = surfaces.filter((surface) =>
    blockers.some((blocker) => surface.blockers.includes(blocker)),
  );
  if (relevantSurfaces.length === 0) return "satisfied";
  return relevantSurfaces.some((surface) => surface.status === "fail") ? "falsifying" : "open";
};

export const buildNhm2TileSourceFatigueLayerScalingTestPlan = (
  input: BuildNhm2TileSourceFatigueLayerScalingTestPlanInput,
): Nhm2TileSourceFatigueLayerScalingTestPlanV1 => {
  const receipts = input.materialEvidenceReceipts;
  const fatigue = requiredSurface(receipts, "fatigue_lifetime");
  const scaling = requiredSurface(receipts, "layer_scaling");
  const surfaces = [fatigue, scaling];
  const testItems = (Object.keys(TEST_POLICY) as Nhm2FatigueLayerScalingTestId[]).map(
    (testId) => {
      const policy = TEST_POLICY[testId];
      const blockerIds = surfaces.flatMap((surface) =>
        surface.blockers.filter((blocker) => policy.blockers.includes(blocker)),
      );
      return {
        testId,
        status: itemStatus(surfaces, policy.blockers),
        blockerIds,
        requiredMeasurement: policy.requiredMeasurement,
        acceptanceCriterion: policy.acceptanceCriterion,
        artifactToProduce: policy.artifactToProduce,
      };
    },
  );
  const openItems = testItems.filter((item) => item.status === "open");
  const falsifyingItems = testItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = testItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_TEST_PLAN_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
    },
    fatigueLayerScalingTarget: {
      layerCount: 447,
      layerScalingEfficiencyMin: 0.9,
      layerNonadditivityFractionMax: 0.1,
      activeAreaRetentionMin: 0.6,
      thermalCycleDriftFractionMax: 0.01,
      creepDriftFractionMax: 0.01,
      supportCouplingStatusRequired: "pass",
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      fatigueReceiptStatus: fatigue.status,
      layerScalingReceiptStatus: scaling.status,
      combinedReceiptStatus: combinedStatus(fatigue, scaling),
      nextRequiredTestId: nextItem?.testId ?? "none",
      openTestCount: openItems.length,
      falsifyingTestCount: falsifyingItems.length,
      satisfiedTestCount: satisfiedItems.length,
      cycleMargin: fatigue.numericalMargins.cycleMargin ?? null,
      thermalCycleDriftMargin:
        fatigue.numericalMargins.thermalCycleDriftMargin ?? null,
      creepDriftMargin: fatigue.numericalMargins.creepDriftMargin ?? null,
      scalingMargin: scaling.numericalMargins.scalingMargin ?? null,
      nonadditivityMargin: scaling.numericalMargins.nonadditivityMargin ?? null,
      activeAreaMargin: scaling.numericalMargins.activeAreaMargin ?? null,
      fatigueLayerScalingEvidenceReady: fatigue.status === "pass" && scaling.status === "pass",
      falsifiesCurrentCandidate: fatigue.status === "fail" || scaling.status === "fail",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      fatigueLayerScalingPlanOnly: true,
      planDoesNotSupplyEvidence: true,
      fatigueLayerScalingPassIsNotFullApparatusTensor: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceFatigueLayerScalingTestPlan = (
  value: unknown,
): value is Nhm2TileSourceFatigueLayerScalingTestPlanV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.fatigueLayerScalingTarget)
    ? value.fatigueLayerScalingTarget
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion ===
      NHM2_TILE_SOURCE_FATIGUE_LAYER_SCALING_TEST_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    target.layerCount === 447 &&
    target.layerScalingEfficiencyMin === 0.9 &&
    target.layerNonadditivityFractionMax === 0.1 &&
    target.activeAreaRetentionMin === 0.6 &&
    target.thermalCycleDriftFractionMax === 0.01 &&
    target.creepDriftFractionMax === 0.01 &&
    target.supportCouplingStatusRequired === "pass" &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 10 &&
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
    typeof summary.fatigueReceiptStatus === "string" &&
    typeof summary.layerScalingReceiptStatus === "string" &&
    typeof summary.combinedReceiptStatus === "string" &&
    typeof summary.nextRequiredTestId === "string" &&
    typeof summary.openTestCount === "number" &&
    typeof summary.falsifyingTestCount === "number" &&
    typeof summary.satisfiedTestCount === "number" &&
    (summary.cycleMargin === null || typeof summary.cycleMargin === "number") &&
    (summary.thermalCycleDriftMargin === null ||
      typeof summary.thermalCycleDriftMargin === "number") &&
    (summary.creepDriftMargin === null ||
      typeof summary.creepDriftMargin === "number") &&
    (summary.scalingMargin === null || typeof summary.scalingMargin === "number") &&
    (summary.nonadditivityMargin === null ||
      typeof summary.nonadditivityMargin === "number") &&
    (summary.activeAreaMargin === null || typeof summary.activeAreaMargin === "number") &&
    typeof summary.fatigueLayerScalingEvidenceReady === "boolean" &&
    typeof summary.falsifiesCurrentCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.fatigueLayerScalingPlanOnly === true &&
    boundary.planDoesNotSupplyEvidence === true &&
    boundary.fatigueLayerScalingPassIsNotFullApparatusTensor === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
