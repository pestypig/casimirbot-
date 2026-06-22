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

export const NHM2_TILE_SOURCE_FALSIFICATION_REPORT_CONTRACT_VERSION =
  "nhm2_tile_source_falsification_report/v1";

export type Nhm2TileSourceFalsificationReportRowV1 = {
  blockerId: string;
  source:
    | "material_evidence_receipts"
    | "physical_validation_plan"
    | "downstream_gate"
    | "evidence_gap_roadmap";
  surfaceId: Nhm2LayerStackReceiptSurfaceId | null;
  downstreamGateId: Nhm2TileSourceDownstreamGateV1["gateId"] | null;
  status: Nhm2TileSourceReceiptStatus | Nhm2TileSourceGateStatus | "open" | "falsifying" | "satisfied";
  numericalMargin: number | null;
  marginUnit: string | null;
  requiredChange: string;
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
  };
  disposition: {
    materialEvidenceDisposition: "receipt_ready" | "review" | "falsified";
    validationStatus: "physically_credible_source_candidate" | "review" | "falsified";
    reportStatus: "review" | "falsified" | "receipt_ready_pending_downstream" | "candidate_evidence_complete";
    firstBlocker: string;
  };
  blockerRows: Nhm2TileSourceFalsificationReportRowV1[];
  readiness: {
    materialEvidenceReady: boolean;
    fullApparatusTensorReady: boolean;
    sourceAuthorityEvidenceReady: boolean;
    allReceiptsPresent: boolean;
    downstreamGatesPass: boolean;
    physicallyCredibleSourceCandidate: boolean;
  };
  summary: {
    blockerCount: number;
    falsifyingBlockerCount: number;
    reviewBlockerCount: number;
    missingReceiptCount: number;
    failingReceiptCount: number;
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
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
  evidenceGapRoadmapRef?: string | null;
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
      downstreamGateId: null,
      status: surface?.status ?? "review",
      numericalMargin: entry.numericalMargin,
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
): Nhm2TileSourceFalsificationReportRowV1[] =>
  plan.falsificationMap
    .filter(
      (entry) =>
        !receiptBlockerIds.has(entry.blocker) && !downstreamBlockerIds.has(entry.blocker),
    )
    .map((entry) => ({
      blockerId: entry.blocker,
      source: "physical_validation_plan",
      surfaceId: null,
      downstreamGateId: null,
      status: entry.falsifiesCurrentCandidate ? "fail" : "review",
      numericalMargin: entry.numericalMargin,
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
          downstreamGateId: gate.gateId,
          status: gate.status,
          numericalMargin: null,
          marginUnit: null,
          requiredChange: gate.requiredChange,
          falsifiesCurrentCandidate: gate.status === "fail",
          evidenceRef: gate.artifactRef,
        })),
  );

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
  const receiptBlockers = receiptRows(receipts);
  const receiptBlockerIds = new Set(receiptBlockers.map((row) => row.blockerId));
  const downstreamBlockerIds = new Set(
    plan.downstreamGates.flatMap((gate) => gate.blockers),
  );
  const rows = [
    ...receiptBlockers,
    ...validationRows(plan, receiptBlockerIds, downstreamBlockerIds),
    ...downstreamRows(plan),
  ];
  const firstRow = rows[0] ?? null;
  const nextRoadmapItem = roadmap.roadmapItems.find(
    (item) => item.itemId === roadmap.summary.nextBestItemId,
  );
  const missingReceiptCount = receipts.receiptSurfaces.filter(
    (surface) => surface.status === "missing",
  ).length;
  const failingReceiptCount = receipts.receiptSurfaces.filter(
    (surface) => surface.status === "fail",
  ).length;
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
    },
    disposition: {
      materialEvidenceDisposition: receipts.summary.candidateDisposition,
      validationStatus: plan.summary.sourceCandidateStatus,
      reportStatus: finalReportStatus,
      firstBlocker: firstRow?.blockerId ?? "none",
    },
    blockerRows: rows,
    readiness: {
      materialEvidenceReady: receipts.summary.materialEvidenceReady,
      fullApparatusTensorReady: receipts.summary.fullApparatusTensorReady,
      sourceAuthorityEvidenceReady: receipts.summary.sourceAuthorityEvidenceReady,
      allReceiptsPresent: plan.summary.allReceiptsPresent,
      downstreamGatesPass: plan.summary.downstreamGatesPass,
      physicallyCredibleSourceCandidate: plan.summary.physicallyCredibleSourceCandidate,
    },
    summary: {
      blockerCount: rows.length,
      falsifyingBlockerCount: rows.filter((row) => row.falsifiesCurrentCandidate).length,
      reviewBlockerCount: rows.filter((row) => !row.falsifiesCurrentCandidate).length,
      missingReceiptCount,
      failingReceiptCount,
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

export const isNhm2TileSourceFalsificationReport = (
  value: unknown,
): value is Nhm2TileSourceFalsificationReportV1 => {
  if (!isRecord(value)) return false;
  const disposition = isRecord(value.disposition) ? value.disposition : null;
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
    Array.isArray(value.blockerRows) &&
    value.blockerRows.every(
      (row) =>
        isRecord(row) &&
        typeof row.blockerId === "string" &&
        typeof row.source === "string" &&
        (row.surfaceId === null || typeof row.surfaceId === "string") &&
        (row.downstreamGateId === null || typeof row.downstreamGateId === "string") &&
        typeof row.status === "string" &&
        (row.numericalMargin === null || typeof row.numericalMargin === "number") &&
        (row.marginUnit === null || typeof row.marginUnit === "string") &&
        typeof row.requiredChange === "string" &&
        typeof row.falsifiesCurrentCandidate === "boolean" &&
        (row.evidenceRef === null || typeof row.evidenceRef === "string"),
    ) &&
    readiness != null &&
    typeof readiness.materialEvidenceReady === "boolean" &&
    typeof readiness.fullApparatusTensorReady === "boolean" &&
    typeof readiness.sourceAuthorityEvidenceReady === "boolean" &&
    typeof readiness.allReceiptsPresent === "boolean" &&
    typeof readiness.downstreamGatesPass === "boolean" &&
    typeof readiness.physicallyCredibleSourceCandidate === "boolean" &&
    summary != null &&
    typeof summary.blockerCount === "number" &&
    typeof summary.falsifyingBlockerCount === "number" &&
    typeof summary.reviewBlockerCount === "number" &&
    typeof summary.missingReceiptCount === "number" &&
    typeof summary.failingReceiptCount === "number" &&
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
