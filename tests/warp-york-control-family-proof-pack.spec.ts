import { describe, expect, it } from "vitest";
import type { HullScientificRenderView } from "../shared/hull-render-contract";
import {
  buildWarpRodcSnapshot,
  buildCrossLaneComparison,
  buildCaseClassificationFeatures,
  buildControlMetricVolumeRef,
  computeOfflineYorkAudit,
  buildControlDebug,
  decideControlFamilyVerdict,
  evaluateClassificationRobustness,
  evaluateLaneASnapshotIdentity,
  evaluateYorkSliceCongruence,
  evaluateProofPackPreconditions,
  extractThetaSliceXRho,
  extractThetaSliceXZMidplane,
  formatLaneCauseCodeNote,
  hasStrongForeAftYork,
  hasSufficientSignalForAlcubierreControl,
  loadYorkDiagnosticContract,
  readSourceFamilyEvidence,
  renderMarkdown,
  resolveLaneACauseCode,
  scoreNhm2AgainstReferenceControls,
  summarizeLaneAParity,
} from "../scripts/warp-york-control-family-proof-pack";
import {
  YORK_DIAGNOSTIC_ALTERNATE_LANE_ID,
  YORK_DIAGNOSTIC_BASELINE_LANE_ID,
  computeYorkDiagnosticLaneField,
} from "../shared/york-diagnostic-lanes";

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
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK",
        kij_sign_convention: "ADM",
        semantics_closed: true,
        cross_lane_claim_ready: true,
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
        foliation: "comoving_cartesian_3p1",
        theta_definition: "theta=-trK+div(beta/alpha)",
        kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
        semantics_closed: true,
        cross_lane_claim_ready: true,
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
        lane_b_cross_lane_claim_ready: true,
      },
      notes: ["Both lanes calibrate and agree on NHM2 classification."],
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

describe("warp york control-family proof pack", () => {
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
    expect(laneB?.requires_gamma_metric).toBe(true);
    expect(laneB?.semantics_closed).toBe(true);
    expect(laneB?.cross_lane_claim_ready).toBe(true);
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
    expect(comparison.falsifiers.lane_b_cross_lane_claim_ready).toBe(true);
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
        cross_lane_claim_ready: true,
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
          laneBCrossLaneClaimReady: true,
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
        cross_lane_claim_ready: true,
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
          laneBCrossLaneClaimReady: true,
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
        cross_lane_claim_ready: true,
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
    });
    expect(comparison.cross_lane_status).toBe("lane_stable_low_expansion_like");
    expect(comparison.falsifiers.lane_b_semantics_closed).toBe(true);
    expect(comparison.falsifiers.lane_b_cross_lane_claim_ready).toBe(true);
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
});
