import type {
  Nhm2TileSourceFalsificationReportV1,
  Nhm2TileSourceFrontierResolutionItemV1,
} from "./nhm2-tile-source-falsification-report.v1";
import type { Nhm2TileSourceMaterialEvidenceReceiptsV1 } from "./nhm2-tile-source-material-evidence-receipts.v1";
import type {
  Nhm2TileSourceOperatingBudgetCorrectionValueV1,
  Nhm2TileSourceOperatingBudgetReadinessV1,
} from "./nhm2-tile-source-operating-budget-readiness.v1";
import type { Nhm2TileSourcePhysicalValidationPlanV1 } from "./nhm2-tile-source-physical-validation-plan.v1";

export const NHM2_TILE_SOURCE_AUTHORITY_HANDOFF_CONTRACT_VERSION =
  "nhm2_tile_source_authority_handoff/v1";

export type Nhm2TileSourceAuthorityHandoffStatus =
  | "handoff_ready"
  | "review"
  | "blocked"
  | "falsified";

export type Nhm2TileSourceAuthorityHandoffGateV1 = {
  gateId:
    | "material_receipts"
    | "full_apparatus_tensor"
    | "source_authority_metadata"
    | "component_coverage"
    | "component_detail_refs"
    | "regional_coverage"
    | "no_metric_target_echo"
    | "operating_budget_readiness"
    | "falsification_report";
  status: "pass" | "review" | "fail" | "missing";
  blockers: string[];
  requiredChange: string;
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
};

export type Nhm2TileSourceAuthorityHandoffV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_AUTHORITY_HANDOFF_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
    physicalValidationPlanRef: string | null;
    falsificationReportRef: string | null;
    operatingBudgetReadinessRef: string | null;
    fullApparatusTensorOperatingBudgetRef: string | null;
    targetAuthorityContractRef: "nhm2_source_side_same_basis_tensor_authority/v1";
  };
  handoffTarget: {
    targetContractVersion: "nhm2_source_side_same_basis_tensor_authority/v1";
    requiresSameChart: true;
    requiresSameBasis: true;
    requiresSameUnits: true;
    requiresFullComponents: ["T00", "T0i", "diagonalTij", "offDiagonalTij"];
    requiresTensorComponents: [
      "T00",
      "T01",
      "T02",
      "T03",
      "T11",
      "T12",
      "T13",
      "T22",
      "T23",
      "T33"
    ];
    requiresRegions: ["wall", "hull", "exterior_shell"];
    metricTargetEchoForbidden: true;
  };
  gates: Nhm2TileSourceAuthorityHandoffGateV1[];
  frontierResolutionQueue: Nhm2TileSourceFrontierResolutionItemV1[];
  summary: {
    handoffStatus: Nhm2TileSourceAuthorityHandoffStatus;
    handoffReadyForSameBasisAuthority: boolean;
    materialEvidenceReady: boolean;
    fullApparatusTensorReady: boolean;
    fullApparatusComponentDetailRefsReady: boolean;
    sourceAuthorityEvidenceReady: boolean;
    allReceiptsPresent: boolean;
    operatingBudgetsReady: boolean;
    operatingBudgetsFalsifyCurrentCandidate: boolean;
    physicalValidationStillRequired: boolean;
    firstBlocker: string;
    firstRequiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
    firstFrontierResolutionMode: Nhm2TileSourceFrontierResolutionItemV1["resolutionMode"] | "none";
    firstFrontierCampaignDomain: Nhm2TileSourceFrontierResolutionItemV1["campaignDomain"] | "none";
    frontierResolutionItemCount: number;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    handoffOnly: true;
    handoffDoesNotRunSameBasisAuthority: true;
    handoffDoesNotRunDownstreamGates: true;
    operatingBudgetReadinessDoesNotValidateMaterialSource: true;
    handoffReadyIsNotPhysicalCredibility: true;
    handoffCarriesFrontierQueueOnly: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceAuthorityHandoffInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  physicalValidationPlan: Nhm2TileSourcePhysicalValidationPlanV1;
  falsificationReport: Nhm2TileSourceFalsificationReportV1;
  operatingBudgetReadiness?: Nhm2TileSourceOperatingBudgetReadinessV1 | null;
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
  falsificationReportRef?: string | null;
  operatingBudgetReadinessRef?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0)),
  );

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isCorrectionValue = (
  value: unknown,
): value is Nhm2TileSourceOperatingBudgetCorrectionValueV1 =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  isFiniteNumber(value) ||
  (Array.isArray(value) && value.every((entry) => typeof entry === "string"));

const isDecisiveMeasurementList = (value: unknown): boolean =>
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
        typeof measurement.currentMargin === "boolean" ||
        (typeof measurement.currentMargin === "number" &&
          Number.isFinite(measurement.currentMargin))) &&
      (measurement.requiredCorrectionKey === null ||
        typeof measurement.requiredCorrectionKey === "string") &&
      (measurement.requiredCorrectionValue === null ||
        isCorrectionValue(measurement.requiredCorrectionValue)) &&
      typeof measurement.goCriterion === "string" &&
      typeof measurement.noGoCriterion === "string" &&
      typeof measurement.falsificationConsequence === "string",
  );

const isFrontierResolutionItem = (
  value: unknown,
): value is Nhm2TileSourceFrontierResolutionItemV1 => {
  if (!isRecord(value)) return false;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    typeof value.rank === "number" &&
    Number.isInteger(value.rank) &&
    value.rank > 0 &&
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
    [
      "supply_experimental_receipt",
      "revise_architecture_or_operating_margin",
      "supply_same_basis_full_apparatus_tensor",
      "rerun_downstream_gate",
      "supply_operating_budget_receipt",
      "resolve_open_review",
    ].includes(String(value.resolutionMode)) &&
    typeof value.firstBlocker === "string" &&
    Array.isArray(value.blockerIds) &&
    value.blockerIds.every((entry) => typeof entry === "string") &&
    (value.numericalMargin === null ||
      (typeof value.numericalMargin === "number" && Number.isFinite(value.numericalMargin))) &&
    ["below_one_fails", "boolean_or_missing", "not_numeric"].includes(
      String(value.marginInterpretation),
    ) &&
    typeof value.evidenceTarget === "string" &&
    typeof value.requiredChange === "string" &&
    typeof value.nextEvidenceArtifact === "string" &&
    typeof value.measurementTargetSummary === "string" &&
    typeof value.falsificationRule === "string" &&
    isRecord(value.requiredCorrections) &&
    Object.values(value.requiredCorrections).every(isCorrectionValue) &&
    isDecisiveMeasurementList(value.decisiveMeasurements) &&
    Array.isArray(value.prevents) &&
    value.prevents.every((entry) => typeof entry === "string") &&
    Array.isArray(value.evidenceRefs) &&
    value.evidenceRefs.every((entry) => typeof entry === "string") &&
    value.blocksCampaignPass === true &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.resolutionQueueDoesNotSupplyEvidence === true &&
    boundary.resolvingItemRequiresNewReceiptOrArtifact === true
  );
};

const correctionRecord = (
  value: unknown,
): Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> => {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(
    Object.entries(record).filter(([, entry]) => isCorrectionValue(entry)),
  ) as Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
};

const mergeCorrectionRecords = (
  records: Array<Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> | null | undefined>,
): Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> => {
  const merged: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(correctionRecord(record))) {
      merged[key] = value;
    }
  }
  return merged;
};

const gate = (args: {
  gateId: Nhm2TileSourceAuthorityHandoffGateV1["gateId"];
  pass: boolean;
  fail?: boolean;
  missing?: boolean;
  blockers: string[];
  requiredChange: string;
  requiredCorrections?: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> | null;
}): Nhm2TileSourceAuthorityHandoffGateV1 => ({
  gateId: args.gateId,
  status: args.pass ? "pass" : args.fail ? "fail" : args.missing ? "missing" : "review",
  blockers: args.pass ? [] : unique(args.blockers),
  requiredChange: args.requiredChange,
  requiredCorrections: args.pass ? {} : correctionRecord(args.requiredCorrections),
});

const surfaceBlockers = (
  receipts: Nhm2TileSourceMaterialEvidenceReceiptsV1,
  surfaceId: string,
): string[] =>
  receipts.receiptSurfaces.find((surface) => surface.surfaceId === surfaceId)?.blockers ?? [
    `${surfaceId}_receipt_missing`,
  ];

const tensorAuthority = (
  plan: Nhm2TileSourcePhysicalValidationPlanV1,
): Nhm2TileSourcePhysicalValidationPlanV1["tensorAuthorityGate"] => plan.tensorAuthorityGate;

const fullApparatusOperatingStatus = (
  operatingBudgetReadiness: Nhm2TileSourceOperatingBudgetReadinessV1 | null,
) =>
  operatingBudgetReadiness?.budgetStatuses.find(
    (status) => status.surfaceId === "full_apparatus_tensor",
  ) ?? null;

const operatingBudgetCorrectionRecords = (
  operatingBudgetReadiness: Nhm2TileSourceOperatingBudgetReadinessV1 | null,
  surfaceIds?: string[],
): Array<Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>> =>
  operatingBudgetReadiness == null
    ? []
    : operatingBudgetReadiness.budgetStatuses
        .filter((status) => surfaceIds == null || surfaceIds.includes(status.surfaceId))
        .map((status) =>
          Object.fromEntries(
            Object.entries(status.requiredCorrections).map(([key, value]) => [
              `${status.surfaceId}.${key}`,
              value,
            ]),
          ),
        );

export const buildNhm2TileSourceAuthorityHandoff = (
  input: BuildNhm2TileSourceAuthorityHandoffInput,
): Nhm2TileSourceAuthorityHandoffV1 => {
  const receipts = input.materialEvidenceReceipts;
  const plan = input.physicalValidationPlan;
  const report = input.falsificationReport;
  const operatingBudgetReadiness = input.operatingBudgetReadiness ?? null;
  const tensorGate = tensorAuthority(plan);
  const authorityBlockers = unique(tensorGate.blockers);
  const materialReceiptBlockers = receipts.receiptSurfaces
    .filter((surface) => surface.surfaceId !== "full_apparatus_tensor" && surface.status !== "pass")
    .flatMap((surface) => surface.blockers);
  const fullTensorBlockers = surfaceBlockers(receipts, "full_apparatus_tensor");
  const sourceAuthorityEvidenceReady =
    receipts.summary.sourceAuthorityEvidenceReady &&
    tensorGate.sourceTensorAuthorityCandidateAllowed;
  const operatingBudgetBlockers =
    operatingBudgetReadiness == null
      ? ["operating_budget_readiness_missing"]
      : operatingBudgetReadiness.blockers;
  const operatingBudgetsReady =
    operatingBudgetReadiness?.summary.allOperatingBudgetsReady === true;
  const fullApparatusBudgetStatus = fullApparatusOperatingStatus(operatingBudgetReadiness);
  const fullApparatusComponentDetailRefsReady =
    fullApparatusBudgetStatus?.numericalMargins.componentDetailRefsComplete === true;
  const componentDetailRefBlockers =
    fullApparatusBudgetStatus == null
      ? ["full_apparatus_tensor_operating_budget_missing_for_component_detail_handoff"]
      : fullApparatusBudgetStatus.blockers.filter(
          (blocker) =>
            blocker.includes("_ref_missing_for_operating_budget") &&
            /full_apparatus_T(00_detail|0[1-3]|1[1-3]|2[23]|33)_ref_missing_for_operating_budget/.test(
              blocker,
            ),
        );
  const gates: Nhm2TileSourceAuthorityHandoffGateV1[] = [
    gate({
      gateId: "material_receipts",
      pass: receipts.summary.materialEvidenceReady,
      fail: receipts.receiptSurfaces.some(
        (surface) => surface.surfaceId !== "full_apparatus_tensor" && surface.status === "fail",
      ),
      missing: receipts.receiptSurfaces.some(
        (surface) => surface.surfaceId !== "full_apparatus_tensor" && surface.status === "missing",
      ),
      blockers: materialReceiptBlockers,
      requiredChange:
        "Supply measured or validated material, force-gap, roughness/patch, active-control, fatigue, and layer-scaling receipts.",
      requiredCorrections: mergeCorrectionRecords(
        operatingBudgetCorrectionRecords(operatingBudgetReadiness, [
          "material_coupon",
          "force_gap_load",
          "roughness_patch",
          "active_control",
          "fatigue_layer_scaling",
        ]),
      ),
    }),
    gate({
      gateId: "full_apparatus_tensor",
      pass: receipts.summary.fullApparatusTensorReady,
      fail: receipts.receiptSurfaces.some(
        (surface) => surface.surfaceId === "full_apparatus_tensor" && surface.status === "fail",
      ),
      missing: receipts.receiptSurfaces.some(
        (surface) => surface.surfaceId === "full_apparatus_tensor" && surface.status === "missing",
      ),
      blockers: fullTensorBlockers,
      requiredChange:
        "Supply a source-side full apparatus tensor including support, spacer, active-control, thermal, electrostatic, fatigue, layer-scaling, Casimir, and material-strain terms.",
      requiredCorrections: mergeCorrectionRecords(
        operatingBudgetCorrectionRecords(operatingBudgetReadiness, ["full_apparatus_tensor"]),
      ),
    }),
    gate({
      gateId: "source_authority_metadata",
      pass:
        tensorGate.sameChart === "pass" &&
        tensorGate.sameBasis === "pass" &&
        tensorGate.sameUnits === "pass",
      blockers: unique([
        tensorGate.sameChart === "pass" ? null : "same_chart_metadata_missing",
        tensorGate.sameBasis === "pass" ? null : "same_basis_metadata_missing",
        tensorGate.sameUnits === "pass" ? null : "same_units_metadata_missing",
        ...authorityBlockers,
      ]),
      requiredChange: "Supply same chart, same basis, and same unit metadata for the apparatus tensor.",
      requiredCorrections: {},
    }),
    gate({
      gateId: "component_coverage",
      pass:
        tensorGate.fullTensorComponents.T00 === "pass" &&
        tensorGate.fullTensorComponents.T0i === "pass" &&
        tensorGate.fullTensorComponents.diagonalTij === "pass" &&
        tensorGate.fullTensorComponents.offDiagonalTij === "pass",
      blockers: unique([
        tensorGate.fullTensorComponents.T00 === "pass" ? null : "T00_component_missing",
        tensorGate.fullTensorComponents.T0i === "pass" ? null : "T0i_components_missing",
        tensorGate.fullTensorComponents.diagonalTij === "pass"
          ? null
          : "diagonal_Tij_components_missing",
        tensorGate.fullTensorComponents.offDiagonalTij === "pass"
          ? null
          : "off_diagonal_Tij_components_missing",
        ...authorityBlockers,
      ]),
      requiredChange:
        "Supply source-side T00, T0i, diagonal Tij, and off-diagonal Tij without zero-filling missing components.",
      requiredCorrections: mergeCorrectionRecords(
        operatingBudgetCorrectionRecords(operatingBudgetReadiness, ["full_apparatus_tensor"]),
      ),
    }),
    gate({
      gateId: "component_detail_refs",
      pass: fullApparatusComponentDetailRefsReady,
      fail: fullApparatusBudgetStatus?.falsifiesCurrentCandidate === true,
      missing: fullApparatusBudgetStatus == null,
      blockers:
        componentDetailRefBlockers.length > 0
          ? componentDetailRefBlockers
          : fullApparatusComponentDetailRefsReady
            ? []
            : ["full_apparatus_component_detail_refs_incomplete"],
      requiredChange:
        "Supply component-level full-apparatus tensor refs for T00, T01, T02, T03, T11, T12, T13, T22, T23, and T33 before same-basis authority handoff.",
      requiredCorrections: mergeCorrectionRecords([
        fullApparatusBudgetStatus?.requiredCorrections ?? null,
      ]),
    }),
    gate({
      gateId: "regional_coverage",
      pass:
        tensorGate.regionalCompatibility.wall === "pass" &&
        tensorGate.regionalCompatibility.hull === "pass" &&
        tensorGate.regionalCompatibility.exteriorShell === "pass",
      blockers: unique([
        tensorGate.regionalCompatibility.wall === "pass" ? null : "wall_region_tensor_missing",
        tensorGate.regionalCompatibility.hull === "pass" ? null : "hull_region_tensor_missing",
        tensorGate.regionalCompatibility.exteriorShell === "pass"
          ? null
          : "exterior_shell_region_tensor_missing",
        ...authorityBlockers,
      ]),
      requiredChange: "Supply wall, hull, and exterior-shell tensor coverage on the same regional supports.",
      requiredCorrections: mergeCorrectionRecords(
        operatingBudgetCorrectionRecords(operatingBudgetReadiness, ["full_apparatus_tensor"]),
      ),
    }),
    gate({
      gateId: "no_metric_target_echo",
      pass: tensorGate.noMetricTargetEcho === "pass",
      fail: tensorGate.noMetricTargetEcho === "fail",
      blockers: unique([
        tensorGate.noMetricTargetEcho === "pass" ? null : "metric_target_echo_check_missing_or_failed",
        ...authorityBlockers,
      ]),
      requiredChange:
        "Supply anti-target-echo provenance proving the source tensor was not copied or fitted from the metric-required tensor.",
      requiredCorrections: {},
    }),
    gate({
      gateId: "operating_budget_readiness",
      pass: operatingBudgetsReady,
      fail: operatingBudgetReadiness?.summary.anyOperatingBudgetFalsifies === true,
      missing: operatingBudgetReadiness == null,
      blockers: operatingBudgetBlockers,
      requiredChange:
        "Supply ready material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor operating budgets.",
      requiredCorrections: mergeCorrectionRecords(
        operatingBudgetCorrectionRecords(operatingBudgetReadiness),
      ),
    }),
    gate({
      gateId: "falsification_report",
      pass: report.disposition.reportStatus !== "falsified",
      fail: report.disposition.reportStatus === "falsified",
      blockers: report.blockerRows
        .filter((row) => row.falsifiesCurrentCandidate)
        .map((row) => row.blockerId),
      requiredChange: report.summary.nextRequiredChange,
      requiredCorrections: mergeCorrectionRecords([
        report.currentBlocker.requiredCorrections,
        report.correctionSummary,
      ]),
    }),
  ];
  const firstFailedGate = gates.find((entry) => entry.status !== "pass");
  const frontierResolutionQueue = report.frontierResolutionQueue;
  const firstFrontierItem = frontierResolutionQueue[0] ?? null;
  const handoffReady = gates.every((entry) => entry.status === "pass") && sourceAuthorityEvidenceReady;
  const handoffStatus: Nhm2TileSourceAuthorityHandoffStatus =
    report.disposition.reportStatus === "falsified" || gates.some((entry) => entry.status === "fail")
      ? "falsified"
      : handoffReady
        ? "handoff_ready"
        : gates.some((entry) => entry.status === "missing")
          ? "blocked"
          : "review";
  return {
    contractVersion: NHM2_TILE_SOURCE_AUTHORITY_HANDOFF_CONTRACT_VERSION,
    generatedAt: receipts.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receipts.selectedProfileId,
    frozenCandidateId: receipts.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
      physicalValidationPlanRef: input.physicalValidationPlanRef ?? null,
      falsificationReportRef: input.falsificationReportRef ?? null,
      operatingBudgetReadinessRef: input.operatingBudgetReadinessRef ?? null,
      fullApparatusTensorOperatingBudgetRef:
        operatingBudgetReadiness?.sourceRefs.full_apparatus_tensor ?? null,
      targetAuthorityContractRef: "nhm2_source_side_same_basis_tensor_authority/v1",
    },
    handoffTarget: {
      targetContractVersion: "nhm2_source_side_same_basis_tensor_authority/v1",
      requiresSameChart: true,
      requiresSameBasis: true,
      requiresSameUnits: true,
      requiresFullComponents: ["T00", "T0i", "diagonalTij", "offDiagonalTij"],
      requiresTensorComponents: [
        "T00",
        "T01",
        "T02",
        "T03",
        "T11",
        "T12",
        "T13",
        "T22",
        "T23",
        "T33",
      ],
      requiresRegions: ["wall", "hull", "exterior_shell"],
      metricTargetEchoForbidden: true,
    },
    gates,
    frontierResolutionQueue,
    summary: {
      handoffStatus,
      handoffReadyForSameBasisAuthority: handoffReady,
      materialEvidenceReady: receipts.summary.materialEvidenceReady,
      fullApparatusTensorReady: receipts.summary.fullApparatusTensorReady,
      fullApparatusComponentDetailRefsReady,
      sourceAuthorityEvidenceReady,
      allReceiptsPresent: plan.summary.allReceiptsPresent,
      operatingBudgetsReady,
      operatingBudgetsFalsifyCurrentCandidate:
        operatingBudgetReadiness?.summary.anyOperatingBudgetFalsifies ?? false,
      physicalValidationStillRequired: true,
      firstBlocker: firstFailedGate?.blockers[0] ?? firstFailedGate?.gateId ?? "none",
      firstRequiredCorrections: correctionRecord(firstFailedGate?.requiredCorrections ?? {}),
      firstFrontierResolutionMode: firstFrontierItem?.resolutionMode ?? "none",
      firstFrontierCampaignDomain: firstFrontierItem?.campaignDomain ?? "none",
      frontierResolutionItemCount: frontierResolutionQueue.length,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      handoffOnly: true,
      handoffDoesNotRunSameBasisAuthority: true,
      handoffDoesNotRunDownstreamGates: true,
      operatingBudgetReadinessDoesNotValidateMaterialSource: true,
      handoffReadyIsNotPhysicalCredibility: true,
      handoffCarriesFrontierQueueOnly: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceAuthorityHandoff = (
  value: unknown,
): value is Nhm2TileSourceAuthorityHandoffV1 => {
  if (!isRecord(value)) return false;
  const target = isRecord(value.handoffTarget) ? value.handoffTarget : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_AUTHORITY_HANDOFF_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    target != null &&
    target.targetContractVersion === "nhm2_source_side_same_basis_tensor_authority/v1" &&
    target.requiresSameChart === true &&
    target.requiresSameBasis === true &&
    target.requiresSameUnits === true &&
    Array.isArray(target.requiresFullComponents) &&
    target.requiresFullComponents.length === 4 &&
    Array.isArray(target.requiresTensorComponents) &&
    target.requiresTensorComponents.length === 10 &&
    Array.isArray(target.requiresRegions) &&
    target.requiresRegions.length === 3 &&
    target.metricTargetEchoForbidden === true &&
    Array.isArray(value.gates) &&
    value.gates.length === 9 &&
    value.gates.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.gateId === "string" &&
        ["pass", "review", "fail", "missing"].includes(String(entry.status)) &&
        Array.isArray(entry.blockers) &&
        typeof entry.requiredChange === "string" &&
        isRecord(entry.requiredCorrections) &&
        Object.values(entry.requiredCorrections).every(isCorrectionValue)
    ) &&
    Array.isArray(value.frontierResolutionQueue) &&
    value.frontierResolutionQueue.every((entry) => isFrontierResolutionItem(entry)) &&
    summary != null &&
    typeof summary.handoffStatus === "string" &&
    typeof summary.handoffReadyForSameBasisAuthority === "boolean" &&
    typeof summary.materialEvidenceReady === "boolean" &&
    typeof summary.fullApparatusTensorReady === "boolean" &&
    typeof summary.fullApparatusComponentDetailRefsReady === "boolean" &&
    typeof summary.sourceAuthorityEvidenceReady === "boolean" &&
    typeof summary.allReceiptsPresent === "boolean" &&
    typeof summary.operatingBudgetsReady === "boolean" &&
    typeof summary.operatingBudgetsFalsifyCurrentCandidate === "boolean" &&
    summary.physicalValidationStillRequired === true &&
    typeof summary.firstBlocker === "string" &&
    isRecord(summary.firstRequiredCorrections) &&
    Object.values(summary.firstRequiredCorrections).every(isCorrectionValue) &&
    typeof summary.firstFrontierResolutionMode === "string" &&
    typeof summary.firstFrontierCampaignDomain === "string" &&
    typeof summary.frontierResolutionItemCount === "number" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.handoffOnly === true &&
    boundary.handoffDoesNotRunSameBasisAuthority === true &&
    boundary.handoffDoesNotRunDownstreamGates === true &&
    boundary.operatingBudgetReadinessDoesNotValidateMaterialSource === true &&
    boundary.handoffReadyIsNotPhysicalCredibility === true &&
    boundary.handoffCarriesFrontierQueueOnly === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
