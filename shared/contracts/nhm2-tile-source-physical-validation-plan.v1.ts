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

export type Nhm2TileSourcePhysicalValidationDecisiveMeasurementV1 = {
  measurementId: string;
  quantity: string;
  target: string;
  unit: string | null;
  evidenceArtifact: string;
  marginKey: string | null;
  currentMargin: number | boolean | null;
  requiredCorrectionKey: string | null;
  requiredCorrectionValue: Nhm2TileSourceOperatingBudgetCorrectionValueV1 | null;
  goCriterion: string;
  noGoCriterion: string;
  falsificationConsequence: string;
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
  decisiveMeasurements: Nhm2TileSourcePhysicalValidationDecisiveMeasurementV1[];
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
    downstreamGateArtifactRefs?: Partial<Record<Nhm2TileSourceDownstreamGateV1["gateId"], string | null>> | null;
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
  requestedStatus: Nhm2TileSourceGateStatus,
  requiredChange: string,
  blockers?: string[],
  artifactRef?: string | null,
): Nhm2TileSourceDownstreamGateV1 => ({
  gateId,
  status:
    requestedStatus === "pass" && artifactRef == null
      ? "review"
      : requestedStatus,
  artifactRef: artifactRef ?? null,
  requiredChange,
  blockers:
    requestedStatus === "pass" && artifactRef == null
      ? [`${gateId}_artifact_ref_missing_for_pass`]
      : requestedStatus === "pass"
        ? []
        : blockers ?? [`${gateId}_${requestedStatus === "not_run" ? "not_run" : "incomplete"}`],
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
      return "artifact://nhm2/downstream-gates/regional-residual-closure-v1";
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
      return "Full apparatus source tensor must provide nhm2_tile_source_full_apparatus_tensor_values/v1 with 10 component refs, 9 stress-energy term refs, upstream subsystem receipt refs, wall/hull/exterior supports, same chart/basis/units, and no metric-target echo.";
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

const DECISIVE_MEASUREMENT_TEMPLATES: Record<
  Nhm2TileSourcePhysicalValidationCampaignDomainV1,
  Array<
    Omit<
      Nhm2TileSourcePhysicalValidationDecisiveMeasurementV1,
      "currentMargin" | "requiredCorrectionValue"
    >
  >
> = {
  material_coupon_behavior: [
    {
      measurementId: "coupon_fracture_yield_margin",
      quantity: "fracture or yield stress margin against 2x support stress",
      target: "fracture/yield stress >= 1.09141417572e9 Pa",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://material_coupon/fracture_yield_margin_v1",
      marginKey: "fractureOrYieldStressMargin",
      requiredCorrectionKey: "fractureOrYieldStressShortfallPa",
      goCriterion: "margin >= 1 with curve provenance tied to 4 K / 447-layer load case",
      noGoCriterion: "margin < 1 or fracture/yield curve missing",
      falsificationConsequence: "447-layer TiN support stack is mechanically inadmissible",
    },
    {
      measurementId: "coupon_dielectric_response",
      quantity: "dielectric response at 15 GHz and 4 K",
      target: "dielectric response ref and finite loss tangent at 15 GHz / 4 K",
      unit: null,
      evidenceArtifact: "receipt://material_coupon/dielectric_response_v1",
      marginKey: "dielectricResponseReceiptComplete",
      requiredCorrectionKey: "dielectricResponseReceiptComplete",
      goCriterion: "dielectric response ref includes finite numeric loss tangent at target frequency/temperature",
      noGoCriterion: "dielectric response missing, not numeric, or not tied to 15 GHz / 4 K",
      falsificationConsequence: "material receipt cannot support Lifshitz/source-tensor dielectric credibility",
    },
    {
      measurementId: "coupon_conductivity_response",
      quantity: "conductivity response at 15 GHz and 4 K",
      target: "conductivity ref and finite positive conductivity at 15 GHz / 4 K",
      unit: null,
      evidenceArtifact: "receipt://material_coupon/conductivity_v1",
      marginKey: "conductivityReceiptComplete",
      requiredCorrectionKey: "conductivityReceiptComplete",
      goCriterion: "conductivity response ref includes finite positive conductivity at target frequency/temperature",
      noGoCriterion: "conductivity response missing, non-positive, or not tied to 15 GHz / 4 K",
      falsificationConsequence: "material receipt cannot support Lifshitz/source-tensor conductivity credibility",
    },
  ],
  force_gap_pull_in: [
    {
      measurementId: "pull_in_margin",
      quantity: "spring stiffness margin against Casimir force gradient",
      target: "pull-in margin >= 1",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://force_gap_pull_in/pull_in_margin_8nm_v1",
      marginKey: "pullInMarginToIdealGradient",
      requiredCorrectionKey: "springConstantShortfallNPerM",
      goCriterion: "effective stiffness exceeds force gradient at 8 nm",
      noGoCriterion: "pull-in margin < 1",
      falsificationConsequence: "447-layer gap collapses or cannot be operated statically",
    },
  ],
  roughness_patch_potential: [
    {
      measurementId: "patch_voltage_correlation_length",
      quantity: "patch-voltage spatial correlation length",
      target: "positive patch-potential correlation length tied to the voltage map",
      unit: "m",
      evidenceArtifact: "receipt://roughness_patch_metrology/patch_voltage_correlation_length_v1",
      marginKey: "patchVoltageCorrelationLengthAvailable",
      requiredCorrectionKey: "patchVoltageCorrelationLengthAvailable",
      goCriterion: "patch correlation length is positive and registered to the voltage/roughness maps",
      noGoCriterion: "patch correlation length is missing or not registered to the surface maps",
      falsificationConsequence: "patch-potential electrostatic force cannot be bounded from RMS voltage alone",
    },
    {
      measurementId: "patch_potential_force_fraction",
      quantity: "patch-potential electrostatic force fraction",
      target: "residual electrostatic force <= 5% of Casimir load",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://roughness_patch_metrology/patch_potential_force_v1",
      marginKey: "residualElectrostaticMargin",
      requiredCorrectionKey: "residualElectrostaticForceFractionReduction",
      goCriterion: "residual electrostatic margin >= 1",
      noGoCriterion: "patch/electrostatic correction exceeds 5% or is unbounded",
      falsificationConsequence: "source row is contaminated by electrostatic stress-energy",
    },
  ],
  active_control_energy_noise_heat_timing: [
    {
      measurementId: "active_control_bandwidth",
      quantity: "gap-control bandwidth",
      target: "bandwidth >= 30 GHz for 15 GHz switching",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://active_control/bandwidth_15ghz_switching_v1",
      marginKey: "bandwidthMargin",
      requiredCorrectionKey: "bandwidthShortfallHz",
      goCriterion: "bandwidth margin >= 1",
      noGoCriterion: "bandwidth below 30 GHz or trace missing",
      falsificationConsequence: "time-dependent source cannot be synchronized to the campaign",
    },
    {
      measurementId: "active_control_source_tensor_contamination",
      quantity: "active-control source-tensor contamination fraction",
      target: "active-control fields/noise/sidebands contribute <= 5% of apparatus source tensor",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://active_control/source_tensor_contamination_v1",
      marginKey: "sourceTensorContaminationMargin",
      requiredCorrectionKey: "sourceTensorContaminationFractionReduction",
      goCriterion: "active-control source-tensor contamination margin >= 1 with model provenance",
      noGoCriterion: "active-control field/noise/thermal/timing sidebands exceed 5% or are unbounded",
      falsificationConsequence:
        "controller lock cannot be admitted into full-apparatus T_mu_nu without quantifying active-control stress-energy contamination",
    },
  ],
  fatigue_layer_scaling: [
    {
      measurementId: "fatigue_provenance_refs",
      quantity: "fatigue load-spectrum, cycle, cryogenic, curve, thermal, creep, delamination, and adhesion refs",
      target: "8 fatigue provenance refs",
      unit: "ref count",
      evidenceArtifact: "receipt://fatigue_lifetime/provenance_refs_v1",
      marginKey: "fatigueProvenanceRefsAvailable",
      requiredCorrectionKey: "missingFatigueProvenanceRefCount",
      goCriterion: "all fatigue, drift, thermal, delamination, and adhesion provenance refs are present",
      noGoCriterion: "fatigue scalar margins are supplied without required protocol and curve provenance",
      falsificationConsequence: "fatigue/lifetime evidence cannot be tied to the frozen 447-layer campaign",
    },
    {
      measurementId: "fatigue_cycle_margin",
      quantity: "cycle-count margin under load spectrum",
      target: "cycle margin >= 1",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://fatigue_lifetime/cycle_count_margin_v1",
      marginKey: "cycleMargin",
      requiredCorrectionKey: "cycleCountShortfall",
      goCriterion: "cycle margin >= 1 with load-spectrum provenance",
      noGoCriterion: "cycle margin < 1 or fatigue curve missing",
      falsificationConsequence: "device cannot survive the campaign duty history",
    },
    {
      measurementId: "thermal_cycle_drift",
      quantity: "thermal-cycle drift fraction",
      target: "thermal-cycle drift <= 0.01",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://fatigue_lifetime/thermal_cycle_drift_v1",
      marginKey: "thermalCycleDriftMargin",
      requiredCorrectionKey: "thermalCycleDriftReduction",
      goCriterion: "thermal-cycle drift margin >= 1",
      noGoCriterion: "thermal cycling changes the 8 nm operating gap beyond tolerance",
      falsificationConsequence: "layered gap geometry cannot remain frozen over campaign operation",
    },
    {
      measurementId: "layer_scaling_provenance_refs",
      quantity: "layer scaling, variation, nonadditivity, active-area, coupling, multiphysics, and retention refs",
      target: "9 layer-scaling provenance refs",
      unit: "ref count",
      evidenceArtifact: "receipt://layer_scaling/provenance_refs_v1",
      marginKey: "layerScalingProvenanceRefsAvailable",
      requiredCorrectionKey: "missingLayerScalingProvenanceRefCount",
      goCriterion: "all layer-scaling, variation, coupling, and retention refs are present",
      noGoCriterion: "layer scaling values are supplied without required maps and coupling provenance",
      falsificationConsequence: "447-layer additivity cannot be evaluated as a physical source architecture",
    },
    {
      measurementId: "layer_nonadditivity",
      quantity: "layer nonadditivity fraction",
      target: "layer nonadditivity <= 0.1",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://layer_scaling/nonadditivity_v1",
      marginKey: "nonadditivityMargin",
      requiredCorrectionKey: "layerNonadditivityReduction",
      goCriterion: "nonadditivity margin >= 1 with model provenance",
      noGoCriterion: "nonadditivity exceeds 10% or model is missing",
      falsificationConsequence: "447 layers cannot be assumed to scale from a single tile row",
    },
    {
      measurementId: "support_coupling_status",
      quantity: "support coupling admission status",
      target: "support coupling status = pass",
      unit: "status",
      evidenceArtifact: "receipt://layer_scaling/support_coupling_status_v1",
      marginKey: "supportCouplingStatusSatisfied",
      requiredCorrectionKey: "supportCouplingStatusSatisfied",
      goCriterion: "support coupling status is pass with map provenance",
      noGoCriterion: "support coupling status is review, fail, missing, or unreceipted",
      falsificationConsequence: "support structure changes the tile source tensor instead of merely holding it",
    },
    {
      measurementId: "effective_active_layer_count",
      quantity: "effective active layer count after scaling and area retention",
      target: "effective active layers >= 217.242",
      unit: "layers",
      evidenceArtifact: "receipt://layer_scaling/effective_active_layer_count_v1",
      marginKey: "effectiveActiveLayerCountMargin",
      requiredCorrectionKey: "effectiveActiveLayerCountShortfall",
      goCriterion: "effective active layer count clears the reduced-order minimum",
      noGoCriterion: "scaling, nonadditivity, or active-area loss leaves too few active layers",
      falsificationConsequence: "447-layer geometry cannot preserve enough active Casimir area",
    },
    {
      measurementId: "source_tensor_retention",
      quantity: "source tensor retention after layer/support coupling",
      target: "source tensor retention >= 0.9",
      unit: "dimensionless margin",
      evidenceArtifact: "receipt://layer_scaling/source_tensor_retention_v1",
      marginKey: "sourceTensorRetentionMargin",
      requiredCorrectionKey: "sourceTensorRetentionFractionShortfall",
      goCriterion: "source-tensor retention margin >= 1",
      noGoCriterion: "source tensor retention below 0.9",
      falsificationConsequence: "full apparatus tensor cannot inherit the scalar layer budget",
    },
  ],
  full_apparatus_tensor: [
    {
      measurementId: "tensor_value_artifact",
      quantity: "source-side full apparatus tensor value artifact",
      target: "tensor value artifact contract present and typed",
      unit: "boolean",
      evidenceArtifact: "receipt://full_apparatus_tensor/tensor_value_artifact_v1",
      marginKey: "tensorValueArtifactAvailable",
      requiredCorrectionKey: "tensorValueArtifactAvailable",
      goCriterion: "tensor value artifact exists with nhm2_tile_source_full_apparatus_tensor_values/v1 contract",
      noGoCriterion: "full apparatus tensor is asserted without a typed tensor-value artifact",
      falsificationConsequence: "source-side same-basis authority has no tensor object to consume",
    },
    {
      measurementId: "tensor_authority_metadata",
      quantity: "same-chart, same-basis, same-unit, no-target-echo metadata",
      target: "4 authority metadata fields complete",
      unit: "metadata count",
      evidenceArtifact: "receipt://full_apparatus_tensor/authority_metadata_v1",
      marginKey: "authorityMetadataComplete",
      requiredCorrectionKey: "authorityMetadataMissingCount",
      goCriterion: "same chart, same basis, same units, and no metric-target echo are all receipted",
      noGoCriterion: "authority metadata is missing or metric-target echo is unchecked",
      falsificationConsequence: "source tensor cannot be compared to the metric-required tensor",
    },
    {
      measurementId: "tensor_component_detail_refs",
      quantity: "source-side full tensor component coverage",
      target: "10 component refs covering T00, T0i, diagonal Tij, off-diagonal Tij",
      unit: "coverage fraction",
      evidenceArtifact: "receipt://full_apparatus_tensor/component_detail_refs_v1",
      marginKey: "componentDetailRefsComplete",
      requiredCorrectionKey: "tensorComponentRefMissingCount",
      goCriterion: "component coverage fraction = 1",
      noGoCriterion: "any required component missing, scalar-proxy, or silently zeroed",
      falsificationConsequence: "source-side same-basis tensor authority cannot pass",
    },
    {
      measurementId: "apparatus_stress_energy_term_refs",
      quantity: "apparatus stress-energy term coverage",
      target: "9 term refs: Casimir, support, spacer, electrostatic, active-control, thermal, strain, fatigue, layer-scaling",
      unit: "coverage fraction",
      evidenceArtifact: "receipt://full_apparatus_tensor/stress_energy_terms_v1",
      marginKey: "termRefsComplete",
      requiredCorrectionKey: "stressEnergyTermRefMissingCount",
      goCriterion: "term coverage fraction = 1",
      noGoCriterion: "support/control/electrostatic/thermal/material terms hidden",
      falsificationConsequence: "apparatus tensor is incomplete and cannot represent the real tile source",
    },
    {
      measurementId: "subsystem_receipt_traceability",
      quantity: "upstream subsystem receipt refs for full-apparatus tensor terms",
      target:
        "material coupon, force-gap, roughness/patch, active-control, and fatigue/layer-scaling refs complete",
      unit: "ref count",
      evidenceArtifact: "receipt://full_apparatus_tensor/subsystem_receipt_traceability_v1",
      marginKey: "subsystemReceiptRefsComplete",
      requiredCorrectionKey: "subsystemReceiptRefMissingCount",
      goCriterion: "all five upstream subsystem receipt refs are present and tied to the tensor terms",
      noGoCriterion: "full-apparatus tensor terms are asserted without upstream experimental receipt refs",
      falsificationConsequence:
        "full-apparatus tensor cannot be admitted as material-source evidence independent of its subsystem receipts",
    },
    {
      measurementId: "regional_support_refs",
      quantity: "wall/hull/exterior regional tensor support coverage",
      target: "wall, hull, and exterior_shell support refs complete",
      unit: "coverage fraction",
      evidenceArtifact: "receipt://full_apparatus_tensor/regional_supports_v1",
      marginKey: "regionalSupportRefsComplete",
      requiredCorrectionKey: "regionalSupportRefMissingCount",
      goCriterion: "regional coverage fraction = 1 with same atlas/support basis",
      noGoCriterion: "regional supports missing or not same-basis",
      falsificationConsequence: "regional residual closure cannot consume the source tensor",
    },
  ],
  downstream_residual_conservation_qei_observer: [
    {
      measurementId: "regional_residual_closure_artifact",
      quantity: "same-chain regional residual closure artifact",
      target: "regional residual closure pass for wall, hull, and exterior_shell",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/regional-residual-closure-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "regional residual closure passes against the same source tensor/support atlas",
      noGoCriterion: "regional residual closure is missing, stale, or failing",
      falsificationConsequence: "source candidate cannot enter coupled closure without regional residual closure",
    },
    {
      measurementId: "wall_t00_closure_artifact",
      quantity: "same-chain wall T00 closure artifact",
      target: "wall T00 closure pass without broad wall-closure overclaim",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/wall-t00-closure-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "wall T00 closure passes in the same frozen chain",
      noGoCriterion: "wall T00 closure is missing, stale, or failing",
      falsificationConsequence: "global/source residuals cannot override a wall-region failure",
    },
    {
      measurementId: "covariant_conservation_artifact",
      quantity: "same-chain covariant conservation artifact",
      target: "covariant conservation pass with support/control/electrostatic/thermal terms",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/covariant-conservation-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "covariant conservation passes for the full apparatus tensor and regional supports",
      noGoCriterion: "conservation is missing, stale, failing, or omits apparatus terms",
      falsificationConsequence: "the source tensor cannot be admitted as a conserved stress-energy candidate",
    },
    {
      measurementId: "qei_worldline_dossier_artifact",
      quantity: "same-chain QEI worldline dossier",
      target: "wall and transition worldline QEI dossier pass with bound provenance",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/qei-worldline-dossier-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "QEI dossier passes with worldlines, sampling, tau/applicability, and bound receipts",
      noGoCriterion: "QEI is scalar-only, missing, stale, failing, or lacks bound provenance",
      falsificationConsequence: "scalar qei_margin cannot substitute for a worldline dossier",
    },
    {
      measurementId: "observer_family_energy_conditions_artifact",
      quantity: "same-chain observer-family energy-condition artifact",
      target: "observer-family WEC/NEC/SEC/DEC diagnostics pass or report violations",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/observer-family-energy-conditions-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "observer-family diagnostics pass for the same full apparatus tensor",
      noGoCriterion: "observer check is missing, Eulerian-only, stale, failing, or optimizer scope is misrepresented",
      falsificationConsequence: "friendly-observer checks cannot support robust energy-condition claims",
    },
    {
      measurementId: "material_credibility_artifact",
      quantity: "same-chain material credibility artifact",
      target: "material credibility pass over all supplied tile-source receipts",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/material-credibility-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "material credibility passes over coupon, gap, roughness, control, fatigue, scaling, and tensor receipts",
      noGoCriterion: "material credibility is missing, stale, failing, or backed only by ideal scalar Casimir math",
      falsificationConsequence: "diagnostic source tensors cannot be treated as material evidence",
    },
    {
      measurementId: "coupled_closure_artifact",
      quantity: "same-chain coupled closure artifact",
      target: "coupled closure pass after source authority, residuals, conservation, QEI, observer, and material gates",
      unit: null,
      evidenceArtifact: "artifact://nhm2/downstream-gates/coupled-closure-v1",
      marginKey: null,
      requiredCorrectionKey: null,
      goCriterion: "coupled closure passes in one frozen run/profile/artifact chain",
      noGoCriterion: "coupled closure is missing, stale, false, or mixes incompatible artifacts",
      falsificationConsequence: "no physical, transport, propulsion, route ETA, speed, or wall-closure claim is allowed",
    },
  ],
  campaign_coordination: [
    {
      measurementId: "reference_capsule_congruence",
      quantity: "single frozen profile/run/artifact capsule congruence",
      target: "one profile, run, atlas, source tensor, receipt, authority, and downstream artifact set",
      unit: null,
      evidenceArtifact: "artifact://nhm2/campaign/reference-capsule-congruence-v1",
      marginKey: null,
      requiredCorrectionKey: "staleOrMissingReferenceCapsuleInputs",
      goCriterion: "all artifacts are pinned and mutually congruent",
      noGoCriterion: "latest aliases, stale refs, or profile mismatches remain",
      falsificationConsequence: "campaign evidence cannot be read as a coherent source-candidate run",
    },
  ],
};

const decisiveMeasurementsFromDomain = (
  domain: Nhm2TileSourcePhysicalValidationCampaignDomainV1,
  numericalMargins: Record<string, number | boolean | null>,
  requiredCorrections: Record<string, Nhm2TileSourceOperatingBudgetCorrectionValueV1>,
): Nhm2TileSourcePhysicalValidationDecisiveMeasurementV1[] =>
  DECISIVE_MEASUREMENT_TEMPLATES[domain].map((measurement) => ({
    ...measurement,
    currentMargin:
      measurement.marginKey == null
        ? null
        : numericalMargins[measurement.marginKey] ?? null,
    requiredCorrectionValue:
      measurement.requiredCorrectionKey == null
        ? null
        : requiredCorrections[measurement.requiredCorrectionKey] ?? null,
  }));

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
  numericalMargins?: Record<string, number | boolean | null>;
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
  decisiveMeasurements: decisiveMeasurementsFromDomain(
    args.campaignDomain,
    args.numericalMargins ?? {},
    args.requiredCorrections ?? {},
  ),
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
                numericalMargins: status.numericalMargins,
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
  const downstreamArtifactRefs = input.downstreamGateArtifactRefs ?? {};
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
      undefined,
      downstreamArtifactRefs.regional_residual_closure ?? null,
    ),
    downstreamGate(
      "wall_t00_closure",
      downstreamStatuses.wall_t00_closure ?? "not_run",
      "Run wall T00 closure without treating T00-only closure as broad wall closure.",
      undefined,
      downstreamArtifactRefs.wall_t00_closure ?? null,
    ),
    downstreamGate(
      "covariant_conservation",
      downstreamStatuses.covariant_conservation ?? "not_run",
      "Run covariant conservation with support/control/electrostatic/thermal terms included.",
      undefined,
      downstreamArtifactRefs.covariant_conservation ?? null,
    ),
    downstreamGate(
      "qei_worldline_dossier",
      downstreamStatuses.qei_worldline_dossier ?? "not_run",
      "Run QEI worldline dossier against the candidate apparatus tensor.",
      undefined,
      downstreamArtifactRefs.qei_worldline_dossier ?? null,
    ),
    downstreamGate(
      "observer_family_energy_conditions",
      downstreamStatuses.observer_family_energy_conditions ?? "not_run",
      "Run observer-family WEC/NEC/SEC/DEC diagnostics against the candidate apparatus tensor.",
      undefined,
      downstreamArtifactRefs.observer_family_energy_conditions ?? null,
    ),
    downstreamGate(
      "material_credibility",
      materialCredibilityStatus,
      "Run material credibility admission over coupon, force-gap, roughness, patch, control, fatigue, and scaling receipts.",
      materialCredibilityAdmissionBlockers.length > 0
        ? materialCredibilityAdmissionBlockers
        : undefined,
      downstreamArtifactRefs.material_credibility ?? null,
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
      downstreamArtifactRefs.coupled_closure ?? null,
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

const isCorrectionValue = (
  value: unknown,
): value is Nhm2TileSourceOperatingBudgetCorrectionValueV1 =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value)) ||
  (Array.isArray(value) && value.every((entry) => typeof entry === "string"));

const isDecisiveMeasurementList = (
  value: unknown,
): value is Nhm2TileSourcePhysicalValidationDecisiveMeasurementV1[] =>
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
        Object.values(item.requiredCorrections).every(isCorrectionValue) &&
        isDecisiveMeasurementList(item.decisiveMeasurements) &&
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
