import type { Nhm2LayerStackReceiptSurfaceId } from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import type { Nhm2TileSourceEvidenceGapRoadmapV1 } from "./nhm2-tile-source-evidence-gap-roadmap.v1";
import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptStatus,
} from "./nhm2-tile-source-material-evidence-receipts.v1";
import type {
  Nhm2TileSourceDownstreamGateV1,
  Nhm2TileSourceGateStatus,
  Nhm2TileSourcePhysicalValidationPlanV1,
} from "./nhm2-tile-source-physical-validation-plan.v1";
import type {
  Nhm2TileSourceOperatingBudgetReadinessV1,
  Nhm2TileSourceOperatingBudgetCorrectionValueV1,
  Nhm2TileSourceOperatingBudgetSurfaceIdV1,
} from "./nhm2-tile-source-operating-budget-readiness.v1";

export const NHM2_TILE_SOURCE_FALSIFICATION_REPORT_CONTRACT_VERSION =
  "nhm2_tile_source_falsification_report/v1";

export type Nhm2TileSourceExperimentalCampaignDomainV1 =
  | "material_coupon_behavior"
  | "force_gap_pull_in"
  | "roughness_patch_potential"
  | "active_control_energy_noise_heat_timing"
  | "fatigue_layer_scaling"
  | "full_apparatus_tensor"
  | "downstream_residual_conservation_qei_observer"
  | "campaign_coordination";

export type Nhm2TileSourceCampaignDomainSummaryV1 = {
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1;
  blockerCount: number;
  falsifyingBlockerCount: number;
  reviewBlockerCount: number;
  firstBlocker: string;
  minimumNumericalMargin: number | null;
  evidenceTarget: string;
  nextRequiredChange: string;
  evidenceRefs: string[];
};

export type Nhm2TileSourceFalsificationReportRowV1 = {
  blockerId: string;
  source:
    | "material_evidence_receipts"
    | "physical_validation_plan"
    | "downstream_gate"
    | "evidence_gap_roadmap"
    | "operating_budget_readiness";
  surfaceId: Nhm2LayerStackReceiptSurfaceId | null;
  operatingBudgetSurfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1 | null;
  downstreamGateId: Nhm2TileSourceDownstreamGateV1["gateId"] | null;
  status: Nhm2TileSourceReceiptStatus | Nhm2TileSourceGateStatus | "open" | "falsifying" | "satisfied";
  numericalMargin: number | null;
  numericalMargins: Record<string, number | boolean | null>;
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  marginUnit: string | null;
  requiredChange: string;
  campaignDomain?: Nhm2TileSourceExperimentalCampaignDomainV1;
  evidenceTarget?: string;
  falsifiesCurrentCandidate: boolean;
  evidenceRef: string | null;
};

export type Nhm2TileSourceFalsificationCurrentBlockerV1 = {
  blockerId: string;
  source: Nhm2TileSourceFalsificationReportRowV1["source"] | "none";
  surfaceId: Nhm2LayerStackReceiptSurfaceId | null;
  operatingBudgetSurfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1 | null;
  downstreamGateId: Nhm2TileSourceDownstreamGateV1["gateId"] | null;
  status:
    | Nhm2TileSourceFalsificationReportRowV1["status"]
    | "none";
  numericalMargin: number | null;
  numericalMargins: Record<string, number | boolean | null>;
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  marginUnit: string | null;
  requiredChange: string;
  campaignDomain?: Nhm2TileSourceExperimentalCampaignDomainV1;
  evidenceTarget?: string;
  falsifiesCurrentCandidate: boolean;
  evidenceRef: string | null;
};

export type Nhm2TileSourceFalsificationReportV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_FALSIFICATION_REPORT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
    physicalValidationPlanRef: string | null;
    evidenceGapRoadmapRef: string | null;
    operatingBudgetReadinessRef: string | null;
  };
  disposition: {
    materialEvidenceDisposition: "receipt_ready" | "review" | "falsified";
    validationStatus: "physically_credible_source_candidate" | "review" | "falsified";
    reportStatus: "review" | "falsified" | "receipt_ready_pending_downstream" | "candidate_evidence_complete";
    firstBlocker: string;
  };
  currentBlocker: Nhm2TileSourceFalsificationCurrentBlockerV1;
  blockerRows: Nhm2TileSourceFalsificationReportRowV1[];
  campaignDomainSummary: Nhm2TileSourceCampaignDomainSummaryV1[];
  readiness: {
    materialEvidenceReady: boolean;
    fullApparatusTensorReady: boolean;
    sourceAuthorityEvidenceReady: boolean;
    allReceiptsPresent: boolean;
    operatingBudgetsReady: boolean;
    operatingBudgetsFalsifyCurrentCandidate: boolean;
    downstreamGatesPass: boolean;
    physicallyCredibleSourceCandidate: boolean;
  };
  summary: {
    blockerCount: number;
    falsifyingBlockerCount: number;
    reviewBlockerCount: number;
    missingReceiptCount: number;
    failingReceiptCount: number;
    operatingBudgetBlockerCount: number;
    falsifyingOperatingBudgetCount: number;
    failingDownstreamGateCount: number;
    nextRequiredSurfaceId: Nhm2LayerStackReceiptSurfaceId | "none";
    nextRequiredChange: string;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    falsificationReportOnly: true;
    reportDoesNotSupplyEvidence: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    sourceCandidateRequiresFullApparatusTensor: true;
    downstreamGatesMustPassTogether: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceFalsificationReportInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  physicalValidationPlan: Nhm2TileSourcePhysicalValidationPlanV1;
  evidenceGapRoadmap: Nhm2TileSourceEvidenceGapRoadmapV1;
  operatingBudgetReadiness?: Nhm2TileSourceOperatingBudgetReadinessV1 | null;
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
  evidenceGapRoadmapRef?: string | null;
  operatingBudgetReadinessRef?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const receiptRows = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
): Nhm2TileSourceFalsificationReportRowV1[] =>
  receipts.falsificationMap.map((entry) => {
    const surface = receipts.receiptSurfaces.find(
      (candidate) => candidate.surfaceId === entry.surfaceId,
    );
    return {
      blockerId: entry.blocker,
      source: "material_evidence_receipts",
      surfaceId: entry.surfaceId,
      operatingBudgetSurfaceId: null,
      downstreamGateId: null,
      status: surface?.status ?? "review",
      numericalMargin: entry.numericalMargin,
      numericalMargins: {},
      requiredCorrections: {},
      marginUnit: entry.marginUnit,
      requiredChange: entry.requiredChange,
      falsifiesCurrentCandidate: entry.falsifiesCurrentCandidate,
      evidenceRef: surface?.evidenceRef ?? null,
    };
  });

const validationRows = (
  plan: Nhm2TileSourcePhysicalValidationPlanV1,
  receiptBlockerIds: Set<string>,
  downstreamBlockerIds: Set<string>,
  operatingBudgetBlockerIds: Set<string>,
): Nhm2TileSourceFalsificationReportRowV1[] =>
  plan.falsificationMap
    .filter(
      (entry) =>
        !receiptBlockerIds.has(entry.blocker) &&
        !downstreamBlockerIds.has(entry.blocker) &&
        !operatingBudgetBlockerIds.has(entry.blocker),
    )
    .map((entry) => ({
      blockerId: entry.blocker,
      source: "physical_validation_plan",
      surfaceId: null,
      operatingBudgetSurfaceId: null,
      downstreamGateId: null,
      status: entry.falsifiesCurrentCandidate ? "fail" : "review",
      numericalMargin: entry.numericalMargin,
      numericalMargins: {},
      requiredCorrections: {},
      marginUnit: entry.marginUnit,
      requiredChange: entry.requiredChange,
      falsifiesCurrentCandidate: entry.falsifiesCurrentCandidate,
      evidenceRef: null,
    }));

const downstreamRows = (
  plan: Nhm2TileSourcePhysicalValidationPlanV1,
): Nhm2TileSourceFalsificationReportRowV1[] =>
  plan.downstreamGates.flatMap((gate) =>
    gate.status === "pass"
      ? []
      : gate.blockers.map((blocker) => ({
          blockerId: blocker,
          source: "downstream_gate" as const,
          surfaceId: null,
          operatingBudgetSurfaceId: null,
          downstreamGateId: gate.gateId,
          status: gate.status,
          numericalMargin: null,
          numericalMargins: {},
          requiredCorrections: {},
          marginUnit: null,
          requiredChange: gate.requiredChange,
          falsifiesCurrentCandidate: gate.status === "fail",
          evidenceRef: gate.artifactRef,
        })),
  );

const marginSummary = (margins: Record<string, number | boolean | null>): string => {
  const entries = Object.entries(margins).filter(([, value]) => value !== null);
  return entries.length === 0
    ? "no finite margin supplied"
    : entries.map(([key, value]) => `${key}=${String(value)}`).join(", ");
};

const correctionSummary = (
  corrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>,
): string => {
  const entries = Object.entries(corrections).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    if (typeof value === "boolean") return value === true;
    return value != null && value !== "none";
  });
  return entries.length === 0
    ? "no correction delta supplied"
    : entries
        .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join("|") : String(value)}`)
        .join(", ");
};

const minimumNumericalMargin = (
  margins: Record<string, number | boolean | null>,
): number | null => {
  const values = Object.values(margins).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return values.length === 0 ? null : Math.min(...values);
};

const CAMPAIGN_DOMAIN_ORDER = [
  "material_coupon_behavior",
  "force_gap_pull_in",
  "roughness_patch_potential",
  "active_control_energy_noise_heat_timing",
  "fatigue_layer_scaling",
  "full_apparatus_tensor",
  "downstream_residual_conservation_qei_observer",
  "campaign_coordination",
] as const satisfies readonly Nhm2TileSourceExperimentalCampaignDomainV1[];

const domainFromSurface = (
  surfaceId:
    | Nhm2LayerStackReceiptSurfaceId
    | Nhm2TileSourceOperatingBudgetSurfaceIdV1
    | null,
): Nhm2TileSourceExperimentalCampaignDomainV1 => {
  switch (surfaceId) {
    case "material_coupon":
      return "material_coupon_behavior";
    case "force_gap_pull_in":
    case "force_gap_load":
      return "force_gap_pull_in";
    case "roughness_patch_metrology":
    case "roughness_patch":
      return "roughness_patch_potential";
    case "active_control_energy":
    case "active_control":
      return "active_control_energy_noise_heat_timing";
    case "fatigue_lifetime":
    case "layer_scaling":
    case "fatigue_layer_scaling":
      return "fatigue_layer_scaling";
    case "full_apparatus_tensor":
      return "full_apparatus_tensor";
    default:
      return "campaign_coordination";
  }
};

const evidenceTargetFromDomain = (
  domain: Nhm2TileSourceExperimentalCampaignDomainV1,
): string => {
  switch (domain) {
    case "material_coupon_behavior":
      return "Measured or validated ultra-high-stress TiN/candidate-stack coupon behavior: stress, fracture/yield, fatigue, cryogenic state, conductivity, dielectric response, roughness, and fabrication tolerance.";
    case "force_gap_pull_in":
      return "8 nm force-gap receipt: F(g), dF/dg, effective stiffness, pull-in margin, stiction margin, and active gap-control authority.";
    case "roughness_patch_potential":
      return "Roughness/asperity/patch receipt: RMS roughness, asperity-tail distribution versus 8 nm gap, patch-voltage map, and residual electrostatic correction.";
    case "active_control_energy_noise_heat_timing":
      return "Active-control receipt: energy per cycle, bandwidth, gap-noise spectrum, heat load, timing synchronization, and failure-mode coverage.";
    case "fatigue_layer_scaling":
      return "Fatigue/layer-scaling receipt: lifetime under cycling, layer nonadditivity, support coupling, active-area retention, and multiphysics coupling.";
    case "full_apparatus_tensor":
      return "Full apparatus source tensor receipt: source-side T00, T0i, diagonal Tij, and off-diagonal Tij including supports, spacers, controls, electrostatic, thermal, elastic, Casimir, fatigue, and layer-scaling terms.";
    case "downstream_residual_conservation_qei_observer":
      return "Downstream gate receipt: regional residual closure, covariant conservation, QEI worldline dossier, observer-family energy conditions, and coupled closure in one frozen chain.";
    case "campaign_coordination":
      return "Campaign coordination receipt: coherent refs, operating-budget evidence, and non-stale artifact handoff.";
  }
};

const annotateRow = (
  row: Nhm2TileSourceFalsificationReportRowV1,
): Nhm2TileSourceFalsificationReportRowV1 => {
  const campaignDomain =
    row.source === "downstream_gate"
      ? "downstream_residual_conservation_qei_observer"
      : domainFromSurface(row.surfaceId ?? row.operatingBudgetSurfaceId);
  return {
    ...row,
    campaignDomain,
    evidenceTarget: evidenceTargetFromDomain(campaignDomain),
  };
};

const rowNumericalMargin = (
  row: Nhm2TileSourceFalsificationReportRowV1,
): number | null => row.numericalMargin ?? minimumNumericalMargin(row.numericalMargins);

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => value != null && value.length > 0)),
  );

const buildCampaignDomainSummary = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
): Nhm2TileSourceCampaignDomainSummaryV1[] =>
  CAMPAIGN_DOMAIN_ORDER.map((campaignDomain) => {
    const domainRows = rows.filter((row) => row.campaignDomain === campaignDomain);
    const margins = domainRows
      .map(rowNumericalMargin)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const firstRow = domainRows[0] ?? null;
    return {
      campaignDomain,
      blockerCount: domainRows.length,
      falsifyingBlockerCount: domainRows.filter((row) => row.falsifiesCurrentCandidate).length,
      reviewBlockerCount: domainRows.filter((row) => !row.falsifiesCurrentCandidate).length,
      firstBlocker: firstRow?.blockerId ?? "none",
      minimumNumericalMargin: margins.length === 0 ? null : Math.min(...margins),
      evidenceTarget: firstRow?.evidenceTarget ?? evidenceTargetFromDomain(campaignDomain),
      nextRequiredChange: firstRow?.requiredChange ?? "none",
      evidenceRefs: uniqueText(domainRows.map((row) => row.evidenceRef)),
    };
  });

const operatingBudgetRows = (
  readiness: Nhm2TileSourceOperatingBudgetReadinessV1 | null | undefined,
): Nhm2TileSourceFalsificationReportRowV1[] =>
  readiness?.budgetStatuses.flatMap((status) =>
    status.ready
      ? []
      : status.blockers.map((blocker) => ({
          blockerId: `${status.surfaceId}:${blocker}`,
          source: "operating_budget_readiness" as const,
          surfaceId: null,
          operatingBudgetSurfaceId: status.surfaceId,
          downstreamGateId: null,
          status: status.falsifiesCurrentCandidate ? "falsifying" : "review",
          numericalMargin: minimumNumericalMargin(status.numericalMargins),
          numericalMargins: status.numericalMargins,
          requiredCorrections: status.requiredCorrections,
          marginUnit: "ratio_or_boolean_margin",
          requiredChange: `supply or revise ${status.surfaceId} operating evidence; ${marginSummary(
            status.numericalMargins,
          )}; corrections: ${correctionSummary(status.requiredCorrections)}`,
          falsifiesCurrentCandidate: status.falsifiesCurrentCandidate,
          evidenceRef: status.artifactRef,
        })),
  ) ?? [];

const currentBlockerFromRow = (
  row: Nhm2TileSourceFalsificationReportRowV1 | null,
): Nhm2TileSourceFalsificationCurrentBlockerV1 =>
  row == null
    ? {
        blockerId: "none",
        source: "none",
        surfaceId: null,
        operatingBudgetSurfaceId: null,
        downstreamGateId: null,
        status: "none",
        numericalMargin: null,
        numericalMargins: {},
        marginUnit: null,
        requiredChange: "none",
        requiredCorrections: {},
        campaignDomain: "campaign_coordination",
        evidenceTarget: evidenceTargetFromDomain("campaign_coordination"),
        falsifiesCurrentCandidate: false,
        evidenceRef: null,
      }
    : {
        blockerId: row.blockerId,
        source: row.source,
        surfaceId: row.surfaceId,
        operatingBudgetSurfaceId: row.operatingBudgetSurfaceId,
        downstreamGateId: row.downstreamGateId,
        status: row.status,
        numericalMargin: row.numericalMargin,
        numericalMargins: row.numericalMargins,
        requiredCorrections: row.requiredCorrections,
        marginUnit: row.marginUnit,
        requiredChange: row.requiredChange,
        ...(row.campaignDomain != null ? { campaignDomain: row.campaignDomain } : {}),
        ...(row.evidenceTarget != null ? { evidenceTarget: row.evidenceTarget } : {}),
        falsifiesCurrentCandidate: row.falsifiesCurrentCandidate,
        evidenceRef: row.evidenceRef,
      };

const reportStatus = (args: {
  materialDisposition: "receipt_ready" | "review" | "falsified";
  validationStatus: "physically_credible_source_candidate" | "review" | "falsified";
  allReceiptsPresent: boolean;
  downstreamGatesPass: boolean;
}): Nhm2TileSourceFalsificationReportV1["disposition"]["reportStatus"] => {
  if (args.materialDisposition === "falsified" || args.validationStatus === "falsified") {
    return "falsified";
  }
  if (args.validationStatus === "physically_credible_source_candidate") {
    return "candidate_evidence_complete";
  }
  if (args.allReceiptsPresent && !args.downstreamGatesPass) {
    return "receipt_ready_pending_downstream";
  }
  return "review";
};

export const buildNhm2TileSourceFalsificationReport = (
  input: BuildNhm2TileSourceFalsificationReportInput,
): Nhm2TileSourceFalsificationReportV1 => {
  const receipts = input.materialEvidenceReceipts;
  const plan = input.physicalValidationPlan;
  const roadmap = input.evidenceGapRoadmap;
  const budgetReadiness = input.operatingBudgetReadiness ?? null;
  const receiptBlockers = receiptRows(receipts);
  const receiptBlockerIds = new Set(receiptBlockers.map((row) => row.blockerId));
  const downstreamBlockerIds = new Set(
    plan.downstreamGates.flatMap((gate) => gate.blockers),
  );
  const budgetBlockers = operatingBudgetRows(budgetReadiness);
  const budgetBlockerIds = new Set(budgetBlockers.map((row) => row.blockerId));
  const rows = [
    ...receiptBlockers,
    ...validationRows(plan, receiptBlockerIds, downstreamBlockerIds, budgetBlockerIds),
    ...budgetBlockers,
    ...downstreamRows(plan),
  ].map(annotateRow);
  const firstRow = rows[0] ?? null;
  const currentBlocker = currentBlockerFromRow(firstRow);
  const campaignDomainSummary = buildCampaignDomainSummary(rows);
  const nextRoadmapItem = roadmap.roadmapItems.find(
    (item) => item.itemId === roadmap.summary.nextBestItemId,
  );
  const missingReceiptCount = receipts.receiptSurfaces.filter(
    (surface) => surface.status === "missing",
  ).length;
  const failingReceiptCount = receipts.receiptSurfaces.filter(
    (surface) => surface.status === "fail",
  ).length;
  const operatingBudgetBlockerCount = budgetBlockers.length;
  const falsifyingOperatingBudgetCount = budgetReadiness?.summary.falsifyingBudgetCount ?? 0;
  const failingDownstreamGateCount = plan.downstreamGates.filter(
    (gate) => gate.status === "fail",
  ).length;
  const finalReportStatus = reportStatus({
    materialDisposition: receipts.summary.candidateDisposition,
    validationStatus: plan.summary.sourceCandidateStatus,
    allReceiptsPresent: plan.summary.allReceiptsPresent,
    downstreamGatesPass: plan.summary.downstreamGatesPass,
  });
  return {
    contractVersion: NHM2_TILE_SOURCE_FALSIFICATION_REPORT_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
      physicalValidationPlanRef: input.physicalValidationPlanRef ?? null,
      evidenceGapRoadmapRef: input.evidenceGapRoadmapRef ?? null,
      operatingBudgetReadinessRef: input.operatingBudgetReadinessRef ?? null,
    },
    disposition: {
      materialEvidenceDisposition: receipts.summary.candidateDisposition,
      validationStatus: plan.summary.sourceCandidateStatus,
      reportStatus: finalReportStatus,
      firstBlocker: firstRow?.blockerId ?? "none",
    },
    currentBlocker,
    blockerRows: rows,
    campaignDomainSummary,
    readiness: {
      materialEvidenceReady: receipts.summary.materialEvidenceReady,
      fullApparatusTensorReady: receipts.summary.fullApparatusTensorReady,
      sourceAuthorityEvidenceReady: receipts.summary.sourceAuthorityEvidenceReady,
      allReceiptsPresent: plan.summary.allReceiptsPresent,
      operatingBudgetsReady: budgetReadiness?.summary.allOperatingBudgetsReady ?? false,
      operatingBudgetsFalsifyCurrentCandidate:
        budgetReadiness?.summary.anyOperatingBudgetFalsifies ?? false,
      downstreamGatesPass: plan.summary.downstreamGatesPass,
      physicallyCredibleSourceCandidate: plan.summary.physicallyCredibleSourceCandidate,
    },
    summary: {
      blockerCount: rows.length,
      falsifyingBlockerCount: rows.filter((row) => row.falsifiesCurrentCandidate).length,
      reviewBlockerCount: rows.filter((row) => !row.falsifiesCurrentCandidate).length,
      missingReceiptCount,
      failingReceiptCount,
      operatingBudgetBlockerCount,
      falsifyingOperatingBudgetCount,
      failingDownstreamGateCount,
      nextRequiredSurfaceId: roadmap.summary.nextBestItemId,
      nextRequiredChange: nextRoadmapItem?.decisionQuestion ?? "none",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      falsificationReportOnly: true,
      reportDoesNotSupplyEvidence: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      sourceCandidateRequiresFullApparatusTensor: true,
      downstreamGatesMustPassTogether: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

const isCorrectionRecord = (
  value: unknown,
): value is Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> =>
  isRecord(value) &&
  Object.values(value).every(
    (entry) =>
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "boolean" ||
      (typeof entry === "number" && Number.isFinite(entry)) ||
      (Array.isArray(entry) && entry.every((item) => typeof item === "string")),
  );

export const isNhm2TileSourceFalsificationReport = (
  value: unknown,
): value is Nhm2TileSourceFalsificationReportV1 => {
  if (!isRecord(value)) return false;
  const disposition = isRecord(value.disposition) ? value.disposition : null;
  const currentBlocker = isRecord(value.currentBlocker) ? value.currentBlocker : null;
  const readiness = isRecord(value.readiness) ? value.readiness : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_FALSIFICATION_REPORT_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    disposition != null &&
    typeof disposition.materialEvidenceDisposition === "string" &&
    typeof disposition.validationStatus === "string" &&
    typeof disposition.reportStatus === "string" &&
    typeof disposition.firstBlocker === "string" &&
    currentBlocker != null &&
    typeof currentBlocker.blockerId === "string" &&
    typeof currentBlocker.source === "string" &&
    (currentBlocker.surfaceId === null || typeof currentBlocker.surfaceId === "string") &&
    (currentBlocker.operatingBudgetSurfaceId === null ||
      typeof currentBlocker.operatingBudgetSurfaceId === "string") &&
    (currentBlocker.downstreamGateId === null ||
      typeof currentBlocker.downstreamGateId === "string") &&
    typeof currentBlocker.status === "string" &&
    (currentBlocker.numericalMargin === null ||
      typeof currentBlocker.numericalMargin === "number") &&
    isRecord(currentBlocker.numericalMargins) &&
    Object.values(currentBlocker.numericalMargins).every(
      (entry) =>
        entry === null ||
        typeof entry === "boolean" ||
        (typeof entry === "number" && Number.isFinite(entry)),
    ) &&
    isCorrectionRecord(currentBlocker.requiredCorrections) &&
    (currentBlocker.marginUnit === null || typeof currentBlocker.marginUnit === "string") &&
    typeof currentBlocker.requiredChange === "string" &&
    (currentBlocker.campaignDomain === undefined ||
      typeof currentBlocker.campaignDomain === "string") &&
    (currentBlocker.evidenceTarget === undefined ||
      typeof currentBlocker.evidenceTarget === "string") &&
    typeof currentBlocker.falsifiesCurrentCandidate === "boolean" &&
    (currentBlocker.evidenceRef === null || typeof currentBlocker.evidenceRef === "string") &&
    Array.isArray(value.blockerRows) &&
    value.blockerRows.every(
      (row) =>
        isRecord(row) &&
        typeof row.blockerId === "string" &&
        typeof row.source === "string" &&
        (row.surfaceId === null || typeof row.surfaceId === "string") &&
        (row.operatingBudgetSurfaceId === null ||
          typeof row.operatingBudgetSurfaceId === "string") &&
        (row.downstreamGateId === null || typeof row.downstreamGateId === "string") &&
        typeof row.status === "string" &&
        (row.numericalMargin === null || typeof row.numericalMargin === "number") &&
        isRecord(row.numericalMargins) &&
        Object.values(row.numericalMargins).every(
          (value) =>
            value === null ||
            typeof value === "boolean" ||
            (typeof value === "number" && Number.isFinite(value)),
        ) &&
        isCorrectionRecord(row.requiredCorrections) &&
        (row.marginUnit === null || typeof row.marginUnit === "string") &&
        typeof row.requiredChange === "string" &&
        (row.campaignDomain === undefined || typeof row.campaignDomain === "string") &&
        (row.evidenceTarget === undefined || typeof row.evidenceTarget === "string") &&
        typeof row.falsifiesCurrentCandidate === "boolean" &&
        (row.evidenceRef === null || typeof row.evidenceRef === "string"),
    ) &&
    Array.isArray(value.campaignDomainSummary) &&
    value.campaignDomainSummary.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.campaignDomain === "string" &&
        typeof entry.blockerCount === "number" &&
        typeof entry.falsifyingBlockerCount === "number" &&
        typeof entry.reviewBlockerCount === "number" &&
        typeof entry.firstBlocker === "string" &&
        (entry.minimumNumericalMargin === null ||
          (typeof entry.minimumNumericalMargin === "number" &&
            Number.isFinite(entry.minimumNumericalMargin))) &&
        typeof entry.evidenceTarget === "string" &&
        typeof entry.nextRequiredChange === "string" &&
        Array.isArray(entry.evidenceRefs) &&
        entry.evidenceRefs.every((ref) => typeof ref === "string"),
    ) &&
    readiness != null &&
    typeof readiness.materialEvidenceReady === "boolean" &&
    typeof readiness.fullApparatusTensorReady === "boolean" &&
    typeof readiness.sourceAuthorityEvidenceReady === "boolean" &&
    typeof readiness.allReceiptsPresent === "boolean" &&
    typeof readiness.operatingBudgetsReady === "boolean" &&
    typeof readiness.operatingBudgetsFalsifyCurrentCandidate === "boolean" &&
    typeof readiness.downstreamGatesPass === "boolean" &&
    typeof readiness.physicallyCredibleSourceCandidate === "boolean" &&
    summary != null &&
    typeof summary.blockerCount === "number" &&
    typeof summary.falsifyingBlockerCount === "number" &&
    typeof summary.reviewBlockerCount === "number" &&
    typeof summary.missingReceiptCount === "number" &&
    typeof summary.failingReceiptCount === "number" &&
    typeof summary.operatingBudgetBlockerCount === "number" &&
    typeof summary.falsifyingOperatingBudgetCount === "number" &&
    typeof summary.failingDownstreamGateCount === "number" &&
    typeof summary.nextRequiredSurfaceId === "string" &&
    typeof summary.nextRequiredChange === "string" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.falsificationReportOnly === true &&
    boundary.reportDoesNotSupplyEvidence === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.sourceCandidateRequiresFullApparatusTensor === true &&
    boundary.downstreamGatesMustPassTogether === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
