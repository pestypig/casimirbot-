import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { HullScientificRenderView } from "../shared/hull-render-contract";
import {
  buildWarpRodcSnapshot,
  buildSourceToYorkBridgeSummary,
  buildCrossLaneComparison,
  buildCaseClassificationFeatures,
  buildControlMetricVolumeRef,
  buildNhm2SourceToYorkProvenanceArtifact,
  buildNhm2SourceFormulaAuditArtifact,
  buildNhm2SourceMechanismMaturityArtifact,
  buildNhm2SourceMechanismPromotionContractArtifact,
  buildNhm2SourceMechanismParityRouteFeasibilityArtifact,
  buildSourceMechanismPromotionContractSummary,
  buildNhm2SourceStageAuditArtifact,
  buildNhm2TimingAuthorityAuditArtifact,
  buildNhm2BrickAuthorityAuditArtifact,
  buildNhm2SnapshotAuthorityAuditArtifact,
  buildNhm2DiagnosticSemanticAuditArtifact,
  buildNhm2SolveAuthorityAuditArtifact,
  buildNhm2YorkRenderDebugArtifact,
  buildNhm2YorkFixedScaleComparisonArtifact,
  buildWarpYorkCanonicalCalibrationArtifact,
  buildNhm2AblationSpecs,
  buildNhm2SourceRedesignSpecs,
  buildNhm2YorkAblationPanelArtifact,
  buildNhm2CanonicalVisualComparisonArtifact,
  buildRenderTaxonomyArtifact,
  buildNhm2SourceCouplingRedesignArtifact,
  buildNhm2SourceCouplingRedesignRealizationArtifact,
  buildNhm2DeeperReformulationArtifact,
  buildNhm2ParameterSweepArtifact,
  buildNhm2ParameterSweepPlan,
  classifyAblationMovement,
  classifySourceRedesignMovement,
  classifySourceReformulationMovement,
  classifySweepRunMorphology,
  computeOfflineYorkAudit,
  buildControlDebug,
  computeSolveAuthorityReadiness,
  computeSourceToYorkBridgeReadiness,
  decideNhm2SourceCouplingRedesignVerdict,
  decideNhm2DeeperReformulationVerdict,
  decideControlFamilyVerdict,
  deriveYorkOptixTracefreeMagnitude,
  buildShiftDirectionOverlayPairwiseComparisons,
  evaluateShiftDirectionOverlayCaseDistinctness,
  evaluateClassificationRobustness,
  evaluateYorkOptixFieldRenderIntegrity,
  evaluateYorkOptixPresentationImageQuality,
  evaluateLaneASnapshotIdentity,
  evaluateYorkSliceCongruence,
  evaluateProofPackPreconditions,
  enrichCanonicalCalibrationRenderTaxonomy,
  enrichCanonicalVisualComparisonRenderTaxonomy,
  enrichYorkOptixRenderTaxonomy,
  extractThetaSliceXRho,
  extractThetaSliceXZMidplane,
  formatDeeperReformulationProofPackSummary,
  formatSourceCouplingRedesignProofPackSummary,
  formatYorkOptixRenderProofPackSummary,
  formatLaneCauseCodeNote,
  hasStrongForeAftYork,
  hasSufficientSignalForAlcubierreControl,
  loadYorkDiagnosticContract,
  readSourceFamilyEvidence,
  refreshProofPackAuthoritativeLowExpansionGate,
  renderMarkdown,
  buildWarpYorkControlFamilyPublishedLatestPayload,
  resolveLaneACauseCode,
  renderNhm2SourceToYorkProvenanceMarkdown,
  renderNhm2SourceFormulaAuditMarkdown,
  renderNhm2SourceMechanismMaturityMarkdown,
  renderNhm2SourceMechanismPromotionContractMarkdown,
  renderNhm2SourceMechanismParityRouteFeasibilityMarkdown,
  renderNhm2SourceStageAuditMarkdown,
  renderNhm2TimingAuthorityAuditMarkdown,
  renderNhm2BrickAuthorityAuditMarkdown,
  renderNhm2SnapshotAuthorityAuditMarkdown,
  renderNhm2DiagnosticSemanticAuditMarkdown,
  renderNhm2SolveAuthorityAuditMarkdown,
  renderNhm2YorkRenderDebugMarkdown,
  renderNhm2YorkFixedScaleComparisonMarkdown,
  renderWarpYorkCanonicalCalibrationMarkdown,
  renderNhm2AblationDecisionMemo,
  renderNhm2YorkAblationPanelMarkdown,
  renderNhm2SourceCouplingRedesignDecisionMemo,
  renderNhm2SourceCouplingRedesignMarkdown,
  renderNhm2SourceCouplingRedesignRealizationMarkdown,
  renderNhm2SourceCouplingRedesignRealizationMemo,
  renderNhm2DeeperReformulationDecisionMemo,
  renderNhm2DeeperReformulationMarkdown,
  renderNhm2ParameterSweepDecisionMemo,
  renderNhm2ParameterSweepMarkdown,
  renderNhm2CurvatureInvariantVisualizationMarkdown,
  buildNhm2WarpWorldlineProofArtifact,
  buildNhm2CruiseEnvelopePreflightArtifact,
  buildNhm2RouteTimeWorldlineArtifact,
  buildNhm2MissionTimeEstimatorArtifact,
  buildNhm2MissionTimeComparisonArtifact,
  buildNhm2CruiseEnvelopeArtifact,
  buildNhm2InHullProperAccelerationArtifact,
  renderNhm2WarpWorldlineProofMarkdown,
  renderNhm2CruiseEnvelopePreflightMarkdown,
  renderNhm2RouteTimeWorldlineMarkdown,
  renderNhm2MissionTimeEstimatorMarkdown,
  renderNhm2MissionTimeComparisonMarkdown,
  renderNhm2CruiseEnvelopeMarkdown,
  renderNhm2InHullProperAccelerationMarkdown,
  renderNhm2ShiftGeometryVisualizationMarkdown,
  renderNhm2YorkOptixRenderMarkdown,
  renderNhm2YorkOptixRenderMemo,
  renderNhm2CanonicalVisualComparisonMarkdown,
  renderNhm2CanonicalVisualComparisonDecisionMemo,
  renderRenderTaxonomyAuditMarkdown,
  renderRenderTaxonomyStandardMemo,
  renderNhm2YorkPaperComparisonMemo,
  renderNhm2NasaFigure1OverlayMemo,
  renderNhm2RenderCalibrationDecisionMemo,
  scoreNhm2AgainstReferenceControls,
  summarizeLaneAParity,
  buildYorkOptixPresentationPayload,
} from "../scripts/warp-york-control-family-proof-pack";
import {
  YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
  YORK_DIAGNOSTIC_BASELINE_LANE_ID,
  computeYorkDiagnosticLaneField,
} from "../shared/york-diagnostic-lanes";
import {
  makeWarpCruiseEnvelopePreflightFixture,
  makeWarpCruiseEnvelopeFixture,
  makeWarpMissionTimeComparisonFixture,
  makeWarpMissionTimeEstimatorFixture,
  makeWarpInHullProperAccelerationFixture,
  makeWarpRouteTimeWorldlineFixture,
  makeWarpWorldlineFixture,
} from "./helpers/warp-worldline-fixture";

const REQUIRED_VIEWS: HullScientificRenderView[] = [
  "york-surface-3p1",
  "york-surface-rho-3p1",
  "york-topology-normalized-3p1",
  "york-shell-map-3p1",
];

const makeView = (
  view: HullScientificRenderView,
  overrides?: Partial<Record<string, unknown>>,
): Record<string, unknown> => {
  const hashes: Record<string, string | null> = {
    certificate_hash: "cert-hash",
    frame_hash: "frame-hash",
    theta_channel_hash: "theta-hash",
    slice_array_hash: "slice-hash",
    normalized_slice_hash: view === "york-topology-normalized-3p1" ? "normalized-hash" : null,
    support_mask_slice_hash: view === "york-shell-map-3p1" ? "support-hash" : null,
    shell_masked_slice_hash: view === "york-shell-map-3p1" ? "shell-hash" : null,
  };
  return {
    view,
    ok: true,
    backend: "proxy",
    scientificTier: "research-grade",
    error: null,
    note: null,
    render: {
      view,
      field_key: "theta",
      lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
      slice_plane: view === "york-surface-rho-3p1" ? "x-rho" : "x-z-midplane",
      coordinate_mode: view === "york-surface-rho-3p1" ? "x-rho" : "x-z-midplane",
      normalization: "symmetric-about-zero",
      magnitude_mode: view === "york-topology-normalized-3p1" ? "normalized-topology-only" : null,
      surface_height: view === "york-topology-normalized-3p1" ? "theta_norm" : "theta",
      support_overlay: view === "york-shell-map-3p1" ? "hull_sdf+tile_support_mask" : null,
    },
    identity: {
      lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
      metric_ref_hash: "metric-ref",
      timestamp_ms: 1234,
      chart: "comoving_cartesian",
      observer: "eulerian_n",
      theta_definition: "theta=-trK",
      kij_sign_convention: "ADM",
      unit_system: "geom",
    },
    rawExtrema: { min: -1, max: 1, absMax: 1 },
    displayExtrema: {
      min: -1,
      max: 1,
      absMax: 1,
      rangeMethod: "symmetric-about-zero",
      gain: 1,
      heightScale: 1,
    },
    nearZeroTheta: false,
    samplingChoice: view === "york-surface-rho-3p1" ? "x-rho cylindrical remap" : "x-z midplane",
    supportOverlapPct: 0.7,
    supportedThetaFraction: 0.7,
    shellSupportCount: view === "york-shell-map-3p1" ? 20 : null,
    shellActiveCount: view === "york-shell-map-3p1" ? 10 : null,
    hashes,
    laneEvidence: {
      observer_definition_id: "obs.eulerian_n",
      observer_inputs_required: ["alpha"],
      observer_inputs_present: true,
      lane_b_semantic_mode: "baseline-eulerian-theta-minus-trk",
      lane_b_tensor_inputs_hash: null,
      lane_b_geometry_ready: true,
      lane_b_semantics_closed: true,
    },
    ...overrides,
  };
};

const makeCase = (
  caseId: "alcubierre_control" | "natario_control" | "nhm2_certified",
  thetaHash: string,
  metricUrl?: string,
): Record<string, unknown> => ({
  caseId,
  label: caseId,
  familyExpectation: caseId,
  metricVolumeRef: {
    kind: "gr-evolve-brick",
    url: metricUrl ?? `http://127.0.0.1:5050/example/${caseId}`,
  },
  perView: REQUIRED_VIEWS.map((view) => makeView(view)),
  primaryYork: {
    view: "york-surface-rho-3p1",
    rawExtrema: { min: -1, max: 1, absMax: 1 },
    displayExtrema: { min: -1, max: 1, absMax: 1, rangeMethod: "symmetric-about-zero", gain: 1, heightScale: 1 },
    nearZeroTheta: false,
    coordinateMode: "x-rho",
    samplingChoice: "x-rho cylindrical remap",
    supportOverlapPct: 0.7,
  },
  snapshotMetrics: {
    dims: [48, 48, 48],
    source: "metric",
    chart: "comoving_cartesian",
    channelHashes: { theta: thetaHash, K_trace: "ktrace-hash" },
    sourceFamily: {
      family_id:
        caseId === "alcubierre_control"
          ? "alcubierre_control"
          : caseId === "natario_control"
            ? "natario_control"
            : "nhm2_certified",
      metricT00Ref:
        caseId === "alcubierre_control"
          ? "warp.metric.T00.alcubierre.analytic"
          : caseId === "natario_control"
            ? "warp.metric.T00.natario.shift"
            : "warp.metric.T00.natario_sdf.shift",
      warpFieldType:
        caseId === "alcubierre_control"
          ? "alcubierre"
          : caseId === "natario_control"
            ? "natario"
            : "natario_sdf",
      source_branch: "metric_t00_ref",
      shape_function_id:
        caseId === "alcubierre_control"
          ? "alcubierre_longitudinal_shell_v1"
          : caseId === "natario_control"
            ? "natario_shift_shell_v1"
            : "nhm2_natario_sdf_shell_v1",
    },
    thetaPlusKTrace: {
      rms: 0,
      maxAbs: 0,
      mean: 0,
      sampleCount: 1,
      consistent: true,
    },
  },
  offlineYorkAudit: {
    byView: [
      {
        view: "york-surface-3p1",
        coordinateMode: "x-z-midplane",
        samplingChoice: "x-z midplane",
        thetaSliceHash: "slice-hash",
        rawExtrema: { min: -1, max: 1, absMax: 1 },
        counts: { positive: 5, negative: 5, zeroOrNearZero: 1, total: 11 },
      },
      {
        view: "york-surface-rho-3p1",
        coordinateMode: "x-rho",
        samplingChoice: "x-rho cylindrical remap",
        thetaSliceHash: "slice-hash",
        rawExtrema: { min: -1, max: 1, absMax: 1 },
        counts: { positive: 5, negative: 5, zeroOrNearZero: 1, total: 11 },
      },
    ],
  },
  parity: {
    caseId,
    parityComputed: true,
    thetaKTraceParityComputed: true,
    snapshotIdentityComplete: true,
    renderParityPass: true,
    thetaKTraceContractPass: true,
    byView: REQUIRED_VIEWS.map((view) => ({
      view,
      coordinateMode: view === "york-surface-rho-3p1" ? "x-rho" : "x-z-midplane",
      samplingChoice: view === "york-surface-rho-3p1" ? "x-rho cylindrical remap" : "x-z midplane",
      offlineThetaSliceHash: "slice-hash",
      offlineNegKTraceSliceHash: "slice-hash",
      renderThetaSliceHash: "slice-hash",
      thetaVsRenderMaxAbsResidual: 0,
      thetaVsKTraceMaxAbsResidual: 0,
      signCountDelta: {
        thetaVsRender: { positive: 0, negative: 0, zeroOrNearZero: 0, total: 0 },
        thetaVsKTrace: { positive: 0, negative: 0, zeroOrNearZero: 0, total: 0 },
      },
      supportOverlapPct: { offline: 0.7, render: 0.7, delta: 0 },
      extremaDelta: {
        thetaVsRender: { minRaw: 0, maxRaw: 0, absMaxRaw: 0 },
        thetaVsKTrace: { minRaw: 0, maxRaw: 0, absMaxRaw: 0 },
      },
      identity: {
        complete: true,
        laneMatches: true,
        metricRefMatches: true,
        chartMatches: true,
        observerMatches: true,
        thetaDefinitionMatches: true,
        kijSignConventionMatches: true,
        thetaHashMatches: true,
        timestampPresent: true,
      },
      status: "pass",
      causeCode: null,
    })),
    status: "pass",
    causeCode: null,
  },
});

const makeWarpWorldlineContract = () => makeWarpWorldlineFixture();
const makeWarpRouteTimeWorldlineContract = () => makeWarpRouteTimeWorldlineFixture();

const makeProofPackPayloadForMarkdown = () => {
  const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
  const cases = [
    makeCase("alcubierre_control", "theta-hash-alc"),
    makeCase("natario_control", "theta-hash-nat"),
    makeCase("nhm2_certified", "theta-hash-nhm2"),
  ] as any[];
  for (const entry of cases) {
    entry.perView = (entry.perView ?? []).map((view: any) => ({
      ...view,
      endpoint: view.endpoint ?? "http://127.0.0.1:6062/api/helix/hull-render/frame",
      sourceLane: view.sourceLane ?? "single",
      laneResults:
        view.laneResults ??
        [
          {
            lane: "single",
            endpoint: "http://127.0.0.1:6062/api/helix/hull-render/frame",
            ok: true,
            httpStatus: 200,
            errorCode: null,
            responseMessage: null,
            preflightBranch: null,
            preflightRequirement: null,
            error: null,
          },
        ],
    }));
    entry.classificationFeatures = entry.classificationFeatures ?? {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 10,
      negative_count_xrho: 9,
      support_overlap_pct: 0.7,
      near_zero_theta: false,
      signed_lobe_summary: null,
      shell_map_activity: 0.2,
    };
  }
  const laneParitySummary = summarizeLaneAParity(cases as any);
  return {
    artifactType: "warp_york_control_family_proof_pack/v1",
    generatedOn: "2026-03-30",
    generatedAt: "2026-03-30T00:00:00.000Z",
    boundaryStatement: "boundary",
    diagnosticContractId: contract.contract_id,
    classificationScope: contract.classification_scope,
    diagnosticContract: contract,
    diagnosticLanes: [
      {
        lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        observer_definition_id: "obs.eulerian_n",
        observer_inputs_required: ["alpha"],
        observer_construction_inputs: ["alpha"],
        observer_construction_formula: "u^a = n^a (Eulerian normal observer)",
        observer_normalized: true,
        observer_approximation: null,
        semantic_mode: "eulerian_normal",
        lane_semantic_mode: "baseline-eulerian-theta-minus-trk",
        foliation: "comoving_cartesian_3p1",
        foliation_definition:
          "Eulerian normal observer on the fixed comoving Cartesian 3+1 foliation.",
        theta_definition: "theta=-trK",
        kij_sign_convention: "ADM",
        requires_gamma_metric: false,
        is_proxy: false,
        is_reference_only: false,
        is_authoritative_for_readiness: true,
        is_cross_lane_promotable: true,
        semantics_closed: true,
        cross_lane_claim_ready: true,
        reference_comparison_ready: true,
        cross_lane_claim_block_reason: null,
        classification_scope: "diagnostic_local_only",
        cases,
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          diagnosticParityClosed: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: true,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: true,
          readyForCrossLaneComparison: true,
        },
        laneAParity: {
          ...laneParitySummary,
        },
        causeCode: "lane_a_family_congruent",
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [formatLaneCauseCodeNote(YORK_DIAGNOSTIC_BASELINE_LANE_ID, "lane_a_family_congruent")],
      },
      {
        lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "shift_drift_u(beta_over_alpha)",
        observer_definition_id: "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
        observer_inputs_required: [
          "alpha",
          "beta_x",
          "beta_y",
          "beta_z",
          "gamma_xx",
          "gamma_xy",
          "gamma_xz",
          "gamma_yy",
          "gamma_yz",
          "gamma_zz",
          "K_trace",
        ],
        observer_construction_inputs: [
          "alpha",
          "beta_x",
          "beta_y",
          "beta_z",
          "gamma_xx",
          "gamma_xy",
          "gamma_xz",
          "gamma_yy",
          "gamma_yz",
          "gamma_zz",
          "K_trace",
        ],
        observer_construction_formula:
          "u^i_proxy = beta^i/alpha; theta_B = -trK + div_gamma(u_proxy)",
        observer_normalized: false,
        observer_approximation:
          "diagnostic-local observer-only drift proxy on fixed comoving foliation",
        semantic_mode: "observer_proxy",
        lane_semantic_mode: "diagnostic-observer-proxy-covariant-divergence",
        foliation: "comoving_cartesian_3p1",
        foliation_definition:
          "Diagnostic-local observer-drift proxy evaluated on the same fixed comoving Cartesian 3+1 foliation as Lane A.",
        theta_definition: "theta=-trK+div(beta/alpha)",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        requires_gamma_metric: true,
        is_proxy: true,
        is_reference_only: true,
        is_authoritative_for_readiness: false,
        is_cross_lane_promotable: false,
        semantics_closed: true,
        cross_lane_claim_ready: false,
        reference_comparison_ready: true,
        cross_lane_claim_block_reason: null,
        classification_scope: "diagnostic_local_only",
        cases,
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          diagnosticParityClosed: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: false,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: true,
          readyForCrossLaneComparison: true,
        },
        laneAParity: {
          ...laneParitySummary,
        },
        causeCode: "lane_b_family_congruent",
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [formatLaneCauseCodeNote(YORK_DIAGNOSTIC_ALTERNATE_LANE_ID, "lane_b_family_congruent")],
      },
    ],
    crossLaneComparison: {
      baseline_lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      alternate_lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      baseline_verdict: "nhm2_low_expansion_family",
      alternate_verdict: "nhm2_low_expansion_family",
      same_classification: true,
      cross_lane_status: "lane_stable_low_expansion_like",
      falsifiers: {
        baseline_controls_calibrated: true,
        alternate_controls_calibrated: true,
        baseline_supported: true,
        alternate_supported: true,
        lane_b_semantics_closed: true,
        lane_b_observer_defined: true,
        lane_b_tensor_inputs_present: true,
        lane_b_geometry_ready: true,
        lane_b_controls_calibrated: true,
        lane_b_parity_closed: true,
        lane_b_cross_lane_claim_ready: false,
        lane_b_reference_comparison_ready: true,
      },
      notes: [
        "Both lanes calibrate and agree on NHM2 classification.",
        "Lane B remains reference-only for advisory comparison; cross-lane claim promotion is disabled by policy.",
      ],
    },
    inputs: {
      baseUrl: "http://127.0.0.1:5050",
      frameEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/frame",
      proxyFrameEndpoint: "http://127.0.0.1:5050/api/helix/hull-render/frame",
      compareDirectAndProxy: false,
      nhm2SnapshotPath: "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      yorkViews: REQUIRED_VIEWS,
      frameSize: { width: 320, height: 180 },
    },
    cases,
    controlDebug: [],
    preconditions: {
      controlsIndependent: true,
      allRequiredViewsRendered: true,
      provenanceHashesPresent: true,
      runtimeStatusProvenancePresent: true,
      offlineRenderParityComputed: true,
      thetaKTraceParityComputed: true,
      snapshotIdentityComplete: true,
      diagnosticParityClosed: true,
      laneAParityClosed: true,
      readyForFamilyVerdict: true,
    },
    laneAParity: {
      ...laneParitySummary,
    },
    causeCode: "lane_a_family_congruent",
    guardFailures: [],
    decisionTable: [],
    classificationScoring: null,
    classificationRobustness: null,
    verdict: "nhm2_low_expansion_family",
    notes: [formatLaneCauseCodeNote(YORK_DIAGNOSTIC_BASELINE_LANE_ID, "lane_a_family_congruent")],
    provenance: {
      commitHash: "eadb6718",
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "eadb6718",
        processStartedAtMs: 1234,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    },
    checksum: "unused",
  } as any;
};

const makePassedAuthoritativeLowExpansionGate = () => ({
  sourceCaseId: "nhm2_certified",
  status: "pass",
  reason: "authoritative_low_expansion_ok",
  source: "gr_evolve_brick",
  authoritative: true,
  divergenceObservable: "div_beta",
  divergenceRms: 2e-4,
  divergenceMaxAbs: 4e-4,
  divergenceTolerance: 1e-3,
  thetaKConsistencyStatus: "pass",
  thetaKResidualMaxAbs: 2e-4,
  thetaKTolerance: 1e-3,
  projectionDerivedStatus: "advisory_only",
  projectionDerivedNote:
    "Projection-derived betaDiagnostics remain visible for comparison, but authoritative Natario-like low-expansion classification is gated only by brick-native div_beta plus theta/K consistency.",
});

const makeSourceToYorkFixture = () =>
  ({
    generatedOn: "2026-03-31T00:00:00.000Z",
    boundaryStatement: "boundary",
    sourceAuditArtifact: "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourcePaths: {
      nhm2Contract: "configs/nhm2-coupled-inputs.json",
      promotedProfile: "shared/warp-promoted-profile.ts",
      timingAuthorityArtifact: "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      proofPackArtifact: "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      nhm2SnapshotEvidence: "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
    },
    nhm2ContractInputs: {
      warpFieldType: "natario_sdf",
      sectorCount: 80,
      concurrentSectors: 2,
      dutyCycle: 0.12,
      dutyShip: 0.12,
      qCavity: 100000,
      qSpoilingFactor: 3,
      gammaGeo: 1,
      gammaVanDenBroeck: 500,
      modulationFreq_GHz: 15,
      zeta: 5,
      reducedOrderReference: {
        radius_m: 1.1,
        tauLC_ms: 3.358,
      },
      fullHull: {
        Lx_m: 1.1,
        Ly_m: 1.1,
        Lz_m: 1.1,
      },
    },
    promotedProfileDefaults: {
      warpFieldType: "natario_sdf",
      sectorCount: 80,
      concurrentSectors: 2,
      dutyCycle: 0.12,
      dutyShip: 0.12,
      qCavity: 100000,
      qSpoilingFactor: 3,
      gammaGeo: 1,
      gammaVanDenBroeck: 500,
      modulationFreq_GHz: 15,
      zeta: null,
      reducedOrderReference: { radius_m: 1.1, tauLC_ms: 3.358 },
      fullHull: { Lx_m: 1.1, Ly_m: 1.1, Lz_m: 1.1 },
    },
    liveTimingAuthority: {
      tauLC_ms: 3.358,
      tauPulse_ms: 0.000067,
      TS: 50,
      TS_ratio: 50,
      epsilon: 0.001,
      isHomogenized: true,
      timingSource: "configured-autoscale",
      timingAuthority: "artifacts/research/full-solve/A/run-1-raw-output.json",
    },
    reducedOrderPipelinePayload: {
      wave: "A",
      proposalLabel: "wave-a-profile",
      params: { tauLC_ms: 3.358, gammaGeo: 1, zeta: 5 },
      grRequest: { TS: 50, TS_ratio: 50, epsilon: 0.001, dutyFR: 0.0015 },
    },
    proofPackBrickRequest: {
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      metricT00Source: "metric",
      dutyFR: 0.0015,
      q: 3,
      gammaGeo: 26,
      gammaVdB: 500,
      zeta: 0.84,
      dims: "48x48x48",
      requireCongruentSolve: true,
      requireNhm2CongruentFullSolve: true,
      brickUrl:
        "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1",
    },
    proofPackSnapshotRefs: {
      metric_ref_hash: "metric-ref",
      theta_channel_hash: "theta-hash",
      k_trace_hash: "ktrace-hash",
      snapshot_brick_url:
        "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1",
      york_verdict: "nhm2_low_expansion_family",
      cross_lane_status: "lane_stable_low_expansion_like",
    },
    parameterMappings: [
      {
        field: "warpFieldType -> metricT00Ref",
        source_value: "natario_sdf",
        target_value: "warp.metric.T00.natario_sdf.shift",
        mapping_type: "derived_transform",
        mapping_formula: "metricT00Ref selects reduced-order stress family",
        mapping_note: "derived",
        status: "closed",
      },
      {
        field: "dutyShip -> dutyFR",
        source_value: 0.12,
        target_value: 0.0015,
        mapping_type: "audit_harness_override",
        mapping_formula: null,
        mapping_note: "harness",
        status: "closed",
      },
      {
        field: "qCavity -> q",
        source_value: 100000,
        target_value: 3,
        mapping_type: "audit_harness_override",
        mapping_formula: null,
        mapping_note: "harness",
        status: "closed",
      },
      {
        field: "qSpoilingFactor -> q",
        source_value: 3,
        target_value: 3,
        mapping_type: "policy_override",
        mapping_formula: "reduced-order q selector = qSpoilingFactor",
        mapping_note: "policy",
        status: "closed",
      },
      {
        field: "gammaGeo",
        source_value: 1,
        target_value: 26,
        mapping_type: "audit_harness_override",
        mapping_formula: null,
        mapping_note: "harness",
        status: "closed",
      },
      {
        field: "gammaVanDenBroeck -> gammaVdB",
        source_value: 500,
        target_value: 500,
        mapping_type: "direct_copy",
        mapping_formula: "gammaVdB = gammaVanDenBroeck",
        mapping_note: null,
        status: "closed",
      },
      {
        field: "zeta",
        source_value: 5,
        target_value: 0.84,
        mapping_type: "audit_harness_override",
        mapping_formula: null,
        mapping_note: "harness",
        status: "closed",
      },
      {
        field: "fullHull.Lx_m/Ly_m/Lz_m -> dims",
        source_value: { Lx_m: 1.1, Ly_m: 1.1, Lz_m: 1.1 },
        target_value: "48x48x48",
        mapping_type: "audit_harness_override",
        mapping_formula: null,
        mapping_note: "harness",
        status: "closed",
      },
      {
        field: "sectorCount",
        source_value: 80,
        target_value: null,
        mapping_type: "missing_derivation",
        mapping_formula: null,
        mapping_note: "missing",
        status: "open",
      },
      {
        field: "modulationFreq_GHz",
        source_value: 15,
        target_value: null,
        mapping_type: "missing_derivation",
        mapping_formula: null,
        mapping_note: "missing",
        status: "open",
      },
    ],
    bridgeReadiness: {
      sourceContractPresent: true,
      timingAuthorityPresent: true,
      timingAuthorityStatus: "recognized_required_fields_present",
      timingAuthorityArtifactRecognized: true,
      timingAuthorityRequiredFields: ["tauLC_ms", "tauPulse_ms", "TS_ratio"],
      timingAuthorityOptionalMissingFields: [],
      reducedOrderPayloadPresent: true,
      proofPackBrickPresent: true,
      parameterMappingsComplete: false,
      parameterMappingsExplained: false,
      metricRefProvenanceClosed: true,
      bridgeReady: false,
      gatingStatus: "legacy_advisory_non_gating",
      gatingBlocksMechanismChain: false,
      statusNote: "Legacy bridge completeness remains open, but it is non-gating.",
      blockReasons: [
        "bridge_param_mapping_missing",
        "bridge_contract_to_brick_drift_unexplained",
      ],
      bridgeOpenFieldCount: 2,
      bridgeClosedFieldCount: 13,
      openFields: ["sectorCount", "modulationFreq_GHz"],
      closedFields: [
        "sourceContract",
        "timingAuthority.required_fields",
        "reducedOrderPipelinePayload",
        "proofPackBrickRequest",
        "metricRefProvenance",
        "warpFieldType -> metricT00Ref",
        "dutyShip -> dutyFR",
        "qCavity -> q",
        "qSpoilingFactor -> q",
        "gammaGeo",
        "gammaVanDenBroeck -> gammaVdB",
        "zeta",
        "fullHull.Lx_m/Ly_m/Lz_m -> dims",
      ],
      residualBlockingReasons: [
        "bridge_param_mapping_missing",
        "bridge_contract_to_brick_drift_unexplained",
      ],
      residualAdvisoryReasons: [],
      closureCandidateStatus: "closable_with_current_serialization",
      bridgeClosurePolicy: "close_with_current_serialization",
    },
    notes: [],
    checksum: "source-to-york-checksum",
  }) as any;

const writeTinyPng = async (
  filePath: string,
  color: { r: number; g: number; b: number; alpha?: number },
) => {
  await sharp({
    create: {
      width: 24,
      height: 24,
      channels: 4,
      background: {
        r: color.r,
        g: color.g,
        b: color.b,
        alpha: color.alpha ?? 1,
      },
    },
  })
    .png()
    .toFile(filePath);
};

const makeRenderTaxonomyMetadataFixture = (args: {
  renderId: string;
  renderCategory: string;
  renderRole: string;
  authoritativeStatus: string;
  primaryScientificQuestion: string;
  fieldId: string;
  variant: string;
  canonicalPath: string;
  baseImagePolicy: string;
  baseImageSource: string;
  inheritsTransportContext: boolean;
  contextCompositionMode: string;
  title: string;
  subtitle: string;
  quantitySymbol: string;
  quantityUnits: string;
  observer?: string;
  foliation?: string;
  signConvention: string;
  laneId?: string | null;
  displayPolicyId?: string | null;
  displayRangeMin?: number | null;
  displayRangeMax?: number | null;
  displayTransform?: string | null;
  colormapFamily?: string | null;
  cameraPoseId?: string | null;
}) =>
  ({
    renderId: args.renderId,
    renderCategory: args.renderCategory,
    renderRole: args.renderRole,
    authoritativeStatus: args.authoritativeStatus,
    primaryScientificQuestion: args.primaryScientificQuestion,
    fieldId: args.fieldId,
    variant: args.variant,
    canonicalPath: args.canonicalPath,
    legacyPath: args.canonicalPath,
    baseImagePolicy: args.baseImagePolicy,
    baseImageSource: args.baseImageSource,
    inheritsTransportContext: args.inheritsTransportContext,
    contextCompositionMode: args.contextCompositionMode,
    frameLabel: {
      title: args.title,
      subtitle: args.subtitle,
      quantitySymbol: args.quantitySymbol,
      quantityUnits: args.quantityUnits,
      observer: args.observer ?? "eulerian_n",
      foliation: args.foliation ?? "comoving_cartesian_3p1",
      signConvention: args.signConvention,
      laneId: args.laneId ?? "lane_a_eulerian_comoving_theta_minus_trk",
      displayPolicyId: args.displayPolicyId ?? null,
      displayRangeMin: args.displayRangeMin ?? null,
      displayRangeMax: args.displayRangeMax ?? null,
      displayTransform: args.displayTransform ?? null,
      colormapFamily: args.colormapFamily ?? null,
      cameraPoseId: args.cameraPoseId ?? null,
      orientationConventionId: "x_ship_y_port_z_zenith",
      axisLabels: {
        x: "x_ship",
        y: "y_port",
        z: "z_zenith",
      },
    },
  }) as any;

const makeShiftRenderEntryFixture = (args: {
  caseId: "flat_space_zero_theta" | "natario_control" | "alcubierre_control" | "nhm2_certified";
  caseLabel: string;
  fieldId: string;
  variant: string;
  renderCategory: string;
  renderRole: string;
  authoritativeStatus: string;
  mechanismFamily: string;
  imagePath: string;
  imageHash: string;
  primaryScientificQuestion: string;
  title: string;
  quantitySymbol: string;
  quantityUnits: string;
  signConvention: string;
  displayPolicyId?: string | null;
  displayRangeMin?: number | null;
  displayRangeMax?: number | null;
  displayTransform?: string | null;
  colormapFamily?: string | null;
  cameraPoseId?: string | null;
  baseImagePolicy: string;
  baseImageSource: string;
  inheritsTransportContext: boolean;
  contextCompositionMode: string;
  referenceCaseId?: "natario_control" | "alcubierre_control" | null;
  fieldMin?: number | null;
  fieldMax?: number | null;
  fieldAbsMax?: number | null;
  presentationScalarFieldHash?: string | null;
  directionVectorFieldHash?: string | null;
  streamSeedHash?: string | null;
  streamGeometryHash?: string | null;
  directionOverlayHash?: string | null;
  directionOverlayStatus?: string | null;
  directionOverlayWarnings?: string[];
  note: string;
}) => {
  const canonicalPath = path.join(
    "artifacts",
    "research",
    "full-solve",
    "rendered",
    args.renderCategory,
    "2026-03-31",
    path.basename(args.imagePath),
  );
  const renderId = [
    args.caseId,
    args.referenceCaseId ?? "none",
    args.fieldId,
    args.variant,
  ].join(":");
  return {
    renderId,
    caseId: args.caseId,
    referenceCaseId: args.referenceCaseId ?? null,
    mechanismFamily: args.mechanismFamily,
    renderCategory: args.renderCategory,
    renderRole: args.renderRole,
    authoritativeStatus: args.authoritativeStatus,
    primaryScientificQuestion: args.primaryScientificQuestion,
    fieldId: args.fieldId,
    variant: args.variant,
    canonicalPath,
    legacyPath: canonicalPath,
    title: `${args.title} - ${args.caseLabel}`,
    subtitle: `observer=eulerian_n | foliation=comoving_cartesian_3p1 | lane=lane_a_eulerian_comoving_theta_minus_trk | sign=${args.signConvention} | transform=${args.displayTransform ?? "none"}`,
    quantitySymbol: args.quantitySymbol,
    quantityUnits: args.quantityUnits,
    observer: "eulerian_n",
    foliation: "comoving_cartesian_3p1",
    signConvention: args.signConvention,
    laneId: "lane_a_eulerian_comoving_theta_minus_trk",
    displayPolicyId: args.displayPolicyId ?? null,
    displayRangeMin: args.displayRangeMin ?? null,
    displayRangeMax: args.displayRangeMax ?? null,
    displayTransform: args.displayTransform ?? null,
    colormapFamily: args.colormapFamily ?? null,
    cameraPoseId: args.cameraPoseId ?? null,
    orientationConventionId: "x_ship_y_port_z_zenith",
    baseImagePolicy: args.baseImagePolicy,
    baseImageSource: args.baseImageSource,
    inheritsTransportContext: args.inheritsTransportContext,
    contextCompositionMode: args.contextCompositionMode,
    imagePath: args.imagePath,
    imageHash: args.imageHash,
    metricVolumeHash: `${args.caseId}-metric-volume-hash`,
    thetaHash: `${args.caseId}-theta-hash`,
    kTraceHash: `${args.caseId}-ktrace-hash`,
    laneAFieldHash: `${args.caseId}-lane-a-field-hash`,
    presentationScalarFieldHash: args.presentationScalarFieldHash ?? `${renderId}-scalar-hash`,
    directionVectorFieldHash: args.directionVectorFieldHash ?? null,
    streamSeedHash: args.streamSeedHash ?? null,
    streamGeometryHash: args.streamGeometryHash ?? null,
    directionOverlayHash: args.directionOverlayHash ?? null,
    directionOverlayStatus: args.directionOverlayStatus ?? null,
    directionOverlayWarnings: args.directionOverlayWarnings ?? [],
    fieldMin: args.fieldMin ?? null,
    fieldMax: args.fieldMax ?? null,
    fieldAbsMax: args.fieldAbsMax ?? null,
    renderTaxonomy: makeRenderTaxonomyMetadataFixture({
      renderId,
      renderCategory: args.renderCategory,
      renderRole: args.renderRole,
      authoritativeStatus: args.authoritativeStatus,
      primaryScientificQuestion: args.primaryScientificQuestion,
      fieldId: args.fieldId,
      variant: args.variant,
      canonicalPath,
      baseImagePolicy: args.baseImagePolicy,
      baseImageSource: args.baseImageSource,
      inheritsTransportContext: args.inheritsTransportContext,
      contextCompositionMode: args.contextCompositionMode,
      title: `${args.title} - ${args.caseLabel}`,
      subtitle: `observer=eulerian_n | foliation=comoving_cartesian_3p1 | lane=lane_a_eulerian_comoving_theta_minus_trk | sign=${args.signConvention} | transform=${args.displayTransform ?? "none"}`,
      quantitySymbol: args.quantitySymbol,
      quantityUnits: args.quantityUnits,
      signConvention: args.signConvention,
      displayPolicyId: args.displayPolicyId ?? null,
      displayRangeMin: args.displayRangeMin ?? null,
      displayRangeMax: args.displayRangeMax ?? null,
      displayTransform: args.displayTransform ?? null,
      colormapFamily: args.colormapFamily ?? null,
      cameraPoseId: args.cameraPoseId ?? null,
    }),
    warnings: [],
    note: args.note,
  } as any;
};

const makeCanonicalVisualComparisonFixtures = async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "canonical-visual-comparison-"));
  const caseIds = [
    "flat_space_zero_theta",
    "natario_control",
    "alcubierre_control",
    "nhm2_certified",
  ] as const;
  const colors = {
    flat_space_zero_theta: { r: 210, g: 214, b: 220 },
    natario_control: { r: 50, g: 130, b: 190 },
    alcubierre_control: { r: 190, g: 90, b: 70 },
    nhm2_certified: { r: 110, g: 140, b: 110 },
  } as const;
  for (const caseId of caseIds) {
    await writeTinyPng(path.join(tempDir, `${caseId}-diag.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-main.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-atlas.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-long.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-tracefree.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-rho.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-trace.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-beta-mag.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-beta-x.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-beta-mag-slice.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-beta-x-slice.png`), colors[caseId]);
    await writeTinyPng(path.join(tempDir, `${caseId}-beta-direction-xz.png`), colors[caseId]);
  }
  for (const fieldId of ["kretschmann", "ricci4", "ricci2", "weylI"] as const) {
    await writeTinyPng(path.join(tempDir, `nhm2_certified-${fieldId}.png`), colors.nhm2_certified);
    await writeTinyPng(
      path.join(tempDir, `nhm2_certified-${fieldId}-slice.png`),
      colors.nhm2_certified,
    );
  }
  await writeTinyPng(path.join(tempDir, `nhm2-natario-beta-mag-residual.png`), {
    r: 120,
    g: 90,
    b: 150,
  });
  await writeTinyPng(path.join(tempDir, `nhm2-natario-beta-x-residual.png`), {
    r: 90,
    g: 140,
    b: 150,
  });
  await writeTinyPng(path.join(tempDir, `nhm2-alcubierre-beta-mag-residual.png`), {
    r: 160,
    g: 100,
    b: 110,
  });
  await writeTinyPng(path.join(tempDir, `nhm2-alcubierre-beta-x-residual.png`), {
    r: 110,
    g: 110,
    b: 160,
  });
  const canonicalCalibrationArtifact = {
    comparisonContract: {
      laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
      observer: "eulerian_n",
      foliation: "comoving_cartesian_3p1",
      thetaDefinition: "theta=-trK",
      signConvention: "ADM",
      fixedScalePolicy: "comparison_fixed_raw_global",
      visualMetricSourceStage: "pre_png_color_buffer",
      outputSize: { width: 320, height: 180 },
      requiredViews: [
        "york-surface-3p1",
        "york-surface-rho-3p1",
        "york-topology-normalized-3p1",
      ],
    },
    nhm2CurrentClass: "natario_like_low_expansion",
    decisionGate: {
      calibration_verdict: "canonical_controls_validated_nhm2_natario_like",
    },
    canonicalCases: caseIds.map((caseId) => ({
      case_id: caseId,
      label:
        caseId === "flat_space_zero_theta"
          ? "Flat-space zero-theta baseline"
          : caseId === "natario_control"
            ? "Natario-like control"
            : caseId === "alcubierre_control"
              ? "Alcubierre-like control"
              : "NHM2 certified snapshot",
      case_role:
        caseId === "flat_space_zero_theta"
          ? "zero_baseline"
          : caseId === "nhm2_certified"
            ? "nhm2_current"
            : "canonical_control",
      views: [
        {
          case_id: caseId,
          view_id: "york-surface-3p1",
          png_path: path.join(tempDir, `${caseId}-diag.png`),
          png_hash: `${caseId}-diag-hash`,
        },
        {
          case_id: caseId,
          view_id: "york-surface-rho-3p1",
          png_path: path.join(tempDir, `${caseId}-diag.png`),
          png_hash: `${caseId}-rho-hash`,
        },
        {
          case_id: caseId,
          view_id: "york-topology-normalized-3p1",
          png_path: path.join(tempDir, `${caseId}-diag.png`),
          png_hash: `${caseId}-topo-hash`,
        },
      ],
    })),
    pairwiseMetrics: [
      {
        lhs_case_id: "nhm2_certified",
        rhs_case_id: "natario_control",
        raw_control_distance: 0.0012,
        views: [
          {
            view_id: "york-surface-3p1",
            metric_source_stage: "pre_png_color_buffer",
            pixel_rms: 0.0003,
            mean_absolute_pixel_difference: 0.0002,
            changed_pixel_fraction: 0.12,
            diff_abs_max: 0.01,
          },
        ],
      },
      {
        lhs_case_id: "nhm2_certified",
        rhs_case_id: "alcubierre_control",
        raw_control_distance: 0.135,
        views: [
          {
            view_id: "york-surface-3p1",
            metric_source_stage: "pre_png_color_buffer",
            pixel_rms: 0.0007,
            mean_absolute_pixel_difference: 0.0005,
            changed_pixel_fraction: 0.31,
            diff_abs_max: 0.03,
          },
        ],
      },
      {
        lhs_case_id: "natario_control",
        rhs_case_id: "alcubierre_control",
        raw_control_distance: 0.136,
        views: [
          {
            view_id: "york-surface-3p1",
            metric_source_stage: "pre_png_color_buffer",
            pixel_rms: 0.001,
            mean_absolute_pixel_difference: 0.0008,
            changed_pixel_fraction: 0.36,
            diff_abs_max: 0.05,
          },
        ],
      },
      {
        lhs_case_id: "flat_space_zero_theta",
        rhs_case_id: "natario_control",
        raw_control_distance: 0.77,
        views: [
          {
            view_id: "york-surface-3p1",
            metric_source_stage: "pre_png_color_buffer",
            pixel_rms: 0.014,
            mean_absolute_pixel_difference: 0.01,
            changed_pixel_fraction: 0.8,
            diff_abs_max: 1,
          },
        ],
      },
      {
        lhs_case_id: "flat_space_zero_theta",
        rhs_case_id: "alcubierre_control",
        raw_control_distance: 0.776,
        views: [
          {
            view_id: "york-surface-3p1",
            metric_source_stage: "pre_png_color_buffer",
            pixel_rms: 0.013,
            mean_absolute_pixel_difference: 0.01,
            changed_pixel_fraction: 0.8,
            diff_abs_max: 1,
          },
        ],
      },
      {
        lhs_case_id: "flat_space_zero_theta",
        rhs_case_id: "nhm2_certified",
        raw_control_distance: 0.776,
        views: [
          {
            view_id: "york-surface-3p1",
            metric_source_stage: "pre_png_color_buffer",
            pixel_rms: 0.014,
            mean_absolute_pixel_difference: 0.01,
            changed_pixel_fraction: 0.8,
            diff_abs_max: 1,
          },
        ],
      },
    ],
  } as any;
  const optixRenderArtifact = {
    presentationRenderLayerStatus: "available",
    fieldSuiteRealizationStatus: "realized",
    fieldSuiteReadabilityStatus: "readable",
    presentationRenderQuality: "ok",
    presentationReadinessVerdict: "ready_for_human_inspection",
    presentationRenderBackedByAuthoritativeMetric: true,
    comparisonContract: {
      laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
      observer: "eulerian_n",
      foliation: "comoving_cartesian_3p1",
      signConvention: "ADM",
    },
    caseRenders: caseIds.map((caseId) => ({
      case_id: caseId,
      label: caseId,
      case_role:
        caseId === "flat_space_zero_theta"
          ? "zero_baseline"
          : caseId === "nhm2_certified"
            ? "nhm2_current"
            : "canonical_control",
      contextRenders: [
        {
          renderView: "transport-3p1",
          imagePath: path.join(tempDir, `${caseId}-main.png`),
          baseImagePolicy: "native_renderer_output",
          baseImageSource: "native_renderer",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
        },
        {
          renderView: "full-atlas",
          imagePath: path.join(tempDir, `${caseId}-atlas.png`),
          baseImagePolicy: "native_renderer_output",
          baseImageSource: "native_renderer",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
        },
      ],
      fieldRenders: [
        {
          presentationFieldId: "beta_magnitude",
          variant: "main",
          label: "Shift magnitude",
          imagePath: path.join(tempDir, `${caseId}-beta-mag.png`),
          presentationProjectionImageHash: `${caseId}-beta-mag-hash`,
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: 0,
          fieldMax: 0.05,
          fieldAbsMax: 0.05,
          displayPolicyId: "optix_beta_magnitude_positive_log10",
          displayRangeMin: 0,
          displayRangeMax: 0.05,
          displayTransform: "positive_log10",
          colormapFamily: "sequential_inferno",
          warnings: [],
        },
        {
          presentationFieldId: "beta_x",
          variant: "main",
          label: "Ship-axis shift component",
          imagePath: path.join(tempDir, `${caseId}-beta-x.png`),
          presentationProjectionImageHash: `${caseId}-beta-x-hash`,
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: -0.03,
          fieldMax: 0.03,
          fieldAbsMax: 0.03,
          displayPolicyId: "optix_beta_x_signed_asinh",
          displayRangeMin: -0.03,
          displayRangeMax: 0.03,
          displayTransform: "signed_asinh",
          colormapFamily: "diverging_cyan_amber",
          warnings: [],
        },
        {
          presentationFieldId: "longitudinal_signed_strain",
          variant: "main",
          label: "Longitudinal signed strain",
          imagePath: path.join(tempDir, `${caseId}-long.png`),
          presentationProjectionImageHash: `${caseId}-long-hash`,
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: -0.1,
          fieldMax: 0.1,
          fieldAbsMax: 0.1,
          displayPolicyId: "optix_longitudinal_signed_strain_signed_asinh",
          displayRangeMin: -0.08,
          displayRangeMax: 0.08,
          displayTransform: "signed_asinh",
          colormapFamily: "diverging_cyan_amber",
          warnings: [],
        },
        {
          presentationFieldId: "tracefree_magnitude",
          variant: "main",
          label: "Tracefree magnitude",
          imagePath: path.join(tempDir, `${caseId}-tracefree.png`),
          presentationProjectionImageHash: `${caseId}-tracefree-hash`,
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: 0,
          fieldMax: 0.01,
          fieldAbsMax: 0.01,
          displayPolicyId: "optix_tracefree_magnitude_positive_log10",
          displayRangeMin: 0,
          displayRangeMax: 0.01,
          displayTransform: "positive_log10",
          colormapFamily: "sequential_inferno",
          warnings: [],
        },
        {
          presentationFieldId: "energy_density",
          variant: "main",
          label: "Energy density",
          imagePath: path.join(tempDir, `${caseId}-rho.png`),
          presentationProjectionImageHash: `${caseId}-rho-hash`,
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: -0.02,
          fieldMax: 0.02,
          fieldAbsMax: 0.02,
          displayPolicyId: "optix_energy_density_signed_asinh",
          displayRangeMin: -0.02,
          displayRangeMax: 0.02,
          displayTransform: "signed_asinh",
          colormapFamily: "diverging_teal_rose",
          warnings: [],
        },
        {
          presentationFieldId: "trace_check",
          variant: "main",
          label: "Trace check",
          imagePath: path.join(tempDir, `${caseId}-trace.png`),
          presentationProjectionImageHash: `${caseId}-trace-hash`,
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: -0.03,
          fieldMax: 0.03,
          fieldAbsMax: 0.03,
          displayPolicyId: "optix_trace_check_signed_linear_anchor",
          displayRangeMin: -0.03,
          displayRangeMax: 0.03,
          displayTransform: "signed_linear",
          colormapFamily: "diverging_cyan_amber",
          warnings: [],
        },
        ...(caseId === "nhm2_certified"
          ? ([
              {
                presentationFieldId: "kretschmann",
                variant: "main",
                label: "Kretschmann scalar",
                imagePath: path.join(tempDir, `${caseId}-kretschmann.png`),
                presentationProjectionImageHash: `${caseId}-kretschmann-hash`,
                laneId: "lane_a_eulerian_comoving_theta_minus_trk",
                baseImagePolicy: "neutral_field_canvas",
                baseImageSource: "none",
                inheritsTransportContext: false,
                contextCompositionMode: "none",
                fieldMin: 0,
                fieldMax: 0.012,
                fieldAbsMax: 0.012,
                displayPolicyId: "optix_kretschmann_positive_log10",
                displayRangeMin: 0,
                displayRangeMax: 0.012,
                displayTransform: "positive_log10",
                colormapFamily: "sequential_inferno",
                warnings: [],
              },
              {
                presentationFieldId: "ricci4",
                variant: "main",
                label: "Ricci scalar (4D)",
                imagePath: path.join(tempDir, `${caseId}-ricci4.png`),
                presentationProjectionImageHash: `${caseId}-ricci4-hash`,
                laneId: "lane_a_eulerian_comoving_theta_minus_trk",
                baseImagePolicy: "neutral_field_canvas",
                baseImageSource: "none",
                inheritsTransportContext: false,
                contextCompositionMode: "none",
                fieldMin: -0.01,
                fieldMax: 0.01,
                fieldAbsMax: 0.01,
                displayPolicyId: "optix_ricci4_signed_asinh",
                displayRangeMin: -0.01,
                displayRangeMax: 0.01,
                displayTransform: "signed_asinh",
                colormapFamily: "diverging_teal_rose",
                warnings: [],
              },
              {
                presentationFieldId: "ricci2",
                variant: "main",
                label: "Ricci contraction",
                imagePath: path.join(tempDir, `${caseId}-ricci2.png`),
                presentationProjectionImageHash: `${caseId}-ricci2-hash`,
                laneId: "lane_a_eulerian_comoving_theta_minus_trk",
                baseImagePolicy: "neutral_field_canvas",
                baseImageSource: "none",
                inheritsTransportContext: false,
                contextCompositionMode: "none",
                fieldMin: -0.008,
                fieldMax: 0.008,
                fieldAbsMax: 0.008,
                displayPolicyId: "optix_ricci2_signed_asinh",
                displayRangeMin: -0.008,
                displayRangeMax: 0.008,
                displayTransform: "signed_asinh",
                colormapFamily: "diverging_teal_rose",
                warnings: [],
              },
              {
                presentationFieldId: "weylI",
                variant: "main",
                label: "Weyl contraction",
                imagePath: path.join(tempDir, `${caseId}-weylI.png`),
                presentationProjectionImageHash: `${caseId}-weylI-hash`,
                laneId: "lane_a_eulerian_comoving_theta_minus_trk",
                baseImagePolicy: "neutral_field_canvas",
                baseImageSource: "none",
                inheritsTransportContext: false,
                contextCompositionMode: "none",
                fieldMin: -0.015,
                fieldMax: 0.015,
                fieldAbsMax: 0.015,
                displayPolicyId: "optix_weylI_signed_asinh",
                displayRangeMin: -0.015,
                displayRangeMax: 0.015,
                displayTransform: "signed_asinh",
                colormapFamily: "diverging_teal_rose",
                warnings: [],
              },
            ] as any[])
          : []),
      ],
    })),
  } as any;
  const findFieldRender = (
    caseId: (typeof caseIds)[number],
    fieldId: string,
  ) =>
    optixRenderArtifact.caseRenders
      .find((entry: any) => entry.case_id === caseId)
      ?.fieldRenders.find((entry: any) => entry.presentationFieldId === fieldId) ?? null;
  const shiftGeometryRenderEntries = [
    ...caseIds.flatMap((caseId) => {
      const caseLabel =
        caseId === "flat_space_zero_theta"
          ? "Flat-space zero-theta baseline"
          : caseId === "natario_control"
            ? "Natario-like control"
            : caseId === "alcubierre_control"
              ? "Alcubierre-like control"
              : "NHM2 certified snapshot";
      return [
        makeShiftRenderEntryFixture({
          caseId,
          caseLabel,
          fieldId: "beta_magnitude",
          variant: "xz_slice_companion",
          renderCategory: "scientific_3p1_field",
          renderRole: "presentation",
          authoritativeStatus: "secondary_solve_backed",
          mechanismFamily: "shift_geometry",
          imagePath: path.join(tempDir, `${caseId}-beta-mag-slice.png`),
          imageHash: `${caseId}-beta-mag-slice-hash`,
          primaryScientificQuestion: "Where does the solved transport intensity live?",
          title: "Shift Magnitude Slice",
          quantitySymbol: "|beta|",
          quantityUnits: "geom",
          signConvention: "stored shift channels are contravariant beta^i",
          displayPolicyId: "optix_beta_magnitude_positive_log10",
          displayRangeMin: 0,
          displayRangeMax: 0.05,
          displayTransform: "positive_log10",
          colormapFamily: "sequential_inferno",
          cameraPoseId: "slice_x_z_midplane",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: 0,
          fieldMax: 0.05,
          fieldAbsMax: 0.05,
          note: "Solve-backed x-z slice companion on a neutral field canvas.",
        }),
        makeShiftRenderEntryFixture({
          caseId,
          caseLabel,
          fieldId: "beta_x",
          variant: "xz_slice_companion",
          renderCategory: "scientific_3p1_field",
          renderRole: "presentation",
          authoritativeStatus: "secondary_solve_backed",
          mechanismFamily: "shift_geometry",
          imagePath: path.join(tempDir, `${caseId}-beta-x-slice.png`),
          imageHash: `${caseId}-beta-x-slice-hash`,
          primaryScientificQuestion: "How does forward/back transport organize along x_ship?",
          title: "Ship-Axis Shift Slice",
          quantitySymbol: "beta^x",
          quantityUnits: "geom",
          signConvention: "stored shift channels are contravariant beta^i",
          displayPolicyId: "optix_beta_x_signed_asinh",
          displayRangeMin: -0.03,
          displayRangeMax: 0.03,
          displayTransform: "signed_asinh",
          colormapFamily: "diverging_cyan_amber",
          cameraPoseId: "slice_x_z_midplane",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          fieldMin: -0.03,
          fieldMax: 0.03,
          fieldAbsMax: 0.03,
          note: "Solve-backed ship-axis shift companion on a neutral field canvas.",
        }),
        makeShiftRenderEntryFixture({
          caseId,
          caseLabel,
          fieldId: "beta_direction_xz",
          variant: "stream_xz_hull_overlay",
          renderCategory: "mechanism_overlay",
          renderRole: "overlay",
          authoritativeStatus: "secondary_interpretive",
          mechanismFamily: "shift_geometry",
          imagePath: path.join(tempDir, `${caseId}-beta-direction-xz.png`),
          imageHash: `${caseId}-beta-direction-xz-hash`,
          primaryScientificQuestion:
            "Does the transport pattern look shell-localized and sliding/shear-like?",
          title: "Shift Direction",
          quantitySymbol: "arg(beta_x,beta_z)",
          quantityUnits: "direction",
          signConvention: "stored shift channels are contravariant beta^i",
          displayPolicyId: "shift_direction_stream_xz",
          displayTransform: "vector_streamline",
          colormapFamily: "diverging_cyan_amber",
          cameraPoseId: "slice_x_z_midplane",
          baseImagePolicy: "field_plus_context_overlay",
          baseImageSource: "hull_mask",
          inheritsTransportContext: false,
          contextCompositionMode: "hull_overlay",
          directionVectorFieldHash: `${caseId}-beta-direction-vector-hash`,
          streamSeedHash: `${caseId}-beta-direction-seed-hash`,
          streamGeometryHash: `${caseId}-beta-direction-geometry-hash`,
          directionOverlayHash: `${caseId}-beta-direction-overlay-hash`,
          directionOverlayStatus:
            caseId === "flat_space_zero_theta"
              ? "case_specific_glyph_fallback"
              : "case_specific_streamlines",
          directionOverlayWarnings:
            caseId === "flat_space_zero_theta"
              ? ["direction_streamline_generation_degraded"]
              : [],
          fieldAbsMax: 0.05,
          note:
            caseId === "flat_space_zero_theta"
              ? "Shift-direction x-z overlay fell back to sparse case-specific direction glyphs with explicit hull/support context."
              : "Shift-direction x-z overlay with case-specific streamline geometry, explicit hull/support context, and no transport-context inheritance.",
        }),
      ];
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      referenceCaseId: "natario_control",
      fieldId: "beta_magnitude",
      variant: "residual_to_natario_control_xz",
      renderCategory: "mechanism_overlay",
      renderRole: "overlay",
      authoritativeStatus: "secondary_interpretive",
      mechanismFamily: "residual_to_control",
      imagePath: path.join(tempDir, "nhm2-natario-beta-mag-residual.png"),
      imageHash: "nhm2-natario-beta-mag-residual-hash",
      primaryScientificQuestion:
        "Where does NHM2 depart from the closest canonical family in shift magnitude?",
      title: "Shift Magnitude Residual",
      quantitySymbol: "Delta|beta|",
      quantityUnits: "geom",
      signConvention: "residual = NHM2 - natario_control",
      displayPolicyId: "shift_natario_control_beta_magnitude_residual_signed_asinh",
      displayRangeMin: -0.01,
      displayRangeMax: 0.01,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_teal_rose",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.01,
      fieldMax: 0.01,
      fieldAbsMax: 0.01,
      note: "NHM2 minus Natario shift-magnitude residual.",
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      referenceCaseId: "natario_control",
      fieldId: "beta_x",
      variant: "residual_to_natario_control_xz",
      renderCategory: "mechanism_overlay",
      renderRole: "overlay",
      authoritativeStatus: "secondary_interpretive",
      mechanismFamily: "residual_to_control",
      imagePath: path.join(tempDir, "nhm2-natario-beta-x-residual.png"),
      imageHash: "nhm2-natario-beta-x-residual-hash",
      primaryScientificQuestion:
        "Where does NHM2 depart from the closest canonical family in ship-axis transport?",
      title: "Ship-Axis Shift Residual",
      quantitySymbol: "Delta beta^x",
      quantityUnits: "geom",
      signConvention: "residual = NHM2 - natario_control",
      displayPolicyId: "shift_natario_control_beta_x_residual_signed_asinh",
      displayRangeMin: -0.01,
      displayRangeMax: 0.01,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_cyan_amber",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.01,
      fieldMax: 0.01,
      fieldAbsMax: 0.01,
      note: "NHM2 minus Natario ship-axis shift residual.",
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      referenceCaseId: "alcubierre_control",
      fieldId: "beta_magnitude",
      variant: "residual_to_alcubierre_control_xz",
      renderCategory: "mechanism_overlay",
      renderRole: "overlay",
      authoritativeStatus: "secondary_interpretive",
      mechanismFamily: "residual_to_control",
      imagePath: path.join(tempDir, "nhm2-alcubierre-beta-mag-residual.png"),
      imageHash: "nhm2-alcubierre-beta-mag-residual-hash",
      primaryScientificQuestion:
        "Where does NHM2 differ from Alcubierre-like transport structure in shift magnitude?",
      title: "Shift Magnitude Residual",
      quantitySymbol: "Delta|beta|",
      quantityUnits: "geom",
      signConvention: "residual = NHM2 - alcubierre_control",
      displayPolicyId: "shift_alcubierre_control_beta_magnitude_residual_signed_asinh",
      displayRangeMin: -0.02,
      displayRangeMax: 0.02,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_teal_rose",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.02,
      fieldMax: 0.02,
      fieldAbsMax: 0.02,
      note: "NHM2 minus Alcubierre shift-magnitude residual.",
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      referenceCaseId: "alcubierre_control",
      fieldId: "beta_x",
      variant: "residual_to_alcubierre_control_xz",
      renderCategory: "mechanism_overlay",
      renderRole: "overlay",
      authoritativeStatus: "secondary_interpretive",
      mechanismFamily: "residual_to_control",
      imagePath: path.join(tempDir, "nhm2-alcubierre-beta-x-residual.png"),
      imageHash: "nhm2-alcubierre-beta-x-residual-hash",
      primaryScientificQuestion:
        "Where does NHM2 differ from Alcubierre-like transport structure in ship-axis transport?",
      title: "Ship-Axis Shift Residual",
      quantitySymbol: "Delta beta^x",
      quantityUnits: "geom",
      signConvention: "residual = NHM2 - alcubierre_control",
      displayPolicyId: "shift_alcubierre_control_beta_x_residual_signed_asinh",
      displayRangeMin: -0.02,
      displayRangeMax: 0.02,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_cyan_amber",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.02,
      fieldMax: 0.02,
      fieldAbsMax: 0.02,
      note: "NHM2 minus Alcubierre ship-axis shift residual.",
    }),
  ];
  const shiftGeometryArtifact = {
    artifactType: "nhm2_shift_geometry_visualization/v1",
    generatedOn: "2026-03-31",
    generatedAt: "2026-03-31T00:00:00.000Z",
    boundaryStatement:
      "This artifact adds a solve-backed shift-geometry visualization suite for NHM2 while keeping Lane A diagnostics as the authoritative proof surface.",
    sourceAuditArtifactPath: "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    canonicalCalibrationArtifactPath:
      "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
    optixRenderArtifactPath: "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
    shiftGeometryStatus: "available",
    caseSet: [...caseIds],
    shiftConvention: {
      storedShiftComponent: "beta^i",
      betaXDefinition: "beta^x",
      betaMagnitudeDefinition: "|beta| = sqrt(gamma_ij beta^i beta^j)",
      observer: "eulerian_n",
      foliation: "comoving_cartesian_3p1",
      laneId: "lane_a_eulerian_comoving_theta_minus_trk",
      signConvention: "stored shift channels are contravariant beta^i in the comoving Cartesian chart",
    },
    renderEntries: shiftGeometryRenderEntries,
    fieldSummaries: caseIds.map((caseId) => ({
      caseId,
      label:
        caseId === "flat_space_zero_theta"
          ? "Flat-space zero-theta baseline"
          : caseId === "natario_control"
            ? "Natario-like control"
            : caseId === "alcubierre_control"
              ? "Alcubierre-like control"
              : "NHM2 certified snapshot",
      metricVolumeHash: `${caseId}-metric-volume-hash`,
      laneAFieldHash: `${caseId}-lane-a-field-hash`,
      betaMagnitudeMain: {
        presentationFieldId: "beta_magnitude",
        label: "Shift magnitude",
        imagePath: findFieldRender(caseId, "beta_magnitude")?.imagePath ?? null,
        imageHash: findFieldRender(caseId, "beta_magnitude")?.presentationProjectionImageHash ?? null,
        laneId: "lane_a_eulerian_comoving_theta_minus_trk",
        baseImagePolicy: "neutral_field_canvas",
        baseImageSource: "none",
        inheritsTransportContext: false,
        contextCompositionMode: "none",
        fieldMin: 0,
        fieldMax: 0.05,
        fieldAbsMax: 0.05,
        displayPolicyId: "optix_beta_magnitude_positive_log10",
        displayRangeMin: 0,
        displayRangeMax: 0.05,
        displayTransform: "positive_log10",
        colormapFamily: "sequential_inferno",
        warnings: [],
        renderTaxonomy: null,
      },
      betaMagnitudeSliceCompanion:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_magnitude" &&
            entry.variant === "xz_slice_companion",
        )?.renderTaxonomy ?? null,
      betaXMain: {
        presentationFieldId: "beta_x",
        label: "Ship-axis shift component",
        imagePath: findFieldRender(caseId, "beta_x")?.imagePath ?? null,
        imageHash: findFieldRender(caseId, "beta_x")?.presentationProjectionImageHash ?? null,
        laneId: "lane_a_eulerian_comoving_theta_minus_trk",
        baseImagePolicy: "neutral_field_canvas",
        baseImageSource: "none",
        inheritsTransportContext: false,
        contextCompositionMode: "none",
        fieldMin: -0.03,
        fieldMax: 0.03,
        fieldAbsMax: 0.03,
        displayPolicyId: "optix_beta_x_signed_asinh",
        displayRangeMin: -0.03,
        displayRangeMax: 0.03,
        displayTransform: "signed_asinh",
        colormapFamily: "diverging_cyan_amber",
        warnings: [],
        renderTaxonomy: null,
      },
      betaXSliceCompanion:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_x" &&
            entry.variant === "xz_slice_companion",
        )?.renderTaxonomy ?? null,
      betaDirectionXZ:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_direction_xz",
        )?.renderTaxonomy ?? null,
      betaDirectionXZStatus:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_direction_xz",
        )?.directionOverlayStatus ?? null,
      betaDirectionXZWarnings:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_direction_xz",
        )?.directionOverlayWarnings ?? [],
      betaDirectionXZVectorFieldHash:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_direction_xz",
        )?.directionVectorFieldHash ?? null,
      betaDirectionXZImageHash:
        shiftGeometryRenderEntries.find(
          (entry) =>
            entry.caseId === caseId &&
            entry.fieldId === "beta_direction_xz",
        )?.imageHash ?? null,
    })),
    residualSummaries: [
      {
        referenceCaseId: "natario_control",
        referenceLabel: "Natario-like control",
        betaMagnitudeResidual:
          shiftGeometryRenderEntries.find(
            (entry) =>
              entry.referenceCaseId === "natario_control" &&
              entry.fieldId === "beta_magnitude",
          )?.renderTaxonomy ?? null,
        betaXResidual:
          shiftGeometryRenderEntries.find(
            (entry) =>
              entry.referenceCaseId === "natario_control" &&
              entry.fieldId === "beta_x",
          )?.renderTaxonomy ?? null,
        betaMagnitudeResidualAbsMax: 0.01,
        betaXResidualAbsMax: 0.01,
      },
      {
        referenceCaseId: "alcubierre_control",
        referenceLabel: "Alcubierre-like control",
        betaMagnitudeResidual:
          shiftGeometryRenderEntries.find(
            (entry) =>
              entry.referenceCaseId === "alcubierre_control" &&
              entry.fieldId === "beta_magnitude",
          )?.renderTaxonomy ?? null,
        betaXResidual:
          shiftGeometryRenderEntries.find(
            (entry) =>
              entry.referenceCaseId === "alcubierre_control" &&
              entry.fieldId === "beta_x",
          )?.renderTaxonomy ?? null,
        betaMagnitudeResidualAbsMax: 0.02,
        betaXResidualAbsMax: 0.02,
      },
    ],
    directionOverlayStatus: "available",
    directionOverlayWarnings: ["direction_streamline_generation_degraded"],
    directionOverlayCaseDistinctness: "distinct_across_cases",
    directionOverlayInterpretationPolicy:
      "normalize_non_material_internal_variance_after_sampled_field_match",
    directionOverlayPairwiseComparisons: [],
    constraintContextStatus: "deferred_units_and_policy_unresolved",
    recommendedInterpretationOrder: [
      "beta_magnitude",
      "beta_x",
      "beta_direction_xz",
      "nhm2_minus_natario_beta_residual",
      "nhm2_minus_alcubierre_beta_residual",
      "linecuts_deferred_pending_probe_family",
    ],
    lineCutStatus: "deferred_pending_probe_family",
    renderTaxonomy: null,
    notes: [
      "diagnostic_lane_a_remains_primary=true",
      "shift_geometry_secondary_interpretive=true",
      "scientific_3p1_field shift frames remain on a neutral field canvas with no transport-context inheritance.",
    ],
    checksum: "shift-geometry-checksum",
  } as any;
  const fixedScaleComparisonArtifact = {
    fixed_scale_render_verdict: "shared_scale_preserves_natario_like_class",
    nhm2_vs_natario_visual_distance: { pixel_rms: 0.0003 },
    nhm2_vs_alcubierre_visual_distance: { pixel_rms: 0.0007 },
  } as any;
  const curvatureInvariantRenderEntries = [
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      fieldId: "kretschmann",
      variant: "xz_slice_companion",
      renderCategory: "scientific_3p1_field",
      renderRole: "presentation",
      authoritativeStatus: "secondary_solve_backed",
      mechanismFamily: "curvature_invariant_suite",
      imagePath: path.join(tempDir, "nhm2_certified-kretschmann-slice.png"),
      imageHash: "nhm2-kretschmann-slice-hash",
      primaryScientificQuestion:
        "Where does solved 4D curvature concentration localize in the NHM2 hull/body-fixed 3+1 frame?",
      title: "Kretschmann Slice",
      quantitySymbol: "R_abcd R^abcd",
      quantityUnits: "m^-4",
      signConvention:
        "ADM-compatible 4D curvature invariants on the comoving Cartesian snapshot; secondary scientific presentation only",
      displayPolicyId: "optix_kretschmann_positive_log10",
      displayRangeMin: 0,
      displayRangeMax: 0.012,
      displayTransform: "positive_log10",
      colormapFamily: "sequential_inferno",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: 0,
      fieldMax: 0.012,
      fieldAbsMax: 0.012,
      note:
        "Brick-native Kretschmann x-z slice companion. Rodal-inspired in style only, hull-aligned in repo-native 3+1 coordinates, and not an authoritative proof surface.",
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      fieldId: "ricci4",
      variant: "xz_slice_companion",
      renderCategory: "scientific_3p1_field",
      renderRole: "presentation",
      authoritativeStatus: "secondary_solve_backed",
      mechanismFamily: "curvature_invariant_suite",
      imagePath: path.join(tempDir, "nhm2_certified-ricci4-slice.png"),
      imageHash: "nhm2-ricci4-slice-hash",
      primaryScientificQuestion:
        "What signed 4D Ricci-scalar structure does the solved NHM2 snapshot exhibit in repo-native 3+1 frames?",
      title: "Ricci4 Slice",
      quantitySymbol: "R^(4)",
      quantityUnits: "m^-2",
      signConvention:
        "ADM-compatible 4D curvature invariants on the comoving Cartesian snapshot; secondary scientific presentation only",
      displayPolicyId: "optix_ricci4_signed_asinh",
      displayRangeMin: -0.01,
      displayRangeMax: 0.01,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_teal_rose",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.01,
      fieldMax: 0.01,
      fieldAbsMax: 0.01,
      note:
        "Brick-native Ricci4 x-z slice companion. Secondary scientific presentation only and not a morphology-verdict surface.",
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      fieldId: "ricci2",
      variant: "xz_slice_companion",
      renderCategory: "scientific_3p1_field",
      renderRole: "presentation",
      authoritativeStatus: "secondary_solve_backed",
      mechanismFamily: "curvature_invariant_suite",
      imagePath: path.join(tempDir, "nhm2_certified-ricci2-slice.png"),
      imageHash: "nhm2-ricci2-slice-hash",
      primaryScientificQuestion:
        "How does the brick-native Ricci contraction organize through the solved NHM2 3+1 volume without being promoted to proof status?",
      title: "Ricci2 Slice",
      quantitySymbol: "R_ab R^ab",
      quantityUnits: "m^-4",
      signConvention:
        "ADM-compatible 4D curvature invariants on the comoving Cartesian snapshot; secondary scientific presentation only",
      displayPolicyId: "optix_ricci2_signed_asinh",
      displayRangeMin: -0.008,
      displayRangeMax: 0.008,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_teal_rose",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.008,
      fieldMax: 0.008,
      fieldAbsMax: 0.008,
      note:
        "Brick-native Ricci2 x-z slice companion with sign preserved. Secondary scientific presentation only.",
    }),
    makeShiftRenderEntryFixture({
      caseId: "nhm2_certified",
      caseLabel: "NHM2 certified snapshot",
      fieldId: "weylI",
      variant: "xz_slice_companion",
      renderCategory: "scientific_3p1_field",
      renderRole: "presentation",
      authoritativeStatus: "secondary_solve_backed",
      mechanismFamily: "curvature_invariant_suite",
      imagePath: path.join(tempDir, "nhm2_certified-weylI-slice.png"),
      imageHash: "nhm2-weylI-slice-hash",
      primaryScientificQuestion:
        "Where does free-curvature structure appear in NHM2 when rendered as a secondary hull-aligned 3+1 scientific field?",
      title: "Weyl Slice",
      quantitySymbol: "C_abcd C^abcd",
      quantityUnits: "m^-4",
      signConvention:
        "ADM-compatible 4D curvature invariants on the comoving Cartesian snapshot; secondary scientific presentation only",
      displayPolicyId: "optix_weylI_signed_asinh",
      displayRangeMin: -0.015,
      displayRangeMax: 0.015,
      displayTransform: "signed_asinh",
      colormapFamily: "diverging_teal_rose",
      cameraPoseId: "slice_x_z_midplane",
      baseImagePolicy: "field_plus_context_overlay",
      baseImageSource: "hull_mask",
      inheritsTransportContext: false,
      contextCompositionMode: "hull_overlay",
      fieldMin: -0.015,
      fieldMax: 0.015,
      fieldAbsMax: 0.015,
      note:
        "Brick-native Weyl x-z slice companion. Rodal-inspired in style only and not a spherical-coordinate clone.",
    }),
  ];
  const curvatureInvariantArtifact = {
    artifactType: "nhm2_curvature_invariant_visualization/v1",
    generatedOn: "2026-03-31",
    generatedAt: "2026-03-31T00:00:00.000Z",
    boundaryStatement:
      "This artifact adds a Rodal-inspired NHM2 curvature-invariant inspection suite in repo-native hull/body-fixed 3+1 frames while keeping Lane A diagnostics as the authoritative proof surface.",
    sourceAuditArtifactPath: "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    canonicalCalibrationArtifactPath:
      "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
    optixRenderArtifactPath: "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
    caseId: "nhm2_certified",
    caseLabel: "NHM2 certified snapshot",
    suiteStatus: "available",
    observer: "eulerian_n",
    foliation: "comoving_cartesian_3p1",
    laneId: "lane_a_eulerian_comoving_theta_minus_trk",
    signConvention:
      "ADM-compatible 4D curvature invariants on the comoving Cartesian snapshot; secondary scientific presentation only",
    styleReference: {
      inspiration: "Jose Rodal (2024) invariant visual language",
      usagePolicy:
        "Use Rodal only as visualization/style inspiration. Do not relabel repo proof surfaces, do not imply literature authority, and do not clone spherical chart conventions.",
      notes: [
        "repo-native frame = comoving Cartesian 3+1 with hull/body-fixed slice conventions",
        "current suite is solve-backed secondary presentation, not a certified invariant proof lane",
      ],
    },
    renderEntries: curvatureInvariantRenderEntries,
    fieldSummaries: (["kretschmann", "ricci4", "ricci2", "weylI"] as const).map((fieldId) => ({
      fieldId,
      label:
        fieldId === "kretschmann"
          ? "Kretschmann scalar"
          : fieldId === "ricci4"
            ? "Ricci scalar (4D)"
            : fieldId === "ricci2"
              ? "Ricci contraction"
              : "Weyl contraction",
      quantitySymbol:
        fieldId === "kretschmann"
          ? "R_abcd R^abcd"
          : fieldId === "ricci4"
            ? "R^(4)"
            : fieldId === "ricci2"
              ? "R_ab R^ab"
              : "C_abcd C^abcd",
      quantityUnits: fieldId === "ricci4" ? "m^-2" : "m^-4",
      brickNative: true,
      solveBackedSecondary: true,
      crosscheckOnly: false,
      displayNormalization: "case_local_robust_scale_no_cross_case_matched_vertical_scale",
      displayPolicyId:
        findFieldRender("nhm2_certified", fieldId)?.displayPolicyId ??
        curvatureInvariantRenderEntries.find((entry) => entry.fieldId === fieldId)?.displayPolicyId ??
        null,
      displayTransform:
        findFieldRender("nhm2_certified", fieldId)?.displayTransform ??
        curvatureInvariantRenderEntries.find((entry) => entry.fieldId === fieldId)?.displayTransform ??
        null,
      colormapFamily:
        findFieldRender("nhm2_certified", fieldId)?.colormapFamily ??
        curvatureInvariantRenderEntries.find((entry) => entry.fieldId === fieldId)?.colormapFamily ??
        null,
      mainRender: {
        presentationFieldId: fieldId,
        label:
          findFieldRender("nhm2_certified", fieldId)?.label ??
          (fieldId === "kretschmann"
            ? "Kretschmann scalar"
            : fieldId === "ricci4"
              ? "Ricci scalar (4D)"
              : fieldId === "ricci2"
                ? "Ricci contraction"
                : "Weyl contraction"),
        imagePath: findFieldRender("nhm2_certified", fieldId)?.imagePath ?? null,
        imageHash:
          findFieldRender("nhm2_certified", fieldId)?.presentationProjectionImageHash ?? null,
        laneId: "lane_a_eulerian_comoving_theta_minus_trk",
        baseImagePolicy: "neutral_field_canvas",
        baseImageSource: "none",
        inheritsTransportContext: false,
        contextCompositionMode: "none",
        fieldMin: findFieldRender("nhm2_certified", fieldId)?.fieldMin ?? null,
        fieldMax: findFieldRender("nhm2_certified", fieldId)?.fieldMax ?? null,
        fieldAbsMax: findFieldRender("nhm2_certified", fieldId)?.fieldAbsMax ?? null,
        displayPolicyId: findFieldRender("nhm2_certified", fieldId)?.displayPolicyId ?? null,
        displayRangeMin: findFieldRender("nhm2_certified", fieldId)?.displayRangeMin ?? null,
        displayRangeMax: findFieldRender("nhm2_certified", fieldId)?.displayRangeMax ?? null,
        displayTransform: findFieldRender("nhm2_certified", fieldId)?.displayTransform ?? null,
        colormapFamily: findFieldRender("nhm2_certified", fieldId)?.colormapFamily ?? null,
        warnings: [],
        renderTaxonomy: null,
      },
      xzSliceCompanion:
        curvatureInvariantRenderEntries.find((entry) => entry.fieldId === fieldId)?.renderTaxonomy ??
        null,
      notes: [
        "brick-native invariant channel",
        "secondary scientific presentation only",
        "not a morphology verdict surface",
        "not a Rodal-spherical coordinate clone",
      ],
    })),
    invariantCrosscheckStatus: "unpopulated",
    momentumDensityStatus: "deferred_not_yet_first_class",
    renderTaxonomy: null,
    notes: [
      "diagnostic_lane_a_remains_primary=true",
      "curvature_invariant_suite_secondary_scientific=true",
      "invariant_crosscheck remains empty until explicit comparison or residual products are added",
      "brick channels Sx,Sy,Sz exist but momentum-density render families are deferred pending a clean display policy and first-class taxonomy contract",
    ],
    checksum: "curvature-invariant-checksum",
  } as any;
  return {
    tempDir,
    canonicalCalibrationArtifact,
    optixRenderArtifact,
    shiftGeometryArtifact,
    curvatureInvariantArtifact,
    fixedScaleComparisonArtifact,
  };
};

const buildRenderTaxonomyFixtures = async () => {
  const fixtures = await makeCanonicalVisualComparisonFixtures();
  enrichCanonicalCalibrationRenderTaxonomy({
    generatedOn: "2026-03-31",
    artifact: fixtures.canonicalCalibrationArtifact,
  });
  enrichYorkOptixRenderTaxonomy({
    generatedOn: "2026-03-31",
    artifact: fixtures.optixRenderArtifact,
  });
  const canonicalVisualComparisonArtifact =
    await buildNhm2CanonicalVisualComparisonArtifact({
      generatedOn: "2026-03-31",
      sourceAuditArtifactPath: "proof-pack.json",
      canonicalCalibrationArtifactPath: "calibration.json",
      fixedScaleArtifactPath: "fixed-scale.json",
      optixRenderArtifactPath: "optix.json",
      canonicalCalibrationArtifact: fixtures.canonicalCalibrationArtifact,
      fixedScaleComparisonArtifact: fixtures.fixedScaleComparisonArtifact,
      optixRenderArtifact: fixtures.optixRenderArtifact,
      exportDirectory: path.join(fixtures.tempDir, "comparison"),
    });
  enrichCanonicalVisualComparisonRenderTaxonomy({
    generatedOn: "2026-03-31",
    artifact: canonicalVisualComparisonArtifact,
  });
  for (const caseEntry of fixtures.canonicalCalibrationArtifact.canonicalCases) {
    for (const view of caseEntry.views) {
      if (view.renderTaxonomy) {
        view.renderTaxonomy.legacyPath = null;
      }
    }
  }
  for (const caseEntry of fixtures.optixRenderArtifact.caseRenders) {
    for (const render of caseEntry.contextRenders) {
      if (render.renderTaxonomy) {
        render.renderTaxonomy.legacyPath = null;
      }
    }
    for (const render of caseEntry.fieldRenders) {
      if (render.renderTaxonomy) {
        render.renderTaxonomy.legacyPath = null;
      }
    }
  }
  for (const render of fixtures.curvatureInvariantArtifact.renderEntries) {
    if (render.renderTaxonomy) {
      render.renderTaxonomy.legacyPath = null;
    }
  }
  for (const caseEntry of canonicalVisualComparisonArtifact.canonicalCases) {
    if (caseEntry.comparisonCardRender) {
      caseEntry.comparisonCardRender.legacyPath = null;
    }
  }
  if (canonicalVisualComparisonArtifact.overviewPanelRender) {
    canonicalVisualComparisonArtifact.overviewPanelRender.legacyPath = null;
  }
  const renderTaxonomyArtifact = buildRenderTaxonomyArtifact({
    generatedOn: "2026-03-31",
    canonicalCalibrationArtifact: fixtures.canonicalCalibrationArtifact,
    optixRenderArtifact: fixtures.optixRenderArtifact,
    shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
    curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
    canonicalVisualComparisonArtifact,
  });
  return {
    ...fixtures,
    canonicalVisualComparisonArtifact,
    renderTaxonomyArtifact,
  };
};

const buildSourceStageFixture = (overrides?: {
  canonical?: Record<string, unknown>;
  recovery?: Record<string, unknown>;
  sourceToYork?: Record<string, unknown>;
  sourceAuthorityRoleOverrides?: Record<string, "authoritative" | "comparison_only" | "derived_only" | "legacy" | "fallback" | "unknown">;
  sourceAuthorityReadinessScopeOverride?: string[];
  comparisonPolicyOverride?: Record<string, unknown>;
}) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "warp-source-stage-"));
  const canonicalPath = path.join(tmpDir, "canonical-qi-forensics.json");
  const recoveryPath = path.join(tmpDir, "recovery-search.json");
  const firstDivergencePath = path.join(tmpDir, "g4-first-divergence.json");
  const canonical = {
    rhoSource: "warp.metric.T00.natario_sdf.shift",
    metricT00Ref: "warp.metric.T00.natario_sdf.shift",
    metricT00Si_Jm3: -14690028178.574236,
    qeiRenormalizationScheme: "point_splitting",
    qeiSamplingNormalization: "unit_integral",
    quantityWorldlineClass: "timelike",
    ...overrides?.canonical,
  };
  const recoveryCase = {
    id: "case_0001",
    rhoSource: "warp.metric.T00.natario_sdf.shift",
    metricT00Ref: "warp.metric.T00.natario_sdf.shift",
    metricT00Si_Jm3: -89888730.09553961,
    qeiRenormalizationScheme: "point_splitting",
    qeiSamplingNormalization: "unit_integral",
    quantityWorldlineClass: "timelike",
    metricT00Derivation: "forward_shift_to_K_to_rho_E",
    ...overrides?.recovery,
  };
  fs.writeFileSync(canonicalPath, JSON.stringify(canonical, null, 2));
  fs.writeFileSync(
    recoveryPath,
    JSON.stringify({
      bestCandidate: recoveryCase,
      cases: [recoveryCase],
    }),
  );
  fs.writeFileSync(
    firstDivergencePath,
    JSON.stringify({
      canonical: { path: canonicalPath },
      recovery: { path: recoveryPath, caseId: "case_0001" },
      tolerances: { absTol: 1e-12, relTol: 1e-9 },
      firstDivergence: {
        stageId: "S0_source",
        stageLabel: "Source",
        differingFields: ["metricT00Si_Jm3"],
        summary: "S0_source diverged on: metricT00Si_Jm3",
      },
      stageComparisons: [
        {
          id: "S0_source",
          label: "Source",
          diverged: true,
          comparedFields: 3,
          differingFields: ["metricT00Si_Jm3"],
        },
      ],
    }),
  );
  const payload = makeProofPackPayloadForMarkdown() as any;
  const sourceToYork = {
    ...makeSourceToYorkFixture(),
    ...(overrides?.sourceToYork ?? {}),
  } as any;
  const sourceFormulaArtifact = buildNhm2SourceFormulaAuditArtifact({
    payload,
    sourceToYork,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    firstDivergencePath,
    comparisonPolicyOverride: overrides?.comparisonPolicyOverride as any,
  });
  const artifact = buildNhm2SourceStageAuditArtifact({
    payload,
    sourceToYork,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    firstDivergencePath,
    sourceFormulaAudit: sourceFormulaArtifact,
    sourceFormulaAuditPath:
      "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
    sourceAuthorityRoleOverrides: overrides?.sourceAuthorityRoleOverrides,
    sourceAuthorityReadinessScopeOverride: overrides?.sourceAuthorityReadinessScopeOverride,
  });
  return { artifact, sourceFormulaArtifact, firstDivergencePath, payload, sourceToYork };
};

const buildTimingAuthorityFixture = (overrides?: {
  sourceToYork?: Record<string, unknown>;
  timingPolicyOverride?: Record<string, unknown>;
}) => {
  const payload = makeProofPackPayloadForMarkdown() as any;
  const sourceToYork = {
    ...makeSourceToYorkFixture(),
    ...(overrides?.sourceToYork ?? {}),
  } as any;
  const artifact = buildNhm2TimingAuthorityAuditArtifact({
    payload,
    sourceToYork,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    timingPolicyOverride: overrides?.timingPolicyOverride as any,
  });
  return { artifact, payload, sourceToYork };
};

const buildBrickAuthorityFixture = (overrides?: {
  sourceToYork?: Record<string, unknown>;
  brickPolicyOverride?: Record<string, unknown>;
}) => {
  const payload = makeProofPackPayloadForMarkdown() as any;
  const sourceToYork = {
    ...makeSourceToYorkFixture(),
    ...(overrides?.sourceToYork ?? {}),
  } as any;
  const artifact = buildNhm2BrickAuthorityAuditArtifact({
    payload,
    sourceToYork,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    brickPolicyOverride: overrides?.brickPolicyOverride as any,
  });
  return { artifact, payload, sourceToYork };
};

const buildSnapshotAuthorityFixture = (overrides?: {
  payload?: Record<string, unknown>;
  sourceToYork?: Record<string, unknown>;
  snapshotPolicyOverride?: Record<string, unknown>;
  snapshotArtifactOverride?: Record<string, unknown>;
  syncLiveRefs?: boolean;
}) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "warp-snapshot-authority-"));
  const snapshotPath = path.join(tmpDir, "nhm2-snapshot.json");
  const payload = (overrides?.payload ?? makeProofPackPayloadForMarkdown()) as any;
  const sourceToYork = {
    ...makeSourceToYorkFixture(),
    ...(overrides?.sourceToYork ?? {}),
  } as any;
  const nhm2Case = payload.cases.find((entry: any) => entry.caseId === "nhm2_certified");
  if (nhm2Case && overrides?.syncLiveRefs !== false) {
    nhm2Case.metricVolumeRef.url =
      sourceToYork.proofPackBrickRequest?.brickUrl ?? nhm2Case.metricVolumeRef.url;
    nhm2Case.snapshotMetrics = {
      ...nhm2Case.snapshotMetrics,
      source: sourceToYork.proofPackBrickRequest?.metricT00Source ?? nhm2Case.snapshotMetrics?.source,
      metricRefHash:
        sourceToYork.proofPackSnapshotRefs?.metric_ref_hash ??
        nhm2Case.snapshotMetrics?.metricRefHash ??
        null,
      requestMetricRefHash:
        sourceToYork.proofPackSnapshotRefs?.metric_ref_hash ??
        nhm2Case.snapshotMetrics?.requestMetricRefHash ??
        null,
      channelHashes: {
        ...nhm2Case.snapshotMetrics?.channelHashes,
        theta:
          sourceToYork.proofPackSnapshotRefs?.theta_channel_hash ??
          nhm2Case.snapshotMetrics?.channelHashes?.theta ??
          null,
        K_trace:
          sourceToYork.proofPackSnapshotRefs?.k_trace_hash ??
          nhm2Case.snapshotMetrics?.channelHashes?.K_trace ??
          null,
      },
      sourceFamily: {
        ...nhm2Case.snapshotMetrics?.sourceFamily,
        metricT00Ref:
          sourceToYork.proofPackBrickRequest?.metricT00Ref ??
          nhm2Case.snapshotMetrics?.sourceFamily?.metricT00Ref ??
          null,
      },
    };
  }

  const snapshotArtifactBase = {
    generatedAtMs: 1234,
    runId: "snapshot-run",
    metricVolumeRef: {
      url:
        sourceToYork.proofPackSnapshotRefs?.snapshot_brick_url ??
        sourceToYork.proofPackBrickRequest?.brickUrl ??
        nhm2Case?.metricVolumeRef?.url ??
        null,
      hash:
        sourceToYork.proofPackSnapshotRefs?.metric_ref_hash ??
        nhm2Case?.snapshotMetrics?.metricRefHash ??
        null,
    },
  } as any;
  const snapshotArtifactOverride = (overrides?.snapshotArtifactOverride ?? {}) as any;
  const snapshotArtifact = {
    ...snapshotArtifactBase,
    ...snapshotArtifactOverride,
    metricVolumeRef: {
      ...snapshotArtifactBase.metricVolumeRef,
      ...(snapshotArtifactOverride.metricVolumeRef ?? {}),
    },
  };
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshotArtifact, null, 2));
  const artifact = buildNhm2SnapshotAuthorityAuditArtifact({
    payload,
    sourceToYork,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    nhm2SnapshotPath: snapshotPath,
    snapshotPolicyOverride: overrides?.snapshotPolicyOverride as any,
  });
  return { artifact, payload, sourceToYork, snapshotPath };
};

const buildDiagnosticSemanticFixture = (overrides?: {
  payload?: Record<string, unknown>;
  diagnosticPolicyOverride?: Record<string, unknown>;
}) => {
  const payload = (overrides?.payload ?? makeProofPackPayloadForMarkdown()) as any;
  const artifact = buildNhm2DiagnosticSemanticAuditArtifact({
    payload,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    diagnosticContractPath: "configs/york-diagnostic-contract.v1.json",
    diagnosticPolicyOverride: overrides?.diagnosticPolicyOverride as any,
  });
  return { artifact, payload };
};

const buildSourceMechanismMaturityFixture = (overrides?: {
  payload?: Record<string, unknown>;
  sourceToYork?: Record<string, unknown>;
  canonical?: Record<string, unknown>;
  recovery?: Record<string, unknown>;
  comparisonPolicyOverride?: Record<string, unknown>;
  diagnosticPolicyOverride?: Record<string, unknown>;
}) => {
  const payload = (overrides?.payload ?? makeProofPackPayloadForMarkdown()) as any;
  const sourceToYork = {
    ...makeSourceToYorkFixture(),
    bridgeReadiness: {
      ...makeSourceToYorkFixture().bridgeReadiness,
      timingAuthorityStatus: "recognized_required_fields_present_optional_fields_partial",
      timingAuthorityOptionalMissingFields: ["TS", "epsilon", "isHomogenized"],
      parameterMappingsComplete: true,
      parameterMappingsExplained: true,
      bridgeReady: true,
      blockReasons: [],
      bridgeOpenFieldCount: 0,
      bridgeClosedFieldCount: 19,
      openFields: [],
      closedFields: [
        "sourceContract",
        "timingAuthority.required_fields",
        "reducedOrderPipelinePayload",
        "proofPackBrickRequest",
        "metricRefProvenance",
        "warpFieldType -> metricT00Ref",
        "sectorCount",
        "concurrentSectors",
        "dutyCycle",
        "dutyShip -> dutyFR",
        "qCavity -> q",
        "qSpoilingFactor -> q",
        "gammaGeo",
        "gammaVanDenBroeck -> gammaVdB",
        "modulationFreq_GHz",
        "zeta",
        "reducedOrderReference.radius_m",
        "reducedOrderReference.tauLC_ms",
        "fullHull.Lx_m/Ly_m/Lz_m -> dims",
      ],
      residualBlockingReasons: [],
      residualAdvisoryReasons: ["bridge_timing_authority_optional_fields_partial"],
      closureCandidateStatus: "closed_with_current_serialization",
      statusNote:
        "Legacy source-to-York bridge is closed under the current serialization/readiness policy; optional timing-authority fields remain advisory-only and do not reopen the mechanism chain.",
    },
    ...(overrides?.sourceToYork ?? {}),
  } as any;
  const { sourceFormulaArtifact, artifact: sourceStageAudit } = buildSourceStageFixture({
    canonical: {
      metricT00GeomSource: "direct_metric_pipeline",
      rhoMetric_Jm3: -89888730.09553961,
      ...(overrides?.canonical ?? {}),
    },
    recovery: {
      metricT00Derivation: "forward_shift_to_K_to_rho_E",
      rhoMetric_Jm3: -89888730.09553961,
      metricStressRhoSiMean_Jm3: -89888730.09553961,
      ...(overrides?.recovery ?? {}),
    },
    sourceToYork,
    comparisonPolicyOverride:
      overrides?.comparisonPolicyOverride ??
      ({
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      } as any),
  });
  const { artifact: diagnosticSemanticAudit } = buildDiagnosticSemanticFixture({
    payload,
    diagnosticPolicyOverride: overrides?.diagnosticPolicyOverride,
  });
  const artifact = buildNhm2SourceMechanismMaturityArtifact({
    payload,
    sourceFormulaAudit: sourceFormulaArtifact,
    sourceToYork,
    diagnosticSemanticAudit,
    sourceStageAudit,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceFormulaAuditPath:
      "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    diagnosticSemanticAuditPath:
      "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
    sourceStageAuditPath:
      "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
    sourceMechanismPromotionContractArtifactPath:
      "artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json",
    sourceMechanismParityRouteFeasibilityArtifactPath:
      "artifacts/research/full-solve/nhm2-source-mechanism-parity-route-feasibility-latest.json",
  });
  const parityRouteFeasibilityArtifact =
    buildNhm2SourceMechanismParityRouteFeasibilityArtifact({
      payload,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceFormulaArtifactPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceMechanismPromotionContractArtifactPath:
        "artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json",
      sourceMechanismMaturityArtifactPath:
        "artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json",
    });
  const promotionContractArtifact = buildNhm2SourceMechanismPromotionContractArtifact({
    payload,
    sourceFormulaAudit: sourceFormulaArtifact,
    sourceToYork,
    diagnosticSemanticAudit,
    sourceFormulaArtifactPath:
      "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    sourceMechanismMaturityArtifactPath:
      "artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json",
    sourceMechanismParityRouteFeasibilityArtifactPath:
      "artifacts/research/full-solve/nhm2-source-mechanism-parity-route-feasibility-latest.json",
  });
  return {
    artifact,
    payload,
    sourceToYork,
    sourceFormulaArtifact,
    sourceStageAudit,
    diagnosticSemanticAudit,
    parityRouteFeasibilityArtifact,
    promotionContractArtifact,
  };
};

const buildYorkRenderDebugFixture = (overrides?: {
  payload?: Record<string, unknown>;
}) => {
  const payload = (overrides?.payload ?? makeProofPackPayloadForMarkdown()) as any;
  payload.classificationScoring ??= {
    distance_to_alcubierre_reference: 0.13559288214795065,
    distance_to_low_expansion_reference: 0.0012469161139296696,
    reference_margin: 0.134345966034021,
    winning_reference: "natario_control",
    margin_sufficient: true,
    winning_reference_within_threshold: true,
    distinct_by_policy: false,
    distinctness_threshold: 0.5,
    margin_min: 0.08,
    reference_match_threshold: 0.5,
    distance_metric: "weighted_normalized_l1",
    normalization_method: "max_abs_reference_target_with_floor",
    to_alcubierre_breakdown: {},
    to_low_expansion_breakdown: {},
  };
  payload.verdict ??= "nhm2_low_expansion_family";
  const sourceToYork = makeSourceToYorkFixture();
  const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
    buildSourceStageFixture({
      payload,
      sourceToYork,
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      },
    });
  const { artifact: timingAudit } = buildTimingAuthorityFixture({ payload, sourceToYork });
  const { artifact: brickAudit } = buildBrickAuthorityFixture({ payload, sourceToYork });
  const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
    payload,
    sourceToYork,
  });
  const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({ payload });
  const solveAuthorityArtifact = buildNhm2SolveAuthorityAuditArtifact({
    payload,
    sourceToYork,
    timingAudit,
    brickAudit,
    snapshotAudit,
    diagnosticAudit,
    sourceFormulaAudit: sourceFormulaArtifact,
    sourceStageAudit,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    sourceToYorkArtifactPath:
      "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
    timingAuditPath:
      "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
    brickAuditPath:
      "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
    snapshotAuditPath: snapshotPath,
    diagnosticAuditPath:
      "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
    sourceFormulaAuditPath:
      "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
    sourceStageAuditPath:
      "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
    nhm2SnapshotPath:
      "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
    waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
    firstDivergencePath,
  });
  const artifact = buildNhm2YorkRenderDebugArtifact({
    payload,
    solveAuthorityAudit: solveAuthorityArtifact,
    sourceAuditArtifactPath:
      "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    solveAuthorityAuditPath:
      "artifacts/research/full-solve/nhm2-solve-authority-audit-latest.json",
    diagnosticContractPath: "configs/york-diagnostic-contract.v1.json",
  });
  return { artifact, payload, solveAuthorityArtifact };
};

describe("warp york control-family proof pack", () => {
  it("emits brick-native div_beta proof values from GR diagnostics when available", async () => {
    const { initializePipelineState } = await import("../server/energy-pipeline");
    const { buildProofPack } = await import("../server/helix-proof-pack");

    const state = initializePipelineState();
    (state as any).gr = {
      divBeta: {
        rms: 2e-4,
        maxAbs: 4e-4,
        source: "gr_evolve_brick",
      },
    };

    const pack = buildProofPack(state);
    expect(pack.values.metric_div_beta_rms?.value).toBe(2e-4);
    expect(pack.values.metric_div_beta_max_abs?.value).toBe(4e-4);
    expect(pack.values.metric_div_beta_source?.value).toBe("gr_evolve_brick");
    expect(pack.values.metric_div_beta_source?.proxy).toBe(false);
  });

  it("keeps controls independent from NHM2-only congruent gate", () => {
    const controlRef = buildControlMetricVolumeRef({
      baseUrl: "http://127.0.0.1:5050",
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.alcubierre.analytic",
      dutyFR: 0.0015,
      q: 3,
      gammaGeo: 26,
      gammaVdB: 500,
      zeta: 0.84,
      phase01: 0,
      requireCongruentSolve: true,
      requireNhm2CongruentFullSolve: false,
    });
    const controlParams = new URL(controlRef.url).searchParams;
    expect(controlParams.get("requireCongruentSolve")).toBe("1");
    expect(controlParams.get("requireNhm2CongruentFullSolve")).toBeNull();

    const nhm2Ref = buildControlMetricVolumeRef({
      baseUrl: "http://127.0.0.1:5050",
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.natario.shift",
      dutyFR: 0.0015,
      q: 3,
      gammaGeo: 26,
      gammaVdB: 500,
      zeta: 0.84,
      phase01: 0,
      requireCongruentSolve: true,
      requireNhm2CongruentFullSolve: true,
    });
    const nhm2Params = new URL(nhm2Ref.url).searchParams;
    expect(nhm2Params.get("requireCongruentSolve")).toBe("1");
    expect(nhm2Params.get("requireNhm2CongruentFullSolve")).toBe("1");
  });

  it("forces inconclusive verdict when strict provenance hashes are missing", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc");
    const natCase = makeCase("natario_control", "theta-hash-nat");
    const nhm2Case = makeCase("nhm2_certified", "theta-hash-nhm2");
    const alcViews = alcCase.perView as Array<Record<string, unknown>>;
    const targetView = alcViews.find((entry) => entry.view === "york-surface-rho-3p1");
    const targetHashes = (targetView?.hashes as Record<string, unknown>) ?? null;
    if (targetHashes) targetHashes.theta_channel_hash = null;

    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [alcCase, natCase, nhm2Case] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });

    expect(evaluated.preconditions.provenanceHashesPresent).toBe(false);
    expect(evaluated.preconditions.readyForFamilyVerdict).toBe(false);
    expect(
      evaluated.guardFailures.some(
        (failure) => failure.code === "proof_pack_required_view_missing_provenance_hash",
      ),
    ).toBe(true);

    const verdict = decideControlFamilyVerdict({
      preconditions: evaluated.preconditions,
      controlsCalibratedByReferences: false,
      classificationScoring: null,
    });
    expect(verdict).toBe("inconclusive");
  });

  it("tracks Lane A parity preconditions as satisfied on the happy path", () => {
    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [
        makeCase("alcubierre_control", "theta-hash-alc"),
        makeCase("natario_control", "theta-hash-nat"),
        makeCase("nhm2_certified", "theta-hash-nhm2"),
      ] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });

    expect(evaluated.preconditions.offlineRenderParityComputed).toBe(true);
    expect(evaluated.preconditions.thetaKTraceParityComputed).toBe(true);
    expect(evaluated.preconditions.snapshotIdentityComplete).toBe(true);
    expect(evaluated.preconditions.diagnosticParityClosed).toBe(true);
    expect(evaluated.preconditions.laneAParityClosed).toBe(true);
  });

  it("forces an inconclusive Natario-like family verdict when the authoritative low-expansion gate is not passed", () => {
    const verdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        offlineRenderParityComputed: true,
        thetaKTraceParityComputed: true,
        snapshotIdentityComplete: true,
        diagnosticParityClosed: true,
        laneAParityClosed: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: {
        distance_to_alcubierre_reference: 0.6,
        distance_to_low_expansion_reference: 0.1,
        reference_margin: 0.5,
        winning_reference: "natario_control",
        margin_sufficient: true,
        winning_reference_within_threshold: true,
        distinct_by_policy: false,
        margin_min: 0.1,
        reference_match_threshold: 1,
        distinctness_threshold: 2,
        distance_metric: "weighted_feature_distance",
        normalization_method: "contract_weighted",
      },
      authoritativeLowExpansionGate: {
        sourceCaseId: "nhm2_certified",
        status: "missing",
        reason: "brick_native_div_beta_missing",
        source: null,
        authoritative: true,
        divergenceObservable: "div_beta",
        divergenceRms: null,
        divergenceMaxAbs: null,
        divergenceTolerance: 1e-3,
        thetaKConsistencyStatus: "unknown",
        thetaKResidualMaxAbs: null,
        thetaKTolerance: 1e-3,
        projectionDerivedStatus: "advisory_only",
        projectionDerivedNote: "projection-only",
      },
    } as any);

    expect(verdict).toBe("inconclusive");
  });

  it("fail-closes when parity layer reports render parity failure", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc") as any;
    alcCase.parity.status = "fail";
    alcCase.parity.causeCode = "render_parity_failure";
    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [
        alcCase,
        makeCase("natario_control", "theta-hash-nat"),
        makeCase("nhm2_certified", "theta-hash-nhm2"),
      ] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });
    expect(evaluated.preconditions.diagnosticParityClosed).toBe(false);
    expect(evaluated.preconditions.laneAParityClosed).toBe(false);
    expect(evaluated.preconditions.readyForFamilyVerdict).toBe(false);
    expect(
      evaluated.guardFailures.some(
        (failure) =>
          failure.code === "proof_pack_lane_a_parity_failed" &&
          failure.detail.includes("render_parity_failure"),
      ),
    ).toBe(true);
    expect(
      resolveLaneACauseCode({
        guardFailures: evaluated.guardFailures as any,
        verdict: "inconclusive",
      }),
    ).toBe("render_parity_failure");
  });

  it("emits theta_ktrace contract cause when parity reports theta_ktrace mismatch", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc") as any;
    alcCase.parity.status = "fail";
    alcCase.parity.causeCode = "theta_ktrace_contract_failure";
    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [
        alcCase,
        makeCase("natario_control", "theta-hash-nat"),
        makeCase("nhm2_certified", "theta-hash-nhm2"),
      ] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });
    expect(evaluated.preconditions.diagnosticParityClosed).toBe(false);
    expect(evaluated.preconditions.laneAParityClosed).toBe(false);
    expect(
      resolveLaneACauseCode({
        guardFailures: evaluated.guardFailures as any,
        verdict: "inconclusive",
      }),
    ).toBe("theta_ktrace_contract_failure");
  });

  it("emits snapshot identity cause when parity marks identity incomplete", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc") as any;
    alcCase.parity.snapshotIdentityComplete = false;
    alcCase.parity.status = "fail";
    alcCase.parity.causeCode = "snapshot_identity_failure";
    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [
        alcCase,
        makeCase("natario_control", "theta-hash-nat"),
        makeCase("nhm2_certified", "theta-hash-nhm2"),
      ] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });
    expect(evaluated.preconditions.diagnosticParityClosed).toBe(false);
    expect(evaluated.preconditions.snapshotIdentityComplete).toBe(false);
    expect(
      resolveLaneACauseCode({
        guardFailures: evaluated.guardFailures as any,
        verdict: "inconclusive",
      }),
    ).toBe("snapshot_identity_failure");
  });

  it("treats ADM and K_ij=-1/2*L_n(gamma_ij) as equivalent for Lane A identity closure", () => {
    const rendered = makeView("york-surface-3p1") as any;
    rendered.identity.kij_sign_convention = "K_ij=-1/2*L_n(gamma_ij)";
    const identity = evaluateLaneASnapshotIdentity({
      rendered,
      lane: {
        lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        theta_definition: "theta=-trK",
        kij_sign_convention: "ADM",
      },
      expectedMetricRefHash: "metric-ref",
      expectedThetaHash: "theta-hash",
      expectedChart: "comoving_cartesian",
    });
    expect(identity.kijSignConventionMatches).toBe(true);
    expect(identity.complete).toBe(true);
  });

  it("keeps Lane A snapshot identity fail-closed for unsupported kij sign labels", () => {
    const rendered = makeView("york-surface-3p1") as any;
    rendered.identity.kij_sign_convention = "unsupported-sign-convention";
    const identity = evaluateLaneASnapshotIdentity({
      rendered,
      lane: {
        lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        theta_definition: "theta=-trK",
        kij_sign_convention: "ADM",
      },
      expectedMetricRefHash: "metric-ref",
      expectedThetaHash: "theta-hash",
      expectedChart: "comoving_cartesian",
    });
    expect(identity.kijSignConventionMatches).toBe(false);
    expect(identity.complete).toBe(false);
  });

  it("keeps Lane A snapshot identity fail-closed on real non-alias metadata mismatch", () => {
    const rendered = makeView("york-surface-3p1") as any;
    rendered.identity.kij_sign_convention = "K_ij=-1/2*L_n(gamma_ij)";
    const identity = evaluateLaneASnapshotIdentity({
      rendered,
      lane: {
        lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        theta_definition: "theta=-trK",
        kij_sign_convention: "ADM",
      },
      expectedMetricRefHash: "metric-ref",
      expectedThetaHash: "theta-hash",
      expectedChart: "other-chart",
    });
    expect(identity.kijSignConventionMatches).toBe(true);
    expect(identity.chartMatches).toBe(false);
    expect(identity.complete).toBe(false);
  });

  it("maps missing hash and family outcomes to deterministic lane-aware cause codes", () => {
    expect(
      resolveLaneACauseCode({
        guardFailures: [
          {
            code: "proof_pack_required_view_missing_provenance_hash",
            detail: "alcubierre_control:york-surface-3p1:theta_channel_hash",
          },
        ] as any,
        verdict: "inconclusive",
      }),
    ).toBe("missing_required_hash");
    expect(
      resolveLaneACauseCode({
        guardFailures: [] as any,
        verdict: "nhm2_distinct_family",
      }),
    ).toBe("lane_a_family_distinct");
    expect(
      resolveLaneACauseCode({
        guardFailures: [] as any,
        verdict: "nhm2_low_expansion_family",
      }),
    ).toBe("lane_a_family_congruent");
    expect(
      resolveLaneACauseCode({
        guardFailures: [] as any,
        verdict: "nhm2_low_expansion_family",
        laneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      }),
    ).toBe("lane_b_family_congruent");
    expect(
      resolveLaneACauseCode({
        guardFailures: [] as any,
        verdict: "inconclusive",
      }),
    ).toBe("lane_a_family_inconclusive");
    expect(
      resolveLaneACauseCode({
        guardFailures: [] as any,
        verdict: "inconclusive",
        laneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      }),
    ).toBe("lane_b_family_inconclusive");
  });

  it("formats lane cause notes with explicit baseline/alternate labels", () => {
    expect(
      formatLaneCauseCodeNote(
        YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        "lane_a_family_congruent",
      ),
    ).toBe("Baseline lane cause code=lane_a_family_congruent.");
    expect(
      formatLaneCauseCodeNote(
        YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
        "lane_b_family_congruent",
      ),
    ).toBe("Alternate lane cause code=lane_b_family_congruent.");
    expect(
      formatLaneCauseCodeNote(
        YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        "lane_a_family_congruent",
      ).startsWith("Lane cause code="),
    ).toBe(false);
  });

  it("keeps baseline parity case summaries cause-free when status is pass", () => {
    const summary = summarizeLaneAParity([
      makeCase("alcubierre_control", "theta-hash-alc"),
      makeCase("natario_control", "theta-hash-nat"),
      makeCase("nhm2_certified", "theta-hash-nhm2"),
    ] as any);
    expect(summary.status).toBe("closed");
    expect(summary.causeCode).toBe(null);
    for (const entry of summary.caseSummaries) {
      expect(entry.status).toBe("pass");
      expect(entry.causeCode).toBe(null);
    }
  });

  it("keeps alternate-lane parity case summaries cause-free when status is pass", () => {
    const cases = [
      makeCase("alcubierre_control", "theta-hash-alc"),
      makeCase("natario_control", "theta-hash-nat"),
      makeCase("nhm2_certified", "theta-hash-nhm2"),
    ] as any[];
    for (const entry of cases) {
      entry.parity.caseId = entry.caseId;
      entry.parity.status = "pass";
      entry.parity.causeCode = null;
      for (const audit of entry.parity.byView) {
        audit.identity.laneMatches = true;
      }
    }
    const summary = summarizeLaneAParity(cases as any);
    expect(summary.status).toBe("closed");
    for (const entry of summary.caseSummaries) {
      expect(entry.status).toBe("pass");
      expect(entry.causeCode).toBe(null);
    }
  });

  it("keeps top-level parity summary cause-free when all parity rows pass", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    expect(payload.laneAParity.status).toBe("closed");
    expect(payload.laneAParity.causeCode).toBe(null);
    for (const entry of payload.laneAParity.caseSummaries) {
      expect(entry.status).toBe("pass");
      expect(entry.causeCode).toBe(null);
    }
  });

  it("preserves parity failure cause codes for non-pass rows", () => {
    const cases = [
      makeCase("alcubierre_control", "theta-hash-alc"),
      makeCase("natario_control", "theta-hash-nat"),
      makeCase("nhm2_certified", "theta-hash-nhm2"),
    ] as any[];
    cases[0].parity.status = "fail";
    cases[0].parity.causeCode = "snapshot_identity_failure";
    const summary = summarizeLaneAParity(cases as any);
    expect(summary.status).toBe("failed");
    expect(summary.causeCode).toBe("snapshot_identity_failure");
    const alcubierre = summary.caseSummaries.find(
      (entry) => entry.caseId === "alcubierre_control",
    );
    expect(alcubierre).not.toBeUndefined();
    expect(alcubierre?.status).toBe("fail");
    expect(alcubierre?.causeCode).toBe("snapshot_identity_failure");
  });

  it("renders parity case rows without failure cause codes when status is pass", () => {
    const payload = makeProofPackPayloadForMarkdown();
    const markdown = renderMarkdown(payload);
    expect(markdown).toContain(
      "| alcubierre_control | true | true | true | true | true | pass | null |",
    );
    expect(markdown).toContain(
      "| natario_control | true | true | true | true | true | pass | null |",
    );
    expect(markdown).toContain(
      "| nhm2_certified | true | true | true | true | true | pass | null |",
    );
    expect(markdown).not.toContain(
      "| alcubierre_control | true | true | true | true | true | pass | snapshot_identity_failure |",
    );
  });

  it("renders lane-cause summary with explicit baseline and alternate cause codes", () => {
    const payload = makeProofPackPayloadForMarkdown();
    const markdown = renderMarkdown(payload);
    expect(markdown).toContain("## Lane Causes");
    expect(markdown).toContain(
      "- baselineLaneCauseCode: `lane_a_family_congruent`",
    );
    expect(markdown).toContain(
      "- alternateLaneCauseCode: `lane_b_family_congruent`",
    );
    expect(markdown).not.toContain("## Lane A Cause");
  });

  it("renders the authoritative low-expansion gate and keeps projection diagnostics advisory-only", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.authoritativeLowExpansionGate = {
      sourceCaseId: "nhm2_certified",
      status: "pass",
      reason: "authoritative_low_expansion_ok",
      source: "gr_evolve_brick",
      authoritative: true,
      divergenceObservable: "div_beta",
      divergenceRms: 2e-4,
      divergenceMaxAbs: 4e-4,
      divergenceTolerance: 1e-3,
      thetaKConsistencyStatus: "pass",
      thetaKResidualMaxAbs: 2e-4,
      thetaKTolerance: 1e-3,
      projectionDerivedStatus: "advisory_only",
      projectionDerivedNote:
        "Projection-derived betaDiagnostics remain visible for comparison, but authoritative Natario-like low-expansion classification is gated only by brick-native div_beta plus theta/K consistency.",
    };

    const markdown = renderMarkdown(payload);
    expect(markdown).toContain("## Authoritative Low-Expansion Gate");
    expect(markdown).toContain("| status | pass |");
    expect(markdown).toContain("| source | gr_evolve_brick |");
    expect(markdown).toContain("| projectionDerivedStatus | advisory_only |");
    expect(markdown).toContain(
      "authoritative Natario-like low-expansion classification is gated only by brick-native div_beta plus theta/K consistency",
    );
  });

  it("fails control independence when control URLs differ but theta hashes collide", () => {
    const sharedThetaHash = "shared-theta-hash";
    const alcCase = makeCase(
      "alcubierre_control",
      sharedThetaHash,
      "http://127.0.0.1:5050/gr-evolve?metricT00Ref=warp.metric.T00.alcubierre.analytic",
    );
    const natCase = makeCase(
      "natario_control",
      sharedThetaHash,
      "http://127.0.0.1:5050/gr-evolve?metricT00Ref=warp.metric.T00.natario.shift",
    );
    const nhm2Case = makeCase("nhm2_certified", "theta-hash-nhm2");
    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [alcCase, natCase, nhm2Case] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });

    expect(evaluated.preconditions.controlsIndependent).toBe(false);
    expect(evaluated.preconditions.readyForFamilyVerdict).toBe(false);
    expect(
      evaluated.guardFailures.some(
        (failure) => failure.code === "proof_pack_control_theta_hash_collision",
      ),
    ).toBe(true);
    expect(
      evaluated.guardFailures.some(
        (failure) =>
          failure.code === "proof_pack_controls_diverged_upstream_but_collapsed_later",
      ),
    ).toBe(true);
  });

  it("propagates control source-family evidence into controlDebug", () => {
    const controlDebug = buildControlDebug([
      makeCase("alcubierre_control", "theta-hash-alc"),
      makeCase("natario_control", "theta-hash-nat"),
      makeCase("nhm2_certified", "theta-hash-nhm2"),
    ] as any);

    const alc = controlDebug.find((entry) => entry.caseId === "alcubierre_control");
    expect(alc?.family_id).toBe("alcubierre_control");
    expect(alc?.warpFieldType).toBe("alcubierre");
    expect(alc?.source_branch).toBe("metric_t00_ref");
    expect(alc?.metricT00Ref).toBe("warp.metric.T00.alcubierre.analytic");
    expect(alc?.shape_function_id).toBe("alcubierre_longitudinal_shell_v1");
    expect(alc?.thetaHash).toBe("theta-hash-alc");
    expect(alc?.kTraceHash).toBe("ktrace-hash");
  });

  it("prefers stats stress-energy mapping evidence when present", () => {
    const sourceFamily = readSourceFamilyEvidence({
      stats: {
        stressEnergy: {
          mapping: {
            family_id: "stats-family",
            metricT00Ref: "warp.metric.T00.stats",
            warpFieldType: "stats-field",
            source_branch: "stats_branch",
            shape_function_id: "stats_shape",
          },
        },
      },
      meta: {
        stressEnergy: {
          mapping: {
            family_id: "meta-family",
            metricT00Ref: "warp.metric.T00.meta",
            warpFieldType: "meta-field",
            source_branch: "meta_branch",
            shape_function_id: "meta_shape",
          },
        },
      },
    });

    expect(sourceFamily.family_id).toBe("stats-family");
    expect(sourceFamily.warpFieldType).toBe("stats-field");
    expect(sourceFamily.source_branch).toBe("stats_branch");
  });

  it("falls back to snapshot meta mapping when stats mapping is empty", () => {
    const sourceFamily = readSourceFamilyEvidence({
      stats: { stressEnergy: { mapping: {} } },
      meta: {
        stressEnergy: {
          mapping: {
            family_id: "meta-family",
            metricT00Ref: "warp.metric.T00.meta",
            warpFieldType: "meta-field",
            source_branch: "meta_branch",
            shape_function_id: "meta_shape",
          },
        },
      },
    });

    expect(sourceFamily.family_id).toBe("meta-family");
    expect(sourceFamily.warpFieldType).toBe("meta-field");
    expect(sourceFamily.source_branch).toBe("meta_branch");
  });

  it("flags missing control mapping fields even when control hashes exist", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc");
    const alcSourceFamily = (alcCase.snapshotMetrics as any).sourceFamily;
    alcSourceFamily.family_id = null;
    alcSourceFamily.warpFieldType = null;
    alcSourceFamily.source_branch = null;
    const natCase = makeCase("natario_control", "theta-hash-nat");
    const nhm2Case = makeCase("nhm2_certified", "theta-hash-nhm2");

    const evaluated = evaluateProofPackPreconditions({
      yorkViews: [...REQUIRED_VIEWS],
      cases: [alcCase, natCase, nhm2Case] as any,
      runtimeStatus: {
        statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
        serviceVersion: "v1",
        buildHash: "build",
        commitSha: "commit",
        processStartedAtMs: 1,
        runtimeInstanceId: "runtime",
        reachable: true,
      },
    });

    expect(
      evaluated.guardFailures.some(
        (failure) => failure.code === "proof_pack_control_mapping_evidence_missing_in_payload",
      ),
    ).toBe(true);
  });

  it("passes offline slice hash congruence when rendered hashes match", () => {
    const caseEntry = makeCase("alcubierre_control", "theta-hash-alc") as any;
    const congruence = evaluateYorkSliceCongruence([caseEntry]);
    expect(congruence.hashMismatch).toBe(false);
    expect(congruence.rhoRemapMismatch).toBe(false);
    expect(congruence.guardFailures).toEqual([]);
  });

  it("emits mismatch guard when rendered slice_array_hash differs", () => {
    const caseEntry = makeCase("alcubierre_control", "theta-hash-alc") as any;
    const xzView = caseEntry.perView.find((entry: any) => entry.view === "york-surface-3p1");
    xzView.hashes.slice_array_hash = "different-hash";
    const congruence = evaluateYorkSliceCongruence([caseEntry]);
    expect(congruence.hashMismatch).toBe(true);
    expect(
      congruence.guardFailures.some(
        (failure) => failure.code === "proof_pack_york_slice_hash_mismatch",
      ),
    ).toBe(true);
  });

  it("emits x-rho remap mismatch guard when rho hash diverges", () => {
    const caseEntry = makeCase("alcubierre_control", "theta-hash-alc") as any;
    const rhoView = caseEntry.perView.find(
      (entry: any) => entry.view === "york-surface-rho-3p1",
    );
    rhoView.hashes.slice_array_hash = "different-rho-hash";
    const congruence = evaluateYorkSliceCongruence([caseEntry]);
    expect(congruence.rhoRemapMismatch).toBe(true);
    expect(
      congruence.guardFailures.some(
        (failure) => failure.code === "proof_pack_york_rho_remap_mismatch",
      ),
    ).toBe(true);
  });

  it("classifies near-zero suppression mismatch when raw signed structure exists", () => {
    const caseEntry = makeCase("alcubierre_control", "theta-hash-alc") as any;
    const xzView = caseEntry.perView.find((entry: any) => entry.view === "york-surface-3p1");
    xzView.nearZeroTheta = true;
    xzView.displayExtrema.absMax = 0;
    xzView.displayExtrema.heightScale = 0;
    const congruence = evaluateYorkSliceCongruence([caseEntry]);
    expect(congruence.nearZeroSuppressionMismatch).toBe(true);
    expect(
      congruence.guardFailures.some(
        (failure) => failure.code === "proof_pack_york_near_zero_suppression_mismatch",
      ),
    ).toBe(true);
  });

  it("flags suppression mismatch even for tiny amplitudes when signed structure is present", () => {
    const caseEntry = makeCase("alcubierre_control", "theta-hash-alc") as any;
    const xzView = caseEntry.perView.find((entry: any) => entry.view === "york-surface-3p1");
    const offlineView = caseEntry.offlineYorkAudit.byView.find(
      (entry: any) => entry.view === "york-surface-3p1",
    );
    offlineView.rawExtrema = { min: -1e-30, max: 1e-30, absMax: 1e-30 };
    offlineView.counts = { positive: 12, negative: 9, zeroOrNearZero: 3, total: 24 };
    xzView.nearZeroTheta = true;
    xzView.displayExtrema.absMax = 0;
    xzView.displayExtrema.heightScale = 0;
    const congruence = evaluateYorkSliceCongruence([caseEntry]);
    expect(congruence.nearZeroSuppressionMismatch).toBe(true);
    expect(
      congruence.guardFailures.some(
        (failure) => failure.code === "proof_pack_york_near_zero_suppression_mismatch",
      ),
    ).toBe(true);
  });

  it("computes offline York audit slices for x-z and x-rho", () => {
    const dims: [number, number, number] = [4, 4, 4];
    const theta = new Float32Array(dims[0] * dims[1] * dims[2]);
    for (let z = 0; z < dims[2]; z += 1) {
      for (let y = 0; y < dims[1]; y += 1) {
        for (let x = 0; x < dims[0]; x += 1) {
          const idx = z * dims[0] * dims[1] + y * dims[0] + x;
          theta[idx] = x >= 2 ? 1 : -1;
        }
      }
    }
    const xz = extractThetaSliceXZMidplane(theta, dims);
    const xrho = extractThetaSliceXRho(theta, dims);
    expect(xz.length).toBe(16);
    expect(xrho.length).toBe(16);
    const audit = computeOfflineYorkAudit({
      caseId: "alcubierre_control",
      theta,
      dims,
    });
    expect(audit?.byView).toHaveLength(2);
    expect(audit?.alcubierreSignedLobeSummary?.signedLobeSummary).toBe("fore+/aft-");
  });

  it("detects tiny signed structure in offline sign counts", () => {
    const dims: [number, number, number] = [6, 4, 4];
    const theta = new Float32Array(dims[0] * dims[1] * dims[2]);
    const nyMid = Math.floor(dims[1] * 0.5);
    for (let z = 0; z < dims[2]; z += 1) {
      for (let x = 0; x < dims[0]; x += 1) {
        const idx = z * dims[0] * dims[1] + nyMid * dims[0] + x;
        theta[idx] = (x + z) % 2 === 0 ? 1e-33 : -1e-33;
      }
    }

    const audit = computeOfflineYorkAudit({
      caseId: "alcubierre_control",
      theta,
      dims,
    });
    const xz = audit?.byView.find((entry) => entry.view === "york-surface-3p1");
    expect(xz).toBeTruthy();
    expect((xz?.counts.positive ?? 0) > 0).toBe(true);
    expect((xz?.counts.negative ?? 0) > 0).toBe(true);
  });

  it("classifies tiny but consistent fore/aft lobes in offline Alcubierre audit", () => {
    const dims: [number, number, number] = [6, 4, 4];
    const theta = new Float32Array(dims[0] * dims[1] * dims[2]);
    const xMid = Math.floor(dims[0] * 0.5);
    for (let z = 0; z < dims[2]; z += 1) {
      for (let y = 0; y < dims[1]; y += 1) {
        for (let x = 0; x < dims[0]; x += 1) {
          const idx = z * dims[0] * dims[1] + y * dims[0] + x;
          theta[idx] = x >= xMid ? 2e-33 : -2e-33;
        }
      }
    }

    const audit = computeOfflineYorkAudit({
      caseId: "alcubierre_control",
      theta,
      dims,
    });
    expect(audit?.alcubierreSignedLobeSummary?.signedLobeSummary).toBe("fore+/aft-");
  });

  it("keeps flat offline slices zero-count and mixed_or_flat", () => {
    const dims: [number, number, number] = [6, 4, 4];
    const theta = new Float32Array(dims[0] * dims[1] * dims[2]);
    const audit = computeOfflineYorkAudit({
      caseId: "alcubierre_control",
      theta,
      dims,
    });
    for (const view of audit?.byView ?? []) {
      expect(view.counts.positive).toBe(0);
      expect(view.counts.negative).toBe(0);
    }
    expect(audit?.alcubierreSignedLobeSummary?.signedLobeSummary).toBe("mixed_or_flat");
  });

  it("computes Lane B from tensors and does not alias Lane A theta", () => {
    const dims: [number, number, number] = [4, 4, 4];
    const total = dims[0] * dims[1] * dims[2];
    const theta = new Float32Array(total);
    const kTrace = new Float32Array(total);
    const betaX = new Float32Array(total);
    const betaY = new Float32Array(total);
    const betaZ = new Float32Array(total);
    const alpha = new Float32Array(total);
    const gammaXX = new Float32Array(total);
    const gammaXY = new Float32Array(total);
    const gammaXZ = new Float32Array(total);
    const gammaYY = new Float32Array(total);
    const gammaYZ = new Float32Array(total);
    const gammaZZ = new Float32Array(total);
    for (let z = 0; z < dims[2]; z += 1) {
      for (let y = 0; y < dims[1]; y += 1) {
        for (let x = 0; x < dims[0]; x += 1) {
          const idx = z * dims[0] * dims[1] + y * dims[0] + x;
          theta[idx] = 0.05;
          kTrace[idx] = -0.05;
          betaX[idx] = x;
          betaY[idx] = 0;
          betaZ[idx] = 0;
          alpha[idx] = 1;
          gammaXX[idx] = 1;
          gammaXY[idx] = 0;
          gammaXZ[idx] = 0;
          gammaYY[idx] = 1;
          gammaYZ[idx] = 0;
          gammaZZ[idx] = 1;
        }
      }
    }

    const laneA = computeYorkDiagnosticLaneField({
      laneId: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      dims,
      voxelSizeM: [1, 1, 1],
      theta,
      kTrace,
      betaX,
      betaY,
      betaZ,
      alpha,
      gammaXX,
      gammaXY,
      gammaXZ,
      gammaYY,
      gammaYZ,
      gammaZZ,
    });
    const laneB = computeYorkDiagnosticLaneField({
      laneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      dims,
      voxelSizeM: [1, 1, 1],
      theta,
      kTrace,
      betaX,
      betaY,
      betaZ,
      alpha,
      gammaXX,
      gammaXY,
      gammaXZ,
      gammaYY,
      gammaYZ,
      gammaZZ,
    });

    expect(laneA.ok).toBe(true);
    expect(laneB.ok).toBe(true);
    if (!laneA.ok || !laneB.ok) return;
    expect(laneA.source).toBe("canonical_theta_channel");
    expect(laneB.source).toBe("recomputed_theta_from_ktrace_and_div_beta_over_alpha");
    expect(laneB.theta[0]).not.toBe(laneA.theta[0]);
    expect(laneB.observerConstruction.observer_definition_id).toBe(
      "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
    );
    expect(laneB.observerConstruction.requires_gamma_metric).toBe(true);
  });

  it("collapses Lane B to Lane A only when div(beta/alpha)=0", () => {
    const dims: [number, number, number] = [4, 4, 4];
    const total = dims[0] * dims[1] * dims[2];
    const theta = new Float32Array(total).fill(0.05);
    const kTrace = new Float32Array(total).fill(-0.05);
    const betaX = new Float32Array(total);
    const betaY = new Float32Array(total);
    const betaZ = new Float32Array(total);
    const alpha = new Float32Array(total).fill(1);
    const gammaXX = new Float32Array(total).fill(1);
    const gammaXY = new Float32Array(total);
    const gammaXZ = new Float32Array(total);
    const gammaYY = new Float32Array(total).fill(1);
    const gammaYZ = new Float32Array(total);
    const gammaZZ = new Float32Array(total).fill(1);
    const laneA = computeYorkDiagnosticLaneField({
      laneId: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      dims,
      voxelSizeM: [1, 1, 1],
      theta,
      kTrace,
      betaX,
      betaY,
      betaZ,
      alpha,
      gammaXX,
      gammaXY,
      gammaXZ,
      gammaYY,
      gammaYZ,
      gammaZZ,
    });
    const laneB = computeYorkDiagnosticLaneField({
      laneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      dims,
      voxelSizeM: [1, 1, 1],
      theta,
      kTrace,
      betaX,
      betaY,
      betaZ,
      alpha,
      gammaXX,
      gammaXY,
      gammaXZ,
      gammaYY,
      gammaYZ,
      gammaZZ,
    });
    expect(laneA.ok).toBe(true);
    expect(laneB.ok).toBe(true);
    if (!laneA.ok || !laneB.ok) return;
    expect(laneB.theta[0]).toBeCloseTo(laneA.theta[0], 12);
  });

  it("fails Lane B tensor recomputation when required tensors are missing", () => {
    const dims: [number, number, number] = [4, 4, 4];
    const total = dims[0] * dims[1] * dims[2];
    const kTrace = new Float32Array(total);
    const betaX = new Float32Array(total);
    const betaY = new Float32Array(total);
    const betaZ = new Float32Array(total);
    const gammaXX = new Float32Array(total).fill(1);
    const gammaXY = new Float32Array(total);
    const gammaXZ = new Float32Array(total);
    const gammaYY = new Float32Array(total).fill(1);
    const gammaYZ = new Float32Array(total);
    const gammaZZ = new Float32Array(total).fill(1);
    const laneB = computeYorkDiagnosticLaneField({
      laneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      dims,
      voxelSizeM: [1, 1, 1],
      theta: null,
      kTrace,
      betaX,
      betaY,
      betaZ,
      alpha: null,
      gammaXX,
      gammaXY,
      gammaXZ,
      gammaYY,
      gammaYZ,
      gammaZZ,
    });
    expect(laneB.ok).toBe(false);
    if (laneB.ok) return;
    expect(laneB.error).toBe("scientific_york_lane_tensor_missing");
    expect(laneB.missingChannels).toContain("alpha");
  });

  it("fails Lane B tensor recomputation when gamma_ij inputs are missing", () => {
    const dims: [number, number, number] = [4, 4, 4];
    const total = dims[0] * dims[1] * dims[2];
    const kTrace = new Float32Array(total);
    const betaX = new Float32Array(total);
    const betaY = new Float32Array(total);
    const betaZ = new Float32Array(total);
    const alpha = new Float32Array(total).fill(1);
    const laneB = computeYorkDiagnosticLaneField({
      laneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      dims,
      voxelSizeM: [1, 1, 1],
      theta: null,
      kTrace,
      betaX,
      betaY,
      betaZ,
      alpha,
      gammaXX: null,
      gammaXY: null,
      gammaXZ: null,
      gammaYY: null,
      gammaYZ: null,
      gammaZZ: null,
    });
    expect(laneB.ok).toBe(false);
    if (laneB.ok) return;
    expect(laneB.error).toBe("scientific_york_lane_tensor_missing");
    expect(laneB.missingChannels).toContain("gamma_xx");
    expect(laneB.missingChannels).toContain("gamma_zz");
  });

  it("builds classification features from York evidence fields", () => {
    const caseEntry = makeCase("nhm2_certified", "theta-hash-nhm2") as any;
    caseEntry.primaryYork.rawExtrema.absMax = 2.9e-32;
    caseEntry.primaryYork.displayExtrema.absMax = 2.1e-38;
    const shellView = caseEntry.perView.find((entry: any) => entry.view === "york-shell-map-3p1");
    shellView.shellSupportCount = 80;
    shellView.shellActiveCount = 20;
    const features = buildCaseClassificationFeatures(caseEntry);
    expect(features.theta_abs_max_raw).toBe(2.9e-32);
    expect(features.theta_abs_max_display).toBe(2.1e-38);
    expect(features.positive_count_xz).toBeTypeOf("number");
    expect(features.negative_count_xrho).toBeTypeOf("number");
    expect(features.shell_map_activity).toBeCloseTo(0.25, 8);
  });

  it("loads the versioned York diagnostic contract", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    expect(contract.contract_id).toBe("york_diagnostic_contract");
    expect(contract.classification_scope).toBe("diagnostic_local_only");
    expect(contract.feature_set.includes("theta_abs_max_raw")).toBe(true);
    expect(contract.decision_policy.feature_weights.theta_abs_max_raw > 0).toBe(true);
    expect(contract.robustness_checks.enabled).toBe(true);
    expect(contract.robustness_checks.margin_variants.length > 0).toBe(true);
    expect(contract.baseline_lane_id).toBe("lane_a_eulerian_comoving_theta_minus_trk");
    expect(contract.alternate_lane_id).toBe(
      "lane_b_shift_drift_theta_plus_div_beta_over_alpha",
    );
    expect(contract.diagnostic_policy.authoritativeLaneIdsForMechanismReadiness).toEqual([
      "lane_a_eulerian_comoving_theta_minus_trk",
    ]);
    expect(contract.diagnostic_policy.crossLaneAgreementBlocksMechanismReadiness).toBe(
      false,
    );
    expect(contract.lanes.length).toBeGreaterThanOrEqual(2);
    const laneB = contract.lanes.find(
      (entry) => entry.lane_id === "lane_b_shift_drift_theta_plus_div_beta_over_alpha",
    );
    expect(laneB?.observer_definition_id).toBe(
      "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
    );
    expect(laneB?.observer_inputs_required).toContain("gamma_xx");
    expect(laneB?.lane_semantic_mode).toBe(
      "diagnostic-observer-proxy-covariant-divergence",
    );
    expect(laneB?.semantic_mode).toBe("observer_proxy");
    expect(laneB?.foliation_definition).toContain("Diagnostic-local observer-drift proxy");
    expect(laneB?.is_proxy).toBe(true);
    expect(laneB?.is_reference_only).toBe(true);
    expect(laneB?.is_authoritative_for_readiness).toBe(false);
    expect(laneB?.is_cross_lane_promotable).toBe(false);
    expect(laneB?.requires_gamma_metric).toBe(true);
    expect(laneB?.semantics_closed).toBe(true);
    expect(laneB?.cross_lane_claim_ready).toBe(false);
    expect(laneB?.reference_comparison_ready).toBe(true);
  });

  it("keeps proxy/reference-only Lane B non-claim-ready while preserving reference comparison usability", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const laneB = contract.lanes.find(
      (entry) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    expect(laneB).toBeTruthy();
    if (!laneB) return;
    expect(laneB.is_proxy).toBe(true);
    expect(laneB.is_reference_only).toBe(true);
    expect(laneB.is_cross_lane_promotable).toBe(false);
    expect(laneB.cross_lane_claim_ready).toBe(false);
    expect(laneB.reference_comparison_ready).toBe(true);
  });

  it("allows cross-lane output when the current contract Lane B posture is closed", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const laneA = contract.lanes.find(
      (entry) => entry.lane_id === YORK_DIAGNOSTIC_BASELINE_LANE_ID,
    );
    const laneB = contract.lanes.find(
      (entry) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    expect(laneA).toBeTruthy();
    expect(laneB).toBeTruthy();
    if (!laneA || !laneB) return;

    const comparison = buildCrossLaneComparison({
      baselineLaneId: laneA.lane_id,
      alternateLaneId: laneB.lane_id,
      baseline: {
        lane_id: laneA.lane_id,
        active: laneA.active,
        supported: laneA.supported,
        unsupported_reason: laneA.unsupported_reason,
        observer: laneA.observer,
        observer_definition_id: laneA.observer_definition_id,
        observer_construction_inputs: laneA.observer_construction_inputs,
        observer_construction_formula: laneA.observer_construction_formula,
        observer_normalized: laneA.observer_normalized,
        observer_approximation: laneA.observer_approximation,
        foliation: laneA.foliation,
        theta_definition: laneA.theta_definition,
        kij_sign_convention: laneA.kij_sign_convention,
        requires_gamma_metric: laneA.requires_gamma_metric,
        semantics_closed: laneA.semantics_closed,
        cross_lane_claim_ready: laneA.cross_lane_claim_ready,
        reference_comparison_ready: laneA.reference_comparison_ready,
        cross_lane_claim_block_reason: laneA.cross_lane_claim_block_reason,
        classification_scope: laneA.classification_scope,
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: true,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: true,
          readyForCrossLaneComparison: true,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: laneB.lane_id,
        active: laneB.active,
        supported: laneB.supported,
        unsupported_reason: laneB.unsupported_reason,
        observer: laneB.observer,
        observer_definition_id: laneB.observer_definition_id,
        observer_construction_inputs: laneB.observer_construction_inputs,
        observer_construction_formula: laneB.observer_construction_formula,
        observer_normalized: laneB.observer_normalized,
        observer_approximation: laneB.observer_approximation,
        foliation: laneB.foliation,
        theta_definition: laneB.theta_definition,
        kij_sign_convention: laneB.kij_sign_convention,
        requires_gamma_metric: laneB.requires_gamma_metric,
        semantics_closed: laneB.semantics_closed,
        cross_lane_claim_ready: laneB.cross_lane_claim_ready,
        reference_comparison_ready: laneB.reference_comparison_ready,
        cross_lane_claim_block_reason: laneB.cross_lane_claim_block_reason,
        classification_scope: laneB.classification_scope,
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: laneB.semantics_closed,
          laneBObserverDefined:
            !!laneB.observer_definition_id && !!laneB.observer_construction_formula,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: laneB.cross_lane_claim_ready,
          laneBReferenceComparisonReady: laneB.reference_comparison_ready,
          readyForReferenceComparison: laneB.reference_comparison_ready,
          readyForCrossLaneComparison: false,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
    });
    expect(comparison.cross_lane_status).toBe("lane_stable_low_expansion_like");
    expect(comparison.falsifiers.lane_b_semantics_closed).toBe(true);
    expect(comparison.falsifiers.lane_b_cross_lane_claim_ready).toBe(false);
    expect(comparison.falsifiers.lane_b_reference_comparison_ready).toBe(true);
    expect(comparison.notes).toContain(
      "Lane B remains reference-only for advisory comparison; cross-lane claim promotion is disabled by policy.",
    );
  });

  it("computes lane-stable comparison status when calibrated lanes agree", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: "lane_a_eulerian_comoving_theta_minus_trk",
      alternateLaneId: "lane_c_test_supported",
      baseline: {
        lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: "lane_c_test_supported",
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
    });
    expect(comparison.same_classification).toBe(true);
    expect(comparison.cross_lane_status).toBe("lane_stable_low_expansion_like");
  });

  it("computes lane-dependent status when calibrated lanes disagree", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: "lane_a_eulerian_comoving_theta_minus_trk",
      alternateLaneId: "lane_c_test_supported",
      baseline: {
        lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: "lane_c_test_supported",
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_distinct_family",
        notes: [],
      },
    });
    expect(comparison.same_classification).toBe(false);
    expect(comparison.cross_lane_status).toBe("lane_dependent_between_low_and_distinct");
  });

  it("keeps cross-lane comparison inconclusive when alternate lane is unsupported", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: "lane_a_eulerian_comoving_theta_minus_trk",
      alternateLaneId: "lane_z_test_unsupported",
      baseline: {
        lane_id: "lane_a_eulerian_comoving_theta_minus_trk",
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: "lane_z_test_unsupported",
        active: true,
        supported: false,
        unsupported_reason: "pending",
        observer: "pending",
        foliation: "pending",
        theta_definition: "pending",
        kij_sign_convention: "pending",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: false,
          allRequiredViewsRendered: false,
          provenanceHashesPresent: false,
          runtimeStatusProvenancePresent: false,
          readyForFamilyVerdict: false,
        },
        controlsCalibratedByReferences: false,
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "inconclusive",
        notes: [],
      },
    });
    expect(comparison.cross_lane_status).toBe("lane_comparison_inconclusive");
    expect(comparison.falsifiers.alternate_supported).toBe(false);
  });

  it("keeps cross-lane comparison inconclusive when Lane B readiness gate is open", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      alternateLaneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      baseline: {
        lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: true,
          readyForCrossLaneComparison: true,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "shift_drift_u(beta_over_alpha)",
        observer_definition_id: "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
        observer_construction_inputs: ["alpha", "beta_x", "gamma_xx", "K_trace"],
        observer_construction_formula: "theta_B=-trK+div_gamma(beta/alpha)",
        observer_normalized: false,
        observer_approximation: "observer-only approximation",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK+div(beta/alpha)",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        requires_gamma_metric: true,
        semantics_closed: false,
        cross_lane_claim_ready: false,
        reference_comparison_ready: true,
        cross_lane_claim_block_reason: "lane_b_semantics_not_closed",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: false,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: false,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: false,
          readyForCrossLaneComparison: false,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
    });
    expect(comparison.cross_lane_status).toBe("lane_comparison_inconclusive");
    expect(comparison.falsifiers.lane_b_semantics_closed).toBe(false);
    expect(comparison.falsifiers.lane_b_cross_lane_claim_ready).toBe(false);
    expect(comparison.falsifiers.lane_b_reference_comparison_ready).toBe(true);
  });

  it("keeps cross-lane comparison inconclusive when Lane B tensor-input evidence is missing", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      alternateLaneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      baseline: {
        lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: true,
          readyForCrossLaneComparison: true,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "shift_drift_u(beta_over_alpha)",
        observer_definition_id: "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
        observer_construction_inputs: ["alpha", "beta_x", "gamma_xx", "K_trace"],
        observer_construction_formula: "theta_B=-trK+div_gamma(beta/alpha)",
        observer_normalized: false,
        observer_approximation: "observer-only approximation",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK+div(beta/alpha)",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        requires_gamma_metric: true,
        semantics_closed: true,
        cross_lane_claim_ready: false,
        reference_comparison_ready: true,
        cross_lane_claim_block_reason: null,
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: false,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: false,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: false,
          readyForCrossLaneComparison: false,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
    });
    expect(comparison.cross_lane_status).toBe("lane_comparison_inconclusive");
    expect(comparison.falsifiers.lane_b_tensor_inputs_present).toBe(false);
    expect(comparison.falsifiers.lane_b_geometry_ready).toBe(true);
  });

  it("keeps cross-lane comparison inconclusive when only Lane B parity is open", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      alternateLaneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      baseline: {
        lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          diagnosticParityClosed: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
        laneBControlsCalibrated: true,
        laneBParityClosed: true,
        laneBCrossLaneClaimReady: true,
        laneBReferenceComparisonReady: true,
        readyForReferenceComparison: true,
        readyForCrossLaneComparison: true,
      },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "shift_drift_u(beta_over_alpha)",
        observer_definition_id: "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
        observer_construction_inputs: ["alpha", "beta_x", "gamma_xx", "K_trace"],
        observer_construction_formula: "theta_B=-trK+div_gamma(beta/alpha)",
        observer_normalized: false,
        observer_approximation: "observer-only approximation",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK+div(beta/alpha)",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        requires_gamma_metric: true,
        semantics_closed: true,
        cross_lane_claim_ready: false,
        reference_comparison_ready: true,
        cross_lane_claim_block_reason: null,
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          diagnosticParityClosed: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: false,
          laneBCrossLaneClaimReady: false,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: false,
          readyForCrossLaneComparison: false,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
    });

    expect(comparison.cross_lane_status).toBe("lane_comparison_inconclusive");
    expect(comparison.falsifiers.lane_b_parity_closed).toBe(false);
    expect(comparison.falsifiers.baseline_controls_calibrated).toBe(true);
  });

  it("allows lane-stable status when Lane B readiness gate is closed", () => {
    const comparison = buildCrossLaneComparison({
      baselineLaneId: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
      alternateLaneId: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
      baseline: {
        lane_id: YORK_DIAGNOSTIC_BASELINE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
        laneBControlsCalibrated: true,
        laneBParityClosed: true,
        laneBCrossLaneClaimReady: true,
        laneBReferenceComparisonReady: true,
        readyForReferenceComparison: true,
        readyForCrossLaneComparison: true,
      },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
      alternate: {
        lane_id: YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
        active: true,
        supported: true,
        unsupported_reason: null,
        observer: "shift_drift_u(beta_over_alpha)",
        observer_definition_id: "obs.shift_drift_beta_over_alpha_covariant_divergence_v1",
        observer_construction_inputs: ["alpha", "beta_x", "gamma_xx", "K_trace"],
        observer_construction_formula: "theta_B=-trK+div_gamma(beta/alpha)",
        observer_normalized: false,
        observer_approximation: "observer-only approximation",
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK+div(beta/alpha)",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        requires_gamma_metric: true,
        semantics_closed: true,
        cross_lane_claim_ready: false,
        reference_comparison_ready: true,
        cross_lane_claim_block_reason: null,
        classification_scope: "diagnostic_local_only",
        cases: [],
        controlDebug: [],
        preconditions: {
          controlsIndependent: true,
          allRequiredViewsRendered: true,
          provenanceHashesPresent: true,
          runtimeStatusProvenancePresent: true,
          laneAParityClosed: true,
          readyForFamilyVerdict: true,
        },
        controlsCalibratedByReferences: true,
        laneReadiness: {
          laneBSemanticsClosed: true,
          laneBObserverDefined: true,
          laneBTensorInputsPresent: true,
          laneBGeometryReady: true,
          laneBControlsCalibrated: true,
          laneBParityClosed: true,
          laneBCrossLaneClaimReady: false,
          laneBReferenceComparisonReady: true,
          readyForReferenceComparison: true,
          readyForCrossLaneComparison: true,
        },
        guardFailures: [],
        decisionTable: [],
        classificationScoring: null,
        classificationRobustness: null,
        verdict: "nhm2_low_expansion_family",
        notes: [],
      },
    });
    expect(comparison.cross_lane_status).toBe("lane_stable_low_expansion_like");
    expect(comparison.falsifiers.lane_b_semantics_closed).toBe(true);
    expect(comparison.falsifiers.lane_b_cross_lane_claim_ready).toBe(false);
    expect(comparison.falsifiers.lane_b_reference_comparison_ready).toBe(true);
  });

  it("classifies NHM2 as low-expansion-like when feature distance is closer to Natario", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const alcFeatures = {
      theta_abs_max_raw: 9,
      theta_abs_max_display: 9,
      positive_count_xz: 40,
      negative_count_xz: 10,
      positive_count_xrho: 35,
      negative_count_xrho: 12,
      support_overlap_pct: 10,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.9,
    };
    const natFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.5,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.2,
    };
    const nhm2Features = {
      theta_abs_max_raw: 1.1,
      theta_abs_max_display: 1.05,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 12,
      negative_count_xrho: 10,
      support_overlap_pct: 3.7,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.22,
    };
    const scoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
    });
    const verdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: scoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
    });
    expect(scoring.winning_reference).toBe("natario_control");
    expect(verdict).toBe("nhm2_low_expansion_family");
  });

  it("classifies NHM2 as Alcubierre-like when feature distance is closer to Alcubierre", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const alcFeatures = {
      theta_abs_max_raw: 9,
      theta_abs_max_display: 9,
      positive_count_xz: 40,
      negative_count_xz: 10,
      positive_count_xrho: 35,
      negative_count_xrho: 12,
      support_overlap_pct: 10,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.9,
    };
    const natFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.5,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.2,
    };
    const nhm2Features = {
      theta_abs_max_raw: 8.8,
      theta_abs_max_display: 8.7,
      positive_count_xz: 39,
      negative_count_xz: 10,
      positive_count_xrho: 34,
      negative_count_xrho: 12,
      support_overlap_pct: 9.5,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.85,
    };
    const scoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
    });
    const verdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: scoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
    });
    expect(scoring.winning_reference).toBe("alcubierre_control");
    expect(verdict).toBe("nhm2_alcubierre_like_family");
  });

  it("classifies NHM2 as distinct when references are too close by margin policy", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const alcFeatures = {
      theta_abs_max_raw: 4,
      theta_abs_max_display: 4,
      positive_count_xz: 20,
      negative_count_xz: 15,
      positive_count_xrho: 19,
      negative_count_xrho: 16,
      support_overlap_pct: 5,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.4,
    };
    const natFeatures = {
      theta_abs_max_raw: 4.2,
      theta_abs_max_display: 4.1,
      positive_count_xz: 21,
      negative_count_xz: 15,
      positive_count_xrho: 20,
      negative_count_xrho: 16,
      support_overlap_pct: 5.1,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.41,
    };
    const nhm2Features = {
      theta_abs_max_raw: 4.1,
      theta_abs_max_display: 4.05,
      positive_count_xz: 20,
      negative_count_xz: 15,
      positive_count_xrho: 20,
      negative_count_xrho: 16,
      support_overlap_pct: 5.05,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.405,
    };
    const scoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
    });
    const verdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: scoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
    });
    expect(scoring.margin_sufficient).toBe(false);
    expect(verdict).toBe("nhm2_distinct_family");
  });

  it("keeps verdict inconclusive when renderer calibration fails", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const scoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: {
        theta_abs_max_raw: 8,
        theta_abs_max_display: 8,
        positive_count_xz: 30,
        negative_count_xz: 12,
        positive_count_xrho: 29,
        negative_count_xrho: 13,
        support_overlap_pct: 8,
        near_zero_theta: false,
        signed_lobe_summary: "fore+/aft-",
        shell_map_activity: 0.7,
      },
      natarioFeatures: {
        theta_abs_max_raw: 1,
        theta_abs_max_display: 1,
        positive_count_xz: 10,
        negative_count_xz: 10,
        positive_count_xrho: 10,
        negative_count_xrho: 10,
        support_overlap_pct: 3,
        near_zero_theta: true,
        signed_lobe_summary: null,
        shell_map_activity: 0.2,
      },
      nhm2Features: {
        theta_abs_max_raw: 1,
        theta_abs_max_display: 1,
        positive_count_xz: 10,
        negative_count_xz: 10,
        positive_count_xrho: 10,
        negative_count_xrho: 10,
        support_overlap_pct: 3,
        near_zero_theta: true,
        signed_lobe_summary: null,
        shell_map_activity: 0.2,
      },
    });
    const verdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: false,
      classificationScoring: scoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
    });
    expect(verdict).toBe("inconclusive");
  });

  it("marks robustness as stable low-expansion-like for clearly Natario-like NHM2", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const alcFeatures = {
      theta_abs_max_raw: 9,
      theta_abs_max_display: 9,
      positive_count_xz: 40,
      negative_count_xz: 10,
      positive_count_xrho: 35,
      negative_count_xrho: 12,
      support_overlap_pct: 10,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.9,
    };
    const natFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.5,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.2,
    };
    const nhm2Features = {
      theta_abs_max_raw: 1.02,
      theta_abs_max_display: 1.01,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.55,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.21,
    };
    const baselineScoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
    });
    const baselineVerdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: baselineScoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
    });
    const robustness = evaluateClassificationRobustness({
      contract,
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
      baselineVerdict,
      baselineScoring,
    });
    expect(baselineVerdict).toBe("nhm2_low_expansion_family");
    expect(robustness.stabilityStatus).toBe("stable_low_expansion_like");
    expect(robustness.verdictCounts.nhm2_low_expansion_family).toBeGreaterThan(0);
  });

  it("marks robustness as stable Alcubierre-like for clearly Alcubierre-like NHM2", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const alcFeatures = {
      theta_abs_max_raw: 9,
      theta_abs_max_display: 9,
      positive_count_xz: 40,
      negative_count_xz: 10,
      positive_count_xrho: 35,
      negative_count_xrho: 12,
      support_overlap_pct: 10,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.9,
    };
    const natFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.5,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.2,
    };
    const nhm2Features = {
      theta_abs_max_raw: 8.95,
      theta_abs_max_display: 8.9,
      positive_count_xz: 40,
      negative_count_xz: 10,
      positive_count_xrho: 35,
      negative_count_xrho: 12,
      support_overlap_pct: 10,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.88,
    };
    const baselineScoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
    });
    const baselineVerdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: baselineScoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
    });
    const robustness = evaluateClassificationRobustness({
      contract,
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
      baselineVerdict,
      baselineScoring,
    });
    expect(baselineVerdict).toBe("nhm2_alcubierre_like_family");
    expect(robustness.stabilityStatus).toBe("stable_alcubierre_like");
    expect(robustness.verdictCounts.nhm2_alcubierre_like_family).toBeGreaterThan(0);
  });

  it("reports marginal or unstable robustness when NHM2 is borderline between low and distinct", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    contract.robustness_checks.weight_perturbation_pct = 0.5;
    contract.robustness_checks.margin_variants = [0.01, 0.08, 0.2, 0.5, 1, 2, 3, 4, 5, 6];
    contract.robustness_checks.threshold_variants = [0.2, 0.5, 0.9, 1.2, 1.5];
    contract.robustness_checks.feature_drop_sets = [
      { id: "drop_signed_lobe", drop_features: ["signed_lobe_summary"] },
      { id: "drop_shell", drop_features: ["shell_map_activity"] },
      {
        id: "drop_xrho",
        drop_features: ["positive_count_xrho", "negative_count_xrho"],
      },
    ];
    const alcFeatures = {
      theta_abs_max_raw: 9,
      theta_abs_max_display: 9,
      positive_count_xz: 40,
      negative_count_xz: 10,
      positive_count_xrho: 35,
      negative_count_xrho: 12,
      support_overlap_pct: 10,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-" as const,
      shell_map_activity: 0.9,
    };
    const natFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.5,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.2,
    };
    const nhm2Features = {
      theta_abs_max_raw: 1.9,
      theta_abs_max_display: 1.8,
      positive_count_xz: 13,
      negative_count_xz: 10,
      positive_count_xrho: 13,
      negative_count_xrho: 10,
      support_overlap_pct: 4.6,
      near_zero_theta: false,
      signed_lobe_summary: null,
      shell_map_activity: 0.3,
    };
    const baselineScoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
    });
    const baselineVerdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: baselineScoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
    });
    const robustness = evaluateClassificationRobustness({
      contract,
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
      alcubierreFeatures: alcFeatures,
      natarioFeatures: natFeatures,
      nhm2Features,
      baselineVerdict,
      baselineScoring,
    });
    expect(["marginal_low_expansion_like", "marginal_distinct", "unstable_multiclass"]).toContain(
      robustness.stabilityStatus,
    );
  });

  it("emits robustness summary payload fields from contract-based sweep", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const baselineScoring = scoreNhm2AgainstReferenceControls({
      contract,
      alcubierreFeatures: {
        theta_abs_max_raw: 9,
        theta_abs_max_display: 9,
        positive_count_xz: 40,
        negative_count_xz: 10,
        positive_count_xrho: 35,
        negative_count_xrho: 12,
        support_overlap_pct: 10,
        near_zero_theta: false,
        signed_lobe_summary: "fore+/aft-",
        shell_map_activity: 0.9,
      },
      natarioFeatures: {
        theta_abs_max_raw: 1,
        theta_abs_max_display: 1,
        positive_count_xz: 10,
        negative_count_xz: 9,
        positive_count_xrho: 11,
        negative_count_xrho: 10,
        support_overlap_pct: 3.5,
        near_zero_theta: true,
        signed_lobe_summary: null,
        shell_map_activity: 0.2,
      },
      nhm2Features: {
        theta_abs_max_raw: 1.1,
        theta_abs_max_display: 1.05,
        positive_count_xz: 10,
        negative_count_xz: 9,
        positive_count_xrho: 11,
        negative_count_xrho: 10,
        support_overlap_pct: 3.6,
        near_zero_theta: true,
        signed_lobe_summary: null,
        shell_map_activity: 0.21,
      },
    });
    const baselineVerdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      classificationScoring: baselineScoring,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
    });
    const robustness = evaluateClassificationRobustness({
      contract,
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      controlsCalibratedByReferences: true,
      yorkCongruence: {
        hashMismatch: false,
        rhoRemapMismatch: false,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
      authoritativeLowExpansionGate: makePassedAuthoritativeLowExpansionGate(),
      alcubierreFeatures: {
        theta_abs_max_raw: 9,
        theta_abs_max_display: 9,
        positive_count_xz: 40,
        negative_count_xz: 10,
        positive_count_xrho: 35,
        negative_count_xrho: 12,
        support_overlap_pct: 10,
        near_zero_theta: false,
        signed_lobe_summary: "fore+/aft-",
        shell_map_activity: 0.9,
      },
      natarioFeatures: {
        theta_abs_max_raw: 1,
        theta_abs_max_display: 1,
        positive_count_xz: 10,
        negative_count_xz: 9,
        positive_count_xrho: 11,
        negative_count_xrho: 10,
        support_overlap_pct: 3.5,
        near_zero_theta: true,
        signed_lobe_summary: null,
        shell_map_activity: 0.2,
      },
      nhm2Features: {
        theta_abs_max_raw: 1.1,
        theta_abs_max_display: 1.05,
        positive_count_xz: 10,
        negative_count_xz: 9,
        positive_count_xrho: 11,
        negative_count_xrho: 10,
        support_overlap_pct: 3.6,
        near_zero_theta: true,
        signed_lobe_summary: null,
        shell_map_activity: 0.21,
      },
      baselineVerdict,
      baselineScoring,
    });
    expect(robustness.baselineVerdict).toBe("nhm2_low_expansion_family");
    expect(robustness.variantResults.length).toBeGreaterThan(1);
    expect(robustness.verdictCounts.nhm2_low_expansion_family).toBeGreaterThan(0);
    expect(typeof robustness.stabilityStatus).toBe("string");
  });

  it("treats tiny signed non-near-zero York control as strong fore/aft evidence", () => {
    const primaryYork = {
      view: "york-surface-rho-3p1",
      rawExtrema: { min: -8e-33, max: 4e-33, absMax: 8e-33 },
      displayExtrema: {
        min: -8e-33,
        max: 4e-33,
        absMax: 8e-33,
        rangeMethod: "computeSliceRange:diverging:p98-abs-symmetric",
        gain: 1,
        heightScale: 0.9,
      },
      nearZeroTheta: false,
      coordinateMode: "x-rho",
      samplingChoice: "x-rho cylindrical remap",
      supportOverlapPct: 4.5,
    };
    expect(hasStrongForeAftYork(primaryYork as any)).toBe(true);
  });

  it("treats tiny but signed Alcubierre lobe structure as signal-sufficient", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc") as any;
    alcCase.primaryYork.rawExtrema = { min: -8e-33, max: 4e-33, absMax: 8e-33 };
    alcCase.primaryYork.nearZeroTheta = true;
    alcCase.offlineYorkAudit.byView = [
      {
        view: "york-surface-3p1",
        coordinateMode: "x-z-midplane",
        samplingChoice: "x-z midplane",
        thetaSliceHash: "tiny-signed-xz",
        rawExtrema: { min: -8e-33, max: 4e-33, absMax: 8e-33 },
        counts: { positive: 12, negative: 10, zeroOrNearZero: 2, total: 24 },
      },
      {
        view: "york-surface-rho-3p1",
        coordinateMode: "x-rho",
        samplingChoice: "x-rho cylindrical remap",
        thetaSliceHash: "tiny-signed-rho",
        rawExtrema: { min: -3e-33, max: 2e-33, absMax: 3e-33 },
        counts: { positive: 8, negative: 7, zeroOrNearZero: 9, total: 24 },
      },
    ];

    expect(hasSufficientSignalForAlcubierreControl(alcCase)).toBe(true);
  });

  it("keeps uniformly near-zero Alcubierre slices signal-insufficient", () => {
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc") as any;
    alcCase.primaryYork.rawExtrema = { min: 0, max: 0, absMax: 0 };
    alcCase.primaryYork.nearZeroTheta = true;
    alcCase.offlineYorkAudit.byView = [
      {
        view: "york-surface-3p1",
        coordinateMode: "x-z-midplane",
        samplingChoice: "x-z midplane",
        thetaSliceHash: "flat-xz",
        rawExtrema: { min: 0, max: 0, absMax: 0 },
        counts: { positive: 0, negative: 0, zeroOrNearZero: 24, total: 24 },
      },
      {
        view: "york-surface-rho-3p1",
        coordinateMode: "x-rho",
        samplingChoice: "x-rho cylindrical remap",
        thetaSliceHash: "flat-rho",
        rawExtrema: { min: 0, max: 0, absMax: 0 },
        counts: { positive: 0, negative: 0, zeroOrNearZero: 24, total: 24 },
      },
    ];

    expect(hasSufficientSignalForAlcubierreControl(alcCase)).toBe(false);
  });

  it("builds a dedicated reduced-order artifact from the proof-pack payload", () => {
    const contract = loadYorkDiagnosticContract("configs/york-diagnostic-contract.v1.json");
    const alcCase = makeCase("alcubierre_control", "theta-hash-alc") as any;
    const natCase = makeCase("natario_control", "theta-hash-nat") as any;
    const nhm2Case = makeCase("nhm2_certified", "theta-hash-nhm2") as any;
    nhm2Case.classificationFeatures = {
      theta_abs_max_raw: 1.1,
      theta_abs_max_display: 1.05,
      positive_count_xz: 10,
      negative_count_xz: 9,
      positive_count_xrho: 11,
      negative_count_xrho: 10,
      support_overlap_pct: 3.6,
      near_zero_theta: true,
      signed_lobe_summary: null,
      shell_map_activity: 0.21,
    };
    nhm2Case.snapshotMetrics.source = "metric";
    const payload = {
      artifactType: "warp_york_control_family_proof_pack/v1",
      generatedOn: "2026-03-30",
      generatedAt: "2026-03-30T00:00:00.000Z",
      boundaryStatement: "boundary",
      diagnosticContractId: contract.contract_id,
      classificationScope: contract.classification_scope,
      diagnosticContract: contract,
      diagnosticLanes: [
        {
          lane_id: contract.baseline_lane_id,
          active: true,
          supported: true,
          unsupported_reason: null,
          observer: "eulerian_n",
          foliation: "comoving_cartesian_3p1",
          theta_definition: "theta=-trK",
          kij_sign_convention: "ADM",
          classification_scope: "diagnostic_local_only",
          cases: [alcCase, natCase, nhm2Case],
          controlDebug: [],
          preconditions: {
            controlsIndependent: true,
            allRequiredViewsRendered: true,
            provenanceHashesPresent: true,
            runtimeStatusProvenancePresent: true,
            readyForFamilyVerdict: true,
          },
          controlsCalibratedByReferences: true,
          guardFailures: [],
          decisionTable: [],
          classificationScoring: {
            distance_to_alcubierre_reference: 0.13,
            distance_to_low_expansion_reference: 0.001,
            reference_margin: 0.129,
            winning_reference: "natario_control",
            margin_sufficient: true,
            winning_reference_within_threshold: true,
            distinct_by_policy: false,
            distinctness_threshold: 0.5,
            margin_min: 0.08,
            reference_match_threshold: 0.5,
            distance_metric: "weighted_normalized_l1",
            normalization_method: "max_abs_reference_target_with_floor",
            to_alcubierre_breakdown: {} as any,
            to_low_expansion_breakdown: {} as any,
          },
          classificationRobustness: {
            enabled: true,
            baselineVerdict: "nhm2_low_expansion_family",
            variantResults: [],
            verdictCounts: {
              nhm2_alcubierre_like_family: 0,
              nhm2_low_expansion_family: 5,
              nhm2_distinct_family: 0,
              inconclusive: 0,
            },
            dominantVerdict: "nhm2_low_expansion_family",
            dominantFraction: 1,
            stableVerdict: "nhm2_low_expansion_family",
            stabilityStatus: "stable_low_expansion_like",
            stabilityPolicy: { stable_fraction_min: 0.8, marginal_fraction_min: 0.6 },
            totalVariants: 5,
            evaluatedVariants: 5,
          },
          verdict: "nhm2_low_expansion_family",
          notes: ["lane-note"],
        },
      ],
      crossLaneComparison: {
        baseline_lane_id: contract.baseline_lane_id,
        alternate_lane_id: contract.alternate_lane_id,
        baseline_verdict: "nhm2_low_expansion_family",
        alternate_verdict: "inconclusive",
        same_classification: false,
        cross_lane_status: "lane_comparison_inconclusive",
        falsifiers: {
          baseline_controls_calibrated: true,
          alternate_controls_calibrated: false,
          baseline_supported: true,
          alternate_supported: false,
        },
        notes: [],
      },
      inputs: {
        baseUrl: "http://127.0.0.1:5050",
        frameEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/frame",
        proxyFrameEndpoint: "http://127.0.0.1:5050/api/helix/hull-render/frame",
        compareDirectAndProxy: false,
        nhm2SnapshotPath: "artifacts/research/full-solve/nhm2.json",
        yorkViews: REQUIRED_VIEWS,
        frameSize: { width: 320, height: 180 },
      },
      cases: [alcCase, natCase, nhm2Case],
      controlDebug: [],
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      guardFailures: [],
      decisionTable: [],
      classificationScoring: {
        distance_to_alcubierre_reference: 0.13,
        distance_to_low_expansion_reference: 0.001,
        reference_margin: 0.129,
        winning_reference: "natario_control",
        margin_sufficient: true,
        winning_reference_within_threshold: true,
        distinct_by_policy: false,
        distinctness_threshold: 0.5,
        margin_min: 0.08,
        reference_match_threshold: 0.5,
        distance_metric: "weighted_normalized_l1",
        normalization_method: "max_abs_reference_target_with_floor",
        to_alcubierre_breakdown: {} as any,
        to_low_expansion_breakdown: {} as any,
      },
      classificationRobustness: {
        enabled: true,
        baselineVerdict: "nhm2_low_expansion_family",
        variantResults: [],
        verdictCounts: {
          nhm2_alcubierre_like_family: 0,
          nhm2_low_expansion_family: 5,
          nhm2_distinct_family: 0,
          inconclusive: 0,
        },
        dominantVerdict: "nhm2_low_expansion_family",
        dominantFraction: 1,
        stableVerdict: "nhm2_low_expansion_family",
        stabilityStatus: "stable_low_expansion_like",
        stabilityPolicy: { stable_fraction_min: 0.8, marginal_fraction_min: 0.6 },
        totalVariants: 5,
        evaluatedVariants: 5,
      },
      verdict: "nhm2_low_expansion_family",
      notes: ["root-note"],
      provenance: {
        commitHash: "eadb6718",
        runtimeStatus: {
          statusEndpoint: "http://127.0.0.1:6062/api/helix/hull-render/status",
          serviceVersion: "v1",
          buildHash: "build",
          commitSha: "eadb6718",
          processStartedAtMs: 1234,
          runtimeInstanceId: "runtime",
          reachable: true,
        },
      },
      checksum: "unused",
    } as any;

    const rodc = buildWarpRodcSnapshot({
      payload,
      sourceAuditArtifact: "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    });

    expect(rodc.artifactType).toBe("warp_rodc_snapshot/v1");
    expect(rodc.contract.lane_id).toBe(contract.baseline_lane_id);
    expect(rodc.inputs.source_case_id).toBe("nhm2_certified");
    expect(rodc.distance.winning_reference).toBe("natario_control");
    expect(rodc.verdict.status).toBe("congruent");
    expect(rodc.verdict.stability).toBe("stable");
    expect(rodc.evidence_hashes.theta_channel_hash).toBe("theta-hash-nhm2");
    expect(rodc.evidence_hashes.slice_hashes_by_view["york-surface-rho-3p1"]).toBe("slice-hash");
    expect(typeof rodc.checksum).toBe("string");
    expect(rodc.checksum?.length).toBeGreaterThan(10);
  });

  it("builds source-to-york provenance artifact sections and closes serialized bridge mappings under the current readiness policy", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.verdict = "nhm2_low_expansion_family";
    payload.crossLaneComparison.cross_lane_status = "lane_stable_low_expansion_like";
    const nhm2Case = payload.cases.find((entry: any) => entry.caseId === "nhm2_certified");
    expect(nhm2Case).toBeTruthy();
    nhm2Case.metricVolumeRef.url =
      "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1";
    nhm2Case.snapshotMetrics.metricRefHash = "metric-ref";
    nhm2Case.snapshotMetrics.requestMetricRefHash = "metric-ref";
    payload.controlDebug = [
      {
        caseId: "nhm2_certified",
        requestUrl: nhm2Case.metricVolumeRef.url,
      },
    ];

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "warp-source-york-"));
    const snapshotPath = path.join(tmpDir, "nhm2-snapshot.json");
    const runOutputPath = path.join(tmpDir, "run-1-raw-output.json");
    const evidencePath = path.join(tmpDir, "evidence-pack.json");
    fs.writeFileSync(
      snapshotPath,
      JSON.stringify({
        metricVolumeRef: {
          url: nhm2Case.metricVolumeRef.url,
          hash: "metric-ref",
        },
      }),
    );
    fs.writeFileSync(
      runOutputPath,
      JSON.stringify({
        result: {
          attempts: [
            {
              proposal: {
                label: "wave-a-promoted-profile-NHM2-2026-03-01-iter-1",
                params: {
                  tauLC_ms: 3.34,
                  warpFieldType: "natario_sdf",
                  sectorCount: 80,
                  concurrentSectors: 2,
                  dutyCycle: 0.12,
                  dutyShip: 0.12,
                  qCavity: 100000,
                  qSpoilingFactor: 3,
                  gammaGeo: 1,
                  gammaVanDenBroeck: 500,
                  modulationFreq_GHz: 15,
                  shipRadius_m: 2,
                },
              },
              grRequest: {
                TS: 50,
                TS_ratio: 50,
                epsilon: 0.001,
                dutyEffectiveFR: 0.0015,
              },
            },
          ],
          finalState: {
            isHomogenized: true,
          },
        },
      }),
    );
    fs.writeFileSync(
      evidencePath,
      JSON.stringify({
        wave: "A",
        runArtifacts: [
          {
            accepted: true,
            outputPath: runOutputPath,
          },
        ],
        g4Diagnostics: {
          tauPulse_s: 6.7e-8,
          tauSelectedSource: "configured",
        },
      }),
    );

    const artifact = buildNhm2SourceToYorkProvenanceArtifact({
      payload,
      nhm2SnapshotPath: snapshotPath,
      waveAEvidencePackPath: evidencePath,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    });
    expect(artifact.artifactType).toBe("nhm2_source_to_york_provenance/v1");
    expect(artifact.nhm2ContractInputs.qCavity).toBe(100000);
    expect(artifact.promotedProfileDefaults.gammaGeo).toBe(1);
    expect(artifact.proofPackBrickRequest.gammaGeo).toBe(26);
    expect(artifact.proofPackSnapshotRefs.york_verdict).toBe("nhm2_low_expansion_family");
    expect(
      artifact.parameterMappings.find((entry) => entry.field === "dutyShip -> dutyFR")
        ?.mapping_type,
    ).toBe("audit_harness_override");
    expect(
      artifact.parameterMappings.find((entry) => entry.field === "modulationFreq_GHz")
        ?.mapping_type,
    ).toBe("direct_copy");
    expect(artifact.parameterMappings.find((entry) => entry.field === "sectorCount")?.status).toBe(
      "closed",
    );
    expect(
      artifact.parameterMappings.find((entry) => entry.field === "reducedOrderReference.radius_m")
        ?.status,
    ).toBe("closed");
    expect(artifact.bridgeReadiness.timingAuthorityPresent).toBe(true);
    expect(artifact.bridgeReadiness.timingAuthorityStatus).toBe(
      "recognized_required_fields_present",
    );
    expect(artifact.bridgeReadiness.parameterMappingsComplete).toBe(true);
    expect(artifact.bridgeReadiness.parameterMappingsExplained).toBe(true);
    expect(artifact.bridgeReadiness.bridgeReady).toBe(true);
    expect(artifact.bridgeReadiness.bridgeOpenFieldCount).toBe(0);
    expect(artifact.bridgeReadiness.bridgeClosurePolicy).toBe("close_with_current_serialization");
    expect(artifact.bridgeReadiness.gatingStatus).toBe("legacy_advisory_non_gating");
    expect(artifact.bridgeReadiness.gatingBlocksMechanismChain).toBe(false);
    expect(artifact.bridgeReadiness.blockReasons).toEqual([]);
    expect(renderNhm2SourceToYorkProvenanceMarkdown(artifact)).toContain(
      "## Parameter Mapping",
    );
    expect(renderNhm2SourceToYorkProvenanceMarkdown(artifact)).toContain(
      "legacy_advisory_non_gating",
    );
    expect(renderNhm2SourceToYorkProvenanceMarkdown(artifact)).toContain(
      "bridgeClosurePolicy | close_with_current_serialization",
    );
  });

  it("keeps bridge readiness fail-closed for missing/unexplained mappings and can close when complete", () => {
    const openReadiness = computeSourceToYorkBridgeReadiness({
      sourceContractPresent: true,
      timingAuthorityPresent: true,
      timingAuthorityStatus: "recognized_required_fields_present",
      timingAuthorityArtifactRecognized: true,
      timingAuthorityRequiredFields: ["tauLC_ms", "tauPulse_ms", "TS_ratio"],
      timingAuthorityOptionalMissingFields: [],
      reducedOrderPayloadPresent: true,
      proofPackBrickPresent: true,
      parameterMappings: [
        {
          field: "sectorCount",
          source_value: 80,
          target_value: null,
          mapping_type: "missing_derivation",
          mapping_formula: null,
          mapping_note: "not serialized",
          status: "open",
        },
      ] as any,
      metricRefProvenanceClosed: true,
    });
    expect(openReadiness.bridgeReady).toBe(false);
    expect(openReadiness.gatingStatus).toBe("legacy_advisory_non_gating");
    expect(openReadiness.gatingBlocksMechanismChain).toBe(false);
    expect(openReadiness.blockReasons).toContain("bridge_param_mapping_missing");
    expect(openReadiness.blockReasons).toContain(
      "bridge_contract_to_brick_drift_unexplained",
    );
    expect(openReadiness.bridgeOpenFieldCount).toBe(1);
    expect(openReadiness.openFields).toContain("sectorCount");
    expect(openReadiness.bridgeClosurePolicy).toBe("close_with_current_serialization");
    expect(openReadiness.closureCandidateStatus).toBe("closable_with_current_serialization");

    const closedReadiness = computeSourceToYorkBridgeReadiness({
      sourceContractPresent: true,
      timingAuthorityPresent: true,
      timingAuthorityStatus: "recognized_required_fields_present_optional_fields_partial",
      timingAuthorityArtifactRecognized: true,
      timingAuthorityRequiredFields: ["tauLC_ms", "tauPulse_ms", "TS_ratio"],
      timingAuthorityOptionalMissingFields: ["TS", "epsilon", "isHomogenized"],
      reducedOrderPayloadPresent: true,
      proofPackBrickPresent: true,
      parameterMappings: [
        {
          field: "gammaVanDenBroeck -> gammaVdB",
          source_value: 500,
          target_value: 500,
          mapping_type: "direct_copy",
          mapping_formula: "gammaVdB = gammaVanDenBroeck",
          mapping_note: null,
          status: "closed",
        },
        {
          field: "qSpoilingFactor -> q",
          source_value: 3,
          target_value: 3,
          mapping_type: "policy_override",
          mapping_formula: "q = qSpoilingFactor",
          mapping_note: "reduced-order selector",
          status: "closed",
        },
      ] as any,
      metricRefProvenanceClosed: true,
    });
    expect(closedReadiness.parameterMappingsComplete).toBe(true);
    expect(closedReadiness.parameterMappingsExplained).toBe(true);
    expect(closedReadiness.bridgeReady).toBe(true);
    expect(closedReadiness.gatingBlocksMechanismChain).toBe(false);
    expect(closedReadiness.timingAuthorityStatus).toBe(
      "recognized_required_fields_present_optional_fields_partial",
    );
    expect(closedReadiness.residualAdvisoryReasons).toContain(
      "bridge_timing_authority_optional_fields_partial",
    );
    expect(closedReadiness.bridgeClosurePolicy).toBe("close_with_current_serialization");
    expect(closedReadiness.closureCandidateStatus).toBe("closed_with_current_serialization");
  });

  it("propagates refined source-to-york bridge summary fields into the proof-pack alias", () => {
    const sourceToYork = makeSourceToYorkFixture() as any;
    const summary = buildSourceToYorkBridgeSummary({
      artifact: sourceToYork,
      artifactPath: "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-source-to-york-provenance-latest.md",
    });

    expect(summary.readiness.bridgeOpenFieldCount).toBe(2);
    expect(summary.readiness.bridgeClosurePolicy).toBe("close_with_current_serialization");
    expect(summary.readiness.timingAuthorityStatus).toBe(
      "recognized_required_fields_present",
    );
    expect(summary.readiness.openFields).toContain("sectorCount");
    expect(summary.artifactPath).toContain("nhm2-source-to-york-provenance-latest.json");
  });

  it("emits source-stage compared fields with numeric deltas and markdown summary", () => {
    const { artifact } = buildSourceStageFixture();
    expect(artifact.artifactType).toBe("nhm2_source_stage_audit/v1");
    expect(
      artifact.comparedSourceFields.find((entry) => entry.field === "metricT00Si_Jm3")
        ?.delta_abs,
    ).toBeGreaterThan(0);
    expect(artifact.sourceAuthorityPolicy.authoritativeAuthorityId).toBe(
      "canonical_qi_forensics",
    );
    expect(artifact.sourceAuthorityPolicy.mixedAuthorityDetected).toBe(false);
    expect(artifact.numericGapDecomposition.primaryCandidate).toBe(
      "recovery_reconstruction_mismatch",
    );
    expect(
      artifact.numericGapDecomposition.numericGapCandidates.find(
        (entry) => entry.candidate_id === "recovery_reconstruction_mismatch",
      )?.status,
    ).toBe("supported");
    expect(artifact.stage.source_stage_cause).toBe("none");
    expect(artifact.stage.source_stage_ready).toBe(true);
    expect(artifact.blockingFindings).toEqual([]);
    expect(artifact.advisoryFindings).toContain("recovery_reconstruction_mismatch");
    const markdown = renderNhm2SourceStageAuditMarkdown(artifact);
    expect(markdown).toContain("## Compared Source Fields");
    expect(markdown).toContain("## Source Authorities In Conflict");
    expect(markdown).toContain("## Source Formula Comparison Policy");
    expect(markdown).toContain("## Source-Path Provenance");
    expect(markdown).toContain("## Numeric Gap Decomposition");
    expect(markdown).toContain("## Numeric Gap Candidates");
  });

  it("classifies normalization drift when selectors match but normalization differs", () => {
    const { artifact } = buildSourceStageFixture({
      canonical: { metricT00Normalization: "point_splitting" },
      sourceToYork: {
        ...makeSourceToYorkFixture(),
        reducedOrderPipelinePayload: {
          ...makeSourceToYorkFixture().reducedOrderPipelinePayload,
          grRequest: {
            ...makeSourceToYorkFixture().reducedOrderPipelinePayload.grRequest,
            warp: {
              metricT00Contract: {
                observer: "eulerian_n",
                normalization: "si_stress",
                unitSystem: "SI",
              },
              metricAdapter: {
                chart: { label: "comoving_cartesian" },
              },
            },
          },
        },
      },
    });
    expect(
      artifact.componentAudit.find((entry) => entry.component === "metric_selector")?.status,
    ).toBe("matched");
    expect(
      artifact.componentAudit.find((entry) => entry.component === "normalization_mode")?.status,
    ).toBe("drifted");
    expect(artifact.stage.source_stage_cause).toBe("normalization_drift");
    expect(artifact.stage.source_stage_ready).toBe(false);
  });

  it("classifies normalization scale mismatch when qei normalization labels differ", () => {
    const { artifact } = buildSourceStageFixture({
      canonical: {
        qeiSamplingNormalization: "unit_integral",
        qeiRenormalizationScheme: "point_splitting",
      },
      recovery: {
        qeiSamplingNormalization: "volume_average",
        qeiRenormalizationScheme: "adiabatic_subtraction",
        metricT00Derivation: null,
      },
    });
    expect(artifact.stage.source_stage_cause).toBe("normalization_scale_mismatch");
    expect(artifact.numericGapDecomposition.primaryCandidate).toBe(
      "normalization_scale_mismatch",
    );
  });

  it("classifies unit-system drift when units differ across source authorities", () => {
    const { artifact } = buildSourceStageFixture({
      canonical: {
        metricT00UnitSystem: "SI",
      },
      recovery: {
        metricT00UnitSystem: "CGS",
        metricT00Derivation: null,
      },
    });
    expect(artifact.stage.source_stage_cause).toBe("unit_system_drift");
    expect(artifact.numericGapDecomposition.primaryCandidate).toBe(
      "unit_conversion_mismatch",
    );
  });

  it("classifies metric selector drift when rhoSource/metricT00Ref diverge", () => {
    const { artifact } = buildSourceStageFixture({
      canonical: {
        rhoSource: "warp.metric.T00.alcubierre.analytic",
        metricT00Ref: "warp.metric.T00.alcubierre.analytic",
      },
    });
    expect(
      artifact.componentAudit.find((entry) => entry.component === "metric_selector")?.status,
    ).toBe("drifted");
    expect(artifact.stage.source_stage_cause).toBe("metric_selector_drift");
  });

  it("reports mixed authority when more than one source path is marked authoritative for readiness", () => {
    const { artifact } = buildSourceStageFixture({
      sourceAuthorityRoleOverrides: {
        canonical_qi_forensics: "authoritative",
        recovery_search_case: "authoritative",
      },
    });
    expect(artifact.sourceAuthorityPolicy.mixedAuthorityDetected).toBe(true);
    expect(artifact.stage.source_stage_cause).toBe("mixed_authority_source_path");
    expect(
      artifact.sourceAuthoritiesInConflict.filter((entry) => entry.current_role === "authoritative")
        .length,
    ).toBeGreaterThan(1);
  });

  it("keeps mixed-authority closed when recovery remains comparison-only", () => {
    const { artifact } = buildSourceStageFixture();
    const recoveryAuthority = artifact.sourceAuthoritiesInConflict.find(
      (entry) => entry.authority_id === "recovery_search_case",
    );
    expect(recoveryAuthority?.current_role).toBe("comparison_only");
    expect(artifact.sourceAuthorityPolicy.mixedAuthorityDetected).toBe(false);
    expect(artifact.stage.source_stage_cause).not.toBe("mixed_authority_source_path");
  });

  it("keeps recovery reconstruction mismatch advisory when comparison path is reconstruction-only", () => {
    const { artifact, sourceFormulaArtifact } = buildSourceStageFixture({
      canonical: {
        metricT00Derivation: null,
        metricT00GeomSource: "direct_metric_pipeline",
      },
      recovery: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
      },
    });
    expect(sourceFormulaArtifact.formulaComparison.formulaMismatchClass).toBe(
      "direct_vs_reconstructed",
    );
    expect(artifact.numericGapDecomposition.primaryCandidate).toBe(
      "source_formula_mismatch",
    );
    expect(sourceFormulaArtifact.policy.comparison_path_blocks_readiness).toBe(false);
    expect(artifact.stage.source_stage_cause).toBe("none");
    expect(artifact.stage.source_stage_ready).toBe(true);
    expect(artifact.blockingFindings).toEqual([]);
    expect(artifact.advisoryFindings).toContain("recovery_reconstruction_mismatch");
  });

  it("emits source-formula audit artifact and markdown with explicit mismatch class", () => {
    const { sourceFormulaArtifact } = buildSourceStageFixture({
      canonical: {
        metricT00GeomSource: "direct_metric_pipeline",
        rhoMetric_Jm3: -89888730.09553961,
        couplingAlpha: 0.5,
        metricT00SiRelError: 0,
        tauSelected_s: 0.00002,
        tauLC_s: 0.000003358990438645391,
        tauPulse_s: 6.717980877290783e-8,
      },
      recovery: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
        rhoMetric_Jm3: -89888730.09553961,
        metricStressRhoSiMean_Jm3: -89888730.09553961,
        couplingAlpha: 0.5,
        metricT00SiRelError: 0,
        params: {
          dutyEffective_FR: 0.12,
          sectorCount: 80,
          concurrentSectors: 2,
          qCavity: 100000,
          qSpoilingFactor: 3,
          gammaGeo: 1,
          gammaVanDenBroeck: 500,
          tau_s_ms: 0.02,
        },
      },
    });
    expect(sourceFormulaArtifact.artifactType).toBe("nhm2_source_formula_audit/v1");
    expect(sourceFormulaArtifact.policy.comparison_path_policy).toBe(
      "canonical_authoritative_recovery_comparison_only",
    );
    expect(sourceFormulaArtifact.policy.comparison_path_role).toBe("reconstruction_only");
    expect(sourceFormulaArtifact.policy.comparison_path_expected_equivalence).toBe(false);
    expect(sourceFormulaArtifact.policy.comparison_path_blocks_readiness).toBe(false);
    expect(sourceFormulaArtifact.policy.comparison_mismatch_disposition).toBe("advisory");
    expect(sourceFormulaArtifact.policy.comparison_requires_formula_equivalence).toBe(false);
    expect(sourceFormulaArtifact.stage.formulaMismatchClass).toBe(
      "direct_vs_reconstructed",
    );
    expect(sourceFormulaArtifact.formulaComparison.directFormulaId).toBe(
      "canonical_qi_forensics.metricT00Si_Jm3",
    );
    expect(sourceFormulaArtifact.formulaComparison.reconstructedFormulaId).toBe(
      "recovery_search_case.metricT00Si_Jm3",
    );
    expect(sourceFormulaArtifact.formulaComparison.comparisonMode).toBe(
      "authoritative_direct_vs_reconstructed_proxy",
    );
    expect(sourceFormulaArtifact.formulaComparison.mismatchReason).toBe(
      "proxy_vs_metric_term_gap",
    );
    expect(sourceFormulaArtifact.interpretationPolicy).toMatchObject({
      policyId: "expected_proxy_vs_metric_gap_non_promotable",
      parityExpected: false,
      promotionBlockedByMismatch: true,
      laneAUnaffectedByMismatch: true,
      interpretationStatus: "advisory",
    });
    expect(sourceFormulaArtifact.formulaComparison.additionalMismatchReasons).toContain(
      "missing_term_mapping",
    );
    expect(sourceFormulaArtifact.formulaComparison.additionalMismatchReasons).toContain(
      "duty_definition_mismatch",
    );
    expect(sourceFormulaArtifact.formulaComparison.additionalMismatchReasons).toContain(
      "timing_source_mismatch",
    );
    expect(
      sourceFormulaArtifact.formulaComparison.termComparisons.find(
        (entry) => entry.termId === "final_metricT00Si_Jm3",
      ),
    ).toMatchObject({
      status: "mismatched",
      units: "J/m^3",
    });
    expect(
      sourceFormulaArtifact.formulaComparison.resolvedInputComparisons.find(
        (entry) => entry.inputId === "dutyEffective_FR",
      ),
    ).toMatchObject({
      status: "missing_direct_input",
      units: "fraction",
    });
    expect(sourceFormulaArtifact.formulaComparison.reconstructionOnlyComparison).toBe(
      true,
    );
    const markdown = renderNhm2SourceFormulaAuditMarkdown(sourceFormulaArtifact);
    expect(markdown).toContain("## Formula Comparison");
    expect(markdown).toContain("## Interpretation Policy");
    expect(markdown).toContain("### Resolved Inputs");
    expect(markdown).toContain("### Term Comparisons");
    expect(markdown).toContain("mismatchReason");
    expect(markdown).toContain("sourceFormulaInterpretationPolicy");
    expect(markdown).toContain("formulaMismatchClass");
  });

  it("does not leave a false formulaEquivalent without explicit reason and term breakdown", () => {
    const { sourceFormulaArtifact } = buildSourceStageFixture({
      canonical: {
        metricT00GeomSource: "direct_metric_pipeline",
        rhoMetric_Jm3: -89888730.09553961,
      },
      recovery: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
        rhoMetric_Jm3: -89888730.09553961,
        metricStressRhoSiMean_Jm3: -89888730.09553961,
      },
    });

    expect(sourceFormulaArtifact.formulaComparison.formulaEquivalent).toBe(false);
    expect(sourceFormulaArtifact.formulaComparison.mismatchReason).not.toBe("none");
    expect(sourceFormulaArtifact.formulaComparison.termComparisons.length).toBeGreaterThan(0);
    expect(sourceFormulaArtifact.formulaComparison.resolvedInputComparisons.length).toBeGreaterThan(
      0,
    );
    expect(sourceFormulaArtifact.stage.summary).toContain("mismatch_reason=");
  });

  it("propagates source-formula interpretation policy into the proof-pack alias summary", () => {
    const { sourceFormulaArtifact } = buildSourceStageFixture({
      canonical: {
        metricT00GeomSource: "direct_metric_pipeline",
        rhoMetric_Jm3: -89888730.09553961,
      },
      recovery: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
        rhoMetric_Jm3: -89888730.09553961,
        metricStressRhoSiMean_Jm3: -89888730.09553961,
      },
    });
    const payload = makeProofPackPayloadForMarkdown();
    payload.sourceFormulaAudit = {
      formulaEquivalent: sourceFormulaArtifact.formulaComparison.formulaEquivalent,
      reconstructionOnlyComparison:
        sourceFormulaArtifact.formulaComparison.reconstructionOnlyComparison,
      formulaMismatchClass: sourceFormulaArtifact.formulaComparison.formulaMismatchClass,
      comparisonMode: sourceFormulaArtifact.formulaComparison.comparisonMode,
      mismatchReason: sourceFormulaArtifact.formulaComparison.mismatchReason,
      additionalMismatchReasons:
        sourceFormulaArtifact.formulaComparison.additionalMismatchReasons,
      sourceFormulaInterpretationPolicy: sourceFormulaArtifact.interpretationPolicy.policyId,
      parityExpected: sourceFormulaArtifact.interpretationPolicy.parityExpected,
      promotionBlockedByMismatch:
        sourceFormulaArtifact.interpretationPolicy.promotionBlockedByMismatch,
      laneAUnaffectedByMismatch:
        sourceFormulaArtifact.interpretationPolicy.laneAUnaffectedByMismatch,
      tolerancePolicySummary:
        `relTol=${sourceFormulaArtifact.formulaComparison.tolerancePolicy.relTol}; absTol=${sourceFormulaArtifact.formulaComparison.tolerancePolicy.absTol}; rule=final_metric_numeric_parity`,
      directFormulaId: sourceFormulaArtifact.formulaComparison.directFormulaId,
      reconstructedFormulaId:
        sourceFormulaArtifact.formulaComparison.reconstructedFormulaId,
      termMismatchCount: sourceFormulaArtifact.formulaComparison.termComparisons.filter(
        (entry) => entry.status === "mismatched",
      ).length,
      artifactPath: "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-source-formula-audit-latest.md",
    } as any;

    const markdown = renderMarkdown(payload as any);
    const additionalMismatchReasons = sourceFormulaArtifact.formulaComparison.additionalMismatchReasons.join(
      ",",
    );
    expect(markdown).toContain("| comparisonMode | authoritative_direct_vs_reconstructed_proxy |");
    expect(markdown).toContain(
      `| additionalMismatchReasons | ${additionalMismatchReasons} |`,
    );
    expect(markdown).toContain(
      "| sourceFormulaInterpretationPolicy | expected_proxy_vs_metric_gap_non_promotable |",
    );
    expect(markdown).toContain("| parityExpected | false |");
    expect(markdown).toContain("| promotionBlockedByMismatch | true |");
    expect(markdown).toContain("| laneAUnaffectedByMismatch | true |");
  });

  it("builds a bounded advisory source/mechanism maturity artifact with explicit blockers and claims", () => {
    const { artifact } = buildSourceMechanismMaturityFixture({
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      },
    });

    expect(artifact.sourceMechanismMaturity).toMatchObject({
      maturityTier: "reduced_order_advisory",
      claimBoundaryPolicy:
        "bounded_advisory_non_promotable_until_explicit_promotion_contract",
      authoritativeStatus: "non_authoritative",
      promotionEligibility: "blocked",
      sourceFormulaInterpretationPolicy: "expected_proxy_vs_metric_gap_non_promotable",
      sourceToYorkBridgeClosurePolicy: "close_with_current_serialization",
      bridgeReady: true,
      bridgeGatingStatus: "legacy_advisory_non_gating",
      parityExpected: false,
      promotionBlocked: true,
      laneAUnaffected: true,
      laneAAuthoritative: true,
      referenceOnlyCrossLaneScope: true,
      promotionContractId: "nhm2_source_mechanism_promotion_contract.v1",
      promotionContractStatus: "active_for_bounded_claims_only",
      selectedPromotionRoute: "formal_exemption_route",
    });
    expect(artifact.sourceMechanismMaturity.promotionBlockers).toContain(
      "proxy_vs_metric_term_gap",
    );
    expect(artifact.sourceMechanismMaturity.promotionBlockers).toContain(
      "direct_vs_reconstructed_non_parity",
    );
    expect(artifact.sourceMechanismMaturity.promotionBlockers).toContain(
      "timing_authority_optional_fields_partial",
    );
    expect(artifact.sourceMechanismMaturity.promotionBlockers).toContain(
      "reference_only_cross_lane_scope",
    );
    expect(artifact.sourceMechanismMaturity.allowedClaims).toContain(
      "source_to_york_provenance_closed_under_current_serialization_policy",
    );
    expect(artifact.sourceMechanismMaturity.allowedClaims).toContain(
      "reconstructed_proxy_path_usable_for_advisory_comparison",
    );
    expect(artifact.sourceMechanismMaturity.allowedClaims).toContain(
      "bounded_non_authoritative_source_annotation",
    );
    expect(artifact.sourceMechanismMaturity.allowedClaims).toContain(
      "bounded_non_authoritative_reduced_order_comparison",
    );
    expect(artifact.sourceMechanismMaturity.disallowedClaims).toContain(
      "reconstructed_proxy_path_formula_equivalent_to_authoritative_direct_metric",
    );
    expect(artifact.sourceMechanismMaturity.disallowedClaims).toContain(
      "unbounded_non_authoritative_source_mechanism_promotion_claim",
    );
    expect(artifact.sourceMechanismMaturity.requiredForPromotion).toContain(
      "direct_proxy_parity_route_for_equivalence_or_cross_lane_claims",
    );
    expect(artifact.sourceMechanismMaturity.requiredForPromotion).not.toContain(
      "bounded_exemption_contract_for_non_authoritative_claim_subsets",
    );

    const markdown = renderNhm2SourceMechanismMaturityMarkdown(artifact);
    expect(markdown).toContain("## Source / Mechanism Maturity");
    expect(markdown).toContain("## Allowed Claims");
    expect(markdown).toContain("## Disallowed Claims");
    expect(markdown).toContain("## Required For Promotion");
    expect(markdown).toContain("| promotionContractStatus | active_for_bounded_claims_only |");
    expect(markdown).toContain("| selectedPromotionRoute | formal_exemption_route |");
  });

  it("propagates source/mechanism maturity policy into the proof-pack alias summary", () => {
    const {
      artifact: maturityArtifact,
      sourceFormulaArtifact,
      promotionContractArtifact,
      parityRouteFeasibilityArtifact,
    } =
      buildSourceMechanismMaturityFixture({
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      },
    });
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.sourceMechanismMaturity = {
      ...maturityArtifact.sourceMechanismMaturity,
      artifactPath: "artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-source-mechanism-maturity-latest.md",
    };
    payload.sourceMechanismPromotionContract = (() => {
      return buildSourceMechanismPromotionContractSummary({
        promotionContractArtifact,
        parityRouteFeasibilityArtifact,
        sourceFormulaAudit: sourceFormulaArtifact,
        maturityArtifact,
        artifactPath:
          "artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json",
        reportPath:
          "docs/audits/research/warp-nhm2-source-mechanism-promotion-contract-latest.md",
      });
    })();
    payload.sourceMechanismParityRouteFeasibility = {
      routeId:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility.routeId,
      routeStatus:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility.routeStatus,
      routeFeasibilityStatus:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .feasibilityStatus,
      routeBlockingClass:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .routeBlockingClass,
      dominantMismatchTerm:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .dominantMismatchTerm,
      matchedTermsCount:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .matchedTerms.length,
      unmatchedTermsCount:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .unmatchedTerms.length,
      nextClosureAction:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .nextClosureAction,
      parityRouteSummary:
        parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility
          .routeSummary,
      artifactPath:
        "artifacts/research/full-solve/nhm2-source-mechanism-parity-route-feasibility-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-source-mechanism-parity-route-feasibility-latest.md",
    };

    expect(payload.sourceMechanismPromotionContract).toEqual(
      expect.objectContaining({
        sourceMechanismActiveClaimSet: [
          "bounded_non_authoritative_source_annotation",
          "bounded_non_authoritative_mechanism_context",
          "bounded_non_authoritative_reduced_order_comparison",
        ],
        sourceMechanismBlockedClaimSet: expect.arrayContaining([
          "formula_equivalent_to_authoritative_direct_metric",
          "source_mechanism_layer_supports_viability_promotion",
        ]),
        sourceMechanismForbiddenPromotions: expect.arrayContaining([
          "nhm2_shift_lapse_proof_promotion",
        ]),
        sourceMechanismReferenceOnlyScope: true,
        sourceMechanismNonAuthoritative: true,
        sourceMechanismFormulaEquivalent: false,
        nhm2ShiftLapseDefaultTransportCertificationStatus:
          "bounded_transport_fail_closed_reference_only",
        nhm2ShiftLapseSelectedPublicationStatus:
          "explicit_gate_admitted_selected_family_publication_available",
      }),
    );

    const markdown = renderMarkdown(payload);
    expect(markdown).toContain(
      "| claimBoundaryPolicy | bounded_advisory_non_promotable_until_explicit_promotion_contract |",
    );
    expect(markdown).toContain(
      "| promotionBlockers | proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity,timing_authority_optional_fields_partial,reference_only_cross_lane_scope |",
    );
    expect(markdown).toContain("| laneAAuthoritative | true |");
    expect(markdown).toContain("| laneAUnaffected | true |");
    expect(markdown).toContain("## Source / Mechanism Promotion Contract");
    expect(markdown).toContain("| contractStatus | active_for_bounded_claims_only |");
    expect(markdown).toContain("| selectedPromotionRoute | formal_exemption_route |");
    expect(markdown).toContain("| exemptionRouteActivated | true |");
    expect(markdown).toContain("| activeClaimSetCount | 3 |");
    expect(markdown).toContain("| inactiveClaimSetCount | 5 |");
    expect(markdown).toContain(
      "| sourceMechanismActiveClaimSet | bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison |",
    );
    expect(markdown).toContain(
      "| sourceMechanismBlockedClaimSet | source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope |",
    );
    expect(markdown).toContain(
      "| sourceMechanismForbiddenPromotions | formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope,nhm2_shift_lapse_proof_promotion |",
    );
    expect(markdown).toContain("| sourceMechanismReferenceOnlyScope | true |");
    expect(markdown).toContain("| sourceMechanismNonAuthoritative | true |");
    expect(markdown).toContain("| sourceMechanismFormulaEquivalent | false |");
    expect(markdown).toContain(
      "| nhm2ShiftLapseFamilyAuthorityStatus | candidate_authoritative_solve_family |",
    );
    expect(markdown).toContain(
      "| nhm2ShiftLapseDefaultTransportCertificationStatus | bounded_transport_fail_closed_reference_only |",
    );
    expect(markdown).toContain(
      "| nhm2ShiftLapseSelectedPublicationStatus | explicit_gate_admitted_selected_family_publication_available |",
    );
    expect(markdown).toContain(
      "| nhm2ShiftLapseSelectedPublicationSummary | Canonical latest aliases remain on warp.metric.T00.natario_sdf.shift by default, but an explicitly selected nhm2_shift_lapse solve can publish proof-bearing bounded transport artifacts when the authoritative shift-lapse transport-promotion gate passes. |",
    );
    expect(markdown).toContain(
      "| sourceMechanismConsumerSummary | Only the bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims are active; formula equivalence remains false, the parity route remains blocked, viability and cross-lane promotions remain blocked, the source/mechanism lane remains non-authoritative, warp.metric.T00.nhm2_shift_lapse is treated as a candidate authoritative solve family in provenance/model-selection, and proof-bearing bounded transport admission remains controlled separately by the authoritative shift-lapse transport-promotion gate rather than granted by this source/mechanism surface. |",
    );
    expect(markdown).toContain("| exemptionRouteStatus | satisfied |");
    expect(markdown).toContain("## Source / Mechanism Parity-Route Feasibility");
    expect(markdown).toContain(
      "| routeFeasibilityStatus | blocked_by_derivation_class_difference |",
    );
    expect(markdown).toContain("| dominantMismatchTerm | final_metricT00Si_Jm3 |");
    expect(markdown).toContain(
      "source_to_york_provenance_closed_under_current_serialization_policy",
    );
    expect(markdown).toContain(
      "reconstructed_proxy_path_formula_equivalent_to_authoritative_direct_metric",
    );
  });

  it("builds an explicit source/mechanism promotion contract with parity and exemption routes", () => {
    const { promotionContractArtifact, parityRouteFeasibilityArtifact } =
      buildSourceMechanismMaturityFixture({
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      },
    });

    expect(promotionContractArtifact.sourceMechanismPromotionContract).toMatchObject({
      contractId: "nhm2_source_mechanism_promotion_contract.v1",
      contractStatus: "active_for_bounded_claims_only",
      selectedPromotionRoute: "formal_exemption_route",
      promotionDecisionPolicy:
        "parity_required_for_equivalence_or_cross_lane_promotion_exemption_limited_to_bounded_non_authoritative_claims",
      laneAUnaffected: true,
      referenceOnlyCrossLaneScope: true,
      exemptionRouteActivated: true,
      activeClaimSet: [
        "bounded_non_authoritative_source_annotation",
        "bounded_non_authoritative_mechanism_context",
        "bounded_non_authoritative_reduced_order_comparison",
      ],
    });
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.availableRoutes.map(
        (entry) => entry.routeId,
      ),
    ).toEqual(["direct_proxy_parity_route", "formal_exemption_route"]);
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.claimsRequiringParity,
    ).toContain("formula_equivalent_to_authoritative_direct_metric");
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.claimsEligibleUnderExemption,
    ).toEqual(
      expect.arrayContaining([
        "bounded_non_authoritative_source_annotation",
        "bounded_non_authoritative_mechanism_context",
        "bounded_non_authoritative_reduced_order_comparison",
      ]),
    );
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.claimsBlockedEvenWithExemption,
    ).toContain("source_mechanism_layer_supports_viability_promotion");
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.claimsBlockedEvenWithExemption,
    ).toContain("source_mechanism_lane_promotable_non_authoritative");
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.forbiddenPromotions,
    ).toContain("nhm2_shift_lapse_proof_promotion");
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.consumerSummary,
    ).toContain("candidate authoritative solve family in provenance/model-selection");
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.consumerSummary,
    ).toContain("transport-promotion gate");
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.claimMappings,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claimId: "formula_equivalent_to_authoritative_direct_metric",
          requiredRoute: "direct_proxy_parity_route",
        }),
        expect.objectContaining({
          claimId: "bounded_non_authoritative_source_annotation",
          requiredRoute: "formal_exemption_route",
          currentStatus: "active_under_selected_route",
        }),
        expect.objectContaining({
          claimId: "source_mechanism_lane_promotable_non_authoritative",
          requiredRoute: "no_route_available",
          currentStatus: "permanently_disallowed_in_current_contract",
        }),
      ]),
    );
    const directProxyParityRoute =
      promotionContractArtifact.sourceMechanismPromotionContract.availableRoutes.find(
        (entry) => entry.routeId === "direct_proxy_parity_route",
      );
    expect(directProxyParityRoute).toMatchObject({
      routeFeasibilityStatus: "blocked_by_derivation_class_difference",
      routeBlockingClass: "direct_metric_vs_reconstructed_proxy_derivation_gap",
      dominantMismatchTerm: "final_metricT00Si_Jm3",
      nextClosureAction:
        "emit_authoritative_direct_metric_closure_decomposition_and_define_proxy_mapping_contract",
      feasibilityArtifactPath:
        "artifacts/research/full-solve/nhm2-source-mechanism-parity-route-feasibility-latest.json",
    });
    expect(directProxyParityRoute?.summary).toBe(
      parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility.routeSummary,
    );
    const formalExemptionRoute =
      promotionContractArtifact.sourceMechanismPromotionContract.availableRoutes.find(
        (entry) => entry.routeId === "formal_exemption_route",
      );
    expect(formalExemptionRoute).toMatchObject({
      routeStatus: "satisfied",
      claimSetEligible: [
        "bounded_non_authoritative_source_annotation",
        "bounded_non_authoritative_mechanism_context",
        "bounded_non_authoritative_reduced_order_comparison",
      ],
    });
    expect(
      promotionContractArtifact.sourceMechanismPromotionContract.exemptionEligibleClaimDetails,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          claimId: "bounded_non_authoritative_source_annotation",
          requiresParity: false,
          requiresOptionalTimingClosure: false,
          requiresCrossLaneExpansion: false,
          currentEvidenceSatisfied: true,
        }),
        expect.objectContaining({
          claimId: "bounded_non_authoritative_reduced_order_comparison",
          requiresParity: false,
          currentEvidenceSatisfied: true,
        }),
      ]),
    );

    const markdown = renderNhm2SourceMechanismPromotionContractMarkdown(
      promotionContractArtifact,
    );
    expect(markdown).toContain("## Available Routes");
    expect(markdown).toContain("### direct_proxy_parity_route");
    expect(markdown).toContain("### formal_exemption_route");
    expect(markdown).toContain("## Claim Route Map");
    expect(markdown).toContain("## Active Claim Set");
    expect(markdown).toContain("## Activation Disclaimers");
    expect(markdown).toContain("## Forbidden Promotions");
    expect(markdown).toContain("| consumerSummary |");
    expect(markdown).toContain("## Exemption Claim Surface");
    expect(markdown).toContain("bounded_non_authoritative_source_annotation");
    expect(markdown).toContain("Forbidden Inferences");
    expect(markdown).toContain("| exemptionRouteActivated | true |");
    expect(markdown).toContain("| routeFeasibilityStatus | blocked_by_derivation_class_difference |");
    expect(markdown).toContain(
      "| dominantMismatchTerm | final_metricT00Si_Jm3 |",
    );
  });

  it("builds a parity-route feasibility artifact that marks the direct metric gap as structural", () => {
    const { parityRouteFeasibilityArtifact } = buildSourceMechanismMaturityFixture({
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      },
    });

    expect(
      parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility,
    ).toMatchObject({
      routeId: "direct_proxy_parity_route",
      routeStatus: "available_but_unmet",
      feasibilityStatus: "blocked_by_derivation_class_difference",
      routeBlockingClass: "direct_metric_vs_reconstructed_proxy_derivation_gap",
      dominantMismatchTerm: "final_metricT00Si_Jm3",
      missingProxyTerms: ["direct_metric_closure_term_set_beyond_rhoMetric"],
      missingDirectTerms: [
        "authoritative_direct_metric_additive_decomposition_for_final_metricT00Si_Jm3",
      ],
      nextClosureAction:
        "emit_authoritative_direct_metric_closure_decomposition_and_define_proxy_mapping_contract",
    });
    expect(
      parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility.matchedTerms,
    ).toContain("rhoMetric_Jm3");
    expect(
      parityRouteFeasibilityArtifact.sourceMechanismParityRouteFeasibility.unmatchedTerms,
    ).toEqual(
      expect.arrayContaining(["final_metricT00Si_Jm3", "metricStressRhoSiMean_Jm3"]),
    );
    const markdown = renderNhm2SourceMechanismParityRouteFeasibilityMarkdown(
      parityRouteFeasibilityArtifact,
    );
    expect(markdown).toContain("| feasibilityStatus | blocked_by_derivation_class_difference |");
    expect(markdown).toContain("| dominantMismatchTerm | final_metricT00Si_Jm3 |");
    expect(markdown).toContain("## Direct Path Decomposition");
    expect(markdown).toContain("## Reconstructed Path Decomposition");
  });

  it("classifies same-formula numeric drift when formula path is equivalent but metric amplitude differs", () => {
    const { artifact, sourceFormulaArtifact } = buildSourceStageFixture({
      canonical: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
        metricT00GeomSource: null,
      },
      recovery: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
      },
    });
    expect(sourceFormulaArtifact.formulaComparison.formulaMismatchClass).toBe(
      "same_formula_numeric_drift",
    );
    expect(sourceFormulaArtifact.formulaComparison.formulaEquivalent).toBe(false);
    expect(artifact.stage.source_stage_cause).toBe("same_formula_numeric_drift");
  });

  it("marks recovery reconstruction mismatch as blocking when equivalence policy requires it", () => {
    const { artifact, sourceFormulaArtifact } = buildSourceStageFixture({
      canonical: {
        metricT00GeomSource: "direct_metric_pipeline",
      },
      recovery: {
        metricT00Derivation: "forward_shift_to_K_to_rho_E",
      },
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: true,
        comparison_path_blocks_readiness: true,
        comparison_mismatch_disposition: "blocking",
      },
    });
    expect(artifact.sourceAuthorityPolicy.mixedAuthorityDetected).toBe(false);
    expect(sourceFormulaArtifact.formulaComparison.reconstructionOnlyComparison).toBe(
      true,
    );
    expect(sourceFormulaArtifact.policy.comparison_path_blocks_readiness).toBe(true);
    expect(sourceFormulaArtifact.interpretationPolicy).toMatchObject({
      policyId: "parity_required_before_promotion",
      parityExpected: true,
      promotionBlockedByMismatch: true,
      laneAUnaffectedByMismatch: true,
      interpretationStatus: "blocking",
    });
    expect(artifact.stage.source_stage_cause).toBe("recovery_reconstruction_mismatch");
    expect(artifact.stage.source_stage_ready).toBe(false);
    expect(artifact.blockingFindings).toContain("recovery_reconstruction_mismatch");
    expect(artifact.advisoryFindings).toEqual([]);
  });

  it("refines unresolved numeric source gap into same-formula numeric drift when metadata and formula class align", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.reducedOrderPipelinePayload = {
      ...sourceToYork.reducedOrderPipelinePayload,
      grRequest: {
        ...sourceToYork.reducedOrderPipelinePayload.grRequest,
        warp: {
          metricAdapter: {
            chart: { label: "comoving_cartesian" },
          },
          metricT00Contract: {
            observer: "eulerian_n",
            normalization: "point_splitting",
            unitSystem: "SI_inferred_jm3",
          },
        },
      },
    };
    const { artifact } = buildSourceStageFixture({
      sourceToYork,
      canonical: {
        metricT00Observer: "eulerian_n",
        chartLabel: "comoving_cartesian",
        metricT00UnitSystem: "SI_inferred_jm3",
      },
      recovery: {
        metricT00Observer: "eulerian_n",
        chartLabel: "comoving_cartesian",
        metricT00UnitSystem: "SI_inferred_jm3",
        metricT00Derivation: null,
      },
    });
    expect(artifact.componentAudit.every((entry) => entry.status !== "missing")).toBe(true);
    expect(artifact.stage.source_stage_cause).toBe("same_formula_numeric_drift");
    expect(artifact.numericGapDecomposition.primaryCandidate).toBe(
      "unexplained_numeric_gap",
    );
    expect(artifact.stage.source_stage_ready).toBe(false);
  });

  it("builds solve-authority audit domains/splits and keeps mechanism chain blocked when splits are open", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const laneB = payload.diagnosticLanes.find(
      (entry: any) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    laneB.observer_approximation =
      "diagnostic-local observer-only drift proxy on fixed comoving foliation";
    laneB.cross_lane_claim_ready = false;
    laneB.reference_comparison_ready = true;
    laneB.semantics_closed = true;

    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        sourceToYork,
        comparisonPolicyOverride: {
          comparison_path_expected_equivalence: true,
          comparison_path_blocks_readiness: true,
          comparison_mismatch_disposition: "blocking",
        },
      });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({
      sourceToYork,
    });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({
      sourceToYork,
      brickPolicyOverride: {
        auditHarnessOverridesBlockReadiness: true,
      },
    });
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork,
      syncLiveRefs: false,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({
      payload,
      diagnosticPolicyOverride: {
        crossLaneAgreementBlocksMechanismReadiness: true,
      },
    });

    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });

    expect(artifact.artifactType).toBe("nhm2_solve_authority_audit/v1");
    expect(artifact.authorityDomains.contract_authority.source_path).toContain(
      "needle-hull-mark2-cavity-contract.v1.json",
    );
    expect(artifact.authorityDomains.snapshot_authority.source_kind).toBe(
      "snapshot_authority_audit_artifact",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).toContain(
      "contract_to_brick_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).toContain(
      "snapshot_authority_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).toContain(
      "source_stage_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).toContain(
      "diagnostic_cross_lane_normalization_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).toContain(
      "diagnostic_cross_lane_reference_only_split",
    );
    expect(artifact.firstDivergence?.stage_id).toBe("S0_source");
    expect(artifact.sourceStageCause).toBe("recovery_reconstruction_mismatch");
    expect(artifact.sourceStageReady).toBe(false);
    expect(artifact.readiness.yorkClassificationReady).toBe(true);
    expect(artifact.readiness.sourceAuthorityClosed).toBe(false);
    expect(artifact.readiness.mechanismChainReady).toBe(false);
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_source_stage_reconstruction_equivalence_required",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_source_stage_recovery_reconstruction_mismatch",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_brick_audit_harness_override_active",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).not.toContain(
      "solve_authority_brick_split_open",
    );
    const markdown = renderNhm2SolveAuthorityAuditMarkdown(artifact);
    expect(markdown).toContain("## Authority Domains");
    expect(markdown).toContain("## Detected Splits");
  });

  it("maps refined source-formula mismatch classes into solve-authority blocker codes", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        canonical: {
          metricT00Derivation: "forward_shift_to_K_to_rho_E",
          metricT00GeomSource: null,
        },
        recovery: {
          metricT00Derivation: "forward_shift_to_K_to_rho_E",
        },
      });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({
      sourceToYork,
    });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({
      sourceToYork,
      brickPolicyOverride: {
        auditHarnessOverridesBlockReadiness: true,
      },
    });
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({
      payload,
    });
    expect(sourceStageAudit.stage.source_stage_cause).toBe("same_formula_numeric_drift");
    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });
    expect(artifact.sourceFormulaMismatchClass).toBe("same_formula_numeric_drift");
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_source_stage_same_formula_numeric_drift",
    );
  });

  it("keeps source authority closed when recovery reconstruction mismatch is advisory-only", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit } = buildSourceStageFixture({
      comparisonPolicyOverride: {
        comparison_path_expected_equivalence: false,
        comparison_path_blocks_readiness: false,
        comparison_mismatch_disposition: "advisory",
      },
    });
    expect(sourceStageAudit.stage.source_stage_ready).toBe(true);
    expect(sourceStageAudit.stage.source_stage_cause).toBe("none");
    const readiness = computeSolveAuthorityReadiness({
      payload,
      sourceToYork,
      splits: [] as any,
      sourceStageAudit,
    });
    expect(readiness.yorkClassificationReady).toBe(true);
    expect(readiness.sourceAuthorityClosed).toBe(true);
    expect(
      readiness.mechanismClaimBlockReasons.some((entry) =>
        entry.startsWith("solve_authority_source_stage_"),
      ),
    ).toBe(false);
  });

  it("emits timing-authority audit artifact with policy, ownership, and readiness evidence", () => {
    const { artifact } = buildTimingAuthorityFixture();
    expect(artifact.artifactType).toBe("nhm2_timing_authority_audit/v1");
    expect(artifact.timingPolicy.authoritativeTauLcAuthorityId).toBe("geometry_derived");
    expect(artifact.timingAuthorities.some((entry) => entry.authority_id === "autoscale_prev")).toBe(
      true,
    );
    expect(artifact.timingFieldOwnership.some((entry) => entry.field === "TS_ratio")).toBe(true);
    expect(typeof artifact.timingReadiness.timingAuthorityClosed).toBe("boolean");
    const markdown = renderNhm2TimingAuthorityAuditMarkdown(artifact);
    expect(markdown).toContain("## Timing Policy");
    expect(markdown).toContain("## Timing Authorities");
  });

  it("emits brick-authority audit artifact with policy, mappings, and readiness evidence", () => {
    const { artifact } = buildBrickAuthorityFixture();
    expect(artifact.artifactType).toBe("nhm2_brick_authority_audit/v1");
    expect(artifact.brickPolicy.requiredBrickFieldsForReadiness).toContain("metricT00Ref");
    expect(artifact.brickFieldOwnership.some((entry) => entry.field === "metricT00Source")).toBe(
      true,
    );
    expect(typeof artifact.brickReadiness.brickAuthorityClosed).toBe("boolean");
    const markdown = renderNhm2BrickAuthorityAuditMarkdown(artifact);
    expect(markdown).toContain("## Brick Policy");
    expect(markdown).toContain("## Brick Field Ownership");
  });

  it("emits snapshot-authority audit artifact with policy, sources, and comparison evidence", () => {
    const { artifact } = buildSnapshotAuthorityFixture();
    expect(artifact.artifactType).toBe("nhm2_snapshot_authority_audit/v1");
    expect(artifact.snapshotSources.map((entry) => entry.source_id)).toContain(
      "snapshot_artifact",
    );
    expect(artifact.snapshotSources.map((entry) => entry.source_id)).toContain(
      "proof_pack_snapshot_refs",
    );
    expect(artifact.snapshotComparison.some((entry) => entry.field === "metric_ref_hash")).toBe(
      true,
    );
    const markdown = renderNhm2SnapshotAuthorityAuditMarkdown(artifact);
    expect(markdown).toContain("## Snapshot Policy");
    expect(markdown).toContain("## Snapshot Comparison");
  });

  it("emits diagnostic-semantic audit artifact with policy, lane ownership, and readiness evidence", () => {
    const { artifact } = buildDiagnosticSemanticFixture();
    expect(artifact.artifactType).toBe("nhm2_diagnostic_semantic_audit/v1");
    expect(artifact.diagnosticPolicy.authoritativeLaneIdsForMechanismReadiness).toEqual([
      YORK_DIAGNOSTIC_BASELINE_LANE_ID,
    ]);
    expect(
      artifact.laneSemantics.some(
        (entry) =>
          entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID &&
          entry.is_reference_only === true,
      ),
    ).toBe(true);
    const markdown = renderNhm2DiagnosticSemanticAuditMarkdown(artifact);
    expect(markdown).toContain("## Diagnostic Policy");
    expect(markdown).toContain("## Lane Semantics");
  });

  it("closes diagnostic readiness when Lane A is authoritative and proxy Lane B is advisory-only", () => {
    const { artifact } = buildDiagnosticSemanticFixture();
    expect(artifact.diagnosticReadiness.diagnosticAuthorityClosed).toBe(true);
    expect(artifact.blockingFindings).toEqual([]);
    expect(artifact.advisoryFindings).toContain("diagnostic_proxy_lane_active");
    expect(artifact.advisoryFindings).toContain("diagnostic_cross_lane_reference_only");
    expect(artifact.advisoryFindings).toContain("diagnostic_semantics_closed");
  });

  it("renders Lane B as reference-only and not claim-ready in the proof-pack output", () => {
    const payload = makeProofPackPayloadForMarkdown();
    const laneB = payload.diagnosticLanes.find(
      (entry) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    expect(laneB).toBeTruthy();
    if (!laneB) return;
    expect(laneB.cross_lane_claim_ready).toBe(false);
    expect(laneB.reference_comparison_ready).toBe(true);

    const markdown = renderMarkdown(payload);
    expect(markdown).toContain(
      `| ${YORK_DIAGNOSTIC_ALTERNATE_LANE_ID} | true | true | shift_drift_u(beta_over_alpha) | comoving_cartesian_3p1 | theta=-trK+div(beta/alpha) | K_ij=-1/2*L_n(gamma_ij) | true | false | true | true | true | true | nhm2_low_expansion_family | lane_b_family_congruent |`,
    );
    expect(markdown).toContain("| lane_b_cross_lane_claim_ready | false |");
    expect(markdown).toContain("| lane_b_reference_comparison_ready | true |");
  });

  it("emits york render-debug artifact with explicit Lane A authority and view/display policy", () => {
    const { artifact } = buildYorkRenderDebugFixture();
    expect(artifact.artifactType).toBe("nhm2_york_render_debug/v1");
    expect(artifact.renderPolicy.authoritativeLaneId).toBe(
      YORK_DIAGNOSTIC_BASELINE_LANE_ID,
    );
    expect(artifact.renderPolicy.imagesUsedAsPrimaryEvidence).toBe(false);
    expect(artifact.viewDefinitions.map((entry) => entry.view_id)).toEqual(REQUIRED_VIEWS);
    expect(artifact.frameDebugSummary.some((entry) => entry.view_id === "york-shell-map-3p1")).toBe(
      true,
    );
    const markdown = renderNhm2YorkRenderDebugMarkdown(artifact);
    expect(markdown).toContain("## Render Policy");
    expect(markdown).toContain("## Paper Comparison Matrix");
  });

  it("classifies NHM2 as Natario-aligned after convention mapping and Alcubierre-different on Lane A", () => {
    const { artifact } = buildYorkRenderDebugFixture();
    const natario = artifact.paperComparisonMatrix.find(
      (entry) => entry.reference_id === "natario_primary",
    );
    const alcubierre = artifact.paperComparisonMatrix.find(
      (entry) => entry.reference_id === "alcubierre_primary",
    );
    expect(natario).toBeTruthy();
    expect(alcubierre).toBeTruthy();
    if (!natario || !alcubierre) return;
    expect(natario.sign_match_status).toBe("compatible_after_sign_flip");
    expect(natario.morphology_match_status).toBe("compatible_after_observer_scope_note");
    expect(alcubierre.morphology_match_status).toBe("morphology_different");
    expect(artifact.paper_comparison_verdict).toBe("paper_match_after_convention_alignment");
    expect(artifact.dominant_difference_cause).toBe("real_nhm2_morphology_difference");
  });

  it("keeps mechanism closure intact while reporting render normalization as display-only", () => {
    const { artifact, solveAuthorityArtifact } = buildYorkRenderDebugFixture();
    expect(solveAuthorityArtifact.readiness.diagnosticAuthorityClosed).toBe(true);
    expect(solveAuthorityArtifact.readiness.mechanismChainReady).toBe(true);
    expect(solveAuthorityArtifact.readiness.mechanismClaimBlockReasons).toEqual([]);
    expect(artifact.render_debug_verdict).toBe("render_matches_authoritative_geometry");
    expect(artifact.normalizationPolicy.topology_normalization_scope).toContain("display-only");
    expect(artifact.differenceCauses).toContain("display_normalization_difference");
  });

  it("renders a paper-comparison memo that keeps images subordinate to the numeric/convention basis", () => {
    const { artifact } = buildYorkRenderDebugFixture();
    const memo = renderNhm2YorkPaperComparisonMemo(artifact);
    expect(memo).toContain("Lane A is the only admissible basis");
    expect(memo).toContain("images_used_as_primary_evidence = no");
    expect(memo).toContain("Natario");
    expect(memo).toContain("Alcubierre");
    expect(memo).toContain("Gourgoulhon");
  });

  it("blocks diagnostic readiness when policy requires non-proxy normalized cross-lane semantics", () => {
    const { artifact } = buildDiagnosticSemanticFixture({
      diagnosticPolicyOverride: {
        crossLaneAgreementBlocksMechanismReadiness: true,
      },
    });
    expect(artifact.diagnosticReadiness.diagnosticAuthorityClosed).toBe(false);
    expect(artifact.blockingFindings).toContain(
      "diagnostic_cross_lane_requires_normalized_observer",
    );
    expect(artifact.blockingFindings).toContain("diagnostic_cross_lane_reference_only");
  });

  it("classifies missing observer and foliation definitions by readiness ownership", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const laneA = payload.diagnosticLanes.find(
      (entry: any) => entry.lane_id === YORK_DIAGNOSTIC_BASELINE_LANE_ID,
    );
    const laneB = payload.diagnosticLanes.find(
      (entry: any) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    laneA.observer_definition_id = null;
    laneB.foliation_definition = null;
    laneB.foliation = null;

    const { artifact } = buildDiagnosticSemanticFixture({ payload });
    expect(artifact.diagnosticReadiness.diagnosticAuthorityClosed).toBe(false);
    expect(artifact.blockingFindings).toContain("diagnostic_missing_observer_definition");
    expect(artifact.advisoryFindings).toContain("diagnostic_missing_foliation_definition");
  });

  it("removes the generic diagnostic semantic blocker when semantics close", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        sourceToYork,
        comparisonPolicyOverride: {
          comparison_path_expected_equivalence: false,
          comparison_path_blocks_readiness: false,
          comparison_mismatch_disposition: "advisory",
        },
      });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({ sourceToYork });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({ sourceToYork });
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({ payload });

    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });

    expect(artifact.readiness.diagnosticAuthorityClosed).toBe(true);
    expect(
      artifact.readiness.mechanismClaimBlockReasons.some((entry) =>
        entry.includes("diagnostic_semantic_split_open"),
      ),
    ).toBe(false);
    expect(
      artifact.readiness.mechanismClaimBlockReasons.some((entry) =>
        entry.startsWith("solve_authority_diagnostic_"),
      ),
    ).toBe(false);
    expect(artifact.readiness.mechanismChainReady).toBe(true);
  });

  it("keeps source, timing, brick, and snapshot closure states unchanged when diagnostic policy blocks", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        sourceToYork,
        comparisonPolicyOverride: {
          comparison_path_expected_equivalence: false,
          comparison_path_blocks_readiness: false,
          comparison_mismatch_disposition: "advisory",
        },
      });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({ sourceToYork });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({ sourceToYork });
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({
      payload,
      diagnosticPolicyOverride: {
        crossLaneAgreementBlocksMechanismReadiness: true,
      },
    });

    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });

    expect(artifact.readiness.sourceAuthorityClosed).toBe(true);
    expect(artifact.readiness.timingAuthorityClosed).toBe(true);
    expect(artifact.readiness.brickAuthorityClosed).toBe(true);
    expect(artifact.readiness.snapshotAuthorityClosed).toBe(true);
    expect(artifact.readiness.diagnosticAuthorityClosed).toBe(false);
    expect(artifact.readiness.mechanismChainReady).toBe(false);
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_diagnostic_cross_lane_requires_normalized_observer",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_diagnostic_cross_lane_reference_only",
    );
  });

  it("closes snapshot readiness when snapshot refs match the live-derived brick chain", () => {
    const { artifact } = buildSnapshotAuthorityFixture();
    expect(artifact.snapshotReadiness.snapshotAuthorityClosed).toBe(true);
    expect(artifact.blockingFindings).toEqual([]);
    expect(artifact.snapshotComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "metric_ref_hash",
          comparison_status: "matched",
        }),
        expect.objectContaining({
          field: "theta_channel_hash",
          comparison_status: "matched",
        }),
        expect.objectContaining({
          field: "k_trace_hash",
          comparison_status: "matched",
        }),
        expect.objectContaining({
          field: "snapshot_brick_url",
          comparison_status: "matched",
        }),
      ]),
    );
    expect(artifact.advisoryFindings).toContain("snapshot_authority_closed");
  });

  it("treats missing live equivalents as blocking or advisory based on snapshot policy", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.proofPackBrickRequest.metricT00Ref = null;

    const blocking = buildSnapshotAuthorityFixture({
      sourceToYork,
    }).artifact;
    expect(blocking.snapshotReadiness.snapshotAuthorityClosed).toBe(false);
    expect(blocking.blockingFindings).toContain("snapshot_missing_live_equivalent");

    const advisory = buildSnapshotAuthorityFixture({
      sourceToYork,
      snapshotPolicyOverride: {
        missingLiveEquivalentBlocksReadiness: false,
      },
    }).artifact;
    expect(advisory.snapshotReadiness.snapshotAuthorityClosed).toBe(true);
    expect(advisory.blockingFindings).toEqual([]);
    expect(advisory.advisoryFindings).toContain("snapshot_missing_live_equivalent");
  });

  it("treats snapshot-only authority as reference-only when policy allows it", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.proofPackSnapshotRefs.metric_ref_hash = "snapshot-only-metric-ref";
    sourceToYork.proofPackSnapshotRefs.snapshot_brick_url =
      "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&metricT00Ref=warp.metric.T00.natario_sdf.shift&referenceOnly=1";

    const artifact = buildSnapshotAuthorityFixture({
      sourceToYork,
      snapshotPolicyOverride: {
        snapshotOnlyAllowedForReference: true,
      },
      syncLiveRefs: false,
    }).artifact;

    expect(artifact.snapshotReadiness.snapshotAuthorityClosed).toBe(true);
    expect(artifact.blockingFindings).toEqual([]);
    expect(artifact.advisoryFindings).toContain("snapshot_reference_only");
  });

  it("removes the generic snapshot split blocker when snapshot authority closes", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const laneB = payload.diagnosticLanes.find(
      (entry: any) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    laneB.observer_approximation =
      "diagnostic-local observer-only drift proxy on fixed comoving foliation";
    laneB.cross_lane_claim_ready = false;
    laneB.reference_comparison_ready = true;
    laneB.semantics_closed = true;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        sourceToYork,
        comparisonPolicyOverride: {
          comparison_path_expected_equivalence: false,
          comparison_path_blocks_readiness: false,
          comparison_mismatch_disposition: "advisory",
        },
      });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({ sourceToYork });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({ sourceToYork });
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({
      payload,
    });

    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });

    expect(artifact.readiness.snapshotAuthorityClosed).toBe(true);
    expect(
      artifact.readiness.mechanismClaimBlockReasons.some((entry) =>
        entry.startsWith("solve_authority_snapshot_"),
      ),
    ).toBe(false);
    expect(artifact.readiness.diagnosticAuthorityClosed).toBe(true);
    expect(
      artifact.readiness.mechanismClaimBlockReasons.some((entry) =>
        entry.startsWith("solve_authority_diagnostic_"),
      ),
    ).toBe(false);
  });

  it("closes direct-copy and derived brick fields when required mappings/formulas are present", () => {
    const { artifact } = buildBrickAuthorityFixture();
    expect(artifact.brickReadiness.brickAuthorityClosed).toBe(true);
    const metricSource = artifact.brickFieldOwnership.find(
      (entry) => entry.field === "metricT00Source",
    );
    expect(metricSource?.mapping_type).toBe("direct_copy");
    expect(metricSource?.status).toBe("closed");
    const metricRef = artifact.brickFieldOwnership.find(
      (entry) => entry.field === "metricT00Ref",
    );
    expect(metricRef?.mapping_type).toBe("derived_transform");
    expect(metricRef?.mapping_formula_or_note).not.toBeNull();
  });

  it("requires explicit derivation metadata for derived-transform brick fields", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.parameterMappings = sourceToYork.parameterMappings.map((entry: any) =>
      entry.field === "warpFieldType -> metricT00Ref"
        ? { ...entry, mapping_formula: null, mapping_note: null }
        : entry,
    );
    const { artifact } = buildBrickAuthorityFixture({
      sourceToYork,
      brickPolicyOverride: {
        derivedTransformRequiresFormula: true,
      },
    });
    expect(artifact.brickReadiness.brickAuthorityClosed).toBe(false);
    expect(artifact.blockingFindings).toContain("brick_missing_parameter_derivation");
  });

  it("blocks readiness for required missing-derivation brick fields when policy requires it", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.parameterMappings = sourceToYork.parameterMappings.filter(
      (entry: any) => entry.field !== "warpFieldType -> metricT00Ref",
    );
    const { artifact } = buildBrickAuthorityFixture({
      sourceToYork,
      brickPolicyOverride: {
        requiredBrickFieldsForReadiness: ["metricT00Ref"],
        missingDerivationBlocksReadiness: true,
      },
    });
    expect(artifact.brickReadiness.brickAuthorityClosed).toBe(false);
    expect(artifact.blockingFindings).toContain("brick_missing_parameter_derivation");
  });

  it("treats audit-harness brick overrides as advisory or blocking based on policy", () => {
    const advisory = buildBrickAuthorityFixture({
      brickPolicyOverride: {
        auditHarnessOverridesBlockReadiness: false,
      },
    }).artifact;
    expect(advisory.brickReadiness.brickAuthorityClosed).toBe(true);
    expect(advisory.advisoryFindings).toContain("brick_audit_harness_override_active");
    expect(advisory.blockingFindings).not.toContain("brick_audit_harness_override_active");

    const blocking = buildBrickAuthorityFixture({
      brickPolicyOverride: {
        auditHarnessOverridesBlockReadiness: true,
      },
    }).artifact;
    expect(blocking.brickReadiness.brickAuthorityClosed).toBe(false);
    expect(blocking.blockingFindings).toContain("brick_audit_harness_override_active");
  });

  it("treats duty fallback as advisory or blocking based on policy", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.liveTimingAuthority.timingSource = "duty-fallback-derived";
    const advisory = buildTimingAuthorityFixture({
      sourceToYork,
      timingPolicyOverride: {
        fallbackTimingBlocksReadiness: false,
      },
    }).artifact;
    expect(advisory.timingReadiness.timingAuthorityClosed).toBe(true);
    expect(advisory.blockingFindings).not.toContain("timing_fallback_source_active");
    expect(advisory.advisoryFindings).toContain("timing_fallback_source_active");

    const blocking = buildTimingAuthorityFixture({
      sourceToYork,
      timingPolicyOverride: {
        fallbackTimingBlocksReadiness: true,
      },
    }).artifact;
    expect(blocking.timingReadiness.timingAuthorityClosed).toBe(false);
    expect(blocking.blockingFindings).toContain("timing_fallback_source_active");
  });

  it("applies simulated/autoscale timing policy toggles deterministically", () => {
    const sourceToYork = makeSourceToYorkFixture();
    sourceToYork.liveTimingAuthority.timingSource = "configured-simulated";
    const simulatedBlocking = buildTimingAuthorityFixture({
      sourceToYork,
      timingPolicyOverride: {
        simulatedTimingBlocksReadiness: true,
      },
    }).artifact;
    expect(simulatedBlocking.timingReadiness.timingAuthorityClosed).toBe(false);
    expect(simulatedBlocking.blockingFindings).toContain("timing_simulated_profile_active");

    const autoscaleBlocking = buildTimingAuthorityFixture({
      sourceToYork,
      timingPolicyOverride: {
        autoscaleTimingBlocksReadiness: true,
      },
    }).artifact;
    expect(autoscaleBlocking.timingReadiness.timingAuthorityClosed).toBe(false);
    expect(autoscaleBlocking.blockingFindings).toContain("timing_autoscale_source_active");
  });

  it("replaces the generic snapshot blocker with a specific snapshot blocker when timing policy is closed", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const laneB = payload.diagnosticLanes.find(
      (entry: any) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    laneB.observer_approximation =
      "diagnostic-local observer-only drift proxy on fixed comoving foliation";
    laneB.cross_lane_claim_ready = false;
    laneB.reference_comparison_ready = true;
    laneB.semantics_closed = true;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        sourceToYork,
        comparisonPolicyOverride: {
          comparison_path_expected_equivalence: false,
          comparison_path_blocks_readiness: false,
          comparison_mismatch_disposition: "advisory",
        },
    });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({ sourceToYork });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({
      sourceToYork,
    });
    const snapshotSourceToYork = {
      ...sourceToYork,
      proofPackSnapshotRefs: {
        ...sourceToYork.proofPackSnapshotRefs,
        snapshot_brick_url: `${sourceToYork.proofPackBrickRequest.brickUrl}&generation=stale`,
      },
    };
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork: snapshotSourceToYork,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({
      payload,
    });
    expect(timingAudit.timingReadiness.timingAuthorityClosed).toBe(true);
    expect(brickAudit.brickReadiness.brickAuthorityClosed).toBe(true);
    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork: snapshotSourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });
    expect(artifact.readiness.timingAuthorityClosed).toBe(true);
    expect(artifact.readiness.mechanismClaimBlockReasons).not.toContain(
      "solve_authority_timing_split_open",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).not.toContain(
      "solve_authority_brick_split_open",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).not.toContain(
      "solve_authority_snapshot_split_open",
    );
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_snapshot_brick_ref_mismatch",
    );
    expect(artifact.readiness.diagnosticAuthorityClosed).toBe(true);
  });

  it("keeps source/timing/brick/diagnostic readiness unchanged when snapshot is the only open downstream stage", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const laneB = payload.diagnosticLanes.find(
      (entry: any) => entry.lane_id === YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
    );
    laneB.observer_approximation =
      "diagnostic-local observer-only drift proxy on fixed comoving foliation";
    laneB.cross_lane_claim_ready = false;
    laneB.reference_comparison_ready = true;
    laneB.semantics_closed = true;
    const sourceToYork = makeSourceToYorkFixture();
    const { artifact: sourceStageAudit, sourceFormulaArtifact, firstDivergencePath } =
      buildSourceStageFixture({
        sourceToYork,
        comparisonPolicyOverride: {
          comparison_path_expected_equivalence: false,
          comparison_path_blocks_readiness: false,
          comparison_mismatch_disposition: "advisory",
        },
    });
    const { artifact: timingAudit } = buildTimingAuthorityFixture({
      sourceToYork,
    });
    const { artifact: brickAudit } = buildBrickAuthorityFixture({
      sourceToYork,
    });
    const snapshotSourceToYork = {
      ...sourceToYork,
      proofPackBrickRequest: {
        ...sourceToYork.proofPackBrickRequest,
        metricT00Ref: null,
      },
    };
    const { artifact: snapshotAudit, snapshotPath } = buildSnapshotAuthorityFixture({
      payload,
      sourceToYork: snapshotSourceToYork,
    });
    const { artifact: diagnosticAudit } = buildDiagnosticSemanticFixture({
      payload,
    });
    const artifact = buildNhm2SolveAuthorityAuditArtifact({
      payload,
      sourceToYork: snapshotSourceToYork,
      timingAudit,
      brickAudit,
      snapshotAudit,
      diagnosticAudit,
      sourceFormulaAudit: sourceFormulaArtifact,
      sourceStageAudit,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceToYorkArtifactPath:
        "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      timingAuditPath:
        "artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json",
      brickAuditPath:
        "artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json",
      snapshotAuditPath: snapshotPath,
      diagnosticAuditPath:
        "artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json",
      sourceFormulaAuditPath:
        "artifacts/research/full-solve/nhm2-source-formula-audit-latest.json",
      sourceStageAuditPath:
        "artifacts/research/full-solve/nhm2-source-stage-audit-latest.json",
      nhm2SnapshotPath:
        "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json",
      waveAEvidencePackPath: "artifacts/research/full-solve/A/evidence-pack.json",
      firstDivergencePath,
    });
    expect(artifact.splits.map((entry) => entry.split_id)).not.toContain(
      "source_stage_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).not.toContain(
      "timing_authority_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).not.toContain(
      "contract_to_brick_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).toContain(
      "snapshot_authority_split",
    );
    expect(artifact.splits.map((entry) => entry.split_id)).not.toContain(
      "diagnostic_semantic_split",
    );
    expect(artifact.readiness.sourceAuthorityClosed).toBe(true);
    expect(artifact.readiness.timingAuthorityClosed).toBe(true);
    expect(artifact.readiness.brickAuthorityClosed).toBe(true);
    expect(artifact.readiness.snapshotAuthorityClosed).toBe(false);
    expect(artifact.readiness.diagnosticAuthorityClosed).toBe(true);
    expect(artifact.readiness.mechanismChainReady).toBe(false);
    expect(artifact.readiness.mechanismClaimBlockReasons).toContain(
      "solve_authority_snapshot_missing_live_equivalent",
    );
  });

  it("keeps readiness split explicit: York classification can be ready while mechanism chain stays blocked", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const readiness = computeSolveAuthorityReadiness({
      payload,
      sourceToYork: makeSourceToYorkFixture(),
      splits: [
        {
          split_id: "source_stage_split",
          severity: "high",
          fields: ["metricT00Si_Jm3"],
          authorities_involved: ["source_authority", "brick_authority"],
          evidence: ["stage=S0_source"],
          blocks: ["mechanism_claims"],
          recommended_next_patch: "patch source stage",
        },
      ] as any,
    });
    expect(readiness.yorkClassificationReady).toBe(true);
    expect(readiness.sourceAuthorityClosed).toBe(false);
    expect(readiness.mechanismChainReady).toBe(false);
  });

  it("emits fixed-scale comparison artifacts and keeps NHM2 closer to Natario under shared scaling", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.classificationScoring = {
      distance_to_alcubierre_reference: 0.24,
      distance_to_low_expansion_reference: 0.03,
      reference_margin: 0.21,
      winning_reference: "natario_control",
      margin_sufficient: true,
      winning_reference_within_threshold: true,
      distinct_by_policy: false,
      distinctness_threshold: 0.4,
      margin_min: 0.05,
      reference_match_threshold: 0.5,
      distance_metric: "weighted_normalized_l1",
      normalization_method: "contract-v1",
      to_alcubierre_breakdown: {} as any,
      to_low_expansion_breakdown: {} as any,
    };
    const caseById = new Map(payload.cases.map((entry: any) => [entry.caseId, entry]));
    caseById.get("alcubierre_control").classificationFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 12,
      negative_count_xz: 12,
      positive_count_xrho: 10,
      negative_count_xrho: 10,
      support_overlap_pct: 0.8,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-",
      shell_map_activity: 0.7,
    };
    caseById.get("natario_control").classificationFeatures = {
      theta_abs_max_raw: 0.15,
      theta_abs_max_display: 0.15,
      positive_count_xz: 8,
      negative_count_xz: 8,
      positive_count_xrho: 8,
      negative_count_xrho: 8,
      support_overlap_pct: 0.78,
      near_zero_theta: false,
      signed_lobe_summary: "mixed_or_flat",
      shell_map_activity: 0.2,
    };
    caseById.get("nhm2_certified").classificationFeatures = {
      theta_abs_max_raw: 0.12,
      theta_abs_max_display: 0.12,
      positive_count_xz: 8,
      negative_count_xz: 8,
      positive_count_xrho: 8,
      negative_count_xrho: 8,
      support_overlap_pct: 0.77,
      near_zero_theta: false,
      signed_lobe_summary: "mixed_or_flat",
      shell_map_activity: 0.22,
    };
    const makeInputCase = (
      caseId: "alcubierre_control" | "natario_control" | "nhm2_certified",
      xz: number[],
      xrho: number[],
      signed: "fore+/aft-" | "fore-/aft+" | "mixed_or_flat",
    ) => ({
      case_id: caseId,
      label: caseId,
      views: [
        {
          view_id: "york-surface-3p1",
          coordinate_mode: "x-z-midplane",
          sampling_choice: "x-z midplane",
          source_width: 4,
          source_height: 4,
          slice: Float32Array.from(xz),
          slice_hash: `hash-${caseId}-xz`,
          raw_extrema: { min: Math.min(...xz), max: Math.max(...xz), absMax: Math.max(...xz.map(Math.abs)) },
          signed_lobe_summary: signed,
        },
        {
          view_id: "york-surface-rho-3p1",
          coordinate_mode: "x-rho",
          sampling_choice: "x-rho cylindrical remap",
          source_width: 4,
          source_height: 4,
          slice: Float32Array.from(xrho),
          slice_hash: `hash-${caseId}-xrho`,
          raw_extrema: {
            min: Math.min(...xrho),
            max: Math.max(...xrho),
            absMax: Math.max(...xrho.map(Math.abs)),
          },
          signed_lobe_summary: null,
        },
        {
          view_id: "york-topology-normalized-3p1",
          coordinate_mode: "x-z-midplane",
          sampling_choice: "x-z midplane",
          source_width: 4,
          source_height: 4,
          slice: Float32Array.from(xz),
          slice_hash: `hash-${caseId}-topology`,
          raw_extrema: { min: Math.min(...xz), max: Math.max(...xz), absMax: Math.max(...xz.map(Math.abs)) },
          signed_lobe_summary: signed,
        },
      ],
    });
    const caseInputs = [
      makeInputCase(
        "alcubierre_control",
        [-1, -1, -0.8, -0.8, -0.4, -0.3, 0.3, 0.4, -0.2, -0.1, 0.6, 0.8, 0.5, 0.7, 1, 1],
        [-0.9, -0.8, -0.7, -0.6, -0.2, -0.1, 0.1, 0.2, -0.1, 0.2, 0.5, 0.8, 0.3, 0.6, 0.9, 1],
        "fore+/aft-",
      ),
      makeInputCase(
        "natario_control",
        [-0.12, -0.1, -0.08, -0.1, -0.06, -0.04, 0.04, 0.06, -0.04, -0.02, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12],
        [-0.1, -0.08, -0.06, -0.05, -0.03, -0.01, 0.01, 0.03, -0.02, 0.01, 0.03, 0.05, 0.04, 0.06, 0.08, 0.1],
        "mixed_or_flat",
      ),
      makeInputCase(
        "nhm2_certified",
        [-0.11, -0.09, -0.07, -0.09, -0.05, -0.03, 0.03, 0.05, -0.03, -0.01, 0.01, 0.03, 0.05, 0.07, 0.09, 0.11],
        [-0.09, -0.07, -0.05, -0.04, -0.025, -0.005, 0.005, 0.025, -0.015, 0.005, 0.025, 0.04, 0.035, 0.055, 0.075, 0.09],
        "mixed_or_flat",
      ),
    ] as any;
    const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), "york-fixed-scale-"));
    const artifact = await buildNhm2YorkFixedScaleComparisonArtifact({
      payload,
      solveAuthorityAudit: {
        readiness: {
          sourceAuthorityClosed: true,
          timingAuthorityClosed: true,
          brickAuthorityClosed: true,
          snapshotAuthorityClosed: true,
          diagnosticAuthorityClosed: true,
          yorkClassificationReady: true,
          mechanismChainReady: true,
          mechanismClaimBlockReasons: [],
        },
      } as any,
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      solveAuthorityAuditPath:
        "artifacts/research/full-solve/nhm2-solve-authority-audit-latest.json",
      yorkRenderDebugArtifactPath:
        "artifacts/research/full-solve/nhm2-york-render-debug-latest.json",
      exportDirectory: exportDir,
      frameSize: { width: 96, height: 64 },
      caseInputs,
    });
    expect(artifact.caseExports).toHaveLength(3);
    expect(artifact.pairwiseMetrics).toHaveLength(3);
    expect(artifact.fixed_scale_render_verdict).toBe(
      "shared_scale_preserves_natario_like_class",
    );
    expect(artifact.nasaFigure1Comparison.display_sign_multiplier).toBe(-1);
    expect(artifact.nhm2_vs_natario_visual_distance?.pixel_rms).toBeLessThan(
      artifact.nhm2_vs_alcubierre_visual_distance?.pixel_rms ?? Infinity,
    );
    expect(artifact.nasaFigure1Comparison.primary_control_baseline_case).toBe(
      "natario_control",
    );
    expect(
      artifact.nasaFigure1Comparison.relative_to_primary_control_pixel_rms_ratio ?? 0,
    ).toBeGreaterThan(1.5);
    expect(artifact.is_nhm2_close_to_nasa_fig1).toBe("no");
    expect(artifact.figure1_overlay_verdict).toBe(
      "real_nhm2_vs_alcubierre_morphology_difference",
    );
    expect(artifact.exportIntegrity.valid).toBe(true);
    expect(artifact.exportIntegrity.visual_metric_source_stage).toBe(
      "pre_png_color_buffer",
    );
    expect(artifact.exportIntegrity.blockingFindings).toHaveLength(0);
    const topologyMetric = artifact.pairwiseMetrics
      .find((entry) => entry.pair_id === "nhm2_vs_alcubierre")
      ?.views.find((entry) => entry.view_id === "york-topology-normalized-3p1");
    expect(topologyMetric?.metric_source_stage).toBe("pre_png_color_buffer");
    expect(topologyMetric?.lhs_display_buffer_hash).not.toBe(
      topologyMetric?.rhs_display_buffer_hash,
    );
    expect(topologyMetric?.pixel_rms ?? 0).toBeGreaterThan(0);
    expect(artifact.nasaFigure1Comparison.metric_source_stage).toBe(
      "pre_png_color_buffer",
    );
    expect(artifact.notes).toContain("mechanism_chain_ready=true");
    expect(artifact.notes).toContain("diagnostic_authority_closed=true");
    expect(artifact.differenceCauses).toContain("autoscale_masked_visual_difference");
    for (const entry of artifact.caseExports.flatMap((item) => item.views)) {
      expect(fs.existsSync(entry.png_path)).toBe(true);
    }
  });

  it("fails loudly when distinct transformed buffers collapse to identical fixed-scale PNGs", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.classificationScoring = {
      distance_to_alcubierre_reference: 0.2,
      distance_to_low_expansion_reference: 0.05,
    };
    const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), "york-fixed-scale-collision-"));
    const makeCase = (
      case_id: "alcubierre_control" | "natario_control" | "nhm2_certified",
      xzValue: number,
    ) => ({
      case_id,
      label: case_id,
      views: [
        {
          view_id: "york-surface-3p1",
          coordinate_mode: "x-z-midplane",
          sampling_choice: "x-z midplane",
          source_width: 1,
          source_height: 1,
          slice: Float32Array.from([xzValue]),
          slice_hash: `${case_id}-xz`,
          raw_extrema: { min: xzValue, max: xzValue, absMax: Math.abs(xzValue) },
          signed_lobe_summary: "mixed_or_flat",
        },
        {
          view_id: "york-surface-rho-3p1",
          coordinate_mode: "x-rho",
          sampling_choice: "x-rho cylindrical remap",
          source_width: 1,
          source_height: 1,
          slice: Float32Array.from([xzValue]),
          slice_hash: `${case_id}-xrho`,
          raw_extrema: { min: xzValue, max: xzValue, absMax: Math.abs(xzValue) },
          signed_lobe_summary: null,
        },
        {
          view_id: "york-topology-normalized-3p1",
          coordinate_mode: "x-z-midplane",
          sampling_choice: "x-z midplane",
          source_width: 1,
          source_height: 1,
          slice: Float32Array.from([xzValue]),
          slice_hash: `${case_id}-top`,
          raw_extrema: { min: xzValue, max: xzValue, absMax: Math.abs(xzValue) },
          signed_lobe_summary: "mixed_or_flat",
        },
      ],
    });
    await expect(
      buildNhm2YorkFixedScaleComparisonArtifact({
        payload,
        solveAuthorityAudit: {
          readiness: {
            sourceAuthorityClosed: true,
            timingAuthorityClosed: true,
            brickAuthorityClosed: true,
            snapshotAuthorityClosed: true,
            diagnosticAuthorityClosed: true,
            yorkClassificationReady: true,
            mechanismChainReady: true,
            mechanismClaimBlockReasons: [],
          },
        } as any,
        sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
        solveAuthorityAuditPath: "artifacts/research/full-solve/solve.json",
        yorkRenderDebugArtifactPath: "artifacts/research/full-solve/render.json",
        exportDirectory: exportDir,
        frameSize: { width: 1, height: 1 },
        caseInputs: [
          makeCase("alcubierre_control", 0.5001),
          makeCase("natario_control", 0.50015),
          makeCase("nhm2_certified", 0.5002),
        ] as any,
      }),
    ).rejects.toThrow(/fixed_scale_export_integrity_failed/);
  });

  it("renders fixed-scale comparison markdown and NASA overlay memo with primary-source references", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.classificationScoring = {
      distance_to_alcubierre_reference: 0.3,
      distance_to_low_expansion_reference: 0.04,
    };
    const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), "york-fixed-scale-render-"));
    const artifact = await buildNhm2YorkFixedScaleComparisonArtifact({
      payload,
      solveAuthorityAudit: {
        readiness: {
          sourceAuthorityClosed: true,
          timingAuthorityClosed: true,
          brickAuthorityClosed: true,
          snapshotAuthorityClosed: true,
          diagnosticAuthorityClosed: true,
          yorkClassificationReady: true,
          mechanismChainReady: true,
          mechanismClaimBlockReasons: [],
        },
      } as any,
      sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
      solveAuthorityAuditPath: "artifacts/research/full-solve/solve.json",
      yorkRenderDebugArtifactPath: "artifacts/research/full-solve/render.json",
      exportDirectory: exportDir,
      frameSize: { width: 64, height: 64 },
      caseInputs: [
        {
          case_id: "alcubierre_control",
          label: "alc",
          views: [
            {
              view_id: "york-surface-3p1",
              coordinate_mode: "x-z-midplane",
              sampling_choice: "x-z midplane",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-1, -0.5, 0.5, 1]),
              slice_hash: "a-xz",
              raw_extrema: { min: -1, max: 1, absMax: 1 },
              signed_lobe_summary: "fore+/aft-",
            },
            {
              view_id: "york-surface-rho-3p1",
              coordinate_mode: "x-rho",
              sampling_choice: "x-rho cylindrical remap",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-1, -0.5, 0.5, 1]),
              slice_hash: "a-rho",
              raw_extrema: { min: -1, max: 1, absMax: 1 },
              signed_lobe_summary: null,
            },
            {
              view_id: "york-topology-normalized-3p1",
              coordinate_mode: "x-z-midplane",
              sampling_choice: "x-z midplane",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-1, -0.5, 0.5, 1]),
              slice_hash: "a-top",
              raw_extrema: { min: -1, max: 1, absMax: 1 },
              signed_lobe_summary: "fore+/aft-",
            },
          ],
        },
        {
          case_id: "natario_control",
          label: "nat",
          views: [
            {
              view_id: "york-surface-3p1",
              coordinate_mode: "x-z-midplane",
              sampling_choice: "x-z midplane",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-0.1, -0.05, 0.05, 0.1]),
              slice_hash: "n-xz",
              raw_extrema: { min: -0.1, max: 0.1, absMax: 0.1 },
              signed_lobe_summary: "mixed_or_flat",
            },
            {
              view_id: "york-surface-rho-3p1",
              coordinate_mode: "x-rho",
              sampling_choice: "x-rho cylindrical remap",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-0.1, -0.05, 0.05, 0.1]),
              slice_hash: "n-rho",
              raw_extrema: { min: -0.1, max: 0.1, absMax: 0.1 },
              signed_lobe_summary: null,
            },
            {
              view_id: "york-topology-normalized-3p1",
              coordinate_mode: "x-z-midplane",
              sampling_choice: "x-z midplane",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-0.1, -0.05, 0.05, 0.1]),
              slice_hash: "n-top",
              raw_extrema: { min: -0.1, max: 0.1, absMax: 0.1 },
              signed_lobe_summary: "mixed_or_flat",
            },
          ],
        },
        {
          case_id: "nhm2_certified",
          label: "nhm2",
          views: [
            {
              view_id: "york-surface-3p1",
              coordinate_mode: "x-z-midplane",
              sampling_choice: "x-z midplane",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-0.08, -0.04, 0.04, 0.08]),
              slice_hash: "h-xz",
              raw_extrema: { min: -0.08, max: 0.08, absMax: 0.08 },
              signed_lobe_summary: "mixed_or_flat",
            },
            {
              view_id: "york-surface-rho-3p1",
              coordinate_mode: "x-rho",
              sampling_choice: "x-rho cylindrical remap",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-0.08, -0.04, 0.04, 0.08]),
              slice_hash: "h-rho",
              raw_extrema: { min: -0.08, max: 0.08, absMax: 0.08 },
              signed_lobe_summary: null,
            },
            {
              view_id: "york-topology-normalized-3p1",
              coordinate_mode: "x-z-midplane",
              sampling_choice: "x-z midplane",
              source_width: 2,
              source_height: 2,
              slice: Float32Array.from([-0.08, -0.04, 0.04, 0.08]),
              slice_hash: "h-top",
              raw_extrema: { min: -0.08, max: 0.08, absMax: 0.08 },
              signed_lobe_summary: "mixed_or_flat",
            },
          ],
        },
      ] as any,
    });
    const markdown = renderNhm2YorkFixedScaleComparisonMarkdown(artifact);
    const memo = renderNhm2NasaFigure1OverlayMemo(artifact);
    expect(markdown).toContain("NASA Figure 1 Reference");
    expect(markdown).toContain("visual_metric_source_stage");
    expect(markdown).toContain("fixed_scale_render_verdict");
    expect(memo).toContain("ntrs.nasa.gov");
    expect(memo).toContain("is_nhm2_close_to_nasa_fig1");
    expect(memo).toContain("pre-PNG color buffer");
  });

  it("builds a canonical calibration ladder and explicit unavailable ablation panel", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.classificationScoring = {
      distance_to_alcubierre_reference: 0.32,
      distance_to_low_expansion_reference: 0.05,
      reference_margin: 0.27,
      winning_reference: "natario_control",
      margin_sufficient: true,
      winning_reference_within_threshold: true,
      distinct_by_policy: false,
      distinctness_threshold: 0.5,
      margin_min: 0.08,
      reference_match_threshold: 0.5,
      distance_metric: "weighted_normalized_l1",
      normalization_method: "contract-v1",
      to_alcubierre_breakdown: {} as any,
      to_low_expansion_breakdown: {} as any,
    };
    const caseById = new Map(payload.cases.map((entry: any) => [entry.caseId, entry]));
    caseById.get("alcubierre_control").primaryYork = {
      ...caseById.get("alcubierre_control").primaryYork,
      rawExtrema: { min: -1, max: 1, absMax: 1 },
      nearZeroTheta: false,
    };
    caseById.get("alcubierre_control").offlineYorkAudit.alcubierreSignedLobeSummary = {
      foreHalfPositiveTotal: 4,
      foreHalfNegativeTotal: -1,
      aftHalfPositiveTotal: 1,
      aftHalfNegativeTotal: -4,
      signedLobeSummary: "fore+/aft-",
    };
    caseById.get("natario_control").primaryYork = {
      ...caseById.get("natario_control").primaryYork,
      rawExtrema: { min: -1e-25, max: 1e-25, absMax: 1e-25 },
      nearZeroTheta: true,
    };
    caseById.get("nhm2_certified").primaryYork = {
      ...caseById.get("nhm2_certified").primaryYork,
      rawExtrema: { min: -0.12, max: 0.12, absMax: 0.12 },
      nearZeroTheta: false,
    };
    caseById.get("alcubierre_control").classificationFeatures = {
      theta_abs_max_raw: 1,
      theta_abs_max_display: 1,
      positive_count_xz: 12,
      negative_count_xz: 12,
      positive_count_xrho: 10,
      negative_count_xrho: 10,
      support_overlap_pct: 0.8,
      near_zero_theta: false,
      signed_lobe_summary: "fore+/aft-",
      shell_map_activity: 0.7,
    };
    caseById.get("natario_control").classificationFeatures = {
      theta_abs_max_raw: 0.05,
      theta_abs_max_display: 0.05,
      positive_count_xz: 8,
      negative_count_xz: 8,
      positive_count_xrho: 8,
      negative_count_xrho: 8,
      support_overlap_pct: 0.78,
      near_zero_theta: true,
      signed_lobe_summary: "mixed_or_flat",
      shell_map_activity: 0.1,
    };
    caseById.get("nhm2_certified").classificationFeatures = {
      theta_abs_max_raw: 0.06,
      theta_abs_max_display: 0.06,
      positive_count_xz: 8,
      negative_count_xz: 8,
      positive_count_xrho: 8,
      negative_count_xrho: 8,
      support_overlap_pct: 0.77,
      near_zero_theta: false,
      signed_lobe_summary: "mixed_or_flat",
      shell_map_activity: 0.12,
    };
    const makeInputCase = (
      caseId: "alcubierre_control" | "natario_control" | "nhm2_certified",
      xz: number[],
      xrho: number[],
      signed: "fore+/aft-" | "mixed_or_flat",
      support: number,
    ) => ({
      case_id: caseId,
      label: caseId,
      views: [
        {
          view_id: "york-surface-3p1",
          coordinate_mode: "x-z-midplane",
          sampling_choice: "x-z midplane",
          source_width: 4,
          source_height: 4,
          slice: Float32Array.from(xz),
          slice_hash: `${caseId}-xz`,
          raw_extrema: { min: Math.min(...xz), max: Math.max(...xz), absMax: Math.max(...xz.map(Math.abs)) },
          signed_lobe_summary: signed,
          support_overlap_pct: support,
          near_zero_theta: Math.max(...xz.map(Math.abs)) <= 1e-20,
        },
        {
          view_id: "york-surface-rho-3p1",
          coordinate_mode: "x-rho",
          sampling_choice: "x-rho cylindrical remap",
          source_width: 4,
          source_height: 4,
          slice: Float32Array.from(xrho),
          slice_hash: `${caseId}-xrho`,
          raw_extrema: { min: Math.min(...xrho), max: Math.max(...xrho), absMax: Math.max(...xrho.map(Math.abs)) },
          signed_lobe_summary: null,
          support_overlap_pct: support,
          near_zero_theta: Math.max(...xrho.map(Math.abs)) <= 1e-20,
        },
        {
          view_id: "york-topology-normalized-3p1",
          coordinate_mode: "x-z-midplane",
          sampling_choice: "x-z midplane",
          source_width: 4,
          source_height: 4,
          slice: Float32Array.from(xz),
          slice_hash: `${caseId}-topology`,
          raw_extrema: { min: Math.min(...xz), max: Math.max(...xz), absMax: Math.max(...xz.map(Math.abs)) },
          signed_lobe_summary: signed,
          support_overlap_pct: support,
          near_zero_theta: Math.max(...xz.map(Math.abs)) <= 1e-20,
        },
      ],
    });
    const caseInputs = [
      makeInputCase(
        "alcubierre_control",
        [-1, -0.8, -0.6, -0.4, -0.2, -0.1, 0.2, 0.4, -0.1, 0.1, 0.5, 0.7, 0.3, 0.6, 0.9, 1],
        [-1, -0.8, -0.6, -0.4, -0.2, -0.1, 0.2, 0.4, -0.1, 0.1, 0.5, 0.7, 0.3, 0.6, 0.9, 1],
        "fore+/aft-",
        0.8,
      ),
      makeInputCase(
        "natario_control",
        [-0.05, -0.04, -0.03, -0.02, -0.01, -0.005, 0.005, 0.01, -0.005, 0.005, 0.01, 0.02, 0.02, 0.03, 0.04, 0.05],
        [-0.05, -0.04, -0.03, -0.02, -0.01, -0.005, 0.005, 0.01, -0.005, 0.005, 0.01, 0.02, 0.02, 0.03, 0.04, 0.05],
        "mixed_or_flat",
        0.78,
      ),
      makeInputCase(
        "nhm2_certified",
        [-0.06, -0.05, -0.04, -0.03, -0.015, -0.008, 0.008, 0.015, -0.008, 0.008, 0.015, 0.03, 0.03, 0.04, 0.05, 0.06],
        [-0.06, -0.05, -0.04, -0.03, -0.015, -0.008, 0.008, 0.015, -0.008, 0.008, 0.015, 0.03, 0.03, 0.04, 0.05, 0.06],
        "mixed_or_flat",
        0.77,
      ),
    ] as any;
    const fixedExportDir = fs.mkdtempSync(path.join(os.tmpdir(), "york-fixed-scale-calibration-"));
    const calibrationExportDir = fs.mkdtempSync(path.join(os.tmpdir(), "york-calibration-panel-"));
    const fixedScaleArtifact = await buildNhm2YorkFixedScaleComparisonArtifact({
      payload,
      solveAuthorityAudit: {
        readiness: {
          sourceAuthorityClosed: true,
          timingAuthorityClosed: true,
          brickAuthorityClosed: true,
          snapshotAuthorityClosed: true,
          diagnosticAuthorityClosed: true,
          yorkClassificationReady: true,
          mechanismChainReady: true,
          mechanismClaimBlockReasons: [],
        },
      } as any,
      sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
      solveAuthorityAuditPath: "artifacts/research/full-solve/solve.json",
      yorkRenderDebugArtifactPath: "artifacts/research/full-solve/render.json",
      exportDirectory: fixedExportDir,
      frameSize: { width: 96, height: 64 },
      caseInputs,
    });
    const calibrationArtifact = await buildWarpYorkCanonicalCalibrationArtifact({
      payload,
      solveAuthorityAudit: {
        readiness: {
          sourceAuthorityClosed: true,
          timingAuthorityClosed: true,
          brickAuthorityClosed: true,
          snapshotAuthorityClosed: true,
          diagnosticAuthorityClosed: true,
          yorkClassificationReady: true,
          mechanismChainReady: true,
          mechanismClaimBlockReasons: [],
        },
      } as any,
      sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
      solveAuthorityAuditPath: "artifacts/research/full-solve/solve.json",
      fixedScaleArtifactPath: "artifacts/research/full-solve/fixed-scale.json",
      exportDirectory: calibrationExportDir,
      frameSize: { width: 96, height: 64 },
      caseInputs,
    });
    expect(calibrationArtifact.canonicalCases).toHaveLength(4);
    expect(calibrationArtifact.pairwiseMetrics).toHaveLength(6);
    expect(calibrationArtifact.controlValidation.control_validation_status).toBe("validated");
    expect(calibrationArtifact.decisionGate.calibration_verdict).toBe(
      "canonical_controls_validated_nhm2_natario_like",
    );
    expect(calibrationArtifact.nhm2CurrentClass).toBe("natario_like_low_expansion");
    expect(calibrationArtifact.zeroExpectationChecks.every((entry) => entry.pixel_rms === 0)).toBe(true);
    expect(calibrationArtifact.exportIntegrity.valid).toBe(true);
    const ablationArtifact = buildNhm2YorkAblationPanelArtifact({
      payload,
      canonicalCalibrationArtifact: calibrationArtifact,
      sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
      canonicalCalibrationArtifactPath:
        "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
      exportDirectory: "artifacts/research/full-solve/rendered-york-ablation-panel-2026-03-31",
      ablationComparisons: [
        {
          ablation_id: "nhm2_without_hull_coupling",
          case_id: "nhm2_without_hull_coupling",
          label: "NHM2 without hull coupling",
          status: "available",
          reason: "Derived from live selectors",
          metricT00Ref: "warp.metric.T00.natario.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-hull",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?metricT00Ref=warp.metric.T00.natario.shift",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario.shift",
            metricT00Source: "metric",
            warpFieldType: "natario",
            sourceRedesignMode: null,
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          couplingToggles: { hull_coupling_removed: true },
          hullSupportToggles: { support_mask_display_only: false },
          derivationNote: "selector derived",
          caseViews: [],
          comparison_to_nhm2: null,
          comparison_to_natario: null,
          comparison_to_alcubierre: null,
          comparison_to_flat: null,
          raw_control_distance_delta: {
            toward_natario: 0.01,
            toward_alcubierre: 0.04,
            toward_flat: -0.02,
          },
          pixel_rms_delta: {
            toward_natario: 0.001,
            toward_alcubierre: 0.003,
            toward_flat: -0.001,
          },
          sign_count_delta: { positive: 2, negative: 2 },
          signed_lobe_summary_change: "mixed_or_flat -> fore+/aft-",
          topology_view_delta: 0.02,
          movementClass: "toward_alcubierre",
          movementMagnitude: 0.04,
          dominantShift: "toward Alcubierre",
          likelySubsystemImplication: "Hull coupling suppresses Alcubierre-like lobes.",
        },
        {
          ablation_id: "nhm2_without_casimir_drive",
          case_id: "nhm2_without_casimir_drive",
          label: "NHM2 without Casimir drive",
          status: "available",
          reason: "Derived from live selectors",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-casimir",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?q=1e-6",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: null,
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 1e-6,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          couplingToggles: { casimir_drive_q: 1e-6 },
          hullSupportToggles: { support_mask_display_only: false },
          derivationNote: "selector derived",
          caseViews: [],
          comparison_to_nhm2: null,
          comparison_to_natario: null,
          comparison_to_alcubierre: null,
          comparison_to_flat: null,
          raw_control_distance_delta: {
            toward_natario: 0,
            toward_alcubierre: 0,
            toward_flat: 0.002,
          },
          pixel_rms_delta: {
            toward_natario: 0,
            toward_alcubierre: 0,
            toward_flat: 0.0002,
          },
          sign_count_delta: { positive: 0, negative: 0 },
          signed_lobe_summary_change: "unchanged",
          topology_view_delta: 0.001,
          movementClass: "no_meaningful_shift",
          movementMagnitude: 0,
          dominantShift: "no material change",
          likelySubsystemImplication: "Casimir drive is not the primary morphology driver.",
        },
        {
          ablation_id: "nhm2_simplified_source",
          case_id: "nhm2_simplified_source",
          label: "NHM2 simplified source",
          status: "available",
          reason: "Derived from live selectors",
          metricT00Ref: "warp.metric.T00.irrotational.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-source",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?metricT00Ref=warp.metric.T00.irrotational.shift",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.irrotational.shift",
            metricT00Source: "metric",
            warpFieldType: "irrotational",
            sourceRedesignMode: null,
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          couplingToggles: { simplified_source_family: "irrotational_shell_v1" },
          hullSupportToggles: { support_mask_display_only: false },
          derivationNote: "selector derived",
          caseViews: [],
          comparison_to_nhm2: null,
          comparison_to_natario: null,
          comparison_to_alcubierre: null,
          comparison_to_flat: null,
          raw_control_distance_delta: {
            toward_natario: -0.01,
            toward_alcubierre: 0.08,
            toward_flat: -0.03,
          },
          pixel_rms_delta: {
            toward_natario: -0.001,
            toward_alcubierre: 0.006,
            toward_flat: -0.001,
          },
          sign_count_delta: { positive: 4, negative: 4 },
          signed_lobe_summary_change: "mixed_or_flat -> fore+/aft-",
          topology_view_delta: 0.05,
          movementClass: "toward_alcubierre",
          movementMagnitude: 0.08,
          dominantShift: "source-shape shift",
          likelySubsystemImplication: "Higher-order source shaping dominates current morphology.",
        },
        {
          ablation_id: "nhm2_support_mask_off",
          case_id: "nhm2_support_mask_off",
          label: "NHM2 support mask off",
          status: "unavailable",
          reason: "display-only overlay",
          metricT00Ref: null,
          metricT00Source: null,
          metricRefHash: null,
          metricVolumeRefUrl: null,
          sourceSelectors: null,
          couplingToggles: { hull_coupling_removed: false },
          hullSupportToggles: { support_mask_display_only: true },
          derivationNote: "unavailable",
          caseViews: [],
          comparison_to_nhm2: null,
          comparison_to_natario: null,
          comparison_to_alcubierre: null,
          comparison_to_flat: null,
          raw_control_distance_delta: {
            toward_natario: null,
            toward_alcubierre: null,
            toward_flat: null,
          },
          pixel_rms_delta: {
            toward_natario: null,
            toward_alcubierre: null,
            toward_flat: null,
          },
          sign_count_delta: { positive: null, negative: null },
          signed_lobe_summary_change: "unavailable",
          topology_view_delta: null,
          movementClass: "unavailable",
          movementMagnitude: null,
          dominantShift: "Unavailable",
          likelySubsystemImplication: "display-only",
        },
      ] as any,
      dominantSensitivityCause: "source_shaping",
      ablationDecision: "source_shaping_dominates_current_morphology",
    });
    expect(ablationArtifact.ablationComparisons).toHaveLength(4);
    expect(ablationArtifact.implementedAblations).toEqual([
      "nhm2_without_hull_coupling",
      "nhm2_without_casimir_drive",
      "nhm2_simplified_source",
    ]);
    expect(ablationArtifact.stillUnavailableAblations).toEqual([
      expect.objectContaining({ ablation_id: "nhm2_support_mask_off" }),
    ]);
    expect(ablationArtifact.ablationDecision).toBe("source_shaping_dominates_current_morphology");
    const calibrationMarkdown = renderWarpYorkCanonicalCalibrationMarkdown(calibrationArtifact);
    const ablationMarkdown = renderNhm2YorkAblationPanelMarkdown(ablationArtifact);
    const ablationMemo = renderNhm2AblationDecisionMemo(ablationArtifact);
    const memo = renderNhm2RenderCalibrationDecisionMemo({
      canonicalCalibrationArtifact: calibrationArtifact,
      ablationPanelArtifact: ablationArtifact,
      fixedScaleComparisonArtifact: fixedScaleArtifact,
    });
    expect(calibrationMarkdown).toContain("flat_space_zero_theta");
    expect(calibrationMarkdown).toContain("canonical_controls_validated_nhm2_natario_like");
    expect(ablationMarkdown).toContain("source_shaping_dominates_current_morphology");
    expect(ablationMemo).toContain("implementedAblations");
    expect(memo).toContain("primary comparator: canonical controls");
    expect(memo).toContain("NHM2 solve/coupling or source design");
  });

  it("derives deterministic NHM2 ablation specs from the baseline metric ref", () => {
    const baselineRef = buildControlMetricVolumeRef({
      baseUrl: "http://127.0.0.1:5050",
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      dutyFR: 0.0015,
      q: 3,
      gammaGeo: 26,
      gammaVdB: 500,
      zeta: 0.84,
      phase01: 0,
      requireCongruentSolve: true,
      requireNhm2CongruentFullSolve: true,
    });
    const specs = buildNhm2AblationSpecs({
      baseUrl: "http://127.0.0.1:5050",
      baselineMetricVolumeRef: baselineRef,
    });
    expect(specs.filter((entry) => entry.status === "available")).toHaveLength(3);
    expect(specs.find((entry) => entry.ablation_id === "nhm2_without_hull_coupling")).toEqual(
      expect.objectContaining({
        status: "available",
        selectors: expect.objectContaining({
          metricT00Ref: "warp.metric.T00.natario.shift",
          warpFieldType: "natario",
          dutyFR: 0.0015,
          q: 3,
          gammaGeo: 26,
          gammaVdB: 500,
          zeta: 0.84,
        }),
      }),
    );
    expect(specs.find((entry) => entry.ablation_id === "nhm2_without_casimir_drive")).toEqual(
      expect.objectContaining({
        status: "available",
        selectors: expect.objectContaining({
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          q: 1e-6,
        }),
      }),
    );
    expect(specs.find((entry) => entry.ablation_id === "nhm2_support_mask_off")).toEqual(
      expect.objectContaining({
        status: "unavailable",
        reason: expect.stringContaining("display overlays"),
      }),
    );
  });

  it("classifies ablation movement and sweep morphology deterministically", () => {
    const ablationMovement = classifyAblationMovement({
      ablationId: "nhm2_simplified_source",
      baselineDistances: { natario: 0.08, alcubierre: 0.24, flat: 0.31 },
      ablationDistances: { natario: 0.1, alcubierre: 0.11, flat: 0.35 },
      baselinePrimaryPixelRms: { natario: 0.003, alcubierre: 0.009, flat: 0.01 },
      ablationPrimaryPixelRms: { natario: 0.004, alcubierre: 0.004, flat: 0.012 },
      baselineSignedLobeSummary: "mixed_or_flat",
      ablationSignedLobeSummary: "fore+/aft-",
      baselineSignCounts: { positive: 8, negative: 8 },
      ablationSignCounts: { positive: 12, negative: 12 },
    });
    expect(ablationMovement.movementClass).toBe("toward_alcubierre");
    expect(ablationMovement.raw_control_distance_delta.toward_alcubierre).toBeCloseTo(0.13);
    const plan = buildNhm2ParameterSweepPlan({
      baselineSelectors: {
        metricT00Ref: "warp.metric.T00.natario_sdf.shift",
        metricT00Source: "metric",
        warpFieldType: "natario_sdf",
        sourceRedesignMode: null,
        sourceReformulationMode: null,
        dutyFR: 0.0015,
        q: 3,
        gammaGeo: 26,
        gammaVdB: 500,
        zeta: 0.84,
        phase01: 0,
        requireCongruentSolve: true,
        requireNhm2CongruentFullSolve: true,
      },
    });
    expect(plan.map((entry) => entry.parameter_name)).toEqual([
      "dutyFR",
      "q",
      "gammaGeo",
      "gammaVdB",
      "zeta",
    ]);
    const morphologyClass = classifySweepRunMorphology({
      features: {
        theta_abs_max_raw: 0.05,
        theta_abs_max_display: 0.05,
        positive_count_xz: 8,
        negative_count_xz: 8,
        positive_count_xrho: 8,
        negative_count_xrho: 8,
        support_overlap_pct: 0.75,
        near_zero_theta: true,
        signed_lobe_summary: "mixed_or_flat",
        shell_map_activity: 0.12,
      },
      scoring: {
        distance_to_alcubierre_reference: 0.22,
        distance_to_low_expansion_reference: 0.04,
        reference_margin: 0.18,
        winning_reference: "natario_control",
        margin_sufficient: true,
        winning_reference_within_threshold: true,
        distinct_by_policy: false,
        distinctness_threshold: 0.5,
        margin_min: 0.08,
        reference_match_threshold: 0.5,
        distance_metric: "weighted_normalized_l1",
        normalization_method: "contract-v1",
        to_alcubierre_breakdown: {} as any,
        to_low_expansion_breakdown: {} as any,
      },
      distanceToFlat: 0.12,
    });
    expect(morphologyClass).toBe("natario_like_low_expansion");
    const flatMorphologyClass = classifySweepRunMorphology({
      features: {
        theta_abs_max_raw: 1e-30,
        theta_abs_max_display: 1e-30,
        positive_count_xz: 0,
        negative_count_xz: 0,
        positive_count_xrho: 0,
        negative_count_xrho: 0,
        support_overlap_pct: 0.75,
        near_zero_theta: true,
        signed_lobe_summary: "mixed_or_flat",
        shell_map_activity: 0,
      },
      scoring: {
        distance_to_alcubierre_reference: 0.33,
        distance_to_low_expansion_reference: 0.08,
        reference_margin: 0.25,
        winning_reference: "natario_control",
        margin_sufficient: true,
        winning_reference_within_threshold: true,
        distinct_by_policy: false,
        distinctness_threshold: 0.5,
        margin_min: 0.08,
        reference_match_threshold: 0.5,
        distance_metric: "weighted_normalized_l1",
        normalization_method: "contract-v1",
        to_alcubierre_breakdown: {} as any,
        to_low_expansion_breakdown: {} as any,
      },
      distanceToFlat: 0.01,
    });
    expect(flatMorphologyClass).toBe("flat_or_degenerate");
  });

  it("renders parameter sweep summaries cleanly when no Alcubierre-like run is found", () => {
    const artifact = {
      artifactType: "nhm2_parameter_sweep/v1",
      generatedOn: "2026-03-31",
      generatedAt: "2026-03-31T00:00:00.000Z",
      boundaryStatement: "bounded sweep",
      sourceAuditArtifact: "artifacts/research/full-solve/source.json",
      canonicalCalibrationArtifactPath:
        "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
      ablationArtifactPath:
        "artifacts/research/full-solve/nhm2-york-ablation-panel-latest.json",
      exportDirectory: "artifacts/research/full-solve/rendered-york-parameter-sweep-2026-03-31",
      comparisonContract: {
        laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        thetaDefinition: "theta=-trK",
        signConvention: "ADM",
        fixedScalePolicy: "comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling",
        visualMetricSourceStage: "pre_png_color_buffer",
        outputSize: { width: 96, height: 64 },
        requiredViews: [
          "york-surface-3p1",
          "york-surface-rho-3p1",
          "york-topology-normalized-3p1",
        ],
      },
      sweepDimensions: [],
      baselineRunId: "nhm2_sweep_baseline",
      runs: [],
      representativeRunIds: {
        baseline: "nhm2_sweep_baseline",
        best_natario_like: "nhm2_sweep_baseline",
        best_alcubierre_like: null,
        boundary_like: null,
        degenerate_example: null,
      },
      parameterSensitivityRanking: [],
      sweepVerdict: "alcubierre_like_not_found",
      bestRunClass: "natario_like_low_expansion",
      alcubierreLikeReachable: "no",
      dominantMorphologyDrivers: ["gammaGeo", "q"],
      recommendedNextAction: "redesign",
      notes: ["visual_metric_source_stage=pre_png_color_buffer"],
    } as any;
    const markdown = renderNhm2ParameterSweepMarkdown(artifact);
    const memo = renderNhm2ParameterSweepDecisionMemo(artifact);
    expect(markdown).toContain("alcubierre_like_not_found");
    expect(markdown).toContain("pre_png_color_buffer");
    expect(memo).toContain("alcubierreLikeReachable");
    expect(memo).toContain("not more screenshot debugging");
  });

  it("renders the source-to-York bridge as legacy advisory rather than a live mechanism gate", () => {
    const sourceToYork = makeSourceToYorkFixture() as any;
    const markdown = renderNhm2SourceToYorkProvenanceMarkdown(sourceToYork);
    expect(sourceToYork.bridgeReadiness.gatingStatus).toBe("legacy_advisory_non_gating");
    expect(sourceToYork.bridgeReadiness.gatingBlocksMechanismChain).toBe(false);
    expect(markdown).toContain("gatingBlocksMechanismChain | false");
    expect(markdown).toContain("bridgeClosurePolicy | close_with_current_serialization");
    expect(markdown).toContain("Legacy Bridge Gaps");

    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.sourceToYorkBridge = {
      readiness: sourceToYork.bridgeReadiness,
      artifactPath: "artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-source-to-york-provenance-latest.md",
    };
    payload.solveAuthorityAudit = {
      readiness: {
        sourceAuthorityClosed: true,
        timingAuthorityClosed: true,
        brickAuthorityClosed: true,
        snapshotAuthorityClosed: true,
        diagnosticAuthorityClosed: true,
        yorkClassificationReady: true,
        mechanismChainReady: true,
        mechanismClaimBlockReasons: [],
      },
      artifactPath: "artifacts/research/full-solve/nhm2-solve-authority-audit-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-solve-authority-audit-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);
    expect(proofPackMarkdown).toContain("legacy_advisory_non_gating");
    expect(proofPackMarkdown).toContain("bridgeClosurePolicy | close_with_current_serialization");
    expect(proofPackMarkdown).toContain("mechanismChainReady");
  });

  it("flags near-empty OptiX presentation images before they are treated as usable renders", () => {
    const findings = evaluateYorkOptixPresentationImageQuality({
      width: 320,
      height: 180,
      fileSizeBytes: 1100,
      meanIntensity: 0.995,
      nonBackgroundPixelFraction: 0.002,
      contrastStdDev: 0.01,
    });
    expect(findings).toContain("presentation_image_tiny_file");
    expect(findings).toContain("presentation_image_low_non_background_fraction");
    expect(findings).toContain("presentation_image_low_contrast");
    expect(findings).toContain("presentation_image_near_uniform");
  });

  it("builds OptiX presentation payloads with scientific-lane requirements and fixed output size", () => {
    const payload = buildYorkOptixPresentationPayload({
      caseId: "nhm2_certified",
      renderView: "transport-3p1",
      diagnosticLaneId: "lane_a_eulerian_comoving_theta_minus_trk",
      metricVolumeRef: {
        kind: "gr-evolve-brick",
        url: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?metricT00Ref=test",
      } as any,
      requireCongruentNhm2FullSolve: true,
    });
    expect(payload.width).toBe(1280);
    expect(payload.height).toBe(720);
    expect(payload.scienceLane?.requireScientificFrame).toBe(true);
    expect(payload.scienceLane?.requireCanonicalTensorVolume).toBe(true);
    expect(payload.scienceLane?.requireHullSupportChannels).toBe(true);
    expect(payload.scienceLane?.requireOffDiagonalGamma).toBe(true);
    expect(payload.scienceLane?.samplingMode).toBe("trilinear");
    expect(payload.scienceLane?.renderView).toBe("transport-3p1");
  });

  it("renders OptiX presentation artifacts and summary text as a secondary layer", () => {
    const artifact = {
      artifactType: "nhm2_york_optix_render/v1",
      generatedOn: "2026-03-31",
      generatedAt: "2026-03-31T00:00:00.000Z",
      boundaryStatement: "boundary",
      sourceAuditArtifact: "artifacts/research/full-solve/source.json",
      solveAuthorityAuditPath: "artifacts/research/full-solve/solve.json",
      fixedScaleArtifactPath: "artifacts/research/full-solve/fixed.json",
      canonicalCalibrationArtifactPath:
        "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
      exportDirectory:
        "artifacts/research/full-solve/rendered-york-optix-panel-2026-03-31",
      comparisonContract: {
        laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        thetaDefinition: "theta=-trK",
        signConvention: "ADM",
        fixedScalePolicy: "comparison_fixed_raw_global",
        visualMetricSourceStage: "pre_png_color_buffer",
        outputSize: { width: 320, height: 180 },
        requiredViews: [
          "york-surface-3p1",
          "york-surface-rho-3p1",
          "york-topology-normalized-3p1",
        ],
      },
      diagnosticLayer: {
        authoritativeLaneId: "lane_a_eulerian_comoving_theta_minus_trk",
        fixedScaleArtifactPath: "artifacts/research/full-solve/nhm2-york-fixed-scale-comparison-latest.json",
        canonicalCalibrationArtifactPath:
          "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
        visualMetricSourceStage: "pre_png_color_buffer",
        note: "Lane A slices remain authoritative.",
      },
      presentationLayer: {
        rendererEntrypoint: "http://127.0.0.1:6062/api/helix/hull-render/frame",
        fallbackEntrypoint: "http://127.0.0.1:5050/api/helix/hull-render/frame",
        outputSize: { width: 1280, height: 720 },
        contextViews: [
          {
            renderView: "transport-3p1",
            caption: "main",
            role: "main_volumetric",
          },
          {
            renderView: "full-atlas",
            caption: "atlas",
            role: "context_atlas",
          },
        ],
        presentationFields: [
          {
            presentationFieldId: "longitudinal_signed_strain",
            label: "Longitudinal signed strain",
            formula: "K_xx",
            nature: "signed",
            primaryContextView: "transport-3p1",
            description: "Ship-axis longitudinal strain.",
          },
          {
            presentationFieldId: "tracefree_magnitude",
            label: "Tracefree magnitude",
            formula: "A_ij A^ij",
            nature: "magnitude",
            primaryContextView: "transport-3p1",
            description: "Tracefree magnitude.",
          },
        ],
        usePolicy:
          "Use Lane A slices for formal comparisons. Use OptiX renders as secondary presentation only.",
      },
      caseRenders: [
        {
          case_id: "nhm2_certified",
          label: "NHM2 certified snapshot",
          case_role: "nhm2_current",
          metricBinding: {
            metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?metricT00Ref=nhm2",
            metricRefHash: "metric-ref",
            metricVolumeHash: "metric-volume-hash",
            laneAFieldHash: "lane-a-field-hash",
            thetaChannelHash: "theta-hash",
            kTraceChannelHash: "ktrace-hash",
            longitudinalSignedStrainHash: "kxx-hash",
            tracefreeMagnitudeHash: "aijaij-hash",
            energyDensityHash: "rho-hash",
            laneASliceHash: "lane-a-slice-hash",
          },
          contextRenders: [
            {
              renderView: "transport-3p1",
              caption: "main",
              presentationRenderMode: "optix_scientific_transport_3p1",
              baseImagePolicy: "native_renderer_output",
              baseImageSource: "native_renderer",
              inheritsTransportContext: false,
              contextCompositionMode: "none",
              endpoint: "http://127.0.0.1:6062/api/helix/hull-render/frame",
              requestId: "req-main",
              presentationRenderRequestHash: "req-hash",
              presentationRenderImageHash: "img-hash",
              presentationRenderBackedByAuthoritativeMetric: true,
              scientificTier: "research-grade",
              backend: "optix",
              rendererSource: "optix/cuda.research.pass2",
              laneId: "lane_a_eulerian_comoving_theta_minus_trk",
              certificateHash: "cert-hash",
              frameHash: "frame-hash",
              imagePath:
                "artifacts/research/full-solve/rendered-york-optix-panel-2026-03-31/nhm2_certified-york-optix-3p1-main.png",
              imageMime: "image/png",
              dimensions: { width: 1280, height: 720 },
              fileSizeBytes: 180000,
              meanIntensity: 0.41,
              nonBackgroundPixelFraction: 0.32,
              contrastStdDev: 0.18,
              warnings: [],
              attachments: ["depth-linear-m-f32le", "shell-mask-u8"],
              atlasPaneStatus: null,
              note: "bound",
              ok: true,
              error: null,
            },
          ],
          fieldRenders: [
            {
              presentationFieldId: "longitudinal_signed_strain",
              label: "Longitudinal signed strain",
              formula: "K_xx",
              fieldNature: "signed",
              variant: "main",
              contextRenderView: "transport-3p1",
              baseImagePolicy: "neutral_field_canvas",
              baseImageSource: "none",
              inheritsTransportContext: false,
              contextCompositionMode: "none",
              authoritativeSource: "snapshot.channel.K_xx",
              presentationFieldSelector: "longitudinal_signed_strain:snapshot.channel.K_xx",
              presentationFieldSelectorHash: "selector-hash",
              presentationRenderMode: "solve_backed_optix_neutral_field_projection",
              presentationFieldHash: "kxx-hash",
              presentationScalarFieldHash: "kxx-hash",
              metricVolumeHash: "metric-volume-hash",
              thetaHash: "theta-hash",
              kTraceHash: "ktrace-hash",
              laneAFieldHash: "lane-a-field-hash",
              optixContextImageHash: null,
              presentationRenderRequestHash: "req-hash-field",
              presentationRenderImageHash: "img-hash-field",
              presentationProjectionRequestHash: "req-hash-field",
              presentationProjectionImageHash: "img-hash-field",
              presentationRenderBackedByAuthoritativeMetric: true,
              imagePath:
                "artifacts/research/full-solve/rendered-york-optix-panel-2026-03-31/nhm2_certified-longitudinal_signed_strain-optix-3p1-main.png",
              imageMime: "image/png",
              laneId: "lane_a_eulerian_comoving_theta_minus_trk",
              dimensions: { width: 1280, height: 720 },
              fileSizeBytes: 181000,
              meanIntensity: 0.38,
              nonBackgroundPixelFraction: 0.29,
              contrastStdDev: 0.22,
              warnings: [],
              fieldMin: -0.3,
              fieldMax: 0.31,
              fieldAbsMax: 0.31,
              displayPolicyId: "optix_longitudinal_signed_strain_signed_asinh",
              displayRangeMin: -0.22,
              displayRangeMax: 0.22,
              displayTransform: "signed_asinh",
              colormapFamily: "diverging_cyan_amber",
              note: "derived",
              ok: true,
              error: null,
            },
          ],
        },
      ],
      presentationRenderLayerStatus: "available",
      fieldSuiteRealizationStatus: "realized",
      fieldSuiteReadabilityStatus: "readable",
      optixScientificRenderAvailable: true,
      presentationRenderQuality: "ok",
      presentationRenderQualityReasons: [],
      presentationReadinessVerdict: "ready_for_human_inspection",
      presentationRenderBackedByAuthoritativeMetric: true,
      blockingFindings: [],
      advisoryFindings: [],
      notes: ["authoritative_lane=lane_a_eulerian_comoving_theta_minus_trk"],
      checksum: "checksum",
    } as any;
    const markdown = renderNhm2YorkOptixRenderMarkdown(artifact);
    const memo = renderNhm2YorkOptixRenderMemo(artifact);
    const summary = formatYorkOptixRenderProofPackSummary({ artifact });
    expect(markdown).toContain("Per-Case Presentation Trace");
    expect(markdown).toContain("Natario-Congruent Presentation Fields");
    expect(markdown).toContain("longitudinal_signed_strain");
    expect(markdown).toContain("metric-volume-hash");
    expect(markdown).toContain("optix_longitudinal_signed_strain_signed_asinh");
    expect(markdown).toContain("Lane A slices + fixed-scale + pre-PNG metrics");
    expect(markdown).toContain("neutral_field_canvas");
    expect(markdown).toContain("| advisoryFindings | none |");
    expect(memo).toContain("secondary to the fixed-scale diagnostic artifact");
    expect(memo).toContain("neutral dedicated field canvas");
    expect(memo).toContain("longitudinal signed strain");
    expect(memo).toContain("presentationRenderQuality: `ok`");
    expect(memo).toContain("advisoryFindings: none");
    expect(summary).toContain("presentation_render_layer_status=available");
    expect(summary).toContain("field_suite_realization_status=realized");
    expect(summary).toContain("field_suite_readability_status=readable");
    expect(summary).toContain("presentation_readiness_verdict=ready_for_human_inspection");
    expect(summary).toContain("presentation_render_backed_by_authoritative_metric=true");
  });

  it("renders presentation layer status separately from the diagnostic layer in the proof-pack markdown", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.presentationRenderSummary = {
      presentationRenderLayerStatus: "available",
      fieldSuiteRealizationStatus: "realized",
      fieldSuiteReadabilityStatus: "readable",
      optixScientificRenderAvailable: true,
      presentationRenderQuality: "ok",
      presentationRenderQualityReasons: [],
      presentationReadinessVerdict: "ready_for_human_inspection",
      presentationRenderBackedByAuthoritativeMetric: true,
      artifactPath: "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);
    expect(proofPackMarkdown).toContain("## Presentation Render Layer");
    expect(proofPackMarkdown).toContain("presentationRenderLayerStatus");
    expect(proofPackMarkdown).toContain("fieldSuiteRealizationStatus");
    expect(proofPackMarkdown).toContain("nhm2-york-optix-render-latest.json");
    expect(proofPackMarkdown).toContain("## Solve-Authority Audit");
  });

  it("renders the shift-geometry artifact markdown with explicit proof-vs-interpretive separation", async () => {
    const fixtures = await makeCanonicalVisualComparisonFixtures();
    const markdown = renderNhm2ShiftGeometryVisualizationMarkdown(
      fixtures.shiftGeometryArtifact,
    );
    expect(markdown).toContain("# NHM2 Shift Geometry Visualization");
    expect(markdown).toContain("diagnostic_lane_a remains the proof surface");
    expect(markdown).toContain("shift geometry remains secondary and interpretive");
    expect(markdown).toContain("transport-context inheritance stays off for scientific shift field frames");
    expect(markdown).toContain("beta_direction_xz");
    expect(markdown).toContain("nhm2_minus_natario_beta_residual");
  });

  it("renders shift-geometry status separately from the authoritative diagnostic layer in proof-pack markdown", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.shiftGeometrySummary = {
      shiftGeometryStatus: "available",
      mandatoryFirstPassFields: ["beta_magnitude", "beta_x", "beta_direction_xz"],
      mandatoryResidualComparisons: [
        "nhm2_minus_natario",
        "nhm2_minus_alcubierre",
      ],
      directionOverlayStatus: "available",
      directionOverlayCaseDistinctness: "distinct_across_cases",
      directionOverlayInterpretationPolicy:
        "normalize_non_material_internal_variance_after_sampled_field_match",
      directionOverlayWarnings: [],
      constraintContextStatus: "deferred_units_and_policy_unresolved",
      artifactPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);
    expect(proofPackMarkdown).toContain("## Shift Geometry Visualization");
    expect(proofPackMarkdown).toContain("beta_magnitude,beta_x,beta_direction_xz");
    expect(proofPackMarkdown).toContain("directionOverlayStatus");
    expect(proofPackMarkdown).toContain("directionOverlayCaseDistinctness");
    expect(proofPackMarkdown).toContain("directionOverlayInterpretationPolicy");
    expect(proofPackMarkdown).toContain("nhm2-shift-geometry-visualization-latest.json");
    expect(proofPackMarkdown).toContain("## Presentation Render Layer");
    expect(proofPackMarkdown).toContain("## Final Canonical Visual Comparison");
  });

  it("renders curvature-invariant publication status separately from Lane A proof surfaces", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.curvatureInvariantSummary = {
      artifactType: "nhm2_curvature_invariant_visualization/v1",
      suiteStatus: "available",
      surfacedFields: ["kretschmann", "ricci4", "ricci2", "weylI"],
      slicePlanes: ["x-z-midplane"],
      invariantCrosscheckStatus: "unpopulated",
      momentumDensityStatus: "deferred_not_yet_first_class",
      artifactPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);
    expect(proofPackMarkdown).toContain("## Curvature Invariant Visualization");
    expect(proofPackMarkdown).toContain(
      "| artifactType | nhm2_curvature_invariant_visualization/v1 |",
    );
    expect(proofPackMarkdown).toContain("| invariantCrosscheckStatus | unpopulated |");
    expect(proofPackMarkdown).toContain(
      "| momentumDensityStatus | deferred_not_yet_first_class |",
    );
    expect(proofPackMarkdown).toContain(
      "nhm2-curvature-invariant-visualization-latest.json",
    );
    expect(proofPackMarkdown).toContain("## Presentation Render Layer");
  });

  it("builds a refreshed latest proof-pack payload for invariant publication without populating invariant_crosscheck", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const existingProofPackPayload = makeProofPackPayloadForMarkdown() as any;
    existingProofPackPayload.notes = [
      "presentation_render_layer_status=stale",
      "shift_geometry_status=stale",
      "curvature_invariant_suite_status=stale",
      "render_taxonomy authoritative=stale presentation=stale comparison=stale",
      "keep-me",
    ];
    const { payload } = buildWarpYorkControlFamilyPublishedLatestPayload({
      existingProofPackPayload,
      yorkOptixRenderArtifact: fixtures.optixRenderArtifact,
      shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
      curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
      canonicalVisualComparisonArtifact: fixtures.canonicalVisualComparisonArtifact,
      renderTaxonomyArtifact: fixtures.renderTaxonomyArtifact,
      yorkOptixRenderLatestJsonPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      yorkOptixRenderLatestMdPath:
        "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
      shiftGeometryVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      shiftGeometryVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
      curvatureInvariantVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      curvatureInvariantVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
      renderTaxonomyLatestJsonPath:
        "artifacts/research/full-solve/render-taxonomy-latest.json",
      renderTaxonomyLatestMdPath:
        "docs/audits/research/warp-render-taxonomy-latest.md",
      renderTaxonomyStandardMemoPath:
        "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      yorkCanonicalVisualComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      yorkCanonicalVisualComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      yorkCanonicalVisualComparisonDecisionMemoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
    });

    expect(payload.curvatureInvariantSummary).toMatchObject({
      artifactType: "nhm2_curvature_invariant_visualization/v1",
      suiteStatus: "available",
      invariantCrosscheckStatus: "unpopulated",
      momentumDensityStatus: "deferred_not_yet_first_class",
      artifactPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
    });
    expect(payload.curvatureInvariantSummary?.surfacedFields).toEqual([
      "kretschmann",
      "ricci4",
      "ricci2",
      "weylI",
    ]);
    expect(payload.renderTaxonomySummary).toMatchObject({
      artifactPath: "artifacts/research/full-solve/render-taxonomy-latest.json",
      reportPath: "docs/audits/research/warp-render-taxonomy-latest.md",
      standardPath: "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      authoritativeRenderCategory: "diagnostic_lane_a",
      presentationRenderCategory: "scientific_3p1_field",
    });
    expect(
      payload.notes.filter((note) => note.startsWith("presentation_render_layer_status=")),
    ).toHaveLength(1);
    expect(
      payload.notes.filter((note) => note.startsWith("shift_geometry_status=")),
    ).toHaveLength(1);
    expect(
      payload.notes.filter((note) => note.startsWith("curvature_invariant_suite_status=")),
    ).toHaveLength(1);
    expect(
      payload.notes.filter((note) => note.startsWith("render_taxonomy authoritative=")),
    ).toHaveLength(1);
    expect(payload.notes).toContain("keep-me");
  });

  it("folds the bounded route-time worldline summary into the refreshed proof-pack latest payload", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const existingProofPackPayload = makeProofPackPayloadForMarkdown() as any;
    const routeTimeArtifact = buildNhm2RouteTimeWorldlineArtifact({
      generatedOn: "2026-04-02",
      routeTimeWorldline: makeWarpRouteTimeWorldlineContract(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
    });

    const { payload } = buildWarpYorkControlFamilyPublishedLatestPayload({
      existingProofPackPayload,
      yorkOptixRenderArtifact: fixtures.optixRenderArtifact,
      shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
      curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
      canonicalVisualComparisonArtifact: fixtures.canonicalVisualComparisonArtifact,
      renderTaxonomyArtifact: fixtures.renderTaxonomyArtifact,
      yorkOptixRenderLatestJsonPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      yorkOptixRenderLatestMdPath:
        "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
      shiftGeometryVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      shiftGeometryVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
      curvatureInvariantVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      curvatureInvariantVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
      renderTaxonomyLatestJsonPath:
        "artifacts/research/full-solve/render-taxonomy-latest.json",
      renderTaxonomyLatestMdPath:
        "docs/audits/research/warp-render-taxonomy-latest.md",
      renderTaxonomyStandardMemoPath:
        "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      yorkCanonicalVisualComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      yorkCanonicalVisualComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      yorkCanonicalVisualComparisonDecisionMemoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
      routeTimeWorldlineArtifact: routeTimeArtifact,
      routeTimeWorldlineLatestJsonPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
      routeTimeWorldlineLatestMdPath:
        "docs/audits/research/warp-nhm2-route-time-worldline-latest.md",
    });

    expect(payload.routeTimeWorldlineSummary).toMatchObject({
      artifactType: "nhm2_route_time_worldline/v1",
      routeTimeWorldlineStatus: "bounded_route_time_ready",
      routeModelId: "nhm2_bounded_local_probe_lambda",
      routeParameterName: "lambda",
      progressionSampleCount: 5,
      routeTimeStatus: "bounded_local_segment_certified",
      artifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-route-time-worldline-latest.md",
    });
    expect(
      payload.notes.some((note) => note.startsWith("route_time_worldline_status=")),
    ).toBe(true);
  });

  it("builds a final canonical comparison artifact with canonical cases and both layers", async () => {
    const fixtures = await makeCanonicalVisualComparisonFixtures();
    const exportDir = path.join(fixtures.tempDir, "final-panel");
    const artifact = await buildNhm2CanonicalVisualComparisonArtifact({
      generatedOn: "2026-03-31",
      sourceAuditArtifactPath: "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      canonicalCalibrationArtifactPath:
        "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
      fixedScaleArtifactPath:
        "artifacts/research/full-solve/nhm2-york-fixed-scale-comparison-latest.json",
      optixRenderArtifactPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      canonicalCalibrationArtifact: fixtures.canonicalCalibrationArtifact,
      fixedScaleComparisonArtifact: fixtures.fixedScaleComparisonArtifact,
      optixRenderArtifact: fixtures.optixRenderArtifact,
      exportDirectory: exportDir,
    });
    expect(artifact.canonicalCases.map((entry) => entry.case_id)).toEqual([
      "flat_space_zero_theta",
      "natario_control",
      "alcubierre_control",
      "nhm2_certified",
    ]);
    expect(artifact.finalComparisonVerdict).toBe(
      "canonical_controls_validated_nhm2_natario_like",
    );
    expect(artifact.presentationVerdict).toBe(
      "presentation_layer_ready_and_consistent",
    );
    expect(artifact.nhm2ClosestCanonicalFamily).toBe("natario_like_low_expansion");
    expect(artifact.canonicalCases.every((entry) => entry.diagnosticLayer.authoritative)).toBe(
      true,
    );
    expect(artifact.canonicalCases.every((entry) => entry.presentationLayer.secondary)).toBe(
      true,
    );
    expect(fs.existsSync(path.join(exportDir, "nhm2-canonical-comparison-overview.png"))).toBe(
      true,
    );
    const nhm2Case = artifact.canonicalCases.find(
      (entry) => entry.case_id === "nhm2_certified",
    );
    expect(nhm2Case?.diagnosticLayer.pairwiseComparisons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ other_case_id: "natario_control", pixel_rms: 0.0003 }),
        expect.objectContaining({
          other_case_id: "alcubierre_control",
          pixel_rms: 0.0007,
        }),
      ]),
    );
  });

  it("threads a bounded mission-time estimator summary into the main proof-pack latest payload", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const routeTime = makeWarpRouteTimeWorldlineFixture();
    const missionEstimator = buildNhm2MissionTimeEstimatorArtifact({
      generatedOn: "2026-04-02",
      missionTimeEstimator: makeWarpMissionTimeEstimatorFixture({
        routeTime,
      }),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
      sourceRouteTimeArtifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
    });
    const { payload } = buildWarpYorkControlFamilyPublishedLatestPayload({
      existingProofPackPayload: makeProofPackPayloadForMarkdown() as any,
      yorkOptixRenderArtifact: fixtures.optixRenderArtifact,
      shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
      curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
      canonicalVisualComparisonArtifact: fixtures.canonicalVisualComparisonArtifact,
      renderTaxonomyArtifact: fixtures.renderTaxonomyArtifact,
      yorkOptixRenderLatestJsonPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      yorkOptixRenderLatestMdPath:
        "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
      shiftGeometryVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      shiftGeometryVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
      curvatureInvariantVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      curvatureInvariantVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
      renderTaxonomyLatestJsonPath:
        "artifacts/research/full-solve/render-taxonomy-latest.json",
      renderTaxonomyLatestMdPath:
        "docs/audits/research/warp-render-taxonomy-latest.md",
      renderTaxonomyStandardMemoPath:
        "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      yorkCanonicalVisualComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      yorkCanonicalVisualComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      yorkCanonicalVisualComparisonDecisionMemoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
      missionTimeEstimatorArtifact: missionEstimator,
      missionTimeEstimatorLatestJsonPath:
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
      missionTimeEstimatorLatestMdPath:
        "docs/audits/research/warp-nhm2-mission-time-estimator-latest.md",
    });

    expect(payload.missionTimeEstimatorSummary).toMatchObject({
      artifactType: "nhm2_mission_time_estimator/v1",
      missionTimeEstimatorStatus: "bounded_target_coupled_estimate_ready",
      estimatorModelId: "nhm2_repeated_local_probe_segment_estimator",
      targetId: "alpha-cen-a",
      targetName: "Alpha Centauri A",
      targetFrame: "heliocentric-icrs",
      routeTimeStatus: "bounded_local_segment_certified",
      artifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-mission-time-estimator-latest.md",
    });
    expect(
      payload.notes.some((note) => note.startsWith("mission_time_estimator_status=")),
    ).toBe(true);
  });

  it("threads a bounded mission-time comparison summary into the main proof-pack latest payload", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const missionTimeComparison = buildNhm2MissionTimeComparisonArtifact({
      generatedOn: "2026-04-02",
      missionTimeComparison: makeWarpMissionTimeComparisonFixture(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
      sourceRouteTimeArtifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
      sourceMissionTimeEstimatorArtifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
    });
    const { payload } = buildWarpYorkControlFamilyPublishedLatestPayload({
      existingProofPackPayload: makeProofPackPayloadForMarkdown() as any,
      yorkOptixRenderArtifact: fixtures.optixRenderArtifact,
      shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
      curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
      canonicalVisualComparisonArtifact: fixtures.canonicalVisualComparisonArtifact,
      renderTaxonomyArtifact: fixtures.renderTaxonomyArtifact,
      yorkOptixRenderLatestJsonPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      yorkOptixRenderLatestMdPath:
        "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
      shiftGeometryVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      shiftGeometryVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
      curvatureInvariantVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      curvatureInvariantVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
      renderTaxonomyLatestJsonPath:
        "artifacts/research/full-solve/render-taxonomy-latest.json",
      renderTaxonomyLatestMdPath:
        "docs/audits/research/warp-render-taxonomy-latest.md",
      renderTaxonomyStandardMemoPath:
        "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      yorkCanonicalVisualComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      yorkCanonicalVisualComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      yorkCanonicalVisualComparisonDecisionMemoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
      missionTimeComparisonArtifact: missionTimeComparison,
      missionTimeComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json",
      missionTimeComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-mission-time-comparison-latest.md",
    });

    expect(payload.missionTimeComparisonSummary).toMatchObject({
      artifactType: "nhm2_mission_time_comparison/v1",
      missionTimeComparisonStatus: "bounded_target_coupled_comparison_ready",
      comparisonModelId: "nhm2_classical_no_time_dilation_reference",
      targetId: "alpha-cen-a",
      targetName: "Alpha Centauri A",
      targetFrame: "heliocentric-icrs",
      comparisonInterpretationStatus:
        "bounded_relativistic_differential_detected",
      artifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-mission-time-comparison-latest.md",
    });
    expect(
      payload.notes.some((note) => note.startsWith("mission_time_comparison_status=")),
    ).toBe(true);
  });

  it("renders a bounded mission-time comparison artifact and markdown without promoting speed claims", () => {
    const artifact = buildNhm2MissionTimeComparisonArtifact({
      generatedOn: "2026-04-02",
      missionTimeComparison: makeWarpMissionTimeComparisonFixture(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
      sourceRouteTimeArtifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
      sourceMissionTimeEstimatorArtifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
    });
    const markdown = renderNhm2MissionTimeComparisonMarkdown(artifact);

    expect(artifact.comparisonMetrics.interpretationStatus).toBe(
      "bounded_relativistic_differential_detected",
    );
    expect(markdown).toContain("nhm2_classical_no_time_dilation_reference");
    expect(markdown).toContain("properMinusCoordinate_seconds");
    expect(markdown).toContain("not max-speed certified");
  });

  it("renders final canonical comparison markdown and memo with explicit layer separation", async () => {
    const fixtures = await makeCanonicalVisualComparisonFixtures();
    const artifact = await buildNhm2CanonicalVisualComparisonArtifact({
      generatedOn: "2026-03-31",
      sourceAuditArtifactPath: "proof-pack.json",
      canonicalCalibrationArtifactPath: "calibration.json",
      fixedScaleArtifactPath: "fixed-scale.json",
      optixRenderArtifactPath: "optix.json",
      canonicalCalibrationArtifact: fixtures.canonicalCalibrationArtifact,
      fixedScaleComparisonArtifact: fixtures.fixedScaleComparisonArtifact,
      optixRenderArtifact: fixtures.optixRenderArtifact,
      exportDirectory: path.join(fixtures.tempDir, "comparison"),
    });
    const markdown = renderNhm2CanonicalVisualComparisonMarkdown(artifact);
    const memo = renderNhm2CanonicalVisualComparisonDecisionMemo(artifact);
    expect(markdown).toContain("## Basis");
    expect(markdown).toContain("authoritative diagnostic layer | primary");
    expect(markdown).toContain("presentation layer | secondary");
    expect(markdown).toContain("## NHM2 certified snapshot");
    expect(markdown).toContain("### Diagnostic Layer");
    expect(markdown).toContain("### Presentation Layer");
    expect(memo).toContain("finalComparisonVerdict: `canonical_controls_validated_nhm2_natario_like`");
    expect(memo).toContain("presentationRenderLayerStatus: `available`");
    expect(memo).toContain("If presentation and diagnostics disagree, debug presentation first");
  });

  it("renders proof-pack final comparison summary in sync with presentation readiness", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.presentationRenderSummary = {
      presentationRenderLayerStatus: "available",
      fieldSuiteRealizationStatus: "realized",
      fieldSuiteReadabilityStatus: "readable",
      optixScientificRenderAvailable: true,
      presentationRenderQuality: "ok",
      presentationRenderQualityReasons: [],
      presentationReadinessVerdict: "ready_for_human_inspection",
      presentationRenderBackedByAuthoritativeMetric: true,
      artifactPath: "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
    };
    payload.finalCanonicalVisualComparisonSummary = {
      finalComparisonVerdict: "canonical_controls_validated_nhm2_natario_like",
      diagnosticVerdict: "shared_scale_preserves_natario_like_class",
      presentationVerdict: "presentation_layer_ready_and_consistent",
      nhm2ClosestCanonicalFamily: "natario_like_low_expansion",
      alcubierreLikeTransitionObserved: "no",
      artifactPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      memoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
      exportDirectory:
        "artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-03-31",
    };
    const proofPackMarkdown = renderMarkdown(payload);
    expect(proofPackMarkdown).toContain("## Final Canonical Visual Comparison");
    expect(proofPackMarkdown).toContain("presentation_layer_ready_and_consistent");
    expect(proofPackMarkdown).toContain("natario_like_low_expansion");
    expect(proofPackMarkdown).toContain(
      "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
    );
    expect(proofPackMarkdown).toContain("## Presentation Render Layer");
  });

  it("renders a compact worldline summary in the main proof-pack markdown without widening route-time claims", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const worldline = makeWarpWorldlineContract();
    payload.warpWorldlineSummary = {
      artifactType: "nhm2_warp_worldline_proof/v1",
      contractVersion: worldline.contractVersion,
      status: worldline.status,
      certified: worldline.certified,
      sourceSurface: worldline.sourceSurface.surfaceId,
      metricT00Ref: worldline.sourceSurface.metricT00Ref,
      chart: worldline.chart.label,
      observerFamily: worldline.observerFamily,
      validityRegimeId: worldline.validityRegime.regimeId,
      representativeSampleId: worldline.representativeSampleId,
      sampleGeometryFamilyId: worldline.sampleGeometry.familyId,
      sampleCount: worldline.sampleCount,
      dtauDt: {
        representative: worldline.dtau_dt.representative,
        min: worldline.dtau_dt.min,
        max: worldline.dtau_dt.max,
      },
      normalizationResidualMaxAbs: worldline.normalizationResidual.maxAbs,
      transportVariationStatus: worldline.transportVariation.transportVariationStatus,
      transportInformativenessStatus: worldline.transportInformativenessStatus,
      sampleFamilyAdequacy: worldline.sampleFamilyAdequacy,
      flatnessInterpretation: worldline.flatnessInterpretation,
      certifiedTransportMeaning: worldline.certifiedTransportMeaning,
      eligibleNextProducts: [...worldline.eligibleNextProducts],
      routeTimeStatus: "deferred",
      transportInterpretation:
        worldline.transportInterpretation.effectiveTransportInterpretation,
      nonClaims: ["not route-time certified", "not mission-time certified"],
      artifactPath: "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      reportPath: "docs/audits/research/warp-nhm2-warp-worldline-proof-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## Warp Worldline Contract");
    expect(proofPackMarkdown).toContain("routeTimeStatus | deferred");
    expect(proofPackMarkdown).toContain("sampleGeometryFamilyId | nhm2_centerline_shell_cross");
    expect(proofPackMarkdown).toContain(
      "transportVariationStatus | descriptor_and_dtau_varied",
    );
    expect(proofPackMarkdown).toContain("bounded_local_comoving_descriptor_not_speed");
    expect(proofPackMarkdown).toContain("not route-time certified,not mission-time certified");
  });

  it("renders a compact cruise-preflight summary in the main proof-pack markdown without relabeling it as speed", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const preflight = makeWarpCruiseEnvelopePreflightFixture();
    payload.cruisePreflightSummary = {
      artifactType: "nhm2_cruise_envelope_preflight/v1",
      contractVersion: preflight.contractVersion,
      cruisePreflightStatus: preflight.status,
      certified: preflight.certified,
      sourceSurface: preflight.sourceSurface.surfaceId,
      chart: preflight.chart.label,
      observerFamily: preflight.observerFamily,
      validityRegimeId: preflight.validityRegime.regimeId,
      preflightQuantityId: preflight.preflightQuantityId,
      preflightQuantityMeaning: preflight.preflightQuantityMeaning,
      candidateCount: preflight.candidateCount,
      admissibleCount: preflight.admissibleCount,
      rejectedCount: preflight.rejectedCount,
      boundedCruisePreflightBand: {
        min: preflight.boundedCruisePreflightBand.min,
        max: preflight.boundedCruisePreflightBand.max,
        units: "dimensionless",
      },
      sampleFamilyAdequacy: preflight.sampleFamilyAdequacy,
      transportVariationStatus: preflight.transportVariationStatus,
      routeTimeStatus: preflight.routeTimeStatus,
      eligibleNextProducts: [...preflight.eligibleNextProducts],
      nonClaims: [...preflight.nonClaims],
      artifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-cruise-envelope-preflight-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## Cruise Envelope Preflight");
    expect(proofPackMarkdown).toContain(
      "preflightQuantityId | bounded_local_transport_descriptor_norm",
    );
    expect(proofPackMarkdown).toContain("routeTimeStatus | deferred");
    expect(proofPackMarkdown).toContain("eligibleNextProducts | route_time_worldline_extension");
    expect(proofPackMarkdown).toContain("not max-speed certified,not route-time certified");
  });

  it("renders a compact route-time worldline summary in the main proof-pack markdown without producing mission-time claims", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const routeTime = makeWarpRouteTimeWorldlineContract();
    payload.routeTimeWorldlineSummary = {
      artifactType: "nhm2_route_time_worldline/v1",
      contractVersion: routeTime.contractVersion,
      routeTimeWorldlineStatus: routeTime.status,
      certified: routeTime.certified,
      sourceSurface: routeTime.sourceSurface.surfaceId,
      chart: routeTime.chart.label,
      observerFamily: routeTime.observerFamily,
      validityRegimeId: routeTime.validityRegime.regimeId,
      routeModelId: routeTime.routeModelId,
      routeParameterName: routeTime.routeParameterName,
      progressionSampleCount: routeTime.progressionSampleCount,
      coordinateTimeSummary: {
        start: routeTime.coordinateTimeSummary.start,
        end: routeTime.coordinateTimeSummary.end,
        span: routeTime.coordinateTimeSummary.span,
        units: "s",
      },
      properTimeSummary: {
        start: routeTime.properTimeSummary.start,
        end: routeTime.properTimeSummary.end,
        span: routeTime.properTimeSummary.span,
        units: "s",
      },
      sampleFamilyAdequacy: routeTime.sampleFamilyAdequacy,
      transportVariationStatus: routeTime.transportVariationStatus,
      routeTimeStatus: routeTime.routeTimeStatus,
      nextEligibleProducts: [...routeTime.nextEligibleProducts],
      nonClaims: [...routeTime.nonClaims],
      artifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-route-time-worldline-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## Route-Time Worldline");
    expect(proofPackMarkdown).toContain(
      "routeTimeWorldlineStatus | bounded_route_time_ready",
    );
    expect(proofPackMarkdown).toContain(
      "routeModelId | nhm2_bounded_local_probe_lambda",
    );
    expect(proofPackMarkdown).toContain("routeTimeStatus | bounded_local_segment_certified");
    expect(proofPackMarkdown).toContain("nonClaims | not mission-time certified");
  });

  it("renders a compact mission-time estimator summary in the main proof-pack markdown without promoting speed or viability claims", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const estimator = makeWarpMissionTimeEstimatorFixture();
    payload.missionTimeEstimatorSummary = {
      artifactType: "nhm2_mission_time_estimator/v1",
      contractVersion: estimator.contractVersion,
      missionTimeEstimatorStatus: estimator.status,
      certified: estimator.certified,
      sourceSurface: estimator.sourceSurface.surfaceId,
      chart: estimator.chart.label,
      observerFamily: estimator.observerFamily,
      validityRegimeId: estimator.validityRegime.regimeId,
      estimatorModelId: estimator.estimatorModelId,
      targetId: estimator.targetId,
      targetName: estimator.targetName,
      targetFrame: estimator.targetFrame,
      coordinateTimeEstimate: {
        seconds: estimator.coordinateTimeEstimate.seconds,
        years: estimator.coordinateTimeEstimate.years,
        units: { primary: "s", secondary: "yr" },
      },
      properTimeEstimate: {
        seconds: estimator.properTimeEstimate.seconds,
        years: estimator.properTimeEstimate.years,
        units: { primary: "s", secondary: "yr" },
      },
      routeTimeStatus: estimator.routeTimeStatus,
      nextEligibleProducts: [...estimator.nextEligibleProducts],
      nonClaims: [...estimator.nonClaims],
      artifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-mission-time-estimator-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## Mission-Time Estimator");
    expect(proofPackMarkdown).toContain(
      "missionTimeEstimatorStatus | bounded_target_coupled_estimate_ready",
    );
    expect(proofPackMarkdown).toContain(
      "estimatorModelId | nhm2_repeated_local_probe_segment_estimator",
    );
    expect(proofPackMarkdown).toContain("targetId | alpha-cen-a");
    expect(proofPackMarkdown).toContain("nonClaims | not max-speed certified");
  });

  it("renders a compact mission-time comparison summary in the main proof-pack markdown and preserves zero-difference reporting", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const comparison = makeWarpMissionTimeComparisonFixture();
    payload.missionTimeComparisonSummary = {
      artifactType: "nhm2_mission_time_comparison/v1",
      contractVersion: comparison.contractVersion,
      missionTimeComparisonStatus: comparison.status,
      certified: comparison.certified,
      sourceSurface: comparison.sourceSurface.surfaceId,
      chart: comparison.chart.label,
      observerFamily: comparison.observerFamily,
      comparisonModelId: comparison.comparisonModelId,
      targetId: comparison.targetId,
      targetName: comparison.targetName,
      targetFrame: comparison.targetFrame,
      warpCoordinateYears: comparison.warpCoordinateTimeEstimate.years,
      warpProperYears: comparison.warpProperTimeEstimate.years,
      classicalReferenceYears: comparison.classicalReferenceTimeEstimate.years,
      properMinusCoordinateSeconds:
        comparison.comparisonMetrics.properMinusCoordinate_seconds,
      properMinusClassicalSeconds:
        comparison.comparisonMetrics.properMinusClassical_seconds,
      comparisonInterpretationStatus:
        comparison.comparisonMetrics.interpretationStatus,
      comparisonReadiness: comparison.comparisonReadiness,
      deferredComparators: [...comparison.deferredComparators],
      nonClaims: [...comparison.nonClaims],
      artifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-mission-time-comparison-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## Mission-Time Comparison");
    expect(proofPackMarkdown).toContain(
      "missionTimeComparisonStatus | bounded_target_coupled_comparison_ready",
    );
    expect(proofPackMarkdown).toContain(
      "comparisonModelId | nhm2_classical_no_time_dilation_reference",
    );
    expect(proofPackMarkdown).toContain(
      `properMinusCoordinateSeconds | ${comparison.comparisonMetrics.properMinusCoordinate_seconds}`,
    );
    expect(proofPackMarkdown).toContain(
      "comparisonInterpretationStatus | bounded_relativistic_differential_detected",
    );
  });

  it("renders a compact cruise-envelope summary in the main proof-pack markdown without relabeling it as speed", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const cruiseEnvelope = makeWarpCruiseEnvelopeFixture();
    payload.cruiseEnvelopeSummary = {
      artifactType: "nhm2_cruise_envelope/v1",
      contractVersion: cruiseEnvelope.contractVersion,
      cruiseEnvelopeStatus: cruiseEnvelope.status,
      certified: cruiseEnvelope.certified,
      sourceSurface: cruiseEnvelope.sourceSurface.surfaceId,
      chart: cruiseEnvelope.chart.label,
      observerFamily: cruiseEnvelope.observerFamily,
      cruiseEnvelopeModelId: cruiseEnvelope.cruiseEnvelopeModelId,
      envelopeQuantityId: cruiseEnvelope.envelopeQuantityId,
      targetId: cruiseEnvelope.targetId,
      targetName: cruiseEnvelope.targetName,
      admissibleBand: {
        min: cruiseEnvelope.admissibleBand.min,
        max: cruiseEnvelope.admissibleBand.max,
        units: "dimensionless",
      },
      representativeValue: cruiseEnvelope.representativeValue,
      comparisonConsistencyStatus: cruiseEnvelope.comparisonConsistencyStatus,
      routeTimeStatus: cruiseEnvelope.routeTimeStatus,
      missionTimeStatus: cruiseEnvelope.missionTimeStatus,
      nonClaims: [...cruiseEnvelope.nonClaims],
      artifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-cruise-envelope-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## Cruise Envelope");
    expect(proofPackMarkdown).toContain(
      "cruiseEnvelopeStatus | bounded_cruise_envelope_certified",
    );
    expect(proofPackMarkdown).toContain(
      "cruiseEnvelopeModelId | nhm2_route_consistent_descriptor_band",
    );
    expect(proofPackMarkdown).toContain(
      "envelopeQuantityId | bounded_local_transport_descriptor_norm",
    );
    expect(proofPackMarkdown).toContain("comparisonConsistencyStatus |");
    expect(proofPackMarkdown).toContain("not max-speed certified");
  });

  it("renders a compact in-hull proper-acceleration summary in the main proof-pack markdown without relabeling it as curvature gravity", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const inHullProperAcceleration = makeWarpInHullProperAccelerationFixture();
    payload.inHullProperAccelerationSummary = {
      artifactType: "nhm2_in_hull_proper_acceleration/v1",
      contractVersion: inHullProperAcceleration.contractVersion,
      inHullProperAccelerationStatus: inHullProperAcceleration.status,
      certified: inHullProperAcceleration.certified,
      sourceSurface: inHullProperAcceleration.sourceSurface.surfaceId,
      chart: inHullProperAcceleration.chart.label,
      observerFamily: inHullProperAcceleration.observerFamily,
      accelerationQuantityId: inHullProperAcceleration.accelerationQuantityId,
      sampleCount: inHullProperAcceleration.sampleCount,
      representative_mps2: inHullProperAcceleration.profileSummary.representative_mps2,
      representative_g: inHullProperAcceleration.profileSummary.representative_g,
      min_mps2: inHullProperAcceleration.profileSummary.min_mps2,
      max_mps2: inHullProperAcceleration.profileSummary.max_mps2,
      resolutionAdequacy: inHullProperAcceleration.resolutionAdequacy.status,
      fallbackUsed: inHullProperAcceleration.fallbackUsed,
      nonClaims: [...inHullProperAcceleration.nonClaims],
      artifactPath:
        "artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-in-hull-proper-acceleration-latest.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);

    expect(proofPackMarkdown).toContain("## In-Hull Proper Acceleration");
    expect(proofPackMarkdown).toContain(
      "inHullProperAccelerationStatus | bounded_in_hull_profile_certified",
    );
    expect(proofPackMarkdown).toContain(
      "accelerationQuantityId | experienced_proper_acceleration_magnitude",
    );
    expect(proofPackMarkdown).toContain("fallbackUsed | false");
    expect(proofPackMarkdown).toContain("not curvature-gravity certified");
  });

  it("threads a bounded in-hull proper-acceleration summary into the refreshed proof-pack latest payload", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const inHullProperAcceleration = buildNhm2InHullProperAccelerationArtifact({
      generatedOn: "2026-04-02",
      inHullProperAcceleration: makeWarpInHullProperAccelerationFixture(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    });
    const { payload } = buildWarpYorkControlFamilyPublishedLatestPayload({
      existingProofPackPayload: makeProofPackPayloadForMarkdown() as any,
      yorkOptixRenderArtifact: fixtures.optixRenderArtifact,
      shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
      curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
      canonicalVisualComparisonArtifact: fixtures.canonicalVisualComparisonArtifact,
      renderTaxonomyArtifact: fixtures.renderTaxonomyArtifact,
      yorkOptixRenderLatestJsonPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      yorkOptixRenderLatestMdPath:
        "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
      shiftGeometryVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      shiftGeometryVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
      curvatureInvariantVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      curvatureInvariantVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
      renderTaxonomyLatestJsonPath:
        "artifacts/research/full-solve/render-taxonomy-latest.json",
      renderTaxonomyLatestMdPath:
        "docs/audits/research/warp-render-taxonomy-latest.md",
      renderTaxonomyStandardMemoPath:
        "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      yorkCanonicalVisualComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      yorkCanonicalVisualComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      yorkCanonicalVisualComparisonDecisionMemoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
      inHullProperAccelerationArtifact: inHullProperAcceleration,
      inHullProperAccelerationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json",
      inHullProperAccelerationLatestMdPath:
        "docs/audits/research/warp-nhm2-in-hull-proper-acceleration-latest.md",
    });

    expect(payload.inHullProperAccelerationSummary).toMatchObject({
      artifactType: "nhm2_in_hull_proper_acceleration/v1",
      inHullProperAccelerationStatus: "bounded_in_hull_profile_certified",
      accelerationQuantityId: "experienced_proper_acceleration_magnitude",
      sampleCount: 7,
      resolutionAdequacy: "adequate_direct_brick_profile",
      fallbackUsed: false,
      artifactPath:
        "artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json",
      reportPath:
        "docs/audits/research/warp-nhm2-in-hull-proper-acceleration-latest.md",
    });
    expect(
      payload.notes.some((note) => note.startsWith("in_hull_proper_acceleration_status=")),
    ).toBe(true);
  });

  it("renders a bounded in-hull proper-acceleration artifact and markdown with explicit no-fallback semantics", () => {
    const artifact = buildNhm2InHullProperAccelerationArtifact({
      generatedOn: "2026-04-02",
      inHullProperAcceleration: makeWarpInHullProperAccelerationFixture({ zeroProfile: true }),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    });
    const markdown = renderNhm2InHullProperAccelerationMarkdown(artifact);

    expect(artifact.profileSummary.interpretation).toBe(
      "observer_defined_zero_profile_in_constant_lapse_regime",
    );
    expect(artifact.fallbackUsed).toBe(false);
    expect(markdown).toContain("NHM2 In-Hull Proper Acceleration");
    expect(markdown).toContain("experienced_proper_acceleration_magnitude");
    expect(markdown).toContain("fallbackUsed | false");
    expect(markdown).toContain("not a curvature-gravity or comfort/safety certificate");
  });

  it("threads a proof-surface manifest summary into the refreshed proof-pack latest payload", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const proofSurfaceManifest = {
      artifactType: "nhm2_proof_surface_manifest/v1",
      generatedOn: "2026-04-02",
      generatedAt: "2026-04-02T12:00:00.000Z",
      boundaryStatement:
        "This artifact records deterministic publication/provenance for the bounded NHM2 latest proof surfaces. It does not widen any transport, gravity, or viability claim.",
      contractVersion: "warp_proof_surface_manifest/v1",
      status: "bounded_stack_publication_hardened",
      certified: true,
      publicationMode: "bounded_stack_latest_sequential_single_writer",
      proofSurfaceCount: 8,
      proofSurfaces: [],
      proofPackPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      proofPackReportPath:
        "docs/audits/research/warp-york-control-family-proof-pack-latest.md",
      proofPackChecksum: "a".repeat(64),
      trackedRepoEvidenceStatus: "repo_landed_clean_latest_evidence",
      claimBoundary: [
        "publication/provenance manifest only",
        "bounded NHM2 certified latest proof surfaces only",
      ],
      nonClaims: [
        "does not widen transport claims",
        "does not widen gravity claims",
        "does not certify viability",
      ],
      checksum: "b".repeat(64),
    } as any;
    const { payload } = buildWarpYorkControlFamilyPublishedLatestPayload({
      existingProofPackPayload: makeProofPackPayloadForMarkdown() as any,
      yorkOptixRenderArtifact: fixtures.optixRenderArtifact,
      shiftGeometryArtifact: fixtures.shiftGeometryArtifact,
      curvatureInvariantArtifact: fixtures.curvatureInvariantArtifact,
      canonicalVisualComparisonArtifact: fixtures.canonicalVisualComparisonArtifact,
      renderTaxonomyArtifact: fixtures.renderTaxonomyArtifact,
      yorkOptixRenderLatestJsonPath:
        "artifacts/research/full-solve/nhm2-york-optix-render-latest.json",
      yorkOptixRenderLatestMdPath:
        "docs/audits/research/warp-nhm2-york-optix-render-latest.md",
      shiftGeometryVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json",
      shiftGeometryVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md",
      curvatureInvariantVisualizationLatestJsonPath:
        "artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json",
      curvatureInvariantVisualizationLatestMdPath:
        "docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md",
      renderTaxonomyLatestJsonPath:
        "artifacts/research/full-solve/render-taxonomy-latest.json",
      renderTaxonomyLatestMdPath:
        "docs/audits/research/warp-render-taxonomy-latest.md",
      renderTaxonomyStandardMemoPath:
        "docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md",
      yorkCanonicalVisualComparisonLatestJsonPath:
        "artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json",
      yorkCanonicalVisualComparisonLatestMdPath:
        "docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md",
      yorkCanonicalVisualComparisonDecisionMemoPath:
        "docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-03-31.md",
      proofSurfaceManifestArtifact: proofSurfaceManifest,
      proofSurfaceManifestLatestJsonPath:
        "artifacts/research/full-solve/nhm2-proof-surface-manifest-latest.json",
      proofSurfaceManifestLatestMdPath:
        "docs/audits/research/warp-nhm2-proof-surface-manifest-latest.md",
    });

    expect(payload.proofSurfaceManifestSummary).toMatchObject({
      artifactType: "nhm2_proof_surface_manifest/v1",
      contractVersion: "warp_proof_surface_manifest/v1",
      proofSurfaceManifestStatus: "bounded_stack_publication_hardened",
      certified: true,
      publicationMode: "bounded_stack_latest_sequential_single_writer",
      proofSurfaceCount: 8,
      trackedRepoEvidenceStatus: "repo_landed_clean_latest_evidence",
      manifestPath:
        "artifacts/research/full-solve/nhm2-proof-surface-manifest-latest.json",
      manifestReportPath:
        "docs/audits/research/warp-nhm2-proof-surface-manifest-latest.md",
    });
    expect(payload.proofSurfaceManifestSummary?.proofPackChecksum).toBe("a".repeat(64));
    expect(
      payload.notes.some((note) => note.startsWith("proof_surface_manifest_status=")),
    ).toBe(true);

    const markdown = renderMarkdown(payload);
    expect(markdown).toContain("## Proof Surface Manifest");
    expect(markdown).toContain(
      "proofSurfaceManifestStatus | bounded_stack_publication_hardened",
    );
    expect(markdown).toContain("publicationMode | bounded_stack_latest_sequential_single_writer");
    expect(markdown).toContain(
      "trackedRepoEvidenceStatus | repo_landed_clean_latest_evidence",
    );
    expect(markdown).toContain(
      "manifestPath | artifacts/research/full-solve/nhm2-proof-surface-manifest-latest.json",
    );
  });

  it("backfills the authoritative low-expansion gate into published latest payloads from current brick evidence", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.authoritativeLowExpansionGate = undefined;
    payload.notes = payload.notes.filter(
      (note: string) =>
        !note.startsWith("authoritative_low_expansion_gate=") &&
        note !==
          "Projection-derived betaDiagnostics remain visible for comparison, but authoritative Natario-like low-expansion classification is gated only by brick-native div_beta plus theta/K consistency." &&
        note !==
          "Natario-like morphology remains visible, but authoritative low-expansion classification is blocked until the brick-native div_beta gate passes on the same Lane A surface.",
    );
    const refreshed = await refreshProofPackAuthoritativeLowExpansionGate(payload, {
      loadSnapshot: async () =>
        ({
          dims: [2, 2, 1],
          voxelSize_m: [1, 1, 1],
          resolvedUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?metricT00Ref=warp.metric.T00.natario_sdf.shift",
          stats: {
            divBetaRms: 1e-6,
            divBetaMaxAbs: 1e-6,
            divBetaSource: "gr_evolve_brick",
          },
          meta: {},
          channels: {
            theta: { data: new Float32Array([0, 0, 0, 0]) },
            K_trace: { data: new Float32Array([0, 0, 0, 0]) },
            div_beta: { data: new Float32Array([1e-6, -1e-6, 1e-6, -1e-6]) },
          },
          source: "metric",
          chart: "comoving_cartesian",
          metricRefHash: "metric-ref-hash",
        }) as any,
    });

    expect(refreshed.authoritativeLowExpansionGate).toMatchObject({
      sourceCaseId: "nhm2_certified",
      status: "pass",
      source: "gr_evolve_brick",
      authoritative: true,
      divergenceObservable: "div_beta",
      divergenceRms: 1e-6,
      divergenceMaxAbs: 1e-6,
      thetaKConsistencyStatus: "pass",
      projectionDerivedStatus: "advisory_only",
    });
    expect(
      refreshed.cases.find((entry) => entry.caseId === "nhm2_certified")?.snapshotMetrics
        ?.authoritativeLowExpansionGate,
    ).toMatchObject({
      status: "pass",
      source: "gr_evolve_brick",
      divergenceRms: 1e-6,
    });
    expect(
      refreshed.notes.some((note) => note.startsWith("authoritative_low_expansion_gate=pass")),
    ).toBe(true);
    expect(refreshed.notes).toContain(
      "Projection-derived betaDiagnostics remain visible for comparison, but authoritative Natario-like low-expansion classification is gated only by brick-native div_beta plus theta/K consistency.",
    );
    const markdown = renderMarkdown(refreshed);
    expect(markdown).toContain("## Authoritative Low-Expansion Gate");
    expect(markdown).toContain("status | pass");
  });

  it("marks the authoritative low-expansion gate missing when divergence is present but theta/K consistency is unavailable", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.authoritativeLowExpansionGate = undefined;
    const nhm2Case = payload.cases.find((entry: any) => entry.caseId === "nhm2_certified");
    if (nhm2Case?.snapshotMetrics) {
      nhm2Case.snapshotMetrics.thetaPlusKTrace = undefined;
      nhm2Case.snapshotMetrics.authoritativeLowExpansionGate = undefined;
    }
    const refreshed = await refreshProofPackAuthoritativeLowExpansionGate(payload, {
      loadSnapshot: async () =>
        ({
          dims: [2, 2, 1],
          voxelSize_m: [1, 1, 1],
          resolvedUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?metricT00Ref=warp.metric.T00.natario_sdf.shift",
          stats: {
            divBetaRms: 1e-6,
            divBetaMaxAbs: 1e-6,
            divBetaSource: "gr_evolve_brick",
          },
          meta: {},
          channels: {
            div_beta: { data: new Float32Array([1e-6, -1e-6, 1e-6, -1e-6]) },
          },
          source: "metric",
          chart: "comoving_cartesian",
          metricRefHash: "metric-ref-hash",
        }) as any,
    });

    expect(refreshed.authoritativeLowExpansionGate).toMatchObject({
      status: "missing",
      reason: "theta_k_consistency_missing",
      source: "gr_evolve_brick",
      thetaKConsistencyStatus: "unknown",
    });
  });

  it("builds a render taxonomy manifest with category and role metadata on every render", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    expect(fixtures.renderTaxonomyArtifact.renderEntries.length).toBeGreaterThan(0);
    expect(
      fixtures.renderTaxonomyArtifact.renderEntries.every(
        (entry) => entry.renderCategory && entry.renderRole,
      ),
    ).toBe(true);
  });

  it("marks scientific 3+1 field renders with field-specific labeling metadata", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const fieldEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "scientific_3p1_field",
    );
    expect(fieldEntries.length).toBeGreaterThan(0);
    expect(
      fieldEntries.every(
        (entry) =>
          entry.quantitySymbol &&
          entry.laneId === "lane_a_eulerian_comoving_theta_minus_trk" &&
          entry.title.includes(" - "),
      ),
    ).toBe(true);
  });

  it("registers brick-native curvature invariants as first-class taxonomy field families", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    expect(fixtures.renderTaxonomyArtifact.fieldFamilies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldId: "kretschmann",
          defaultCategory: "scientific_3p1_field",
          defaultRole: "presentation",
          defaultDisplayPolicyId: "optix_kretschmann_positive_log10",
        }),
        expect.objectContaining({
          fieldId: "ricci4",
          defaultCategory: "scientific_3p1_field",
          defaultRole: "presentation",
          defaultDisplayPolicyId: "optix_ricci4_signed_asinh",
        }),
        expect.objectContaining({
          fieldId: "ricci2",
          defaultCategory: "scientific_3p1_field",
          defaultRole: "presentation",
          defaultDisplayPolicyId: "optix_ricci2_signed_asinh",
        }),
        expect.objectContaining({
          fieldId: "weylI",
          defaultCategory: "scientific_3p1_field",
          defaultRole: "presentation",
          defaultDisplayPolicyId: "optix_weylI_signed_asinh",
        }),
      ]),
    );
  });

  it("emits NHM2 curvature-invariant renders as secondary scientific fields rather than Lane A proofs", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const invariantEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) =>
        entry.caseId === "nhm2_certified" &&
        ["kretschmann", "ricci4", "ricci2", "weylI"].includes(String(entry.fieldId)),
    );
    expect(invariantEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldId: "kretschmann", variant: "main" }),
        expect.objectContaining({ fieldId: "ricci4", variant: "main" }),
        expect.objectContaining({ fieldId: "ricci2", variant: "main" }),
        expect.objectContaining({ fieldId: "weylI", variant: "main" }),
        expect.objectContaining({ fieldId: "kretschmann", variant: "xz_slice_companion" }),
        expect.objectContaining({ fieldId: "ricci4", variant: "xz_slice_companion" }),
        expect.objectContaining({ fieldId: "ricci2", variant: "xz_slice_companion" }),
        expect.objectContaining({ fieldId: "weylI", variant: "xz_slice_companion" }),
      ]),
    );
    expect(
      invariantEntries.every(
        (entry) =>
          entry.renderCategory === "scientific_3p1_field" &&
          entry.renderRole === "presentation" &&
          entry.authoritativeStatus === "secondary_solve_backed" &&
          entry.baseImageSource !== "transport_context",
      ),
    ).toBe(true);
  });

  it("renders the NHM2 curvature-invariant audit with explicit secondary status and deferred momentum-density scope", async () => {
    const fixtures = await makeCanonicalVisualComparisonFixtures();
    const markdown = renderNhm2CurvatureInvariantVisualizationMarkdown(
      fixtures.curvatureInvariantArtifact,
    );
    expect(markdown).toContain("NHM2 Curvature Invariant Visualization");
    expect(markdown).toContain("invariantCrosscheckStatus | unpopulated");
    expect(markdown).toContain("momentumDensityStatus | deferred_not_yet_first_class");
    expect(markdown).toContain("Rodal");
  });

  it("builds and renders a bounded NHM2 warp-worldline proof artifact without widening mission claims", () => {
    const artifact = buildNhm2WarpWorldlineProofArtifact({
      generatedOn: "2026-04-02",
      warpWorldline: makeWarpWorldlineContract(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
    });
    const markdown = renderNhm2WarpWorldlineProofMarkdown(artifact);

    expect(artifact).toEqual(
      expect.objectContaining({
        artifactType: "nhm2_warp_worldline_proof/v1",
        certified: true,
        sampleCount: 9,
        representativeSampleId: "centerline_center",
        sampleFamilyAdequacy: "adequate_for_bounded_cruise_preflight",
      }),
    );
    expect(artifact.dtauDt.representative).toBeGreaterThan(0);
    expect(artifact.normalizationResidual.maxAbs).toBeLessThanOrEqual(1e-9);
    expect(markdown).toContain("NHM2 Warp Worldline Proof");
    expect(markdown).toContain("not mission-time certified");
    expect(markdown).toContain("nhm2_metric_local_comoving_transport_cross");
    expect(markdown).toContain("sampleGeometryFamilyId | nhm2_centerline_shell_cross");
    expect(markdown).toContain("bounded_local_comoving_descriptor_not_speed");
    expect(markdown).toContain("## Transport Variation");
    expect(markdown).toContain("eligibleNextProducts | bounded_cruise_envelope_preflight");
  });

  it("builds and renders a bounded NHM2 cruise-envelope preflight artifact without widening speed or mission claims", () => {
    const artifact = buildNhm2CruiseEnvelopePreflightArtifact({
      generatedOn: "2026-04-02",
      preflight: makeWarpCruiseEnvelopePreflightFixture(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
    });
    const markdown = renderNhm2CruiseEnvelopePreflightMarkdown(artifact);

    expect(artifact).toEqual(
      expect.objectContaining({
        artifactType: "nhm2_cruise_envelope_preflight/v1",
        certified: true,
        preflightQuantityId: "bounded_local_transport_descriptor_norm",
        candidateCount: 10,
        admissibleCount: 9,
        rejectedCount: 1,
        routeTimeStatus: "deferred",
      }),
    );
    expect(artifact.boundedCruisePreflightBand.max).toBeGreaterThan(
      artifact.boundedCruisePreflightBand.min,
    );
    expect(markdown).toContain("NHM2 Cruise Envelope Preflight");
    expect(markdown).toContain("bounded_local_transport_descriptor_norm");
    expect(markdown).toContain("routeTimeStatus | deferred");
    expect(markdown).toContain("probe_above_certified_support");
    expect(markdown).toContain("not max-speed certified");
  });

  it("builds and renders a bounded NHM2 route-time worldline artifact without widening mission or ETA claims", () => {
    const artifact = buildNhm2RouteTimeWorldlineArtifact({
      generatedOn: "2026-04-02",
      routeTimeWorldline: makeWarpRouteTimeWorldlineContract(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
    });
    const markdown = renderNhm2RouteTimeWorldlineMarkdown(artifact);

    expect(artifact).toEqual(
      expect.objectContaining({
        artifactType: "nhm2_route_time_worldline/v1",
        certified: true,
        routeModelId: "nhm2_bounded_local_probe_lambda",
        routeParameterName: "lambda",
        progressionSampleCount: 5,
        routeTimeStatus: "bounded_local_segment_certified",
      }),
    );
    expect(artifact.coordinateTimeSummary.end).toBeGreaterThan(0);
    expect(artifact.properTimeSummary.end).toBeGreaterThan(0);
    expect(markdown).toContain("NHM2 Route-Time Worldline");
    expect(markdown).toContain("routeModelId | nhm2_bounded_local_probe_lambda");
    expect(markdown).toContain("routeTimeStatus | bounded_local_segment_certified");
    expect(markdown).toContain("not mission-time certified");
    expect(markdown).toContain("not route ETA to a real target");
  });

  it("builds and renders a bounded NHM2 mission-time estimator artifact without widening speed or viability claims", () => {
    const artifact = buildNhm2MissionTimeEstimatorArtifact({
      generatedOn: "2026-04-02",
      missionTimeEstimator: makeWarpMissionTimeEstimatorFixture(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
      sourceRouteTimeArtifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
    });
    const markdown = renderNhm2MissionTimeEstimatorMarkdown(artifact);

    expect(artifact).toEqual(
      expect.objectContaining({
        artifactType: "nhm2_mission_time_estimator/v1",
        certified: true,
        estimatorModelId: "nhm2_repeated_local_probe_segment_estimator",
        targetId: "alpha-cen-a",
        targetName: "Alpha Centauri A",
        targetFrame: "heliocentric-icrs",
        routeTimeStatus: "bounded_local_segment_certified",
      }),
    );
    expect(artifact.coordinateTimeEstimate.seconds).toBeGreaterThan(0);
    expect(artifact.properTimeEstimate.seconds).toBeGreaterThan(0);
    expect(markdown).toContain("NHM2 Mission-Time Estimator");
    expect(markdown).toContain(
      "estimatorModelId | nhm2_repeated_local_probe_segment_estimator",
    );
    expect(markdown).toContain("targetId | alpha-cen-a");
    expect(markdown).toContain("routeTimeStatus | bounded_local_segment_certified");
    expect(markdown).toContain("not max-speed certified");
    expect(markdown).toContain("not viability-promotion evidence");
  });

  it("builds and renders a certified bounded NHM2 cruise-envelope artifact without promoting vmax or viability claims", () => {
    const artifact = buildNhm2CruiseEnvelopeArtifact({
      generatedOn: "2026-04-02",
      cruiseEnvelope: makeWarpCruiseEnvelopeFixture(),
      sourceAuditArtifactPath:
        "artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json",
      sourceCruisePreflightArtifactPath:
        "artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json",
      sourceRouteTimeArtifactPath:
        "artifacts/research/full-solve/nhm2-route-time-worldline-latest.json",
      sourceMissionTimeEstimatorArtifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json",
      sourceMissionTimeComparisonArtifactPath:
        "artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json",
    });
    const markdown = renderNhm2CruiseEnvelopeMarkdown(artifact);

    expect(artifact).toEqual(
      expect.objectContaining({
        artifactType: "nhm2_cruise_envelope/v1",
        certified: true,
        cruiseEnvelopeModelId: "nhm2_route_consistent_descriptor_band",
        envelopeQuantityId: "bounded_local_transport_descriptor_norm",
        routeTimeStatus: "bounded_local_segment_certified",
        missionTimeStatus: "bounded_target_coupled_estimate_ready",
      }),
    );
    expect(artifact.admissibleBand.max).toBeGreaterThanOrEqual(
      artifact.admissibleBand.min,
    );
    expect(artifact.representativeValue).toBeGreaterThanOrEqual(
      artifact.admissibleBand.min,
    );
    expect(artifact.representativeValue).toBeLessThanOrEqual(
      artifact.admissibleBand.max,
    );
    expect(markdown).toContain("NHM2 Cruise Envelope");
    expect(markdown).toContain(
      "cruiseEnvelopeModelId | nhm2_route_consistent_descriptor_band",
    );
    expect(markdown).toContain(
      "envelopeQuantityId | bounded_local_transport_descriptor_norm",
    );
    expect(markdown).toContain("comparisonConsistencyStatus |");
    expect(markdown).toContain("not max-speed certified");
    expect(markdown).toContain("not viability-promotion evidence");
  });

  it("keeps invariant_crosscheck empty until explicit comparison products are emitted", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    expect(fixtures.renderTaxonomyArtifact.summary.categoryCounts.invariant_crosscheck).toBe(0);
    expect(fixtures.renderTaxonomyArtifact.notes.join(" ")).toContain("invariant_crosscheck");
  });

  it("keeps diagnostic Lane A entries theta-only after the invariant taxonomy expansion", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const diagnosticEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "diagnostic_lane_a",
    );
    expect(
      diagnosticEntries.every(
        (entry) =>
          entry.fieldId === "trace_check_diagnostic" &&
          entry.quantitySymbol === "theta=-trK",
      ),
    ).toBe(true);
  });

  it("emits beta_magnitude and beta_x as taxonomy-compliant scientific shift field renders", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const shiftFieldEntries = fixtures.shiftGeometryArtifact.renderEntries.filter(
      (entry) =>
        entry.renderCategory === "scientific_3p1_field" &&
        (entry.fieldId === "beta_magnitude" || entry.fieldId === "beta_x"),
    );
    expect(shiftFieldEntries.length).toBeGreaterThanOrEqual(8);
    expect(
      shiftFieldEntries.every(
        (entry) =>
          entry.renderRole === "presentation" &&
          entry.baseImagePolicy === "neutral_field_canvas" &&
          entry.baseImageSource === "none" &&
          entry.inheritsTransportContext === false &&
          entry.laneId === "lane_a_eulerian_comoving_theta_minus_trk",
      ),
    ).toBe(true);
  });

  it("emits beta_direction_xz as a taxonomy-compliant mechanism overlay", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const directionEntries = fixtures.shiftGeometryArtifact.renderEntries.filter(
      (entry) => entry.fieldId === "beta_direction_xz",
    );
    expect(directionEntries.length).toBe(4);
    expect(
      directionEntries.every(
        (entry) =>
          entry.renderCategory === "mechanism_overlay" &&
          entry.renderRole === "overlay" &&
          entry.baseImagePolicy === "field_plus_context_overlay" &&
          entry.baseImageSource === "hull_mask" &&
          entry.inheritsTransportContext === false &&
          Boolean(entry.directionVectorFieldHash) &&
          Boolean(entry.streamSeedHash) &&
          Boolean(entry.streamGeometryHash ?? entry.directionOverlayStatus === "degraded_hull_only"),
      ),
    ).toBe(true);
  });

  it("marks directional overlay cases as distinct when vector hashes differ and image hashes differ", () => {
    const status = evaluateShiftDirectionOverlayCaseDistinctness([
      {
        fieldId: "beta_direction_xz",
        imageHash: "image-a",
        directionVectorFieldHash: "vector-a",
        presentationScalarFieldHash: "scalar-a",
        streamGeometryHash: "geometry-a",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        fieldId: "beta_direction_xz",
        imageHash: "image-b",
        directionVectorFieldHash: "vector-b",
        presentationScalarFieldHash: "scalar-b",
        streamGeometryHash: "geometry-b",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(status.directionOverlayStatus).toBe("available");
    expect(status.directionOverlayCaseDistinctness).toBe("distinct_across_cases");
    expect(status.directionOverlayWarnings).not.toContain("direction_overlay_collapsed_across_cases");
  });

  it("flags directional overlay collapse when image hashes match across distinct vector fields", () => {
    const status = evaluateShiftDirectionOverlayCaseDistinctness([
      {
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        directionVectorFieldHash: "vector-a",
        presentationScalarFieldHash: "scalar-a",
        streamGeometryHash: "geometry-a",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        directionVectorFieldHash: "vector-b",
        presentationScalarFieldHash: "scalar-b",
        streamGeometryHash: "geometry-b",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(status.directionOverlayStatus).toBe("collapsed");
    expect(status.directionOverlayCaseDistinctness).toBe("collapsed_across_cases");
    expect(status.directionOverlayWarnings).toContain("direction_overlay_collapsed_across_cases");
  });

  it("localizes directional overlay collapse to the seed stage when sampled direction hashes differ but seeds do not", () => {
    const comparisons = buildShiftDirectionOverlayPairwiseComparisons([
      {
        caseId: "flat_space_zero_theta",
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        presentationScalarFieldHash: "raw-a",
        directionVectorFieldHash: "sampled-a",
        streamSeedHash: "shared-seeds",
        streamGeometryHash: "shared-geometry",
        directionOverlayHash: "shared-overlay",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        caseId: "natario_control",
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        presentationScalarFieldHash: "raw-b",
        directionVectorFieldHash: "sampled-b",
        streamSeedHash: "shared-seeds",
        streamGeometryHash: "shared-geometry",
        directionOverlayHash: "shared-overlay",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]?.collapseStage).toBe("stream_seed_generation");
  });

  it("does not flag directional collapse when the sampled x-z vector field is genuinely identical", () => {
    const status = evaluateShiftDirectionOverlayCaseDistinctness([
      {
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        directionVectorFieldHash: "vector-shared",
        presentationScalarFieldHash: "upstream-a",
        streamGeometryHash: "geometry-shared",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        directionVectorFieldHash: "vector-shared",
        presentationScalarFieldHash: "upstream-b",
        streamGeometryHash: "geometry-shared",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(status.directionOverlayStatus).toBe("available");
    expect(status.directionOverlayCaseDistinctness).toBe("mixed");
    expect(status.directionOverlayWarnings).not.toContain("direction_overlay_collapsed_across_cases");
  });

  it("treats identical final images as genuine when the sampled overlay field matches even if raw slices differ", () => {
    const comparisons = buildShiftDirectionOverlayPairwiseComparisons([
      {
        caseId: "flat_space_zero_theta",
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        presentationScalarFieldHash: "raw-a",
        directionVectorFieldHash: "sampled-shared",
        streamSeedHash: "shared-seeds",
        streamGeometryHash: "shared-geometry",
        directionOverlayHash: "shared-overlay",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        caseId: "natario_control",
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        presentationScalarFieldHash: "raw-b",
        directionVectorFieldHash: "sampled-shared",
        streamSeedHash: "shared-seeds",
        streamGeometryHash: "shared-geometry",
        directionOverlayHash: "shared-overlay",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]?.collapseStage).toBe("genuinely_identical_sampled_direction_field");
    expect(comparisons[0]?.presentationScalarHashesDiffer).toBe(true);
    expect(comparisons[0]?.internalVarianceStatus).toBe("not_applicable");
  });

  it("normalizes intermediate seed and geometry variance when the sampled overlay field and final image already match", () => {
    const comparisons = buildShiftDirectionOverlayPairwiseComparisons([
      {
        caseId: "flat_space_zero_theta",
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        presentationScalarFieldHash: "raw-a",
        directionVectorFieldHash: "sampled-shared",
        streamSeedHash: "seed-a",
        streamGeometryHash: "geometry-a",
        directionOverlayHash: "overlay-a",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        caseId: "natario_control",
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        presentationScalarFieldHash: "raw-b",
        directionVectorFieldHash: "sampled-shared",
        streamSeedHash: "seed-b",
        streamGeometryHash: "geometry-b",
        directionOverlayHash: "overlay-b",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]?.collapseStage).toBe("genuinely_identical_sampled_direction_field");
    expect(comparisons[0]?.internalVarianceStatus).toBe(
      "non_material_after_sampled_field_match",
    );
    expect(comparisons[0]?.note).toContain("normalized_as_non_material");
  });

  it("keeps matched sampled-field internal variance non-blocking in the overlay summary", () => {
    const status = evaluateShiftDirectionOverlayCaseDistinctness([
      {
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        directionVectorFieldHash: "vector-shared",
        presentationScalarFieldHash: "upstream-a",
        streamSeedHash: "seed-a",
        streamGeometryHash: "geometry-a",
        directionOverlayHash: "overlay-a",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
      {
        fieldId: "beta_direction_xz",
        imageHash: "shared-image",
        directionVectorFieldHash: "vector-shared",
        presentationScalarFieldHash: "upstream-b",
        streamSeedHash: "seed-b",
        streamGeometryHash: "geometry-b",
        directionOverlayHash: "overlay-b",
        directionOverlayStatus: "case_specific_streamlines",
        directionOverlayWarnings: [],
      },
    ] as any);
    expect(status.directionOverlayStatus).toBe("available");
    expect(status.directionOverlayCaseDistinctness).toBe("mixed");
    expect(status.directionOverlayWarnings).not.toContain("direction_overlay_collapsed_across_cases");
  });

  it("flags hull-only directional fallback explicitly", () => {
    const status = evaluateShiftDirectionOverlayCaseDistinctness([
      {
        fieldId: "beta_direction_xz",
        imageHash: "hull-only",
        directionVectorFieldHash: "vector-a",
        presentationScalarFieldHash: "scalar-a",
        streamGeometryHash: null,
        directionOverlayStatus: "degraded_hull_only",
        directionOverlayWarnings: [
          "direction_streamline_generation_degraded",
          "direction_overlay_fell_back_to_hull_only",
        ],
      },
    ] as any);
    expect(status.directionOverlayStatus).toBe("degraded");
    expect(status.directionOverlayWarnings).toEqual(
      expect.arrayContaining([
        "direction_streamline_generation_degraded",
        "direction_overlay_fell_back_to_hull_only",
      ]),
    );
  });

  it("emits NHM2 residual-to-control shift entries for Natario and Alcubierre", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const residualEntries = fixtures.shiftGeometryArtifact.renderEntries.filter(
      (entry) => entry.mechanismFamily === "residual_to_control",
    );
    expect(residualEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseId: "nhm2_certified",
          referenceCaseId: "natario_control",
          fieldId: "beta_magnitude",
        }),
        expect.objectContaining({
          caseId: "nhm2_certified",
          referenceCaseId: "natario_control",
          fieldId: "beta_x",
        }),
        expect.objectContaining({
          caseId: "nhm2_certified",
          referenceCaseId: "alcubierre_control",
          fieldId: "beta_magnitude",
        }),
        expect.objectContaining({
          caseId: "nhm2_certified",
          referenceCaseId: "alcubierre_control",
          fieldId: "beta_x",
        }),
      ]),
    );
  });

  it("emits shift entries with required labeling metadata", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const shiftEntries = fixtures.shiftGeometryArtifact.renderEntries;
    expect(shiftEntries.length).toBeGreaterThan(0);
    expect(
      shiftEntries.every(
        (entry) =>
          entry.title &&
          entry.subtitle &&
          entry.quantitySymbol &&
          entry.quantityUnits &&
          entry.observer === "eulerian_n" &&
          entry.foliation === "comoving_cartesian_3p1" &&
          entry.signConvention &&
          entry.laneId === "lane_a_eulerian_comoving_theta_minus_trk" &&
          entry.orientationConventionId === "x_ship_y_port_z_zenith" &&
          entry.baseImagePolicy &&
          entry.baseImageSource,
      ),
    ).toBe(true);
  });

  it("keeps scientific 3+1 field renders out of the transport-context inheritance path", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const fieldEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "scientific_3p1_field",
    );
    expect(fieldEntries.length).toBeGreaterThan(0);
    expect(
      fieldEntries.every(
        (entry) =>
          entry.inheritsTransportContext === false &&
          entry.baseImageSource !== "transport_context" &&
          ["neutral_field_canvas", "field_plus_context_overlay"].includes(
            String(entry.baseImagePolicy),
          ),
      ),
    ).toBe(true);
  });

  it("emits transport context renders as a separate taxonomy category", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const transportEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "transport_context",
    );
    expect(transportEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldId: "transport_context",
          renderRole: "presentation",
          baseImagePolicy: "native_renderer_output",
          baseImageSource: "native_renderer",
          inheritsTransportContext: false,
        }),
      ]),
    );
  });

  it("categorizes comparison cards as comparison_panel renders", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const comparisonEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "comparison_panel",
    );
    expect(comparisonEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldId: "comparison_card", renderRole: "presentation" }),
        expect.objectContaining({
          fieldId: "comparison_overview",
          renderRole: "presentation",
        }),
      ]),
    );
  });

  it("keeps diagnostic Lane A renders tagged as authoritative proof outputs", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const diagnosticEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "diagnostic_lane_a",
    );
    expect(diagnosticEntries.length).toBeGreaterThan(0);
    expect(
      diagnosticEntries.every(
        (entry) =>
          entry.renderRole === "proof" &&
          entry.authoritativeStatus === "primary_authoritative",
      ),
    ).toBe(true);
  });

  it("emits taxonomy-compliant canonical render paths", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    expect(
      fixtures.renderTaxonomyArtifact.renderEntries.every((entry) =>
        /artifacts[\\/]+research[\\/]+full-solve[\\/]+rendered[\\/]+/.test(
          entry.canonicalPath ?? "",
        ),
      ),
    ).toBe(true);
  });

  it("renders taxonomy audits and proof-pack summary with explicit diagnostic vs presentation separation", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const taxonomyMarkdown = renderRenderTaxonomyAuditMarkdown(
      fixtures.renderTaxonomyArtifact,
    );
    const taxonomyMemo = renderRenderTaxonomyStandardMemo(fixtures.renderTaxonomyArtifact);
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.renderTaxonomySummary = {
      authoritativeRenderCategory: "diagnostic_lane_a",
      presentationRenderCategory: "scientific_3p1_field",
      comparisonRenderCategory: "comparison_panel",
      repoOrientationConvention: "x_ship_y_port_z_zenith",
      artifactPath: "artifacts/research/full-solve/render-taxonomy-latest.json",
      reportPath: "docs/audits/research/warp-render-taxonomy-latest.md",
      standardPath: "docs/research/render-taxonomy-and-labeling-standard-2026-03-31.md",
    };
    const proofPackMarkdown = renderMarkdown(payload);
    expect(taxonomyMarkdown).toContain("## Categories");
    expect(taxonomyMarkdown).toContain("diagnostic_lane_a");
    expect(taxonomyMarkdown).toContain("transport_context");
    expect(taxonomyMarkdown).toContain("scientific_3p1_field");
    expect(taxonomyMemo).toContain("diagnostic_lane_a");
    expect(taxonomyMemo).toContain("transport_context");
    expect(taxonomyMemo).toContain("scientific_3p1_field");
    expect(proofPackMarkdown).toContain("## Render Taxonomy");
    expect(proofPackMarkdown).toContain("diagnostic_lane_a");
    expect(proofPackMarkdown).toContain("scientific_3p1_field");
    expect(proofPackMarkdown).toContain("## Presentation Render Layer");
  });

  it("requires overlay inheritance metadata to be explicit when present", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const overlayEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) => entry.renderCategory === "mechanism_overlay",
    );
    expect(overlayEntries.length).toBeGreaterThan(0);
    expect(
      overlayEntries.every(
        (entry) =>
          entry.inheritsTransportContext === false ||
          entry.baseImageSource === "transport_context",
      ),
    ).toBe(true);
  });

  it("keeps shift field frames out of the transport-context inheritance path", async () => {
    const fixtures = await buildRenderTaxonomyFixtures();
    const shiftFieldEntries = fixtures.renderTaxonomyArtifact.renderEntries.filter(
      (entry) =>
        entry.renderCategory === "scientific_3p1_field" &&
        (entry.fieldId === "beta_magnitude" || entry.fieldId === "beta_x"),
    );
    expect(
      shiftFieldEntries.every(
        (entry) =>
          entry.inheritsTransportContext === false &&
          entry.baseImageSource !== "transport_context",
      ),
    ).toBe(true);
  });

  it("flags collapsed OptiX field images when scalar fields differ", () => {
    const issues = evaluateYorkOptixFieldRenderIntegrity({
      caseRole: "canonical_control",
      fieldRenders: [
        {
          presentationFieldId: "longitudinal_signed_strain",
          label: "Longitudinal signed strain",
          formula: "K_xx",
          fieldNature: "signed",
          variant: "main",
          contextRenderView: "transport-3p1",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          authoritativeSource: "snapshot.channel.K_xx",
          presentationFieldSelector: "longitudinal_signed_strain:snapshot.channel.K_xx",
          presentationFieldSelectorHash: "selector-kxx",
          presentationRenderMode: "solve_backed_optix_neutral_field_projection",
          presentationFieldHash: "field-kxx",
          presentationScalarFieldHash: "field-kxx",
          metricVolumeHash: "metric",
          thetaHash: "theta",
          kTraceHash: "ktrace",
          laneAFieldHash: "lane-a",
          optixContextImageHash: null,
          presentationRenderRequestHash: "req-kxx",
          presentationRenderImageHash: "shared-image",
          presentationProjectionRequestHash: "req-kxx",
          presentationProjectionImageHash: "shared-image",
          presentationRenderBackedByAuthoritativeMetric: true,
          imagePath: "kxx.png",
          imageMime: "image/png",
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          dimensions: { width: 10, height: 10 },
          fileSizeBytes: 1000,
          meanIntensity: 0.1,
          nonBackgroundPixelFraction: 0.1,
          contrastStdDev: 0.1,
          warnings: [],
          fieldMin: -1,
          fieldMax: 1,
          fieldAbsMax: 1,
          displayPolicyId: "signed-policy",
          displayRangeMin: -1,
          displayRangeMax: 1,
          displayTransform: "signed_asinh",
          colormapFamily: "diverging_cyan_amber",
          note: null,
          ok: true,
          error: null,
        },
        {
          presentationFieldId: "trace_check",
          label: "Trace check",
          formula: "theta=-trK",
          fieldNature: "signed",
          variant: "main",
          contextRenderView: "transport-3p1",
          baseImagePolicy: "neutral_field_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
          authoritativeSource: "lane_a.theta",
          presentationFieldSelector: "trace_check:lane_a.theta",
          presentationFieldSelectorHash: "selector-theta",
          presentationRenderMode: "solve_backed_optix_neutral_field_projection",
          presentationFieldHash: "field-theta",
          presentationScalarFieldHash: "field-theta",
          metricVolumeHash: "metric",
          thetaHash: "theta",
          kTraceHash: "ktrace",
          laneAFieldHash: "lane-a",
          optixContextImageHash: null,
          presentationRenderRequestHash: "req-theta",
          presentationRenderImageHash: "shared-image",
          presentationProjectionRequestHash: "req-theta",
          presentationProjectionImageHash: "shared-image",
          presentationRenderBackedByAuthoritativeMetric: true,
          imagePath: "theta.png",
          imageMime: "image/png",
          laneId: "lane_a_eulerian_comoving_theta_minus_trk",
          dimensions: { width: 10, height: 10 },
          fileSizeBytes: 1000,
          meanIntensity: 0.1,
          nonBackgroundPixelFraction: 0.1,
          contrastStdDev: 0.1,
          warnings: [],
          fieldMin: -2,
          fieldMax: 2,
          fieldAbsMax: 2,
          displayPolicyId: "trace-policy",
          displayRangeMin: -2,
          displayRangeMax: 2,
          displayTransform: "signed_linear",
          colormapFamily: "diverging_cyan_amber",
          note: null,
          ok: true,
          error: null,
        },
      ] as any,
    });
    expect(issues).toEqual([
      {
        code: "presentation_distinct_fields_collapsed",
        indices: [0, 1],
      },
    ]);
  });

  it("derives nonzero tracefree magnitude from KijKij and K_trace for non-flat fields", () => {
    const field = deriveYorkOptixTracefreeMagnitude({
      channels: {
        KijKij: {
          data: new Float32Array([4, 1.5]),
          min: 1.5,
          max: 4,
        },
        K_trace: {
          data: new Float32Array([3, 1]),
          min: 1,
          max: 3,
        },
      },
    } as any);
    expect(field).not.toBeNull();
    expect(field?.[0]).toBeCloseTo(1, 6);
    expect(field?.[1]).toBeCloseTo(7 / 6, 6);
  });

  it("treats low-contrast but distinct presentation images as advisory-only", () => {
    const warnings = evaluateYorkOptixPresentationImageQuality({
      width: 1280,
      height: 720,
      fileSizeBytes: 90000,
      meanIntensity: 0.04,
      nonBackgroundPixelFraction: 0.06,
      contrastStdDev: 0.03,
    });
    expect(warnings).toContain("presentation_image_low_contrast");
    expect(warnings).not.toContain("presentation_distinct_fields_collapsed");
    expect(warnings).not.toContain("presentation_tracefree_magnitude_zero_unexpected");
  });

  it("does not flag tuned non-flat main Natario fields as low-contrast unnecessarily", () => {
    const warnings = evaluateYorkOptixPresentationImageQuality({
      width: 1280,
      height: 720,
      fileSizeBytes: 90000,
      meanIntensity: 0.025,
      nonBackgroundPixelFraction: 0.046,
      contrastStdDev: 0.029,
      presentationFieldId: "longitudinal_signed_strain",
    });
    expect(warnings).not.toContain("presentation_image_low_contrast");
    expect(warnings).not.toContain("presentation_image_near_uniform");
  });

  it("does not mark dark field renders near-uniform when contrast and support coverage are sufficient", () => {
    const warnings = evaluateYorkOptixPresentationImageQuality({
      width: 1280,
      height: 720,
      fileSizeBytes: 90000,
      meanIntensity: 0.014,
      nonBackgroundPixelFraction: 0.035,
      contrastStdDev: 0.02,
      presentationFieldId: "energy_density",
    });
    expect(warnings).not.toContain("presentation_image_low_contrast");
    expect(warnings).not.toContain("presentation_image_near_uniform");
  });

  it("still allows trace-check to remain advisory when it is physically near-zero", () => {
    const warnings = evaluateYorkOptixPresentationImageQuality({
      width: 1280,
      height: 720,
      fileSizeBytes: 90000,
      meanIntensity: 0.025,
      nonBackgroundPixelFraction: 0.046,
      contrastStdDev: 0.015,
      presentationFieldId: "trace_check",
    });
    expect(warnings).toContain("presentation_image_low_contrast");
  });

  it("derives deterministic NHM2 source redesign specs from the baseline metric ref", () => {
    const baselineRef = buildControlMetricVolumeRef({
      baseUrl: "http://127.0.0.1:5050",
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      dutyFR: 0.0015,
      q: 3,
      gammaGeo: 26,
      gammaVdB: 500,
      zeta: 0.84,
      phase01: 0,
      requireCongruentSolve: true,
      requireNhm2CongruentFullSolve: true,
    });
    const specs = buildNhm2SourceRedesignSpecs({
      baseUrl: "http://127.0.0.1:5050",
      baselineMetricVolumeRef: baselineRef,
    });
    expect(specs).toHaveLength(4);
    expect(specs.map((entry) => entry.redesign_id)).toEqual([
      "nhm2_redesign_signed_shell_bias",
      "nhm2_redesign_coupling_localization",
      "nhm2_redesign_drive_vs_geometry_split",
      "nhm2_redesign_source_profile_simplified_signed",
    ]);
    for (const entry of specs) {
      expect(entry.selectors.sourceRedesignMode).not.toBeNull();
      expect(entry.metricVolumeRef.url).toContain("sourceRedesignMode=");
      expect(entry.metricVolumeRef.url).not.toContain("requireCongruentSolve=1");
      expect(entry.metricVolumeRef.url).not.toContain("requireNhm2CongruentFullSolve=1");
    }
  });

  it("classifies source redesign movement and verdict logic deterministically", () => {
    const movement = classifySourceRedesignMovement({
      redesignId: "nhm2_redesign_signed_shell_bias",
      baselineDistances: { natario: 0.08, alcubierre: 0.24, flat: 0.31 },
      redesignDistances: { natario: 0.09, alcubierre: 0.12, flat: 0.34 },
      baselinePrimaryPixelRms: { natario: 0.003, alcubierre: 0.009, flat: 0.01 },
      redesignPrimaryPixelRms: { natario: 0.004, alcubierre: 0.004, flat: 0.011 },
      baselineSignedLobeSummary: "mixed_or_flat",
      redesignSignedLobeSummary: "fore+/aft-",
      baselineSignCounts: { positive: 8, negative: 8 },
      redesignSignCounts: { positive: 12, negative: 12 },
      authoritativeMorphologyChanged: true,
      redesignRealizationStatus: "realized_in_lane_a",
    });
    expect(movement.movementClass).toBe("toward_alcubierre");
    expect(movement.raw_control_distance_delta.toward_alcubierre).toBeCloseTo(0.12);

    const verdict = decideNhm2SourceCouplingRedesignVerdict({
      redesignComparisons: [
        {
          redesign_id: "nhm2_redesign_signed_shell_bias",
          case_id: "nhm2_redesign_signed_shell_bias",
          label: "signed shell bias",
          hypothesis: "bias",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-a",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?sourceRedesignMode=signed_shell_bias",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: "signed_shell_bias",
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          redesignToggles: { source_redesign_mode: "signed_shell_bias" },
          derivationNote: "derived",
          caseViews: [
            {
              case_id: "nhm2_redesign_signed_shell_bias",
              view_id: "york-surface-3p1",
              policy_id: "comparison_fixed_raw_global",
              data_mode: "raw_theta",
              theta_min: -1,
              theta_max: 1,
              theta_abs_max: 1,
              global_abs_max: 1,
              normalization_gain: 1,
              color_scale_mode: "signed_diverging_global",
              clipping_applied: false,
              sample_count: 16,
              positive_count: 8,
              negative_count: 8,
              near_zero_count: 0,
              signed_lobe_summary: "fore+/aft-",
              support_overlap_pct: 0.7,
              slice_hash: "slice-a",
              source_slice_hash: "slice-a",
              display_buffer_hash: "display-a",
              color_buffer_hash: "color-a",
              png_path: "a.png",
              png_hash: "png-a",
            },
          ],
          comparison_to_nhm2: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-nhm2_certified",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "nhm2_certified",
            raw_control_distance: 0.04,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_natario: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-natario_control",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "natario_control",
            raw_control_distance: 0.11,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_alcubierre: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-alcubierre_control",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "alcubierre_control",
            raw_control_distance: 0.1,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_flat: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-flat_space_zero_theta",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "flat_space_zero_theta",
            raw_control_distance: 0.33,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          raw_control_distance_delta: {
            toward_natario: -0.01,
            toward_alcubierre: 0.12,
            toward_flat: -0.02,
          },
          pixel_rms_delta: {
            toward_natario: -0.001,
            toward_alcubierre: 0.005,
            toward_flat: -0.001,
          },
          sign_count_delta: { positive: 4, negative: 4 },
          signed_lobe_summary_change: "mixed_or_flat -> fore+/aft-",
          topology_view_delta: 0.02,
          authoritativeMorphologyChanged: true,
          movementBasis: "authoritative_lane_pairwise_metric",
          redesignRealizationStatus: "realized_in_lane_a",
          dropStage: null,
          realizationNote: "This redesign changes the authoritative Lane A output.",
          realizationTrace: {
            primary_view_id: "york-surface-3p1",
            inputSelectorHash: "input-a",
            baselineInputSelectorHash: "input-b",
            normalizedSelectorHash: "norm-a",
            baselineNormalizedSelectorHash: "norm-b",
            promotedProfileHash: "profile-a",
            baselinePromotedProfileHash: "profile-b",
            brickRequestHash: "request-a",
            baselineBrickRequestHash: "request-b",
            metricVolumeHash: "metric-a",
            baselineMetricVolumeHash: "metric-b",
            laneASliceHash: "slice-a",
            baselineLaneASliceHash: "slice-b",
            laneADisplayHash: "display-a",
            baselineLaneADisplayHash: "display-b",
            laneAColorHash: "color-a",
            baselineLaneAColorHash: "color-b",
            selectorChanged: true,
            normalizedSelectorChanged: true,
            promotedProfileChanged: true,
            brickRequestChanged: true,
            metricVolumeChanged: true,
            laneASliceChanged: true,
            laneADisplayChanged: true,
            laneAColorChanged: true,
          },
          authoritativeComparisonSummary: [],
          movementClass: "toward_alcubierre",
          movementMagnitude: 0.12,
          dominantShift: "toward Alcubierre",
          likelySubsystemImplication: "signed bias helps",
        },
      ] as any,
    });
    expect(verdict.redesignVerdict).toBe(
      "source_coupling_redesign_finds_boundary_case",
    );
    expect(verdict.authoritativeMorphologyChangeObserved).toBe("yes");
    expect(verdict.bestRedesignVariant).toBe("nhm2_redesign_signed_shell_bias");
    expect(verdict.alcubierreLikeTransitionObserved).toBe("yes");
  });

  it("suppresses redesign movement when the authoritative Lane A output is unchanged", () => {
    const movement = classifySourceRedesignMovement({
      redesignId: "nhm2_redesign_drive_vs_geometry_split",
      baselineDistances: { natario: 0.08, alcubierre: 0.24, flat: 0.31 },
      redesignDistances: { natario: 0.07, alcubierre: 0.15, flat: 0.27 },
      baselinePrimaryPixelRms: { natario: 0.003, alcubierre: 0.009, flat: 0.01 },
      redesignPrimaryPixelRms: { natario: 0.002, alcubierre: 0.004, flat: 0.008 },
      baselineSignedLobeSummary: "mixed_or_flat",
      redesignSignedLobeSummary: "fore+/aft-",
      baselineSignCounts: { positive: 8, negative: 8 },
      redesignSignCounts: { positive: 12, negative: 12 },
      authoritativeMorphologyChanged: false,
      redesignRealizationStatus: "metric_volume_changed_but_lane_a_unchanged",
    });
    expect(movement.movementClass).toBe("no_authoritative_morphology_change");
    expect(movement.movementMagnitude).toBe(0);
    expect(movement.dominantShift).toContain("declared Lane A render contract did not realize");
    expect(movement.likelySubsystemImplication).toContain("not yet realized");
  });

  it("downgrades redesign verdicts when all variants are no-op in the authoritative lane", () => {
    const verdict = decideNhm2SourceCouplingRedesignVerdict({
      redesignComparisons: [
        {
          redesign_id: "nhm2_redesign_signed_shell_bias",
          case_id: "nhm2_redesign_signed_shell_bias",
          label: "signed shell bias",
          hypothesis: "bias",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-a",
          metricVolumeRefUrl:
            "http://127.0.0.1:5050/api/helix/gr-evolve-brick?sourceRedesignMode=signed_shell_bias",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: "signed_shell_bias",
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          redesignToggles: { source_redesign_mode: "signed_shell_bias" },
          derivationNote: "derived",
          caseViews: [],
          comparison_to_nhm2: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-nhm2_certified",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "nhm2_certified",
            raw_control_distance: 0.04,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_natario: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-natario_control",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "natario_control",
            raw_control_distance: 0.11,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_alcubierre: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-alcubierre_control",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "alcubierre_control",
            raw_control_distance: 0.1,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_flat: {
            pair_id: "nhm2_redesign_signed_shell_bias-vs-flat_space_zero_theta",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "flat_space_zero_theta",
            raw_control_distance: 0.33,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          authoritativeMorphologyChanged: false,
          movementBasis: "authoritative_lane_no_change_gate",
          redesignRealizationStatus: "metric_volume_changed_but_lane_a_unchanged",
          dropStage: "lane_a_surface",
          realizationNote: "The redesign changed the metric volume identity, but Lane A stayed identical.",
          realizationTrace: {
            primary_view_id: "york-surface-3p1",
            inputSelectorHash: "input-a",
            baselineInputSelectorHash: "input-b",
            normalizedSelectorHash: "norm-a",
            baselineNormalizedSelectorHash: "norm-b",
            promotedProfileHash: "profile-a",
            baselinePromotedProfileHash: "profile-b",
            brickRequestHash: "request-a",
            baselineBrickRequestHash: "request-b",
            metricVolumeHash: "metric-a",
            baselineMetricVolumeHash: "metric-b",
            laneASliceHash: "slice-b",
            baselineLaneASliceHash: "slice-b",
            laneADisplayHash: "display-b",
            baselineLaneADisplayHash: "display-b",
            laneAColorHash: "color-b",
            baselineLaneAColorHash: "color-b",
            selectorChanged: true,
            normalizedSelectorChanged: true,
            promotedProfileChanged: true,
            brickRequestChanged: true,
            metricVolumeChanged: true,
            laneASliceChanged: false,
            laneADisplayChanged: false,
            laneAColorChanged: false,
          },
          authoritativeComparisonSummary: [],
          raw_control_distance_delta: {
            toward_natario: -0.01,
            toward_alcubierre: 0.12,
            toward_flat: -0.02,
          },
          pixel_rms_delta: {
            toward_natario: -0.001,
            toward_alcubierre: 0.005,
            toward_flat: -0.001,
          },
          sign_count_delta: { positive: 0, negative: 0 },
          signed_lobe_summary_change: "unchanged",
          topology_view_delta: 0,
          movementClass: "no_authoritative_morphology_change",
          movementMagnitude: 0,
          dominantShift: "Lane A unchanged",
          likelySubsystemImplication: "fix redesign realization",
        },
      ] as any,
    });
    expect(verdict.redesignVerdict).toBe(
      "source_coupling_redesign_partially_realized_inconclusive",
    );
    expect(verdict.authoritativeMorphologyChangeObserved).toBe("no");
    expect(verdict.bestRedesignVariant).toBeNull();
    expect(verdict.strongestMorphologyShift).toBeNull();
    expect(verdict.recommendedNextAction).toContain("geometry-to-Lane-A realization stage");
  });

  it("renders source coupling redesign summaries with the canonical Lane A contract", () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    const calibrationArtifact = {
      comparisonContract: {
        laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        thetaDefinition: "theta=-trK",
        signConvention: "ADM",
        fixedScalePolicy:
          "comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling",
        visualMetricSourceStage: "pre_png_color_buffer",
        outputSize: { width: 96, height: 64 },
        requiredViews: [
          "york-surface-3p1",
          "york-surface-rho-3p1",
          "york-topology-normalized-3p1",
        ],
      },
      nhm2CurrentClass: "natario_like_low_expansion",
      decisionGate: { calibration_verdict: "canonical_controls_validated_nhm2_natario_like" },
    } as any;
    const ablationArtifact = {
      ablationDecision: "no_single_ablation_explains_morphology",
    } as any;
    const parameterSweepArtifact = {
      sweepVerdict: "alcubierre_like_not_found",
    } as any;
    const redesignArtifact = buildNhm2SourceCouplingRedesignArtifact({
      payload,
      canonicalCalibrationArtifact: calibrationArtifact,
      ablationArtifact,
      parameterSweepArtifact,
      sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
      canonicalCalibrationArtifactPath:
        "artifacts/research/full-solve/warp-york-canonical-calibration-latest.json",
      ablationArtifactPath:
        "artifacts/research/full-solve/nhm2-york-ablation-panel-latest.json",
      parameterSweepArtifactPath:
        "artifacts/research/full-solve/nhm2-parameter-sweep-latest.json",
      exportDirectory:
        "artifacts/research/full-solve/rendered-york-redesign-panel-2026-03-31",
      redesignComparisons: [
        {
          redesign_id: "nhm2_redesign_drive_vs_geometry_split",
          case_id: "nhm2_redesign_drive_vs_geometry_split",
          label: "drive split",
          hypothesis: "drive-vs-geometry split",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-drive",
          metricVolumeRefUrl:
            "http://127.0.0.1:5050/api/helix/gr-evolve-brick?sourceRedesignMode=drive_vs_geometry_split",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: "drive_vs_geometry_split",
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          redesignToggles: { source_redesign_mode: "drive_vs_geometry_split" },
          derivationNote: "derived",
          caseViews: [],
          comparison_to_nhm2: {
            pair_id: "nhm2_redesign_drive_vs_geometry_split-vs-nhm2_certified",
            lhs_case_id: "nhm2_redesign_drive_vs_geometry_split",
            rhs_case_id: "nhm2_certified",
            raw_control_distance: 0.05,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_natario: {
            pair_id: "nhm2_redesign_drive_vs_geometry_split-vs-natario_control",
            lhs_case_id: "nhm2_redesign_drive_vs_geometry_split",
            rhs_case_id: "natario_control",
            raw_control_distance: 0.07,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_alcubierre: {
            pair_id: "nhm2_redesign_drive_vs_geometry_split-vs-alcubierre_control",
            lhs_case_id: "nhm2_redesign_drive_vs_geometry_split",
            rhs_case_id: "alcubierre_control",
            raw_control_distance: 0.16,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_flat: {
            pair_id: "nhm2_redesign_drive_vs_geometry_split-vs-flat_space_zero_theta",
            lhs_case_id: "nhm2_redesign_drive_vs_geometry_split",
            rhs_case_id: "flat_space_zero_theta",
            raw_control_distance: 0.42,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          raw_control_distance_delta: {
            toward_natario: 0.01,
            toward_alcubierre: 0.03,
            toward_flat: -0.02,
          },
          pixel_rms_delta: {
            toward_natario: 0.001,
            toward_alcubierre: 0.002,
            toward_flat: -0.001,
          },
          sign_count_delta: { positive: 1, negative: 1 },
          signed_lobe_summary_change: "unchanged",
          topology_view_delta: 0.01,
          authoritativeMorphologyChanged: true,
          movementBasis: "authoritative_lane_pairwise_metric",
          redesignRealizationStatus: "realized_in_lane_a",
          dropStage: null,
          realizationNote: "This redesign changes the authoritative Lane A output.",
          realizationTrace: {
            primary_view_id: "york-surface-3p1",
            inputSelectorHash: "input-drive",
            baselineInputSelectorHash: "input-base",
            normalizedSelectorHash: "norm-drive",
            baselineNormalizedSelectorHash: "norm-base",
            promotedProfileHash: "profile-drive",
            baselinePromotedProfileHash: "profile-base",
            brickRequestHash: "request-drive",
            baselineBrickRequestHash: "request-base",
            metricVolumeHash: "metric-drive",
            baselineMetricVolumeHash: "metric-base",
            laneASliceHash: "slice-drive",
            baselineLaneASliceHash: "slice-base",
            laneADisplayHash: "display-drive",
            baselineLaneADisplayHash: "display-base",
            laneAColorHash: "color-drive",
            baselineLaneAColorHash: "color-base",
            selectorChanged: true,
            normalizedSelectorChanged: true,
            promotedProfileChanged: true,
            brickRequestChanged: true,
            metricVolumeChanged: true,
            laneASliceChanged: true,
            laneADisplayChanged: true,
            laneAColorChanged: true,
          },
          authoritativeComparisonSummary: [],
          movementClass: "toward_alcubierre",
          movementMagnitude: 0.03,
          dominantShift: "toward Alcubierre",
          likelySubsystemImplication: "drive/geometry split matters",
        },
      ] as any,
      redesignVerdict: "source_coupling_redesign_moves_toward_alcubierre_but_not_enough",
      authoritativeMorphologyChangeObserved: "yes",
      bestRedesignVariant: "nhm2_redesign_drive_vs_geometry_split",
      strongestMorphologyShift: {
        redesign_id: "nhm2_redesign_drive_vs_geometry_split",
        movementClass: "toward_alcubierre",
        movementMagnitude: 0.03,
        dominantShift: "toward Alcubierre",
      },
      alcubierreLikeTransitionObserved: "no",
      recommendedNextAction: "bounded structural follow-up",
    });
    const markdown = renderNhm2SourceCouplingRedesignMarkdown(redesignArtifact);
    const memo = renderNhm2SourceCouplingRedesignDecisionMemo(redesignArtifact);
    expect(markdown).toContain("lane_a_eulerian_comoving_theta_minus_trk");
    expect(markdown).toContain("pre_png_color_buffer");
    expect(markdown).toContain("source_coupling_redesign_moves_toward_alcubierre_but_not_enough");
    expect(memo).toContain("ablation");
    expect(memo).toContain("parameter sweep");
    expect(redesignArtifact.notes).toContain("visual_metric_source_stage=pre_png_color_buffer");
  });

  it("formats proof-pack redesign summary honestly when no authoritative Lane A redesign is realized", () => {
    const summary = formatSourceCouplingRedesignProofPackSummary({
      calibrationVerdict: "canonical_controls_validated_nhm2_natario_like",
      nhm2CurrentClass: "natario_like_low_expansion",
      ablationDecision: "no_single_ablation_explains_morphology",
      parameterSweepVerdict: "alcubierre_like_not_found",
      sourceCouplingRedesignArtifact: {
        artifactType: "nhm2_source_coupling_redesign/v1",
        generatedOn: "2026-03-31",
        generatedAt: "2026-03-31T00:00:00.000Z",
        boundaryStatement: "boundary",
        sourceAuditArtifact: "source.json",
        canonicalCalibrationArtifactPath: "calibration.json",
        ablationArtifactPath: "ablation.json",
        parameterSweepArtifactPath: "sweep.json",
        exportDirectory: "rendered",
        comparisonContract: {
          laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
          observer: "eulerian_n",
          foliation: "comoving_cartesian_3p1",
          thetaDefinition: "theta=-trK",
          signConvention: "ADM",
          fixedScalePolicy: "comparison_fixed_raw_global",
          visualMetricSourceStage: "pre_png_color_buffer",
          outputSize: { width: 96, height: 64 },
          requiredViews: [
            "york-surface-3p1",
            "york-surface-rho-3p1",
            "york-topology-normalized-3p1",
          ],
        },
        current_case_id: "nhm2_certified",
        nhm2_current_class: "natario_like_low_expansion",
        authoritativeMorphologyChangeObserved: "no",
        redesignComparisons: [],
        redesignVerdict: "source_coupling_redesign_not_realized_in_authoritative_lane",
        bestRedesignVariant: null,
        strongestMorphologyShift: null,
        alcubierreLikeTransitionObserved: "no",
        recommendedNextAction: "Fix redesign realization/wiring first",
        notes: [],
      },
    } as any);
    expect(summary).toContain(
      "source_coupling_redesign_verdict=source_coupling_redesign_not_realized_in_authoritative_lane",
    );
    expect(summary).toContain("authoritative_morphology_change_observed=no");
    expect(summary).toContain("best_redesign_variant=none");
    expect(summary).toContain("redesign_next_action=fix_redesign_realization_wiring_first");
  });

  it("builds redesign realization artifacts with propagation traces and drop stages", () => {
    const redesignArtifact = {
      artifactType: "nhm2_source_coupling_redesign/v1",
      generatedOn: "2026-03-31",
      generatedAt: "2026-03-31T00:00:00.000Z",
      boundaryStatement: "boundary",
      sourceAuditArtifact: "source.json",
      canonicalCalibrationArtifactPath: "calibration.json",
      ablationArtifactPath: "ablation.json",
      parameterSweepArtifactPath: "sweep.json",
      exportDirectory: "rendered",
      comparisonContract: {
        laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
        observer: "eulerian_n",
        foliation: "comoving_cartesian_3p1",
        thetaDefinition: "theta=-trK",
        signConvention: "ADM",
        fixedScalePolicy: "comparison_fixed_raw_global",
        visualMetricSourceStage: "pre_png_color_buffer",
        outputSize: { width: 96, height: 64 },
        requiredViews: [
          "york-surface-3p1",
          "york-surface-rho-3p1",
          "york-topology-normalized-3p1",
        ],
      },
      current_case_id: "nhm2_certified",
      nhm2_current_class: "natario_like_low_expansion",
      authoritativeMorphologyChangeObserved: "yes",
      redesignComparisons: [
        {
          redesign_id: "nhm2_redesign_signed_shell_bias",
          case_id: "nhm2_redesign_signed_shell_bias",
          label: "signed shell bias",
          hypothesis: "bias",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-a",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?sourceRedesignMode=signed_shell_bias",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: "signed_shell_bias",
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          redesignToggles: { source_redesign_mode: "signed_shell_bias" },
          derivationNote: "derived",
          caseViews: [],
          comparison_to_nhm2: {
            pair_id: "a-vs-nhm2",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "nhm2_certified",
            raw_control_distance: 0.03,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_natario: {
            pair_id: "a-vs-natario",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "natario_control",
            raw_control_distance: 0.06,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_alcubierre: {
            pair_id: "a-vs-alcubierre",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "alcubierre_control",
            raw_control_distance: 0.14,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_flat: {
            pair_id: "a-vs-flat",
            lhs_case_id: "nhm2_redesign_signed_shell_bias",
            rhs_case_id: "flat_space_zero_theta",
            raw_control_distance: 0.2,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          authoritativeMorphologyChanged: true,
          movementBasis: "authoritative_lane_pairwise_metric",
          redesignRealizationStatus: "realized_in_lane_a",
          dropStage: null,
          realizationNote: "realized",
          realizationTrace: {
            primary_view_id: "york-surface-3p1",
            inputSelectorHash: "input-a",
            baselineInputSelectorHash: "input-base",
            normalizedSelectorHash: "norm-a",
            baselineNormalizedSelectorHash: "norm-base",
            promotedProfileHash: "profile-a",
            baselinePromotedProfileHash: "profile-base",
            brickRequestHash: "request-a",
            baselineBrickRequestHash: "request-base",
            metricVolumeHash: "metric-a",
            baselineMetricVolumeHash: "metric-base",
            laneASliceHash: "slice-a",
            baselineLaneASliceHash: "slice-base",
            laneADisplayHash: "display-a",
            baselineLaneADisplayHash: "display-base",
            laneAColorHash: "color-a",
            baselineLaneAColorHash: "color-base",
            selectorChanged: true,
            normalizedSelectorChanged: true,
            promotedProfileChanged: true,
            brickRequestChanged: true,
            metricVolumeChanged: true,
            laneASliceChanged: true,
            laneADisplayChanged: true,
            laneAColorChanged: true,
          },
          authoritativeComparisonSummary: [],
          raw_control_distance_delta: {
            toward_natario: 0.01,
            toward_alcubierre: 0.02,
            toward_flat: -0.01,
          },
          pixel_rms_delta: {
            toward_natario: 0.001,
            toward_alcubierre: 0.002,
            toward_flat: -0.001,
          },
          sign_count_delta: { positive: 1, negative: 1 },
          signed_lobe_summary_change: "changed",
          topology_view_delta: 0.01,
          movementClass: "toward_alcubierre",
          movementMagnitude: 0.02,
          dominantShift: "toward Alcubierre",
          likelySubsystemImplication: "signed bias helps",
        },
        {
          redesign_id: "nhm2_redesign_coupling_localization",
          case_id: "nhm2_redesign_coupling_localization",
          label: "coupling localization",
          hypothesis: "localization",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "hash-b",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?sourceRedesignMode=coupling_localization",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: "coupling_localization",
            sourceReformulationMode: null,
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          redesignToggles: { source_redesign_mode: "coupling_localization" },
          derivationNote: "derived",
          caseViews: [],
          comparison_to_nhm2: {
            pair_id: "b-vs-nhm2",
            lhs_case_id: "nhm2_redesign_coupling_localization",
            rhs_case_id: "nhm2_certified",
            raw_control_distance: 0.01,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_natario: {
            pair_id: "b-vs-natario",
            lhs_case_id: "nhm2_redesign_coupling_localization",
            rhs_case_id: "natario_control",
            raw_control_distance: 0.05,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_alcubierre: {
            pair_id: "b-vs-alcubierre",
            lhs_case_id: "nhm2_redesign_coupling_localization",
            rhs_case_id: "alcubierre_control",
            raw_control_distance: 0.2,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          comparison_to_flat: {
            pair_id: "b-vs-flat",
            lhs_case_id: "nhm2_redesign_coupling_localization",
            rhs_case_id: "flat_space_zero_theta",
            raw_control_distance: 0.3,
            metric_source_stage: "pre_png_color_buffer",
            views: [],
          },
          authoritativeMorphologyChanged: false,
          movementBasis: "authoritative_lane_no_change_gate",
          redesignRealizationStatus: "selector_changed_but_brick_request_unchanged",
          dropStage: "brick_request",
          realizationNote: "The brick request stayed identical.",
          realizationTrace: {
            primary_view_id: "york-surface-3p1",
            inputSelectorHash: "input-b",
            baselineInputSelectorHash: "input-base",
            normalizedSelectorHash: "norm-b",
            baselineNormalizedSelectorHash: "norm-base",
            promotedProfileHash: "profile-b",
            baselinePromotedProfileHash: "profile-base",
            brickRequestHash: "request-base",
            baselineBrickRequestHash: "request-base",
            metricVolumeHash: "metric-base",
            baselineMetricVolumeHash: "metric-base",
            laneASliceHash: "slice-base",
            baselineLaneASliceHash: "slice-base",
            laneADisplayHash: "display-base",
            baselineLaneADisplayHash: "display-base",
            laneAColorHash: "color-base",
            baselineLaneAColorHash: "color-base",
            selectorChanged: true,
            normalizedSelectorChanged: true,
            promotedProfileChanged: false,
            brickRequestChanged: false,
            metricVolumeChanged: false,
            laneASliceChanged: false,
            laneADisplayChanged: false,
            laneAColorChanged: false,
          },
          authoritativeComparisonSummary: [],
          raw_control_distance_delta: {
            toward_natario: 0,
            toward_alcubierre: 0,
            toward_flat: 0,
          },
          pixel_rms_delta: {
            toward_natario: 0,
            toward_alcubierre: 0,
            toward_flat: 0,
          },
          sign_count_delta: { positive: 0, negative: 0 },
          signed_lobe_summary_change: "unchanged",
          topology_view_delta: 0,
          movementClass: "no_authoritative_morphology_change",
          movementMagnitude: 0,
          dominantShift: "Lane A unchanged",
          likelySubsystemImplication: "fix realization first",
        },
      ] as any,
      redesignVerdict: "source_coupling_redesign_partially_realized_inconclusive",
      bestRedesignVariant: "nhm2_redesign_signed_shell_bias",
      strongestMorphologyShift: {
        redesign_id: "nhm2_redesign_signed_shell_bias",
        movementClass: "toward_alcubierre",
        movementMagnitude: 0.02,
        dominantShift: "toward Alcubierre",
      },
      alcubierreLikeTransitionObserved: "no",
      recommendedNextAction: "keep working on realization",
      notes: [],
    } as any;
    const realizationArtifact = buildNhm2SourceCouplingRedesignRealizationArtifact({
      redesignArtifact,
      redesignArtifactPath:
        "artifacts/research/full-solve/nhm2-source-coupling-redesign-latest.json",
    });
    const markdown = renderNhm2SourceCouplingRedesignRealizationMarkdown(
      realizationArtifact,
    );
    const memo = renderNhm2SourceCouplingRedesignRealizationMemo(realizationArtifact);
    expect(realizationArtifact.realizedModes).toEqual([
      "nhm2_redesign_signed_shell_bias",
    ]);
    expect(realizationArtifact.unrealizedModes[0]?.dropStage).toBe("brick_request");
    expect(realizationArtifact.firstDropStage).toBe("brick_request");
    expect(markdown).toContain("brick_request");
    expect(markdown).toContain("inputSelectorHash");
    expect(memo).toContain("bestRealizedVariant");
  });

  it("does not assign reformulation movement when authoritative Lane A is unchanged", () => {
    const result = classifySourceReformulationMovement({
      reformulationId: "nhm2_reform_geometry_source_decoupling",
      baselineDistances: { natario: 0.1, alcubierre: 0.2, flat: 0.3 },
      reformulationDistances: { natario: 0.08, alcubierre: 0.18, flat: 0.28 },
      baselinePrimaryPixelRms: { natario: 0.01, alcubierre: 0.02, flat: 0.03 },
      reformulationPrimaryPixelRms: { natario: 0.009, alcubierre: 0.019, flat: 0.029 },
      baselineSignedLobeSummary: "mixed_or_flat",
      reformulationSignedLobeSummary: "mixed_or_flat",
      baselineSignCounts: { positive: 12, negative: 10 },
      reformulationSignCounts: { positive: 12, negative: 10 },
      authoritativeMorphologyChanged: false,
    });
    expect(result.movementClass).toBe("no_material_change");
    expect(result.movementMagnitude).toBe(0);
    expect(result.dominantShift).toContain("does not change the authoritative Lane A output");
  });

  it("classifies realized reformulations from authoritative Lane A differences", () => {
    const result = classifySourceReformulationMovement({
      reformulationId: "nhm2_reform_fore_aft_antisymmetric_driver",
      baselineDistances: { natario: 0.12, alcubierre: 0.24, flat: 0.18 },
      reformulationDistances: { natario: 0.11, alcubierre: 0.18, flat: 0.2 },
      baselinePrimaryPixelRms: { natario: 0.01, alcubierre: 0.03, flat: 0.02 },
      reformulationPrimaryPixelRms: { natario: 0.009, alcubierre: 0.019, flat: 0.025 },
      baselineSignedLobeSummary: "mixed_or_flat",
      reformulationSignedLobeSummary: "fore+/aft-",
      baselineSignCounts: { positive: 10, negative: 8 },
      reformulationSignCounts: { positive: 14, negative: 12 },
      authoritativeMorphologyChanged: true,
    });
    expect(result.movementClass).toBe("toward_alcubierre");
    expect((result.movementMagnitude ?? 0) > 0).toBe(true);
  });

  it("suppresses best reformulation variant when no realized Lane A reformulation exists", () => {
    const verdict = decideNhm2DeeperReformulationVerdict({
      reformulationComparisons: [
        {
          reformulation_id: "nhm2_reform_volume_driven_signed_source",
          authoritativeMorphologyChanged: false,
          movementClass: "no_material_change",
          movementMagnitude: 0,
          comparison_to_natario: { raw_control_distance: 0.1 },
          comparison_to_alcubierre: { raw_control_distance: 0.2 },
        },
      ] as any,
    });
    expect(verdict.reformulationVerdict).toBe("deeper_reformulation_inconclusive");
    expect(verdict.authoritativeMorphologyChangeObserved).toBe("no");
    expect(verdict.bestReformulationVariant).toBeNull();
  });

  it("keeps the reformulation verdict Natario-locked when realized variants do not move toward Alcubierre", () => {
    const verdict = decideNhm2DeeperReformulationVerdict({
      reformulationComparisons: [
        {
          reformulation_id: "nhm2_reform_shell_to_dual_layer_family",
          authoritativeMorphologyChanged: true,
          movementClass: "toward_flat_or_degenerate",
          movementMagnitude: 0.04,
          dominantShift: "flat collapse",
          comparison_to_natario: { raw_control_distance: 0.11 },
          comparison_to_alcubierre: { raw_control_distance: 0.28 },
        },
      ] as any,
    });
    expect(verdict.reformulationVerdict).toBe("deeper_reformulation_still_natario_locked");
    expect(verdict.bestReformulationVariant).toBe("nhm2_reform_shell_to_dual_layer_family");
    expect(verdict.alcubierreLikeTransitionObserved).toBe("no");
  });

  it("renders reformulation artifacts and memo with aligned summary language", () => {
    const artifact = buildNhm2DeeperReformulationArtifact({
      payload: makeProofPackPayloadForMarkdown() as any,
      canonicalCalibrationArtifact: {
        comparisonContract: {
          laneUsed: "lane_a_eulerian_comoving_theta_minus_trk",
          observer: "eulerian_n",
          foliation: "comoving_cartesian_3p1",
          thetaDefinition: "theta=-trK",
          signConvention: "ADM",
          fixedScalePolicy: "comparison_fixed_raw_global",
          visualMetricSourceStage: "pre_png_color_buffer",
          outputSize: { width: 96, height: 64 },
          requiredViews: [
            "york-surface-3p1",
            "york-surface-rho-3p1",
            "york-topology-normalized-3p1",
          ],
        },
        decisionGate: { calibration_verdict: "canonical_controls_validated_nhm2_natario_like" },
        nhm2CurrentClass: "natario_like_low_expansion",
      } as any,
      sourceCouplingRedesignArtifact: {
        redesignVerdict: "source_coupling_redesign_still_natario_locked",
      } as any,
      sourceAuditArtifactPath: "source.json",
      canonicalCalibrationArtifactPath: "calibration.json",
      redesignArtifactPath: "redesign.json",
      exportDirectory: "rendered",
      reformulationComparisons: [
        {
          reformulation_id: "nhm2_reform_fore_aft_antisymmetric_driver",
          case_id: "nhm2_reform_fore_aft_antisymmetric_driver",
          label: "antisymmetric driver",
          hypothesis: "driver hypothesis",
          metricT00Ref: "warp.metric.T00.natario_sdf.shift",
          metricT00Source: "metric",
          metricRefHash: "metric-hash",
          metricVolumeRefUrl: "http://127.0.0.1:5050/api/helix/gr-evolve-brick?sourceReformulationMode=fore_aft_antisymmetric_driver",
          sourceSelectors: {
            metricT00Ref: "warp.metric.T00.natario_sdf.shift",
            metricT00Source: "metric",
            warpFieldType: "natario_sdf",
            sourceRedesignMode: null,
            sourceReformulationMode: "fore_aft_antisymmetric_driver",
            dutyFR: 0.0015,
            q: 3,
            gammaGeo: 26,
            gammaVdB: 500,
            zeta: 0.84,
            phase01: 0,
            requireCongruentSolve: false,
            requireNhm2CongruentFullSolve: false,
          },
          reformulationToggles: { source_reformulation_mode: "fore_aft_antisymmetric_driver" },
          derivationNote: "derived",
          caseViews: [],
          comparison_to_nhm2: { raw_control_distance: 0.03 },
          comparison_to_natario: { raw_control_distance: 0.08 },
          comparison_to_alcubierre: { raw_control_distance: 0.16 },
          comparison_to_flat: { raw_control_distance: 0.2 },
          authoritativeMorphologyChanged: true,
          movementBasis: "authoritative_lane_pairwise_metric",
          reformulationRealizationStatus: "realized_in_lane_a",
          dropStage: null,
          realizationNote: "realized",
          realizationTrace: {
            primary_view_id: "york-surface-3p1",
            inputSelectorHash: "input",
            baselineInputSelectorHash: "base-input",
            normalizedSelectorHash: "norm",
            baselineNormalizedSelectorHash: "base-norm",
            promotedProfileHash: "profile",
            baselinePromotedProfileHash: "base-profile",
            brickRequestHash: "request",
            baselineBrickRequestHash: "base-request",
            metricRefHash: "metric",
            baselineMetricRefHash: "base-metric",
            metricVolumeHash: "metric-volume",
            baselineMetricVolumeHash: "base-metric-volume",
            matterChannelHash: "matter",
            baselineMatterChannelHash: "base-matter",
            geometryChannelHash: "geom",
            baselineGeometryChannelHash: "base-geom",
            laneAFieldHash: "field",
            baselineLaneAFieldHash: "base-field",
            thetaChannelHash: "theta",
            baselineThetaChannelHash: "base-theta",
            kTraceChannelHash: "ktrace",
            baselineKTraceChannelHash: "base-ktrace",
            laneASliceHash: "slice",
            baselineLaneASliceHash: "base-slice",
            laneADisplayHash: "display",
            baselineLaneADisplayHash: "base-display",
            laneAColorHash: "color",
            baselineLaneAColorHash: "base-color",
            selectorChanged: true,
            normalizedSelectorChanged: true,
            promotedProfileChanged: true,
            brickRequestChanged: true,
            metricRefChanged: true,
            metricVolumeChanged: true,
            matterChannelsChanged: true,
            geometryChannelsChanged: true,
            laneAFieldChanged: true,
            thetaChannelChanged: true,
            kTraceChannelChanged: true,
            laneASliceChanged: true,
            laneADisplayChanged: true,
            laneAColorChanged: true,
          },
          authoritativeComparisonSummary: [],
          raw_control_distance_delta: { toward_natario: 0.01, toward_alcubierre: 0.05, toward_flat: -0.02 },
          pixel_rms_delta: { toward_natario: 0.001, toward_alcubierre: 0.004, toward_flat: -0.001 },
          sign_count_delta: { positive: 2, negative: 3 },
          signed_lobe_summary_change: "mixed_or_flat -> fore+/aft-",
          topology_view_delta: 0.02,
          movementClass: "toward_alcubierre",
          movementMagnitude: 0.05,
          dominantShift: "toward Alcubierre",
          likelySubsystemImplication: "antisymmetric driver matters",
        },
      ] as any,
      reformulationVerdict: "deeper_reformulation_moves_toward_alcubierre_but_not_enough",
      authoritativeMorphologyChangeObserved: "yes",
      bestReformulationVariant: "nhm2_reform_fore_aft_antisymmetric_driver",
      strongestMorphologyShift: {
        reformulation_id: "nhm2_reform_fore_aft_antisymmetric_driver",
        movementClass: "toward_alcubierre",
        movementMagnitude: 0.05,
        dominantShift: "toward Alcubierre",
      },
      alcubierreLikeTransitionObserved: "no",
      recommendedNextAction: "iterate on the antisymmetric driver family",
    } as any);
    const summary = formatDeeperReformulationProofPackSummary({
      deeperReformulationArtifact: artifact,
    });
    const markdown = renderNhm2DeeperReformulationMarkdown(artifact);
    const memo = renderNhm2DeeperReformulationDecisionMemo(artifact);
    expect(summary).toContain(
      "deeper_reformulation_verdict=deeper_reformulation_moves_toward_alcubierre_but_not_enough",
    );
    expect(summary).toContain(
      "best_reformulation_variant=nhm2_reform_fore_aft_antisymmetric_driver",
    );
    expect(markdown).toContain("sourceReformulationMode");
    expect(markdown).toContain("pre_png_color_buffer");
    expect(memo).toContain("Realized local source/coupling redesigns remained Natario-like");
  });

  it("falls back to render-contract suspicion when canonical controls fail", async () => {
    const payload = makeProofPackPayloadForMarkdown() as any;
    payload.classificationScoring = {
      distance_to_alcubierre_reference: 0.2,
      distance_to_low_expansion_reference: 0.18,
      reference_margin: 0.02,
      winning_reference: "natario_control",
      margin_sufficient: false,
      winning_reference_within_threshold: true,
      distinct_by_policy: true,
      distinctness_threshold: 0.5,
      margin_min: 0.08,
      reference_match_threshold: 0.5,
      distance_metric: "weighted_normalized_l1",
      normalization_method: "contract-v1",
      to_alcubierre_breakdown: {} as any,
      to_low_expansion_breakdown: {} as any,
    };
    const caseById = new Map(payload.cases.map((entry: any) => [entry.caseId, entry]));
    caseById.get("alcubierre_control").primaryYork = {
      ...caseById.get("alcubierre_control").primaryYork,
      rawExtrema: { min: -1, max: 1, absMax: 1 },
      nearZeroTheta: false,
    };
    caseById.get("alcubierre_control").offlineYorkAudit.alcubierreSignedLobeSummary = {
      foreHalfPositiveTotal: 1,
      foreHalfNegativeTotal: -1,
      aftHalfPositiveTotal: 1,
      aftHalfNegativeTotal: -1,
      signedLobeSummary: "mixed_or_flat",
    };
    caseById.get("natario_control").primaryYork = {
      ...caseById.get("natario_control").primaryYork,
      rawExtrema: { min: -0.4, max: 0.4, absMax: 0.4 },
      nearZeroTheta: false,
    };
    const caseInputs = [
      {
        case_id: "alcubierre_control",
        label: "alc",
        views: [
          {
            view_id: "york-surface-3p1",
            coordinate_mode: "x-z-midplane",
            sampling_choice: "x-z midplane",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-1, -0.5, 0.5, 1]),
            slice_hash: "a-xz",
            raw_extrema: { min: -1, max: 1, absMax: 1 },
            signed_lobe_summary: "mixed_or_flat",
            support_overlap_pct: 0.8,
            near_zero_theta: false,
          },
          {
            view_id: "york-surface-rho-3p1",
            coordinate_mode: "x-rho",
            sampling_choice: "x-rho cylindrical remap",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-1, -0.5, 0.5, 1]),
            slice_hash: "a-rho",
            raw_extrema: { min: -1, max: 1, absMax: 1 },
            signed_lobe_summary: null,
            support_overlap_pct: 0.8,
            near_zero_theta: false,
          },
          {
            view_id: "york-topology-normalized-3p1",
            coordinate_mode: "x-z-midplane",
            sampling_choice: "x-z midplane",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-1, -0.5, 0.5, 1]),
            slice_hash: "a-top",
            raw_extrema: { min: -1, max: 1, absMax: 1 },
            signed_lobe_summary: "mixed_or_flat",
            support_overlap_pct: 0.8,
            near_zero_theta: false,
          },
        ],
      },
      {
        case_id: "natario_control",
        label: "nat",
        views: [
          {
            view_id: "york-surface-3p1",
            coordinate_mode: "x-z-midplane",
            sampling_choice: "x-z midplane",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-0.4, -0.2, 0.2, 0.4]),
            slice_hash: "n-xz",
            raw_extrema: { min: -0.4, max: 0.4, absMax: 0.4 },
            signed_lobe_summary: "fore+/aft-",
            support_overlap_pct: 0.7,
            near_zero_theta: false,
          },
          {
            view_id: "york-surface-rho-3p1",
            coordinate_mode: "x-rho",
            sampling_choice: "x-rho cylindrical remap",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-0.4, -0.2, 0.2, 0.4]),
            slice_hash: "n-rho",
            raw_extrema: { min: -0.4, max: 0.4, absMax: 0.4 },
            signed_lobe_summary: null,
            support_overlap_pct: 0.7,
            near_zero_theta: false,
          },
          {
            view_id: "york-topology-normalized-3p1",
            coordinate_mode: "x-z-midplane",
            sampling_choice: "x-z midplane",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-0.4, -0.2, 0.2, 0.4]),
            slice_hash: "n-top",
            raw_extrema: { min: -0.4, max: 0.4, absMax: 0.4 },
            signed_lobe_summary: "fore+/aft-",
            support_overlap_pct: 0.7,
            near_zero_theta: false,
          },
        ],
      },
      {
        case_id: "nhm2_certified",
        label: "nhm2",
        views: [
          {
            view_id: "york-surface-3p1",
            coordinate_mode: "x-z-midplane",
            sampling_choice: "x-z midplane",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-0.1, -0.05, 0.05, 0.1]),
            slice_hash: "h-xz",
            raw_extrema: { min: -0.1, max: 0.1, absMax: 0.1 },
            signed_lobe_summary: "mixed_or_flat",
            support_overlap_pct: 0.75,
            near_zero_theta: false,
          },
          {
            view_id: "york-surface-rho-3p1",
            coordinate_mode: "x-rho",
            sampling_choice: "x-rho cylindrical remap",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-0.1, -0.05, 0.05, 0.1]),
            slice_hash: "h-rho",
            raw_extrema: { min: -0.1, max: 0.1, absMax: 0.1 },
            signed_lobe_summary: null,
            support_overlap_pct: 0.75,
            near_zero_theta: false,
          },
          {
            view_id: "york-topology-normalized-3p1",
            coordinate_mode: "x-z-midplane",
            sampling_choice: "x-z midplane",
            source_width: 2,
            source_height: 2,
            slice: Float32Array.from([-0.1, -0.05, 0.05, 0.1]),
            slice_hash: "h-top",
            raw_extrema: { min: -0.1, max: 0.1, absMax: 0.1 },
            signed_lobe_summary: "mixed_or_flat",
            support_overlap_pct: 0.75,
            near_zero_theta: false,
          },
        ],
      },
    ] as any;
    const calibrationExportDir = fs.mkdtempSync(path.join(os.tmpdir(), "york-calibration-fail-"));
    const calibrationArtifact = await buildWarpYorkCanonicalCalibrationArtifact({
      payload,
      solveAuthorityAudit: {
        readiness: {
          sourceAuthorityClosed: true,
          timingAuthorityClosed: true,
          brickAuthorityClosed: true,
          snapshotAuthorityClosed: true,
          diagnosticAuthorityClosed: true,
          yorkClassificationReady: true,
          mechanismChainReady: true,
          mechanismClaimBlockReasons: [],
        },
      } as any,
      sourceAuditArtifactPath: "artifacts/research/full-solve/source.json",
      solveAuthorityAuditPath: "artifacts/research/full-solve/solve.json",
      fixedScaleArtifactPath: "artifacts/research/full-solve/fixed-scale.json",
      exportDirectory: calibrationExportDir,
      frameSize: { width: 64, height: 64 },
      caseInputs,
    });
    expect(calibrationArtifact.controlValidation.control_validation_status).toBe("failed");
    expect(calibrationArtifact.decisionGate.calibration_verdict).toBe(
      "render_contract_not_validated",
    );
    expect(calibrationArtifact.decisionGate.recommended_next_debug_target).toBe(
      "render_or_convention_contract",
    );
  });
});

