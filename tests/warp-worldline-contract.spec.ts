import { describe, expect, it } from "vitest";
import {
  buildWarpWorldlineContractFromState,
  initializePipelineState,
} from "../server/energy-pipeline";
import {
  analyzeWarpWorldlineTransportVariation,
  isCertifiedWarpWorldlineContract,
} from "../shared/contracts/warp-worldline-contract.v1";
import { buildWarpCruiseEnvelopePreflightContractFromWorldline } from "../shared/contracts/warp-cruise-envelope-preflight.v1";
import {
  makeFlatWarpWorldlineSamples,
  makeInformativeWarpWorldlineSamples,
} from "./helpers/warp-worldline-fixture";

const makeSolveBackedTransportSampleFamily = () => ({
  familyId: "nhm2_centerline_shell_cross" as const,
  description:
    "Deterministic bounded local-comoving shell-cross family with centerline and shell-proximal probes.",
  representativeSampleId: "centerline_center" as const,
  ordering: [
    "centerline_aft",
    "centerline_center",
    "centerline_fore",
    "shell_aft",
    "shell_fore",
    "shell_port",
    "shell_starboard",
    "shell_dorsal",
    "shell_ventral",
  ] as const,
  axes: {
    centerline: [1, 0, 0] as [number, number, number],
    portStarboard: [0, 1, 0] as [number, number, number],
    dorsalVentral: [0, 0, 1] as [number, number, number],
  },
  offsets_m: {
    centerline: 2.5,
    shellLongitudinal: 4.9,
    shellTransverse: 1.3,
    shellVertical: 0.9,
    shellClearance: 0.1,
  },
  samples: makeInformativeWarpWorldlineSamples().map((sample) => ({
    sampleId: sample.sampleId,
    sampleRole: sample.sampleRole,
    sourceModel: sample.sourceModel,
    transportProvenance: sample.transportProvenance,
    coordinateTime_s: 0 as const,
    position_m: sample.position_m,
    betaCoord: sample.betaCoord,
  })),
});

describe("warp worldline contract", () => {
  it("builds a deterministic bounded solve-backed NHM2 worldline when the authoritative metric contract is closed", () => {
    const state = initializePipelineState();
    state.driveDir = [1, 0, 0];
    (state as any).warp = {
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      metricT00Contract: {
        status: "ok",
        family: "natario_sdf",
        observer: "eulerian_n",
        normalization: "si_stress",
        unitSystem: "SI",
      },
      metricAdapter: {
        family: "natario_sdf",
        chart: {
          label: "comoving_cartesian",
          coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
          contractStatus: "ok",
        },
        alpha: 1,
        gammaDiag: [1, 1, 1],
      },
      solveBackedTransportSampleFamily: makeSolveBackedTransportSampleFamily(),
    };

    const first = buildWarpWorldlineContractFromState(state);
    const second = buildWarpWorldlineContractFromState(state);

    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(first?.certified).toBe(true);
    expect(first?.sourceSurface.provenanceClass).toBe("solve_backed");
    expect(first?.sampleGeometry.familyId).toBe("nhm2_centerline_shell_cross");
    expect(first?.samples.map((entry) => entry.sampleId)).toEqual([
      "centerline_aft",
      "centerline_center",
      "centerline_fore",
      "shell_aft",
      "shell_fore",
      "shell_port",
      "shell_starboard",
      "shell_dorsal",
      "shell_ventral",
    ]);
    expect(first?.representativeSampleId).toBe("centerline_center");
    expect(first?.sampleCount).toBe(9);
    expect(first?.dtau_dt.representative ?? 0).toBeGreaterThan(0);
    expect(first?.normalizationResidual.maxAbs ?? 1).toBeLessThanOrEqual(1e-9);
    expect(first?.transportVariation.transportVariationStatus).toBe(
      "descriptor_and_dtau_varied",
    );
    expect(first?.sampleFamilyAdequacy).toBe("adequate_for_bounded_cruise_preflight");
    expect(first?.eligibleNextProducts).toEqual(["bounded_cruise_envelope_preflight"]);
    expect(isCertifiedWarpWorldlineContract(first)).toBe(true);
    const preflight = buildWarpCruiseEnvelopePreflightContractFromWorldline(first);
    expect(preflight?.status).toBe("bounded_preflight_ready");
    expect(preflight?.preflightQuantityId).toBe("bounded_local_transport_descriptor_norm");
  });

  it("refuses to emit a worldline for the reference-only shift-lapse family", () => {
    const state = initializePipelineState();
    (state as any).warp = {
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.nhm2_shift_lapse",
      metricT00Contract: {
        status: "ok",
        family: "nhm2_shift_lapse",
        observer: "eulerian_n",
        normalization: "si_stress",
        unitSystem: "SI",
      },
      metricAdapter: {
        family: "nhm2_shift_lapse",
        chart: {
          label: "comoving_cartesian",
          coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
          contractStatus: "ok",
        },
        alpha: 1,
        gammaDiag: [1, 1, 1],
      },
      solveBackedTransportSampleFamily: makeSolveBackedTransportSampleFamily(),
    };

    expect(buildWarpWorldlineContractFromState(state)).toBeNull();
  });

  it("fails closed when the authoritative metric contract is not closed", () => {
    const state = initializePipelineState();
    (state as any).warp = {
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.natario.shift",
      metricT00Contract: {
        status: "unknown",
        family: "natario",
        observer: "eulerian_n",
        normalization: "si_stress",
        unitSystem: "SI",
      },
      metricAdapter: {
        family: "natario",
        chart: {
          label: "comoving_cartesian",
          coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
          contractStatus: "unknown",
        },
        alpha: 1,
        gammaDiag: [1, 1, 1],
      },
      solveBackedTransportSampleFamily: makeSolveBackedTransportSampleFamily(),
    };

    expect(buildWarpWorldlineContractFromState(state)).toBeNull();
  });

  it("fails closed when only amplitude-style transport scalars exist without solve-backed transport samples", () => {
    const state = initializePipelineState();
    (state as any).beta_avg = 0.25;
    (state as any).warp = {
      metricT00Source: "metric",
      metricT00Ref: "warp.metric.T00.natario.shift",
      metricT00Contract: {
        status: "ok",
        family: "natario",
        observer: "eulerian_n",
        normalization: "si_stress",
        unitSystem: "SI",
      },
      metricAdapter: {
        family: "natario",
        chart: {
          label: "comoving_cartesian",
          coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
          contractStatus: "ok",
        },
        alpha: 1,
        gammaDiag: [1, 1, 1],
      },
      betaAvg: 0.25,
      natarioShiftAmplitude: 0.25,
      shiftVectorField: { amplitude: 0.25 },
    };

    expect(buildWarpWorldlineContractFromState(state)).toBeNull();
  });

  it("rejects forged partial contracts that set certified=true without the strict provenance fields", () => {
    expect(
      isCertifiedWarpWorldlineContract({
        contractVersion: "warp_worldline_contract/v1",
        status: "bounded_solve_backed",
        certified: true,
        samples: [{ dtau_dt: 1 }],
        normalizationResidual: { maxAbs: 0 },
      }),
    ).toBe(false);
  });

  it("detects a numerically flat bounded sample family when all solve-backed descriptors are constant", () => {
    const analysis = analyzeWarpWorldlineTransportVariation(makeFlatWarpWorldlineSamples());
    expect(analysis).not.toBeNull();
    expect(analysis?.transportVariation.transportVariationStatus).toBe("numerically_flat");
    expect(analysis?.transportInformativenessStatus).toBe("structurally_valid_but_flat");
    expect(analysis?.sampleFamilyAdequacy).toBe("insufficiently_differentiated");
    expect(analysis?.eligibleNextProducts).toEqual([]);
  });

  it("detects an informative bounded sample family when shell-cross solve-backed variation is present", () => {
    const analysis = analyzeWarpWorldlineTransportVariation(
      makeInformativeWarpWorldlineSamples(),
    );
    expect(analysis).not.toBeNull();
    expect(analysis?.transportVariation.transportVariationStatus).toBe(
      "descriptor_and_dtau_varied",
    );
    expect(analysis?.transportInformativenessStatus).toBe(
      "descriptor_informative_local_only",
    );
    expect(analysis?.sampleFamilyAdequacy).toBe("adequate_for_bounded_cruise_preflight");
    expect(analysis?.eligibleNextProducts).toEqual(["bounded_cruise_envelope_preflight"]);
  });
});
