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
  measurementStatuses: Array<{
    measurementId: string;
    evidenceArtifact: string;
    status: "missing" | "pass" | "fail" | "review";
    currentMargin: number | boolean | null;
    requiredCorrectionValue: number | boolean | null;
    goCriterion: string;
    noGoCriterion: string;
  }>;
  prevents: string[];
  evidenceRefs: string[];
  status: "ready_for_receipt" | "falsifying" | "blocked_by_downstream" | "satisfied";
  blocksCampaignPass: true;
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
    falsificationReportRef: string | null;
    authorityHandoffRef: string | null;
  };
  currentBlocker: Nhm2TileSourceFalsificationCurrentBlockerV1;
  objectiveCoverage: Nhm2TileSourceExperimentalCampaignObjectiveCoverageV1[];
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
    missingMeasurementCount: number;
    failingMeasurementCount: number;
    passingMeasurementCount: number;
    requiredArtifactCount: number;
    missingReceiptCount: number;
    failingReceiptCount: number;
    operatingBudgetBlockerCount: number;
    objectiveCoverageCount: number;
    openObjectiveCount: number;
    falsifyingObjectiveCount: number;
    satisfiedObjectiveCount: number;
    allObjectiveCoveragePresent: boolean;
    allEvidenceObjectivesSatisfied: boolean;
    handoffReadyForSameBasisAuthority: boolean;
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
  falsificationReportRef: string | null;
  authorityHandoffRef: string | null;
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
    falsificationReportRef: input.falsificationReportRef ?? null,
    authorityHandoffRef: input.authorityHandoffRef ?? null,
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
      falsificationReportRef: input.falsificationReportRef ?? null,
      authorityHandoffRef: input.authorityHandoffRef ?? null,
    },
    currentBlocker: input.falsificationReport.currentBlocker,
    objectiveCoverage,
    campaignItems,
    summary: {
      packageStatus: finalPackageStatus,
      firstCampaignDomain: firstItem?.campaignDomain ?? "none",
      firstBlocker: firstItem?.firstBlocker ?? "none",
      measurementCount,
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
      openObjectiveCount,
      falsifyingObjectiveCount,
      satisfiedObjectiveCount,
      allObjectiveCoveragePresent: objectiveCoverage.length === OBJECTIVE_POLICIES.length,
      allEvidenceObjectivesSatisfied:
        objectiveCoverage.length === OBJECTIVE_POLICIES.length &&
        objectiveCoverage.every((coverage) => coverage.status === "satisfied"),
      handoffReadyForSameBasisAuthority:
        input.authorityHandoff.summary.handoffReadyForSameBasisAuthority,
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
  value.length > 0 &&
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
        typeof entry.requiredCorrectionValue === "number" ||
        typeof entry.requiredCorrectionValue === "boolean") &&
      typeof entry.goCriterion === "string" &&
      typeof entry.noGoCriterion === "string",
  );

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
    typeof summary.missingMeasurementCount === "number" &&
    typeof summary.failingMeasurementCount === "number" &&
    typeof summary.passingMeasurementCount === "number" &&
    typeof summary.requiredArtifactCount === "number" &&
    typeof summary.missingReceiptCount === "number" &&
    typeof summary.failingReceiptCount === "number" &&
    typeof summary.operatingBudgetBlockerCount === "number" &&
    typeof summary.objectiveCoverageCount === "number" &&
    summary.objectiveCoverageCount === value.objectiveCoverage.length &&
    typeof summary.openObjectiveCount === "number" &&
    typeof summary.falsifyingObjectiveCount === "number" &&
    typeof summary.satisfiedObjectiveCount === "number" &&
    typeof summary.allObjectiveCoveragePresent === "boolean" &&
    typeof summary.allEvidenceObjectivesSatisfied === "boolean" &&
    typeof summary.handoffReadyForSameBasisAuthority === "boolean" &&
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
