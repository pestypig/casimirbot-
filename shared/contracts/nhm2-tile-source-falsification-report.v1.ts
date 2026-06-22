import type { Nhm2LayerStackReceiptSurfaceId } from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import type {
  Nhm2TileSourceEvidenceGapRoadmapItemV1,
  Nhm2TileSourceEvidenceGapRoadmapV1,
} from "./nhm2-tile-source-evidence-gap-roadmap.v1";
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
import type { Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 } from "./nhm2-source-side-same-basis-tensor-authority.v1";

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

export type Nhm2TileSourceCampaignDecisionV1 = {
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
  blockerCount: number;
  falsifyingBlockerCount: number;
  minimumNumericalMargin: number | null;
  evidenceTarget: string;
  nextRequiredChange: string;
  prevents: string[];
  requiredCorrectionKeys: string[];
  evidenceRefs: string[];
  blocksCampaignPass: boolean;
  claimBoundary: {
    diagnosticOnly: true;
    decisionMatrixDoesNotSupplyEvidence: true;
    noGoMeansCurrentCandidateOnly: true;
  };
};

export type Nhm2TileSourceFrontierResolutionModeV1 =
  | "supply_experimental_receipt"
  | "revise_architecture_or_operating_margin"
  | "supply_same_basis_full_apparatus_tensor"
  | "rerun_downstream_gate"
  | "supply_operating_budget_receipt"
  | "resolve_open_review";

export type Nhm2TileSourceFrontierResolutionItemV1 = {
  rank: number;
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1;
  decision: Nhm2TileSourceCampaignDecisionV1["decision"];
  evidenceState: Nhm2TileSourceCampaignDecisionV1["evidenceState"];
  resolutionMode: Nhm2TileSourceFrontierResolutionModeV1;
  firstBlocker: string;
  blockerIds: string[];
  numericalMargin: number | null;
  marginInterpretation: "below_one_fails" | "boolean_or_missing" | "not_numeric";
  evidenceTarget: string;
  requiredChange: string;
  nextEvidenceArtifact: string;
  measurementTargetSummary: string;
  falsificationRule: string;
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  decisiveMeasurements: Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"];
  prevents: string[];
  evidenceRefs: string[];
  blocksCampaignPass: true;
  claimBoundary: {
    diagnosticOnly: true;
    resolutionQueueDoesNotSupplyEvidence: true;
    resolvingItemRequiresNewReceiptOrArtifact: true;
  };
};

export type Nhm2TileSourceFalsificationReportRowV1 = {
  blockerId: string;
  source:
    | "material_evidence_receipts"
    | "physical_validation_plan"
    | "source_side_same_basis_authority"
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
  decisiveMeasurements: Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"];
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
    sourceSideSameBasisTensorAuthorityRef: string | null;
  };
  disposition: {
    materialEvidenceDisposition: "receipt_ready" | "review" | "falsified";
    validationStatus: "physically_credible_source_candidate" | "review" | "falsified";
    reportStatus: "review" | "falsified" | "receipt_ready_pending_downstream" | "candidate_evidence_complete";
    firstBlocker: string;
  };
  currentBlocker: Nhm2TileSourceFalsificationCurrentBlockerV1;
  correctionSummary: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  blockerRows: Nhm2TileSourceFalsificationReportRowV1[];
  campaignDomainSummary: Nhm2TileSourceCampaignDomainSummaryV1[];
  goNoGoMatrix: Nhm2TileSourceCampaignDecisionV1[];
  frontierResolutionQueue: Nhm2TileSourceFrontierResolutionItemV1[];
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
  sourceSideSameBasisTensorAuthority?: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null;
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
  evidenceGapRoadmapRef?: string | null;
  operatingBudgetReadinessRef?: string | null;
  sourceSideSameBasisTensorAuthorityRef?: string | null;
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

const formatCorrectionSummary = (
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

const nextEvidenceArtifactFromDomain = (
  domain: Nhm2TileSourceExperimentalCampaignDomainV1,
  firstBlocker: string,
  evidenceState: Nhm2TileSourceCampaignDecisionV1["evidenceState"],
): string => {
  const missingReceipt = evidenceState === "missing_receipt";
  switch (domain) {
    case "material_coupon_behavior":
      return !missingReceipt && (firstBlocker.includes("fracture") || firstBlocker.includes("yield"))
        ? "receipt://material_coupon/fracture_yield_margin_v1"
        : "receipt://material_coupon/provenance_v1";
    case "force_gap_pull_in":
      return !missingReceipt && firstBlocker.includes("force_gradient")
        ? "receipt://force_gap_pull_in/force_gradient_8nm_v1"
        : "receipt://force_gap_pull_in/provenance_v1";
    case "roughness_patch_potential":
      return !missingReceipt && firstBlocker.includes("roughness")
        ? "receipt://roughness_patch_metrology/roughness_rms_v1"
        : "receipt://roughness_patch_metrology/provenance_v1";
    case "active_control_energy_noise_heat_timing":
      return "receipt://active_control/provenance_v1";
    case "fatigue_layer_scaling":
      return !missingReceipt && firstBlocker.includes("cycle")
        ? "receipt://fatigue_layer_scaling/cycle_margin_v1"
        : "receipt://fatigue_layer_scaling/provenance_v1";
    case "full_apparatus_tensor":
      return !missingReceipt &&
        (firstBlocker.includes("T0") ||
          firstBlocker.includes("T1") ||
          firstBlocker.includes("T2") ||
          firstBlocker.includes("T3"))
        ? "receipt://full_apparatus_tensor/component_detail_refs_v1"
        : "receipt://full_apparatus_tensor/provenance_v1";
    case "downstream_residual_conservation_qei_observer":
      return "artifact://nhm2/downstream-gates/frozen-chain-rerun-v1";
    case "campaign_coordination":
      return "artifact://nhm2/campaign/reference-capsule-congruence-v1";
  }
};

const measurementTargetSummaryFromDomain = (
  domain: Nhm2TileSourceExperimentalCampaignDomainV1,
): string => {
  switch (domain) {
    case "material_coupon_behavior":
      return "TiN/candidate-stack coupon must supply measured/validated stress, fracture/yield, fatigue, cryogenic, conductivity, dielectric, roughness, and fabrication tolerance evidence; fracture/yield target is at least 2x the 545.707 MPa support-stress baseline.";
    case "force_gap_pull_in":
      return "8 nm gap receipt must supply F(g), dF/dg, stiffness model, pull-in margin > 1, stiction margin > 1, and active gap-control authority at least 1.2x the 447-layer force.";
    case "roughness_patch_potential":
      return "Paired-surface metrology must keep RMS roughness <= 1e-10 m, asperity tails below the 8 nm clearance envelope, patch voltage <= 0.01 V RMS, and residual electrostatic force <= 5% of the Casimir load.";
    case "active_control_energy_noise_heat_timing":
      return "Active-control evidence must include energy waveform, actuator authority, gap sensor calibration, >= 30 GHz bandwidth for 15 GHz switching, noise spectrum, heat-load/sink traces, timing/phase noise, lock acquisition, and failure modes.";
    case "fatigue_layer_scaling":
      return "Fatigue/layer-scaling evidence must cover cycle lifetime, thermal cycling, creep, delamination, adhesion, 447-layer scaling efficiency >= 0.9, nonadditivity <= 0.1, active area retention >= 0.6, and source-tensor retention >= 0.9.";
    case "full_apparatus_tensor":
      return "Full apparatus source tensor must provide nhm2_tile_source_full_apparatus_tensor_values/v1 with 10 component refs, 9 stress-energy term refs, wall/hull/exterior supports, same chart/basis/units, and no metric-target echo.";
    case "downstream_residual_conservation_qei_observer":
      return "Downstream chain must rerun regional residual closure, wall T00, covariant conservation, QEI worldline dossier, observer-family WEC/NEC/SEC/DEC, material credibility, and coupled closure against the same source tensor.";
    case "campaign_coordination":
      return "Campaign evidence must pin one frozen profile/run, artifact refs, source tensor values, receipt surfaces, source-authority handoff, and downstream gates without stale aliases or profile mismatches.";
  }
};

const falsificationRuleFromDomain = (
  domain: Nhm2TileSourceExperimentalCampaignDomainV1,
): string => {
  switch (domain) {
    case "material_coupon_behavior":
      return "If measured/validated coupon strength, cryogenic/material response, roughness, or fabrication margins do not meet the frozen candidate requirements, the 447-layer TiN stack remains review or is falsified.";
    case "force_gap_pull_in":
      return "If the 8 nm force-gradient, pull-in, stiction, or active-authority margins are below threshold, the frozen stack is mechanically inadmissible for source authority.";
    case "roughness_patch_potential":
      return "If asperity tails or patch-potential residuals consume the 8 nm gap margin or exceed electrostatic correction limits, the stack cannot be treated as a clean Casimir source.";
    case "active_control_energy_noise_heat_timing":
      return "If active control cannot hold the gap with required bandwidth, noise, heat, timing, and fail-safe margins, time-dependent source operation remains inadmissible.";
    case "fatigue_layer_scaling":
      return "If cycling lifetime, layer additivity, active-area retention, or source-tensor retention fail, the 447-layer architecture is not a credible scalable source candidate.";
    case "full_apparatus_tensor":
      return "If the apparatus tensor is missing T0i/off-diagonal Tij, support/control/electrostatic/thermal/material terms, regional supports, or anti-echo provenance, it cannot be consumed as source-side same-basis T_munu.";
    case "downstream_residual_conservation_qei_observer":
      return "If residual closure, conservation, QEI, observer-family checks, material credibility, and coupled closure do not pass together, the campaign remains non-physical and non-promotional.";
    case "campaign_coordination":
      return "If the frozen reference capsule cannot prove same-run/profile/atlas/artifact congruence, downstream pass signals remain stale or inadmissible.";
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

const preventsFromDomain = (
  domain: Nhm2TileSourceExperimentalCampaignDomainV1,
): string[] => {
  switch (domain) {
    case "material_coupon_behavior":
      return [
        "force_gap_pull_in",
        "roughness_patch_potential",
        "fatigue_layer_scaling",
        "full_apparatus_tensor",
        "material_credibility_gate",
      ];
    case "force_gap_pull_in":
      return [
        "active_control_energy_noise_heat_timing",
        "full_apparatus_tensor",
        "covariant_conservation",
      ];
    case "roughness_patch_potential":
      return ["force_gap_pull_in", "full_apparatus_tensor", "material_credibility_gate"];
    case "active_control_energy_noise_heat_timing":
      return [
        "time_dependent_source_campaign",
        "covariant_conservation",
        "full_apparatus_tensor",
      ];
    case "fatigue_layer_scaling":
      return ["full_apparatus_tensor", "material_credibility_gate"];
    case "full_apparatus_tensor":
      return [
        "source_side_same_basis_authority",
        "regional_residual_closure",
        "qei_worldline_dossier",
        "observer_robustness",
      ];
    case "downstream_residual_conservation_qei_observer":
      return ["coupled_closure", "claim_admission"];
    case "campaign_coordination":
      return ["frozen_reference_capsule", "same_run_artifact_congruence"];
  }
};

const evidenceStateFromRows = (
  domainRows: Nhm2TileSourceFalsificationReportRowV1[],
): Nhm2TileSourceCampaignDecisionV1["evidenceState"] => {
  if (domainRows.length === 0) return "ready";
  if (domainRows.some((row) => row.source === "source_side_same_basis_authority")) {
    return "source_authority_blocked";
  }
  if (domainRows.some((row) => row.source === "downstream_gate")) {
    return "downstream_blocked";
  }
  if (
    domainRows.some(
      (row) =>
        row.status === "missing" ||
        row.blockerId.includes("_missing") ||
        row.blockerId.includes("missing_"),
    )
  ) {
    return "missing_receipt";
  }
  if (domainRows.some((row) => row.falsifiesCurrentCandidate || row.status === "fail")) {
    return "failing_margin";
  }
  if (domainRows.some((row) => row.source === "operating_budget_readiness")) {
    return "operating_budget_blocked";
  }
  return "open_review";
};

const decisionFromRows = (
  domainRows: Nhm2TileSourceFalsificationReportRowV1[],
): Nhm2TileSourceCampaignDecisionV1["decision"] => {
  if (domainRows.some((row) => row.falsifiesCurrentCandidate || row.status === "falsifying")) {
    return "no_go";
  }
  return domainRows.length > 0 ? "review" : "go";
};

const requiredCorrectionKeys = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
): string[] =>
  uniqueText(
    rows.flatMap((row) =>
      Object.keys(row.requiredCorrections).map(
        (key) => `${correctionNamespace(row)}.${key}`,
      ),
    ),
  );

const buildGoNoGoMatrix = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
  summaries: Nhm2TileSourceCampaignDomainSummaryV1[],
): Nhm2TileSourceCampaignDecisionV1[] =>
  summaries.map((summary) => {
    const domainRows = rows.filter((row) => row.campaignDomain === summary.campaignDomain);
    const decision = decisionFromRows(domainRows);
    return {
      campaignDomain: summary.campaignDomain,
      decision,
      evidenceState: evidenceStateFromRows(domainRows),
      firstBlocker: summary.firstBlocker,
      blockerCount: summary.blockerCount,
      falsifyingBlockerCount: summary.falsifyingBlockerCount,
      minimumNumericalMargin: summary.minimumNumericalMargin,
      evidenceTarget: summary.evidenceTarget,
      nextRequiredChange: summary.nextRequiredChange,
      prevents: decision === "go" ? [] : preventsFromDomain(summary.campaignDomain),
      requiredCorrectionKeys: requiredCorrectionKeys(domainRows),
      evidenceRefs: summary.evidenceRefs,
      blocksCampaignPass: decision !== "go",
      claimBoundary: {
        diagnosticOnly: true,
        decisionMatrixDoesNotSupplyEvidence: true,
        noGoMeansCurrentCandidateOnly: true,
      },
    };
  });

const resolutionModeFromEvidenceState = (
  evidenceState: Nhm2TileSourceCampaignDecisionV1["evidenceState"],
): Nhm2TileSourceFrontierResolutionModeV1 => {
  switch (evidenceState) {
    case "missing_receipt":
      return "supply_experimental_receipt";
    case "failing_margin":
      return "revise_architecture_or_operating_margin";
    case "source_authority_blocked":
      return "supply_same_basis_full_apparatus_tensor";
    case "downstream_blocked":
      return "rerun_downstream_gate";
    case "operating_budget_blocked":
      return "supply_operating_budget_receipt";
    case "open_review":
    case "ready":
      return "resolve_open_review";
  }
};

const marginInterpretation = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
  margin: number | null,
): Nhm2TileSourceFrontierResolutionItemV1["marginInterpretation"] => {
  if (typeof margin === "number" && Number.isFinite(margin)) {
    return "below_one_fails";
  }
  return rows.some((row) => Object.keys(row.numericalMargins).length > 0)
    ? "boolean_or_missing"
    : "not_numeric";
};

const correctionValuesForRows = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
): Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> => {
  const values: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> = {};
  for (const row of rows) {
    for (const [key, value] of Object.entries(row.requiredCorrections)) {
      values[`${correctionNamespace(row)}.${key}`] = value;
    }
  }
  return values;
};

const roadmapItemDomain = (
  item: Nhm2TileSourceEvidenceGapRoadmapItemV1,
): Nhm2TileSourceExperimentalCampaignDomainV1 => domainFromSurface(item.itemId);

const fallbackDecisiveMeasurementsForDomain = (
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1,
): Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"] => [
  {
    measurementId: `${campaignDomain}_frontier_receipt`,
    quantity: evidenceTargetFromDomain(campaignDomain),
    target: measurementTargetSummaryFromDomain(campaignDomain),
    unit: null,
    evidenceArtifact: nextEvidenceArtifactFromDomain(
      campaignDomain,
      "domain_frontier_unresolved",
      campaignDomain === "downstream_residual_conservation_qei_observer"
        ? "downstream_blocked"
        : "open_review",
    ),
    marginKey: null,
    currentMargin: null,
    requiredCorrectionKey: null,
    requiredCorrectionValue: null,
    goCriterion: "all required evidence receipts and downstream gates for this domain pass in the same frozen chain",
    noGoCriterion: falsificationRuleFromDomain(campaignDomain),
    falsificationConsequence: falsificationRuleFromDomain(campaignDomain),
  },
];

const decisiveMeasurementsFromRoadmap = (
  roadmap: Nhm2TileSourceEvidenceGapRoadmapV1,
  campaignDomain: Nhm2TileSourceExperimentalCampaignDomainV1,
): Nhm2TileSourceEvidenceGapRoadmapItemV1["decisiveMeasurements"] => {
  const measurements = roadmap.roadmapItems
    .filter((item) => roadmapItemDomain(item) === campaignDomain)
    .flatMap((item) => item.decisiveMeasurements);
  return measurements.length > 0
    ? measurements
    : fallbackDecisiveMeasurementsForDomain(campaignDomain);
};

const buildFrontierResolutionQueue = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
  matrix: Nhm2TileSourceCampaignDecisionV1[],
  roadmap: Nhm2TileSourceEvidenceGapRoadmapV1,
): Nhm2TileSourceFrontierResolutionItemV1[] =>
  matrix
    .filter((entry) => entry.blocksCampaignPass)
    .map((entry) => {
      const domainRows = rows.filter((row) => row.campaignDomain === entry.campaignDomain);
      return {
        rank: 0,
        campaignDomain: entry.campaignDomain,
        decision: entry.decision,
        evidenceState: entry.evidenceState,
        resolutionMode: resolutionModeFromEvidenceState(entry.evidenceState),
        firstBlocker: entry.firstBlocker,
        blockerIds: domainRows.map((row) => row.blockerId),
        numericalMargin: entry.minimumNumericalMargin,
        marginInterpretation: marginInterpretation(domainRows, entry.minimumNumericalMargin),
        evidenceTarget: entry.evidenceTarget,
        requiredChange: entry.nextRequiredChange,
        nextEvidenceArtifact: nextEvidenceArtifactFromDomain(
          entry.campaignDomain,
          entry.firstBlocker,
          entry.evidenceState,
        ),
        measurementTargetSummary: measurementTargetSummaryFromDomain(entry.campaignDomain),
        falsificationRule: falsificationRuleFromDomain(entry.campaignDomain),
        requiredCorrections: correctionValuesForRows(domainRows),
        decisiveMeasurements: decisiveMeasurementsFromRoadmap(roadmap, entry.campaignDomain),
        prevents: entry.prevents,
        evidenceRefs: entry.evidenceRefs,
        blocksCampaignPass: true,
        claimBoundary: {
          diagnosticOnly: true,
          resolutionQueueDoesNotSupplyEvidence: true,
          resolvingItemRequiresNewReceiptOrArtifact: true,
        },
      };
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

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
          )}; corrections: ${formatCorrectionSummary(status.requiredCorrections)}`,
          falsifiesCurrentCandidate: status.falsifiesCurrentCandidate,
          evidenceRef: status.artifactRef,
        })),
  ) ?? [];

const sourceAuthorityRows = (
  artifact: Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 | null | undefined,
  artifactRef: string | null | undefined,
): Nhm2TileSourceFalsificationReportRowV1[] => {
  if (artifact == null || artifact.summary.allRequiredRegionsAuthoritative) {
    return [];
  }
  const rows = artifact.regions.flatMap((region) => {
    if (region.status === "authoritative_same_basis") return [];
    const blockers =
      region.blockers.length > 0
        ? region.blockers
        : ["source_side_same_basis_region_not_authoritative"];
    return blockers.map((blocker) => {
      const echoOrProxy =
        region.status === "metric_echo_forbidden" ||
        region.status === "proxy_limited" ||
        artifact.summary.anyMetricEcho ||
        artifact.summary.anyProxy;
      return {
        blockerId: `${region.regionId}:${blocker}`,
        source: "source_side_same_basis_authority" as const,
        surfaceId: "full_apparatus_tensor" as const,
        operatingBudgetSurfaceId: null,
        downstreamGateId: null,
        status: echoOrProxy ? ("falsifying" as const) : ("review" as const),
        numericalMargin: null,
        numericalMargins: {
          hasFullTensorComponents: region.hasFullTensorComponents,
          notDerivedFromMetricRequiredTensor: region.notDerivedFromMetricRequiredTensor,
          allRequiredRegionsAuthoritative:
            artifact.summary.allRequiredRegionsAuthoritative,
          tileSourceHandoffReady: artifact.summary.tileSourceHandoffReady,
        },
        requiredCorrections: region.handoffRequiredCorrections ?? {},
        marginUnit: "boolean_authority_margin",
        requiredChange:
          `supply source-side same-basis full apparatus tensor authority for ` +
          `${region.regionId}; regionStatus=${region.status}; blocker=${blocker}`,
        campaignDomain: "full_apparatus_tensor" as const,
        evidenceTarget: evidenceTargetFromDomain("full_apparatus_tensor"),
        falsifiesCurrentCandidate: echoOrProxy,
        evidenceRef: region.sourceTensorRef ?? artifactRef ?? null,
      };
    });
  });
  if (rows.length > 0) return rows;
  return [
    {
      blockerId: "source_side_same_basis_tensor_authority_not_authoritative",
      source: "source_side_same_basis_authority",
      surfaceId: "full_apparatus_tensor",
      operatingBudgetSurfaceId: null,
      downstreamGateId: null,
      status: "review",
      numericalMargin: null,
      numericalMargins: {
        allRequiredRegionsAuthoritative:
          artifact.summary.allRequiredRegionsAuthoritative,
        tileSourceHandoffReady: artifact.summary.tileSourceHandoffReady,
      },
      requiredCorrections: artifact.summary.tileSourceHandoffRequiredCorrections,
      marginUnit: "boolean_authority_margin",
      requiredChange:
        "supply authoritative same-basis full apparatus source tensor regions before treating the candidate as source-authoritative",
      campaignDomain: "full_apparatus_tensor",
      evidenceTarget: evidenceTargetFromDomain("full_apparatus_tensor"),
      falsifiesCurrentCandidate: false,
      evidenceRef: artifactRef ?? null,
    },
  ];
};

const correctionNamespace = (row: Nhm2TileSourceFalsificationReportRowV1): string =>
  row.operatingBudgetSurfaceId ??
  row.surfaceId ??
  row.downstreamGateId ??
  row.campaignDomain ??
  row.source;

const buildCorrectionSummary = (
  rows: Nhm2TileSourceFalsificationReportRowV1[],
): Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> => {
  const summary: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1> = {};
  for (const row of rows) {
    for (const [key, value] of Object.entries(row.requiredCorrections)) {
      summary[`${correctionNamespace(row)}.${key}`] = value;
    }
  }
  return summary;
};

const currentBlockerFromRow = (
  row: Nhm2TileSourceFalsificationReportRowV1 | null,
  roadmap: Nhm2TileSourceEvidenceGapRoadmapV1,
): Nhm2TileSourceFalsificationCurrentBlockerV1 => {
  if (row == null) {
    return {
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
      decisiveMeasurements: decisiveMeasurementsFromRoadmap(roadmap, "campaign_coordination"),
      falsifiesCurrentCandidate: false,
      evidenceRef: null,
    };
  }
  const campaignDomain =
    row.campaignDomain ?? domainFromSurface(row.surfaceId ?? row.operatingBudgetSurfaceId);
  return {
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
    campaignDomain,
    ...(row.evidenceTarget != null ? { evidenceTarget: row.evidenceTarget } : {}),
    decisiveMeasurements: decisiveMeasurementsFromRoadmap(roadmap, campaignDomain),
    falsifiesCurrentCandidate: row.falsifiesCurrentCandidate,
    evidenceRef: row.evidenceRef,
  };
};

const reportStatus = (args: {
  materialDisposition: "receipt_ready" | "review" | "falsified";
  validationStatus: "physically_credible_source_candidate" | "review" | "falsified";
  allReceiptsPresent: boolean;
  downstreamGatesPass: boolean;
  sourceSideAuthorityPass: boolean;
}): Nhm2TileSourceFalsificationReportV1["disposition"]["reportStatus"] => {
  if (args.materialDisposition === "falsified" || args.validationStatus === "falsified") {
    return "falsified";
  }
  if (
    args.validationStatus === "physically_credible_source_candidate" &&
    args.sourceSideAuthorityPass
  ) {
    return "candidate_evidence_complete";
  }
  if (args.allReceiptsPresent && (!args.downstreamGatesPass || !args.sourceSideAuthorityPass)) {
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
  const sourceAuthority = input.sourceSideSameBasisTensorAuthority ?? null;
  const receiptBlockers = receiptRows(receipts);
  const receiptBlockerIds = new Set(receiptBlockers.map((row) => row.blockerId));
  const downstreamBlockerIds = new Set(
    plan.downstreamGates.flatMap((gate) => gate.blockers),
  );
  const budgetBlockers = operatingBudgetRows(budgetReadiness);
  const budgetBlockerIds = new Set(budgetBlockers.map((row) => row.blockerId));
  const sourceAuthorityBlockers = sourceAuthorityRows(
    sourceAuthority,
    input.sourceSideSameBasisTensorAuthorityRef,
  );
  const rows = [
    ...receiptBlockers,
    ...validationRows(plan, receiptBlockerIds, downstreamBlockerIds, budgetBlockerIds),
    ...budgetBlockers,
    ...sourceAuthorityBlockers,
    ...downstreamRows(plan),
  ].map(annotateRow);
  const firstRow = rows[0] ?? null;
  const currentBlocker = currentBlockerFromRow(firstRow, roadmap);
  const allRequiredCorrections = buildCorrectionSummary(rows);
  const campaignDomainSummary = buildCampaignDomainSummary(rows);
  const goNoGoMatrix = buildGoNoGoMatrix(rows, campaignDomainSummary);
  const frontierResolutionQueue = buildFrontierResolutionQueue(rows, goNoGoMatrix, roadmap);
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
    sourceSideAuthorityPass:
      sourceAuthority == null
        ? receipts.summary.sourceAuthorityEvidenceReady
        : sourceAuthority.summary.allRequiredRegionsAuthoritative,
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
      sourceSideSameBasisTensorAuthorityRef:
        input.sourceSideSameBasisTensorAuthorityRef ?? null,
    },
    disposition: {
      materialEvidenceDisposition: receipts.summary.candidateDisposition,
      validationStatus: plan.summary.sourceCandidateStatus,
      reportStatus: finalReportStatus,
      firstBlocker: firstRow?.blockerId ?? "none",
    },
    currentBlocker,
    correctionSummary: allRequiredCorrections,
    blockerRows: rows,
    campaignDomainSummary,
    goNoGoMatrix,
    frontierResolutionQueue,
    readiness: {
      materialEvidenceReady: receipts.summary.materialEvidenceReady,
      fullApparatusTensorReady: receipts.summary.fullApparatusTensorReady,
      sourceAuthorityEvidenceReady:
        sourceAuthority == null
          ? receipts.summary.sourceAuthorityEvidenceReady
          : sourceAuthority.summary.allRequiredRegionsAuthoritative,
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
        typeof measurement.currentMargin === "boolean" ||
        (typeof measurement.currentMargin === "number" &&
          Number.isFinite(measurement.currentMargin))) &&
      (measurement.requiredCorrectionKey === null ||
        typeof measurement.requiredCorrectionKey === "string") &&
      (measurement.requiredCorrectionValue === null ||
        typeof measurement.requiredCorrectionValue === "string" ||
        typeof measurement.requiredCorrectionValue === "boolean" ||
        (typeof measurement.requiredCorrectionValue === "number" &&
          Number.isFinite(measurement.requiredCorrectionValue)) ||
        (Array.isArray(measurement.requiredCorrectionValue) &&
          measurement.requiredCorrectionValue.every((entry) => typeof entry === "string"))) &&
      typeof measurement.goCriterion === "string" &&
      typeof measurement.noGoCriterion === "string" &&
      typeof measurement.falsificationConsequence === "string",
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
    isDecisiveMeasurementList(currentBlocker.decisiveMeasurements) &&
    typeof currentBlocker.falsifiesCurrentCandidate === "boolean" &&
    (currentBlocker.evidenceRef === null || typeof currentBlocker.evidenceRef === "string") &&
    isCorrectionRecord(value.correctionSummary) &&
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
    Array.isArray(value.goNoGoMatrix) &&
    value.goNoGoMatrix.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.campaignDomain === "string" &&
        ["go", "review", "no_go"].includes(String(entry.decision)) &&
        [
          "ready",
          "missing_receipt",
          "failing_margin",
          "source_authority_blocked",
          "downstream_blocked",
          "operating_budget_blocked",
          "open_review",
        ].includes(String(entry.evidenceState)) &&
        typeof entry.firstBlocker === "string" &&
        typeof entry.blockerCount === "number" &&
        typeof entry.falsifyingBlockerCount === "number" &&
        (entry.minimumNumericalMargin === null ||
          (typeof entry.minimumNumericalMargin === "number" &&
            Number.isFinite(entry.minimumNumericalMargin))) &&
        typeof entry.evidenceTarget === "string" &&
        typeof entry.nextRequiredChange === "string" &&
        Array.isArray(entry.prevents) &&
        entry.prevents.every((item) => typeof item === "string") &&
        Array.isArray(entry.requiredCorrectionKeys) &&
        entry.requiredCorrectionKeys.every((item) => typeof item === "string") &&
        Array.isArray(entry.evidenceRefs) &&
        entry.evidenceRefs.every((ref) => typeof ref === "string") &&
        typeof entry.blocksCampaignPass === "boolean" &&
        isRecord(entry.claimBoundary) &&
        entry.claimBoundary.diagnosticOnly === true &&
        entry.claimBoundary.decisionMatrixDoesNotSupplyEvidence === true &&
        entry.claimBoundary.noGoMeansCurrentCandidateOnly === true,
    ) &&
    Array.isArray(value.frontierResolutionQueue) &&
    value.frontierResolutionQueue.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.rank === "number" &&
        Number.isInteger(entry.rank) &&
        entry.rank > 0 &&
        typeof entry.campaignDomain === "string" &&
        ["go", "review", "no_go"].includes(String(entry.decision)) &&
        [
          "ready",
          "missing_receipt",
          "failing_margin",
          "source_authority_blocked",
          "downstream_blocked",
          "operating_budget_blocked",
          "open_review",
        ].includes(String(entry.evidenceState)) &&
        [
          "supply_experimental_receipt",
          "revise_architecture_or_operating_margin",
          "supply_same_basis_full_apparatus_tensor",
          "rerun_downstream_gate",
          "supply_operating_budget_receipt",
          "resolve_open_review",
        ].includes(String(entry.resolutionMode)) &&
        typeof entry.firstBlocker === "string" &&
        Array.isArray(entry.blockerIds) &&
        entry.blockerIds.every((item) => typeof item === "string") &&
        (entry.numericalMargin === null ||
          (typeof entry.numericalMargin === "number" &&
            Number.isFinite(entry.numericalMargin))) &&
        ["below_one_fails", "boolean_or_missing", "not_numeric"].includes(
          String(entry.marginInterpretation),
        ) &&
        typeof entry.evidenceTarget === "string" &&
        typeof entry.requiredChange === "string" &&
        typeof entry.nextEvidenceArtifact === "string" &&
        typeof entry.measurementTargetSummary === "string" &&
        typeof entry.falsificationRule === "string" &&
        isCorrectionRecord(entry.requiredCorrections) &&
        isDecisiveMeasurementList(entry.decisiveMeasurements) &&
        Array.isArray(entry.prevents) &&
        entry.prevents.every((item) => typeof item === "string") &&
        Array.isArray(entry.evidenceRefs) &&
        entry.evidenceRefs.every((ref) => typeof ref === "string") &&
        entry.blocksCampaignPass === true &&
        isRecord(entry.claimBoundary) &&
        entry.claimBoundary.diagnosticOnly === true &&
        entry.claimBoundary.resolutionQueueDoesNotSupplyEvidence === true &&
        entry.claimBoundary.resolvingItemRequiresNewReceiptOrArtifact === true,
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
