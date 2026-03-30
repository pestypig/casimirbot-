import { describe, expect, it } from "vitest";
import type { HullScientificRenderView } from "../shared/hull-render-contract";
import {
  buildControlMetricVolumeRef,
  computeOfflineYorkAudit,
  buildControlDebug,
  decideControlFamilyVerdict,
  evaluateYorkSliceCongruence,
  evaluateProofPackPreconditions,
  extractThetaSliceXRho,
  extractThetaSliceXZMidplane,
  readSourceFamilyEvidence,
} from "../scripts/warp-york-control-family-proof-pack";

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
      slice_plane: view === "york-surface-rho-3p1" ? "x-rho" : "x-z-midplane",
      coordinate_mode: view === "york-surface-rho-3p1" ? "x-rho" : "x-z-midplane",
      normalization: "symmetric-about-zero",
      magnitude_mode: view === "york-topology-normalized-3p1" ? "normalized-topology-only" : null,
      surface_height: view === "york-topology-normalized-3p1" ? "theta_norm" : "theta",
      support_overlay: view === "york-shell-map-3p1" ? "hull_sdf+tile_support_mask" : null,
    },
    identity: {
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
    hashes,
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
});

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
      alcStrong: true,
      natLow: true,
      nhm2Low: true,
      nhm2IntendedAlcubierre: false,
    });
    expect(verdict).toBe("inconclusive");
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

  it("selects new verdict code for rho remap mismatch", () => {
    const verdict = decideControlFamilyVerdict({
      preconditions: {
        controlsIndependent: true,
        allRequiredViewsRendered: true,
        provenanceHashesPresent: true,
        runtimeStatusProvenancePresent: true,
        readyForFamilyVerdict: true,
      },
      alcStrong: true,
      natLow: true,
      nhm2Low: true,
      nhm2IntendedAlcubierre: false,
      yorkCongruence: {
        hashMismatch: true,
        rhoRemapMismatch: true,
        nearZeroSuppressionMismatch: false,
        downstreamRenderMismatch: false,
        guardFailures: [],
      },
    });
    expect(verdict).toBe("proof_pack_york_rho_remap_mismatch");
  });
});
