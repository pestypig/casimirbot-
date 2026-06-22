import {
  buildNhm2LayerStackFullApparatusReceiptLoop,
  type BuildNhm2LayerStackFullApparatusReceiptLoopInput,
  type Nhm2LayerStackFullApparatusReceiptRowV1,
} from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import type { Nhm2TileSourceMaterialEvidenceReceiptsV1 } from "./nhm2-tile-source-material-evidence-receipts.v1";
import type {
  Nhm2TileSourceOperatingBudgetCorrectionValueV1,
  Nhm2TileSourceOperatingBudgetReadinessV1,
  Nhm2TileSourceOperatingBudgetSurfaceIdV1,
} from "./nhm2-tile-source-operating-budget-readiness.v1";

export const NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION =
  "nhm2_tile_source_physical_validation_plan/v1";

export const NHM2_TILE_SOURCE_VALIDATION_STATUSES = [
  "physically_credible_source_candidate",
  "review",
  "falsified",
] as const;

export type Nhm2TileSourceValidationStatus =
  (typeof NHM2_TILE_SOURCE_VALIDATION_STATUSES)[number];

export type Nhm2TileSourceGateStatus = "pass" | "review" | "fail" | "not_run";

export type Nhm2TileSourceReceiptTargetV1 = {
  targetId:
    | "material_coupon"
    | "force_gap_pull_in"
    | "roughness_patch_metrology"
    | "active_control_energy"
    | "fatigue_lifetime"
    | "layer_scaling"
    | "full_apparatus_tensor";
  status: Nhm2TileSourceGateStatus;
  targetValues: Record<string, number | string | boolean | null>;
  evidenceRef: string | null;
  literatureRefs: string[];
  requiredChange: string;
  blockers: string[];
};

export type Nhm2TileSourceTensorAuthorityGateV1 = {
  sameChart: Nhm2TileSourceGateStatus;
  sameBasis: Nhm2TileSourceGateStatus;
  sameUnits: Nhm2TileSourceGateStatus;
  fullTensorComponents: {
    T00: Nhm2TileSourceGateStatus;
    T0i: Nhm2TileSourceGateStatus;
    diagonalTij: Nhm2TileSourceGateStatus;
    offDiagonalTij: Nhm2TileSourceGateStatus;
  };
  noMetricTargetEcho: Nhm2TileSourceGateStatus;
  regionalCompatibility: {
    wall: Nhm2TileSourceGateStatus;
    hull: Nhm2TileSourceGateStatus;
    exteriorShell: Nhm2TileSourceGateStatus;
  };
  sourceTensorAuthorityCandidateAllowed: boolean;
  blockers: string[];
};

export type Nhm2TileSourceDownstreamGateV1 = {
  gateId:
    | "regional_residual_closure"
    | "wall_t00_closure"
    | "covariant_conservation"
    | "qei_worldline_dossier"
    | "observer_family_energy_conditions"
    | "material_credibility"
    | "coupled_closure";
  status: Nhm2TileSourceGateStatus;
  artifactRef: string | null;
  requiredChange: string;
  blockers: string[];
};

export type Nhm2TileSourceFalsificationItemV1 = {
  blocker: string;
  numericalMargin: number | null;
  marginUnit: string | null;
  requiredChange: string;
  falsifiesCurrentCandidate: boolean;
};

export type Nhm2TileSourcePhysicalValidationCampaignDomainV1 =
  | "material_coupon_behavior"
  | "force_gap_pull_in"
  | "roughness_patch_potential"
  | "active_control_energy_noise_heat_timing"
  | "fatigue_layer_scaling"
  | "full_apparatus_tensor"
  | "downstream_residual_conservation_qei_observer"
  | "campaign_coordination";

export type Nhm2TileSourcePhysicalValidationResolutionModeV1 =
  | "supply_experimental_receipt"
  | "supply_operating_budget_receipt"
  | "supply_same_basis_full_apparatus_tensor"
  | "rerun_downstream_gate"
  | "revise_architecture_or_operating_margin";

export type Nhm2TileSourcePhysicalValidationFrontierItemV1 = {
  rank: number;
  campaignDomain: Nhm2TileSourcePhysicalValidationCampaignDomainV1;
  resolutionMode: Nhm2TileSourcePhysicalValidationResolutionModeV1;
  source:
    | "receipt_target"
    | "operating_budget_readiness"
    | "tensor_authority_gate"
    | "downstream_gate";
  targetId: Nhm2TileSourceReceiptTargetV1["targetId"] | null;
  operatingBudgetSurfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1 | null;
  downstreamGateId: Nhm2TileSourceDownstreamGateV1["gateId"] | null;
  status: Nhm2TileSourceGateStatus | "blocked";
  firstBlocker: string;
  blockerIds: string[];
  numericalMargin: number | null;
  marginUnit: string | null;
  evidenceTarget: string;
  requiredChange: string;
  nextEvidenceArtifact: string;
  measurementTargetSummary: string;
  falsificationRule: string;
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  prevents: string[];
  evidenceRefs: string[];
  blocksPhysicallyCredibleSourceCandidate: true;
  claimBoundary: {
    diagnosticOnly: true;
    frontierQueueDoesNotSupplyEvidence: true;
    resolvingItemRequiresNewReceiptOrArtifact: true;
  };
};

export type Nhm2TileSourcePhysicalValidationPlanV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  receiptLoopRef: "nhm2_layer_stack_full_apparatus_receipt_loop/v1";
  frozenCandidate: {
    candidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
    architectureId: string;
    architectureKind: string;
    materialCandidate: string;
    selectionMethod: "highest_receipt_loop_readiness_nonfailed_row";
    sourceRetention: number;
    supportStressMPa: number;
    pullInMargin: number | null;
  };
  receiptTargets: Nhm2TileSourceReceiptTargetV1[];
  tensorAuthorityGate: Nhm2TileSourceTensorAuthorityGateV1;
  downstreamGates: Nhm2TileSourceDownstreamGateV1[];
  falsificationMap: Nhm2TileSourceFalsificationItemV1[];
  frontierResolutionQueue: Nhm2TileSourcePhysicalValidationFrontierItemV1[];
  summary: {
    sourceCandidateStatus: Nhm2TileSourceValidationStatus;
    firstBlocker: string;
    firstFrontierCampaignDomain: Nhm2TileSourcePhysicalValidationCampaignDomainV1 | "none";
    firstFrontierResolutionMode: Nhm2TileSourcePhysicalValidationResolutionModeV1 | "none";
    frontierResolutionItemCount: number;
    allReceiptsPresent: boolean;
    operatingBudgetsReady: boolean;
    operatingBudgetsFalsifyCurrentCandidate: boolean;
    fullApparatusTensorCoverageComplete: boolean;
    downstreamGatesPass: boolean;
    decisiveFalsificationMapAvailable: boolean;
    physicallyCredibleSourceCandidate: boolean;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    routeEtaClaimAllowed: false;
  };
  researchRefs: [
    "pmc_2024_casimir_mems_review",
    "physrevb_72_115426_roughness_pull_in",
    "physrevb_87_125413_roughness_mems_actuation",
    "physrevresearch_2_023355_patch_potential_measurement",
    "arxiv_1207_4429_surface_potential_nanomebrane",
    "rspa_2020_0311_casimir_pull_in_framework",
    "physrevapplied_15_034063_high_stress_sin",
    "nature_2025_aln_alscn_mems_mirror_review",
    "apl_127_222202_high_stress_tin"
  ];
  claimBoundary: {
    diagnosticOnly: true;
    validationPlanOnly: true;
    physicallyCredibleSourceCandidateIsNotPhysicalViability: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    sourceTensorMustNotCopyMetricTarget: true;
    fullSolveRequiresDownstreamGateClosure: true;
    operatingBudgetReadinessRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type BuildNhm2TileSourcePhysicalValidationPlanInput =
  BuildNhm2LayerStackFullApparatusReceiptLoopInput & {
    tensorAuthorityEvidenceSupplied?: boolean | null;
    downstreamGateStatuses?: Partial<Record<Nhm2TileSourceDownstreamGateV1["gateId"], Nhm2TileSourceGateStatus>> | null;
    materialEvidenceReceipts?: Nhm2TileSourceMaterialEvidenceReceiptsV1 | null;
    operatingBudgetReadiness?: Nhm2TileSourceOperatingBudgetReadinessV1 | null;
  };

const TARGET_CANDIDATE_ID = "topology_optimized_lattice_tin";
const round = (value: number, digits = 12): number => Number(value.toPrecision(digits));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const targetRow = (rows: Nhm2LayerStackFullApparatusReceiptRowV1[]): Nhm2LayerStackFullApparatusReceiptRowV1 => {
  const explicit = rows.find((row) => row.architectureId === TARGET_CANDIDATE_ID);
  if (explicit != null) return explicit;
  const nonFailed = rows.find((row) => row.architectureBaseStatus !== "fail");
  if (nonFailed != null) return nonFailed;
  return rows[0];
};

const targetStatusFromReceipt = (
  row: Nhm2LayerStackFullApparatusReceiptRowV1,
  surfaceId: Nhm2TileSourceReceiptTargetV1["targetId"],
): Nhm2TileSourceGateStatus => {
  const surface = row.receiptSurfaces.find((entry) => entry.surfaceId === surfaceId);
  if (surface?.status === "receipted") return "pass";
  if (row.architectureBaseStatus === "fail") return "fail";
  return "review";
};

const receiptTarget = (
  row: Nhm2LayerStackFullApparatusReceiptRowV1,
  targetId: Nhm2TileSourceReceiptTargetV1["targetId"],
  targetValues: Record<string, number | string | boolean | null>,
  literatureRefs: string[],
  requiredChange: string,
): Nhm2TileSourceReceiptTargetV1 => {
  const surface = row.receiptSurfaces.find((entry) => entry.surfaceId === targetId);
  const status = targetStatusFromReceipt(row, targetId);
  return {
    targetId,
    status,
    targetValues,
    evidenceRef: status === "pass" ? `receipt://${targetId}/candidate/${row.architectureId}` : null,
    literatureRefs,
    requiredChange,
    blockers: status === "pass" ? [] : (surface?.blockers ?? [`${targetId}_receipt_missing`]),
  };
};

const downstreamGate = (
  gateId: Nhm2TileSourceDownstreamGateV1["gateId"],
  status: Nhm2TileSourceGateStatus,
  requiredChange: string,
  blockers?: string[],
): Nhm2TileSourceDownstreamGateV1 => ({
  gateId,
  status,
  artifactRef: status === "pass" ? `artifact://${gateId}/candidate/topology_optimized_lattice_tin` : null,
  requiredChange,
  blockers: status === "pass" ? [] : blockers ?? [`${gateId}_${status === "not_run" ? "not_run" : "incomplete"}`],
});

const allPass = (statuses: Nhm2TileSourceGateStatus[]): boolean =>
  statuses.every((status) => status === "pass");

const admittedStatus = (args: {
  requestedStatus: Nhm2TileSourceGateStatus;
  blockers: string[];
  falsifies: boolean;
}): Nhm2TileSourceGateStatus => {
  if (args.requestedStatus !== "pass" || args.blockers.length === 0) {
    return args.requestedStatus;
  }
  return args.falsifies ? "fail" : "review";
};

const campaignDomainFromReceiptTarget = (
  targetId: Nhm2TileSourceReceiptTargetV1["targetId"],
): Nhm2TileSourcePhysicalValidationCampaignDomainV1 => {
  switch (targetId) {
    case "material_coupon":
      return "material_coupon_behavior";
    case "force_gap_pull_in":
      return "force_gap_pull_in";
    case "roughness_patch_metrology":
      return "roughness_patch_potential";
    case "active_control_energy":
      return "active_control_energy_noise_heat_timing";
    case "fatigue_lifetime":
    case "layer_scaling":
      return "fatigue_layer_scaling";
    case "full_apparatus_tensor":
      return "full_apparatus_tensor";
  }
};

const campaignDomainFromOperatingBudget = (
  surfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1,
): Nhm2TileSourcePhysicalValidationCampaignDomainV1 => {
  switch (surfaceId) {
    case "material_coupon":
      return "material_coupon_behavior";
    case "force_gap_load":
      return "force_gap_pull_in";
    case "roughness_patch":
      return "roughness_patch_potential";
    case "active_control":
      return "active_control_energy_noise_heat_timing";
    case "fatigue_layer_scaling":
      return "fatigue_layer_scaling";
    case "full_apparatus_tensor":
      return "full_apparatus_tensor";
  }
};

const evidenceTargetFromDomain = (
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
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
      return "Downstream gate receipt: regional residual closure, covariant conservation, QEI worldline dossier, observer-family energy conditions, material credibility, and coupled closure in one frozen chain.";
    case "campaign_coordination":
      return "Campaign coordination receipt: coherent refs, operating-budget evidence, and non-stale artifact handoff.";
  }
};

const nextEvidenceArtifactFromDomain = (
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
  firstBlocker: string,
  status: Nhm2TileSourceGateStatus | "blocked",
): string => {
  const missingLike = status === "review" || status === "not_run" || status === "blocked";
  switch (domain) {
    case "material_coupon_behavior":
      return !missingLike && (firstBlocker.includes("fracture") || firstBlocker.includes("yield"))
        ? "receipt://material_coupon/fracture_yield_margin_v1"
        : "receipt://material_coupon/provenance_v1";
    case "force_gap_pull_in":
      return !missingLike && firstBlocker.includes("force_gradient")
        ? "receipt://force_gap_pull_in/force_gradient_8nm_v1"
        : "receipt://force_gap_pull_in/provenance_v1";
    case "roughness_patch_potential":
      return !missingLike && firstBlocker.includes("roughness")
        ? "receipt://roughness_patch_metrology/roughness_rms_v1"
        : "receipt://roughness_patch_metrology/provenance_v1";
    case "active_control_energy_noise_heat_timing":
      return "receipt://active_control/provenance_v1";
    case "fatigue_layer_scaling":
      return !missingLike && firstBlocker.includes("cycle")
        ? "receipt://fatigue_layer_scaling/cycle_margin_v1"
        : "receipt://fatigue_layer_scaling/provenance_v1";
    case "full_apparatus_tensor":
      return !missingLike &&
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
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
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
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
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

const preventsFromDomain = (
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
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
      return ["active_control_energy_noise_heat_timing", "full_apparatus_tensor", "covariant_conservation"];
    case "roughness_patch_potential":
      return ["force_gap_pull_in", "full_apparatus_tensor", "material_credibility_gate"];
    case "active_control_energy_noise_heat_timing":
      return ["time_dependent_source_campaign", "covariant_conservation", "full_apparatus_tensor"];
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

const resolutionModeForDomain = (
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
): Nhm2TileSourcePhysicalValidationResolutionModeV1 =>
  domain === "full_apparatus_tensor"
    ? "supply_same_basis_full_apparatus_tensor"
    : domain === "downstream_residual_conservation_qei_observer"
      ? "rerun_downstream_gate"
      : domain === "campaign_coordination"
        ? "supply_operating_budget_receipt"
        : "supply_experimental_receipt";

const minimumTargetMargin = (
  target: Nhm2TileSourceReceiptTargetV1,
): number | null => {
  const values = Object.values(target.targetValues).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return values.length === 0 ? null : Math.min(...values);
};

const firstNonNullMargin = (
  margins: Record<string, number | boolean | null>,
): number | null => {
  const values = Object.values(margins).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  return values.length === 0 ? null : Math.min(...values);
};

const frontierItem = (args: {
  rank: number;
  campaignDomain: Nhm2TileSourcePhysicalValidationCampaignDomainV1;
  resolutionMode?: Nhm2TileSourcePhysicalValidationResolutionModeV1;
  source: Nhm2TileSourcePhysicalValidationFrontierItemV1["source"];
  targetId?: Nhm2TileSourceReceiptTargetV1["targetId"] | null;
  operatingBudgetSurfaceId?: Nhm2TileSourceOperatingBudgetSurfaceIdV1 | null;
  downstreamGateId?: Nhm2TileSourceDownstreamGateV1["gateId"] | null;
  status: Nhm2TileSourceGateStatus | "blocked";
  blockers: string[];
  numericalMargin: number | null;
  marginUnit: string | null;
  requiredChange: string;
  requiredCorrections?: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>;
  evidenceRefs?: string[];
}): Nhm2TileSourcePhysicalValidationFrontierItemV1 => ({
  rank: args.rank,
  campaignDomain: args.campaignDomain,
  resolutionMode: args.resolutionMode ?? resolutionModeForDomain(args.campaignDomain),
  source: args.source,
  targetId: args.targetId ?? null,
  operatingBudgetSurfaceId: args.operatingBudgetSurfaceId ?? null,
  downstreamGateId: args.downstreamGateId ?? null,
  status: args.status,
  firstBlocker: args.blockers[0] ?? "none",
  blockerIds: args.blockers,
  numericalMargin: args.numericalMargin,
  marginUnit: args.marginUnit,
  evidenceTarget: evidenceTargetFromDomain(args.campaignDomain),
  requiredChange: args.requiredChange,
  nextEvidenceArtifact: nextEvidenceArtifactFromDomain(
    args.campaignDomain,
    args.blockers[0] ?? "none",
    args.status,
  ),
  measurementTargetSummary: measurementTargetSummaryFromDomain(args.campaignDomain),
  falsificationRule: falsificationRuleFromDomain(args.campaignDomain),
  requiredCorrections: args.requiredCorrections ?? {},
  prevents: preventsFromDomain(args.campaignDomain),
  evidenceRefs: args.evidenceRefs ?? [],
  blocksPhysicallyCredibleSourceCandidate: true,
  claimBoundary: {
    diagnosticOnly: true,
    frontierQueueDoesNotSupplyEvidence: true,
    resolvingItemRequiresNewReceiptOrArtifact: true,
  },
});

const buildFrontierResolutionQueue = (args: {
  receiptTargets: Nhm2TileSourceReceiptTargetV1[];
  operatingBudgetReadiness: Nhm2TileSourceOperatingBudgetReadinessV1 | null;
  tensorAuthorityGate: Nhm2TileSourceTensorAuthorityGateV1;
  downstreamGates: Nhm2TileSourceDownstreamGateV1[];
}): Nhm2TileSourcePhysicalValidationFrontierItemV1[] => {
  const items: Omit<Nhm2TileSourcePhysicalValidationFrontierItemV1, "rank">[] = [
    ...args.receiptTargets
      .filter((target) => target.status !== "pass")
      .map((target) =>
        frontierItem({
          rank: 1,
          campaignDomain: campaignDomainFromReceiptTarget(target.targetId),
          source: "receipt_target",
          targetId: target.targetId,
          status: target.status,
          blockers: target.blockers,
          numericalMargin: minimumTargetMargin(target),
          marginUnit:
            target.targetId === "material_coupon"
              ? "target-value lower-bound"
              : target.targetId === "force_gap_pull_in"
                ? "pull-in margin"
                : null,
          requiredChange: target.requiredChange,
          evidenceRefs: target.evidenceRef == null ? [] : [target.evidenceRef],
        }),
      ),
    ...(
      args.operatingBudgetReadiness == null
        ? [
            frontierItem({
              rank: 1,
              campaignDomain: "campaign_coordination",
              resolutionMode: "supply_operating_budget_receipt",
              source: "operating_budget_readiness",
              status: "review",
              blockers: ["operating_budget_readiness_missing"],
              numericalMargin: null,
              marginUnit: null,
              requiredChange:
                "Build nhm2_tile_source_operating_budget_readiness/v1 over material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor budgets.",
            }),
          ]
        : args.operatingBudgetReadiness.budgetStatuses
            .filter((status) => !status.ready)
            .map((status) =>
              frontierItem({
                rank: 1,
                campaignDomain: campaignDomainFromOperatingBudget(status.surfaceId),
                resolutionMode: status.falsifiesCurrentCandidate
                  ? "revise_architecture_or_operating_margin"
                  : "supply_operating_budget_receipt",
                source: "operating_budget_readiness",
                operatingBudgetSurfaceId: status.surfaceId,
                status: status.falsifiesCurrentCandidate ? "fail" : "review",
                blockers: status.blockers,
                numericalMargin: firstNonNullMargin(status.numericalMargins),
                marginUnit: "dimensionless operating-budget margin",
                requiredChange:
                  "Clear operating-budget readiness for material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor evidence.",
                requiredCorrections: status.requiredCorrections,
                evidenceRefs: status.artifactRef == null ? [] : [status.artifactRef],
              }),
            )
    ),
    ...(
      args.tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed
        ? []
        : [
            frontierItem({
              rank: 1,
              campaignDomain: "full_apparatus_tensor",
              source: "tensor_authority_gate",
              status: "review",
              blockers: args.tensorAuthorityGate.blockers,
              numericalMargin: null,
              marginUnit: null,
              requiredChange:
                "Supply same-chart, same-basis, same-unit full apparatus T_munu with T00, T0i, diagonal Tij, off-diagonal Tij, no metric-target echo, and regional wall/hull/exterior compatibility.",
            }),
          ]
    ),
    ...args.downstreamGates
      .filter((gate) => gate.status !== "pass")
      .map((gate) =>
        frontierItem({
          rank: 1,
          campaignDomain: "downstream_residual_conservation_qei_observer",
          source: "downstream_gate",
          downstreamGateId: gate.gateId,
          status: gate.status,
          blockers: gate.blockers,
          numericalMargin: null,
          marginUnit: null,
          requiredChange: gate.requiredChange,
          evidenceRefs: gate.artifactRef == null ? [] : [gate.artifactRef],
        }),
      ),
  ].map(({ rank: _rank, ...item }) => item);

  return items.map((item, index) => ({ rank: index + 1, ...item }));
};

export const buildNhm2TileSourcePhysicalValidationPlan = (
  input: BuildNhm2TileSourcePhysicalValidationPlanInput = {},
): Nhm2TileSourcePhysicalValidationPlanV1 => {
  const materialEvidence = input.materialEvidenceReceipts ?? null;
  const operatingBudgetReadiness = input.operatingBudgetReadiness ?? null;
  const receiptLoopInput: BuildNhm2LayerStackFullApparatusReceiptLoopInput = {
    ...input,
    suppliedReceiptSurfaces:
      materialEvidence?.derivedReceiptInputs.suppliedReceiptSurfaces ??
      input.suppliedReceiptSurfaces,
    tensorTermCoverage:
      materialEvidence?.derivedReceiptInputs.tensorTermCoverage ??
      input.tensorTermCoverage,
  };
  const receiptLoop = buildNhm2LayerStackFullApparatusReceiptLoop(receiptLoopInput);
  const row = targetRow(receiptLoop.summary.rankedRowsByEvidenceReadiness);
  const receiptTargets = [
    receiptTarget(
      row,
      "material_coupon",
      {
        material: row.materialCandidate,
        allowableStressPa: row.materialCandidate === "ultra_high_stress_tin" ? 2.3e9 : null,
        supportStressMPa: row.supportStressMPa,
        cryogenicBehaviorRequired: true,
        conductivityRequired: true,
        dielectricResponseRequired: true,
        fabricationToleranceRequired: true,
      },
      ["apl_127_222202_high_stress_tin", "physrevapplied_15_034063_high_stress_sin", "nature_2025_aln_alscn_mems_mirror_review"],
      "Supply material coupon data for stress, fracture/yield, fatigue, cryogenic behavior, roughness, conductivity, dielectric response, and fabrication tolerance.",
    ),
    receiptTarget(
      row,
      "force_gap_pull_in",
      {
        gapMeters: 8e-9,
        pullInMarginMinimum: 1,
        observedPullInMargin: row.pullInMargin,
        forceGradientModelRequired: true,
        activeGapControlAuthorityRequired: true,
      },
      ["pmc_2024_casimir_mems_review", "rspa_2020_0311_casimir_pull_in_framework"],
      "Supply measured or simulated F(g), force gradient, spring constant, pull-in margin at 8 nm, stiction risk, and active gap-control authority.",
    ),
    receiptTarget(
      row,
      "roughness_patch_metrology",
      {
        roughnessRmsTargetMeters: 1e-10,
        asperityTailBelowGapRequired: true,
        patchVoltageMapRequired: true,
        residualElectrostaticForceCorrectionRequired: true,
      },
      ["physrevb_72_115426_roughness_pull_in", "physrevb_87_125413_roughness_mems_actuation", "physrevresearch_2_023355_patch_potential_measurement", "arxiv_1207_4429_surface_potential_nanomebrane"],
      "Supply RMS roughness, asperity-tail distribution, patch voltage map, residual electrostatic force, roughness correction, and patch-force correction.",
    ),
    receiptTarget(
      row,
      "active_control_energy",
      {
        controlEnergyPerCycleJ: null,
        controlNoiseSpectrumRequired: true,
        bandwidthMustExceedSwitchingRate: true,
        heatLoadReceiptRequired: true,
        timingSynchronizationRequired: true,
        failureModeReceiptRequired: true,
      },
      ["pmc_2024_casimir_mems_review", "nature_2025_aln_alscn_mems_mirror_review"],
      "Supply active-control energy per cycle, noise, bandwidth, heat load, timing synchronization, failure mode, and T_munu contribution.",
    ),
    receiptTarget(
      row,
      "fatigue_lifetime",
      {
        cycleLifetimeRequired: true,
        thermalCyclingRequired: true,
        creepOrDriftBoundRequired: true,
      },
      ["physrevapplied_15_034063_high_stress_sin", "apl_127_222202_high_stress_tin"],
      "Supply cycle lifetime, thermal cycling, creep/drift, and fatigue margin for the selected architecture.",
    ),
    receiptTarget(
      row,
      "layer_scaling",
      {
        layerCount: 447,
        minimumLayerScalingEfficiency: 0.9,
        nonlinearCrossLayerBoundRequired: true,
        forceAdditivityReceiptRequired: true,
      },
      ["pmc_2024_casimir_mems_review", "revmodphys_81_1827_real_material_casimir"],
      "Supply 447-layer force additivity, nonlinear cross-layer effects, and nonadditivity bounds.",
    ),
    receiptTarget(
      row,
      "full_apparatus_tensor",
      {
        requireCasimirFieldContribution: true,
        requireSupportStressEnergy: true,
        requireSpacerContactStress: true,
        requireElectrostaticPatchTerms: true,
        requireActiveControlFieldEnergy: true,
        requireThermalLoad: true,
        requireMaterialStrainEnergy: true,
        requireFatigueLayerScalingTerms: true,
      },
      ["revmodphys_81_1827_real_material_casimir"],
      "Supply full apparatus T_munu including Casimir field, support, spacer, electrostatic, active-control, thermal, strain, fatigue, and layer-scaling terms.",
    ),
  ];
  const tensorEvidenceSupplied =
    input.tensorAuthorityEvidenceSupplied ??
    materialEvidence?.derivedReceiptInputs.tensorAuthorityEvidenceSupplied ??
    false;
  const tensorStatus: Nhm2TileSourceGateStatus = tensorEvidenceSupplied ? "pass" : "review";
  const tensorAuthorityGate: Nhm2TileSourceTensorAuthorityGateV1 = {
    sameChart: tensorStatus,
    sameBasis: tensorStatus,
    sameUnits: tensorStatus,
    fullTensorComponents: {
      T00: tensorStatus,
      T0i: tensorStatus,
      diagonalTij: tensorStatus,
      offDiagonalTij: tensorStatus,
    },
    noMetricTargetEcho: tensorStatus,
    regionalCompatibility: {
      wall: tensorStatus,
      hull: tensorStatus,
      exteriorShell: tensorStatus,
    },
    sourceTensorAuthorityCandidateAllowed:
      tensorEvidenceSupplied && row.engineeringCandidateStatus === "candidate_window",
    blockers: tensorEvidenceSupplied
      ? []
      : [
          "same_chart_full_apparatus_tensor_missing",
          "source_tensor_component_coverage_missing",
          "metric_target_echo_test_missing",
          "regional_compatibility_not_run",
        ],
  };
  const downstreamStatuses = input.downstreamGateStatuses ?? {};
  const allReceiptsPresent = receiptTargets.every((target) => target.status === "pass");
  const operatingBudgetsReady =
    operatingBudgetReadiness?.summary.allOperatingBudgetsReady === true;
  const operatingBudgetsFalsifyCurrentCandidate =
    operatingBudgetReadiness?.summary.anyOperatingBudgetFalsifies === true;
  const fullApparatusTensorCoverageComplete = row.receiptSurfaces
    .find((surface) => surface.surfaceId === "full_apparatus_tensor")
    ?.status === "receipted";
  const tensorAuthorityPass = tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed;
  const requestedMaterialCredibilityStatus =
    downstreamStatuses.material_credibility ?? "not_run";
  const materialCredibilityAdmissionBlockers =
    requestedMaterialCredibilityStatus === "pass"
      ? [
          ...(!allReceiptsPresent ? ["material_credibility_receipts_incomplete"] : []),
          ...(!operatingBudgetsReady
            ? ["material_credibility_operating_budgets_not_ready"]
            : []),
          ...(operatingBudgetsFalsifyCurrentCandidate
            ? ["material_credibility_operating_budget_falsifies_candidate"]
            : []),
        ]
      : [];
  const materialCredibilityStatus = admittedStatus({
    requestedStatus: requestedMaterialCredibilityStatus,
    blockers: materialCredibilityAdmissionBlockers,
    falsifies: operatingBudgetsFalsifyCurrentCandidate,
  });
  const upstreamDownstreamGates = [
    downstreamGate(
      "regional_residual_closure",
      downstreamStatuses.regional_residual_closure ?? "not_run",
      "Run regional wall/hull/exterior residual closure against the candidate apparatus tensor.",
    ),
    downstreamGate(
      "wall_t00_closure",
      downstreamStatuses.wall_t00_closure ?? "not_run",
      "Run wall T00 closure without treating T00-only closure as broad wall closure.",
    ),
    downstreamGate(
      "covariant_conservation",
      downstreamStatuses.covariant_conservation ?? "not_run",
      "Run covariant conservation with support/control/electrostatic/thermal terms included.",
    ),
    downstreamGate(
      "qei_worldline_dossier",
      downstreamStatuses.qei_worldline_dossier ?? "not_run",
      "Run QEI worldline dossier against the candidate apparatus tensor.",
    ),
    downstreamGate(
      "observer_family_energy_conditions",
      downstreamStatuses.observer_family_energy_conditions ?? "not_run",
      "Run observer-family WEC/NEC/SEC/DEC diagnostics against the candidate apparatus tensor.",
    ),
    downstreamGate(
      "material_credibility",
      materialCredibilityStatus,
      "Run material credibility admission over coupon, force-gap, roughness, patch, control, fatigue, and scaling receipts.",
      materialCredibilityAdmissionBlockers.length > 0
        ? materialCredibilityAdmissionBlockers
        : undefined,
    ),
  ];
  const requestedCoupledClosureStatus = downstreamStatuses.coupled_closure ?? "not_run";
  const coupledClosureAdmissionBlockers =
    requestedCoupledClosureStatus === "pass"
      ? [
          ...(!allReceiptsPresent ? ["coupled_closure_material_receipts_incomplete"] : []),
          ...(!operatingBudgetsReady ? ["coupled_closure_operating_budgets_not_ready"] : []),
          ...(!fullApparatusTensorCoverageComplete
            ? ["coupled_closure_full_apparatus_tensor_receipt_incomplete"]
            : []),
          ...(!tensorAuthorityPass ? ["coupled_closure_source_tensor_authority_not_admitted"] : []),
          ...upstreamDownstreamGates
            .filter((gate) => gate.status !== "pass")
            .map((gate) => `${gate.gateId}_not_pass_for_coupled_closure`),
        ]
      : [];
  const coupledClosureStatus = admittedStatus({
    requestedStatus: requestedCoupledClosureStatus,
    blockers: coupledClosureAdmissionBlockers,
    falsifies:
      operatingBudgetsFalsifyCurrentCandidate ||
      upstreamDownstreamGates.some((gate) => gate.status === "fail"),
  });
  const downstreamGates = [
    ...upstreamDownstreamGates,
    downstreamGate(
      "coupled_closure",
      coupledClosureStatus,
      "Run coupled closure after source authority, residuals, conservation, QEI, observer, and material gates complete.",
      coupledClosureAdmissionBlockers.length > 0
        ? coupledClosureAdmissionBlockers
        : undefined,
    ),
  ];
  const downstreamGatesPass = allPass(downstreamGates.map((gate) => gate.status));
  const physicallyCredibleSourceCandidate =
    allReceiptsPresent &&
    operatingBudgetsReady &&
    fullApparatusTensorCoverageComplete &&
    downstreamGatesPass &&
    tensorAuthorityPass;
  const firstReceiptBlocker =
    receiptTargets.find((target) => target.status !== "pass")?.blockers[0] ?? null;
  const firstOperatingBudgetBlocker =
    operatingBudgetReadiness == null
      ? "operating_budget_readiness_missing"
      : operatingBudgetReadiness.summary.firstBlocker !== "none"
        ? operatingBudgetReadiness.summary.firstBlocker
        : null;
  const firstTensorBlocker = tensorAuthorityGate.blockers[0] ?? null;
  const firstDownstreamBlocker =
    downstreamGates.find((gate) => gate.status !== "pass")?.blockers[0] ?? null;
  const firstBlocker =
    firstReceiptBlocker ??
    firstOperatingBudgetBlocker ??
    firstTensorBlocker ??
    firstDownstreamBlocker ??
    "none";
  const sourceCandidateStatus: Nhm2TileSourceValidationStatus = physicallyCredibleSourceCandidate
    ? "physically_credible_source_candidate"
    : row.architectureBaseStatus === "fail" || operatingBudgetsFalsifyCurrentCandidate
      ? "falsified"
      : "review";
  const falsificationMap: Nhm2TileSourceFalsificationItemV1[] = [
    ...receiptTargets.flatMap((target) =>
      target.status === "pass"
        ? []
        : target.blockers.map((blocker) => ({
            blocker,
            numericalMargin:
              target.targetId === "material_coupon"
                ? round((target.targetValues.supportStressMPa as number) ?? 0)
                : target.targetId === "force_gap_pull_in"
                  ? (target.targetValues.observedPullInMargin as number | null)
                  : null,
            marginUnit:
              target.targetId === "material_coupon"
                ? "MPa support stress"
                : target.targetId === "force_gap_pull_in"
                  ? "pull-in margin"
                  : null,
            requiredChange: target.requiredChange,
            falsifiesCurrentCandidate: target.status === "fail",
          })),
    ),
    ...tensorAuthorityGate.blockers.map((blocker) => ({
      blocker,
      numericalMargin: null,
      marginUnit: null,
      requiredChange:
        "Supply same-chart, same-basis, same-unit full apparatus T_munu with T00, T0i, diagonal Tij, off-diagonal Tij, no metric-target echo, and regional wall/hull/exterior compatibility.",
      falsifiesCurrentCandidate: false,
    })),
    ...(
      operatingBudgetReadiness == null
        ? [
            {
              blocker: "operating_budget_readiness_missing",
              numericalMargin: null,
              marginUnit: null,
              requiredChange:
                "Build nhm2_tile_source_operating_budget_readiness/v1 over material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor budgets.",
              falsifiesCurrentCandidate: false,
            },
          ]
        : operatingBudgetReadiness.blockers.map((blocker) => ({
            blocker,
            numericalMargin: null,
            marginUnit: null,
            requiredChange:
              "Clear operating-budget readiness for material coupon, force-gap, roughness/patch, active-control, fatigue/layer-scaling, and full-apparatus tensor evidence.",
            falsifiesCurrentCandidate:
              operatingBudgetReadiness.summary.anyOperatingBudgetFalsifies,
          }))
    ),
    ...downstreamGates.flatMap((gate) =>
      gate.status === "pass"
        ? []
        : gate.blockers.map((blocker) => ({
            blocker,
            numericalMargin: null,
            marginUnit: null,
            requiredChange: gate.requiredChange,
            falsifiesCurrentCandidate: gate.status === "fail",
          })),
    ),
  ];
  const frontierResolutionQueue = buildFrontierResolutionQueue({
    receiptTargets,
    operatingBudgetReadiness,
    tensorAuthorityGate,
    downstreamGates,
  });
  const firstFrontierItem = frontierResolutionQueue[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION,
    generatedAt: receiptLoop.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: receiptLoop.selectedProfileId,
    receiptLoopRef: "nhm2_layer_stack_full_apparatus_receipt_loop/v1",
    frozenCandidate: {
      candidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
      architectureId: row.architectureId,
      architectureKind: row.architectureKind,
      materialCandidate: row.materialCandidate,
      selectionMethod: "highest_receipt_loop_readiness_nonfailed_row",
      sourceRetention: row.sourceRetention,
      supportStressMPa: row.supportStressMPa,
      pullInMargin: row.pullInMargin,
    },
    receiptTargets,
    tensorAuthorityGate,
    downstreamGates,
    falsificationMap,
    frontierResolutionQueue,
    summary: {
      sourceCandidateStatus,
      firstBlocker,
      firstFrontierCampaignDomain: firstFrontierItem?.campaignDomain ?? "none",
      firstFrontierResolutionMode: firstFrontierItem?.resolutionMode ?? "none",
      frontierResolutionItemCount: frontierResolutionQueue.length,
      allReceiptsPresent,
      operatingBudgetsReady,
      operatingBudgetsFalsifyCurrentCandidate,
      fullApparatusTensorCoverageComplete,
      downstreamGatesPass,
      decisiveFalsificationMapAvailable: falsificationMap.length > 0,
      physicallyCredibleSourceCandidate,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      routeEtaClaimAllowed: false,
    },
    researchRefs: [
      "pmc_2024_casimir_mems_review",
      "physrevb_72_115426_roughness_pull_in",
      "physrevb_87_125413_roughness_mems_actuation",
      "physrevresearch_2_023355_patch_potential_measurement",
      "arxiv_1207_4429_surface_potential_nanomebrane",
      "rspa_2020_0311_casimir_pull_in_framework",
      "physrevapplied_15_034063_high_stress_sin",
      "nature_2025_aln_alscn_mems_mirror_review",
      "apl_127_222202_high_stress_tin",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      validationPlanOnly: true,
      physicallyCredibleSourceCandidateIsNotPhysicalViability: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      sourceTensorMustNotCopyMetricTarget: true,
      fullSolveRequiresDownstreamGateClosure: true,
      operatingBudgetReadinessRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourcePhysicalValidationPlan = (
  value: unknown,
): value is Nhm2TileSourcePhysicalValidationPlanV1 => {
  if (!isRecord(value)) return false;
  const candidate = isRecord(value.frozenCandidate) ? value.frozenCandidate : null;
  const receiptTargets = Array.isArray(value.receiptTargets) ? value.receiptTargets : null;
  const tensorAuthorityGate = isRecord(value.tensorAuthorityGate) ? value.tensorAuthorityGate : null;
  const downstreamGates = Array.isArray(value.downstreamGates) ? value.downstreamGates : null;
  const falsificationMap = Array.isArray(value.falsificationMap) ? value.falsificationMap : null;
  const frontierResolutionQueue = Array.isArray(value.frontierResolutionQueue)
    ? value.frontierResolutionQueue
    : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_PHYSICAL_VALIDATION_PLAN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.receiptLoopRef === "nhm2_layer_stack_full_apparatus_receipt_loop/v1" &&
    candidate != null &&
    candidate.candidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    typeof candidate.architectureId === "string" &&
    typeof candidate.sourceRetention === "number" &&
    typeof candidate.supportStressMPa === "number" &&
    receiptTargets != null &&
    receiptTargets.length === 7 &&
    receiptTargets.every(
      (target) =>
        isRecord(target) &&
        typeof target.targetId === "string" &&
        typeof target.status === "string" &&
        ["pass", "review", "fail", "not_run"].includes(target.status) &&
        isRecord(target.targetValues) &&
        (target.evidenceRef === null || typeof target.evidenceRef === "string") &&
        Array.isArray(target.literatureRefs) &&
        typeof target.requiredChange === "string" &&
        Array.isArray(target.blockers),
    ) &&
    tensorAuthorityGate != null &&
    typeof tensorAuthorityGate.sourceTensorAuthorityCandidateAllowed === "boolean" &&
    Array.isArray(tensorAuthorityGate.blockers) &&
    downstreamGates != null &&
    downstreamGates.length === 7 &&
    downstreamGates.every(
      (gate) =>
        isRecord(gate) &&
        typeof gate.gateId === "string" &&
        typeof gate.status === "string" &&
        ["pass", "review", "fail", "not_run"].includes(gate.status) &&
        (gate.artifactRef === null || typeof gate.artifactRef === "string") &&
        typeof gate.requiredChange === "string" &&
        Array.isArray(gate.blockers),
    ) &&
    falsificationMap != null &&
    falsificationMap.every(
      (item) =>
        isRecord(item) &&
        typeof item.blocker === "string" &&
        (item.numericalMargin === null || typeof item.numericalMargin === "number") &&
        (item.marginUnit === null || typeof item.marginUnit === "string") &&
        typeof item.requiredChange === "string" &&
        typeof item.falsifiesCurrentCandidate === "boolean",
    ) &&
    frontierResolutionQueue != null &&
    frontierResolutionQueue.every(
      (item) =>
        isRecord(item) &&
        typeof item.rank === "number" &&
        Number.isInteger(item.rank) &&
        item.rank > 0 &&
        typeof item.campaignDomain === "string" &&
        [
          "material_coupon_behavior",
          "force_gap_pull_in",
          "roughness_patch_potential",
          "active_control_energy_noise_heat_timing",
          "fatigue_layer_scaling",
          "full_apparatus_tensor",
          "downstream_residual_conservation_qei_observer",
          "campaign_coordination",
        ].includes(item.campaignDomain) &&
        typeof item.resolutionMode === "string" &&
        [
          "supply_experimental_receipt",
          "supply_operating_budget_receipt",
          "supply_same_basis_full_apparatus_tensor",
          "rerun_downstream_gate",
          "revise_architecture_or_operating_margin",
        ].includes(item.resolutionMode) &&
        typeof item.source === "string" &&
        (item.targetId === null || typeof item.targetId === "string") &&
        (item.operatingBudgetSurfaceId === null ||
          typeof item.operatingBudgetSurfaceId === "string") &&
        (item.downstreamGateId === null || typeof item.downstreamGateId === "string") &&
        typeof item.status === "string" &&
        typeof item.firstBlocker === "string" &&
        Array.isArray(item.blockerIds) &&
        item.blockerIds.every((blocker) => typeof blocker === "string") &&
        (item.numericalMargin === null || typeof item.numericalMargin === "number") &&
        (item.marginUnit === null || typeof item.marginUnit === "string") &&
        typeof item.evidenceTarget === "string" &&
        typeof item.requiredChange === "string" &&
        typeof item.nextEvidenceArtifact === "string" &&
        typeof item.measurementTargetSummary === "string" &&
        typeof item.falsificationRule === "string" &&
        isRecord(item.requiredCorrections) &&
        Array.isArray(item.prevents) &&
        item.prevents.every((entry) => typeof entry === "string") &&
        Array.isArray(item.evidenceRefs) &&
        item.evidenceRefs.every((entry) => typeof entry === "string") &&
        item.blocksPhysicallyCredibleSourceCandidate === true &&
        isRecord(item.claimBoundary) &&
        item.claimBoundary.diagnosticOnly === true &&
        item.claimBoundary.frontierQueueDoesNotSupplyEvidence === true &&
        item.claimBoundary.resolvingItemRequiresNewReceiptOrArtifact === true,
    ) &&
    summary != null &&
    typeof summary.sourceCandidateStatus === "string" &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.firstFrontierCampaignDomain === "string" &&
    typeof summary.firstFrontierResolutionMode === "string" &&
    typeof summary.frontierResolutionItemCount === "number" &&
    typeof summary.allReceiptsPresent === "boolean" &&
    typeof summary.operatingBudgetsReady === "boolean" &&
    typeof summary.operatingBudgetsFalsifyCurrentCandidate === "boolean" &&
    typeof summary.fullApparatusTensorCoverageComplete === "boolean" &&
    typeof summary.downstreamGatesPass === "boolean" &&
    typeof summary.decisiveFalsificationMapAvailable === "boolean" &&
    typeof summary.physicallyCredibleSourceCandidate === "boolean" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    summary.speedAuthorityClaimAllowed === false &&
    summary.routeEtaClaimAllowed === false &&
    Array.isArray(value.researchRefs) &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.validationPlanOnly === true &&
    boundary.physicallyCredibleSourceCandidateIsNotPhysicalViability === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.sourceTensorMustNotCopyMetricTarget === true &&
    boundary.fullSolveRequiresDownstreamGateClosure === true &&
    boundary.operatingBudgetReadinessRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false
  );
};
