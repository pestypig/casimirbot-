import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import type {
  HullMetricVolumeRefV1,
  HullMisRenderRequestV1,
  HullMisRenderResponseV1,
  HullScientificRenderView,
} from "../shared/hull-render-contract";
import {
  computeWarpRodcChecksum,
  WARP_RODC_SNAPSHOT_SCHEMA_VERSION,
  type WarpRodcSnapshotV1,
  type WarpRodcStability,
  type WarpRodcVerdictStatus,
} from "../shared/warp-rodc-contract";
import {
  hashFloat32,
  loadHullScientificSnapshot,
  resolveMetricRefHash,
} from "../server/lib/hull-scientific-snapshot";
import {
  computeYorkDiagnosticLaneField,
  isYorkDiagnosticLaneId,
  YORK_DIAGNOSTIC_BASELINE_LANE_ID,
  YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
  type YorkDiagnosticLaneId,
} from "../shared/york-diagnostic-lanes";

const DATE_STAMP = new Date().toISOString().slice(0, 10);
const FULL_SOLVE_DIR = path.join("artifacts", "research", "full-solve");
const DOC_AUDIT_DIR = path.join("docs", "audits", "research");
const DEFAULT_BASE_URL = "http://127.0.0.1:5050";
const DEFAULT_FRAME_ENDPOINT = "http://127.0.0.1:6062/api/helix/hull-render/frame";
const DEFAULT_PROXY_FRAME_ENDPOINT = `${DEFAULT_BASE_URL}/api/helix/hull-render/frame`;
const DEFAULT_NHM2_SNAPSHOT_PATH = path.join(
  FULL_SOLVE_DIR,
  "nhm2-snapshot-congruence-evidence-latest.json",
);
const DEFAULT_OUT_JSON = path.join(
  FULL_SOLVE_DIR,
  `warp-york-control-family-proof-pack-${DATE_STAMP}.json`,
);
const DEFAULT_OUT_MD = path.join(
  DOC_AUDIT_DIR,
  `warp-york-control-family-proof-pack-${DATE_STAMP}.md`,
);
const DEFAULT_LATEST_JSON = path.join(
  FULL_SOLVE_DIR,
  "warp-york-control-family-proof-pack-latest.json",
);
const DEFAULT_RODC_OUT_JSON = path.join(
  FULL_SOLVE_DIR,
  `warp-york-control-family-rodc-${DATE_STAMP}.json`,
);
const DEFAULT_RODC_LATEST_JSON = path.join(
  FULL_SOLVE_DIR,
  "warp-york-control-family-rodc-latest.json",
);
const DEFAULT_LATEST_MD = path.join(
  DOC_AUDIT_DIR,
  "warp-york-control-family-proof-pack-latest.md",
);
const YORK_DIAGNOSTIC_CONTRACT_PATH = path.join(
  "configs",
  "york-diagnostic-contract.v1.json",
);
const BOUNDARY_STATEMENT =
  "This control-family proof pack is a render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim.";
const RETRYABLE_RENDER_ERRORS = new Set([
  "scientific_metric_volume_unavailable",
  "metric_ref_decode_failed",
  "metric_ref_http_502",
  "metric_ref_http_503",
  "metric_ref_http_504",
]);
const NHM2_DIAGNOSTIC_OUTCOME = {
  ALCUBIERRE_LIKE: "nhm2_alcubierre_like_family",
  LOW_EXPANSION_LIKE: "nhm2_low_expansion_family",
  DISTINCT_NHM2_FAMILY: "nhm2_distinct_family",
} as const;

type CaseId = "alcubierre_control" | "natario_control" | "nhm2_certified";
type DecisionRowStatus = "true" | "false";
type Nhm2DiagnosticOutcome = (typeof NHM2_DIAGNOSTIC_OUTCOME)[keyof typeof NHM2_DIAGNOSTIC_OUTCOME];
type DecisionVerdict = Nhm2DiagnosticOutcome | "inconclusive";
type SharedLaneCauseCode =
  | "render_parity_failure"
  | "theta_ktrace_contract_failure"
  | "snapshot_identity_failure"
  | "missing_required_view"
  | "missing_required_hash";
type LaneFamilyCauseCode =
  | "lane_a_family_congruent"
  | "lane_a_family_distinct"
  | "lane_a_family_inconclusive"
  | "lane_b_family_congruent"
  | "lane_b_family_distinct"
  | "lane_b_family_inconclusive";
type LaneCauseCode = SharedLaneCauseCode | LaneFamilyCauseCode;

type GuardFailure = {
  code: string;
  detail: string;
};

type ProofPackPreconditions = {
  controlsIndependent: boolean;
  allRequiredViewsRendered: boolean;
  provenanceHashesPresent: boolean;
  runtimeStatusProvenancePresent: boolean;
  offlineRenderParityComputed?: boolean;
  thetaKTraceParityComputed?: boolean;
  snapshotIdentityComplete?: boolean;
  diagnosticParityClosed?: boolean;
  // Legacy alias kept for compatibility with existing artifacts/tests.
  laneAParityClosed?: boolean;
  readyForFamilyVerdict: boolean;
};

type YorkRenderLane = "single" | "direct" | "proxy";

type YorkLaneResultSummary = {
  lane: YorkRenderLane;
  endpoint: string;
  ok: boolean;
  httpStatus: number | null;
  errorCode: string | null;
  responseMessage: string | null;
  preflightBranch: string | null;
  preflightRequirement: string | null;
  error: string | null;
};

type YorkViewSummary = {
  view: HullScientificRenderView;
  ok: boolean;
  backend: string | null;
  scientificTier: string | null;
  error: string | null;
  sourceLane: YorkRenderLane | null;
  endpoint: string | null;
  httpStatus: number | null;
  errorCode: string | null;
  responseMessage: string | null;
  preflightBranch: string | null;
  preflightRequirement: string | null;
  laneResults: YorkLaneResultSummary[];
  note: string | null;
  render: {
    view: HullScientificRenderView | null;
    field_key: string | null;
    lane_id: string | null;
    slice_plane: string | null;
    coordinate_mode: string | null;
    normalization: string | null;
    magnitude_mode: string | null;
    surface_height: string | null;
    support_overlay: string | null;
  };
  identity: {
    lane_id: string | null;
    metric_ref_hash: string | null;
    timestamp_ms: number | null;
    chart: string | null;
    observer: string | null;
    theta_definition: string | null;
    kij_sign_convention: string | null;
    unit_system: string | null;
  };
  rawExtrema: {
    min: number | null;
    max: number | null;
    absMax: number | null;
  };
  displayExtrema: {
    min: number | null;
    max: number | null;
    absMax: number | null;
    rangeMethod: string | null;
    gain: number | null;
    heightScale: number | null;
  };
  nearZeroTheta: boolean | null;
  samplingChoice: string | null;
  supportOverlapPct: number | null;
  supportedThetaFraction: number | null;
  shellSupportCount: number | null;
  shellActiveCount: number | null;
  hashes: {
    certificate_hash: string | null;
    frame_hash: string | null;
    theta_channel_hash: string | null;
    slice_array_hash: string | null;
    normalized_slice_hash: string | null;
    support_mask_slice_hash: string | null;
    shell_masked_slice_hash: string | null;
  };
  laneEvidence: {
    observer_definition_id: string | null;
    observer_inputs_required: string[] | null;
    observer_inputs_present: boolean | null;
    lane_b_semantic_mode: string | null;
    lane_b_tensor_inputs_hash: string | null;
    lane_b_geometry_ready: boolean | null;
    lane_b_semantics_closed: boolean | null;
  };
};

type CaseSnapshotMetrics = {
  dims: [number, number, number];
  resolvedUrl: string | null;
  metricRefHash: string | null;
  requestMetricRefHash: string | null;
  source: string | null;
  chart: string | null;
  channelHashes: {
    theta: string | null;
    K_trace: string | null;
    theta_canonical?: string | null;
    lane_contract?: string | null;
  };
  laneComputation?: {
    lane_id: string | null;
    theta_source: string | null;
    contract_source: string | null;
    observer_definition_id?: string | null;
    observer_inputs_required?: string[];
    observer_construction_inputs?: string[];
    observer_construction_formula?: string | null;
    observer_normalized?: boolean;
    observer_approximation?: string | null;
    observer_inputs_present?: boolean;
    lane_b_semantic_mode?: string | null;
    lane_b_tensor_inputs_hash?: string | null;
    lane_b_geometry_ready?: boolean;
    lane_b_semantics_closed?: boolean;
    requires_gamma_metric?: boolean;
    semantics_closed?: boolean;
    cross_lane_claim_ready?: boolean;
  };
  sourceFamily: {
    family_id: string | null;
    metricT00Ref: string | null;
    warpFieldType: string | null;
    source_branch: string | null;
    shape_function_id: string | null;
  };
  thetaPlusKTrace: {
    rms: number | null;
    maxAbs: number | null;
    mean: number | null;
    sampleCount: number;
    consistent: boolean;
  };
};

type SourceFamilyEvidence = CaseSnapshotMetrics["sourceFamily"];

type CaseResult = {
  caseId: CaseId;
  label: string;
  familyExpectation: "alcubierre-like-control" | "natario-like-control" | "nhm2-certified";
  metricVolumeRef: HullMetricVolumeRefV1;
  perView: YorkViewSummary[];
  primaryYork: {
    view: HullScientificRenderView;
    rawExtrema: YorkViewSummary["rawExtrema"] | null;
    displayExtrema: YorkViewSummary["displayExtrema"] | null;
    nearZeroTheta: boolean | null;
    coordinateMode: string | null;
    samplingChoice: string | null;
    supportOverlapPct: number | null;
  };
  snapshotMetrics: CaseSnapshotMetrics | null;
  offlineYorkAudit: CaseOfflineYorkAudit | null;
  parity: CaseLaneAParityAudit | null;
  classificationFeatures: CaseClassificationFeatures;
};

type OfflineYorkViewAudit = {
  view: "york-surface-3p1" | "york-surface-rho-3p1";
  coordinateMode: "x-z-midplane" | "x-rho";
  samplingChoice: "x-z midplane" | "x-rho cylindrical remap";
  thetaSliceHash: string | null;
  rawExtrema: {
    min: number | null;
    max: number | null;
    absMax: number | null;
  };
  counts: {
    positive: number;
    negative: number;
    zeroOrNearZero: number;
    total: number;
  };
};

type CaseOfflineYorkAudit = {
  byView: OfflineYorkViewAudit[];
  alcubierreSignedLobeSummary?: {
    foreHalfPositiveTotal: number;
    foreHalfNegativeTotal: number;
    aftHalfPositiveTotal: number;
    aftHalfNegativeTotal: number;
    signedLobeSummary: "fore+/aft-" | "fore-/aft+" | "mixed_or_flat";
  };
};

type YorkCongruenceEvaluation = {
  hashMismatch: boolean;
  rhoRemapMismatch: boolean;
  nearZeroSuppressionMismatch: boolean;
  downstreamRenderMismatch: boolean;
  guardFailures: GuardFailure[];
};

type ControlRequestSelectors = {
  metricT00Ref: string | null;
  metricT00Source: string | null;
  requireCongruentSolve: boolean;
  requireNhm2CongruentFullSolve: boolean;
  warpFieldType: string | null;
};

type ControlDebugEntry = {
  caseId: CaseId;
  label: string;
  requestUrl: string | null;
  requestSelectors: ControlRequestSelectors;
  resolvedMetricRefHash: string | null;
  requestMetricRefHash: string | null;
  thetaHash: string | null;
  kTraceHash: string | null;
  brickSource: string | null;
  chart: string | null;
  family_id: string | null;
  metricT00Ref: string | null;
  warpFieldType: string | null;
  source_branch: string | null;
  shape_function_id: string | null;
};

type DecisionRow = {
  id: string;
  condition: string;
  status: DecisionRowStatus;
  interpretation: string;
};

type YorkFeatureName =
  | "theta_abs_max_raw"
  | "theta_abs_max_display"
  | "positive_count_xz"
  | "negative_count_xz"
  | "positive_count_xrho"
  | "negative_count_xrho"
  | "support_overlap_pct"
  | "near_zero_theta"
  | "signed_lobe_summary"
  | "shell_map_activity";

type YorkSignedLobeSummary = "fore+/aft-" | "fore-/aft+" | "mixed_or_flat";

type YorkFeatureWeightMap = Record<YorkFeatureName, number>;

type ClassificationRobustnessStatus =
  | "stable_low_expansion_like"
  | "stable_alcubierre_like"
  | "stable_distinct"
  | "marginal_low_expansion_like"
  | "marginal_distinct"
  | "unstable_multiclass"
  | "inconclusive";

type YorkRobustnessFeatureDropSet = {
  id: string;
  drop_features: YorkFeatureName[];
};

type YorkRobustnessChecks = {
  enabled: boolean;
  weight_perturbation_pct: number;
  margin_variants: number[];
  threshold_variants: number[];
  feature_drop_sets: YorkRobustnessFeatureDropSet[];
  stability_policy: {
    stable_fraction_min: number;
    marginal_fraction_min: number;
  };
};

type YorkParityViewAudit = {
  view: HullScientificRenderView;
  coordinateMode: "x-z-midplane" | "x-rho" | null;
  samplingChoice: string | null;
  offlineThetaSliceHash: string | null;
  offlineNegKTraceSliceHash: string | null;
  renderThetaSliceHash: string | null;
  thetaVsRenderMaxAbsResidual: number | null;
  thetaVsKTraceMaxAbsResidual: number | null;
  signCountDelta: {
    thetaVsRender: {
      positive: number | null;
      negative: number | null;
      zeroOrNearZero: number | null;
      total: number | null;
    };
    thetaVsKTrace: {
      positive: number | null;
      negative: number | null;
      zeroOrNearZero: number | null;
      total: number | null;
    };
  };
  supportOverlapPct: {
    offline: number | null;
    render: number | null;
    delta: number | null;
  };
  extremaDelta: {
    thetaVsRender: {
      minRaw: number | null;
      maxRaw: number | null;
      absMaxRaw: number | null;
    };
    thetaVsKTrace: {
      minRaw: number | null;
      maxRaw: number | null;
      absMaxRaw: number | null;
    };
  };
  identity: {
    complete: boolean;
    laneMatches: boolean;
    metricRefMatches: boolean;
    chartMatches: boolean;
    observerMatches: boolean;
    thetaDefinitionMatches: boolean;
    kijSignConventionMatches: boolean;
    thetaHashMatches: boolean;
    timestampPresent: boolean;
  };
  status: "pass" | "fail";
  causeCode: LaneCauseCode | null;
};

type CaseLaneAParityAudit = {
  caseId: CaseId;
  parityComputed: boolean;
  thetaKTraceParityComputed: boolean;
  snapshotIdentityComplete: boolean;
  renderParityPass: boolean;
  thetaKTraceContractPass: boolean;
  byView: YorkParityViewAudit[];
  status: "pass" | "fail";
  causeCode: LaneCauseCode | null;
};

type LaneAParitySummary = {
  status: "closed" | "failed";
  causeCode: LaneCauseCode | null;
  caseSummaries: Array<{
    caseId: CaseId;
    status: "pass" | "fail";
    causeCode: LaneCauseCode | null;
  }>;
};

type YorkDiagnosticLane = {
  lane_id: string;
  active: boolean;
  supported: boolean;
  unsupported_reason: string | null;
  observer: string;
  observer_definition_id: string | null;
  observer_inputs_required: string[];
  observer_construction_inputs: string[];
  observer_construction_formula: string | null;
  observer_normalized: boolean;
  observer_approximation: string | null;
  lane_semantic_mode: string;
  foliation: string;
  theta_definition: string;
  kij_sign_convention: string;
  requires_gamma_metric: boolean;
  semantics_closed: boolean;
  cross_lane_claim_ready: boolean;
  cross_lane_claim_block_reason: string | null;
  coordinate_views: Record<string, string>;
  remap_rules: Record<string, string>;
  normalization_rules: Record<string, string>;
  classification_scope: string;
};

type YorkDiagnosticContract = {
  contract_id: string;
  version: number;
  baseline_lane_id: string;
  alternate_lane_id: string | null;
  observer: string;
  foliation: string;
  theta_definition: string;
  kij_sign_convention: string;
  coordinate_views: Record<string, string>;
  remap_rules: Record<string, string>;
  normalization_rules: Record<string, string>;
  classification_scope: string;
  reference_controls: {
    alcubierre_control: {
      description: string;
      role: string;
    };
    natario_control: {
      description: string;
      role: string;
    };
  };
  feature_set: YorkFeatureName[];
  decision_policy: {
    distance_metric: string;
    normalization_method: string;
    normalization_floor: number;
    missing_value_penalty: number;
    max_component_distance: number;
    feature_weights: YorkFeatureWeightMap;
    reference_margin_min: number;
    reference_match_threshold: number;
    distinctness_threshold: number;
  };
  robustness_checks: YorkRobustnessChecks;
  lanes: YorkDiagnosticLane[];
};

type CaseClassificationFeatures = {
  theta_abs_max_raw: number | null;
  theta_abs_max_display: number | null;
  positive_count_xz: number | null;
  negative_count_xz: number | null;
  positive_count_xrho: number | null;
  negative_count_xrho: number | null;
  support_overlap_pct: number | null;
  near_zero_theta: boolean | null;
  signed_lobe_summary: YorkSignedLobeSummary | null;
  shell_map_activity: number | null;
};

type DistanceFeatureBreakdown = Record<YorkFeatureName, number | null>;

type ReferenceDistanceSummary = {
  distance: number | null;
  breakdown: DistanceFeatureBreakdown;
};

type Nhm2ReferenceScoring = {
  distance_to_alcubierre_reference: number | null;
  distance_to_low_expansion_reference: number | null;
  reference_margin: number | null;
  winning_reference: "alcubierre_control" | "natario_control" | null;
  margin_sufficient: boolean;
  winning_reference_within_threshold: boolean;
  distinct_by_policy: boolean;
  distinctness_threshold: number;
  margin_min: number;
  reference_match_threshold: number;
  distance_metric: string;
  normalization_method: string;
  to_alcubierre_breakdown: DistanceFeatureBreakdown;
  to_low_expansion_breakdown: DistanceFeatureBreakdown;
};

type RobustnessVariantType =
  | "baseline"
  | "weight_perturbation"
  | "margin_variant"
  | "threshold_variant"
  | "feature_drop";

type ClassificationRobustnessVariantResult = {
  variant_id: string;
  variant_type: RobustnessVariantType;
  policy_patch: {
    feature_weight_feature: YorkFeatureName | null;
    feature_weight_scale: number | null;
    reference_margin_min: number | null;
    reference_match_threshold: number | null;
    dropped_features: YorkFeatureName[];
  };
  scoring: Nhm2ReferenceScoring;
  verdict: DecisionVerdict;
};

type ClassificationRobustnessSummary = {
  enabled: boolean;
  baselineVerdict: DecisionVerdict;
  variantResults: ClassificationRobustnessVariantResult[];
  verdictCounts: Record<DecisionVerdict, number>;
  dominantVerdict: DecisionVerdict | null;
  dominantFraction: number;
  stableVerdict: DecisionVerdict | null;
  stabilityStatus: ClassificationRobustnessStatus;
  stabilityPolicy: {
    stable_fraction_min: number;
    marginal_fraction_min: number;
  };
  totalVariants: number;
  evaluatedVariants: number;
};

type LaneProofPackEvaluation = {
  lane_id: string;
  active: boolean;
  supported: boolean;
  unsupported_reason: string | null;
  observer: string;
  observer_definition_id?: string | null;
  observer_inputs_required?: string[];
  observer_construction_inputs?: string[];
  observer_construction_formula?: string | null;
  observer_normalized?: boolean;
  observer_approximation?: string | null;
  lane_semantic_mode?: string | null;
  foliation: string;
  theta_definition: string;
  kij_sign_convention: string;
  requires_gamma_metric?: boolean;
  semantics_closed?: boolean;
  cross_lane_claim_ready?: boolean;
  cross_lane_claim_block_reason?: string | null;
  classification_scope: string;
  cases: CaseResult[];
  controlDebug: ControlDebugEntry[];
  preconditions: ProofPackPreconditions;
  controlsCalibratedByReferences: boolean;
  laneReadiness?: {
    laneBSemanticsClosed: boolean;
    laneBObserverDefined: boolean;
    laneBTensorInputsPresent: boolean;
    laneBGeometryReady: boolean;
    laneBControlsCalibrated: boolean;
    laneBParityClosed: boolean;
    laneBCrossLaneClaimReady: boolean;
    readyForCrossLaneComparison: boolean;
  };
  laneAParity?: LaneAParitySummary;
  causeCode?: LaneCauseCode;
  guardFailures: GuardFailure[];
  decisionTable: DecisionRow[];
  classificationScoring: Nhm2ReferenceScoring | null;
  classificationRobustness: ClassificationRobustnessSummary | null;
  verdict: DecisionVerdict;
  notes: string[];
};

type CrossLaneComparisonStatus =
  | "lane_stable_low_expansion_like"
  | "lane_stable_alcubierre_like"
  | "lane_stable_distinct"
  | "lane_dependent_between_low_and_distinct"
  | "lane_dependent_between_low_and_alcubierre"
  | "lane_dependent_between_alcubierre_and_distinct"
  | "lane_comparison_inconclusive";

type CrossLaneComparison = {
  baseline_lane_id: string | null;
  alternate_lane_id: string | null;
  baseline_verdict: DecisionVerdict | null;
  alternate_verdict: DecisionVerdict | null;
  same_classification: boolean;
  cross_lane_status: CrossLaneComparisonStatus;
  falsifiers: {
    baseline_controls_calibrated: boolean;
    alternate_controls_calibrated: boolean;
    baseline_supported: boolean;
    alternate_supported: boolean;
    lane_b_semantics_closed: boolean;
    lane_b_observer_defined: boolean;
    lane_b_tensor_inputs_present: boolean;
    lane_b_geometry_ready: boolean;
    lane_b_controls_calibrated: boolean;
    lane_b_parity_closed: boolean;
    lane_b_cross_lane_claim_ready: boolean;
  };
  notes: string[];
};

export type ProofPackPayload = {
  artifactType: "warp_york_control_family_proof_pack/v1";
  generatedOn: string;
  generatedAt: string;
  boundaryStatement: string;
  diagnosticContractId: string;
  classificationScope: string;
  diagnosticContract: YorkDiagnosticContract;
  diagnosticLanes: LaneProofPackEvaluation[];
  crossLaneComparison: CrossLaneComparison;
  inputs: {
    baseUrl: string;
    frameEndpoint: string;
    proxyFrameEndpoint: string | null;
    compareDirectAndProxy: boolean;
    nhm2SnapshotPath: string;
    yorkViews: HullScientificRenderView[];
    frameSize: { width: number; height: number };
  };
  cases: CaseResult[];
  controlDebug: ControlDebugEntry[];
  preconditions: ProofPackPreconditions;
  laneAParity?: LaneAParitySummary;
  causeCode?: LaneCauseCode;
  guardFailures: GuardFailure[];
  decisionTable: DecisionRow[];
  classificationScoring: Nhm2ReferenceScoring | null;
  classificationRobustness: ClassificationRobustnessSummary | null;
  verdict: DecisionVerdict;
  notes: string[];
  provenance: {
    commitHash: string | null;
    runtimeStatus: {
      statusEndpoint: string;
      serviceVersion: string | null;
      buildHash: string | null;
      commitSha: string | null;
      processStartedAtMs: number | null;
      runtimeInstanceId: string | null;
      reachable: boolean;
    };
  };
  checksum?: string;
};

const REQUIRED_YORK_VIEWS: HullScientificRenderView[] = [
  "york-surface-3p1",
  "york-surface-rho-3p1",
  "york-topology-normalized-3p1",
  "york-shell-map-3p1",
];
const OPTIONAL_YORK_VIEWS: HullScientificRenderView[] = ["york-time-3p1"];
const DEFAULT_YORK_VIEWS: HullScientificRenderView[] = [...REQUIRED_YORK_VIEWS];
const VALID_YORK_VIEW_SET = new Set<HullScientificRenderView>([
  ...REQUIRED_YORK_VIEWS,
  ...OPTIONAL_YORK_VIEWS,
]);
const YORK_NEAR_ZERO_THETA_ABS_THRESHOLD = 1e-20;
const YORK_SIGN_STRUCTURE_EPS = 1e-45;
const LANE_A_RENDER_PARITY_ABS_TOL = 1e-12;
const LANE_A_RENDER_PARITY_REL_TOL = 1e-6;
const LANE_A_THETA_KTRACE_ABS_TOL = 1e-12;
const LANE_A_THETA_KTRACE_REL_TOL = 1e-6;

const ensureRequiredYorkViews = (
  views: HullScientificRenderView[],
): HullScientificRenderView[] => {
  const deduped = Array.from(new Set(views));
  for (const requiredView of REQUIRED_YORK_VIEWS) {
    if (!deduped.includes(requiredView)) deduped.push(requiredView);
  }
  return deduped;
};

const readArgValue = (name: string, argv = process.argv.slice(2)): string | undefined => {
  const index = argv.findIndex((value) => value === name || value.startsWith(`${name}=`));
  if (index < 0) return undefined;
  if (argv[index].includes("=")) return argv[index].split("=", 2)[1];
  return argv[index + 1];
};

const parseYorkViews = (value: string | undefined): HullScientificRenderView[] => {
  if (!value || value.trim().length === 0) return [...DEFAULT_YORK_VIEWS];
  const parsed = value
    .split(",")
    .map((entry) => entry.trim() as HullScientificRenderView)
    .filter((entry) => entry.length > 0);
  if (parsed.length === 0) return [...DEFAULT_YORK_VIEWS];
  const deduped = Array.from(new Set(parsed));
  const invalid = deduped.filter((entry) => !VALID_YORK_VIEW_SET.has(entry));
  if (invalid.length > 0) {
    throw new Error(
      `invalid_york_views: ${invalid.join(", ")} | valid=${Array.from(VALID_YORK_VIEW_SET).join(",")}`,
    );
  }
  return ensureRequiredYorkViews(deduped);
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
};

const parseBooleanArg = (value: string | undefined, fallback = false): boolean => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return null;
};

const normalizePath = (filePath: string): string => filePath.replace(/\\/g, "/");

const ensureDirForFile = (filePath: string): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const toNormalizedNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const normalizeFeatureWeights = (
  featureSet: YorkFeatureName[],
  rawWeights: Record<string, unknown>,
): YorkFeatureWeightMap => {
  const weights = {} as YorkFeatureWeightMap;
  for (const feature of featureSet) {
    const candidate = toNormalizedNumber(rawWeights[feature], 1);
    weights[feature] = candidate > 0 ? candidate : 1;
  }
  return weights;
};

const normalizeNumberArray = (
  value: unknown,
  fallback: number[],
  minimum = 0,
): number[] => {
  if (!Array.isArray(value)) return [...fallback];
  const out = Array.from(
    new Set(
      value
        .map((entry) => toFiniteNumber(entry))
        .filter((entry): entry is number => Number.isFinite(entry ?? Number.NaN))
        .map((entry) => Math.max(entry, minimum)),
    ),
  );
  return out.length > 0 ? out : [...fallback];
};

const normalizeRobustnessFeatureDropSets = (
  value: unknown,
): YorkRobustnessFeatureDropSet[] => {
  if (!Array.isArray(value)) return [];
  const out: YorkRobustnessFeatureDropSet[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    const id = asText(record.id);
    const dropRaw = Array.isArray(record.drop_features) ? record.drop_features : [];
    const dropFeatures = Array.from(
      new Set(
        dropRaw
          .map((item) => asText(item))
          .filter((item): item is YorkFeatureName =>
            [
              "theta_abs_max_raw",
              "theta_abs_max_display",
              "positive_count_xz",
              "negative_count_xz",
              "positive_count_xrho",
              "negative_count_xrho",
              "support_overlap_pct",
              "near_zero_theta",
              "signed_lobe_summary",
              "shell_map_activity",
            ].includes(item ?? ""),
          ),
      ),
    );
    if (!id || dropFeatures.length === 0) continue;
    out.push({
      id,
      drop_features: dropFeatures,
    });
  }
  return out;
};

const parseYorkLane = (
  value: unknown,
  fallback: {
    lane_id: string;
    observer: string;
    observer_definition_id: string | null;
    observer_inputs_required: string[];
    observer_construction_inputs: string[];
    observer_construction_formula: string | null;
    observer_normalized: boolean;
    observer_approximation: string | null;
    lane_semantic_mode: string;
    foliation: string;
    theta_definition: string;
    kij_sign_convention: string;
    requires_gamma_metric: boolean;
    semantics_closed: boolean;
    cross_lane_claim_ready: boolean;
    cross_lane_claim_block_reason: string | null;
    coordinate_views: Record<string, string>;
    remap_rules: Record<string, string>;
    normalization_rules: Record<string, string>;
    classification_scope: string;
  },
): YorkDiagnosticLane => {
  const record = asRecord(value);
  const laneId = asText(record.lane_id) ?? fallback.lane_id;
  const active =
    typeof record.active === "boolean" ? record.active : true;
  const supported =
    typeof record.supported === "boolean" ? record.supported : true;
  return {
    lane_id: laneId,
    active,
    supported,
    unsupported_reason: asText(record.unsupported_reason),
    observer: asText(record.observer) ?? fallback.observer,
    observer_definition_id:
      asText(record.observer_definition_id) ?? fallback.observer_definition_id,
    observer_inputs_required: Array.isArray(record.observer_inputs_required)
      ? Array.from(
          new Set(
            record.observer_inputs_required
              .map((entry) => asText(entry))
              .filter((entry): entry is string => !!entry),
          ),
        )
      : [...fallback.observer_inputs_required],
    observer_construction_inputs: Array.isArray(record.observer_construction_inputs)
      ? Array.from(
          new Set(
            record.observer_construction_inputs
              .map((entry) => asText(entry))
              .filter((entry): entry is string => !!entry),
          ),
        )
      : [...fallback.observer_construction_inputs],
    observer_construction_formula:
      asText(record.observer_construction_formula) ?? fallback.observer_construction_formula,
    observer_normalized:
      typeof record.observer_normalized === "boolean"
        ? record.observer_normalized
        : fallback.observer_normalized,
    observer_approximation:
      asText(record.observer_approximation) ?? fallback.observer_approximation,
    lane_semantic_mode:
      asText(record.lane_semantic_mode) ?? fallback.lane_semantic_mode,
    foliation: asText(record.foliation) ?? fallback.foliation,
    theta_definition: asText(record.theta_definition) ?? fallback.theta_definition,
    kij_sign_convention:
      asText(record.kij_sign_convention) ?? fallback.kij_sign_convention,
    requires_gamma_metric:
      typeof record.requires_gamma_metric === "boolean"
        ? record.requires_gamma_metric
        : fallback.requires_gamma_metric,
    semantics_closed:
      typeof record.semantics_closed === "boolean"
        ? record.semantics_closed
        : fallback.semantics_closed,
    cross_lane_claim_ready:
      typeof record.cross_lane_claim_ready === "boolean"
        ? record.cross_lane_claim_ready
        : fallback.cross_lane_claim_ready,
    cross_lane_claim_block_reason:
      asText(record.cross_lane_claim_block_reason) ?? fallback.cross_lane_claim_block_reason,
    coordinate_views:
      Object.keys(asRecord(record.coordinate_views)).length > 0
        ? (asRecord(record.coordinate_views) as Record<string, string>)
        : fallback.coordinate_views,
    remap_rules:
      Object.keys(asRecord(record.remap_rules)).length > 0
        ? (asRecord(record.remap_rules) as Record<string, string>)
        : fallback.remap_rules,
    normalization_rules:
      Object.keys(asRecord(record.normalization_rules)).length > 0
        ? (asRecord(record.normalization_rules) as Record<string, string>)
        : fallback.normalization_rules,
    classification_scope:
      asText(record.classification_scope) ?? fallback.classification_scope,
  };
};

const normalizeDiagnosticLanes = (
  raw: Record<string, unknown>,
  fallbackLane: {
    lane_id: string;
    observer: string;
    observer_definition_id: string | null;
    observer_inputs_required: string[];
    observer_construction_inputs: string[];
    observer_construction_formula: string | null;
    observer_normalized: boolean;
    observer_approximation: string | null;
    lane_semantic_mode: string;
    foliation: string;
    theta_definition: string;
    kij_sign_convention: string;
    requires_gamma_metric: boolean;
    semantics_closed: boolean;
    cross_lane_claim_ready: boolean;
    cross_lane_claim_block_reason: string | null;
    coordinate_views: Record<string, string>;
    remap_rules: Record<string, string>;
    normalization_rules: Record<string, string>;
    classification_scope: string;
  },
): YorkDiagnosticLane[] => {
  const lanesRaw = Array.isArray(raw.lanes) ? raw.lanes : [];
  const lanes = lanesRaw.map((entry) => parseYorkLane(entry, fallbackLane));
  const deduped = Array.from(
    new Map(lanes.map((lane) => [lane.lane_id, lane])).values(),
  );
  if (deduped.length > 0) return deduped;
  return [
    {
      ...fallbackLane,
      active: true,
      supported: true,
      unsupported_reason: null,
    },
  ];
};

export const loadYorkDiagnosticContract = (
  contractPath = YORK_DIAGNOSTIC_CONTRACT_PATH,
): YorkDiagnosticContract => {
  const raw = JSON.parse(fs.readFileSync(contractPath, "utf8")) as Record<string, unknown>;
  const featureSetRaw = Array.isArray(raw.feature_set) ? raw.feature_set : [];
  const featureSet = featureSetRaw
    .map((entry) => asText(entry))
    .filter((entry): entry is YorkFeatureName =>
      [
        "theta_abs_max_raw",
        "theta_abs_max_display",
        "positive_count_xz",
        "negative_count_xz",
        "positive_count_xrho",
        "negative_count_xrho",
        "support_overlap_pct",
        "near_zero_theta",
        "signed_lobe_summary",
        "shell_map_activity",
      ].includes(entry ?? ""),
    );
  const uniqueFeatureSet = Array.from(new Set(featureSet));
  if (uniqueFeatureSet.length === 0) {
    throw new Error(`invalid_york_diagnostic_contract_feature_set:${contractPath}`);
  }
  const decisionPolicyRaw = asRecord(raw.decision_policy);
  const weightsRaw = asRecord(decisionPolicyRaw.feature_weights);
  const decisionPolicy: YorkDiagnosticContract["decision_policy"] = {
    distance_metric: asText(decisionPolicyRaw.distance_metric) ?? "weighted_normalized_l1",
    normalization_method:
      asText(decisionPolicyRaw.normalization_method) ?? "max_abs_reference_target_with_floor",
    normalization_floor: Math.max(
      toNormalizedNumber(decisionPolicyRaw.normalization_floor, 1e-30),
      1e-45,
    ),
    missing_value_penalty: Math.max(
      toNormalizedNumber(decisionPolicyRaw.missing_value_penalty, 1),
      0,
    ),
    max_component_distance: Math.max(
      toNormalizedNumber(decisionPolicyRaw.max_component_distance, 2),
      0.1,
    ),
    feature_weights: normalizeFeatureWeights(uniqueFeatureSet, weightsRaw),
    reference_margin_min: Math.max(
      toNormalizedNumber(decisionPolicyRaw.reference_margin_min, 0.08),
      0,
    ),
    reference_match_threshold: Math.max(
      toNormalizedNumber(decisionPolicyRaw.reference_match_threshold, 0.5),
      0,
    ),
    distinctness_threshold: Math.max(
      toNormalizedNumber(decisionPolicyRaw.distinctness_threshold, 0.5),
      0,
    ),
  };
  const robustnessRaw = asRecord(raw.robustness_checks);
  const stabilityPolicyRaw = asRecord(robustnessRaw.stability_policy);
  const robustnessChecks: YorkRobustnessChecks = {
    enabled:
      typeof robustnessRaw.enabled === "boolean"
        ? robustnessRaw.enabled
        : true,
    weight_perturbation_pct: Math.max(
      toNormalizedNumber(robustnessRaw.weight_perturbation_pct, 0.1),
      0,
    ),
    margin_variants: normalizeNumberArray(
      robustnessRaw.margin_variants,
      [0.05, decisionPolicy.reference_margin_min, 0.12],
      0,
    ),
    threshold_variants: normalizeNumberArray(
      robustnessRaw.threshold_variants,
      [0.4, decisionPolicy.reference_match_threshold, 0.6],
      0,
    ),
    feature_drop_sets: normalizeRobustnessFeatureDropSets(
      robustnessRaw.feature_drop_sets,
    ),
    stability_policy: {
      stable_fraction_min: Math.min(
        Math.max(
          toNormalizedNumber(stabilityPolicyRaw.stable_fraction_min, 0.8),
          0,
        ),
        1,
      ),
      marginal_fraction_min: Math.min(
        Math.max(
          toNormalizedNumber(stabilityPolicyRaw.marginal_fraction_min, 0.6),
          0,
        ),
        1,
      ),
    },
  };
  if (
    robustnessChecks.stability_policy.marginal_fraction_min >
    robustnessChecks.stability_policy.stable_fraction_min
  ) {
    robustnessChecks.stability_policy.marginal_fraction_min =
      robustnessChecks.stability_policy.stable_fraction_min;
  }
  const fallbackLane = {
    lane_id:
      asText(raw.baseline_lane_id) ??
      "lane_a_eulerian_comoving_theta_minus_trk",
    observer: asText(raw.observer) ?? "eulerian_n",
    observer_definition_id:
      asText(raw.observer_definition_id) ?? "obs.eulerian_n",
    observer_inputs_required: Array.isArray(raw.observer_inputs_required)
      ? Array.from(
          new Set(
            raw.observer_inputs_required
              .map((entry) => asText(entry))
              .filter((entry): entry is string => !!entry),
          ),
        )
      : ["alpha"],
    observer_construction_inputs: Array.isArray(raw.observer_construction_inputs)
      ? Array.from(
          new Set(
            raw.observer_construction_inputs
              .map((entry) => asText(entry))
              .filter((entry): entry is string => !!entry),
          ),
        )
      : ["alpha"],
    observer_construction_formula:
      asText(raw.observer_construction_formula) ?? "u^a = n^a (Eulerian normal observer)",
    observer_normalized:
      typeof raw.observer_normalized === "boolean" ? raw.observer_normalized : true,
    observer_approximation: asText(raw.observer_approximation),
    lane_semantic_mode:
      asText(raw.lane_semantic_mode) ?? "baseline-eulerian-theta-minus-trk",
    foliation: asText(raw.foliation) ?? "comoving_cartesian_3p1",
    theta_definition: asText(raw.theta_definition) ?? "theta=-trK",
    kij_sign_convention: asText(raw.kij_sign_convention) ?? "ADM",
    requires_gamma_metric:
      typeof raw.requires_gamma_metric === "boolean" ? raw.requires_gamma_metric : false,
    semantics_closed:
      typeof raw.semantics_closed === "boolean" ? raw.semantics_closed : true,
    cross_lane_claim_ready:
      typeof raw.cross_lane_claim_ready === "boolean"
        ? raw.cross_lane_claim_ready
        : true,
    cross_lane_claim_block_reason: asText(raw.cross_lane_claim_block_reason),
    coordinate_views: asRecord(raw.coordinate_views) as Record<string, string>,
    remap_rules: asRecord(raw.remap_rules) as Record<string, string>,
    normalization_rules: asRecord(raw.normalization_rules) as Record<string, string>,
    classification_scope: asText(raw.classification_scope) ?? "diagnostic_local_only",
  };
  const lanes = normalizeDiagnosticLanes(raw, fallbackLane);
  const baselineLaneId =
    asText(raw.baseline_lane_id) ??
    lanes.find((lane) => lane.active && lane.supported)?.lane_id ??
    lanes[0]!.lane_id;
  const alternateLaneId =
    asText(raw.alternate_lane_id) ??
    lanes.find((lane) => lane.lane_id !== baselineLaneId)?.lane_id ??
    null;
  return {
    contract_id: asText(raw.contract_id) ?? "york_diagnostic_contract",
    version: Math.max(Math.floor(toNormalizedNumber(raw.version, 1)), 1),
    baseline_lane_id: baselineLaneId,
    alternate_lane_id: alternateLaneId,
    observer: fallbackLane.observer,
    foliation: fallbackLane.foliation,
    theta_definition: fallbackLane.theta_definition,
    kij_sign_convention: fallbackLane.kij_sign_convention,
    coordinate_views: fallbackLane.coordinate_views,
    remap_rules: fallbackLane.remap_rules,
    normalization_rules: fallbackLane.normalization_rules,
    classification_scope: fallbackLane.classification_scope,
    reference_controls: {
      alcubierre_control: {
        description:
          asText(asRecord(asRecord(raw.reference_controls).alcubierre_control).description) ??
          "Expected strong signed fore/aft York morphology under this diagnostic lane.",
        role:
          asText(asRecord(asRecord(raw.reference_controls).alcubierre_control).role) ??
          "high_expansion_calibration_reference",
      },
      natario_control: {
        description:
          asText(asRecord(asRecord(raw.reference_controls).natario_control).description) ??
          "Expected low-expansion York morphology under this diagnostic lane.",
        role:
          asText(asRecord(asRecord(raw.reference_controls).natario_control).role) ??
          "low_expansion_calibration_reference",
      },
    },
    feature_set: uniqueFeatureSet,
    decision_policy: decisionPolicy,
    robustness_checks: robustnessChecks,
    lanes,
  };
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const mapPreflightFailure = (args: {
  lane: YorkRenderLane;
  errorCode: string | null;
  responseMessage: string | null;
}): { branch: string | null; requirement: string | null } => {
  const code = (args.errorCode ?? "").trim();
  const message = (args.responseMessage ?? "").trim();
  if (!code) {
    return { branch: null, requirement: null };
  }
  const directMap: Record<string, { branch: string; requirement: string }> = {
    scientific_metric_ref_missing_congruent_gate: {
      branch:
        "hull-optix-service:/frame metricRefEnforcesCongruentSolve(requireCongruentSolve=1 or requireNhm2CongruentFullSolve=1)",
      requirement:
        "metricVolumeRef.url must include requireCongruentSolve=1 (or requireNhm2CongruentFullSolve=1)",
    },
    scientific_metric_contract_violation: {
      branch: "hull-optix-service:/frame validateScientificMetricVolume(payload, metricBrick)",
      requirement: "canonical tensor volume contract must pass for requested scientific view",
    },
    scientific_metric_volume_unavailable: {
      branch:
        "hull-optix-service:/frame strictTensorPathRequired && !useTensorPath (fetchMetricBrick/contract decode path)",
      requirement:
        "decodable gr-evolve-brick metric volume required for strict scientific views",
    },
    scientific_york_theta_missing: {
      branch: "hull-optix-service:/frame yorkRequested theta channel preflight",
      requirement: "metric volume must contain canonical theta channel",
    },
    scientific_york_chart_unsupported: {
      branch: "hull-optix-service:/frame yorkRequested chart preflight",
      requirement: "chart must be comoving_cartesian for York views",
    },
    scientific_york_lane_unsupported: {
      branch: "hull-optix-service:/frame yorkRequested lane preflight",
      requirement:
        "requested diagnosticLaneId must be supported by the active York tensor lane",
    },
    scientific_york_lane_mismatch: {
      branch: "hull-optix-service:/frame yorkRequested lane certificate checks",
      requirement:
        "renderCertificate.render.lane_id and diagnostics.lane_id must match diagnosticLaneId",
    },
    scientific_york_shell_support_missing: {
      branch: "hull-optix-service:/frame yorkShellMapRequested support preflight",
      requirement: "hull_sdf and tile_support_mask channels required for york-shell-map-3p1",
    },
    scientific_york_diagnostics_missing: {
      branch: "hull-optix-service:/frame York certificate diagnostics preflight",
      requirement: "raw/display York diagnostics block must be present in certificate",
    },
    scientific_york_topology_convention_mismatch: {
      branch: "hull-optix-service:/frame york-topology-normalized convention checks",
      requirement:
        "render.normalization=topology-only-unit-max and render.surface_height=theta_norm",
    },
    scientific_york_topology_diagnostics_missing: {
      branch: "hull-optix-service:/frame york-topology-normalized diagnostics checks",
      requirement: "diagnostics.normalized_slice_hash is required",
    },
    scientific_york_shell_map_convention_mismatch: {
      branch: "hull-optix-service:/frame york-shell-map convention checks",
      requirement: "render.support_overlay=hull_sdf+tile_support_mask",
    },
    scientific_york_shell_map_diagnostics_missing: {
      branch: "hull-optix-service:/frame york-shell-map diagnostics checks",
      requirement:
        "shell-localized diagnostics + hashes required (support/shell mask + shell extrema)",
    },
    scientific_york_certificate_mismatch: {
      branch: "hull-optix-service:/frame York certificate identity checks",
      requirement:
        "metric_ref_hash/timestamp/chart/observer/theta_definition/kij_sign_convention/unit_system must match snapshot",
    },
  };
  if (code in directMap) {
    return directMap[code];
  }
  const proxyMap: Record<string, { branch: string; requirement: string }> = {
    mis_proxy_failed: {
      branch: "hull-render route remote proxy attempt loop",
      requirement:
        "remote service must return scientific frame that passes strict proxy validation",
    },
    mis_proxy_unconfigured: {
      branch: "hull-render route endpoint configuration gate",
      requirement: "configured remote render endpoint required when strict scientific frame requested",
    },
    remote_mis_non_scientific_response: {
      branch: "hull-render route strict remote response guard",
      requirement: "remote response must include scientific-tier diagnostics and certificate",
    },
    remote_mis_non_3p1_geodesic_mode: {
      branch: "hull-render route 3+1 geodesic mode guard",
      requirement: "remote response geodesic mode must be full 3+1 christoffel",
    },
    remote_mis_non_research_grade_frame: {
      branch: "hull-render route research-grade guard",
      requirement: "remote response must mark research-grade scientific tier",
    },
    remote_mis_missing_integral_signal_attachments: {
      branch: "hull-render route integral-signal attachment guard",
      requirement: "depth and shell-mask attachments required for strict lane",
    },
  };
  if (code in proxyMap) {
    return proxyMap[code];
  }
  if (code.startsWith("remote_mis_render_certificate_")) {
    return {
      branch: "hull-render route validateRenderCertificateForRequest",
      requirement: "remote certificate metadata must match requested scientific view contract",
    };
  }
  if (code.startsWith("scientific_atlas_")) {
    return {
      branch: "hull-render route validateScientificAtlasForRequest",
      requirement: "full-atlas sidecar pane/channel/coherence checks must pass",
    };
  }
  if (message.length > 0 && code === "scientific_metric_volume_unavailable") {
    return {
      branch:
        "hull-optix-service:/frame strictTensorPathRequired && !useTensorPath (fetchMetricBrick/contract decode path)",
      requirement: message,
    };
  }
  return {
    branch:
      args.lane === "proxy"
        ? "hull-render route remote strict lane"
        : "hull-optix-service:/frame scientific preflight",
    requirement: message.length > 0 ? message : "see errorCode",
  };
};

const withTimeoutFetch = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const stableStringify = (value: unknown): string => {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map((entry) => canonical(entry));
    if (input && typeof input === "object") {
      const src = input as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(src).sort((a, b) => a.localeCompare(b))) {
        out[key] = canonical(src[key]);
      }
      return out;
    }
    return input;
  };
  return JSON.stringify(canonical(value));
};

const computeChecksum = (payload: ProofPackPayload): string => {
  const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  delete copy.generatedAt;
  delete copy.checksum;
  return crypto.createHash("sha256").update(stableStringify(copy)).digest("hex");
};

const toWarpRodcVerdictStatus = (
  verdict: DecisionVerdict,
): WarpRodcVerdictStatus => {
  if (verdict === "inconclusive") return "inconclusive";
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY) return "distinct";
  return "congruent";
};

const toWarpRodcStability = (
  robustness: ClassificationRobustnessSummary | null,
): WarpRodcStability => {
  if (!robustness) return "not_evaluated";
  if (robustness.stabilityStatus.startsWith("stable_")) return "stable";
  if (robustness.stabilityStatus.startsWith("marginal_")) return "marginal";
  return "unstable";
};

export const buildWarpRodcSnapshot = (args: {
  payload: ProofPackPayload;
  sourceAuditArtifact?: string | null;
}): WarpRodcSnapshotV1 => {
  const lane =
    args.payload.diagnosticLanes.find(
      (entry) => entry.lane_id === args.payload.diagnosticContract.baseline_lane_id,
    ) ?? args.payload.diagnosticLanes[0];
  const nhm2Case =
    lane?.cases.find((entry) => entry.caseId === "nhm2_certified") ??
    args.payload.cases.find((entry) => entry.caseId === "nhm2_certified") ??
    null;
  const firstView = nhm2Case?.perView[0] ?? null;
  const sliceHashesByView = Object.fromEntries(
    (nhm2Case?.perView ?? []).map((entry) => [
      entry.view,
      entry.hashes.slice_array_hash ?? null,
    ]),
  );
  const toOtherBaselines: Record<string, number | null> = {};
  const scoring = args.payload.classificationScoring;
  const robustness = args.payload.classificationRobustness;
  const payloadBase: WarpRodcSnapshotV1 = {
    artifactType: WARP_RODC_SNAPSHOT_SCHEMA_VERSION,
    artifactFamily: "warp-york-control-family",
    generatedOn: args.payload.generatedOn,
    generatedAt: args.payload.generatedAt,
    boundaryStatement: args.payload.boundaryStatement,
    contract: {
      id: args.payload.diagnosticContract.contract_id,
      version: args.payload.diagnosticContract.version,
      lane_id:
        lane?.lane_id ?? args.payload.diagnosticContract.baseline_lane_id,
      classification_scope: args.payload.classificationScope,
    },
    inputs: {
      metricT00Ref: nhm2Case?.snapshotMetrics?.sourceFamily.metricT00Ref ?? null,
      metricT00Source: nhm2Case?.snapshotMetrics?.source ?? null,
      shape_function_id:
        nhm2Case?.snapshotMetrics?.sourceFamily.shape_function_id ?? null,
      warpFieldType: nhm2Case?.snapshotMetrics?.sourceFamily.warpFieldType ?? null,
      dims: nhm2Case?.snapshotMetrics?.dims ?? null,
      source_case_id: nhm2Case?.caseId ?? "nhm2_certified",
    },
    provenance: {
      repo_commit_sha: args.payload.provenance.commitHash,
      serviceVersion: args.payload.provenance.runtimeStatus.serviceVersion,
      buildHash: args.payload.provenance.runtimeStatus.buildHash,
      runtimeInstanceId: args.payload.provenance.runtimeStatus.runtimeInstanceId,
      timestamp_ms:
        firstView?.identity.timestamp_ms ??
        args.payload.provenance.runtimeStatus.processStartedAtMs,
      sourceAuditArtifact: args.sourceAuditArtifact ?? null,
    },
    evidence_hashes: {
      metric_ref_hash:
        nhm2Case?.snapshotMetrics?.metricRefHash ??
        firstView?.identity.metric_ref_hash ??
        null,
      theta_channel_hash:
        nhm2Case?.snapshotMetrics?.channelHashes.theta ??
        firstView?.hashes.theta_channel_hash ??
        null,
      k_trace_hash: nhm2Case?.snapshotMetrics?.channelHashes.K_trace ?? null,
      slice_hashes_by_view: sliceHashesByView,
    },
    feature_vector: { ...(nhm2Case?.classificationFeatures ?? {}) },
    distance: {
      to_alcubierre: scoring?.distance_to_alcubierre_reference ?? null,
      to_natario: scoring?.distance_to_low_expansion_reference ?? null,
      to_other_baselines: toOtherBaselines,
      winning_reference: scoring?.winning_reference ?? null,
      reference_margin: scoring?.reference_margin ?? null,
    },
    policy: {
      distance_metric: args.payload.diagnosticContract.decision_policy.distance_metric,
      normalization_method:
        args.payload.diagnosticContract.decision_policy.normalization_method,
      reference_margin_min:
        args.payload.diagnosticContract.decision_policy.reference_margin_min,
      reference_match_threshold:
        args.payload.diagnosticContract.decision_policy.reference_match_threshold,
      distinctness_threshold:
        args.payload.diagnosticContract.decision_policy.distinctness_threshold,
      feature_weights: {
        ...args.payload.diagnosticContract.decision_policy.feature_weights,
      },
    },
    robustness: {
      enabled: robustness?.enabled ?? false,
      totalVariants: robustness?.totalVariants ?? 0,
      evaluatedVariants: robustness?.evaluatedVariants ?? 0,
      dominantFraction: robustness?.dominantFraction ?? 0,
      dominantVerdict: robustness?.dominantVerdict ?? null,
      stableVerdict: robustness?.stableVerdict ?? null,
      stabilityStatus: robustness?.stabilityStatus ?? "inconclusive",
      stable_fraction_min:
        robustness?.stabilityPolicy.stable_fraction_min ??
        args.payload.diagnosticContract.robustness_checks.stability_policy
          .stable_fraction_min,
      marginal_fraction_min:
        robustness?.stabilityPolicy.marginal_fraction_min ??
        args.payload.diagnosticContract.robustness_checks.stability_policy
          .marginal_fraction_min,
      verdictCounts: robustness?.verdictCounts ?? {
        inconclusive: 0,
      },
    },
    preconditions: { ...args.payload.preconditions },
    cross_lane: {
      baseline_lane_id: args.payload.crossLaneComparison.baseline_lane_id,
      alternate_lane_id: args.payload.crossLaneComparison.alternate_lane_id,
      cross_lane_status: args.payload.crossLaneComparison.cross_lane_status,
    },
    verdict: {
      family_label: args.payload.verdict,
      status: toWarpRodcVerdictStatus(args.payload.verdict),
      stability: toWarpRodcStability(robustness),
    },
    notes: [...args.payload.notes],
  };
  return {
    ...payloadBase,
    checksum: computeWarpRodcChecksum(payloadBase as unknown as Record<string, unknown>),
  };
};

const getHeadCommit = (): string | null => {
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, "");

const parseBooleanQueryFlag = (
  params: URLSearchParams,
  key: string,
  fallback = false,
): boolean => {
  const raw = params.get(key);
  if (raw == null) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0) return fallback;
  return ["1", "true", "yes", "on"].includes(normalized);
};

const clampi = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(value)));

const idx3 = (x: number, y: number, z: number, dims: [number, number, number]): number =>
  z * dims[0] * dims[1] + y * dims[0] + x;

const computeRawSliceExtrema = (slice: Float32Array): OfflineYorkViewAudit["rawExtrema"] => {
  if (slice.length === 0) return { min: null, max: null, absMax: null };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < slice.length; i += 1) {
    const value = slice[i];
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: null, max: null, absMax: null };
  return { min, max, absMax: Math.max(Math.abs(min), Math.abs(max)) };
};

const computeSliceSignCounts = (slice: Float32Array): OfflineYorkViewAudit["counts"] => {
  let positive = 0;
  let negative = 0;
  let zeroOrNearZero = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const value = slice[i];
    if (!Number.isFinite(value) || Math.abs(value) <= YORK_SIGN_STRUCTURE_EPS) {
      zeroOrNearZero += 1;
    } else if (value > 0) {
      positive += 1;
    } else if (value < 0) {
      negative += 1;
    } else {
      zeroOrNearZero += 1;
    }
  }
  return { positive, negative, zeroOrNearZero, total: slice.length };
};

const hasMeaningfulSignedStructure = (offline: OfflineYorkViewAudit): boolean => {
  if (offline.rawExtrema.absMax == null || offline.rawExtrema.absMax <= 0) return false;
  const structuralFloor = Math.max(offline.rawExtrema.absMax * 1e-3, 1e-45);
  const enoughSignedCells = offline.counts.positive >= 2 && offline.counts.negative >= 2;
  return enoughSignedCells && offline.rawExtrema.absMax >= structuralFloor;
};

export const extractThetaSliceXZMidplane = (
  theta: Float32Array,
  dims: [number, number, number],
): Float32Array => {
  const [nx, ny, nz] = dims;
  const yMid = clampi(Math.floor(ny * 0.5), 0, ny - 1);
  const out = new Float32Array(nx * nz);
  for (let z = 0; z < nz; z += 1) {
    for (let x = 0; x < nx; x += 1) {
      out[z * nx + x] = theta[idx3(x, yMid, z, dims)] ?? 0;
    }
  }
  return out;
};

export const extractThetaSliceXRho = (
  theta: Float32Array,
  dims: [number, number, number],
): Float32Array => {
  const [nx, ny, nz] = dims;
  const rhoBins = Math.max(2, nz);
  const yCenter = (ny - 1) * 0.5;
  const zCenter = (nz - 1) * 0.5;
  const maxRho = Math.max(1e-9, Math.hypot(Math.max(yCenter, 1), Math.max(zCenter, 1)));
  const out = new Float32Array(nx * rhoBins);
  const sum = new Float64Array(rhoBins);
  const count = new Uint32Array(rhoBins);
  for (let x = 0; x < nx; x += 1) {
    sum.fill(0);
    count.fill(0);
    for (let y = 0; y < ny; y += 1) {
      const dy = y - yCenter;
      for (let z = 0; z < nz; z += 1) {
        const dz = z - zCenter;
        const rhoNorm = Math.hypot(dy, dz) / maxRho;
        const rhoBin = clampi(Math.round(rhoNorm * (rhoBins - 1)), 0, rhoBins - 1);
        const value = theta[idx3(x, y, z, dims)] ?? 0;
        sum[rhoBin] += value;
        count[rhoBin] += 1;
      }
    }
    for (let rho = 0; rho < rhoBins; rho += 1) {
      const n = count[rho];
      out[rho * nx + x] = n > 0 ? Number(sum[rho] / n) : 0;
    }
  }
  return out;
};

export const computeOfflineYorkAudit = (args: {
  caseId: CaseId;
  theta: Float32Array | null;
  dims: [number, number, number];
}): CaseOfflineYorkAudit | null => {
  if (!(args.theta instanceof Float32Array)) return null;
  const xzSlice = extractThetaSliceXZMidplane(args.theta, args.dims);
  const xrhoSlice = extractThetaSliceXRho(args.theta, args.dims);
  const byView: OfflineYorkViewAudit[] = [
    {
      view: "york-surface-3p1",
      coordinateMode: "x-z-midplane",
      samplingChoice: "x-z midplane",
      thetaSliceHash: hashFloat32(xzSlice),
      rawExtrema: computeRawSliceExtrema(xzSlice),
      counts: computeSliceSignCounts(xzSlice),
    },
    {
      view: "york-surface-rho-3p1",
      coordinateMode: "x-rho",
      samplingChoice: "x-rho cylindrical remap",
      thetaSliceHash: hashFloat32(xrhoSlice),
      rawExtrema: computeRawSliceExtrema(xrhoSlice),
      counts: computeSliceSignCounts(xrhoSlice),
    },
  ];

  if (args.caseId !== "alcubierre_control") return { byView };
  const [nx, ny, nz] = args.dims;
  const xMid = Math.floor(nx * 0.5);
  let foreHalfPositiveTotal = 0;
  let foreHalfNegativeTotal = 0;
  let aftHalfPositiveTotal = 0;
  let aftHalfNegativeTotal = 0;
  for (let x = 0; x < nx; x += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let z = 0; z < nz; z += 1) {
        const value = args.theta[idx3(x, y, z, args.dims)] ?? 0;
        if (!Number.isFinite(value) || Math.abs(value) <= YORK_SIGN_STRUCTURE_EPS) {
          continue;
        }
        const isFore = x >= xMid;
        if (value > 0) {
          if (isFore) foreHalfPositiveTotal += value;
          else aftHalfPositiveTotal += value;
        } else {
          if (isFore) foreHalfNegativeTotal += value;
          else aftHalfNegativeTotal += value;
        }
      }
    }
  }
  const signedLobeSummary =
    foreHalfPositiveTotal > 0 && aftHalfNegativeTotal < 0
      ? "fore+/aft-"
      : foreHalfNegativeTotal < 0 && aftHalfPositiveTotal > 0
        ? "fore-/aft+"
        : "mixed_or_flat";
  return {
    byView,
    alcubierreSignedLobeSummary: {
      foreHalfPositiveTotal,
      foreHalfNegativeTotal,
      aftHalfPositiveTotal,
      aftHalfNegativeTotal,
      signedLobeSummary,
    },
  };
};

const resolveYorkSliceCoordinateMode = (
  view: HullScientificRenderView,
): "x-z-midplane" | "x-rho" =>
  view === "york-surface-rho-3p1" ? "x-rho" : "x-z-midplane";

const resolveYorkSliceSamplingChoice = (
  view: HullScientificRenderView,
): "x-z midplane" | "x-rho cylindrical remap" =>
  view === "york-surface-rho-3p1" ? "x-rho cylindrical remap" : "x-z midplane";

const extractYorkSliceForView = (
  field: Float32Array | null,
  dims: [number, number, number],
  view: HullScientificRenderView,
): Float32Array | null => {
  if (!(field instanceof Float32Array)) return null;
  if (view === "york-surface-rho-3p1") {
    return extractThetaSliceXRho(field, dims);
  }
  return extractThetaSliceXZMidplane(field, dims);
};

const buildSupportMaskFromHullSdf = (
  hullSdf: Float32Array | null,
): Float32Array | null => {
  if (!(hullSdf instanceof Float32Array)) return null;
  const out = new Float32Array(hullSdf.length);
  for (let i = 0; i < hullSdf.length; i += 1) {
    const value = hullSdf[i] ?? Number.POSITIVE_INFINITY;
    out[i] = Number.isFinite(value) && value <= 0 ? 1 : 0;
  }
  return out;
};

const computeMaxAbsResidual = (
  lhs: Float32Array | null,
  rhs: Float32Array | null,
): number | null => {
  if (!(lhs instanceof Float32Array) || !(rhs instanceof Float32Array)) return null;
  const n = Math.min(lhs.length, rhs.length);
  if (n <= 0) return null;
  let maxAbs = 0;
  let sampleCount = 0;
  for (let i = 0; i < n; i += 1) {
    const lv = lhs[i];
    const rv = rhs[i];
    if (!Number.isFinite(lv) || !Number.isFinite(rv)) continue;
    maxAbs = Math.max(maxAbs, Math.abs(lv - rv));
    sampleCount += 1;
  }
  return sampleCount > 0 ? maxAbs : null;
};

const computeSignCountDelta = (
  lhs: OfflineYorkViewAudit["counts"] | null,
  rhs: OfflineYorkViewAudit["counts"] | null,
): {
  positive: number | null;
  negative: number | null;
  zeroOrNearZero: number | null;
  total: number | null;
} => {
  if (!lhs || !rhs) {
    return {
      positive: null,
      negative: null,
      zeroOrNearZero: null,
      total: null,
    };
  }
  return {
    positive: Math.abs(lhs.positive - rhs.positive),
    negative: Math.abs(lhs.negative - rhs.negative),
    zeroOrNearZero: Math.abs(lhs.zeroOrNearZero - rhs.zeroOrNearZero),
    total: Math.abs(lhs.total - rhs.total),
  };
};

const computeSupportOverlapPctFromSlices = (
  thetaSlice: Float32Array | null,
  supportSlice: Float32Array | null,
): number | null => {
  if (!(thetaSlice instanceof Float32Array) || !(supportSlice instanceof Float32Array)) {
    return null;
  }
  const n = Math.min(thetaSlice.length, supportSlice.length);
  if (n <= 0) return null;
  const raw = computeRawSliceExtrema(thetaSlice);
  const thetaAbsMax = raw.absMax ?? 0;
  const threshold = Math.max(thetaAbsMax * 1e-6, 1e-45);
  let supportCount = 0;
  let supportWithThetaCount = 0;
  for (let i = 0; i < n; i += 1) {
    const supportValue = supportSlice[i] ?? 0;
    if (!Number.isFinite(supportValue) || supportValue <= 0.5) continue;
    supportCount += 1;
    const thetaValue = thetaSlice[i] ?? 0;
    if (Number.isFinite(thetaValue) && Math.abs(thetaValue) >= threshold) {
      supportWithThetaCount += 1;
    }
  }
  if (supportCount <= 0) return 0;
  return (100 * supportWithThetaCount) / supportCount;
};

const computeRawExtremaDelta = (
  offlineRaw: OfflineYorkViewAudit["rawExtrema"] | null,
  renderedRaw: YorkViewSummary["rawExtrema"] | null,
): {
  minRaw: number | null;
  maxRaw: number | null;
  absMaxRaw: number | null;
} => ({
  minRaw:
    offlineRaw?.min != null && renderedRaw?.min != null
      ? Math.abs(offlineRaw.min - renderedRaw.min)
      : null,
  maxRaw:
    offlineRaw?.max != null && renderedRaw?.max != null
      ? Math.abs(offlineRaw.max - renderedRaw.max)
      : null,
  absMaxRaw:
    offlineRaw?.absMax != null && renderedRaw?.absMax != null
      ? Math.abs(offlineRaw.absMax - renderedRaw.absMax)
      : null,
});

const normalizeIdentityString = (value: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const KIJ_SIGN_CONVENTION_ALIAS_TABLE: Record<string, string> = {
  adm: "adm",
  "k_ij=-1/2*l_n(gamma_ij)": "adm",
  "kij=-1/2*l_n(gamma_ij)": "adm",
};

export const normalizeKijSignConventionIdentity = (
  value: string | null,
): string | null => {
  const normalized = normalizeIdentityString(value);
  if (!normalized) return null;
  const aliasKey = normalized.toLowerCase().replace(/\s+/g, "");
  return KIJ_SIGN_CONVENTION_ALIAS_TABLE[aliasKey] ?? normalized;
};

const approxIdentityEquals = (
  actual: string | null,
  expected: string | null,
  canonicalize?: (value: string | null) => string | null,
): boolean => {
  const canonicalizer = canonicalize ?? normalizeIdentityString;
  const expectedNormalized = canonicalizer(expected);
  if (!expectedNormalized) return false;
  const actualNormalized = canonicalizer(actual);
  if (!actualNormalized) return false;
  return actualNormalized === expectedNormalized;
};

export const evaluateLaneASnapshotIdentity = (args: {
  rendered: YorkViewSummary | null;
  lane: Pick<
    YorkDiagnosticLane,
    "lane_id" | "observer" | "theta_definition" | "kij_sign_convention"
  >;
  expectedMetricRefHash: string | null;
  expectedThetaHash: string | null;
  expectedChart: string;
}): YorkParityViewAudit["identity"] => {
  const laneId = args.rendered?.identity.lane_id ?? args.rendered?.render.lane_id ?? null;
  const metricRefMatches = approxIdentityEquals(
    args.rendered?.identity.metric_ref_hash ?? null,
    args.expectedMetricRefHash,
  );
  const laneMatches = approxIdentityEquals(laneId, args.lane.lane_id);
  const chartMatches = approxIdentityEquals(
    args.rendered?.identity.chart ?? null,
    args.expectedChart,
  );
  const observerMatches = approxIdentityEquals(
    args.rendered?.identity.observer ?? null,
    args.lane.observer,
  );
  const thetaDefinitionMatches = approxIdentityEquals(
    args.rendered?.identity.theta_definition ?? null,
    args.lane.theta_definition,
  );
  const kijSignConventionMatches = approxIdentityEquals(
    args.rendered?.identity.kij_sign_convention ?? null,
    args.lane.kij_sign_convention,
    normalizeKijSignConventionIdentity,
  );
  const thetaHashMatches = approxIdentityEquals(
    args.rendered?.hashes.theta_channel_hash ?? null,
    args.expectedThetaHash,
  );
  const timestampPresent = Number.isFinite(args.rendered?.identity.timestamp_ms ?? Number.NaN);
  return {
    complete:
      laneMatches &&
      metricRefMatches &&
      chartMatches &&
      observerMatches &&
      thetaDefinitionMatches &&
      kijSignConventionMatches &&
      thetaHashMatches &&
      timestampPresent,
    laneMatches,
    metricRefMatches,
    chartMatches,
    observerMatches,
    thetaDefinitionMatches,
    kijSignConventionMatches,
    thetaHashMatches,
    timestampPresent,
  };
};

const computeCaseLaneAParityAudit = (args: {
  lane: YorkDiagnosticLane;
  caseId: CaseId;
  views: HullScientificRenderView[];
  perView: YorkViewSummary[];
  snapshotMetrics: CaseSnapshotMetrics | null;
  theta: Float32Array | null;
  contractField: Float32Array | null;
  supportMask: Float32Array | null;
  hullSdf: Float32Array | null;
  dims: [number, number, number];
}): CaseLaneAParityAudit => {
  const viewAudits: YorkParityViewAudit[] = [];
  const fallbackSupport = args.supportMask ?? buildSupportMaskFromHullSdf(args.hullSdf);

  for (const view of args.views) {
    const rendered = args.perView.find((entry) => entry.view === view) ?? null;
    const coordinateMode = resolveYorkSliceCoordinateMode(view);
    const samplingChoice = resolveYorkSliceSamplingChoice(view);
    const thetaSlice = extractYorkSliceForView(args.theta, args.dims, view);
    const contractSlice = extractYorkSliceForView(args.contractField, args.dims, view);
    const supportSlice = extractYorkSliceForView(fallbackSupport, args.dims, view);
    const offlineThetaHash = thetaSlice instanceof Float32Array ? hashFloat32(thetaSlice) : null;
    const offlineNegKTraceHash =
      contractSlice instanceof Float32Array ? hashFloat32(contractSlice) : null;
    const renderThetaHash = rendered?.hashes.slice_array_hash ?? null;

    const thetaCounts =
      thetaSlice instanceof Float32Array ? computeSliceSignCounts(thetaSlice) : null;
    const negKTraceCounts =
      contractSlice instanceof Float32Array ? computeSliceSignCounts(contractSlice) : null;
    const signCountDeltaThetaVsKTrace = computeSignCountDelta(thetaCounts, negKTraceCounts);
    const signCountDeltaThetaVsRender =
      offlineThetaHash && renderThetaHash && offlineThetaHash === renderThetaHash
        ? {
            positive: 0,
            negative: 0,
            zeroOrNearZero: 0,
            total: 0,
          }
        : {
            positive: null,
            negative: null,
            zeroOrNearZero: null,
            total: null,
          };

    const offlineThetaRaw =
      thetaSlice instanceof Float32Array ? computeRawSliceExtrema(thetaSlice) : null;
    const offlineNegKTraceRaw =
      contractSlice instanceof Float32Array ? computeRawSliceExtrema(contractSlice) : null;
    const thetaVsRenderExtremaDelta = computeRawExtremaDelta(
      offlineThetaRaw,
      rendered?.rawExtrema ?? null,
    );
    const thetaVsKTraceExtremaDelta = computeRawExtremaDelta(
      offlineThetaRaw,
      offlineNegKTraceRaw,
    );
    const thetaVsRenderMaxAbsResidual =
      offlineThetaHash && renderThetaHash && offlineThetaHash === renderThetaHash
        ? 0
        : Math.max(
            thetaVsRenderExtremaDelta.minRaw ?? 0,
            thetaVsRenderExtremaDelta.maxRaw ?? 0,
            thetaVsRenderExtremaDelta.absMaxRaw ?? 0,
          );
    const thetaVsKTraceMaxAbsResidual = computeMaxAbsResidual(thetaSlice, contractSlice);

    const expectedMetricRefHash =
      args.snapshotMetrics?.metricRefHash ?? args.snapshotMetrics?.requestMetricRefHash ?? null;
    const expectedThetaHash = args.snapshotMetrics?.channelHashes.theta ?? null;
    const expectedChart = args.snapshotMetrics?.chart ?? "comoving_cartesian";
    const identity = evaluateLaneASnapshotIdentity({
      rendered,
      lane: args.lane,
      expectedMetricRefHash,
      expectedThetaHash,
      expectedChart,
    });
    const identityComplete = identity.complete;

    const offlineSupportOverlapPct = computeSupportOverlapPctFromSlices(thetaSlice, supportSlice);
    const renderSupportOverlapPct = rendered?.supportOverlapPct ?? null;
    const supportOverlapDelta =
      offlineSupportOverlapPct != null && Number.isFinite(renderSupportOverlapPct ?? Number.NaN)
        ? Math.abs(offlineSupportOverlapPct - (renderSupportOverlapPct ?? 0))
        : null;

    const thetaAbsMax = offlineThetaRaw?.absMax ?? 0;
    const thetaKTraceAbsMax = Math.max(thetaAbsMax, offlineNegKTraceRaw?.absMax ?? 0);
    const renderResidualTolerance = Math.max(
      LANE_A_RENDER_PARITY_ABS_TOL,
      thetaAbsMax * LANE_A_RENDER_PARITY_REL_TOL,
    );
    const thetaKTraceTolerance = Math.max(
      LANE_A_THETA_KTRACE_ABS_TOL,
      thetaKTraceAbsMax * LANE_A_THETA_KTRACE_REL_TOL,
    );

    let causeCode: SharedLaneCauseCode | null = null;
    if (!rendered) {
      causeCode = "missing_required_view";
    } else if (!identityComplete) {
      causeCode = "snapshot_identity_failure";
    } else if (
      !(offlineThetaHash && offlineNegKTraceHash && renderThetaHash) ||
      !(thetaSlice instanceof Float32Array) ||
      !(contractSlice instanceof Float32Array)
    ) {
      causeCode = "missing_required_hash";
    } else if (
      !Number.isFinite(thetaVsKTraceMaxAbsResidual ?? Number.NaN) ||
      (thetaVsKTraceMaxAbsResidual ?? 0) > thetaKTraceTolerance
    ) {
      causeCode = "theta_ktrace_contract_failure";
    } else if (
      offlineThetaHash !== renderThetaHash ||
      (thetaVsRenderMaxAbsResidual ?? 0) > renderResidualTolerance
    ) {
      causeCode = "render_parity_failure";
    }

    viewAudits.push({
      view,
      coordinateMode,
      samplingChoice,
      offlineThetaSliceHash: offlineThetaHash,
      offlineNegKTraceSliceHash: offlineNegKTraceHash,
      renderThetaSliceHash: renderThetaHash,
      thetaVsRenderMaxAbsResidual,
      thetaVsKTraceMaxAbsResidual,
      signCountDelta: {
        thetaVsRender: signCountDeltaThetaVsRender,
        thetaVsKTrace: signCountDeltaThetaVsKTrace,
      },
      supportOverlapPct: {
        offline: offlineSupportOverlapPct,
        render: renderSupportOverlapPct,
        delta: supportOverlapDelta,
      },
      extremaDelta: {
        thetaVsRender: thetaVsRenderExtremaDelta,
        thetaVsKTrace: thetaVsKTraceExtremaDelta,
      },
      identity,
      status: causeCode ? "fail" : "pass",
      causeCode,
    });
  }

  const firstFailure = viewAudits.find((entry) => entry.status === "fail") ?? null;
  const parityComputed = viewAudits.length > 0 && viewAudits.every((entry) => entry.offlineThetaSliceHash !== null);
  const thetaKTraceParityComputed =
    viewAudits.length > 0 &&
    viewAudits.every((entry) => entry.offlineNegKTraceSliceHash !== null);
  const snapshotIdentityComplete = viewAudits.length > 0 && viewAudits.every((entry) => entry.identity.complete);
  const renderParityPass = viewAudits.every(
    (entry) => entry.causeCode !== "render_parity_failure",
  );
  const thetaKTraceContractPass = viewAudits.every(
    (entry) => entry.causeCode !== "theta_ktrace_contract_failure",
  );

  return {
    caseId: args.caseId,
    parityComputed,
    thetaKTraceParityComputed,
    snapshotIdentityComplete,
    renderParityPass,
    thetaKTraceContractPass,
    byView: viewAudits,
    status: firstFailure ? "fail" : "pass",
    causeCode: firstFailure?.causeCode ?? null,
  };
};

export const summarizeLaneAParity = (cases: CaseResult[]): LaneAParitySummary => {
  const caseSummaries = cases.map((entry) => {
    const status = entry.parity?.status ?? "fail";
    const parityCauseCode = entry.parity?.causeCode ?? null;
    return {
      caseId: entry.caseId,
      status,
      causeCode:
        status === "pass"
          ? null
          : parityCauseCode ?? "snapshot_identity_failure",
    };
  });
  const firstFailure = caseSummaries.find((entry) => entry.status === "fail") ?? null;
  return {
    status: firstFailure ? "failed" : "closed",
    causeCode: firstFailure?.causeCode ?? null,
    caseSummaries,
  };
};

const readControlRequestSelectors = (requestUrl: string | null): ControlRequestSelectors => {
  if (!requestUrl || requestUrl.trim().length === 0) {
    return {
      metricT00Ref: null,
      metricT00Source: null,
      requireCongruentSolve: false,
      requireNhm2CongruentFullSolve: false,
      warpFieldType: null,
    };
  }
  try {
    const parsed = new URL(requestUrl);
    const params = parsed.searchParams;
    return {
      metricT00Ref: asText(params.get("metricT00Ref")),
      metricT00Source: asText(params.get("metricT00Source")),
      requireCongruentSolve: parseBooleanQueryFlag(params, "requireCongruentSolve", false),
      requireNhm2CongruentFullSolve: parseBooleanQueryFlag(
        params,
        "requireNhm2CongruentFullSolve",
        false,
      ),
      warpFieldType: asText(params.get("warpFieldType")),
    };
  } catch {
    return {
      metricT00Ref: null,
      metricT00Source: null,
      requireCongruentSolve: false,
      requireNhm2CongruentFullSolve: false,
      warpFieldType: null,
    };
  }
};

const statusEndpointFromFrameEndpoint = (frameEndpoint: string): string => {
  const trimmed = frameEndpoint.trim();
  if (/\/api\/helix\/hull-render\/status\/?$/i.test(trimmed)) return trimmed;
  if (/\/frame\/?$/i.test(trimmed)) return trimmed.replace(/\/frame\/?$/i, "/status");
  return `${trimmed.replace(/\/+$/, "")}/status`;
};

const fetchRuntimeStatusProvenance = async (
  frameEndpoint: string,
): Promise<ProofPackPayload["provenance"]["runtimeStatus"]> => {
  const statusEndpoint = statusEndpointFromFrameEndpoint(frameEndpoint);
  try {
    const response = await withTimeoutFetch(statusEndpoint, { method: "GET" }, 20_000);
    if (!response.ok) {
      return {
        statusEndpoint,
        serviceVersion: null,
        buildHash: null,
        commitSha: null,
        processStartedAtMs: null,
        runtimeInstanceId: null,
        reachable: false,
      };
    }
    const payload = asRecord(await response.json());
    const rootProvenance = asRecord(payload.provenance);
    const runtime = asRecord(payload.runtime);
    const runtimeProvenance = asRecord(runtime.provenance);
    const remoteStatus = asRecord(payload.remoteStatus);
    const remoteProvenance = asRecord(remoteStatus.provenance);
    const serviceVersion =
      asText(rootProvenance.serviceVersion) ??
      asText(runtimeProvenance.serviceVersion) ??
      asText(remoteProvenance.serviceVersion) ??
      asText(payload.serviceVersion);
    const buildHash =
      asText(rootProvenance.buildHash) ??
      asText(runtimeProvenance.buildHash) ??
      asText(remoteProvenance.buildHash) ??
      asText(payload.buildHash);
    const commitSha =
      asText(rootProvenance.commitSha) ??
      asText(runtimeProvenance.commitSha) ??
      asText(remoteProvenance.commitSha) ??
      asText(payload.commitSha);
    const processStartedAtMs =
      toFiniteNumber(rootProvenance.processStartedAtMs) ??
      toFiniteNumber(runtimeProvenance.processStartedAtMs) ??
      toFiniteNumber(remoteProvenance.processStartedAtMs) ??
      toFiniteNumber(payload.processStartedAtMs);
    const runtimeInstanceId =
      asText(rootProvenance.runtimeInstanceId) ??
      asText(runtimeProvenance.runtimeInstanceId) ??
      asText(remoteProvenance.runtimeInstanceId) ??
      asText(payload.runtimeInstanceId);
    return {
      statusEndpoint,
      serviceVersion,
      buildHash,
      commitSha,
      processStartedAtMs,
      runtimeInstanceId,
      reachable: true,
    };
  } catch {
    return {
      statusEndpoint,
      serviceVersion: null,
      buildHash: null,
      commitSha: null,
      processStartedAtMs: null,
      runtimeInstanceId: null,
      reachable: false,
    };
  }
};

export const buildControlMetricVolumeRef = (
  args: {
    baseUrl: string;
    metricT00Ref: string;
    metricT00Source: string;
    dutyFR: number;
    q: number;
    gammaGeo: number;
    gammaVdB: number;
    zeta: number;
    phase01: number;
    dims?: [number, number, number];
    requireCongruentSolve?: boolean;
    requireNhm2CongruentFullSolve?: boolean;
  },
): HullMetricVolumeRefV1 => {
  const dims = args.dims ?? [48, 48, 48];
  const params = new URLSearchParams();
  params.set("dims", `${dims[0]}x${dims[1]}x${dims[2]}`);
  params.set("time_s", "0");
  params.set("dt_s", "0.01");
  params.set("steps", "1");
  params.set("includeExtra", "1");
  params.set("includeKij", "1");
  params.set("includeMatter", "1");
  params.set("dutyFR", String(args.dutyFR));
  params.set("q", String(args.q));
  params.set("gammaGeo", String(args.gammaGeo));
  params.set("gammaVdB", String(args.gammaVdB));
  params.set("zeta", String(args.zeta));
  params.set("phase01", String(args.phase01));
  params.set("metricT00Source", args.metricT00Source);
  params.set("metricT00Ref", args.metricT00Ref);
  params.set("format", "raw");
  if (args.requireCongruentSolve) {
    params.set("requireCongruentSolve", "1");
  }
  if (args.requireNhm2CongruentFullSolve) {
    params.set("requireNhm2CongruentFullSolve", "1");
  }
  const url = `${normalizeBaseUrl(args.baseUrl)}/api/helix/gr-evolve-brick?${params.toString()}`;
  return {
    kind: "gr-evolve-brick",
    url,
    chart: "comoving_cartesian",
    source: `york-control.${args.metricT00Ref}`,
    dims,
    updatedAt: Date.now(),
    hash: crypto.createHash("sha256").update(url).digest("hex"),
  };
};

const loadNhm2MetricVolumeRef = (snapshotPath: string): HullMetricVolumeRefV1 => {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`NHM2 snapshot evidence is missing: ${snapshotPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as Record<string, unknown>;
  const rawMetricVolumeRef = asRecord(parsed.metricVolumeRef);
  const url = asText(rawMetricVolumeRef.url);
  if (!url) {
    throw new Error(`NHM2 snapshot evidence has invalid metricVolumeRef: ${snapshotPath}`);
  }
  const dimsRaw = rawMetricVolumeRef.dims;
  const dims =
    Array.isArray(dimsRaw) && dimsRaw.length >= 3
      ? [
          Math.max(1, Math.floor(toFiniteNumber(dimsRaw[0]) ?? 48)),
          Math.max(1, Math.floor(toFiniteNumber(dimsRaw[1]) ?? 48)),
          Math.max(1, Math.floor(toFiniteNumber(dimsRaw[2]) ?? 48)),
        ]
      : undefined;
  const metricVolumeRef: HullMetricVolumeRefV1 = {
    kind: "gr-evolve-brick",
    url,
    chart: asText(rawMetricVolumeRef.chart) ?? "comoving_cartesian",
    source: asText(rawMetricVolumeRef.source) ?? "york-control.nhm2-certified",
    updatedAt: toFiniteNumber(rawMetricVolumeRef.updatedAt) ?? Date.now(),
    hash: asText(rawMetricVolumeRef.hash) ?? "",
    dims,
  };
  if (!metricVolumeRef.hash) {
    metricVolumeRef.hash = resolveMetricRefHash(metricVolumeRef);
  }
  return metricVolumeRef;
};

const buildYorkPayload = (args: {
  caseId: CaseId;
  renderView: HullScientificRenderView;
  diagnosticLaneId: string;
  metricVolumeRef: HullMetricVolumeRefV1;
  requireCongruentNhm2FullSolve: boolean;
  width: number;
  height: number;
}): HullMisRenderRequestV1 => {
  const solveByCase: Record<CaseId, { beta: number; sigma: number; R: number }> = {
    alcubierre_control: { beta: 0.2, sigma: 6, R: 1.1 },
    natario_control: { beta: 0.02, sigma: 6, R: 1.1 },
    nhm2_certified: { beta: 0.02, sigma: 6, R: 1.1 },
  };
  const solve = solveByCase[args.caseId];
  return {
    version: 1,
    requestId: `york-control-family-${args.caseId}-${args.renderView}-${args.diagnosticLaneId}`,
    width: args.width,
    height: args.height,
    dpr: 1,
    backendHint: "mis-path-tracing",
    timestampMs: Date.now(),
    skyboxMode: "geodesic",
    solve: {
      beta: solve.beta,
      alpha: 1,
      sigma: solve.sigma,
      R: solve.R,
      chart: "comoving_cartesian",
    },
    metricVolumeRef: {
      ...args.metricVolumeRef,
      hash: args.metricVolumeRef.hash ?? resolveMetricRefHash(args.metricVolumeRef),
      updatedAt: args.metricVolumeRef.updatedAt ?? Date.now(),
      chart: args.metricVolumeRef.chart ?? "comoving_cartesian",
    },
    scienceLane: {
      requireScientificFrame: true,
      requireCanonicalTensorVolume: true,
      requireCongruentNhm2FullSolve: args.requireCongruentNhm2FullSolve,
      diagnosticLaneId: args.diagnosticLaneId,
      requireIntegralSignal: true,
      renderView: args.renderView,
      samplingMode: "trilinear",
      minVolumeDims: [32, 32, 32],
    },
  };
};

const parseYorkViewSummary = (
  view: HullScientificRenderView,
  lane: YorkRenderLane,
  endpoint: string,
  httpStatus: number,
  response: HullMisRenderResponseV1,
): YorkViewSummary => {
  const cert = response.renderCertificate ?? null;
  const diagnostics = {
    ...asRecord(response.diagnostics ?? {}),
    ...asRecord(cert?.diagnostics ?? {}),
  };
  return {
    view,
    ok: response.ok === true,
    backend: asText(response.backend),
    scientificTier: asText(response.diagnostics?.scientificTier),
    error: null,
    sourceLane: lane,
    endpoint,
    httpStatus,
    errorCode: null,
    responseMessage: null,
    preflightBranch: null,
    preflightRequirement: null,
    laneResults: [],
    note: asText(response.diagnostics?.note),
    render: {
      view: asText(cert?.render?.view) as HullScientificRenderView | null,
      field_key: asText(cert?.render?.field_key),
      lane_id: asText(cert?.render?.lane_id),
      slice_plane: asText(cert?.render?.slice_plane),
      coordinate_mode: asText(cert?.render?.coordinate_mode),
      normalization: asText(cert?.render?.normalization),
      magnitude_mode: asText(cert?.render?.magnitude_mode),
      surface_height: asText(cert?.render?.surface_height),
      support_overlay: asText(cert?.render?.support_overlay),
    },
    identity: {
      lane_id:
        asText(cert?.render?.lane_id) ??
        asText(diagnostics.lane_id) ??
        null,
      metric_ref_hash: asText(cert?.metric_ref_hash),
      timestamp_ms: toFiniteNumber(cert?.timestamp_ms),
      chart: asText(cert?.chart),
      observer: asText(cert?.observer),
      theta_definition: asText(cert?.theta_definition),
      kij_sign_convention: asText(cert?.kij_sign_convention),
      unit_system: asText(cert?.unit_system),
    },
    rawExtrema: {
      min: toFiniteNumber(diagnostics.theta_min_raw ?? diagnostics.theta_min),
      max: toFiniteNumber(diagnostics.theta_max_raw ?? diagnostics.theta_max),
      absMax: toFiniteNumber(diagnostics.theta_abs_max_raw ?? diagnostics.theta_abs_max),
    },
    displayExtrema: {
      min: toFiniteNumber(diagnostics.theta_min_display ?? diagnostics.theta_min),
      max: toFiniteNumber(diagnostics.theta_max_display ?? diagnostics.theta_max),
      absMax: toFiniteNumber(diagnostics.theta_abs_max_display ?? diagnostics.theta_abs_max),
      rangeMethod: asText(diagnostics.display_range_method),
      gain: toFiniteNumber(diagnostics.display_gain),
      heightScale: toFiniteNumber(diagnostics.height_scale),
    },
    nearZeroTheta:
      typeof diagnostics.near_zero_theta === "boolean"
        ? diagnostics.near_zero_theta
        : null,
    samplingChoice: asText(diagnostics.sampling_choice),
    supportOverlapPct: toFiniteNumber(diagnostics.shell_theta_overlap_pct),
    supportedThetaFraction: toFiniteNumber(diagnostics.supported_theta_fraction),
    shellSupportCount: toFiniteNumber(diagnostics.shell_support_count),
    shellActiveCount: toFiniteNumber(diagnostics.shell_active_count),
    hashes: {
      certificate_hash: asText(cert?.certificate_hash),
      frame_hash: asText(cert?.frame_hash),
      theta_channel_hash: asText(diagnostics.theta_channel_hash),
      slice_array_hash: asText(diagnostics.slice_array_hash),
      normalized_slice_hash: asText(diagnostics.normalized_slice_hash),
      support_mask_slice_hash: asText(diagnostics.support_mask_slice_hash),
      shell_masked_slice_hash: asText(diagnostics.shell_masked_slice_hash),
    },
    laneEvidence: {
      observer_definition_id: asText(diagnostics.observer_definition_id),
      observer_inputs_required: Array.isArray(diagnostics.observer_inputs_required)
        ? diagnostics.observer_inputs_required
            .map((entry) => asText(entry))
            .filter((entry): entry is string => !!entry)
        : null,
      observer_inputs_present:
        typeof diagnostics.observer_inputs_present === "boolean"
          ? diagnostics.observer_inputs_present
          : null,
      lane_b_semantic_mode: asText(diagnostics.lane_b_semantic_mode),
      lane_b_tensor_inputs_hash: asText(diagnostics.lane_b_tensor_inputs_hash),
      lane_b_geometry_ready:
        typeof diagnostics.lane_b_geometry_ready === "boolean"
          ? diagnostics.lane_b_geometry_ready
          : null,
      lane_b_semantics_closed:
        typeof diagnostics.lane_b_semantics_closed === "boolean"
          ? diagnostics.lane_b_semantics_closed
          : null,
    },
  };
};

const isRetryableRenderFailure = (status: number, errorText: string | null): boolean => {
  if (status >= 500) return true;
  if (!errorText) return false;
  if (RETRYABLE_RENDER_ERRORS.has(errorText)) return true;
  if (errorText.startsWith("metric_ref_http_")) return true;
  return false;
};

const renderYorkView = async (args: {
  frameEndpoint: string;
  payload: HullMisRenderRequestV1;
  view: HullScientificRenderView;
  lane: YorkRenderLane;
}): Promise<YorkViewSummary> => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await withTimeoutFetch(
        args.frameEndpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args.payload),
        },
        65_000,
      );
      const json = (await response.json()) as HullMisRenderResponseV1 | Record<string, unknown>;
      if (!response.ok || !(json as HullMisRenderResponseV1).renderCertificate) {
        const errorBody = asRecord(json);
        const errorText = asText(errorBody.error);
        const responseMessage = asText(errorBody.message);
        if (attempt < 2 && isRetryableRenderFailure(response.status, errorText)) {
          await sleep(250 * attempt);
          continue;
        }
        const preflight = mapPreflightFailure({
          lane: args.lane,
          errorCode: errorText,
          responseMessage,
        });
        return buildErrorYorkViewSummary(
          args.view,
          {
            lane: args.lane,
            endpoint: args.frameEndpoint,
            httpStatus: response.status,
            errorCode: errorText,
            responseMessage,
            preflightBranch: preflight.branch,
            preflightRequirement: preflight.requirement,
            message: `http_${response.status}: ${errorText ?? response.statusText}`,
          },
        );
      }
      return parseYorkViewSummary(
        args.view,
        args.lane,
        args.frameEndpoint,
        response.status,
        json as HullMisRenderResponseV1,
      );
    } catch (error) {
      if (attempt < 2) {
        await sleep(250 * attempt);
        continue;
      }
      return buildErrorYorkViewSummary(
        args.view,
        {
          lane: args.lane,
          endpoint: args.frameEndpoint,
          httpStatus: null,
          errorCode: null,
          responseMessage: null,
          preflightBranch: null,
          preflightRequirement: null,
          message: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
  return buildErrorYorkViewSummary(args.view, {
    lane: args.lane,
    endpoint: args.frameEndpoint,
    httpStatus: null,
    errorCode: null,
    responseMessage: null,
    preflightBranch: null,
    preflightRequirement: null,
    message: "unknown_render_failure",
  });
};

const buildErrorYorkViewSummary = (
  view: HullScientificRenderView,
  failure: {
    lane: YorkRenderLane;
    endpoint: string;
    httpStatus: number | null;
    errorCode: string | null;
    responseMessage: string | null;
    preflightBranch: string | null;
    preflightRequirement: string | null;
    message: string;
  },
): YorkViewSummary => ({
  view,
  ok: false,
  backend: null,
  scientificTier: null,
  error: failure.message,
  sourceLane: failure.lane,
  endpoint: failure.endpoint,
  httpStatus: failure.httpStatus,
  errorCode: failure.errorCode,
  responseMessage: failure.responseMessage,
  preflightBranch: failure.preflightBranch,
  preflightRequirement: failure.preflightRequirement,
  laneResults: [],
  note: null,
  render: {
    view: null,
    field_key: null,
    lane_id: null,
    slice_plane: null,
    coordinate_mode: null,
    normalization: null,
    magnitude_mode: null,
    surface_height: null,
    support_overlay: null,
  },
  identity: {
    lane_id: null,
    metric_ref_hash: null,
    timestamp_ms: null,
    chart: null,
    observer: null,
    theta_definition: null,
    kij_sign_convention: null,
    unit_system: null,
  },
  rawExtrema: { min: null, max: null, absMax: null },
  displayExtrema: {
    min: null,
    max: null,
    absMax: null,
    rangeMethod: null,
    gain: null,
    heightScale: null,
  },
  nearZeroTheta: null,
  samplingChoice: null,
  supportOverlapPct: null,
  supportedThetaFraction: null,
  shellSupportCount: null,
  shellActiveCount: null,
  hashes: {
    certificate_hash: null,
    frame_hash: null,
    theta_channel_hash: null,
    slice_array_hash: null,
    normalized_slice_hash: null,
    support_mask_slice_hash: null,
    shell_masked_slice_hash: null,
  },
  laneEvidence: {
    observer_definition_id: null,
    observer_inputs_required: null,
    observer_inputs_present: null,
    lane_b_semantic_mode: null,
    lane_b_tensor_inputs_hash: null,
    lane_b_geometry_ready: null,
    lane_b_semantics_closed: null,
  },
});

const computeThetaPlusKTraceConsistency = (theta: Float32Array, kTrace: Float32Array) => {
  const n = Math.min(theta.length, kTrace.length);
  if (n <= 0) {
    return { rms: null, maxAbs: null, mean: null, sampleCount: 0, consistent: false };
  }
  let sum = 0;
  let sumSq = 0;
  let maxAbs = 0;
  let sampleCount = 0;
  let maxSignal = 0;
  for (let i = 0; i < n; i += 1) {
    const tv = Number(theta[i] ?? Number.NaN);
    const kv = Number(kTrace[i] ?? Number.NaN);
    if (!Number.isFinite(tv) || !Number.isFinite(kv)) continue;
    const residual = tv + kv;
    sum += residual;
    sumSq += residual * residual;
    maxAbs = Math.max(maxAbs, Math.abs(residual));
    maxSignal = Math.max(maxSignal, Math.abs(tv), Math.abs(kv));
    sampleCount += 1;
  }
  if (sampleCount <= 0) {
    return { rms: null, maxAbs: null, mean: null, sampleCount: 0, consistent: false };
  }
  const mean = sum / sampleCount;
  const rms = Math.sqrt(sumSq / sampleCount);
  const tolerance = Math.max(1e-12, maxSignal * 1e-6);
  return {
    rms,
    maxAbs,
    mean,
    sampleCount,
    consistent: maxAbs <= tolerance,
  };
};

export const readSourceFamilyEvidence = (snapshot: {
  stats: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
}): SourceFamilyEvidence => {
  const hasSourceFamilyEvidence = (mapping: Record<string, unknown> | null): boolean => {
    if (!mapping) return false;
    return (
      asText(mapping.family_id) !== null ||
      asText(mapping.metricT00Ref) !== null ||
      asText(mapping.warpFieldType) !== null ||
      asText(mapping.source_branch) !== null ||
      asText(mapping.shape_function_id) !== null
    );
  };
  const statsRoot = asRecord(snapshot.stats);
  const stressEnergyStats = asRecord(statsRoot?.stressEnergy);
  const preferredMapping = asRecord(stressEnergyStats?.mapping);
  const fallbackStressEnergy = asRecord(snapshot.meta?.stressEnergy);
  const fallbackMapping = asRecord(fallbackStressEnergy?.mapping);
  const selectedMapping = hasSourceFamilyEvidence(preferredMapping)
    ? preferredMapping
    : hasSourceFamilyEvidence(fallbackMapping)
      ? fallbackMapping
      : null;
  return {
    family_id: asText(selectedMapping?.family_id),
    metricT00Ref: asText(selectedMapping?.metricT00Ref),
    warpFieldType: asText(selectedMapping?.warpFieldType),
    source_branch: asText(selectedMapping?.source_branch),
    shape_function_id: asText(selectedMapping?.shape_function_id),
  };
};

const computeLaneTensorInputsHashFromSnapshot = (args: {
  snapshot: {
    channels: Record<string, { data: Float32Array } | undefined>;
  };
  requiredInputs: string[];
}): string | null => {
  if (args.requiredInputs.length === 0) return null;
  const pairs: string[] = [];
  for (const channelId of args.requiredInputs) {
    const data = args.snapshot.channels[channelId]?.data;
    if (!(data instanceof Float32Array) || data.length === 0) return null;
    pairs.push(`${channelId}:${hashFloat32(data)}`);
  }
  return crypto
    .createHash("sha256")
    .update(pairs.join("|"))
    .digest("hex");
};

const runCase = async (args: {
  diagnosticLane: YorkDiagnosticLane;
  caseId: CaseId;
  label: string;
  familyExpectation: CaseResult["familyExpectation"];
  metricVolumeRef: HullMetricVolumeRefV1;
  frameEndpoint: string;
  proxyFrameEndpoint: string | null;
  compareDirectAndProxy: boolean;
  requireCongruentNhm2FullSolve: boolean;
  yorkViews: HullScientificRenderView[];
  frameSize: { width: number; height: number };
}): Promise<CaseResult> => {
  const perView: YorkViewSummary[] = [];
  const laneConfigs: Array<{ lane: YorkRenderLane; endpoint: string }> =
    args.compareDirectAndProxy && args.proxyFrameEndpoint
      ? [
          { lane: "direct", endpoint: args.frameEndpoint },
          { lane: "proxy", endpoint: args.proxyFrameEndpoint },
        ]
      : [{ lane: "single", endpoint: args.frameEndpoint }];
  for (const view of args.yorkViews) {
    const payload = buildYorkPayload({
      caseId: args.caseId,
      renderView: view,
      diagnosticLaneId: args.diagnosticLane.lane_id,
      metricVolumeRef: args.metricVolumeRef,
      requireCongruentNhm2FullSolve: args.requireCongruentNhm2FullSolve,
      width: args.frameSize.width,
      height: args.frameSize.height,
    });
    const laneSummaries: YorkViewSummary[] = [];
    for (const laneConfig of laneConfigs) {
      laneSummaries.push(
        await renderYorkView({
          frameEndpoint: laneConfig.endpoint,
          payload,
          view,
          lane: laneConfig.lane,
        }),
      );
    }
    const selected =
      laneSummaries.find((entry) => entry.ok) ??
      laneSummaries.find((entry) => entry.sourceLane === "direct") ??
      laneSummaries[0];
    const laneResults: YorkLaneResultSummary[] = laneSummaries.map((entry) => ({
      lane: entry.sourceLane ?? "single",
      endpoint: entry.endpoint ?? args.frameEndpoint,
      ok: entry.ok,
      httpStatus: entry.httpStatus,
      errorCode: entry.errorCode,
      responseMessage: entry.responseMessage,
      preflightBranch: entry.preflightBranch,
      preflightRequirement: entry.preflightRequirement,
      error: entry.error,
    }));
    perView.push({
      ...selected,
      laneResults,
    });
  }

  let snapshotMetrics: CaseSnapshotMetrics | null = null;
  let offlineYorkAudit: CaseOfflineYorkAudit | null = null;
  let parity: CaseLaneAParityAudit | null = null;
  try {
    const snapshot = await loadHullScientificSnapshot(args.metricVolumeRef, {
      baseUrl: null,
      timeoutMs: 120_000,
    });
    const thetaCanonical = snapshot.channels.theta?.data;
    const kTrace = snapshot.channels.K_trace?.data;
    const laneId: YorkDiagnosticLaneId | null = isYorkDiagnosticLaneId(
      args.diagnosticLane.lane_id,
    )
      ? args.diagnosticLane.lane_id
      : null;
    const laneField =
      laneId != null
        ? computeYorkDiagnosticLaneField({
            laneId,
            dims: snapshot.dims,
            voxelSizeM: snapshot.voxelSize_m,
            theta: thetaCanonical instanceof Float32Array ? thetaCanonical : null,
            kTrace: kTrace instanceof Float32Array ? kTrace : null,
            betaX:
              snapshot.channels.beta_x?.data instanceof Float32Array
                ? snapshot.channels.beta_x.data
                : null,
            betaY:
              snapshot.channels.beta_y?.data instanceof Float32Array
                ? snapshot.channels.beta_y.data
                : null,
            betaZ:
              snapshot.channels.beta_z?.data instanceof Float32Array
                ? snapshot.channels.beta_z.data
                : null,
            alpha:
              snapshot.channels.alpha?.data instanceof Float32Array
                ? snapshot.channels.alpha.data
                : null,
            gammaXX:
              snapshot.channels.gamma_xx?.data instanceof Float32Array
                ? snapshot.channels.gamma_xx.data
                : null,
            gammaXY:
              snapshot.channels.gamma_xy?.data instanceof Float32Array
                ? snapshot.channels.gamma_xy.data
                : null,
            gammaXZ:
              snapshot.channels.gamma_xz?.data instanceof Float32Array
                ? snapshot.channels.gamma_xz.data
                : null,
            gammaYY:
              snapshot.channels.gamma_yy?.data instanceof Float32Array
                ? snapshot.channels.gamma_yy.data
                : null,
            gammaYZ:
              snapshot.channels.gamma_yz?.data instanceof Float32Array
                ? snapshot.channels.gamma_yz.data
                : null,
            gammaZZ:
              snapshot.channels.gamma_zz?.data instanceof Float32Array
                ? snapshot.channels.gamma_zz.data
                : null,
          })
        : {
            ok: false as const,
            error: "scientific_york_lane_tensor_missing" as const,
            missingChannels: ["diagnostic_lane_id"],
          };
    const thetaLane = laneField.ok ? laneField.theta : null;
    const contractField = laneField.ok ? laneField.contractField : null;
    const runtimeLaneEvidence =
      perView.find(
        (entry) =>
          entry.ok === true && entry.identity.lane_id === args.diagnosticLane.lane_id,
      )?.laneEvidence ?? null;
    const laneTensorInputsHash = laneField.ok
      ? computeLaneTensorInputsHashFromSnapshot({
          snapshot,
          requiredInputs: laneField.observerConstruction.observer_inputs_required,
        })
      : null;
    const sourceFamily = readSourceFamilyEvidence(snapshot);
    snapshotMetrics = {
      dims: snapshot.dims,
      resolvedUrl: snapshot.resolvedUrl,
      metricRefHash: snapshot.metricRefHash,
      requestMetricRefHash: resolveMetricRefHash(args.metricVolumeRef),
      source: snapshot.source,
      chart: snapshot.chart,
      channelHashes: {
        theta: thetaLane instanceof Float32Array ? hashFloat32(thetaLane) : null,
        K_trace: kTrace instanceof Float32Array ? hashFloat32(kTrace) : null,
        theta_canonical:
          thetaCanonical instanceof Float32Array ? hashFloat32(thetaCanonical) : null,
        lane_contract:
          contractField instanceof Float32Array ? hashFloat32(contractField) : null,
      },
      laneComputation: {
        lane_id: laneId,
        theta_source: laneField.ok ? laneField.source : laneField.error,
        contract_source: laneField.ok ? laneField.contractSource : laneField.error,
        observer_definition_id:
          laneField.ok ? laneField.observerConstruction.observer_definition_id : null,
        observer_inputs_required:
          laneField.ok ? [...laneField.observerConstruction.observer_inputs_required] : [],
        observer_construction_inputs:
          laneField.ok ? [...laneField.observerConstruction.observer_construction_inputs] : [],
        observer_construction_formula:
          laneField.ok ? laneField.observerConstruction.observer_construction_formula : null,
        observer_normalized:
          laneField.ok ? laneField.observerConstruction.observer_normalized : false,
        observer_approximation:
          laneField.ok ? laneField.observerConstruction.observer_approximation : null,
        observer_inputs_present:
          laneField.ok
            ? runtimeLaneEvidence?.observer_inputs_present ??
              laneField.observerConstruction.observer_inputs_present
            : false,
        lane_b_semantic_mode:
          laneField.ok
            ? runtimeLaneEvidence?.lane_b_semantic_mode ??
              laneField.observerConstruction.lane_b_semantic_mode
            : null,
        lane_b_tensor_inputs_hash:
          laneField.ok
            ? runtimeLaneEvidence?.lane_b_tensor_inputs_hash ?? laneTensorInputsHash
            : null,
        lane_b_geometry_ready:
          laneField.ok
            ? runtimeLaneEvidence?.lane_b_geometry_ready ??
              laneField.observerConstruction.lane_b_geometry_ready
            : false,
        lane_b_semantics_closed:
          laneField.ok
            ? runtimeLaneEvidence?.lane_b_semantics_closed ??
              laneField.observerConstruction.semantics_closed
            : false,
        requires_gamma_metric:
          laneField.ok ? laneField.observerConstruction.requires_gamma_metric : false,
        semantics_closed:
          laneField.ok ? laneField.observerConstruction.semantics_closed : false,
        cross_lane_claim_ready:
          laneField.ok ? laneField.observerConstruction.cross_lane_claim_ready : false,
      },
      sourceFamily,
      thetaPlusKTrace:
        thetaLane instanceof Float32Array && contractField instanceof Float32Array
          ? computeThetaPlusKTraceConsistency(thetaLane, contractField)
          : {
              rms: null,
              maxAbs: null,
              mean: null,
              sampleCount: 0,
              consistent: false,
            },
    };
    offlineYorkAudit = computeOfflineYorkAudit({
      caseId: args.caseId,
      theta: thetaLane instanceof Float32Array ? thetaLane : null,
      dims: snapshot.dims,
    });
    parity = computeCaseLaneAParityAudit({
      lane: args.diagnosticLane,
      caseId: args.caseId,
      views: args.yorkViews,
      perView,
      snapshotMetrics,
      theta: thetaLane instanceof Float32Array ? thetaLane : null,
      contractField: contractField instanceof Float32Array ? contractField : null,
      supportMask:
        snapshot.channels.tile_support_mask?.data instanceof Float32Array
          ? snapshot.channels.tile_support_mask.data
          : null,
      hullSdf:
        snapshot.channels.hull_sdf?.data instanceof Float32Array
          ? snapshot.channels.hull_sdf.data
          : null,
      dims: snapshot.dims,
    });
  } catch {
    snapshotMetrics = null;
    offlineYorkAudit = null;
    parity = null;
  }

  const primaryViewId = args.yorkViews.includes("york-surface-rho-3p1")
    ? "york-surface-rho-3p1"
    : args.yorkViews[0];
  const primaryView = perView.find((entry) => entry.view === primaryViewId) ?? null;
  const caseCore: Omit<CaseResult, "classificationFeatures"> = {
    caseId: args.caseId,
    label: args.label,
    familyExpectation: args.familyExpectation,
    metricVolumeRef: args.metricVolumeRef,
    perView,
    primaryYork: {
      view: primaryViewId,
      rawExtrema: primaryView?.rawExtrema ?? null,
      displayExtrema: primaryView?.displayExtrema ?? null,
      nearZeroTheta: primaryView?.nearZeroTheta ?? null,
      coordinateMode: primaryView?.render.coordinate_mode ?? null,
      samplingChoice: primaryView?.samplingChoice ?? null,
      supportOverlapPct: primaryView?.supportOverlapPct ?? null,
    },
    snapshotMetrics,
    offlineYorkAudit,
    parity,
  };
  return {
    ...caseCore,
    classificationFeatures: buildCaseClassificationFeatures(caseCore),
  };
};

export const buildControlDebug = (cases: CaseResult[]): ControlDebugEntry[] =>
  cases.map((entry) => {
    const requestUrl = asText(entry.metricVolumeRef.url);
    const selectors = readControlRequestSelectors(requestUrl);
    return {
      caseId: entry.caseId,
      label: entry.label,
      requestUrl,
      requestSelectors: selectors,
      resolvedMetricRefHash: entry.snapshotMetrics?.metricRefHash ?? null,
      requestMetricRefHash:
        entry.snapshotMetrics?.requestMetricRefHash ??
        (entry.metricVolumeRef ? resolveMetricRefHash(entry.metricVolumeRef) : null),
      thetaHash: entry.snapshotMetrics?.channelHashes.theta ?? null,
      kTraceHash: entry.snapshotMetrics?.channelHashes.K_trace ?? null,
      brickSource: entry.snapshotMetrics?.source ?? null,
      chart: entry.snapshotMetrics?.chart ?? null,
      family_id: entry.snapshotMetrics?.sourceFamily.family_id ?? null,
      metricT00Ref: entry.snapshotMetrics?.sourceFamily.metricT00Ref ?? null,
      warpFieldType: entry.snapshotMetrics?.sourceFamily.warpFieldType ?? null,
      source_branch: entry.snapshotMetrics?.sourceFamily.source_branch ?? null,
      shape_function_id: entry.snapshotMetrics?.sourceFamily.shape_function_id ?? null,
    };
  });

const hasStrictYorkDiagnostics = (summary: YorkViewSummary): boolean => {
  const raw = summary.rawExtrema;
  const display = summary.displayExtrema;
  const identity = summary.identity;
  return (
    Number.isFinite(raw.min ?? Number.NaN) &&
    Number.isFinite(raw.max ?? Number.NaN) &&
    Number.isFinite(raw.absMax ?? Number.NaN) &&
    Number.isFinite(display.min ?? Number.NaN) &&
    Number.isFinite(display.max ?? Number.NaN) &&
    Number.isFinite(display.absMax ?? Number.NaN) &&
    typeof display.rangeMethod === "string" &&
    display.rangeMethod.trim().length > 0 &&
    Number.isFinite(display.gain ?? Number.NaN) &&
    Number.isFinite(display.heightScale ?? Number.NaN) &&
    typeof summary.nearZeroTheta === "boolean" &&
    typeof summary.samplingChoice === "string" &&
    summary.samplingChoice.trim().length > 0 &&
    typeof identity.metric_ref_hash === "string" &&
    identity.metric_ref_hash.trim().length > 0 &&
    Number.isFinite(identity.timestamp_ms ?? Number.NaN) &&
    typeof identity.theta_definition === "string" &&
    identity.theta_definition.trim().length > 0
  );
};

const requiredYorkHashesByView: Record<HullScientificRenderView, Array<keyof YorkViewSummary["hashes"]>> =
  {
    "york-time-3p1": ["theta_channel_hash", "slice_array_hash"],
    "york-surface-3p1": ["theta_channel_hash", "slice_array_hash"],
    "york-surface-rho-3p1": ["theta_channel_hash", "slice_array_hash"],
    "york-topology-normalized-3p1": [
      "theta_channel_hash",
      "slice_array_hash",
      "normalized_slice_hash",
    ],
    "york-shell-map-3p1": [
      "theta_channel_hash",
      "slice_array_hash",
      "support_mask_slice_hash",
      "shell_masked_slice_hash",
    ],
    "diagnostic-quad": ["theta_channel_hash", "slice_array_hash"],
    "paper-rho": ["theta_channel_hash", "slice_array_hash"],
    "transport-3p1": ["theta_channel_hash", "slice_array_hash"],
    "shift-shell-3p1": ["theta_channel_hash", "slice_array_hash"],
    "full-atlas": ["theta_channel_hash", "slice_array_hash"],
  };

export const evaluateProofPackPreconditions = (args: {
  yorkViews: HullScientificRenderView[];
  cases: CaseResult[];
  runtimeStatus: ProofPackPayload["provenance"]["runtimeStatus"];
}): { preconditions: ProofPackPreconditions; guardFailures: GuardFailure[] } => {
  const guardFailures: GuardFailure[] = [];
  const requiredViews = ensureRequiredYorkViews([...args.yorkViews]);

  for (const entry of args.cases) {
    for (const requiredView of requiredViews) {
      const summary = entry.perView.find((candidate) => candidate.view === requiredView);
      if (!summary) {
        guardFailures.push({
          code: "proof_pack_required_view_missing",
          detail: `${entry.caseId}:${requiredView}`,
        });
        continue;
      }
      if (!summary.ok || summary.error) {
        guardFailures.push({
          code: "proof_pack_required_view_render_failed",
          detail: `${entry.caseId}:${requiredView}:lane=${summary.sourceLane ?? "null"}:status=${summary.httpStatus ?? "null"}:error=${summary.errorCode ?? "null"}:message=${summary.responseMessage ?? summary.error ?? "render_failed"}:branch=${summary.preflightBranch ?? "unknown"}:requirement=${summary.preflightRequirement ?? "unknown"}`,
        });
        continue;
      }
      if (!summary.render.view || summary.render.view === "diagnostic-quad") {
        guardFailures.push({
          code: "proof_pack_required_view_fell_back_to_diagnostic_quad",
          detail: `${entry.caseId}:${requiredView}`,
        });
      }
      if (summary.render.view !== requiredView) {
        guardFailures.push({
          code: "proof_pack_required_view_mismatch",
          detail: `${entry.caseId}:requested=${requiredView}:rendered=${summary.render.view ?? "null"}`,
        });
      }
      if (!hasStrictYorkDiagnostics(summary)) {
        guardFailures.push({
          code: "proof_pack_required_view_missing_strict_york_diagnostics",
          detail: `${entry.caseId}:${requiredView}`,
        });
      }
      const requiredHashes = requiredYorkHashesByView[requiredView] ?? [
        "theta_channel_hash",
        "slice_array_hash",
      ];
      for (const hashKey of requiredHashes) {
        const hashValue = summary.hashes[hashKey];
        if (typeof hashValue !== "string" || hashValue.trim().length === 0) {
          guardFailures.push({
            code: "proof_pack_required_view_missing_provenance_hash",
            detail: `${entry.caseId}:${requiredView}:${hashKey}`,
          });
        }
      }
    }
    if (!entry.parity) {
      guardFailures.push({
        code: "proof_pack_lane_a_parity_missing",
        detail: `${entry.caseId}:parity_unavailable`,
      });
      continue;
    }
    if (!entry.parity.parityComputed) {
      guardFailures.push({
        code: "proof_pack_lane_a_offline_render_parity_missing",
        detail: `${entry.caseId}:offline_render_parity_not_computed`,
      });
    }
    if (!entry.parity.thetaKTraceParityComputed) {
      guardFailures.push({
        code: "proof_pack_lane_a_theta_ktrace_parity_missing",
        detail: `${entry.caseId}:theta_ktrace_parity_not_computed`,
      });
    }
    if (!entry.parity.snapshotIdentityComplete) {
      guardFailures.push({
        code: "proof_pack_lane_a_snapshot_identity_incomplete",
        detail: `${entry.caseId}:snapshot_identity_incomplete`,
      });
    }
    if (entry.parity.status !== "pass") {
      guardFailures.push({
        code: "proof_pack_lane_a_parity_failed",
        detail: `${entry.caseId}:cause=${entry.parity.causeCode ?? "unknown"}`,
      });
    }
  }

  const alc = args.cases.find((entry) => entry.caseId === "alcubierre_control") ?? null;
  const nat = args.cases.find((entry) => entry.caseId === "natario_control") ?? null;
  const alcUrl = asText(alc?.metricVolumeRef?.url ?? null);
  const natUrl = asText(nat?.metricVolumeRef?.url ?? null);
  const controlRequestUrlsDiffer =
    typeof alcUrl === "string" &&
    alcUrl.length > 0 &&
    typeof natUrl === "string" &&
    natUrl.length > 0 &&
    alcUrl !== natUrl;
  const alcThetaHash = alc?.snapshotMetrics?.channelHashes.theta ?? null;
  const natThetaHash = nat?.snapshotMetrics?.channelHashes.theta ?? null;
  const alcKTraceHash = alc?.snapshotMetrics?.channelHashes.K_trace ?? null;
  const natKTraceHash = nat?.snapshotMetrics?.channelHashes.K_trace ?? null;
  const controlThetaHashesEqual =
    typeof alcThetaHash === "string" &&
    alcThetaHash.trim().length > 0 &&
    typeof natThetaHash === "string" &&
    natThetaHash.trim().length > 0 &&
    alcThetaHash === natThetaHash;
  const controlKTraceHashesEqual =
    typeof alcKTraceHash === "string" &&
    alcKTraceHash.trim().length > 0 &&
    typeof natKTraceHash === "string" &&
    natKTraceHash.trim().length > 0 &&
    alcKTraceHash === natKTraceHash;
  const controlSourceMappingVisible = [alc, nat].every((entry) => {
    const source = asText(entry?.snapshotMetrics?.source ?? null);
    const family = entry?.snapshotMetrics?.sourceFamily;
    return (
      typeof source === "string" &&
      source.trim().length > 0 &&
      typeof family?.family_id === "string" &&
      family.family_id.trim().length > 0 &&
      typeof family.metricT00Ref === "string" &&
      family.metricT00Ref.trim().length > 0 &&
      typeof family.warpFieldType === "string" &&
      family.warpFieldType.trim().length > 0 &&
      typeof family.source_branch === "string" &&
      family.source_branch.trim().length > 0 &&
      typeof family.shape_function_id === "string" &&
      family.shape_function_id.trim().length > 0
    );
  });
  for (const controlCase of [alc, nat]) {
    if (!controlCase) continue;
    const thetaHash = asText(controlCase.snapshotMetrics?.channelHashes.theta ?? null);
    const kTraceHash = asText(controlCase.snapshotMetrics?.channelHashes.K_trace ?? null);
    const hasProvenanceHash =
      (typeof thetaHash === "string" && thetaHash.length > 0) ||
      (typeof kTraceHash === "string" && kTraceHash.length > 0);
    if (!hasProvenanceHash) continue;
    const family = controlCase.snapshotMetrics?.sourceFamily;
    const missingFields: string[] = [];
    if (!asText(family?.family_id ?? null)) missingFields.push("family_id");
    if (!asText(family?.warpFieldType ?? null)) missingFields.push("warpFieldType");
    if (!asText(family?.source_branch ?? null)) missingFields.push("source_branch");
    if (missingFields.length > 0) {
      guardFailures.push({
        code: "proof_pack_control_mapping_evidence_missing_in_payload",
        detail: `${controlCase.caseId}:missing=${missingFields.join(",")}:thetaHash=${thetaHash ?? "null"}:kTraceHash=${kTraceHash ?? "null"}`,
      });
    }
  }
  if (controlRequestUrlsDiffer && controlThetaHashesEqual && controlKTraceHashesEqual) {
    guardFailures.push({
      code: "proof_pack_control_theta_hash_collision",
      detail: `alc_url=${alcUrl} nat_url=${natUrl} theta_hash=${alcThetaHash} K_trace_hash=${alcKTraceHash}`,
    });
  }
  if (!controlRequestUrlsDiffer) {
    guardFailures.push({
      code: "proof_pack_control_request_url_not_distinct",
      detail: `alc_url=${alcUrl ?? "null"} nat_url=${natUrl ?? "null"}`,
    });
  }
  const controlsIndependent =
    controlRequestUrlsDiffer &&
    controlSourceMappingVisible &&
    (
      (typeof alcThetaHash === "string" &&
        alcThetaHash.trim().length > 0 &&
        typeof natThetaHash === "string" &&
        natThetaHash.trim().length > 0 &&
        alcThetaHash !== natThetaHash) ||
      (typeof alcKTraceHash === "string" &&
        alcKTraceHash.trim().length > 0 &&
        typeof natKTraceHash === "string" &&
        natKTraceHash.trim().length > 0 &&
        alcKTraceHash !== natKTraceHash)
    );
  if (!controlSourceMappingVisible) {
    guardFailures.push({
      code: "proof_pack_controls_collapsed_source_branch_missing",
      detail: `alc_source=${alc?.snapshotMetrics?.source ?? "null"} nat_source=${nat?.snapshotMetrics?.source ?? "null"} alc_source_branch=${alc?.snapshotMetrics?.sourceFamily.source_branch ?? "null"} nat_source_branch=${nat?.snapshotMetrics?.sourceFamily.source_branch ?? "null"}`,
    });
  }
  if (!controlsIndependent) {
    guardFailures.push({
      code: "proof_pack_controls_not_independent",
      detail: `alc_theta_hash=${alcThetaHash ?? "null"} nat_theta_hash=${natThetaHash ?? "null"} alc_k_trace_hash=${alcKTraceHash ?? "null"} nat_k_trace_hash=${natKTraceHash ?? "null"}`,
    });
    if (controlSourceMappingVisible && controlRequestUrlsDiffer) {
      guardFailures.push({
        code: "proof_pack_controls_diverged_upstream_but_collapsed_later",
        detail: `alc_theta_hash=${alcThetaHash ?? "null"} nat_theta_hash=${natThetaHash ?? "null"} alc_k_trace_hash=${alcKTraceHash ?? "null"} nat_k_trace_hash=${natKTraceHash ?? "null"}`,
      });
    }
  }

  const allRequiredViewsRendered = !guardFailures.some((failure) =>
    failure.code.startsWith("proof_pack_required_view_"),
  );
  const provenanceHashesPresent = !guardFailures.some(
    (failure) => failure.code === "proof_pack_required_view_missing_provenance_hash",
  );
  const offlineRenderParityComputed = !guardFailures.some(
    (failure) =>
      failure.code === "proof_pack_lane_a_parity_missing" ||
      failure.code === "proof_pack_lane_a_offline_render_parity_missing",
  );
  const thetaKTraceParityComputed = !guardFailures.some(
    (failure) => failure.code === "proof_pack_lane_a_theta_ktrace_parity_missing",
  );
  const snapshotIdentityComplete = !guardFailures.some(
    (failure) => failure.code === "proof_pack_lane_a_snapshot_identity_incomplete",
  );
  const diagnosticParityClosed = !guardFailures.some(
    (failure) => failure.code === "proof_pack_lane_a_parity_failed",
  );
  const runtimeStatusProvenancePresent =
    args.runtimeStatus.reachable &&
    typeof args.runtimeStatus.serviceVersion === "string" &&
    args.runtimeStatus.serviceVersion.trim().length > 0 &&
    Number.isFinite(args.runtimeStatus.processStartedAtMs ?? Number.NaN) &&
    typeof args.runtimeStatus.runtimeInstanceId === "string" &&
    args.runtimeStatus.runtimeInstanceId.trim().length > 0;
  if (!runtimeStatusProvenancePresent) {
    guardFailures.push({
      code: "proof_pack_runtime_status_provenance_missing",
      detail: `statusEndpoint=${args.runtimeStatus.statusEndpoint}`,
    });
  }
  if (!args.runtimeStatus.buildHash || args.runtimeStatus.buildHash.trim().length === 0) {
    guardFailures.push({
      code: "proof_pack_runtime_status_build_hash_missing",
      detail: `statusEndpoint=${args.runtimeStatus.statusEndpoint}`,
    });
  }
  if (!args.runtimeStatus.commitSha || args.runtimeStatus.commitSha.trim().length === 0) {
    guardFailures.push({
      code: "proof_pack_runtime_status_commit_sha_missing",
      detail: `statusEndpoint=${args.runtimeStatus.statusEndpoint}`,
    });
  }

  const preconditions: ProofPackPreconditions = {
    controlsIndependent,
    allRequiredViewsRendered,
    provenanceHashesPresent,
    runtimeStatusProvenancePresent,
    offlineRenderParityComputed,
    thetaKTraceParityComputed,
    snapshotIdentityComplete,
    diagnosticParityClosed,
    // Legacy alias for compatibility with existing consumers.
    laneAParityClosed: diagnosticParityClosed,
    readyForFamilyVerdict:
      controlsIndependent &&
      allRequiredViewsRendered &&
      provenanceHashesPresent &&
      runtimeStatusProvenancePresent &&
      offlineRenderParityComputed &&
      thetaKTraceParityComputed &&
      snapshotIdentityComplete &&
      diagnosticParityClosed,
  };
  return { preconditions, guardFailures };
};

export const decideControlFamilyVerdict = (args: {
  preconditions: ProofPackPreconditions;
  controlsCalibratedByReferences: boolean;
  classificationScoring: Nhm2ReferenceScoring | null;
  yorkCongruence?: YorkCongruenceEvaluation;
}): DecisionVerdict => {
  if (!args.preconditions.readyForFamilyVerdict) return "inconclusive";
  const congruenceCalibrationFailed =
    args.yorkCongruence?.rhoRemapMismatch === true ||
    args.yorkCongruence?.hashMismatch === true ||
    args.yorkCongruence?.nearZeroSuppressionMismatch === true ||
    args.yorkCongruence?.downstreamRenderMismatch === true;
  if (congruenceCalibrationFailed) return "inconclusive";
  if (!args.controlsCalibratedByReferences) return "inconclusive";
  if (!args.classificationScoring) return "inconclusive";
  if (args.classificationScoring.winning_reference == null) return "inconclusive";
  if (args.classificationScoring.distinct_by_policy) {
    return NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY;
  }
  if (args.classificationScoring.winning_reference === "alcubierre_control") {
    return NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE;
  }
  if (args.classificationScoring.winning_reference === "natario_control") {
    return NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE;
  }
  return NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY;
};

const approxEqual = (a: number | null, b: number | null, tol = 1e-15): boolean => {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol;
};

export const evaluateYorkSliceCongruence = (cases: CaseResult[]): YorkCongruenceEvaluation => {
  const guardFailures: GuardFailure[] = [];
  let hashMismatch = false;
  let rhoRemapMismatch = false;
  let nearZeroSuppressionMismatch = false;
  let downstreamRenderMismatch = false;
  for (const entry of cases) {
    const offlineByView = new Map(
      (entry.offlineYorkAudit?.byView ?? []).map((view) => [view.view, view]),
    );
    for (const view of ["york-surface-3p1", "york-surface-rho-3p1"] as const) {
      const rendered = entry.perView.find((candidate) => candidate.view === view);
      const offline = offlineByView.get(view);
      if (!rendered || !offline) continue;
      if (!rendered.hashes.slice_array_hash || !offline.thetaSliceHash) continue;
      const hashesMatch = rendered.hashes.slice_array_hash === offline.thetaSliceHash;
      if (!hashesMatch) {
        hashMismatch = true;
        if (view === "york-surface-rho-3p1") rhoRemapMismatch = true;
        guardFailures.push({
          code:
            view === "york-surface-rho-3p1"
              ? "proof_pack_york_rho_remap_mismatch"
              : "proof_pack_york_slice_hash_mismatch",
          detail: `${entry.caseId}:${view}:offline=${offline.thetaSliceHash}:rendered=${rendered.hashes.slice_array_hash}`,
        });
      }
      const extremaMatch =
        approxEqual(offline.rawExtrema.min, rendered.rawExtrema.min) &&
        approxEqual(offline.rawExtrema.max, rendered.rawExtrema.max) &&
        approxEqual(offline.rawExtrema.absMax, rendered.rawExtrema.absMax);
      const semanticsMatch =
        rendered.render.coordinate_mode === offline.coordinateMode &&
        rendered.samplingChoice === offline.samplingChoice;
      if (hashesMatch && (!extremaMatch || !semanticsMatch)) {
        downstreamRenderMismatch = true;
        guardFailures.push({
          code: "proof_pack_york_slice_hash_mismatch",
          detail: `${entry.caseId}:${view}:hash_match=true:extrema_match=${extremaMatch}:semantics_match=${semanticsMatch}:coordinate_mode=${rendered.render.coordinate_mode ?? "null"}:sampling_choice=${rendered.samplingChoice ?? "null"}`,
        });
      }
      const structureMeaningful = hasMeaningfulSignedStructure(offline);
      const flattened =
        rendered.nearZeroTheta === true &&
        ((rendered.displayExtrema.absMax ?? 0) <= YORK_NEAR_ZERO_THETA_ABS_THRESHOLD ||
          (rendered.displayExtrema.heightScale ?? 0) <= 1e-12);
      if (hashesMatch && structureMeaningful && flattened) {
        nearZeroSuppressionMismatch = true;
        guardFailures.push({
          code: "proof_pack_york_near_zero_suppression_mismatch",
          detail: `${entry.caseId}:${view}:raw_abs_max=${offline.rawExtrema.absMax}:display_abs_max=${rendered.displayExtrema.absMax ?? "null"}:height_scale=${rendered.displayExtrema.heightScale ?? "null"}:near_zero_theta=${String(rendered.nearZeroTheta)}`,
        });
      }
    }
  }
  return {
    hashMismatch,
    rhoRemapMismatch,
    nearZeroSuppressionMismatch,
    downstreamRenderMismatch,
    guardFailures,
  };
};

export const hasStrongForeAftYork = (summary: CaseResult["primaryYork"]): boolean => {
  if (!summary.rawExtrema) return false;
  const min = summary.rawExtrema.min;
  const max = summary.rawExtrema.max;
  const absMax = summary.rawExtrema.absMax;
  if (min == null || max == null || absMax == null) return false;
  const signedFloor = YORK_SIGN_STRUCTURE_EPS;
  const hasBothSigns = min < -signedFloor && max > signedFloor;
  if (!hasBothSigns) return false;
  if (summary.nearZeroTheta === true) return false;
  if (summary.nearZeroTheta === false) return true;
  return absMax > signedFloor;
};

const hasConsistentAlcubierreSignedLobes = (
  offlineYorkAudit: CaseOfflineYorkAudit | null,
): boolean => {
  const signedLobeSummary = offlineYorkAudit?.alcubierreSignedLobeSummary?.signedLobeSummary;
  return signedLobeSummary === "fore+/aft-" || signedLobeSummary === "fore-/aft+";
};

const hasOfflineSignedStructure = (offlineYorkAudit: CaseOfflineYorkAudit | null): boolean =>
  (offlineYorkAudit?.byView ?? []).some(
    (view) => view.counts.positive > 0 && view.counts.negative > 0,
  );

export const hasSufficientSignalForAlcubierreControl = (entry: CaseResult): boolean => {
  const summary = entry.primaryYork;
  const min = summary.rawExtrema?.min;
  const max = summary.rawExtrema?.max;
  const absMax = summary.rawExtrema?.absMax;
  const hasRawSignPair =
    min != null && max != null && absMax != null && absMax > YORK_SIGN_STRUCTURE_EPS && min < 0 && max > 0;
  if (!hasRawSignPair) return false;

  if (summary.nearZeroTheta === false) {
    return true;
  }

  const offlineSignedStructure = hasOfflineSignedStructure(entry.offlineYorkAudit);
  if (offlineSignedStructure) return true;

  return hasConsistentAlcubierreSignedLobes(entry.offlineYorkAudit);
};

const isLowExpansion = (summary: CaseResult["primaryYork"]): boolean => {
  if (summary.nearZeroTheta === true) return true;
  const absMax = summary.rawExtrema?.absMax;
  if (absMax == null) return false;
  return absMax <= 1e-20;
};

const findOfflineYorkView = (
  audit: CaseOfflineYorkAudit | null,
  view: OfflineYorkViewAudit["view"],
): OfflineYorkViewAudit | null =>
  audit?.byView.find((entry) => entry.view === view) ?? null;

const computeShellMapActivity = (shellView: YorkViewSummary | null): number | null => {
  if (!shellView) return null;
  if (
    Number.isFinite(shellView.shellSupportCount ?? Number.NaN) &&
    Number.isFinite(shellView.shellActiveCount ?? Number.NaN) &&
    (shellView.shellSupportCount ?? 0) > 0
  ) {
    return (shellView.shellActiveCount ?? 0) / (shellView.shellSupportCount ?? 1);
  }
  return shellView.supportedThetaFraction;
};

export const buildCaseClassificationFeatures = (
  entry: Pick<CaseResult, "offlineYorkAudit" | "perView" | "primaryYork">,
): CaseClassificationFeatures => {
  const xz = findOfflineYorkView(entry.offlineYorkAudit, "york-surface-3p1");
  const xrho = findOfflineYorkView(entry.offlineYorkAudit, "york-surface-rho-3p1");
  const shellView = entry.perView.find((candidate) => candidate.view === "york-shell-map-3p1") ?? null;
  return {
    theta_abs_max_raw: entry.primaryYork.rawExtrema?.absMax ?? null,
    theta_abs_max_display: entry.primaryYork.displayExtrema?.absMax ?? null,
    positive_count_xz: xz?.counts.positive ?? null,
    negative_count_xz: xz?.counts.negative ?? null,
    positive_count_xrho: xrho?.counts.positive ?? null,
    negative_count_xrho: xrho?.counts.negative ?? null,
    support_overlap_pct: entry.primaryYork.supportOverlapPct ?? null,
    near_zero_theta: entry.primaryYork.nearZeroTheta ?? null,
    signed_lobe_summary: entry.offlineYorkAudit?.alcubierreSignedLobeSummary?.signedLobeSummary ?? null,
    shell_map_activity: computeShellMapActivity(shellView),
  };
};

const emptyDistanceBreakdown = (featureSet: YorkFeatureName[]): DistanceFeatureBreakdown => {
  const out = {} as DistanceFeatureBreakdown;
  for (const feature of featureSet) out[feature] = null;
  return out;
};

const computeNumericFeatureDistance = (
  referenceValue: number | null,
  targetValue: number | null,
  policy: YorkDiagnosticContract["decision_policy"],
): number => {
  if (!Number.isFinite(referenceValue ?? Number.NaN) || !Number.isFinite(targetValue ?? Number.NaN)) {
    return policy.missing_value_penalty;
  }
  const denom = Math.max(
    Math.abs(referenceValue ?? 0),
    Math.abs(targetValue ?? 0),
    policy.normalization_floor,
  );
  const raw = Math.abs((referenceValue ?? 0) - (targetValue ?? 0)) / denom;
  return Math.min(raw, policy.max_component_distance);
};

const computeBooleanFeatureDistance = (
  referenceValue: boolean | null,
  targetValue: boolean | null,
  policy: YorkDiagnosticContract["decision_policy"],
): number => {
  if (referenceValue == null && targetValue == null) return 0;
  if (referenceValue == null || targetValue == null) return policy.missing_value_penalty;
  return referenceValue === targetValue ? 0 : 1;
};

const computeSignedLobeDistance = (
  referenceValue: YorkSignedLobeSummary | null,
  targetValue: YorkSignedLobeSummary | null,
  policy: YorkDiagnosticContract["decision_policy"],
): number => {
  if (referenceValue == null && targetValue == null) return 0;
  if (referenceValue == null || targetValue == null) return policy.missing_value_penalty;
  return referenceValue === targetValue ? 0 : 1;
};

const computeReferenceDistance = (args: {
  contract: YorkDiagnosticContract;
  reference: CaseClassificationFeatures;
  target: CaseClassificationFeatures;
}): ReferenceDistanceSummary => {
  const { contract, reference, target } = args;
  const breakdown = emptyDistanceBreakdown(contract.feature_set);
  let weightedSum = 0;
  let weightTotal = 0;
  for (const feature of contract.feature_set) {
    const weight = contract.decision_policy.feature_weights[feature] ?? 1;
    const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
    let componentDistance = contract.decision_policy.missing_value_penalty;
    switch (feature) {
      case "near_zero_theta":
        componentDistance = computeBooleanFeatureDistance(
          reference.near_zero_theta,
          target.near_zero_theta,
          contract.decision_policy,
        );
        break;
      case "signed_lobe_summary":
        componentDistance = computeSignedLobeDistance(
          reference.signed_lobe_summary,
          target.signed_lobe_summary,
          contract.decision_policy,
        );
        break;
      default: {
        const refNumeric = reference[feature] as number | null;
        const targetNumeric = target[feature] as number | null;
        componentDistance = computeNumericFeatureDistance(
          refNumeric,
          targetNumeric,
          contract.decision_policy,
        );
        break;
      }
    }
    const bounded = Math.max(
      0,
      Math.min(componentDistance, contract.decision_policy.max_component_distance),
    );
    breakdown[feature] = bounded;
    weightedSum += bounded * safeWeight;
    weightTotal += safeWeight;
  }
  return {
    distance: weightTotal > 0 ? weightedSum / weightTotal : null,
    breakdown,
  };
};

export const scoreNhm2AgainstReferenceControls = (args: {
  contract: YorkDiagnosticContract;
  alcubierreFeatures: CaseClassificationFeatures;
  natarioFeatures: CaseClassificationFeatures;
  nhm2Features: CaseClassificationFeatures;
}): Nhm2ReferenceScoring => {
  const toAlc = computeReferenceDistance({
    contract: args.contract,
    reference: args.alcubierreFeatures,
    target: args.nhm2Features,
  });
  const toLow = computeReferenceDistance({
    contract: args.contract,
    reference: args.natarioFeatures,
    target: args.nhm2Features,
  });
  const dAlc = toAlc.distance;
  const dLow = toLow.distance;
  const distancesFinite =
    Number.isFinite(dAlc ?? Number.NaN) && Number.isFinite(dLow ?? Number.NaN);
  const winningReference: Nhm2ReferenceScoring["winning_reference"] = !distancesFinite
    ? null
    : (dAlc ?? Number.POSITIVE_INFINITY) <= (dLow ?? Number.POSITIVE_INFINITY)
      ? "alcubierre_control"
      : "natario_control";
  const margin =
    distancesFinite && dAlc != null && dLow != null ? Math.abs(dAlc - dLow) : null;
  const winnerDistance =
    !distancesFinite || winningReference == null
      ? null
      : winningReference === "alcubierre_control"
        ? dAlc
        : dLow;
  const marginSufficient =
    margin != null && margin >= args.contract.decision_policy.reference_margin_min;
  const winningReferenceWithinThreshold =
    winnerDistance != null &&
    winnerDistance <= args.contract.decision_policy.reference_match_threshold;
  const distinctByPolicy = !(
    winningReference != null &&
    marginSufficient &&
    winningReferenceWithinThreshold &&
    winnerDistance != null &&
    winnerDistance <= args.contract.decision_policy.distinctness_threshold
  );
  return {
    distance_to_alcubierre_reference: dAlc,
    distance_to_low_expansion_reference: dLow,
    reference_margin: margin,
    winning_reference: winningReference,
    margin_sufficient: marginSufficient,
    winning_reference_within_threshold: winningReferenceWithinThreshold,
    distinct_by_policy: distinctByPolicy,
    distinctness_threshold: args.contract.decision_policy.distinctness_threshold,
    margin_min: args.contract.decision_policy.reference_margin_min,
    reference_match_threshold: args.contract.decision_policy.reference_match_threshold,
    distance_metric: args.contract.decision_policy.distance_metric,
    normalization_method: args.contract.decision_policy.normalization_method,
    to_alcubierre_breakdown: toAlc.breakdown,
    to_low_expansion_breakdown: toLow.breakdown,
  };
};

const DECISION_VERDICT_ORDER: DecisionVerdict[] = [
  NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE,
  NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE,
  NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY,
  "inconclusive",
];

const createVerdictCountMap = (): Record<DecisionVerdict, number> => ({
  [NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE]: 0,
  [NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE]: 0,
  [NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY]: 0,
  inconclusive: 0,
});

type ContractPolicyPatch = {
  feature_weight_feature: YorkFeatureName | null;
  feature_weight_scale: number | null;
  reference_margin_min: number | null;
  reference_match_threshold: number | null;
  dropped_features: YorkFeatureName[];
};

const buildContractVariant = (
  contract: YorkDiagnosticContract,
  patch: ContractPolicyPatch,
): YorkDiagnosticContract => {
  const dropped = new Set(patch.dropped_features);
  const featureSet = contract.feature_set.filter((feature) => !dropped.has(feature));
  if (featureSet.length === 0) {
    return {
      ...contract,
      feature_set: [...contract.feature_set],
    };
  }

  const weightSource: Record<string, unknown> = {
    ...contract.decision_policy.feature_weights,
  };
  if (
    patch.feature_weight_feature &&
    Number.isFinite(patch.feature_weight_scale ?? Number.NaN) &&
    (patch.feature_weight_scale ?? 0) > 0
  ) {
    const current =
      toFiniteNumber(weightSource[patch.feature_weight_feature]) ?? 1;
    weightSource[patch.feature_weight_feature] =
      current * (patch.feature_weight_scale as number);
  }

  const decisionPolicy = {
    ...contract.decision_policy,
    feature_weights: normalizeFeatureWeights(featureSet, weightSource),
    reference_margin_min:
      patch.reference_margin_min != null
        ? Math.max(patch.reference_margin_min, 0)
        : contract.decision_policy.reference_margin_min,
    reference_match_threshold:
      patch.reference_match_threshold != null
        ? Math.max(patch.reference_match_threshold, 0)
        : contract.decision_policy.reference_match_threshold,
  };

  return {
    ...contract,
    feature_set: featureSet,
    decision_policy: decisionPolicy,
  };
};

const classifyRobustnessStatus = (args: {
  dominantVerdict: DecisionVerdict | null;
  dominantFraction: number;
  stableFractionMin: number;
  marginalFractionMin: number;
}): ClassificationRobustnessStatus => {
  const {
    dominantVerdict,
    dominantFraction,
    stableFractionMin,
    marginalFractionMin,
  } = args;
  if (!dominantVerdict || dominantVerdict === "inconclusive") {
    return "inconclusive";
  }
  if (dominantFraction >= stableFractionMin) {
    if (dominantVerdict === NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE) {
      return "stable_low_expansion_like";
    }
    if (dominantVerdict === NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE) {
      return "stable_alcubierre_like";
    }
    return "stable_distinct";
  }
  if (dominantFraction >= marginalFractionMin) {
    if (dominantVerdict === NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE) {
      return "marginal_low_expansion_like";
    }
    if (dominantVerdict === NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY) {
      return "marginal_distinct";
    }
  }
  return "unstable_multiclass";
};

export const evaluateClassificationRobustness = (args: {
  contract: YorkDiagnosticContract;
  preconditions: ProofPackPreconditions;
  controlsCalibratedByReferences: boolean;
  yorkCongruence: YorkCongruenceEvaluation;
  alcubierreFeatures: CaseClassificationFeatures;
  natarioFeatures: CaseClassificationFeatures;
  nhm2Features: CaseClassificationFeatures;
  baselineVerdict: DecisionVerdict;
  baselineScoring: Nhm2ReferenceScoring;
}): ClassificationRobustnessSummary => {
  const variants: Array<{
    variant_id: string;
    variant_type: RobustnessVariantType;
    policy_patch: ContractPolicyPatch;
  }> = [
    {
      variant_id: "baseline",
      variant_type: "baseline",
      policy_patch: {
        feature_weight_feature: null,
        feature_weight_scale: null,
        reference_margin_min: null,
        reference_match_threshold: null,
        dropped_features: [],
      },
    },
  ];

  if (args.contract.robustness_checks.enabled) {
    const pct = args.contract.robustness_checks.weight_perturbation_pct;
    if (pct > 0) {
      const plusScale = 1 + pct;
      const minusScale = Math.max(1 - pct, 1e-6);
      for (const feature of args.contract.feature_set) {
        variants.push({
          variant_id: `weight:${feature}:plus`,
          variant_type: "weight_perturbation",
          policy_patch: {
            feature_weight_feature: feature,
            feature_weight_scale: plusScale,
            reference_margin_min: null,
            reference_match_threshold: null,
            dropped_features: [],
          },
        });
        variants.push({
          variant_id: `weight:${feature}:minus`,
          variant_type: "weight_perturbation",
          policy_patch: {
            feature_weight_feature: feature,
            feature_weight_scale: minusScale,
            reference_margin_min: null,
            reference_match_threshold: null,
            dropped_features: [],
          },
        });
      }
    }

    for (const margin of args.contract.robustness_checks.margin_variants) {
      if (
        Math.abs(margin - args.contract.decision_policy.reference_margin_min) <=
        1e-12
      ) {
        continue;
      }
      variants.push({
        variant_id: `margin:${margin}`,
        variant_type: "margin_variant",
        policy_patch: {
          feature_weight_feature: null,
          feature_weight_scale: null,
          reference_margin_min: margin,
          reference_match_threshold: null,
          dropped_features: [],
        },
      });
    }

    for (const threshold of args.contract.robustness_checks.threshold_variants) {
      if (
        Math.abs(
          threshold - args.contract.decision_policy.reference_match_threshold,
        ) <= 1e-12
      ) {
        continue;
      }
      variants.push({
        variant_id: `threshold:${threshold}`,
        variant_type: "threshold_variant",
        policy_patch: {
          feature_weight_feature: null,
          feature_weight_scale: null,
          reference_margin_min: null,
          reference_match_threshold: threshold,
          dropped_features: [],
        },
      });
    }

    for (const dropSet of args.contract.robustness_checks.feature_drop_sets) {
      const dropped = dropSet.drop_features.filter((feature) =>
        args.contract.feature_set.includes(feature),
      );
      if (dropped.length === 0) continue;
      variants.push({
        variant_id: `drop:${dropSet.id}`,
        variant_type: "feature_drop",
        policy_patch: {
          feature_weight_feature: null,
          feature_weight_scale: null,
          reference_margin_min: null,
          reference_match_threshold: null,
          dropped_features: dropped,
        },
      });
    }
  }

  const dedupedVariants = Array.from(
    new Map(variants.map((variant) => [variant.variant_id, variant])).values(),
  );
  const variantResults: ClassificationRobustnessVariantResult[] = [];
  for (const variant of dedupedVariants) {
    const scoring =
      variant.variant_id === "baseline"
        ? args.baselineScoring
        : scoreNhm2AgainstReferenceControls({
            contract: buildContractVariant(args.contract, variant.policy_patch),
            alcubierreFeatures: args.alcubierreFeatures,
            natarioFeatures: args.natarioFeatures,
            nhm2Features: args.nhm2Features,
          });
    const verdict =
      variant.variant_id === "baseline"
        ? args.baselineVerdict
        : decideControlFamilyVerdict({
            preconditions: args.preconditions,
            controlsCalibratedByReferences: args.controlsCalibratedByReferences,
            classificationScoring: scoring,
            yorkCongruence: args.yorkCongruence,
          });
    variantResults.push({
      variant_id: variant.variant_id,
      variant_type: variant.variant_type,
      policy_patch: variant.policy_patch,
      scoring,
      verdict,
    });
  }

  const verdictCounts = createVerdictCountMap();
  for (const result of variantResults) {
    verdictCounts[result.verdict] += 1;
  }

  const evaluatedVariants = variantResults.filter(
    (result) => result.verdict !== "inconclusive",
  ).length;
  let dominantVerdict: DecisionVerdict | null = null;
  let dominantCount = 0;
  for (const verdict of DECISION_VERDICT_ORDER) {
    const count = verdictCounts[verdict];
    if (count > dominantCount) {
      dominantCount = count;
      dominantVerdict = verdict;
    }
  }
  const dominantFraction =
    evaluatedVariants > 0 && dominantVerdict
      ? verdictCounts[dominantVerdict] / evaluatedVariants
      : 0;
  const stableFractionMin =
    args.contract.robustness_checks.stability_policy.stable_fraction_min;
  const marginalFractionMin =
    args.contract.robustness_checks.stability_policy.marginal_fraction_min;
  const stabilityStatus =
    !args.preconditions.readyForFamilyVerdict ||
    !args.controlsCalibratedByReferences
      ? "inconclusive"
      : classifyRobustnessStatus({
          dominantVerdict,
          dominantFraction,
          stableFractionMin,
          marginalFractionMin,
        });
  const stableVerdict =
    stabilityStatus.startsWith("stable_") && dominantVerdict
      ? dominantVerdict
      : null;

  return {
    enabled: args.contract.robustness_checks.enabled,
    baselineVerdict: args.baselineVerdict,
    variantResults,
    verdictCounts,
    dominantVerdict,
    dominantFraction,
    stableVerdict,
    stabilityStatus,
    stabilityPolicy: {
      stable_fraction_min: stableFractionMin,
      marginal_fraction_min: marginalFractionMin,
    },
    totalVariants: variantResults.length,
    evaluatedVariants,
  };
};

const buildLaneDecisionTable = (args: {
  laneId: string;
  preconditions: ProofPackPreconditions;
  controlsCalibratedByReferences: boolean;
  classificationScoring: Nhm2ReferenceScoring | null;
  classificationRobustness: ClassificationRobustnessSummary | null;
  yorkCongruence: YorkCongruenceEvaluation;
}): DecisionRow[] => {
  const laneParityClosed =
    args.preconditions.diagnosticParityClosed ?? args.preconditions.laneAParityClosed;
  const laneParityLabel =
    args.laneId === YORK_DIAGNOSTIC_BASELINE_LANE_ID ? "Lane A" : args.laneId;
  const scoring = args.classificationScoring;
  const robustness = args.classificationRobustness;
  const hasDistanceToAlcubierre = Number.isFinite(
    scoring?.distance_to_alcubierre_reference ?? Number.NaN,
  );
  const hasDistanceToLowExpansion = Number.isFinite(
    scoring?.distance_to_low_expansion_reference ?? Number.NaN,
  );

  return [
    {
      id: "preconditions_ready_for_family_verdict",
      condition:
        "Controls independent, required views rendered, provenance hashes present, runtime status provenance present, diagnostic-lane parity computed/closed, and snapshot identity complete",
      status: args.preconditions.readyForFamilyVerdict.toString() as DecisionRowStatus,
      interpretation: args.preconditions.readyForFamilyVerdict
        ? "Evidence integrity prerequisites satisfied."
        : "Evidence prerequisites failed; verdict must remain inconclusive.",
    },
    {
      id: "offline_render_parity_computed",
      condition:
        "Offline-vs-render York parity metrics are computed for all required views",
      status: Boolean(args.preconditions.offlineRenderParityComputed).toString() as DecisionRowStatus,
      interpretation: args.preconditions.offlineRenderParityComputed === true
        ? "Offline/render parity metrics are present."
        : "Offline/render parity metrics are missing for at least one required view.",
    },
    {
      id: "theta_ktrace_parity_computed",
      condition:
        "Offline theta vs -K_trace parity metrics are computed for all required views",
      status: Boolean(args.preconditions.thetaKTraceParityComputed).toString() as DecisionRowStatus,
      interpretation: args.preconditions.thetaKTraceParityComputed === true
        ? "Theta/K-trace parity metrics are present."
        : "Theta/K-trace parity metrics are missing for at least one required view.",
    },
    {
      id: "snapshot_identity_complete",
      condition:
        "Solve->brick->render identity fields are complete and consistent for required views",
      status: Boolean(args.preconditions.snapshotIdentityComplete).toString() as DecisionRowStatus,
      interpretation: args.preconditions.snapshotIdentityComplete === true
        ? "Snapshot identity closure is complete."
        : "Snapshot identity closure failed for at least one required view.",
    },
    {
      id: "diagnostic_parity_closed",
      condition:
        `${laneParityLabel} parity checks pass (render parity + theta_ktrace contract) for required views`,
      status: Boolean(laneParityClosed).toString() as DecisionRowStatus,
      interpretation: laneParityClosed === true
        ? `${laneParityLabel} parity is closed.`
        : `${laneParityLabel} parity failed; family verdict is blocked.`,
    },
    {
      id: "renderer_calibrated_by_controls",
      condition:
        "Controls act as calibration references: Alcubierre strong signed lane + Natario low-expansion lane with stable congruence",
      status:
        (
          args.preconditions.readyForFamilyVerdict &&
          args.controlsCalibratedByReferences
        ).toString() as DecisionRowStatus,
      interpretation:
        args.preconditions.readyForFamilyVerdict && args.controlsCalibratedByReferences
          ? "Control references calibrate this diagnostic lane; NHM2 can be classified relative to them."
          : args.preconditions.readyForFamilyVerdict
            ? "Control calibration failed (congruence mismatch, weak Alcubierre lane, or non-low Natario lane)."
            : "Skipped because preconditions failed.",
    },
    {
      id: "nhm2_distance_to_alcubierre_reference",
      condition:
        "Distance from NHM2 morphology feature vector to Alcubierre reference under the York diagnostic contract",
      status: hasDistanceToAlcubierre.toString() as DecisionRowStatus,
      interpretation: hasDistanceToAlcubierre
        ? `distance=${scoring?.distance_to_alcubierre_reference}`
        : "Distance unavailable (feature set incomplete).",
    },
    {
      id: "nhm2_distance_to_low_expansion_reference",
      condition:
        "Distance from NHM2 morphology feature vector to low-expansion reference under the York diagnostic contract",
      status: hasDistanceToLowExpansion.toString() as DecisionRowStatus,
      interpretation: hasDistanceToLowExpansion
        ? `distance=${scoring?.distance_to_low_expansion_reference}`
        : "Distance unavailable (feature set incomplete).",
    },
    {
      id: "nhm2_reference_margin_sufficient",
      condition:
        "Winning reference distance exceeds configured margin and threshold policy",
      status:
        (
          args.preconditions.readyForFamilyVerdict &&
          args.controlsCalibratedByReferences &&
          scoring?.margin_sufficient === true &&
          scoring?.winning_reference_within_threshold === true
        ).toString() as DecisionRowStatus,
      interpretation:
        args.preconditions.readyForFamilyVerdict && args.controlsCalibratedByReferences
          ? `margin=${scoring?.reference_margin ?? "null"} min=${scoring?.margin_min ?? "null"} threshold=${scoring?.reference_match_threshold ?? "null"}`
          : "Skipped because calibration/preconditions failed.",
    },
    {
      id: "nhm2_distinct_under_current_york_diagnostic",
      condition:
        "Renderer is calibrated and NHM2 has no clear winning reference by configured margin policy",
      status:
        (
          args.preconditions.readyForFamilyVerdict &&
          args.controlsCalibratedByReferences &&
          scoring?.distinct_by_policy === true
        ).toString() as DecisionRowStatus,
      interpretation:
        args.preconditions.readyForFamilyVerdict &&
        args.controlsCalibratedByReferences &&
        scoring?.distinct_by_policy === true
          ? "NHM2 is distinct under this diagnostic-local York classification."
          : args.preconditions.readyForFamilyVerdict
            ? "NHM2 has a clear winning reference under configured distance policy, or calibration is not ready."
            : "Skipped because preconditions failed.",
    },
    {
      id: "classification_robustness_evaluated",
      condition:
        "Classification robustness sweep executed over nearby policy choices defined in the contract",
      status: ((robustness?.variantResults.length ?? 0) > 0).toString() as DecisionRowStatus,
      interpretation: `variants=${robustness?.totalVariants ?? 0} evaluated=${robustness?.evaluatedVariants ?? 0}`,
    },
    {
      id: "nhm2_classification_stable_under_contract_perturbations",
      condition:
        "Current NHM2 family verdict remains dominant across nearby weight/threshold/feature-drop policy variants",
      status: (robustness?.stabilityStatus.startsWith("stable_") ?? false).toString() as DecisionRowStatus,
      interpretation: `status=${robustness?.stabilityStatus ?? "null"} dominant=${robustness?.dominantVerdict ?? "null"} fraction=${robustness?.dominantFraction ?? 0}`,
    },
    {
      id: "nhm2_classification_marginal_under_contract_perturbations",
      condition:
        "Current NHM2 family verdict remains preferred but with weak dominance under nearby policy variants",
      status: (robustness?.stabilityStatus.startsWith("marginal_") ?? false).toString() as DecisionRowStatus,
      interpretation: `status=${robustness?.stabilityStatus ?? "null"} stable_min=${robustness?.stabilityPolicy.stable_fraction_min ?? "null"} marginal_min=${robustness?.stabilityPolicy.marginal_fraction_min ?? "null"}`,
    },
    {
      id: "nhm2_classification_unstable_under_contract_perturbations",
      condition:
        "Current NHM2 family verdict is sensitive to nearby policy choices and does not maintain a dominant class",
      status: (robustness?.stabilityStatus === "unstable_multiclass").toString() as DecisionRowStatus,
      interpretation: `status=${robustness?.stabilityStatus ?? "null"} counts=${robustness ? JSON.stringify(robustness.verdictCounts) : "{}"}`,
    },
    {
      id: "renderer_or_conversion_path_clear",
      condition:
        "Offline-vs-rendered York slice congruence has no hash/remap/suppression/downstream mismatch",
      status:
        (
          !args.yorkCongruence.hashMismatch &&
          !args.yorkCongruence.rhoRemapMismatch &&
          !args.yorkCongruence.nearZeroSuppressionMismatch &&
          !args.yorkCongruence.downstreamRenderMismatch
        ).toString() as DecisionRowStatus,
      interpretation:
        args.yorkCongruence.hashMismatch ||
        args.yorkCongruence.rhoRemapMismatch ||
        args.yorkCongruence.nearZeroSuppressionMismatch ||
        args.yorkCongruence.downstreamRenderMismatch
          ? "Renderer/conversion mismatch remains in this lane."
          : "Renderer/conversion congruence checks pass in this lane.",
    },
  ];
};

const mapGuardFailuresToLaneCauseCode = (
  guardFailures: GuardFailure[],
): SharedLaneCauseCode | null => {
  for (const failure of guardFailures) {
    if (
      failure.code === "proof_pack_required_view_missing" ||
      failure.code === "proof_pack_required_view_render_failed" ||
      failure.code === "proof_pack_required_view_fell_back_to_diagnostic_quad" ||
      failure.code === "proof_pack_required_view_mismatch"
    ) {
      return "missing_required_view";
    }
    if (
      failure.code === "proof_pack_required_view_missing_provenance_hash" ||
      failure.code === "proof_pack_lane_a_parity_missing" ||
      failure.code === "proof_pack_lane_a_offline_render_parity_missing" ||
      failure.code === "proof_pack_lane_a_theta_ktrace_parity_missing"
    ) {
      return "missing_required_hash";
    }
    if (failure.code === "proof_pack_lane_a_snapshot_identity_incomplete") {
      return "snapshot_identity_failure";
    }
    if (
      failure.code === "proof_pack_lane_a_parity_failed" &&
      failure.detail.includes("theta_ktrace_contract_failure")
    ) {
      return "theta_ktrace_contract_failure";
    }
    if (
      failure.code === "proof_pack_lane_a_parity_failed" &&
      failure.detail.includes("render_parity_failure")
    ) {
      return "render_parity_failure";
    }
    if (
      failure.code === "proof_pack_york_slice_hash_mismatch" ||
      failure.code === "proof_pack_york_rho_remap_mismatch" ||
      failure.code === "proof_pack_york_near_zero_suppression_mismatch"
    ) {
      return "render_parity_failure";
    }
  }
  return null;
};

export const resolveLaneACauseCode = (args: {
  guardFailures: GuardFailure[];
  verdict: DecisionVerdict;
  laneId?: string;
}): LaneCauseCode => {
  const guardCause = mapGuardFailuresToLaneCauseCode(args.guardFailures);
  if (guardCause) return guardCause;
  const laneIsAlternate = args.laneId === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID;
  if (args.verdict === "inconclusive") {
    return laneIsAlternate ? "lane_b_family_inconclusive" : "lane_a_family_inconclusive";
  }
  if (args.verdict === NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY) {
    return laneIsAlternate ? "lane_b_family_distinct" : "lane_a_family_distinct";
  }
  return laneIsAlternate ? "lane_b_family_congruent" : "lane_a_family_congruent";
};

const evaluateDiagnosticLane = (args: {
  lane: YorkDiagnosticLane;
  contract: YorkDiagnosticContract;
  yorkViews: HullScientificRenderView[];
  runtimeStatus: ProofPackPayload["provenance"]["runtimeStatus"];
  cases: CaseResult[];
}): LaneProofPackEvaluation => {
  const alc = args.cases.find((entry) => entry.caseId === "alcubierre_control") ?? null;
  const nat = args.cases.find((entry) => entry.caseId === "natario_control") ?? null;
  const nhm2 = args.cases.find((entry) => entry.caseId === "nhm2_certified") ?? null;

  const fallbackPreconditions: ProofPackPreconditions = {
    controlsIndependent: false,
    allRequiredViewsRendered: false,
    provenanceHashesPresent: false,
    runtimeStatusProvenancePresent: false,
    offlineRenderParityComputed: false,
    thetaKTraceParityComputed: false,
    snapshotIdentityComplete: false,
    diagnosticParityClosed: false,
    laneAParityClosed: false,
    readyForFamilyVerdict: false,
  };
  if (!alc || !nat || !nhm2) {
    const guardFailures: GuardFailure[] = [
      {
        code: "proof_pack_lane_missing_required_cases",
        detail: `${args.lane.lane_id}:required=alcubierre_control,natario_control,nhm2_certified`,
      },
    ];
    return {
      lane_id: args.lane.lane_id,
      active: args.lane.active,
      supported: args.lane.supported,
      unsupported_reason: args.lane.unsupported_reason,
      observer: args.lane.observer,
      observer_definition_id: args.lane.observer_definition_id,
      observer_inputs_required: [...args.lane.observer_inputs_required],
      observer_construction_inputs: [...args.lane.observer_construction_inputs],
      observer_construction_formula: args.lane.observer_construction_formula,
      observer_normalized: args.lane.observer_normalized,
      observer_approximation: args.lane.observer_approximation,
      lane_semantic_mode: args.lane.lane_semantic_mode,
      foliation: args.lane.foliation,
      theta_definition: args.lane.theta_definition,
      kij_sign_convention: args.lane.kij_sign_convention,
      requires_gamma_metric: args.lane.requires_gamma_metric,
      semantics_closed: args.lane.semantics_closed,
      cross_lane_claim_ready: args.lane.cross_lane_claim_ready,
      cross_lane_claim_block_reason: args.lane.cross_lane_claim_block_reason,
      classification_scope: args.lane.classification_scope,
      cases: args.cases,
      controlDebug: buildControlDebug(args.cases),
      preconditions: fallbackPreconditions,
      controlsCalibratedByReferences: false,
      laneReadiness: {
        laneBSemanticsClosed: false,
        laneBObserverDefined: false,
        laneBTensorInputsPresent: false,
        laneBGeometryReady: false,
        laneBControlsCalibrated: false,
        laneBParityClosed: false,
        laneBCrossLaneClaimReady: false,
        readyForCrossLaneComparison: false,
      },
      laneAParity: {
        status: "failed",
        causeCode: "missing_required_view",
        caseSummaries: [],
      },
      causeCode: "missing_required_view",
      guardFailures,
      decisionTable: [],
      classificationScoring: null,
      classificationRobustness: null,
      verdict: "inconclusive",
      notes: [`lane ${args.lane.lane_id} missing required case outputs`],
    };
  }

  const { preconditions, guardFailures } = evaluateProofPackPreconditions({
    yorkViews: args.yorkViews,
    cases: args.cases,
    runtimeStatus: args.runtimeStatus,
  });
  const laneAParity = summarizeLaneAParity(args.cases);
  const yorkCongruence = evaluateYorkSliceCongruence(args.cases);
  guardFailures.push(...yorkCongruence.guardFailures);

  const alcStrong = hasStrongForeAftYork(alc.primaryYork);
  const alcSignalSufficient = hasSufficientSignalForAlcubierreControl(alc);
  const natLow = isLowExpansion(nat.primaryYork);
  const congruenceCalibrationFailed =
    yorkCongruence.hashMismatch ||
    yorkCongruence.rhoRemapMismatch ||
    yorkCongruence.nearZeroSuppressionMismatch ||
    yorkCongruence.downstreamRenderMismatch;
  const controlsCalibratedByReferences =
    preconditions.readyForFamilyVerdict &&
    !congruenceCalibrationFailed &&
    alcSignalSufficient &&
    alcStrong &&
    natLow;
  const laneIsAlternate =
    args.lane.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID;
  const normalizeObserverInputs = (values: string[] | null | undefined): string[] =>
    Array.from(
      new Set(
        (values ?? [])
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0),
      ),
    ).sort();
  const laneObserverInputsRequired = normalizeObserverInputs(
    args.lane.observer_inputs_required,
  );
  const laneObserverConstructionInputs = normalizeObserverInputs(
    args.lane.observer_construction_inputs,
  );
  const laneBObserverMetadataConsistent =
    !laneIsAlternate ||
    args.cases.every((entry) => {
      const computation = entry.snapshotMetrics?.laneComputation;
      if (computation == null) return false;
      const computationObserverInputsRequired = normalizeObserverInputs(
        computation.observer_inputs_required,
      );
      const observerInputsRequiredMatch =
        computationObserverInputsRequired.length === laneObserverInputsRequired.length &&
        computationObserverInputsRequired.every(
          (value, index) => value === laneObserverInputsRequired[index],
        );
      const computationObserverConstructionInputs = normalizeObserverInputs(
        computation.observer_construction_inputs,
      );
      const observerConstructionInputsMatch =
        computationObserverConstructionInputs.length ===
          laneObserverConstructionInputs.length &&
        computationObserverConstructionInputs.every(
          (value, index) => value === laneObserverConstructionInputs[index],
        );
      const computationObserverApproximation = computation.observer_approximation ?? null;
      const laneObserverApproximation = args.lane.observer_approximation ?? null;
      return (
        computation.observer_definition_id === args.lane.observer_definition_id &&
        computation.observer_construction_formula ===
          args.lane.observer_construction_formula &&
        computation.observer_normalized === args.lane.observer_normalized &&
        computationObserverApproximation === laneObserverApproximation &&
        observerInputsRequiredMatch &&
        observerConstructionInputsMatch &&
        computation.lane_b_semantic_mode === args.lane.lane_semantic_mode
      );
    });
  const laneBObserverDefined =
    !laneIsAlternate ||
    (!!args.lane.observer_definition_id &&
      !!args.lane.observer_construction_formula &&
      args.lane.observer_inputs_required.length > 0 &&
      args.lane.observer_construction_inputs.length > 0 &&
      laneBObserverMetadataConsistent);
  const laneBTensorInputsPresent =
    !laneIsAlternate ||
    args.cases.every((entry) => {
      const computation = entry.snapshotMetrics?.laneComputation;
      return (
        computation != null &&
        computation.observer_inputs_present === true &&
        typeof computation.lane_b_tensor_inputs_hash === "string" &&
        computation.lane_b_tensor_inputs_hash.trim().length > 0
      );
    });
  const laneBGeometryReady =
    !laneIsAlternate ||
    args.cases.every(
      (entry) => entry.snapshotMetrics?.laneComputation?.lane_b_geometry_ready === true,
    );
  const laneBSemanticsClosed =
    !laneIsAlternate ||
    (args.lane.semantics_closed === true &&
      args.cases.every(
        (entry) =>
          entry.snapshotMetrics?.laneComputation?.lane_b_semantics_closed === true,
      ));
  const laneBControlsCalibrated =
    !laneIsAlternate || controlsCalibratedByReferences;
  const laneParityClosed =
    preconditions.diagnosticParityClosed ?? (preconditions.laneAParityClosed === true);
  const laneBParityClosed =
    !laneIsAlternate || laneParityClosed;
  const laneBCrossLaneClaimReady =
    !laneIsAlternate ||
    (args.lane.cross_lane_claim_ready === true &&
      args.cases.every(
        (entry) => entry.snapshotMetrics?.laneComputation?.cross_lane_claim_ready === true,
      ));
  const laneReadiness = {
    laneBSemanticsClosed,
    laneBObserverDefined,
    laneBTensorInputsPresent,
    laneBGeometryReady,
    laneBControlsCalibrated,
    laneBParityClosed,
    laneBCrossLaneClaimReady,
    readyForCrossLaneComparison:
      args.lane.supported &&
      preconditions.readyForFamilyVerdict &&
      controlsCalibratedByReferences &&
      laneParityClosed &&
      laneBSemanticsClosed &&
      laneBObserverDefined &&
      laneBTensorInputsPresent &&
      laneBGeometryReady &&
      laneBCrossLaneClaimReady,
  };

  const classificationScoring = scoreNhm2AgainstReferenceControls({
    contract: args.contract,
    alcubierreFeatures: alc.classificationFeatures,
    natarioFeatures: nat.classificationFeatures,
    nhm2Features: nhm2.classificationFeatures,
  });
  const verdict = decideControlFamilyVerdict({
    preconditions,
    controlsCalibratedByReferences,
    classificationScoring,
    yorkCongruence,
  });
  const classificationRobustness = evaluateClassificationRobustness({
    contract: args.contract,
    preconditions,
    controlsCalibratedByReferences,
    yorkCongruence,
    alcubierreFeatures: alc.classificationFeatures,
    natarioFeatures: nat.classificationFeatures,
    nhm2Features: nhm2.classificationFeatures,
    baselineVerdict: verdict,
    baselineScoring: classificationScoring,
  });
  const decisionTable = buildLaneDecisionTable({
    laneId: args.lane.lane_id,
    preconditions,
    controlsCalibratedByReferences,
    classificationScoring,
    classificationRobustness,
    yorkCongruence,
  });
  const causeCode = resolveLaneACauseCode({
    guardFailures,
    verdict,
    laneId: args.lane.lane_id,
  });

  const notes: string[] = [];
  notes.push(
    "Controls are calibration references in this proof-pack; NHM2 classification is diagnostic-local and not a full theory identity claim.",
  );
  notes.push(
    `lane=${args.lane.lane_id} observer=${args.lane.observer} foliation=${args.lane.foliation} theta_definition=${args.lane.theta_definition}`,
  );
  if (!preconditions.readyForFamilyVerdict) {
    notes.push("Family verdict forced to inconclusive because proof-pack preconditions are not satisfied.");
  }
  if (guardFailures.length > 0) {
    notes.push(
      `Guard failures: ${guardFailures.map((entry) => `${entry.code}:${entry.detail}`).join("; ")}`,
    );
  }
  if (controlsCalibratedByReferences) {
    notes.push("Control behavior is separated: Alcubierre-like strong signed lane vs Natario-like near-zero lane.");
  }
  if (!controlsCalibratedByReferences && preconditions.readyForFamilyVerdict) {
    notes.push("Renderer calibration is not established by controls for this run; verdict remains inconclusive by contract.");
  }
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE) {
    notes.push("NHM2 primary York behavior aligns with low-expansion Natario-like control in this run.");
  }
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE) {
    notes.push("NHM2 primary York behavior aligns with the Alcubierre-like calibration reference in this run.");
  }
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY) {
    notes.push("NHM2 is classified as distinct under the current York diagnostic lane after control calibration.");
  }
  notes.push(
    `Robustness status=${classificationRobustness.stabilityStatus} dominant=${classificationRobustness.dominantVerdict ?? "null"} fraction=${classificationRobustness.dominantFraction}.`,
  );
  notes.push(
    `${args.lane.lane_id} parity status=${laneAParity.status} cause=${laneAParity.causeCode ?? "null"}.`,
  );
  if (laneIsAlternate && !laneReadiness.readyForCrossLaneComparison) {
    notes.push(
      `lane_b_cross_lane_readiness=false semantics_closed=${laneReadiness.laneBSemanticsClosed} observer_defined=${laneReadiness.laneBObserverDefined} tensor_inputs_present=${laneReadiness.laneBTensorInputsPresent} geometry_ready=${laneReadiness.laneBGeometryReady} controls_calibrated=${laneReadiness.laneBControlsCalibrated} parity_closed=${laneReadiness.laneBParityClosed} claim_ready=${laneReadiness.laneBCrossLaneClaimReady}`,
    );
    if (args.lane.cross_lane_claim_block_reason) {
      notes.push(`lane_b_block_reason=${args.lane.cross_lane_claim_block_reason}`);
    }
  }
  notes.push(
    "Support-overlap parity deltas are currently advisory diagnostics and do not gate Lane A pass/fail.",
  );
  notes.push(formatLaneCauseCodeNote(args.lane.lane_id, causeCode));

  return {
    lane_id: args.lane.lane_id,
    active: args.lane.active,
    supported: args.lane.supported,
    unsupported_reason: args.lane.unsupported_reason,
    observer: args.lane.observer,
    observer_definition_id: args.lane.observer_definition_id,
    observer_inputs_required: [...args.lane.observer_inputs_required],
    observer_construction_inputs: [...args.lane.observer_construction_inputs],
    observer_construction_formula: args.lane.observer_construction_formula,
    observer_normalized: args.lane.observer_normalized,
    observer_approximation: args.lane.observer_approximation,
    lane_semantic_mode: args.lane.lane_semantic_mode,
    foliation: args.lane.foliation,
    theta_definition: args.lane.theta_definition,
    kij_sign_convention: args.lane.kij_sign_convention,
    requires_gamma_metric: args.lane.requires_gamma_metric,
    semantics_closed: args.lane.semantics_closed,
    cross_lane_claim_ready: args.lane.cross_lane_claim_ready,
    cross_lane_claim_block_reason: args.lane.cross_lane_claim_block_reason,
    classification_scope: args.lane.classification_scope,
    cases: args.cases,
    controlDebug: buildControlDebug(args.cases),
    preconditions,
    controlsCalibratedByReferences,
    laneReadiness,
    laneAParity,
    causeCode,
    guardFailures,
    decisionTable,
    classificationScoring,
    classificationRobustness,
    verdict,
    notes,
  };
};

const buildUnsupportedLaneEvaluation = (lane: YorkDiagnosticLane): LaneProofPackEvaluation => {
  const preconditions: ProofPackPreconditions = {
    controlsIndependent: false,
    allRequiredViewsRendered: false,
    provenanceHashesPresent: false,
    runtimeStatusProvenancePresent: false,
    offlineRenderParityComputed: false,
    thetaKTraceParityComputed: false,
    snapshotIdentityComplete: false,
    diagnosticParityClosed: false,
    laneAParityClosed: false,
    readyForFamilyVerdict: false,
  };
  const unsupportedReason =
    lane.unsupported_reason ??
    "lane declared unsupported in contract and intentionally not executed";
  const guardFailures: GuardFailure[] = [
    {
      code: "proof_pack_lane_unsupported",
      detail: `${lane.lane_id}:${unsupportedReason}`,
    },
  ];
  return {
    lane_id: lane.lane_id,
    active: lane.active,
    supported: false,
    unsupported_reason: unsupportedReason,
    observer: lane.observer,
    observer_definition_id: lane.observer_definition_id,
    observer_inputs_required: [...lane.observer_inputs_required],
    observer_construction_inputs: [...lane.observer_construction_inputs],
    observer_construction_formula: lane.observer_construction_formula,
    observer_normalized: lane.observer_normalized,
    observer_approximation: lane.observer_approximation,
    lane_semantic_mode: lane.lane_semantic_mode,
    foliation: lane.foliation,
    theta_definition: lane.theta_definition,
    kij_sign_convention: lane.kij_sign_convention,
    requires_gamma_metric: lane.requires_gamma_metric,
    semantics_closed: lane.semantics_closed,
    cross_lane_claim_ready: lane.cross_lane_claim_ready,
    cross_lane_claim_block_reason: lane.cross_lane_claim_block_reason,
    classification_scope: lane.classification_scope,
    cases: [],
    controlDebug: [],
    preconditions,
    controlsCalibratedByReferences: false,
    laneReadiness: {
      laneBSemanticsClosed: false,
      laneBObserverDefined: false,
      laneBTensorInputsPresent: false,
      laneBGeometryReady: false,
      laneBControlsCalibrated: false,
      laneBParityClosed: false,
      laneBCrossLaneClaimReady: false,
      readyForCrossLaneComparison: false,
    },
    laneAParity: {
      status: "failed",
      causeCode: resolveLaneACauseCode({
        guardFailures,
        verdict: "inconclusive",
        laneId: lane.lane_id,
      }),
      caseSummaries: [],
    },
    causeCode: resolveLaneACauseCode({
      guardFailures,
      verdict: "inconclusive",
      laneId: lane.lane_id,
    }),
    guardFailures,
    decisionTable: [
      {
        id: "lane_supported",
        condition: "diagnostic lane is declared supported and executable",
        status: "false",
        interpretation: unsupportedReason,
      },
    ],
    classificationScoring: null,
    classificationRobustness: null,
    verdict: "inconclusive",
    notes: [
      `lane ${lane.lane_id} is unsupported: ${unsupportedReason}`,
      "No frame computation was executed for this lane to avoid fake cross-frame claims.",
    ],
  };
};

const mapStableStatusFromVerdict = (
  verdict: DecisionVerdict | null,
): CrossLaneComparisonStatus => {
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE) {
    return "lane_stable_low_expansion_like";
  }
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE) {
    return "lane_stable_alcubierre_like";
  }
  if (verdict === NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY) {
    return "lane_stable_distinct";
  }
  return "lane_comparison_inconclusive";
};

const compareLaneVerdictPair = (
  baselineVerdict: DecisionVerdict,
  alternateVerdict: DecisionVerdict,
): CrossLaneComparisonStatus => {
  const pair = new Set([baselineVerdict, alternateVerdict]);
  if (
    pair.has(NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE) &&
    pair.has(NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY)
  ) {
    return "lane_dependent_between_low_and_distinct";
  }
  if (
    pair.has(NHM2_DIAGNOSTIC_OUTCOME.LOW_EXPANSION_LIKE) &&
    pair.has(NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE)
  ) {
    return "lane_dependent_between_low_and_alcubierre";
  }
  if (
    pair.has(NHM2_DIAGNOSTIC_OUTCOME.ALCUBIERRE_LIKE) &&
    pair.has(NHM2_DIAGNOSTIC_OUTCOME.DISTINCT_NHM2_FAMILY)
  ) {
    return "lane_dependent_between_alcubierre_and_distinct";
  }
  return "lane_comparison_inconclusive";
};

const laneDefaultInconclusiveCauseCode = (laneId: string): LaneCauseCode =>
  laneId === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID
    ? "lane_b_family_inconclusive"
    : "lane_a_family_inconclusive";

const laneRoleLabel = (laneId: string): string => {
  if (laneId === YORK_DIAGNOSTIC_BASELINE_LANE_ID) return "Baseline lane";
  if (laneId === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID) return "Alternate lane";
  return `Lane ${laneId}`;
};

export const formatLaneCauseCodeNote = (
  laneId: string,
  causeCode: LaneCauseCode,
): string => `${laneRoleLabel(laneId)} cause code=${causeCode}.`;

export const buildCrossLaneComparison = (args: {
  baseline: LaneProofPackEvaluation | null;
  alternate: LaneProofPackEvaluation | null;
  baselineLaneId: string | null;
  alternateLaneId: string | null;
}): CrossLaneComparison => {
  const baseline = args.baseline;
  const alternate = args.alternate;
  const baselineSupported = !!baseline?.supported;
  const alternateSupported = !!alternate?.supported;
  const baselineCalibrated =
    !!baseline?.preconditions.readyForFamilyVerdict &&
    baseline?.controlsCalibratedByReferences === true;
  const alternateCalibrated =
    !!alternate?.preconditions.readyForFamilyVerdict &&
    alternate?.controlsCalibratedByReferences === true;
  const laneB =
    baseline?.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID
      ? baseline
      : alternate?.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID
        ? alternate
        : null;
  const laneBDeclaredSemanticsClosed =
    laneB == null ? true : laneB.semantics_closed === true;
  const laneBDeclaredObserverDefined =
    laneB == null
      ? true
      : !!laneB.observer_definition_id && !!laneB.observer_construction_formula;
  const laneBDeclaredCrossLaneClaimReady =
    laneB == null ? true : laneB.cross_lane_claim_ready === true;
  const laneBSemanticsClosed =
    laneB == null
      ? true
      : laneBDeclaredSemanticsClosed &&
        laneB.laneReadiness?.laneBSemanticsClosed === true;
  const laneBObserverDefined =
    laneB == null
      ? true
      : laneBDeclaredObserverDefined &&
        laneB.laneReadiness?.laneBObserverDefined === true;
  const laneBTensorInputsPresent =
    laneB == null ? true : laneB.laneReadiness?.laneBTensorInputsPresent === true;
  const laneBGeometryReady =
    laneB == null ? true : laneB.laneReadiness?.laneBGeometryReady === true;
  const laneBControlsCalibrated =
    laneB == null
      ? true
      : laneB.controlsCalibratedByReferences === true &&
        laneB.laneReadiness?.laneBControlsCalibrated === true;
  const laneBParityClosed =
    laneB == null ? true : laneB.laneReadiness?.laneBParityClosed === true;
  const laneBCrossLaneClaimReady =
    laneB == null
      ? true
      : laneBDeclaredCrossLaneClaimReady &&
        laneB.laneReadiness?.laneBCrossLaneClaimReady === true;

  const baselineVerdict = baseline?.verdict ?? null;
  const alternateVerdict = alternate?.verdict ?? null;
  const sameClassification =
    baselineVerdict != null &&
    alternateVerdict != null &&
    baselineVerdict === alternateVerdict &&
    baselineVerdict !== "inconclusive";

  let crossLaneStatus: CrossLaneComparisonStatus = "lane_comparison_inconclusive";
  const notes: string[] = [];

  if (!baseline || !alternate) {
    notes.push("Missing baseline or alternate lane evaluation.");
  } else if (!baselineSupported || !alternateSupported) {
    notes.push("At least one lane is unsupported; cross-lane comparison remains inconclusive.");
  } else if (
    !laneBSemanticsClosed ||
    !laneBObserverDefined ||
    !laneBTensorInputsPresent ||
    !laneBGeometryReady ||
    !laneBControlsCalibrated ||
    !laneBParityClosed ||
    !laneBCrossLaneClaimReady
  ) {
    notes.push(
      `Lane B readiness gate not satisfied: semantics_closed=${laneBSemanticsClosed} observer_defined=${laneBObserverDefined} tensor_inputs_present=${laneBTensorInputsPresent} geometry_ready=${laneBGeometryReady} controls_calibrated=${laneBControlsCalibrated} parity_closed=${laneBParityClosed} claim_ready=${laneBCrossLaneClaimReady}.`,
    );
    if (laneB?.cross_lane_claim_block_reason) {
      notes.push(`Lane B block reason: ${laneB.cross_lane_claim_block_reason}`);
    }
  } else if (!baselineCalibrated || !alternateCalibrated) {
    notes.push("At least one lane failed control calibration; cross-lane verdict comparison is blocked.");
  } else if (baselineVerdict === "inconclusive" || alternateVerdict === "inconclusive") {
    notes.push("At least one lane verdict is inconclusive under current preconditions.");
  } else if (sameClassification) {
    crossLaneStatus = mapStableStatusFromVerdict(baselineVerdict);
    notes.push("Both lanes calibrate and agree on NHM2 classification.");
  } else {
    crossLaneStatus = compareLaneVerdictPair(baselineVerdict, alternateVerdict);
    notes.push("Both lanes calibrate but disagree on NHM2 classification (lane dependence under current diagnostics).");
  }

  return {
    baseline_lane_id: args.baselineLaneId,
    alternate_lane_id: args.alternateLaneId,
    baseline_verdict: baselineVerdict,
    alternate_verdict: alternateVerdict,
    same_classification: sameClassification,
    cross_lane_status: crossLaneStatus,
    falsifiers: {
      baseline_controls_calibrated: baselineCalibrated,
      alternate_controls_calibrated: alternateCalibrated,
      baseline_supported: baselineSupported,
      alternate_supported: alternateSupported,
      lane_b_semantics_closed: laneBSemanticsClosed,
      lane_b_observer_defined: laneBObserverDefined,
      lane_b_tensor_inputs_present: laneBTensorInputsPresent,
      lane_b_geometry_ready: laneBGeometryReady,
      lane_b_controls_calibrated: laneBControlsCalibrated,
      lane_b_parity_closed: laneBParityClosed,
      lane_b_cross_lane_claim_ready: laneBCrossLaneClaimReady,
    },
    notes,
  };
};

export const renderMarkdown = (payload: ProofPackPayload): string => {
  const laneRowsSummary = payload.diagnosticLanes
    .map(
      (lane) =>
        `| ${lane.lane_id} | ${lane.active} | ${lane.supported} | ${lane.observer} | ${lane.foliation} | ${lane.theta_definition} | ${lane.kij_sign_convention} | ${lane.semantics_closed ?? false} | ${lane.cross_lane_claim_ready ?? false} | ${lane.laneReadiness?.readyForCrossLaneComparison ?? false} | ${lane.preconditions.readyForFamilyVerdict} | ${lane.controlsCalibratedByReferences} | ${lane.verdict} | ${lane.causeCode ?? laneDefaultInconclusiveCauseCode(lane.lane_id)} |`,
    )
    .join("\n");
  const laneGuardRows = payload.diagnosticLanes
    .flatMap((lane) =>
      lane.guardFailures.map(
        (failure) =>
          `| ${lane.lane_id} | ${failure.code} | ${failure.detail} |`,
      ),
    )
    .join("\n");
  const crossLaneRows = [
    `| baseline_lane_id | ${payload.crossLaneComparison.baseline_lane_id ?? "null"} |`,
    `| alternate_lane_id | ${payload.crossLaneComparison.alternate_lane_id ?? "null"} |`,
    `| baseline_verdict | ${payload.crossLaneComparison.baseline_verdict ?? "null"} |`,
    `| alternate_verdict | ${payload.crossLaneComparison.alternate_verdict ?? "null"} |`,
    `| same_classification | ${payload.crossLaneComparison.same_classification} |`,
    `| cross_lane_status | ${payload.crossLaneComparison.cross_lane_status} |`,
    `| baseline_controls_calibrated | ${payload.crossLaneComparison.falsifiers.baseline_controls_calibrated} |`,
    `| alternate_controls_calibrated | ${payload.crossLaneComparison.falsifiers.alternate_controls_calibrated} |`,
    `| baseline_supported | ${payload.crossLaneComparison.falsifiers.baseline_supported} |`,
    `| alternate_supported | ${payload.crossLaneComparison.falsifiers.alternate_supported} |`,
    `| lane_b_semantics_closed | ${payload.crossLaneComparison.falsifiers.lane_b_semantics_closed} |`,
    `| lane_b_observer_defined | ${payload.crossLaneComparison.falsifiers.lane_b_observer_defined} |`,
    `| lane_b_tensor_inputs_present | ${payload.crossLaneComparison.falsifiers.lane_b_tensor_inputs_present} |`,
    `| lane_b_geometry_ready | ${payload.crossLaneComparison.falsifiers.lane_b_geometry_ready} |`,
    `| lane_b_controls_calibrated | ${payload.crossLaneComparison.falsifiers.lane_b_controls_calibrated} |`,
    `| lane_b_parity_closed | ${payload.crossLaneComparison.falsifiers.lane_b_parity_closed} |`,
    `| lane_b_cross_lane_claim_ready | ${payload.crossLaneComparison.falsifiers.lane_b_cross_lane_claim_ready} |`,
  ].join("\n");
  const crossLaneNotes = payload.crossLaneComparison.notes.length
    ? payload.crossLaneComparison.notes.map((entry) => `- ${entry}`).join("\n")
    : "- none";
  const baselineLaneForSummary =
    payload.diagnosticLanes.find(
      (lane) => lane.lane_id === (payload.crossLaneComparison.baseline_lane_id ?? ""),
    ) ??
    payload.diagnosticLanes.find(
      (lane) => lane.lane_id === payload.diagnosticContract.baseline_lane_id,
    ) ??
    payload.diagnosticLanes[0] ??
    null;
  const alternateLaneForSummary =
    payload.crossLaneComparison.alternate_lane_id == null
      ? null
      : payload.diagnosticLanes.find(
          (lane) => lane.lane_id === payload.crossLaneComparison.alternate_lane_id,
        ) ?? null;
  const baselineCauseCode =
    baselineLaneForSummary?.causeCode ??
    (baselineLaneForSummary
      ? laneDefaultInconclusiveCauseCode(baselineLaneForSummary.lane_id)
      : "lane_a_family_inconclusive");
  const alternateCauseCode =
    alternateLaneForSummary?.causeCode ??
    (alternateLaneForSummary
      ? laneDefaultInconclusiveCauseCode(alternateLaneForSummary.lane_id)
      : "null");
  const baselineParityStatus =
    baselineLaneForSummary?.laneAParity?.status ??
    payload.laneAParity?.status ??
    "failed";
  const baselineParityCause =
    baselineLaneForSummary?.laneAParity?.causeCode ??
    payload.laneAParity?.causeCode ??
    "null";
  const primaryViewLabel = payload.cases[0]?.primaryYork.view ?? "n/a";
  const laneRows = payload.cases
    .flatMap((entry) =>
      entry.perView.flatMap((view) =>
        view.laneResults.map(
          (laneResult) =>
            `| ${entry.caseId} | ${view.view} | ${laneResult.lane} | ${laneResult.endpoint} | ${laneResult.ok} | ${laneResult.httpStatus ?? "null"} | ${laneResult.errorCode ?? "null"} | ${laneResult.responseMessage ?? "null"} | ${laneResult.preflightBranch ?? "null"} | ${laneResult.preflightRequirement ?? "null"} |`,
        ),
      ),
    )
    .join("\n");
  const controlRows = payload.controlDebug
    .map(
      (entry) =>
        `| ${entry.caseId} | ${entry.requestUrl ?? "null"} | ${entry.requestSelectors.metricT00Ref ?? "null"} | ${entry.requestSelectors.metricT00Source ?? "null"} | ${entry.requestSelectors.requireCongruentSolve} | ${entry.requestSelectors.requireNhm2CongruentFullSolve} | ${entry.requestSelectors.warpFieldType ?? "null"} | ${entry.requestMetricRefHash ?? "null"} | ${entry.resolvedMetricRefHash ?? "null"} | ${entry.thetaHash ?? "null"} | ${entry.kTraceHash ?? "null"} | ${entry.brickSource ?? "null"} | ${entry.chart ?? "null"} | ${entry.family_id ?? "null"} | ${entry.metricT00Ref ?? "null"} | ${entry.warpFieldType ?? "null"} | ${entry.source_branch ?? "null"} | ${entry.shape_function_id ?? "null"} |`,
    )
    .join("\n");
  const viewRows = payload.cases
    .flatMap((entry) =>
      entry.perView.map((view) => {
        const thetaK = entry.snapshotMetrics?.thetaPlusKTrace;
        return `| ${entry.caseId} | ${view.view} | ${view.ok} | ${view.rawExtrema.min ?? "null"} | ${view.rawExtrema.max ?? "null"} | ${view.rawExtrema.absMax ?? "null"} | ${view.displayExtrema.min ?? "null"} | ${view.displayExtrema.max ?? "null"} | ${view.displayExtrema.absMax ?? "null"} | ${view.render.coordinate_mode ?? "null"} | ${view.samplingChoice ?? "null"} | ${view.supportOverlapPct ?? "null"} | ${thetaK?.maxAbs ?? "null"} | ${thetaK?.rms ?? "null"} | ${thetaK?.consistent ?? "null"} | ${view.hashes.theta_channel_hash ?? "null"} | ${view.hashes.slice_array_hash ?? "null"} | ${view.hashes.normalized_slice_hash ?? "null"} | ${view.hashes.support_mask_slice_hash ?? "null"} | ${view.hashes.shell_masked_slice_hash ?? "null"} |`;
      }),
    )
    .join("\n");

  const caseRows = payload.cases
    .map((entry) => {
      const raw = entry.primaryYork.rawExtrema;
      const display = entry.primaryYork.displayExtrema;
      const thetaK = entry.snapshotMetrics?.thetaPlusKTrace;
      return `| ${entry.caseId} | ${entry.familyExpectation} | ${raw?.min ?? "null"} | ${raw?.max ?? "null"} | ${raw?.absMax ?? "null"} | ${display?.min ?? "null"} | ${display?.max ?? "null"} | ${display?.absMax ?? "null"} | ${entry.primaryYork.coordinateMode ?? "null"} | ${entry.primaryYork.samplingChoice ?? "null"} | ${entry.primaryYork.supportOverlapPct ?? "null"} | ${thetaK?.maxAbs ?? "null"} | ${thetaK?.rms ?? "null"} | ${thetaK?.consistent ?? "null"} |`;
    })
    .join("\n");
  const classificationFeatureRows = payload.cases
    .map((entry) => {
      const features = entry.classificationFeatures;
      return `| ${entry.caseId} | ${features.theta_abs_max_raw ?? "null"} | ${features.theta_abs_max_display ?? "null"} | ${features.positive_count_xz ?? "null"} | ${features.negative_count_xz ?? "null"} | ${features.positive_count_xrho ?? "null"} | ${features.negative_count_xrho ?? "null"} | ${features.support_overlap_pct ?? "null"} | ${features.near_zero_theta ?? "null"} | ${features.signed_lobe_summary ?? "null"} | ${features.shell_map_activity ?? "null"} |`;
    })
    .join("\n");
  const scoring = payload.classificationScoring;
  const scoringRows = scoring
    ? `| distance_to_alcubierre_reference | ${scoring.distance_to_alcubierre_reference ?? "null"} |\n| distance_to_low_expansion_reference | ${scoring.distance_to_low_expansion_reference ?? "null"} |\n| reference_margin | ${scoring.reference_margin ?? "null"} |\n| winning_reference | ${scoring.winning_reference ?? "null"} |\n| margin_sufficient | ${scoring.margin_sufficient} |\n| winning_reference_within_threshold | ${scoring.winning_reference_within_threshold} |\n| distinct_by_policy | ${scoring.distinct_by_policy} |\n| margin_min | ${scoring.margin_min} |\n| reference_match_threshold | ${scoring.reference_match_threshold} |\n| distinctness_threshold | ${scoring.distinctness_threshold} |\n| distance_metric | ${scoring.distance_metric} |\n| normalization_method | ${scoring.normalization_method} |`
    : "| unavailable | unavailable |";
  const robustness = payload.classificationRobustness;
  const robustnessSummaryRows = robustness
    ? `| baselineVerdict | ${robustness.baselineVerdict} |\n| stabilityStatus | ${robustness.stabilityStatus} |\n| dominantVerdict | ${robustness.dominantVerdict ?? "null"} |\n| dominantFraction | ${robustness.dominantFraction} |\n| stableVerdict | ${robustness.stableVerdict ?? "null"} |\n| totalVariants | ${robustness.totalVariants} |\n| evaluatedVariants | ${robustness.evaluatedVariants} |\n| stable_fraction_min | ${robustness.stabilityPolicy.stable_fraction_min} |\n| marginal_fraction_min | ${robustness.stabilityPolicy.marginal_fraction_min} |\n| count_nhm2_alcubierre_like_family | ${robustness.verdictCounts.nhm2_alcubierre_like_family} |\n| count_nhm2_low_expansion_family | ${robustness.verdictCounts.nhm2_low_expansion_family} |\n| count_nhm2_distinct_family | ${robustness.verdictCounts.nhm2_distinct_family} |\n| count_inconclusive | ${robustness.verdictCounts.inconclusive} |`
    : "| unavailable | unavailable |";
  const robustnessVariantRows = robustness
    ? robustness.variantResults
        .map(
          (variant) =>
            `| ${variant.variant_id} | ${variant.variant_type} | ${variant.policy_patch.feature_weight_feature ?? "null"} | ${variant.policy_patch.feature_weight_scale ?? "null"} | ${variant.policy_patch.reference_margin_min ?? "null"} | ${variant.policy_patch.reference_match_threshold ?? "null"} | ${variant.policy_patch.dropped_features.join(",") || "none"} | ${variant.verdict} | ${variant.scoring.winning_reference ?? "null"} | ${variant.scoring.reference_margin ?? "null"} | ${variant.scoring.margin_sufficient} |`,
        )
        .join("\n")
    : "| unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable |";
  const offlineRows = payload.cases
    .flatMap((entry) =>
      (entry.offlineYorkAudit?.byView ?? []).map((audit) => {
        const lobe = entry.offlineYorkAudit?.alcubierreSignedLobeSummary;
        return `| ${entry.caseId} | ${audit.view} | ${audit.coordinateMode} | ${audit.samplingChoice} | ${audit.rawExtrema.min ?? "null"} | ${audit.rawExtrema.max ?? "null"} | ${audit.rawExtrema.absMax ?? "null"} | ${audit.counts.positive} | ${audit.counts.negative} | ${audit.counts.zeroOrNearZero} | ${audit.thetaSliceHash ?? "null"} | ${lobe?.foreHalfPositiveTotal ?? "null"} | ${lobe?.foreHalfNegativeTotal ?? "null"} | ${lobe?.aftHalfPositiveTotal ?? "null"} | ${lobe?.aftHalfNegativeTotal ?? "null"} | ${lobe?.signedLobeSummary ?? "null"} |`;
      }),
    )
    .join("\n");
  const parityRows = payload.cases
    .flatMap((entry) =>
      (entry.parity?.byView ?? []).map((audit) => {
        return `| ${entry.caseId} | ${audit.view} | ${audit.offlineThetaSliceHash ?? "null"} | ${audit.offlineNegKTraceSliceHash ?? "null"} | ${audit.renderThetaSliceHash ?? "null"} | ${audit.thetaVsRenderMaxAbsResidual ?? "null"} | ${audit.thetaVsKTraceMaxAbsResidual ?? "null"} | ${audit.signCountDelta.thetaVsRender.positive ?? "null"} | ${audit.signCountDelta.thetaVsRender.negative ?? "null"} | ${audit.signCountDelta.thetaVsKTrace.positive ?? "null"} | ${audit.signCountDelta.thetaVsKTrace.negative ?? "null"} | ${audit.supportOverlapPct.offline ?? "null"} | ${audit.supportOverlapPct.render ?? "null"} | ${audit.supportOverlapPct.delta ?? "null"} | ${audit.extremaDelta.thetaVsRender.absMaxRaw ?? "null"} | ${audit.extremaDelta.thetaVsKTrace.absMaxRaw ?? "null"} | ${audit.identity.complete} | ${audit.status} | ${audit.causeCode ?? "null"} |`;
      }),
    )
    .join("\n");
  const parityCaseRows =
    payload.cases
      .map((entry) => {
        const parity = entry.parity;
        const parityStatus = parity?.status ?? "fail";
        const parityCauseCode =
          parity == null
            ? "snapshot_identity_failure"
            : parity.causeCode ??
              (parityStatus === "pass" ? "null" : "snapshot_identity_failure");
        return `| ${entry.caseId} | ${parity?.parityComputed ?? false} | ${parity?.thetaKTraceParityComputed ?? false} | ${parity?.snapshotIdentityComplete ?? false} | ${parity?.renderParityPass ?? false} | ${parity?.thetaKTraceContractPass ?? false} | ${parityStatus} | ${parityCauseCode} |`;
      })
      .join("\n") || "| none | false | false | false | false | false | fail | snapshot_identity_failure |";
  const decisionRows = payload.decisionTable
    .map((row) => `| ${row.id} | ${row.condition} | ${row.status} | ${row.interpretation} |`)
    .join("\n");
  const preconditionRows = [
    [
      "controlsIndependent",
      payload.preconditions.controlsIndependent,
      "control families must not share the same theta channel hash",
    ],
    [
      "allRequiredViewsRendered",
      payload.preconditions.allRequiredViewsRendered,
      "all required York views must render without fallback",
    ],
    [
      "provenanceHashesPresent",
      payload.preconditions.provenanceHashesPresent,
      "strict York provenance hashes must be present for each requested view",
    ],
    [
      "runtimeStatusProvenancePresent",
      payload.preconditions.runtimeStatusProvenancePresent,
      "runtime status endpoint must expose serviceVersion/buildHash/commitSha/processStartedAtMs/runtimeInstanceId",
    ],
    [
      "offlineRenderParityComputed",
      payload.preconditions.offlineRenderParityComputed,
      "offline vs rendered parity metrics must be computed on the same snapshot",
    ],
    [
      "thetaKTraceParityComputed",
      payload.preconditions.thetaKTraceParityComputed,
      "offline theta vs offline -K_trace parity metrics must be computed on the same snapshot",
    ],
    [
      "snapshotIdentityComplete",
      payload.preconditions.snapshotIdentityComplete,
      "metric_ref_hash/theta hash/K_trace hash/chart/observer/theta_definition/kij_sign_convention/lane_id/timestamp identity must be complete",
    ],
    [
      "diagnosticParityClosed",
      payload.preconditions.diagnosticParityClosed ?? payload.preconditions.laneAParityClosed,
      "Diagnostic-lane parity must pass before family verdict is allowed",
    ],
    [
      "readyForFamilyVerdict",
      payload.preconditions.readyForFamilyVerdict,
      "family verdict is allowed only when all preconditions pass",
    ],
  ]
    .map(([name, value, policy]) => `| ${String(name)} | ${value ? "true" : "false"} | ${String(policy)} |`)
    .join("\n");
  const guardRows =
    payload.guardFailures.length > 0
      ? payload.guardFailures
          .map((failure) => `| ${failure.code} | ${failure.detail} |`)
          .join("\n")
      : "| none | none |";
  const notes = payload.notes.length
    ? payload.notes.map((entry) => `- ${entry}`).join("\n")
    : "- none";

  return `# Warp York Control-Family Proof Pack (${payload.generatedOn})

"${payload.boundaryStatement}"

## Inputs
- baseUrl: \`${payload.inputs.baseUrl}\`
- frameEndpoint: \`${payload.inputs.frameEndpoint}\`
- proxyFrameEndpoint: \`${payload.inputs.proxyFrameEndpoint ?? "null"}\`
- compareDirectAndProxy: \`${payload.inputs.compareDirectAndProxy}\`
- frameSize: \`${payload.inputs.frameSize.width}x${payload.inputs.frameSize.height}\`
- nhm2SnapshotPath: \`${payload.inputs.nhm2SnapshotPath}\`
- yorkViews: \`${payload.inputs.yorkViews.join(", ")}\`

## Diagnostic Contract
- diagnosticContractId: \`${payload.diagnosticContractId}\`
- version: \`${payload.diagnosticContract.version}\`
- observer: \`${payload.diagnosticContract.observer}\`
- foliation: \`${payload.diagnosticContract.foliation}\`
- theta_definition: \`${payload.diagnosticContract.theta_definition}\`
- kij_sign_convention: \`${payload.diagnosticContract.kij_sign_convention}\`
- classificationScope: \`${payload.classificationScope}\`
- reference alcubierre_control: ${payload.diagnosticContract.reference_controls.alcubierre_control.description}
- reference natario_control: ${payload.diagnosticContract.reference_controls.natario_control.description}
- feature_set: \`${payload.diagnosticContract.feature_set.join(", ")}\`
- robustness.enabled: \`${payload.diagnosticContract.robustness_checks.enabled}\`
- robustness.weight_perturbation_pct: \`${payload.diagnosticContract.robustness_checks.weight_perturbation_pct}\`
- robustness.margin_variants: \`${payload.diagnosticContract.robustness_checks.margin_variants.join(", ")}\`
- robustness.threshold_variants: \`${payload.diagnosticContract.robustness_checks.threshold_variants.join(", ")}\`
- robustness.feature_drop_sets: \`${payload.diagnosticContract.robustness_checks.feature_drop_sets.map((entry) => `${entry.id}:${entry.drop_features.join("+")}`).join("; ") || "none"}\`
- robustness.stability_policy: \`stable>=${payload.diagnosticContract.robustness_checks.stability_policy.stable_fraction_min}, marginal>=${payload.diagnosticContract.robustness_checks.stability_policy.marginal_fraction_min}\`

## Diagnostic Lanes
| lane_id | active | supported | observer | foliation | theta_definition | kij_sign_convention | semantics_closed | cross_lane_claim_ready | lane_ready_for_cross_lane | ready_for_verdict | controls_calibrated | verdict | cause_code |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${laneRowsSummary || "| none | none | none | none | none | none | none | false | false | false | none | none | none | lane_a_family_inconclusive |"}

## Lane Causes
- baselineLaneId: \`${baselineLaneForSummary?.lane_id ?? payload.crossLaneComparison.baseline_lane_id ?? "null"}\`
- baselineLaneCauseCode: \`${baselineCauseCode}\`
- alternateLaneId: \`${alternateLaneForSummary?.lane_id ?? payload.crossLaneComparison.alternate_lane_id ?? "null"}\`
- alternateLaneCauseCode: \`${alternateCauseCode}\`
- baselineLaneParityStatus: \`${baselineParityStatus}\`
- baselineLaneParityCause: \`${baselineParityCause}\`

## Lane A Parity (Case Summary)
| case | parity_computed | theta_ktrace_parity_computed | snapshot_identity_complete | render_parity_pass | theta_ktrace_contract_pass | status | cause_code |
|---|---|---|---|---|---|---|---|
${parityCaseRows}

## Per-Lane Guard Failures
| lane_id | code | detail |
|---|---|---|
${laneGuardRows || "| none | none | none |"}

## Cross-Lane Comparison
| metric | value |
|---|---|
${crossLaneRows}

### Cross-Lane Notes
${crossLaneNotes}

## Runtime Status Provenance
- statusEndpoint: \`${payload.provenance.runtimeStatus.statusEndpoint}\`
- reachable: \`${payload.provenance.runtimeStatus.reachable}\`
- serviceVersion: \`${payload.provenance.runtimeStatus.serviceVersion ?? "null"}\`
- buildHash: \`${payload.provenance.runtimeStatus.buildHash ?? "null"}\`
- commitSha: \`${payload.provenance.runtimeStatus.commitSha ?? "null"}\`
- processStartedAtMs: \`${payload.provenance.runtimeStatus.processStartedAtMs ?? "null"}\`
- runtimeInstanceId: \`${payload.provenance.runtimeStatus.runtimeInstanceId ?? "null"}\`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${controlRows}

## Per-View Lane Failure Trace
| case | view | lane | endpoint | ok | http_status | error_code | response_message | preflight_branch | requirement |
|---|---|---|---|---|---:|---|---|---|---|
${laneRows}

## Per-Case Per-View York Evidence
| case | view | ok | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent | theta_channel_hash | slice_array_hash | normalized_slice_hash | support_mask_slice_hash | shell_masked_slice_hash |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
${viewRows}

## Offline York slice audit (numeric)
| case | view | coordinate_mode | sampling_choice | theta_min_raw | theta_max_raw | theta_abs_max_raw | positive_cells | negative_cells | zero_or_near_zero_cells | offline_slice_hash | fore_pos_total | fore_neg_total | aft_pos_total | aft_neg_total | signed_lobe_summary |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---|
${offlineRows}

## Lane A Offline-vs-Render Parity
| case | view | offline_theta_hash | offline_neg_ktrace_hash | render_theta_hash | theta_vs_render_max_abs_residual | theta_vs_ktrace_max_abs_residual | sign_delta_render_pos | sign_delta_render_neg | sign_delta_ktrace_pos | sign_delta_ktrace_neg | support_overlap_offline_pct | support_overlap_render_pct | support_overlap_delta_pct | extrema_delta_theta_render_absmax | extrema_delta_theta_ktrace_absmax | identity_complete | status | cause_code |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
${parityRows || "| none | none | null | null | null | null | null | null | null | null | null | null | null | null | null | null | false | fail | snapshot_identity_failure |"}

## Case Summary (primary York = ${primaryViewLabel})
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
${caseRows}

## Classification Features
| case | theta_abs_max_raw | theta_abs_max_display | positive_count_xz | negative_count_xz | positive_count_xrho | negative_count_xrho | support_overlap_pct | near_zero_theta | signed_lobe_summary | shell_map_activity |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
${classificationFeatureRows}

## Classification Scoring
| metric | value |
|---|---|
${scoringRows}

## Classification Robustness Summary
| metric | value |
|---|---|
${robustnessSummaryRows}

## Classification Robustness Variants
| variant_id | variant_type | weight_feature | weight_scale | margin_override | threshold_override | dropped_features | verdict | winning_reference | reference_margin | margin_sufficient |
|---|---|---|---:|---:|---:|---|---|---|---:|---|
${robustnessVariantRows}

## Preconditions
| precondition | pass | policy |
|---|---|---|
${preconditionRows}

## Guard Failures
| code | detail |
|---|---|
${guardRows}

## Decision Table
| id | condition | status | interpretation |
|---|---|---|---|
${decisionRows}

## Verdict
- \`${payload.verdict}\`

## Notes
${notes}
`;
};

export const runWarpYorkControlFamilyProofPack = async (options?: {
  baseUrl?: string;
  frameEndpoint?: string;
  proxyFrameEndpoint?: string;
  compareDirectAndProxy?: boolean;
  contractPath?: string;
  nhm2SnapshotPath?: string;
  outJsonPath?: string;
  outMdPath?: string;
  latestJsonPath?: string;
  latestMdPath?: string;
  rodcOutJsonPath?: string;
  rodcLatestJsonPath?: string;
  yorkViews?: HullScientificRenderView[];
  frameSize?: { width: number; height: number };
}) => {
  const baseUrl = normalizeBaseUrl(options?.baseUrl ?? DEFAULT_BASE_URL);
  const frameEndpoint = options?.frameEndpoint ?? DEFAULT_FRAME_ENDPOINT;
  const compareDirectAndProxy = options?.compareDirectAndProxy === true;
  const proxyFrameEndpoint =
    options?.proxyFrameEndpoint ??
    (compareDirectAndProxy
      ? `${baseUrl}/api/helix/hull-render/frame`
      : null);
  const diagnosticContract = loadYorkDiagnosticContract(
    options?.contractPath ?? YORK_DIAGNOSTIC_CONTRACT_PATH,
  );
  const nhm2SnapshotPath = options?.nhm2SnapshotPath ?? DEFAULT_NHM2_SNAPSHOT_PATH;
  const outJsonPath = options?.outJsonPath ?? DEFAULT_OUT_JSON;
  const outMdPath = options?.outMdPath ?? DEFAULT_OUT_MD;
  const latestJsonPath = options?.latestJsonPath ?? DEFAULT_LATEST_JSON;
  const latestMdPath = options?.latestMdPath ?? DEFAULT_LATEST_MD;
  const rodcOutJsonPath = options?.rodcOutJsonPath ?? DEFAULT_RODC_OUT_JSON;
  const rodcLatestJsonPath =
    options?.rodcLatestJsonPath ?? DEFAULT_RODC_LATEST_JSON;
  const yorkViews = ensureRequiredYorkViews(
    options?.yorkViews?.length ? [...options.yorkViews] : [...DEFAULT_YORK_VIEWS],
  );
  const frameSize = {
    width: Math.max(128, Math.floor(options?.frameSize?.width ?? 1280)),
    height: Math.max(128, Math.floor(options?.frameSize?.height ?? 720)),
  };
  const runtimeStatus = await fetchRuntimeStatusProvenance(frameEndpoint);
  const laneById = new Map(
    diagnosticContract.lanes.map((lane) => [lane.lane_id, lane]),
  );
  const baselineLane =
    laneById.get(diagnosticContract.baseline_lane_id) ??
    diagnosticContract.lanes.find((lane) => lane.active && lane.supported) ??
    diagnosticContract.lanes[0];
  if (!baselineLane) {
    throw new Error("no_diagnostic_lanes_configured");
  }
  const alternateLane =
    (diagnosticContract.alternate_lane_id
      ? laneById.get(diagnosticContract.alternate_lane_id)
      : null) ??
    diagnosticContract.lanes.find(
      (lane) => lane.lane_id !== baselineLane.lane_id,
    ) ??
    null;

  const nhm2MetricVolumeRef = loadNhm2MetricVolumeRef(nhm2SnapshotPath);
  const alcMetricVolumeRef = buildControlMetricVolumeRef({
    baseUrl,
    metricT00Source: "metric",
    metricT00Ref: "warp.metric.T00.alcubierre.analytic",
    dutyFR: 0.0015,
    q: 3,
    gammaGeo: 26,
    gammaVdB: 500,
    zeta: 0.84,
    phase01: 0,
    dims: [48, 48, 48],
    requireCongruentSolve: true,
    requireNhm2CongruentFullSolve: false,
  });
  const natMetricVolumeRef = buildControlMetricVolumeRef({
    baseUrl,
    metricT00Source: "metric",
    metricT00Ref: "warp.metric.T00.natario.shift",
    dutyFR: 0.0015,
    q: 3,
    gammaGeo: 26,
    gammaVdB: 500,
    zeta: 0.84,
    phase01: 0,
    dims: [48, 48, 48],
    requireCongruentSolve: true,
    requireNhm2CongruentFullSolve: false,
  });

  const runSupportedLane = async (
    lane: YorkDiagnosticLane,
  ): Promise<LaneProofPackEvaluation> => {
    const cases = await Promise.all([
      runCase({
        diagnosticLane: lane,
        caseId: "alcubierre_control",
        label: "Alcubierre-like control",
        familyExpectation: "alcubierre-like-control",
        metricVolumeRef: alcMetricVolumeRef,
        frameEndpoint,
        proxyFrameEndpoint,
        compareDirectAndProxy,
        requireCongruentNhm2FullSolve: false,
        yorkViews,
        frameSize,
      }),
      runCase({
        diagnosticLane: lane,
        caseId: "natario_control",
        label: "Natario-like control",
        familyExpectation: "natario-like-control",
        metricVolumeRef: natMetricVolumeRef,
        frameEndpoint,
        proxyFrameEndpoint,
        compareDirectAndProxy,
        requireCongruentNhm2FullSolve: false,
        yorkViews,
        frameSize,
      }),
      runCase({
        diagnosticLane: lane,
        caseId: "nhm2_certified",
        label: "NHM2 certified snapshot",
        familyExpectation: "nhm2-certified",
        metricVolumeRef: nhm2MetricVolumeRef,
        frameEndpoint,
        proxyFrameEndpoint,
        compareDirectAndProxy,
        requireCongruentNhm2FullSolve: true,
        yorkViews,
        frameSize,
      }),
    ]);
    return evaluateDiagnosticLane({
      lane,
      contract: diagnosticContract,
      yorkViews,
      runtimeStatus,
      cases,
    });
  };

  const laneEvaluations: LaneProofPackEvaluation[] = [];
  laneEvaluations.push(
    baselineLane.supported ? await runSupportedLane(baselineLane) : buildUnsupportedLaneEvaluation(baselineLane),
  );
  if (alternateLane && alternateLane.lane_id !== baselineLane.lane_id) {
    laneEvaluations.push(
      alternateLane.supported
        ? await runSupportedLane(alternateLane)
        : buildUnsupportedLaneEvaluation(alternateLane),
    );
  }

  const baselineEvaluation =
    laneEvaluations.find((lane) => lane.lane_id === baselineLane.lane_id) ??
    laneEvaluations[0];
  if (!baselineEvaluation) {
    throw new Error("proof_pack_lane_evaluation_missing");
  }
  const alternateEvaluation = alternateLane
    ? laneEvaluations.find((lane) => lane.lane_id === alternateLane.lane_id) ?? null
    : null;
  const crossLaneComparison = buildCrossLaneComparison({
    baseline: baselineEvaluation,
    alternate: alternateEvaluation,
    baselineLaneId: baselineLane.lane_id,
    alternateLaneId: alternateLane?.lane_id ?? null,
  });

  const cases = baselineEvaluation.cases;
  const controlDebug = baselineEvaluation.controlDebug;
  const preconditions = baselineEvaluation.preconditions;
  const laneAParity = baselineEvaluation.laneAParity;
  const causeCode = baselineEvaluation.causeCode;
  const guardFailures = baselineEvaluation.guardFailures;
  const decisionTable = baselineEvaluation.decisionTable;
  const classificationScoring = baselineEvaluation.classificationScoring;
  const classificationRobustness = baselineEvaluation.classificationRobustness;
  const verdict = baselineEvaluation.verdict;
  const notes = [...baselineEvaluation.notes];
  notes.push(
    `Classification contract ${diagnosticContract.contract_id}@v${diagnosticContract.version} uses ${diagnosticContract.decision_policy.distance_metric} with margin=${diagnosticContract.decision_policy.reference_margin_min}.`,
  );
  notes.push(
    `cross-lane status=${crossLaneComparison.cross_lane_status} baseline=${crossLaneComparison.baseline_verdict ?? "null"} alternate=${crossLaneComparison.alternate_verdict ?? "null"}`,
  );
  if (alternateEvaluation?.causeCode) {
    notes.push(
      formatLaneCauseCodeNote(alternateEvaluation.lane_id, alternateEvaluation.causeCode),
    );
  }
  notes.push(...crossLaneComparison.notes);

  const payloadBase: ProofPackPayload = {
    artifactType: "warp_york_control_family_proof_pack/v1",
    generatedOn: DATE_STAMP,
    generatedAt: new Date().toISOString(),
    boundaryStatement: BOUNDARY_STATEMENT,
    diagnosticContractId: diagnosticContract.contract_id,
    classificationScope: diagnosticContract.classification_scope,
    diagnosticContract,
    diagnosticLanes: laneEvaluations,
    crossLaneComparison,
    inputs: {
      baseUrl,
      frameEndpoint,
      proxyFrameEndpoint,
      compareDirectAndProxy,
      nhm2SnapshotPath: normalizePath(nhm2SnapshotPath),
      yorkViews: [...yorkViews],
      frameSize,
    },
    cases,
    controlDebug,
    preconditions,
    laneAParity,
    causeCode,
    guardFailures,
    decisionTable,
    classificationScoring,
    classificationRobustness,
    verdict,
    notes,
    provenance: {
      commitHash: getHeadCommit(),
      runtimeStatus,
    },
  };
  const payload: ProofPackPayload = {
    ...payloadBase,
    checksum: computeChecksum(payloadBase),
  };
  const rodcArtifact = buildWarpRodcSnapshot({
    payload,
    sourceAuditArtifact: normalizePath(latestJsonPath),
  });

  ensureDirForFile(outJsonPath);
  ensureDirForFile(outMdPath);
  ensureDirForFile(latestJsonPath);
  ensureDirForFile(latestMdPath);
  ensureDirForFile(rodcOutJsonPath);
  ensureDirForFile(rodcLatestJsonPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(latestJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(rodcOutJsonPath, `${JSON.stringify(rodcArtifact, null, 2)}\n`);
  fs.writeFileSync(rodcLatestJsonPath, `${JSON.stringify(rodcArtifact, null, 2)}\n`);
  const markdown = renderMarkdown(payload);
  fs.writeFileSync(outMdPath, `${markdown}\n`);
  fs.writeFileSync(latestMdPath, `${markdown}\n`);

  return {
    outJsonPath,
    outMdPath,
    latestJsonPath,
    latestMdPath,
    rodcOutJsonPath,
    rodcLatestJsonPath,
    payload,
    rodcArtifact,
  };
};

const isEntryPoint = (() => {
  if (!process.argv[1]) return false;
  try {
    return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isEntryPoint) {
  const width = parsePositiveInt(readArgValue("--width"), 1280);
  const height = parsePositiveInt(readArgValue("--height"), 720);
  const compareDirectAndProxy = parseBooleanArg(
    readArgValue("--compare-direct-proxy"),
    false,
  );
  runWarpYorkControlFamilyProofPack({
    baseUrl: readArgValue("--base-url"),
    frameEndpoint: readArgValue("--frame-endpoint"),
    proxyFrameEndpoint: readArgValue("--proxy-frame-endpoint"),
    compareDirectAndProxy,
    contractPath: readArgValue("--contract"),
    nhm2SnapshotPath: readArgValue("--nhm2-snapshot"),
    outJsonPath: readArgValue("--out-json"),
    outMdPath: readArgValue("--out-md"),
    latestJsonPath: readArgValue("--latest-json"),
    latestMdPath: readArgValue("--latest-md"),
    rodcOutJsonPath: readArgValue("--rodc-out-json"),
    rodcLatestJsonPath: readArgValue("--rodc-latest-json"),
    yorkViews: parseYorkViews(readArgValue("--views")),
    frameSize: { width, height },
  })
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result.payload, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(
        `[warp-york-control-family-proof-pack] ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
