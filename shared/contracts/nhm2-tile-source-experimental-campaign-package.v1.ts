import type {
  Nhm2TileSourceAuthorityHandoffV1,
} from "./nhm2-tile-source-authority-handoff.v1";
import type {
  Nhm2TileSourceEvidenceGapRoadmapItemV1,
  Nhm2TileSourceEvidenceGapRoadmapV1,
} from "./nhm2-tile-source-evidence-gap-roadmap.v1";
import type {
  Nhm2TileSourceExperimentalCampaignDomainV1,
  Nhm2TileSourceFalsificationCurrentBlockerV1,
  Nhm2TileSourceFalsificationReportV1,
  Nhm2TileSourceFrontierResolutionItemV1,
} from "./nhm2-tile-source-falsification-report.v1";
import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";
import type {
  Nhm2TileSourcePhysicalValidationPlanV1,
} from "./nhm2-tile-source-physical-validation-plan.v1";
import type {
  Nhm2SourceSideSameBasisTensorAuthorityArtifactV1,
} from "./nhm2-source-side-same-basis-tensor-authority.v1";

export const NHM2_TILE_SOURCE_EXPERIMENTAL_CAMPAIGN_PACKAGE_CONTRACT_VERSION =
  "nhm2_tile_source_experimental_campaign_package/v1" as const;

export type Nhm2TileSourceExperimentalCampaignObjectiveIdV1 =
  | "material_coupon_receipts"
  | "force_gap_pull_in_receipts"
  | "roughness_patch_receipts"
  | "active_control_receipts"
  | "fatigue_layer_scaling_receipts"
  | "full_apparatus_tensor_receipts"
  | "source_side_same_basis_authority"
  | "downstream_gate_readiness"
  | "falsification_map";

export type Nhm2TileSourceExperimentalCampaignObjectiveStatusV1 =
  | "missing_coverage"
  | "ready_for_evidence"
  | "falsifying"
  | "blocked_by_downstream"
  | "satisfied";

export type Nhm2TileSourceExperimentalCampaignObjectiveCoverageV1 = {
  objectiveId: Nhm2TileSourceExperimentalCampaignObjectiveIdV1;
  status: Nhm2TileSourceExperimentalCampaignObjectiveStatusV1;
  campaignDomains: Nhm2TileSourceExperimentalCampaignDomainV1[];
  objectiveStatement: string;
  requiredFor: string[];
  campaignItemRanks: number[];
  requiredArtifactRefs: string[];
  openMeasurementIds: string[];
  failingMeasurementIds: string[];
  blockerIds: string[];
  unlocks: string[];
};

export type Nhm2TileSourceExperimentalCampaignMeasurementStatusV1 = {
  measurementId: string;
  evidenceArtifact: string;
  status: "missing" | "pass" | "fail" | "review";
  currentMargin: number | boolean | null;
  requiredCorrectionValue:
    Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"][number]["requiredCorrectionValue"];
  goCriterion: string;
  noGoCriterion: string;
};

export type Nhm2TileSourceExperimentalCampaignTargetValueStatusV1 =
  | "available"
  | "not_applicable"
  | "derived_target_pending"
  | "target_not_declared";

export type Nhm2TileSourceExperimentalCampaignPackageItemV1 = {
  rank: number;
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1;
  sourceFrontierRank: number;
  firstBlocker: string;
  blockerIds: string[];
  evidenceTarget: string;
  requiredChange: string;
  nextEvidenceArtifact: string;
  measurementTargetSummary: string;
  falsificationRule: string;
  decisiveMeasurements: Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"];
  measurementStatuses: Nhm2TileSourceExperimentalCampaignMeasurementStatusV1[];
  prevents: string[];
  evidenceRefs: string[];
  status: "ready_for_receipt" | "falsifying" | "blocked_by_downstream" | "satisfied";
  blocksCampaignPass: true;
};

export type Nhm2TileSourceExperimentalCampaignMeasurementDocketEntryV1 = {
  docketRank: number;
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1;
  sourceFrontierRank: number;
  measurementId: string;
  quantity: string;
  target: string;
  unit: string | null;
  evidenceArtifact: string;
  status: "missing" | "pass" | "fail" | "review";
  currentMargin: number | boolean | null;
  requiredCorrectionKey: string | null;
  requiredCorrectionValue:
    Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"][number]["requiredCorrectionValue"];
  requiredTargetKey: string | null;
  requiredTargetValue: Nhm2TileSourceFrontierResolutionItemV1["requiredCorrections"][string] | null;
  requiredTargetStatus: Nhm2TileSourceExperimentalCampaignTargetValueStatusV1;
  requiredTargetGapReason: string | null;
  goCriterion: string;
  noGoCriterion: string;
  falsificationConsequence: string;
  firstBlocker: string;
  blockerIds: string[];
  nextEvidenceArtifact: string;
  prevents: string[];
  blocksCampaignPass: true;
};

export type Nhm2TileSourceExperimentalCampaignDomainLedgerEntryV1 = {
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1;
  decision: "go" | "review" | "no_go";
  evidenceState:
    | "ready"
    | "missing_receipt"
    | "failing_margin"
    | "source_authority_blocked"
    | "downstream_blocked"
    | "operating_budget_blocked"
    | "open_review";
  firstBlocker: string;
  blockerIds: string[];
  blockerCount: number;
  falsifyingBlockerCount: number;
  minimumNumericalMargin: number | null;
  evidenceTarget: string;
  nextRequiredChange: string;
  nextEvidenceArtifact: string;
  requiredCorrectionKeys: string[];
  requiredCorrections: Nhm2TileSourceFrontierResolutionItemV1["requiredCorrections"];
  decisiveMeasurementIds: string[];
  decisiveMeasurementStatuses: Nhm2TileSourceExperimentalCampaignMeasurementStatusV1[];
  prevents: string[];
  blocksCampaignPass: boolean;
};

export type Nhm2TileSourceExperimentalCampaignReceiptAcquisitionEntryV1 = {
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1;
  acquisitionStatus:
    | "ready"
    | "missing_receipt"
    | "failing_margin"
    | "source_authority_blocked"
    | "downstream_blocked"
    | "operating_budget_blocked"
    | "open_review";
  decision: "go" | "review" | "no_go";
  firstBlocker: string;
  nextEvidenceArtifact: string;
  requiredEvidenceArtifacts: string[];
  blockerIds: string[];
  measurementIds: string[];
  openMeasurementIds: string[];
  requiredTargetAvailableCount: number;
  requiredTargetPendingCount: number;
  requiredTargetNotApplicableCount: number;
  requiredTargetNotDeclaredCount: number;
  pendingTargetGaps: Array<{
    measurementId: string;
    requiredTargetKey: string;
    requiredTargetGapReason: string;
  }>;
  prevents: string[];
  blocksCampaignPass: boolean;
};

export type Nhm2TileSourceExperimentalCampaignPackageV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_EXPERIMENTAL_CAMPAIGN_PACKAGE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
    physicalValidationPlanRef: string | null;
    evidenceGapRoadmapRef: string | null;
    operatingBudgetReadinessRef: string | null;
    falsificationReportRef: string | null;
    authorityHandoffRef: string | null;
    sourceSideSameBasisTensorAuthorityRef: string | null;
  };
  currentBlocker: Nhm2TileSourceFalsificationCurrentBlockerV1;
  objectiveCoverage: Nhm2TileSourceExperimentalCampaignObjectiveCoverageV1[];
  measurementDocket: Nhm2TileSourceExperimentalCampaignMeasurementDocketEntryV1[];
  campaignDomainLedger: Nhm2TileSourceExperimentalCampaignDomainLedgerEntryV1[];
  receiptAcquisitionLedger: Nhm2TileSourceExperimentalCampaignReceiptAcquisitionEntryV1[];
  campaignItems: Nhm2TileSourceExperimentalCampaignPackageItemV1[];
  summary: {
    packageStatus:
      | "ready_for_evidence_collection"
      | "falsified"
      | "blocked_by_downstream"
      | "no_open_campaign_items";
    firstCampaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1 | "none";
    firstBlocker: string;
    measurementCount: number;
    measurementDocketCount: number;
    requiredTargetAvailableCount: number;
    requiredTargetPendingCount: number;
    requiredTargetNotApplicableCount: number;
    requiredTargetNotDeclaredCount: number;
    missingMeasurementCount: number;
    failingMeasurementCount: number;
    passingMeasurementCount: number;
    requiredArtifactCount: number;
    missingReceiptCount: number;
    failingReceiptCount: number;
    operatingBudgetBlockerCount: number;
    objectiveCoverageCount: number;
    campaignDomainLedgerCount: number;
    receiptAcquisitionDomainCount: number;
    receiptArtifactRequirementCount: number;
    domainsWithPendingDerivedTargetsCount: number;
    targetGapMeasurementCount: number;
    missingReceiptDomainCount: number;
    failingMarginDomainCount: number;
    sourceAuthorityBlockedDomainCount: number;
    downstreamBlockedDomainCount: number;
    operatingBudgetBlockedDomainCount: number;
    noGoDomainCount: number;
    reviewDomainCount: number;
    goDomainCount: number;
    openObjectiveCount: number;
    falsifyingObjectiveCount: number;
    satisfiedObjectiveCount: number;
    allObjectiveCoveragePresent: boolean;
    allEvidenceObjectivesSatisfied: boolean;
    handoffReadyForSameBasisAuthority: boolean;
    sourceSideAuthorityAvailable: boolean;
    sourceSideAuthorityReady: boolean | null;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    experimentalPlanningOnly: true;
    packageDoesNotSupplyEvidence: true;
    receiptsMustBeMeasuredOrValidated: true;
    fullApparatusTensorRequired: true;
    downstreamGatesMustPassTogether: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceExperimentalCampaignPackageInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  physicalValidationPlan: Nhm2TileSourcePhysicalValidationPlanV1;
  evidenceGapRoadmap: Nhm2TileSourceEvidenceGapRoadmapV1;
  falsificationReport: Nhm2TileSourceFalsificationReportV1;
  authorityHandoff: Nhm2TileSourceAuthorityHandoffV1;
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
  evidenceGapRoadmapRef?: string | null;
  falsificationReportRef?: string | null;
  authorityHandoffRef?: string | null;
  sourceSideSameBasisTensorAuthority?: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
  sourceSideSameBasisTensorAuthorityRef?: string | null;
  maxItems?: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const uniqueRequiredArtifacts = (
  items: Nhm2TileSourceExperimentalCampaignPackageItemV1[],
): string[] => Array.from(new Set(items.map((item) => item.nextEvidenceArtifact)));

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

const packageItemStatus = (
  item: Nhm2TileSourceFrontierResolutionItemV1,
): Nhm2TileSourceExperimentalCampaignPackageItemV1["status"] => {
  if (item.decision === "no_go" && item.evidenceState !== "downstream_blocked") {
    return "falsifying";
  }
  if (item.evidenceState === "downstream_blocked") return "blocked_by_downstream";
  if (item.decision === "go") return "satisfied";
  return "ready_for_receipt";
};

const measurementStatus = (
  measurement: Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"][number],
  itemStatus: Nhm2TileSourceExperimentalCampaignPackageItemV1["status"],
): Nhm2TileSourceExperimentalCampaignPackageItemV1["measurementStatuses"][number]["status"] => {
  if (typeof measurement.currentMargin === "number") {
    if (measurement.currentMargin >= 1) return "pass";
    return itemStatus === "falsifying" ? "fail" : "missing";
  }
  if (measurement.currentMargin === true) return "pass";
  if (measurement.currentMargin === false) {
    return itemStatus === "falsifying" ? "fail" : "missing";
  }
  if (itemStatus === "satisfied") return "review";
  return "missing";
};

const measurementStatusesForItem = (
  item: Nhm2TileSourceFrontierResolutionItemV1,
): Nhm2TileSourceExperimentalCampaignPackageItemV1["measurementStatuses"] => {
  const itemStatus = packageItemStatus(item);
  return item.decisiveMeasurements.map((measurement) => ({
    measurementId: measurement.measurementId,
    evidenceArtifact: measurement.evidenceArtifact,
    status: measurementStatus(measurement, itemStatus),
    currentMargin: measurement.currentMargin,
    requiredCorrectionValue: measurement.requiredCorrectionValue,
    goCriterion: measurement.goCriterion,
    noGoCriterion: measurement.noGoCriterion,
  }));
};

const correctionValueForMeasurement = (
  item: Nhm2TileSourceFrontierResolutionItemV1,
  measurement: Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"][number],
): Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"][number]["requiredCorrectionValue"] => {
  if (measurement.requiredCorrectionValue != null || measurement.requiredCorrectionKey == null) {
    return measurement.requiredCorrectionValue;
  }
  const directValue = item.requiredCorrections[measurement.requiredCorrectionKey];
  if (directValue !== undefined) return directValue;
  const suffixMatch = Object.entries(item.requiredCorrections).find(([key]) =>
    key.endsWith(`.${measurement.requiredCorrectionKey}`),
  );
  return suffixMatch?.[1] ?? null;
};

const REQUIRED_TARGET_KEY_BY_CORRECTION_KEY: Record<string, string> = {
  activeGapControlAuthorityShortfallN: "activeGapControlAuthorityMinN",
  activeAreaRetentionShortfall: "activeAreaRetentionMin",
  actuatorAuthorityShortfallN: "gapControlAuthorityMinN",
  asperityMaxReductionMeters: "asperityMaxMeters",
  asperityP999ReductionMeters: "asperityP999MaxMeters",
  asperityP99ReductionMeters: "asperityP99MaxMeters",
  bandwidthShortfallHz: "bandwidthMinHz",
  componentGroupMissingCount: "requiredComponentGroupCount",
  componentGroupRefMissingCount: "requiredComponentGroupCount",
  componentCoverageFractionShortfall: "componentCoverageFractionMin",
  conductivityTemperatureReductionK: "materialResponseTemperatureK",
  controllerGainMarginShortfallDb: "controllerGainMarginMinDb",
  controllerPhaseMarginShortfallDegrees: "controllerPhaseMarginMinDegrees",
  couponCycleCountShortfall: "couponRequiredCycleCount",
  creepDriftReduction: "creepDriftFractionMax",
  cryogenicTemperatureReductionK: "operatingTemperatureK",
  cycleCountShortfall: "cycleCountRequired",
  dielectricTemperatureReductionK: "materialResponseTemperatureK",
  delaminationMarginShortfall: "delaminationMarginMin",
  effectiveActiveLayerCountShortfall: "effectiveActiveLayerCountMin",
  effectiveSourceTensorLayerCountShortfall: "effectiveSourceTensorLayerCountMin",
  electromagneticCouplingFractionReduction: "electromagneticCouplingFractionMax",
  energyPerCycleReductionJ: "heatSinkCapacityCriterion",
  fabricationToleranceReductionMeters: "fabricationToleranceMaxMeters",
  forceGradientConsistencyShortfall: "forceGradientConsistencyMin",
  fractureOrYieldStressShortfallPa: "requiredFractureOrYieldStressPa",
  gapClearanceShortfallMeters: "minimumGapClearanceRequiredMeters",
  gapControlAuthorityShortfallN: "gapControlAuthorityMinN",
  gapNoiseRmsReductionMeters: "gapNoiseRmsMaxMeters",
  heatLoadShortfallW: "heatSinkCapacityCriterion",
  heatSinkCapacityShortfallW: "heatSinkCapacityCriterion",
  interlayerAdhesionMarginShortfall: "interlayerAdhesionMarginMin",
  layerNonadditivityReduction: "layerNonadditivityFractionMax",
  layerScalingEfficiencyShortfall: "layerScalingEfficiencyMin",
  materialResponseFrequencyAbsDeltaHz: "materialResponseFrequencyHz",
  mechanicalCouplingFractionReduction: "mechanicalCouplingFractionMax",
  missingCampaignCompatibilityRefCount: "requiredCampaignCompatibilityRefCount",
  missingCurveAndMapRefCount: "requiredCurveAndMapRefCount",
  missingFailureModeCount: "requiredFailureModeCount",
  missingFatigueProvenanceRefCount: "requiredFatigueProvenanceRefCount",
  missingLayerScalingProvenanceRefCount: "requiredLayerScalingProvenanceRefCount",
  missingMaterialResponseRefCount: "requiredMaterialResponseRefCount",
  missingTraceRefCount: "requiredTraceRefCount",
  patchVoltageDerivedElectrostaticFractionReduction:
    "patchVoltageDerivedElectrostaticFractionMax",
  patchVoltageReductionVolts: "patchVoltageRmsMaxVolts",
  perLayerVariationReduction: "perLayerVariationFractionMax",
  phaseNoiseReductionSeconds: "phaseNoiseMaxSeconds",
  regionCoverageMissingCount: "requiredRegionCount",
  regionalCoverageFractionShortfall: "requiredCoverageFraction",
  regionalSupportRefMissingCount: "requiredRegionCount",
  residualElectrostaticForceFractionReduction: "residualElectrostaticForceFractionMax",
  residualElectrostaticForceReductionN: "residualElectrostaticForceMaxN",
  roughnessMapResolutionReductionMeters: "roughnessMapLateralResolutionMaxMeters",
  roughnessRmsReductionMeters: "roughnessRmsMaxMeters",
  roughnessScanAreaFractionShortfall: "roughnessScanAreaFractionMin",
  springConstantShortfallNPerM: "springConstantMinNPerM",
  stictionMarginShortfall: "stictionMarginMin",
  sourceTensorRetentionFractionShortfall: "sourceTensorRetentionFractionMin",
  stressEnergyTermMissingCount: "requiredStressEnergyTermCount",
  stressEnergyTermRefMissingCount: "requiredStressEnergyTermCount",
  suppliedForceDeltaFromIdealStackForceN: "suppliedForceAbsTargetN",
  supportCouplingFractionReduction: "supportCouplingFractionMax",
  switchingRateAbsDeltaHz: "switchingRateTargetHz",
  tensorComponentRefMissingCount: "requiredTensorComponentCount",
  tensileStressShortfallPa: "tensileStressMinPa",
  termCoverageFractionShortfall: "requiredCoverageFraction",
  thermalCycleDriftReduction: "thermalCycleDriftFractionMax",
  timingJitterReductionSeconds: "timingJitterMaxSeconds",
};

const valueFromCorrections = (
  requiredCorrections: Nhm2TileSourceFrontierResolutionItemV1["requiredCorrections"],
  key: string,
): Nhm2TileSourceFrontierResolutionItemV1["requiredCorrections"][string] | null => {
  const directValue = requiredCorrections[key];
  if (directValue !== undefined) return directValue;
  const suffixMatch = Object.entries(requiredCorrections).find(([candidate]) =>
    candidate.endsWith(`.${key}`),
  );
  return suffixMatch?.[1] ?? null;
};

const requiredTargetForMeasurement = (
  item: Nhm2TileSourceFrontierResolutionItemV1,
  measurement: Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"][number],
): {
  requiredTargetKey: string | null;
  requiredTargetValue: Nhm2TileSourceFrontierResolutionItemV1["requiredCorrections"][string] | null;
  requiredTargetStatus: Nhm2TileSourceExperimentalCampaignTargetValueStatusV1;
  requiredTargetGapReason: string | null;
} => {
  if (measurement.requiredCorrectionKey == null) {
    return {
      requiredTargetKey: null,
      requiredTargetValue: null,
      requiredTargetStatus: "not_applicable",
      requiredTargetGapReason: null,
    };
  }
  const requiredTargetKey =
    REQUIRED_TARGET_KEY_BY_CORRECTION_KEY[measurement.requiredCorrectionKey] ??
    measurement.requiredCorrectionKey;
  const requiredTargetValue = valueFromCorrections(item.requiredCorrections, requiredTargetKey);
  const requiredTargetStatus =
    requiredTargetValue != null
      ? "available"
      : requiredTargetKey !== measurement.requiredCorrectionKey
        ? "derived_target_pending"
        : "target_not_declared";
  return {
    requiredTargetKey,
    requiredTargetValue,
    requiredTargetStatus,
    requiredTargetGapReason:
      requiredTargetStatus === "available"
        ? null
        : `${requiredTargetKey}_missing_from_required_corrections`,
  };
};

const measurementDocketForFrontierQueue = (
  frontierQueue: Nhm2TileSourceFalsificationReportV1["frontierResolutionQueue"],
): Nhm2TileSourceExperimentalCampaignMeasurementDocketEntryV1[] => {
  let docketRank = 0;
  return frontierQueue.flatMap((item) => {
    const itemStatus = packageItemStatus(item);
    return item.decisiveMeasurements.map((measurement) => {
      docketRank += 1;
      const requiredTarget = requiredTargetForMeasurement(item, measurement);
      return {
        docketRank,
        campaignDomain: item.campaignDomain,
        sourceFrontierRank: item.rank,
        measurementId: measurement.measurementId,
        quantity: measurement.quantity,
        target: measurement.target,
        unit: measurement.unit,
        evidenceArtifact: measurement.evidenceArtifact,
        status: measurementStatus(measurement, itemStatus),
        currentMargin: measurement.currentMargin,
        requiredCorrectionKey: measurement.requiredCorrectionKey,
        requiredCorrectionValue: correctionValueForMeasurement(item, measurement),
        requiredTargetKey: requiredTarget.requiredTargetKey,
        requiredTargetValue: requiredTarget.requiredTargetValue,
        requiredTargetStatus: requiredTarget.requiredTargetStatus,
        requiredTargetGapReason: requiredTarget.requiredTargetGapReason,
        goCriterion: measurement.goCriterion,
        noGoCriterion: measurement.noGoCriterion,
        falsificationConsequence: measurement.falsificationConsequence,
        firstBlocker: item.firstBlocker,
        blockerIds: item.blockerIds,
        nextEvidenceArtifact: item.nextEvidenceArtifact,
        prevents: item.prevents,
        blocksCampaignPass: true,
      };
    });
  });
};

const domainLedgerEntry = (
  matrixEntry: Nhm2TileSourceFalsificationReportV1["goNoGoMatrix"][number],
  frontierQueue: Nhm2TileSourceFalsificationReportV1["frontierResolutionQueue"],
): Nhm2TileSourceExperimentalCampaignDomainLedgerEntryV1 => {
  const frontier = frontierQueue.find(
    (item) => item.campaignDomain === matrixEntry.campaignDomain,
  );
  const decisiveMeasurementStatuses =
    frontier == null ? [] : measurementStatusesForItem(frontier);
  return {
    campaignDomain: matrixEntry.campaignDomain,
    decision: matrixEntry.decision,
    evidenceState: matrixEntry.evidenceState,
    firstBlocker: matrixEntry.firstBlocker,
    blockerIds: frontier?.blockerIds ?? [],
    blockerCount: matrixEntry.blockerCount,
    falsifyingBlockerCount: matrixEntry.falsifyingBlockerCount,
    minimumNumericalMargin: matrixEntry.minimumNumericalMargin,
    evidenceTarget: matrixEntry.evidenceTarget,
    nextRequiredChange: matrixEntry.nextRequiredChange,
    nextEvidenceArtifact: frontier?.nextEvidenceArtifact ?? "none",
    requiredCorrectionKeys: matrixEntry.requiredCorrectionKeys,
    requiredCorrections: frontier?.requiredCorrections ?? {},
    decisiveMeasurementIds:
      decisiveMeasurementStatuses.map((measurement) => measurement.measurementId),
    decisiveMeasurementStatuses,
    prevents: matrixEntry.prevents,
    blocksCampaignPass: matrixEntry.blocksCampaignPass,
  };
};

const receiptAcquisitionLedger = (
  domainLedger: Nhm2TileSourceExperimentalCampaignDomainLedgerEntryV1[],
  measurementDocket: Nhm2TileSourceExperimentalCampaignMeasurementDocketEntryV1[],
): Nhm2TileSourceExperimentalCampaignReceiptAcquisitionEntryV1[] =>
  domainLedger.map((domainEntry) => {
    const measurements = measurementDocket.filter(
      (measurement) => measurement.campaignDomain === domainEntry.campaignDomain,
    );
    const pendingTargetGaps = measurements
      .filter(
        (measurement) =>
          measurement.requiredTargetStatus === "derived_target_pending" ||
          measurement.requiredTargetStatus === "target_not_declared",
      )
      .map((measurement) => ({
        measurementId: measurement.measurementId,
        requiredTargetKey: measurement.requiredTargetKey ?? "none",
        requiredTargetGapReason:
          measurement.requiredTargetGapReason ?? "required_target_gap_reason_missing",
      }));
    return {
      campaignDomain: domainEntry.campaignDomain,
      acquisitionStatus: domainEntry.evidenceState,
      decision: domainEntry.decision,
      firstBlocker: domainEntry.firstBlocker,
      nextEvidenceArtifact: domainEntry.nextEvidenceArtifact,
      requiredEvidenceArtifacts: uniqueStrings(
        measurements.map((measurement) => measurement.evidenceArtifact),
      ),
      blockerIds: domainEntry.blockerIds,
      measurementIds: measurements.map((measurement) => measurement.measurementId),
      openMeasurementIds: measurements
        .filter((measurement) => measurement.status !== "pass")
        .map((measurement) => measurement.measurementId),
      requiredTargetAvailableCount: measurements.filter(
        (measurement) => measurement.requiredTargetStatus === "available",
      ).length,
      requiredTargetPendingCount: measurements.filter(
        (measurement) => measurement.requiredTargetStatus === "derived_target_pending",
      ).length,
      requiredTargetNotApplicableCount: measurements.filter(
        (measurement) => measurement.requiredTargetStatus === "not_applicable",
      ).length,
      requiredTargetNotDeclaredCount: measurements.filter(
        (measurement) => measurement.requiredTargetStatus === "target_not_declared",
      ).length,
      pendingTargetGaps,
      prevents: domainEntry.prevents,
      blocksCampaignPass: domainEntry.blocksCampaignPass,
    };
  });

const packageStatus = (
  items: Nhm2TileSourceExperimentalCampaignPackageItemV1[],
): Nhm2TileSourceExperimentalCampaignPackageV1["summary"]["packageStatus"] => {
  if (items.length === 0) return "no_open_campaign_items";
  if (items.some((item) => item.status === "falsifying")) return "falsified";
  if (items[0]?.status === "blocked_by_downstream") return "blocked_by_downstream";
  return "ready_for_evidence_collection";
};

const OBJECTIVE_POLICIES: Array<{
  objectiveId: Nhm2TileSourceExperimentalCampaignObjectiveIdV1;
  campaignDomains: Nhm2TileSourceExperimentalCampaignDomainV1[];
  objectiveStatement: string;
  requiredFor: string[];
}> = [
  {
    objectiveId: "material_coupon_receipts",
    campaignDomains: ["material_coupon_behavior"],
    objectiveStatement:
      "Measured or validated TiN/candidate-stack coupon behavior: stress, fracture/yield, fatigue, cryogenic, conductivity, dielectric, roughness, and fabrication tolerance.",
    requiredFor: ["material credibility", "force-gap load interpretation", "full apparatus tensor"],
  },
  {
    objectiveId: "force_gap_pull_in_receipts",
    campaignDomains: ["force_gap_pull_in"],
    objectiveStatement:
      "8 nm F(g), dF/dg, stiffness, pull-in, stiction, and active gap-control authority receipts.",
    requiredFor: ["active control", "pull-in/stiction no-go", "covariant conservation"],
  },
  {
    objectiveId: "roughness_patch_receipts",
    campaignDomains: ["roughness_patch_potential"],
    objectiveStatement:
      "Roughness, asperity-tail, patch-voltage, and residual electrostatic correction receipts against the 8 nm gap.",
    requiredFor: ["force-gap credibility", "apparatus electrostatic stress-energy"],
  },
  {
    objectiveId: "active_control_receipts",
    campaignDomains: ["active_control_energy_noise_heat_timing"],
    objectiveStatement:
      "Active-control energy, bandwidth, noise spectrum, heat load, timing/synchronization, and failure-mode receipts.",
    requiredFor: ["time-dependent campaign", "apparatus control-field stress-energy"],
  },
  {
    objectiveId: "fatigue_layer_scaling_receipts",
    campaignDomains: ["fatigue_layer_scaling"],
    objectiveStatement:
      "Fatigue lifetime, layer nonadditivity, support coupling, active-area retention, and source-tensor retention receipts.",
    requiredFor: ["447-layer admissibility", "regional source tensor retention"],
  },
  {
    objectiveId: "full_apparatus_tensor_receipts",
    campaignDomains: ["full_apparatus_tensor"],
    objectiveStatement:
      "Full apparatus source-side T00, T0i, diagonal Tij, and off-diagonal Tij with plates, supports, controls, electrostatic, thermal, elastic, Casimir, fatigue, and scaling terms.",
    requiredFor: ["source-side same-basis authority", "regional residual closure", "observer/QEI gates"],
  },
  {
    objectiveId: "source_side_same_basis_authority",
    campaignDomains: ["campaign_coordination"],
    objectiveStatement:
      "Same chart, same basis, same units, same regional supports, full component coverage, and no metric-target echo before source-side authority handoff.",
    requiredFor: ["wall T00 closure", "regional residual closure", "coupled closure"],
  },
  {
    objectiveId: "downstream_gate_readiness",
    campaignDomains: ["downstream_residual_conservation_qei_observer"],
    objectiveStatement:
      "Regional residual, wall T00, covariant conservation, QEI dossier, observer-family energy-condition, material credibility, and coupled-closure gates must pass together.",
    requiredFor: ["diagnostic full-solve pass", "claim admission review"],
  },
  {
    objectiveId: "falsification_map",
    campaignDomains: ["campaign_coordination"],
    objectiveStatement:
      "Missing or failing evidence must emit exact blockers, numerical margins, required changes, and decisive measurement targets.",
    requiredFor: ["candidate review", "candidate falsification", "next experiment planning"],
  },
];

const statusFromItems = (
  items: Nhm2TileSourceExperimentalCampaignPackageItemV1[],
  packageSummaryStatus: Nhm2TileSourceExperimentalCampaignPackageV1["summary"]["packageStatus"],
): Nhm2TileSourceExperimentalCampaignObjectiveStatusV1 => {
  if (items.length === 0) {
    return packageSummaryStatus === "no_open_campaign_items" ? "satisfied" : "missing_coverage";
  }
  if (items.some((item) => item.status === "falsifying")) return "falsifying";
  if (items.some((item) => item.status === "blocked_by_downstream")) {
    return "blocked_by_downstream";
  }
  if (items.some((item) => item.status === "ready_for_receipt")) return "ready_for_evidence";
  return "satisfied";
};

const buildObjectiveCoverage = (args: {
  campaignItems: Nhm2TileSourceExperimentalCampaignPackageItemV1[];
  packageSummaryStatus: Nhm2TileSourceExperimentalCampaignPackageV1["summary"]["packageStatus"];
  physicalValidationPlan: Nhm2TileSourcePhysicalValidationPlanV1;
  falsificationReport: Nhm2TileSourceFalsificationReportV1;
  authorityHandoff: Nhm2TileSourceAuthorityHandoffV1;
  sourceSideSameBasisTensorAuthority: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
  falsificationReportRef: string | null;
  authorityHandoffRef: string | null;
  sourceSideSameBasisTensorAuthorityRef: string | null;
}): Nhm2TileSourceExperimentalCampaignObjectiveCoverageV1[] =>
  OBJECTIVE_POLICIES.map((policy) => {
    const items = args.campaignItems.filter((item) =>
      policy.campaignDomains.includes(item.campaignDomain),
    );
    let status = statusFromItems(items, args.packageSummaryStatus);
    let blockerIds = uniqueStrings(items.flatMap((item) => item.blockerIds));
    let requiredArtifactRefs = uniqueStrings(
      items.flatMap((item) => [item.nextEvidenceArtifact, ...item.evidenceRefs]),
    );
    let openMeasurementIds = uniqueStrings(
      items.flatMap((item) =>
        item.measurementStatuses
          .filter((measurement) => measurement.status === "missing" || measurement.status === "review")
          .map((measurement) => measurement.measurementId),
      ),
    );
    const failingMeasurementIds = uniqueStrings(
      items.flatMap((item) =>
        item.measurementStatuses
          .filter((measurement) => measurement.status === "fail")
          .map((measurement) => measurement.measurementId),
      ),
    );
    let unlocks = uniqueStrings(items.flatMap((item) => item.prevents));

    if (policy.objectiveId === "source_side_same_basis_authority") {
      const sourceAuthority = args.sourceSideSameBasisTensorAuthority;
      if (sourceAuthority != null) {
        status = sourceAuthority.summary.allRequiredRegionsAuthoritative
          ? "satisfied"
          : sourceAuthority.summary.anyMetricEcho
            ? "falsifying"
            : "ready_for_evidence";
        blockerIds = uniqueStrings([
          ...sourceAuthority.regions.flatMap((region) => region.blockers),
          ...sourceAuthority.summary.missingRegionIds.map(
            (regionId) => `source_side_region_${regionId}_authority_missing`,
          ),
        ]);
        requiredArtifactRefs = uniqueStrings(
          [
            args.sourceSideSameBasisTensorAuthorityRef,
            args.authorityHandoffRef,
            args.authorityHandoff.sourceRefs.targetAuthorityContractRef,
          ].filter((ref): ref is string => typeof ref === "string" && ref.length > 0),
        );
        openMeasurementIds = sourceAuthority.summary.allRequiredRegionsAuthoritative
          ? []
          : uniqueStrings([
              ...sourceAuthority.regions.flatMap((region) =>
                region.missingComponentIds.map(
                  (componentId) => `${region.regionId}:${componentId}`,
                ),
              ),
              ...(blockerIds.length > 0 ? ["source_side_authority_blockers"] : []),
            ]);
      } else {
        status = args.authorityHandoff.summary.handoffReadyForSameBasisAuthority
          ? "satisfied"
          : args.authorityHandoff.summary.operatingBudgetsFalsifyCurrentCandidate
            ? "falsifying"
            : "ready_for_evidence";
        blockerIds =
          args.authorityHandoff.summary.firstBlocker === "none"
            ? []
            : [args.authorityHandoff.summary.firstBlocker];
        requiredArtifactRefs = uniqueStrings(
          [
            args.authorityHandoffRef,
            args.authorityHandoff.sourceRefs.targetAuthorityContractRef,
          ].filter((ref): ref is string => typeof ref === "string" && ref.length > 0),
        );
        openMeasurementIds = args.authorityHandoff.summary.handoffReadyForSameBasisAuthority
          ? []
          : ["same_basis_authority_handoff"];
      }
      unlocks = ["source_side_same_basis_authority", "regional_residual_closure"];
    } else if (policy.objectiveId === "downstream_gate_readiness") {
      const nonPassingGates = args.physicalValidationPlan.downstreamGates.filter(
        (gate) => gate.status !== "pass",
      );
      status =
        args.physicalValidationPlan.summary.downstreamGatesPass === true
          ? "satisfied"
          : nonPassingGates.some((gate) => gate.status === "fail")
            ? "falsifying"
            : "blocked_by_downstream";
      blockerIds = uniqueStrings(nonPassingGates.flatMap((gate) => gate.blockers));
      requiredArtifactRefs = uniqueStrings(
        nonPassingGates
          .map((gate) => gate.artifactRef)
          .filter((ref): ref is string => typeof ref === "string" && ref.length > 0),
      );
      openMeasurementIds = nonPassingGates.map((gate) => gate.gateId);
      unlocks = ["regional_residual_closure", "qei_worldline_dossier", "observer_family_energy_conditions"];
    } else if (policy.objectiveId === "falsification_map") {
      status = "satisfied";
      blockerIds =
        args.falsificationReport.disposition.firstBlocker === "none"
          ? []
          : [args.falsificationReport.disposition.firstBlocker];
      requiredArtifactRefs = [args.falsificationReportRef].filter(
        (ref): ref is string => typeof ref === "string" && ref.length > 0,
      );
      openMeasurementIds = [];
      unlocks = ["next_experiment_planning", "candidate_falsification"];
    }

    return {
      objectiveId: policy.objectiveId,
      status,
      campaignDomains: policy.campaignDomains,
      objectiveStatement: policy.objectiveStatement,
      requiredFor: policy.requiredFor,
      campaignItemRanks: items.map((item) => item.rank),
      requiredArtifactRefs,
      openMeasurementIds,
      failingMeasurementIds,
      blockerIds,
      unlocks,
    };
  });

export const buildNhm2TileSourceExperimentalCampaignPackage = (
  input: BuildNhm2TileSourceExperimentalCampaignPackageInput,
): Nhm2TileSourceExperimentalCampaignPackageV1 => {
  const maxItems = Math.max(1, Math.floor(input.maxItems ?? 7));
  const measurementDocket = measurementDocketForFrontierQueue(
    input.falsificationReport.frontierResolutionQueue,
  );
  const campaignDomainLedger = input.falsificationReport.goNoGoMatrix.map((entry) =>
    domainLedgerEntry(entry, input.falsificationReport.frontierResolutionQueue),
  );
  const acquisitionLedger = receiptAcquisitionLedger(campaignDomainLedger, measurementDocket);
  const countDomains = (
    predicate: (entry: Nhm2TileSourceExperimentalCampaignDomainLedgerEntryV1) => boolean,
  ): number => campaignDomainLedger.filter(predicate).length;
  const countDocketTargets = (
    status: Nhm2TileSourceExperimentalCampaignTargetValueStatusV1,
  ): number => measurementDocket.filter((entry) => entry.requiredTargetStatus === status).length;
  const campaignItems = input.falsificationReport.frontierResolutionQueue
    .slice(0, maxItems)
    .map(
      (item, index): Nhm2TileSourceExperimentalCampaignPackageItemV1 => ({
        rank: index + 1,
        campaignDomain: item.campaignDomain,
        sourceFrontierRank: item.rank,
        firstBlocker: item.firstBlocker,
        blockerIds: item.blockerIds,
        evidenceTarget: item.evidenceTarget,
        requiredChange: item.requiredChange,
        nextEvidenceArtifact: item.nextEvidenceArtifact,
        measurementTargetSummary: item.measurementTargetSummary,
        falsificationRule: item.falsificationRule,
        decisiveMeasurements: item.decisiveMeasurements,
        measurementStatuses: measurementStatusesForItem(item),
        prevents: item.prevents,
        evidenceRefs: item.evidenceRefs,
        status: packageItemStatus(item),
        blocksCampaignPass: true,
      }),
    );
  const requiredArtifacts = uniqueRequiredArtifacts(campaignItems);
  const measurementCount = campaignItems.reduce(
    (count, item) => count + item.decisiveMeasurements.length,
    0,
  );
  const allMeasurementStatuses = campaignItems.flatMap((item) => item.measurementStatuses);
  const firstItem = campaignItems[0] ?? null;
  const finalPackageStatus = packageStatus(campaignItems);
  const objectiveCoverage = buildObjectiveCoverage({
    campaignItems,
    packageSummaryStatus: finalPackageStatus,
    physicalValidationPlan: input.physicalValidationPlan,
    falsificationReport: input.falsificationReport,
    authorityHandoff: input.authorityHandoff,
    sourceSideSameBasisTensorAuthority: input.sourceSideSameBasisTensorAuthority ?? null,
    falsificationReportRef: input.falsificationReportRef ?? null,
    authorityHandoffRef: input.authorityHandoffRef ?? null,
    sourceSideSameBasisTensorAuthorityRef:
      input.sourceSideSameBasisTensorAuthorityRef ?? null,
  });
  const openObjectiveCount = objectiveCoverage.filter(
    (coverage) => coverage.status === "ready_for_evidence" || coverage.status === "blocked_by_downstream",
  ).length;
  const falsifyingObjectiveCount = objectiveCoverage.filter(
    (coverage) => coverage.status === "falsifying",
  ).length;
  const satisfiedObjectiveCount = objectiveCoverage.filter(
    (coverage) => coverage.status === "satisfied",
  ).length;
  return {
    contractVersion: NHM2_TILE_SOURCE_EXPERIMENTAL_CAMPAIGN_PACKAGE_CONTRACT_VERSION,
    generatedAt: input.falsificationReport.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.falsificationReport.selectedProfileId,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
      physicalValidationPlanRef: input.physicalValidationPlanRef ?? null,
      evidenceGapRoadmapRef: input.evidenceGapRoadmapRef ?? null,
      operatingBudgetReadinessRef:
        input.falsificationReport.sourceRefs.operatingBudgetReadinessRef ?? null,
      falsificationReportRef: input.falsificationReportRef ?? null,
      authorityHandoffRef: input.authorityHandoffRef ?? null,
      sourceSideSameBasisTensorAuthorityRef:
        input.sourceSideSameBasisTensorAuthorityRef ?? null,
    },
    currentBlocker: input.falsificationReport.currentBlocker,
    objectiveCoverage,
    measurementDocket,
    campaignDomainLedger,
    receiptAcquisitionLedger: acquisitionLedger,
    campaignItems,
    summary: {
      packageStatus: finalPackageStatus,
      firstCampaignDomain: firstItem?.campaignDomain ?? "none",
      firstBlocker: firstItem?.firstBlocker ?? "none",
      measurementCount,
      measurementDocketCount: measurementDocket.length,
      requiredTargetAvailableCount: countDocketTargets("available"),
      requiredTargetPendingCount: countDocketTargets("derived_target_pending"),
      requiredTargetNotApplicableCount: countDocketTargets("not_applicable"),
      requiredTargetNotDeclaredCount: countDocketTargets("target_not_declared"),
      missingMeasurementCount: allMeasurementStatuses.filter(
        (measurement) => measurement.status === "missing",
      ).length,
      failingMeasurementCount: allMeasurementStatuses.filter(
        (measurement) => measurement.status === "fail",
      ).length,
      passingMeasurementCount: allMeasurementStatuses.filter(
        (measurement) => measurement.status === "pass",
      ).length,
      requiredArtifactCount: requiredArtifacts.length,
      missingReceiptCount: input.falsificationReport.summary.missingReceiptCount,
      failingReceiptCount: input.falsificationReport.summary.failingReceiptCount,
      operatingBudgetBlockerCount: input.falsificationReport.summary.operatingBudgetBlockerCount,
      objectiveCoverageCount: objectiveCoverage.length,
      campaignDomainLedgerCount: campaignDomainLedger.length,
      receiptAcquisitionDomainCount: acquisitionLedger.length,
      receiptArtifactRequirementCount: uniqueStrings(
        acquisitionLedger.flatMap((entry) => entry.requiredEvidenceArtifacts),
      ).length,
      domainsWithPendingDerivedTargetsCount: acquisitionLedger.filter(
        (entry) => entry.requiredTargetPendingCount > 0,
      ).length,
      targetGapMeasurementCount: acquisitionLedger.reduce(
        (count, entry) => count + entry.pendingTargetGaps.length,
        0,
      ),
      missingReceiptDomainCount: countDomains(
        (entry) => entry.evidenceState === "missing_receipt",
      ),
      failingMarginDomainCount: countDomains(
        (entry) => entry.evidenceState === "failing_margin",
      ),
      sourceAuthorityBlockedDomainCount: countDomains(
        (entry) => entry.evidenceState === "source_authority_blocked",
      ),
      downstreamBlockedDomainCount: countDomains(
        (entry) => entry.evidenceState === "downstream_blocked",
      ),
      operatingBudgetBlockedDomainCount: countDomains(
        (entry) => entry.evidenceState === "operating_budget_blocked",
      ),
      noGoDomainCount: countDomains((entry) => entry.decision === "no_go"),
      reviewDomainCount: countDomains((entry) => entry.decision === "review"),
      goDomainCount: countDomains((entry) => entry.decision === "go"),
      openObjectiveCount,
      falsifyingObjectiveCount,
      satisfiedObjectiveCount,
      allObjectiveCoveragePresent: objectiveCoverage.length === OBJECTIVE_POLICIES.length,
      allEvidenceObjectivesSatisfied:
        objectiveCoverage.length === OBJECTIVE_POLICIES.length &&
        objectiveCoverage.every((coverage) => coverage.status === "satisfied"),
      handoffReadyForSameBasisAuthority:
        input.authorityHandoff.summary.handoffReadyForSameBasisAuthority,
      sourceSideAuthorityAvailable: input.sourceSideSameBasisTensorAuthority != null,
      sourceSideAuthorityReady:
        input.sourceSideSameBasisTensorAuthority == null
          ? null
          : input.sourceSideSameBasisTensorAuthority.summary.allRequiredRegionsAuthoritative,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      experimentalPlanningOnly: true,
      packageDoesNotSupplyEvidence: true,
      receiptsMustBeMeasuredOrValidated: true,
      fullApparatusTensorRequired: true,
      downstreamGatesMustPassTogether: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

const isDecisiveMeasurementList = (
  value: unknown,
): value is Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (measurement) =>
      isRecord(measurement) &&
      typeof measurement.measurementId === "string" &&
      typeof measurement.quantity === "string" &&
      typeof measurement.target === "string" &&
      (measurement.unit === null || typeof measurement.unit === "string") &&
      typeof measurement.evidenceArtifact === "string" &&
      (measurement.marginKey === null || typeof measurement.marginKey === "string") &&
      (measurement.currentMargin === null ||
        typeof measurement.currentMargin === "number" ||
        typeof measurement.currentMargin === "boolean") &&
      (measurement.requiredCorrectionKey === null ||
        typeof measurement.requiredCorrectionKey === "string") &&
      (measurement.requiredCorrectionValue === null ||
        typeof measurement.requiredCorrectionValue === "number" ||
        typeof measurement.requiredCorrectionValue === "boolean") &&
      typeof measurement.goCriterion === "string" &&
      typeof measurement.noGoCriterion === "string" &&
      typeof measurement.falsificationConsequence === "string",
  );

const isMeasurementStatusList = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignPackageItemV1["measurementStatuses"] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.measurementId === "string" &&
      typeof entry.evidenceArtifact === "string" &&
      ["missing", "pass", "fail", "review"].includes(String(entry.status)) &&
      (entry.currentMargin === null ||
        typeof entry.currentMargin === "number" ||
        typeof entry.currentMargin === "boolean") &&
      (entry.requiredCorrectionValue === null ||
        typeof entry.requiredCorrectionValue === "string" ||
        typeof entry.requiredCorrectionValue === "number" ||
        typeof entry.requiredCorrectionValue === "boolean" ||
        (Array.isArray(entry.requiredCorrectionValue) &&
          entry.requiredCorrectionValue.every((correction) => typeof correction === "string"))) &&
      typeof entry.goCriterion === "string" &&
      typeof entry.noGoCriterion === "string",
  );

const isLedgerCorrectionValue = (value: unknown): boolean =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  (Array.isArray(value) && value.every((entry) => typeof entry === "string"));

const isLedgerCorrectionRecord = (value: unknown): boolean =>
  isRecord(value) && Object.values(value).every(isLedgerCorrectionValue);

const isMeasurementDocketEntry = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignMeasurementDocketEntryV1 =>
  isRecord(value) &&
  typeof value.docketRank === "number" &&
  typeof value.campaignDomain === "string" &&
  typeof value.sourceFrontierRank === "number" &&
  typeof value.measurementId === "string" &&
  typeof value.quantity === "string" &&
  typeof value.target === "string" &&
  (value.unit === null || typeof value.unit === "string") &&
  typeof value.evidenceArtifact === "string" &&
  ["missing", "pass", "fail", "review"].includes(String(value.status)) &&
  (value.currentMargin === null ||
    typeof value.currentMargin === "number" ||
    typeof value.currentMargin === "boolean") &&
  (value.requiredCorrectionKey === null ||
    typeof value.requiredCorrectionKey === "string") &&
  isLedgerCorrectionValue(value.requiredCorrectionValue) &&
  (value.requiredTargetKey === null ||
    typeof value.requiredTargetKey === "string") &&
  isLedgerCorrectionValue(value.requiredTargetValue) &&
  ["available", "not_applicable", "derived_target_pending", "target_not_declared"].includes(
    String(value.requiredTargetStatus),
  ) &&
  (value.requiredTargetGapReason === null ||
    typeof value.requiredTargetGapReason === "string") &&
  typeof value.goCriterion === "string" &&
  typeof value.noGoCriterion === "string" &&
  typeof value.falsificationConsequence === "string" &&
  typeof value.firstBlocker === "string" &&
  Array.isArray(value.blockerIds) &&
  value.blockerIds.every((blockerId) => typeof blockerId === "string") &&
  typeof value.nextEvidenceArtifact === "string" &&
  Array.isArray(value.prevents) &&
  value.prevents.every((prevent) => typeof prevent === "string") &&
  value.blocksCampaignPass === true;

const isCampaignItem = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignPackageItemV1 =>
  isRecord(value) &&
  typeof value.rank === "number" &&
  typeof value.campaignDomain === "string" &&
  typeof value.sourceFrontierRank === "number" &&
  typeof value.firstBlocker === "string" &&
  Array.isArray(value.blockerIds) &&
  value.blockerIds.every((blocker) => typeof blocker === "string") &&
  typeof value.evidenceTarget === "string" &&
  typeof value.requiredChange === "string" &&
  typeof value.nextEvidenceArtifact === "string" &&
  typeof value.measurementTargetSummary === "string" &&
  typeof value.falsificationRule === "string" &&
  isDecisiveMeasurementList(value.decisiveMeasurements) &&
  isMeasurementStatusList(value.measurementStatuses) &&
  value.measurementStatuses.length === value.decisiveMeasurements.length &&
  Array.isArray(value.prevents) &&
  value.prevents.every((prevent) => typeof prevent === "string") &&
  Array.isArray(value.evidenceRefs) &&
  value.evidenceRefs.every((ref) => typeof ref === "string") &&
  ["ready_for_receipt", "falsifying", "blocked_by_downstream", "satisfied"].includes(
    String(value.status),
  ) &&
  value.blocksCampaignPass === true;

const isCampaignDomainLedgerEntry = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignDomainLedgerEntryV1 =>
  isRecord(value) &&
  typeof value.campaignDomain === "string" &&
  ["go", "review", "no_go"].includes(String(value.decision)) &&
  [
    "ready",
    "missing_receipt",
    "failing_margin",
    "source_authority_blocked",
    "downstream_blocked",
    "operating_budget_blocked",
    "open_review",
  ].includes(String(value.evidenceState)) &&
  typeof value.firstBlocker === "string" &&
  Array.isArray(value.blockerIds) &&
  value.blockerIds.every((blockerId) => typeof blockerId === "string") &&
  typeof value.blockerCount === "number" &&
  typeof value.falsifyingBlockerCount === "number" &&
  (value.minimumNumericalMargin === null ||
    typeof value.minimumNumericalMargin === "number") &&
  typeof value.evidenceTarget === "string" &&
  typeof value.nextRequiredChange === "string" &&
  typeof value.nextEvidenceArtifact === "string" &&
  Array.isArray(value.requiredCorrectionKeys) &&
  value.requiredCorrectionKeys.every((key) => typeof key === "string") &&
  isLedgerCorrectionRecord(value.requiredCorrections) &&
  Array.isArray(value.decisiveMeasurementIds) &&
  value.decisiveMeasurementIds.every((measurementId) => typeof measurementId === "string") &&
  isMeasurementStatusList(value.decisiveMeasurementStatuses) &&
  Array.isArray(value.prevents) &&
  value.prevents.every((prevent) => typeof prevent === "string") &&
  typeof value.blocksCampaignPass === "boolean";

const isReceiptAcquisitionEntry = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignReceiptAcquisitionEntryV1 =>
  isRecord(value) &&
  typeof value.campaignDomain === "string" &&
  [
    "ready",
    "missing_receipt",
    "failing_margin",
    "source_authority_blocked",
    "downstream_blocked",
    "operating_budget_blocked",
    "open_review",
  ].includes(String(value.acquisitionStatus)) &&
  ["go", "review", "no_go"].includes(String(value.decision)) &&
  typeof value.firstBlocker === "string" &&
  typeof value.nextEvidenceArtifact === "string" &&
  Array.isArray(value.requiredEvidenceArtifacts) &&
  value.requiredEvidenceArtifacts.every((artifact) => typeof artifact === "string") &&
  Array.isArray(value.blockerIds) &&
  value.blockerIds.every((blockerId) => typeof blockerId === "string") &&
  Array.isArray(value.measurementIds) &&
  value.measurementIds.every((measurementId) => typeof measurementId === "string") &&
  Array.isArray(value.openMeasurementIds) &&
  value.openMeasurementIds.every((measurementId) => typeof measurementId === "string") &&
  typeof value.requiredTargetAvailableCount === "number" &&
  typeof value.requiredTargetPendingCount === "number" &&
  typeof value.requiredTargetNotApplicableCount === "number" &&
  typeof value.requiredTargetNotDeclaredCount === "number" &&
  value.requiredTargetAvailableCount +
    value.requiredTargetPendingCount +
    value.requiredTargetNotApplicableCount +
    value.requiredTargetNotDeclaredCount ===
    value.measurementIds.length &&
  Array.isArray(value.pendingTargetGaps) &&
  value.pendingTargetGaps.every(
    (gap) =>
      isRecord(gap) &&
      typeof gap.measurementId === "string" &&
      typeof gap.requiredTargetKey === "string" &&
      typeof gap.requiredTargetGapReason === "string",
  ) &&
  Array.isArray(value.prevents) &&
  value.prevents.every((prevent) => typeof prevent === "string") &&
  typeof value.blocksCampaignPass === "boolean";

const isObjectiveCoverage = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignObjectiveCoverageV1 =>
  isRecord(value) &&
  [
    "material_coupon_receipts",
    "force_gap_pull_in_receipts",
    "roughness_patch_receipts",
    "active_control_receipts",
    "fatigue_layer_scaling_receipts",
    "full_apparatus_tensor_receipts",
    "source_side_same_basis_authority",
    "downstream_gate_readiness",
    "falsification_map",
  ].includes(String(value.objectiveId)) &&
  [
    "missing_coverage",
    "ready_for_evidence",
    "falsifying",
    "blocked_by_downstream",
    "satisfied",
  ].includes(String(value.status)) &&
  Array.isArray(value.campaignDomains) &&
  value.campaignDomains.every((domain) => typeof domain === "string") &&
  typeof value.objectiveStatement === "string" &&
  Array.isArray(value.requiredFor) &&
  value.requiredFor.every((entry) => typeof entry === "string") &&
  Array.isArray(value.campaignItemRanks) &&
  value.campaignItemRanks.every((rank) => typeof rank === "number") &&
  Array.isArray(value.requiredArtifactRefs) &&
  value.requiredArtifactRefs.every((ref) => typeof ref === "string") &&
  Array.isArray(value.openMeasurementIds) &&
  value.openMeasurementIds.every((measurementId) => typeof measurementId === "string") &&
  Array.isArray(value.failingMeasurementIds) &&
  value.failingMeasurementIds.every((measurementId) => typeof measurementId === "string") &&
  Array.isArray(value.blockerIds) &&
  value.blockerIds.every((blockerId) => typeof blockerId === "string") &&
  Array.isArray(value.unlocks) &&
  value.unlocks.every((unlock) => typeof unlock === "string");

export const isNhm2TileSourceExperimentalCampaignPackage = (
  value: unknown,
): value is Nhm2TileSourceExperimentalCampaignPackageV1 => {
  if (!isRecord(value)) return false;
  const sourceRefs = value.sourceRefs;
  const currentBlocker = value.currentBlocker;
  const summary = value.summary;
  const claimBoundary = value.claimBoundary;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_EXPERIMENTAL_CAMPAIGN_PACKAGE_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(sourceRefs) &&
    Object.values(sourceRefs).every((ref) => ref === null || typeof ref === "string") &&
    isRecord(currentBlocker) &&
    isDecisiveMeasurementList(currentBlocker.decisiveMeasurements) &&
    Array.isArray(value.objectiveCoverage) &&
    value.objectiveCoverage.length === OBJECTIVE_POLICIES.length &&
    value.objectiveCoverage.every(isObjectiveCoverage) &&
    Array.isArray(value.measurementDocket) &&
    value.measurementDocket.length >= value.campaignItems.length &&
    value.measurementDocket.every(isMeasurementDocketEntry) &&
    Array.isArray(value.campaignDomainLedger) &&
    value.campaignDomainLedger.length === 8 &&
    value.campaignDomainLedger.every(isCampaignDomainLedgerEntry) &&
    Array.isArray(value.receiptAcquisitionLedger) &&
    value.receiptAcquisitionLedger.length === value.campaignDomainLedger.length &&
    value.receiptAcquisitionLedger.every(isReceiptAcquisitionEntry) &&
    Array.isArray(value.campaignItems) &&
    value.campaignItems.every(isCampaignItem) &&
    isRecord(summary) &&
    [
      "ready_for_evidence_collection",
      "falsified",
      "blocked_by_downstream",
      "no_open_campaign_items",
    ].includes(String(summary.packageStatus)) &&
    typeof summary.firstCampaignDomain === "string" &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.measurementCount === "number" &&
    summary.measurementCount >= value.campaignItems.length &&
    typeof summary.measurementDocketCount === "number" &&
    summary.measurementDocketCount === value.measurementDocket.length &&
    typeof summary.requiredTargetAvailableCount === "number" &&
    typeof summary.requiredTargetPendingCount === "number" &&
    typeof summary.requiredTargetNotApplicableCount === "number" &&
    typeof summary.requiredTargetNotDeclaredCount === "number" &&
    summary.requiredTargetAvailableCount + summary.requiredTargetPendingCount +
      summary.requiredTargetNotApplicableCount + summary.requiredTargetNotDeclaredCount ===
      value.measurementDocket.length &&
    typeof summary.missingMeasurementCount === "number" &&
    typeof summary.failingMeasurementCount === "number" &&
    typeof summary.passingMeasurementCount === "number" &&
    typeof summary.requiredArtifactCount === "number" &&
    typeof summary.missingReceiptCount === "number" &&
    typeof summary.failingReceiptCount === "number" &&
    typeof summary.operatingBudgetBlockerCount === "number" &&
    typeof summary.objectiveCoverageCount === "number" &&
    summary.objectiveCoverageCount === value.objectiveCoverage.length &&
    typeof summary.campaignDomainLedgerCount === "number" &&
    summary.campaignDomainLedgerCount === value.campaignDomainLedger.length &&
    typeof summary.receiptAcquisitionDomainCount === "number" &&
    summary.receiptAcquisitionDomainCount === value.receiptAcquisitionLedger.length &&
    typeof summary.receiptArtifactRequirementCount === "number" &&
    summary.receiptArtifactRequirementCount ===
      uniqueStrings(
        value.receiptAcquisitionLedger.flatMap((entry) => entry.requiredEvidenceArtifacts),
      ).length &&
    typeof summary.domainsWithPendingDerivedTargetsCount === "number" &&
    summary.domainsWithPendingDerivedTargetsCount ===
      value.receiptAcquisitionLedger.filter((entry) => entry.requiredTargetPendingCount > 0)
        .length &&
    typeof summary.targetGapMeasurementCount === "number" &&
    summary.targetGapMeasurementCount ===
      value.receiptAcquisitionLedger.reduce(
        (count, entry) => count + entry.pendingTargetGaps.length,
        0,
      ) &&
    typeof summary.missingReceiptDomainCount === "number" &&
    typeof summary.failingMarginDomainCount === "number" &&
    typeof summary.sourceAuthorityBlockedDomainCount === "number" &&
    typeof summary.downstreamBlockedDomainCount === "number" &&
    typeof summary.operatingBudgetBlockedDomainCount === "number" &&
    typeof summary.noGoDomainCount === "number" &&
    typeof summary.reviewDomainCount === "number" &&
    typeof summary.goDomainCount === "number" &&
    typeof summary.openObjectiveCount === "number" &&
    typeof summary.falsifyingObjectiveCount === "number" &&
    typeof summary.satisfiedObjectiveCount === "number" &&
    typeof summary.allObjectiveCoveragePresent === "boolean" &&
    typeof summary.allEvidenceObjectivesSatisfied === "boolean" &&
    typeof summary.handoffReadyForSameBasisAuthority === "boolean" &&
    typeof summary.sourceSideAuthorityAvailable === "boolean" &&
    (summary.sourceSideAuthorityReady === null ||
      typeof summary.sourceSideAuthorityReady === "boolean") &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    isRecord(claimBoundary) &&
    claimBoundary.diagnosticOnly === true &&
    claimBoundary.experimentalPlanningOnly === true &&
    claimBoundary.packageDoesNotSupplyEvidence === true &&
    claimBoundary.receiptsMustBeMeasuredOrValidated === true &&
    claimBoundary.fullApparatusTensorRequired === true &&
    claimBoundary.downstreamGatesMustPassTogether === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.speedAuthorityClaimAllowed === false
  );
};
