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
  | "delamination_and_adhesion"
  | "layer_scaling_efficiency"
  | "per_layer_variation"
  | "nonadditivity_fraction"
  | "active_area_retention"
  | "support_coupling"
  | "coupling_loss_budget"
  | "source_tensor_retention";

export type Nhm2FatigueLayerScalingTestStatus = "satisfied" | "open" | "falsifying";

export type Nhm2FatigueLayerScalingBlockedCampaignDomain =
  | "material_coupon_behavior"
  | "force_gap_pull_in"
  | "roughness_patch_potential"
  | "active_control_energy_noise_heat_timing"
  | "full_apparatus_tensor"
  | "material_credibility_gate"
  | "covariant_conservation"
  | "time_dependent_source_campaign";

export type Nhm2FatigueLayerScalingTargetValue = string | number | boolean | null;

export type Nhm2FatigueLayerScalingTestPlanItemV1 = {
  testId: Nhm2FatigueLayerScalingTestId;
  status: Nhm2FatigueLayerScalingTestStatus;
  blockerIds: string[];
  measurementTargets: Record<string, Nhm2FatigueLayerScalingTargetValue>;
  requiredMeasurement: string;
  acceptanceCriterion: string;
  falsificationRule: string;
  blocksCampaignDomains: Nhm2FatigueLayerScalingBlockedCampaignDomain[];
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
    perLayerVariationFractionMax: 0.05;
    layerNonadditivityFractionMax: 0.1;
    activeAreaRetentionMin: 0.6;
    supportCouplingFractionMax: 0.1;
    electromagneticCouplingFractionMax: 0.1;
    mechanicalCouplingFractionMax: 0.1;
    sourceTensorRetentionFractionMin: 0.9;
    thermalCycleDriftFractionMax: 0.01;
    creepDriftFractionMax: 0.01;
    delaminationMarginMin: 1;
    interlayerAdhesionMarginMin: 1;
    supportCouplingStatusRequired: "pass";
    evidenceTierRequired: "measured_or_validated_simulation";
  };
  testItems: Nhm2FatigueLayerScalingTestPlanItemV1[];
  summary: {
    fatigueReceiptStatus: Nhm2TileSourceReceiptStatus;
    layerScalingReceiptStatus: Nhm2TileSourceReceiptStatus;
    combinedReceiptStatus: Nhm2TileSourceReceiptStatus;
    nextRequiredTestId: Nhm2FatigueLayerScalingTestId | "none";
    nextRequiredArtifactToProduce: string | null;
    nextRequiredFalsificationRule: string | null;
    nextBlockedCampaignDomains: Nhm2FatigueLayerScalingBlockedCampaignDomain[];
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

const LAYER_COUNT = 447;
const CYCLE_MARGIN_MIN = 1;
const LAYER_SCALING_EFFICIENCY_MIN = 0.9;
const PER_LAYER_VARIATION_FRACTION_MAX = 0.05;
const LAYER_NONADDITIVITY_FRACTION_MAX = 0.1;
const ACTIVE_AREA_RETENTION_MIN = 0.6;
const SUPPORT_COUPLING_FRACTION_MAX = 0.1;
const ELECTROMAGNETIC_COUPLING_FRACTION_MAX = 0.1;
const MECHANICAL_COUPLING_FRACTION_MAX = 0.1;
const SOURCE_TENSOR_RETENTION_FRACTION_MIN = 0.9;
const THERMAL_CYCLE_DRIFT_FRACTION_MAX = 0.01;
const CREEP_DRIFT_FRACTION_MAX = 0.01;
const DELAMINATION_MARGIN_MIN = 1;
const INTERLAYER_ADHESION_MARGIN_MIN = 1;
const REQUIRED_FATIGUE_PROVENANCE_REF_COUNT = 8;
const REQUIRED_LAYER_SCALING_PROVENANCE_REF_COUNT = 9;
const EFFECTIVE_ACTIVE_LAYER_COUNT_MIN =
  LAYER_COUNT *
  LAYER_SCALING_EFFICIENCY_MIN *
  (1 - LAYER_NONADDITIVITY_FRACTION_MAX) *
  ACTIVE_AREA_RETENTION_MIN;
const EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN =
  LAYER_COUNT * SOURCE_TENSOR_RETENTION_FRACTION_MIN;

const DEFAULT_BLOCKED_DOMAINS: Nhm2FatigueLayerScalingBlockedCampaignDomain[] = [
  "material_coupon_behavior",
  "force_gap_pull_in",
  "roughness_patch_potential",
  "active_control_energy_noise_heat_timing",
  "full_apparatus_tensor",
  "material_credibility_gate",
  "covariant_conservation",
  "time_dependent_source_campaign",
];

const TEST_POLICY: Record<
  Nhm2FatigueLayerScalingTestId,
  {
    blockers: string[];
    requiredMeasurement: string;
    acceptanceCriterion: string;
    falsificationRule: string;
    blocksCampaignDomains: Nhm2FatigueLayerScalingBlockedCampaignDomain[];
    artifactToProduce: string;
  }
> = {
  fatigue_scaling_provenance: {
    blockers: [
      "fatigue_lifetime_receipt_missing",
      "layer_scaling_nonadditivity_measurement_missing",
      "fatigue_layer_scaling_tier_not_measured_or_validated",
      "fatigue_load_spectrum_ref_missing",
      "fatigue_cycle_protocol_ref_missing",
      "cryogenic_fatigue_ref_missing",
      "fatigue_curve_ref_missing",
      "thermal_cycle_ref_missing",
      "creep_drift_ref_missing",
      "delamination_protocol_ref_missing",
      "interlayer_adhesion_ref_missing",
      "layer_scaling_map_ref_missing",
      "per_layer_variation_map_ref_missing",
      "layer_nonadditivity_model_ref_missing",
      "active_area_map_ref_missing",
      "support_coupling_map_ref_missing",
      "electromagnetic_coupling_map_ref_missing",
      "mechanical_coupling_map_ref_missing",
      "multiphysics_coupling_ref_missing",
      "source_tensor_retention_map_ref_missing",
    ],
    requiredMeasurement:
      "Measured or validated-simulation fatigue and layer-scaling receipt with load spectrum, cryogenic fatigue, cycle protocol, fatigue curve, thermal-cycle, creep/drift, delamination, adhesion, layer map, variation map, nonadditivity, support/electromagnetic/mechanical coupling, active-area, source-retention, and multiphysics provenance.",
    acceptanceCriterion:
      "Evidence tier is measured or validated_simulation and all fatigue/layer-scaling provenance refs are present.",
    falsificationRule:
      "If fatigue and layer-scaling provenance cannot identify load spectrum, cycle protocol, cryogenic fatigue, drift, delamination, adhesion, layer maps, coupling maps, active-area maps, and source-retention maps, the 447-layer candidate cannot enter material credibility or full-apparatus tensor evidence.",
    blocksCampaignDomains: DEFAULT_BLOCKED_DOMAINS,
    artifactToProduce: "receipt://fatigue_layer_scaling/provenance_v1",
  },
  cycle_count_to_failure: {
    blockers: ["fatigue_cycle_margin_missing", "fatigue_curve_ref_missing"],
    requiredMeasurement:
      "Cycle count to failure and fatigue curve for the selected 447-layer operating protocol.",
    acceptanceCriterion: "Finite cycle count to failure is supplied with fatigue-curve provenance.",
    falsificationRule:
      "If cycle count to failure is missing or non-finite, the campaign cannot establish whether the 447-layer stack survives the required switching/cycling protocol.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://fatigue_layer_scaling/cycle_count_to_failure_v1",
  },
  required_cycle_count: {
    blockers: ["fatigue_cycle_margin_missing", "fatigue_cycle_protocol_ref_missing"],
    requiredMeasurement:
      "Required cycle count and cycle protocol for the selected campaign duty, switching cadence, and operating duration.",
    acceptanceCriterion: "Finite required cycle count is supplied with protocol provenance.",
    falsificationRule:
      "If required cycle count or cycle protocol is missing, fatigue margin cannot be admitted and the time-dependent campaign remains unbounded.",
    blocksCampaignDomains: ["active_control_energy_noise_heat_timing", "full_apparatus_tensor", "material_credibility_gate", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://fatigue_layer_scaling/required_cycle_count_v1",
  },
  cycle_margin: {
    blockers: ["fatigue_cycle_margin_missing", "fatigue_cycle_margin_below_required"],
    requiredMeasurement: "Fatigue margin from cycle count to failure divided by required cycle count.",
    acceptanceCriterion: "Fatigue cycle margin is at least 1.",
    falsificationRule:
      "If cycle count to failure divided by required cycle count is below 1, the frozen 447-layer candidate is fatigue-falsified unless the load spectrum, duty, material, or stack architecture changes.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "time_dependent_source_campaign"],
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
    falsificationRule:
      "If thermal-cycle drift exceeds 1% or lacks thermal-cycle provenance, layer registration and source tensor retention remain inadmissible.",
    blocksCampaignDomains: ["roughness_patch_potential", "full_apparatus_tensor", "material_credibility_gate", "time_dependent_source_campaign"],
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
    falsificationRule:
      "If creep/drift exceeds 1% or lacks provenance, the stack cannot preserve the 8 nm operating geometry through the campaign.",
    blocksCampaignDomains: ["force_gap_pull_in", "roughness_patch_potential", "full_apparatus_tensor", "material_credibility_gate"],
    artifactToProduce: "receipt://fatigue_layer_scaling/creep_drift_v1",
  },
  delamination_and_adhesion: {
    blockers: [
      "delamination_margin_missing",
      "delamination_margin_below_one",
      "delamination_protocol_ref_missing",
      "interlayer_adhesion_margin_missing",
      "interlayer_adhesion_margin_below_one",
      "interlayer_adhesion_ref_missing",
    ],
    requiredMeasurement:
      "Delamination and interlayer adhesion margins for the 447-layer stack under cryogenic cycling and campaign load spectrum.",
    acceptanceCriterion:
      "Delamination and interlayer adhesion margins are both at least 1 with protocol provenance.",
    falsificationRule:
      "If delamination or interlayer adhesion margin is below 1, the multilayer stack is mechanically falsified unless interface process, supports, or load path changes.",
    blocksCampaignDomains: ["force_gap_pull_in", "active_control_energy_noise_heat_timing", "full_apparatus_tensor", "material_credibility_gate"],
    artifactToProduce: "receipt://fatigue_layer_scaling/delamination_adhesion_margin_v1",
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
    falsificationRule:
      "If 447-layer scaling efficiency is below 0.9 or lacks map/provenance, the layer-count amplification cannot be admitted as a source tensor input.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://fatigue_layer_scaling/scaling_efficiency_v1",
  },
  per_layer_variation: {
    blockers: [
      "per_layer_variation_fraction_missing",
      "per_layer_variation_above_0p05",
      "per_layer_variation_map_ref_missing",
    ],
    requiredMeasurement:
      "Per-layer source variation map for the 447-layer stack.",
    acceptanceCriterion:
      "Per-layer variation fraction is finite and no greater than 0.05 with map provenance.",
    falsificationRule:
      "If per-layer variation exceeds 5% or lacks a variation map, regional source uniformity and tensor aggregation remain inadmissible.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation"],
    artifactToProduce: "receipt://fatigue_layer_scaling/per_layer_variation_v1",
  },
  nonadditivity_fraction: {
    blockers: [
      "layer_nonadditivity_fraction_missing",
      "layer_nonadditivity_above_0p1",
      "layer_nonadditivity_model_ref_missing",
    ],
    requiredMeasurement: "Layer nonadditivity fraction for the 447-layer stack.",
    acceptanceCriterion: "Layer nonadditivity fraction is no greater than 0.1.",
    falsificationRule:
      "If layer nonadditivity exceeds 10% or lacks a model receipt, simple layer-count multiplication is inadmissible for source closure.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation"],
    artifactToProduce: "receipt://fatigue_layer_scaling/nonadditivity_fraction_v1",
  },
  active_area_retention: {
    blockers: ["active_area_retention_missing", "active_area_retention_below_0p6", "active_area_map_ref_missing"],
    requiredMeasurement:
      "Active Casimir area map retained after supports, controls, routing, and layer spacing.",
    acceptanceCriterion: "Active-area retention is at least 0.6 and traceable to an active-area map.",
    falsificationRule:
      "If active-area retention is below 0.6 or lacks an active-area map, supports/controls consume too much source area for the frozen candidate.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation"],
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
    falsificationRule:
      "If support coupling status is not pass or lacks map/multiphysics provenance, support/control coupling must be modeled as a blocker in the full apparatus tensor.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://fatigue_layer_scaling/support_coupling_v1",
  },
  coupling_loss_budget: {
    blockers: [
      "support_coupling_fraction_missing",
      "support_coupling_fraction_above_0p1",
      "electromagnetic_coupling_fraction_missing",
      "electromagnetic_coupling_fraction_above_0p1",
      "mechanical_coupling_fraction_missing",
      "mechanical_coupling_fraction_above_0p1",
      "electromagnetic_coupling_map_ref_missing",
      "mechanical_coupling_map_ref_missing",
      "multiphysics_coupling_ref_missing",
    ],
    requiredMeasurement:
      "Support, electromagnetic, and mechanical coupling-loss budget across the 447-layer stack.",
    acceptanceCriterion:
      "Each coupling-loss fraction is finite and no greater than 0.1 with map and multiphysics provenance.",
    falsificationRule:
      "If support, electromagnetic, or mechanical coupling loss exceeds 10% or lacks maps, cross-layer nonadditivity cannot be treated as bounded.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://fatigue_layer_scaling/coupling_loss_budget_v1",
  },
  source_tensor_retention: {
    blockers: [
      "source_tensor_retention_fraction_missing",
      "source_tensor_retention_below_0p9",
      "source_tensor_retention_map_ref_missing",
    ],
    requiredMeasurement:
      "Source tensor retention fraction after fatigue damage, active-area loss, layer variation, nonadditivity, and coupling cross-terms.",
    acceptanceCriterion:
      "Source tensor retention fraction is at least 0.9 and traceable to a source-retention map.",
    falsificationRule:
      "If source tensor retention is below 0.9 or lacks a retention map, the 447-layer stack cannot be admitted as preserving the source-side tensor target.",
    blocksCampaignDomains: ["full_apparatus_tensor", "material_credibility_gate", "covariant_conservation", "time_dependent_source_campaign"],
    artifactToProduce: "receipt://fatigue_layer_scaling/source_tensor_retention_v1",
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

const measurementTargetsForTest = (
  testId: Nhm2FatigueLayerScalingTestId,
): Record<string, Nhm2FatigueLayerScalingTargetValue> => {
  switch (testId) {
    case "fatigue_scaling_provenance":
      return {
        requiredEvidenceTier: "measured_or_validated_simulation",
        requiredFatigueProvenanceRefCount: REQUIRED_FATIGUE_PROVENANCE_REF_COUNT,
        requiredLayerScalingProvenanceRefCount: REQUIRED_LAYER_SCALING_PROVENANCE_REF_COUNT,
        layerCount: LAYER_COUNT,
      };
    case "cycle_count_to_failure":
      return {
        finiteCycleCountToFailureRequired: true,
        fatigueCurveRefRequired: true,
        layerCount: LAYER_COUNT,
      };
    case "required_cycle_count":
      return {
        finiteRequiredCycleCountRequired: true,
        cycleProtocolRefRequired: true,
        timeDependentCampaignProtocolRequired: true,
      };
    case "cycle_margin":
      return {
        cycleMarginMin: CYCLE_MARGIN_MIN,
        cycleMarginFormula: "cycleCountToFailure / requiredCycleCount",
      };
    case "thermal_cycle_drift":
      return {
        thermalCycleDriftFractionMax: THERMAL_CYCLE_DRIFT_FRACTION_MAX,
        thermalCycleRefRequired: true,
      };
    case "creep_drift":
      return {
        creepDriftFractionMax: CREEP_DRIFT_FRACTION_MAX,
        creepDriftRefRequired: true,
      };
    case "delamination_and_adhesion":
      return {
        delaminationMarginMin: DELAMINATION_MARGIN_MIN,
        interlayerAdhesionMarginMin: INTERLAYER_ADHESION_MARGIN_MIN,
        delaminationProtocolRefRequired: true,
        interlayerAdhesionRefRequired: true,
      };
    case "layer_scaling_efficiency":
      return {
        layerCount: LAYER_COUNT,
        layerScalingEfficiencyMin: LAYER_SCALING_EFFICIENCY_MIN,
        layerScalingMapRefRequired: true,
        multiphysicsCouplingRefRequired: true,
      };
    case "per_layer_variation":
      return {
        perLayerVariationFractionMax: PER_LAYER_VARIATION_FRACTION_MAX,
        perLayerVariationMapRefRequired: true,
      };
    case "nonadditivity_fraction":
      return {
        layerNonadditivityFractionMax: LAYER_NONADDITIVITY_FRACTION_MAX,
        layerNonadditivityModelRefRequired: true,
      };
    case "active_area_retention":
      return {
        activeAreaRetentionMin: ACTIVE_AREA_RETENTION_MIN,
        activeAreaMapRefRequired: true,
        effectiveActiveLayerCountMin: EFFECTIVE_ACTIVE_LAYER_COUNT_MIN,
      };
    case "support_coupling":
      return {
        supportCouplingStatusRequired: "pass",
        supportCouplingMapRefRequired: true,
        multiphysicsCouplingRefRequired: true,
      };
    case "coupling_loss_budget":
      return {
        supportCouplingFractionMax: SUPPORT_COUPLING_FRACTION_MAX,
        electromagneticCouplingFractionMax: ELECTROMAGNETIC_COUPLING_FRACTION_MAX,
        mechanicalCouplingFractionMax: MECHANICAL_COUPLING_FRACTION_MAX,
      };
    case "source_tensor_retention":
      return {
        sourceTensorRetentionFractionMin: SOURCE_TENSOR_RETENTION_FRACTION_MIN,
        sourceTensorRetentionMapRefRequired: true,
        effectiveSourceTensorLayerCountMin: EFFECTIVE_SOURCE_TENSOR_LAYER_COUNT_MIN,
      };
  }
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
        measurementTargets: measurementTargetsForTest(testId),
        requiredMeasurement: policy.requiredMeasurement,
        acceptanceCriterion: policy.acceptanceCriterion,
        falsificationRule: policy.falsificationRule,
        blocksCampaignDomains: policy.blocksCampaignDomains,
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
      perLayerVariationFractionMax: 0.05,
      layerNonadditivityFractionMax: 0.1,
      activeAreaRetentionMin: 0.6,
      supportCouplingFractionMax: 0.1,
      electromagneticCouplingFractionMax: 0.1,
      mechanicalCouplingFractionMax: 0.1,
      sourceTensorRetentionFractionMin: 0.9,
      thermalCycleDriftFractionMax: 0.01,
      creepDriftFractionMax: 0.01,
      delaminationMarginMin: 1,
      interlayerAdhesionMarginMin: 1,
      supportCouplingStatusRequired: "pass",
      evidenceTierRequired: "measured_or_validated_simulation",
    },
    testItems,
    summary: {
      fatigueReceiptStatus: fatigue.status,
      layerScalingReceiptStatus: scaling.status,
      combinedReceiptStatus: combinedStatus(fatigue, scaling),
      nextRequiredTestId: nextItem?.testId ?? "none",
      nextRequiredArtifactToProduce: nextItem?.artifactToProduce ?? null,
      nextRequiredFalsificationRule: nextItem?.falsificationRule ?? null,
      nextBlockedCampaignDomains: nextItem?.blocksCampaignDomains ?? [],
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
    target.perLayerVariationFractionMax === 0.05 &&
    target.layerNonadditivityFractionMax === 0.1 &&
    target.activeAreaRetentionMin === 0.6 &&
    target.supportCouplingFractionMax === 0.1 &&
    target.electromagneticCouplingFractionMax === 0.1 &&
    target.mechanicalCouplingFractionMax === 0.1 &&
    target.sourceTensorRetentionFractionMin === 0.9 &&
    target.thermalCycleDriftFractionMax === 0.01 &&
    target.creepDriftFractionMax === 0.01 &&
    target.delaminationMarginMin === 1 &&
    target.interlayerAdhesionMarginMin === 1 &&
    target.supportCouplingStatusRequired === "pass" &&
    target.evidenceTierRequired === "measured_or_validated_simulation" &&
    Array.isArray(value.testItems) &&
    value.testItems.length === 14 &&
    value.testItems.every(
      (item) =>
        isRecord(item) &&
        typeof item.testId === "string" &&
        ["satisfied", "open", "falsifying"].includes(String(item.status)) &&
        Array.isArray(item.blockerIds) &&
        isRecord(item.measurementTargets) &&
        Object.values(item.measurementTargets).every(
          (entry) =>
            entry === null ||
            typeof entry === "string" ||
            typeof entry === "number" ||
            typeof entry === "boolean",
        ) &&
        typeof item.requiredMeasurement === "string" &&
        typeof item.acceptanceCriterion === "string" &&
        typeof item.falsificationRule === "string" &&
        Array.isArray(item.blocksCampaignDomains) &&
        item.blocksCampaignDomains.every((domain) => typeof domain === "string") &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.fatigueReceiptStatus === "string" &&
    typeof summary.layerScalingReceiptStatus === "string" &&
    typeof summary.combinedReceiptStatus === "string" &&
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
